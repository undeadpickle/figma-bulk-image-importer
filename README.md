# Batch Drop

A Figma plugin to import multiple images and automatically create a component set with variants.

## Features

- **Multi-file selection** with drag-and-drop support
- **File type filtering** — import all supported types or filter by PNG, JPG, GIF, or SVG
- **Smart deduplication** — automatically skips @2x/@3x retina variants and duplicate files
- **Layout options** — Grid, Horizontal row, or Vertical column
- **Size presets** — Common sizes (16×16 to 512×512) plus custom dimensions
- **Automatic naming** — Uses filenames as variant values, or custom prefix with auto-incrementing numbers
- **Placement aware** — Creates component inside selected Section/Frame, or at (0,0) on the page
- **Progress tracking** — Visual progress bar during import
- **Batch processing** — Handles large imports without freezing

## Supported Formats

- PNG
- JPG / JPEG
- GIF (static, first frame only)
- SVG

**Note:** Maximum image dimension is 4096×4096 pixels (Figma limit). WEBP is not supported.

## Installation

### Development Setup

1. Clone or download this plugin folder
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. In Figma Desktop:
   - Go to **Plugins** → **Development** → **Import plugin from manifest...**
   - Select the `manifest.json` file from this folder

### Development Mode

For active development with auto-rebuild:
```bash
npm run watch
```

## Usage

1. **Optional:** Select a Section or Frame where you want the component placed
2. Run the plugin from **Plugins** → **Development** → **Batch Drop**
3. **Select images:**
   - Click the drop zone to open file picker, or drag and drop files
   - Use the filter dropdown to import only specific file types
4. **Choose layout:** Grid, Horizontal, or Vertical
5. **Set size:** Pick a preset or enter custom dimensions
6. **Configure component:**
   - **Component name** — Name for the component set (e.g., "Avatars")
   - **Variant property name** — The property name (e.g., "Type", "Avatar", "Icon")
   - **Value prefix** — Optional. If empty, uses filenames. If set, uses prefix + number (e.g., "Avatar-01", "Avatar-02")
7. Click **Import**

## Limits & Recommendations

| Limit | Value | Notes |
|-------|-------|-------|
| Soft limit | 50 files | Shows warning but proceeds |
| Hard limit | 200 files | Import disabled above this |
| Max dimension | 4096px | Figma's image limit |
| Batch size | 25 files | Processed per yield cycle |

For very large imports (100+), consider:
- Splitting into multiple component sets
- Using lower resolution images
- Importing in batches

## File Structure

```
batch-drop/
├── manifest.json      # Figma plugin manifest
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript config
├── src/
│   ├── code.ts        # Main plugin logic (runs in Figma sandbox)
│   ├── ui.html        # Plugin UI (runs in iframe)
│   └── types.ts       # Shared type definitions
├── scripts/
│   └── bundle-ui.js   # UI build script
└── dist/              # Built output (generated)
    ├── code.js
    └── ui.html
```

## How It Works

1. **UI (iframe)** handles file selection, reads files into memory, filters duplicates/@2x/@3x
2. **Plugin code (sandbox)** receives processed files and settings
3. For each file:
   - SVG → `figma.createNodeFromSvg()` → converts to component
   - Raster → `figma.createImage()` → creates frame with image fill → converts to component
4. Components are positioned according to layout
5. `figma.combineAsVariants()` creates the final component set
6. Component set is named and positioned

## Troubleshooting

**"No valid images could be imported"**
- Check that files are valid PNG, JPG, GIF, or SVG
- Ensure files aren't corrupted
- SVGs with certain features (complex gradients) may fail

**Import is slow**
- Large images take longer to process
- Many files will batch process with progress updates
- Consider using smaller images or importing in batches

**Component set not appearing**
- Check the page at (0,0) if no frame was selected
- Check inside the selected Section/Frame

## License

MIT
