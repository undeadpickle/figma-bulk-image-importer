# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Repository:** https://github.com/undeadpickle/batch-drop

## Build Commands

```bash
npm run build       # Build both plugin code and UI
npm run watch       # Watch mode for development (rebuilds on changes)
```

The build outputs to `dist/` which is referenced by `manifest.json`. After building, reload the plugin in Figma to see changes.

## Architecture

This is a Figma plugin with a dual-process architecture:

### Plugin Code (`src/code.ts`)
- Runs in Figma's sandboxed JavaScript environment
- Has access to Figma API (`figma.*`)
- Cannot access DOM or browser APIs
- Communicates with UI via `figma.ui.postMessage()` and `figma.ui.onmessage`

### UI (`src/ui.html`)
- Runs in an iframe with standard browser APIs
- Handles file selection, reading files into memory, user interaction
- Communicates with plugin via `parent.postMessage({ pluginMessage: {...} }, '*')` and `window.onmessage`
- Single HTML file with inline CSS and JavaScript (no bundling needed)

### Types (`src/types.ts`)
- Shared interfaces between UI and plugin code
- `ImageFile`: file data passed from UI to plugin
- `ImportSettings`: user configuration
- `UIMessage`/`PluginMessage`: message contracts between processes

## Figma Plugin Patterns

**Creating components from images:**
- SVG: `figma.createNodeFromSvg(svgString)` → `figma.createComponentFromNode(frame)`
- Raster: `figma.createImage(uint8Array)` → create frame → set `fills` with `imageHash` → `figma.createComponentFromNode(frame)`

**Combining into variant component set:**
```typescript
figma.combineAsVariants(components, parentNode)
```

**ComponentSet positioning:** After `combineAsVariants()`, explicitly set `componentSet.x` and `componentSet.y` — the parent parameter only sets containment, not position.

**Variant naming format:** `PropertyName=Value` (e.g., `Type=Avatar01`)

**Reserved characters in variant names:** `=`, `,`, `/` — these must be sanitized

**Async image operations:** `image.getSizeAsync()` is async; SVG operations are sync

## Key Constraints

- Max image dimension: 4096px (Figma platform limit)
- File size limit: 5MB per file (enforced in UI)
- Batch processing: yields every 25 files with `setTimeout` to keep UI responsive
- No network access: manifest has `allowedDomains: ["none"]`

## Retina/Resolution Handling

**Detection patterns:** `@2x`, `@3x`, `@4x`, `-2x`, `_2x` (case insensitive)

The `getResolution()` helper in `ui.html` detects resolution from filenames. When multiple resolutions exist in a selection, a resolution picker appears letting users choose which density to import.
