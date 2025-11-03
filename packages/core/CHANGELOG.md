# Changelog

## [1.1.16] - 2025-11-03

### Fixed
- Fix text cell measurement: Cap width at 500px only for very long text (>500px)
  - Short text now expands columns to actual width
  - Long text capped at 500px with wrapping
- Fix MarkdownCell, RowIDCell, UriCell measurement with same logic
- Remove debug console.log from text-cell measurement
- Fix column grow distribution with debug logging

### Changed  
- Column auto-sizer: Use 120px initial width for growable columns
- Improved grow distribution algorithm for better space allocation

## [1.1.13] - 2025-11-03

### Fixed
- **Critical**: Fix text wrapping not working at certain column widths (143-149px)
  - Root cause: `splitMultilineText` only measured partial text but pushed entire line
  - Fix: Always measure FULL line before deciding if it fits
- Fix `ctx.font` not set before `measureText` in multi-line splitting
- Fix column auto-sizer not detecting width changes
- Fix multi-select cell editor not using updated values on finish
- Fix ESLint errors: exhaustive-deps, strict-boolean-expressions, no-shadow, no-duplicate-string

### Changed
- Text cell measurement: Cap width at 500px when wrapping enabled (was 200-400px)
  - Prevents columns from expanding too wide
  - Still shows full content via wrapping
- Multi-select bubbles: Wrap to unlimited rows (was limited by available height)
- Column grow: Use smaller initial width (120px) for growable columns

## [1.1.1] - 2025-11-03

### Fixed
- Republish with correct built artifacts for `allowWrapping` default behavior

## [1.1.0] - 2025-11-03

### Changed
- **BREAKING**: `allowWrapping` now defaults to `true` for all text-based cells (TextCell, MarkdownCell, UriCell, RowIDCell)
  - Previous behavior: Text was truncated with ellipsis by default
  - New behavior: Text automatically wraps to multiple lines by default
  - Migration: Set `allowWrapping: false` explicitly if you want the old truncation behavior
  - Works seamlessly with `autoRowHeight: true` for automatic row height adjustment
  - See `/packages/core/ALLOWWRAPPING_DEFAULT_CHANGE.md` for detailed migration guide

### Benefits
- Better UX: Full content displayed without truncation
- Modern behavior: Aligns with contemporary data grid libraries
- Enhanced auto-sizing: Perfect combination with `autoRowHeight` feature

## [1.0.2] - Initial Fork Release

Forked from @glideapps/glide-data-grid and renamed to excel-canvas.
