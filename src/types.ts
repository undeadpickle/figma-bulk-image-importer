// Shared types between UI and plugin code

export interface ImageFile {
  name: string;
  baseName: string; // filename without extension and @2x/@3x suffix
  type: 'svg' | 'raster';
  mimeType: string;
  data: Uint8Array | string; // Uint8Array for raster, string for SVG
  width?: number;
  height?: number;
}

export interface ImportSettings {
  componentName: string;
  variantPropertyName: string;
  variantValuePrefix: string; // empty means use filename
  layout: 'grid' | 'horizontal' | 'vertical';
  targetWidth: number;
  targetHeight: number;
  useOriginalSize: boolean;
}

export interface PluginMessage {
  type: 'import' | 'cancel' | 'resize';
  files?: ImageFile[];
  settings?: ImportSettings;
}

export interface UIMessage {
  type: 'progress' | 'complete' | 'error' | 'selection-info';
  progress?: number;
  total?: number;
  currentFile?: string;
  failedCount?: number;
  message?: string;
  hasValidParent?: boolean;
  parentName?: string;
}

export const SIZE_PRESETS: { label: string; width: number; height: number }[] = [
  { label: 'Original Size', width: 0, height: 0 },
  { label: '16 × 16', width: 16, height: 16 },
  { label: '24 × 24', width: 24, height: 24 },
  { label: '32 × 32', width: 32, height: 32 },
  { label: '40 × 40', width: 40, height: 40 },
  { label: '48 × 48', width: 48, height: 48 },
  { label: '64 × 64', width: 64, height: 64 },
  { label: '80 × 80', width: 80, height: 80 },
  { label: '96 × 96', width: 96, height: 96 },
  { label: '128 × 128', width: 128, height: 128 },
  { label: '256 × 256', width: 256, height: 256 },
  { label: '512 × 512', width: 512, height: 512 },
  { label: 'Custom', width: -1, height: -1 },
];

export const FILE_TYPE_FILTERS = [
  { label: 'All Supported', value: 'all', accept: '.png,.jpg,.jpeg,.gif,.svg' },
  { label: 'PNG only', value: 'png', accept: '.png' },
  { label: 'JPG only', value: 'jpg', accept: '.jpg,.jpeg' },
  { label: 'GIF only', value: 'gif', accept: '.gif' },
  { label: 'SVG only', value: 'svg', accept: '.svg' },
];

// Limits and thresholds
export const LIMITS = {
  SOFT_FILE_COUNT: 50,      // Warning threshold
  HARD_FILE_COUNT: 200,     // Require confirmation
  MAX_FILE_SIZE_MB: 2,      // Individual file size warning
  BATCH_SIZE: 25,           // Files processed per batch
  MAX_DIMENSION: 4096,      // Figma's max image dimension
};
