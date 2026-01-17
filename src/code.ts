import { ImageFile, ImportSettings, UIMessage, LIMITS } from './types';

// Show UI
figma.showUI(__html__, { 
  width: 400, 
  height: 560,
  themeColors: true 
});

// Check current selection for valid parent
function getTargetParent(): BaseNode & ChildrenMixin {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 1) {
    const node = selection[0];
    // Check if it's a section or frame (artboard)
    if (node.type === 'SECTION' || node.type === 'FRAME') {
      return node as BaseNode & ChildrenMixin;
    }
  }
  
  return figma.currentPage;
}

// Send selection info to UI on startup
function sendSelectionInfo() {
  const parent = getTargetParent();
  const isPage = parent.type === 'PAGE';
  
  const msg: UIMessage = {
    type: 'selection-info',
    hasValidParent: !isPage,
    parentName: isPage ? undefined : parent.name
  };
  
  figma.ui.postMessage(msg);
}

// Initial selection info
sendSelectionInfo();

// Listen for selection changes
figma.on('selectionchange', sendSelectionInfo);

// Calculate grid layout positions
function calculateGridPositions(
  count: number, 
  itemWidth: number, 
  itemHeight: number, 
  spacing: number = 20
): { x: number; y: number }[] {
  const columns = Math.ceil(Math.sqrt(count));
  const positions: { x: number; y: number }[] = [];
  
  for (let i = 0; i < count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    positions.push({
      x: col * (itemWidth + spacing),
      y: row * (itemHeight + spacing)
    });
  }
  
  return positions;
}

// Calculate row/column layout positions
function calculateLinearPositions(
  count: number,
  itemWidth: number,
  itemHeight: number,
  direction: 'horizontal' | 'vertical',
  spacing: number = 20
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  
  for (let i = 0; i < count; i++) {
    if (direction === 'horizontal') {
      positions.push({ x: i * (itemWidth + spacing), y: 0 });
    } else {
      positions.push({ x: 0, y: i * (itemHeight + spacing) });
    }
  }
  
  return positions;
}

// Create a component from an SVG
function createSvgComponent(
  file: ImageFile,
  variantName: string,
  targetWidth: number,
  targetHeight: number,
  useOriginalSize: boolean
): ComponentNode {
  // Create frame from SVG
  let svgFrame: FrameNode;
  try {
    svgFrame = figma.createNodeFromSvg(file.data as string);
  } catch (err) {
    throw new Error(`Invalid SVG: ${file.name} - The file may be malformed or contain unsupported elements`);
  }

  // Resize if needed
  if (!useOriginalSize && targetWidth > 0 && targetHeight > 0) {
    const scaleX = targetWidth / svgFrame.width;
    const scaleY = targetHeight / svgFrame.height;
    const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio
    svgFrame.rescale(scale);
  }

  // Convert frame to component
  const component = figma.createComponentFromNode(svgFrame);
  component.name = variantName;

  return component;
}

// Create a component from a raster image
async function createRasterComponent(
  file: ImageFile,
  variantName: string,
  targetWidth: number,
  targetHeight: number,
  useOriginalSize: boolean
): Promise<ComponentNode> {
  // Create image from bytes
  const image = figma.createImage(file.data as Uint8Array);
  const { width, height } = await image.getSizeAsync();
  
  // Calculate dimensions
  let finalWidth = width;
  let finalHeight = height;
  
  if (!useOriginalSize && targetWidth > 0 && targetHeight > 0) {
    const scaleX = targetWidth / width;
    const scaleY = targetHeight / height;
    const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio
    finalWidth = width * scale;
    finalHeight = height * scale;
  }
  
  // Create a frame to hold the image
  const frame = figma.createFrame();
  frame.resize(finalWidth, finalHeight);
  frame.fills = [{
    type: 'IMAGE',
    imageHash: image.hash,
    scaleMode: 'FILL'
  }];
  
  // Convert to component
  const component = figma.createComponentFromNode(frame);
  component.name = variantName;
  
  return component;
}

// Process all files and create component set
async function processImport(files: ImageFile[], settings: ImportSettings) {
  const targetParent = getTargetParent();
  const isPage = targetParent.type === 'PAGE';
  
  // Determine placement position
  let baseX = 0;
  let baseY = 0;
  
  if (!isPage) {
    // Place inside the selected section/frame
    baseX = 100;
    baseY = 100;
  }
  
  const components: ComponentNode[] = [];
  const total = files.length;
  let failedCount = 0;

  // Process in batches
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Send progress update
    const progressMsg: UIMessage = {
      type: 'progress',
      progress: i + 1,
      total,
      currentFile: file.name,
      failedCount
    };
    figma.ui.postMessage(progressMsg);
    
    // Determine variant value
    let variantValue: string;
    if (settings.variantValuePrefix) {
      // Use prefix with incrementing number
      const paddedNum = String(i + 1).padStart(2, '0');
      variantValue = `${settings.variantValuePrefix}${paddedNum}`;
    } else {
      // Use filename as variant value (sanitize reserved characters)
      variantValue = file.baseName.replace(/[=,\/]/g, '-');
    }
    
    // Format: PropertyName=Value
    const variantName = `${settings.variantPropertyName}=${variantValue}`;
    
    try {
      let component: ComponentNode;
      
      if (file.type === 'svg') {
        component = createSvgComponent(
          file,
          variantName,
          settings.targetWidth,
          settings.targetHeight,
          settings.useOriginalSize
        );
      } else {
        component = await createRasterComponent(
          file,
          variantName,
          settings.targetWidth,
          settings.targetHeight,
          settings.useOriginalSize
        );
      }
      
      components.push(component);
      
      // Yield to UI every batch to keep responsive
      if ((i + 1) % LIMITS.BATCH_SIZE === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
      failedCount++;
      // Continue with other files
    }
  }
  
  if (components.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'No valid images could be imported.'
    } as UIMessage);
    return;
  }
  
  // Calculate positions based on layout
  const sampleWidth = components[0].width;
  const sampleHeight = components[0].height;
  
  let positions: { x: number; y: number }[];
  
  switch (settings.layout) {
    case 'horizontal':
      positions = calculateLinearPositions(
        components.length, 
        sampleWidth, 
        sampleHeight, 
        'horizontal'
      );
      break;
    case 'vertical':
      positions = calculateLinearPositions(
        components.length, 
        sampleWidth, 
        sampleHeight, 
        'vertical'
      );
      break;
    case 'grid':
    default:
      positions = calculateGridPositions(
        components.length, 
        sampleWidth, 
        sampleHeight
      );
  }
  
  // Position components
  components.forEach((comp, idx) => {
    comp.x = baseX + positions[idx].x;
    comp.y = baseY + positions[idx].y;
  });
  
  // Combine as variants to create component set
  const componentSet = figma.combineAsVariants(components, targetParent);
  componentSet.name = settings.componentName;
  
  // If placed on page at 0,0, move the component set
  if (isPage) {
    componentSet.x = 0;
    componentSet.y = 0;
  }
  
  // Select the new component set
  figma.currentPage.selection = [componentSet];
  figma.viewport.scrollAndZoomIntoView([componentSet]);
  
  // Send completion message
  let completionText = `Created "${settings.componentName}" with ${components.length} variant${components.length !== 1 ? 's' : ''}.`;
  if (failedCount > 0) {
    completionText += ` (${failedCount} file${failedCount !== 1 ? 's' : ''} failed)`;
  }
  const completeMsg: UIMessage = {
    type: 'complete',
    message: completionText
  };
  figma.ui.postMessage(completeMsg);
}

// Handle messages from UI
figma.ui.onmessage = async (msg: any) => {
  if (msg.type === 'import') {
    const { files, settings } = msg as { files: ImageFile[]; settings: ImportSettings };
    
    try {
      await processImport(files, settings);
    } catch (error) {
      console.error('Import failed:', error);
      figma.ui.postMessage({
        type: 'error',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      } as UIMessage);
    }
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
