# Changelog

## [1.1.13] - 2025-11-03

### Added
- Export `FullTheme` type for better TypeScript support with custom cell implementations
- Add `measureMultiSelectCellHeight` helper function for calculating multi-select cell heights with bubble wrapping
- Add `isMultiSelectCell` type guard for runtime cell type checking
- New test suite for multi-line text splitting edge cases

### Fixed
- **Critical**: Fix multi-line text splitting bug where long text would display on single line at certain column widths
  - Root cause: `splitMultilineText` was only measuring partial text (`safeLineGuess` chars) but pushing the entire line
  - Impact: Text would overflow column boundaries at specific widths (143-149px in reported case)
  - Solution: Always measure FULL line width before deciding if it fits
- Fix `ctx.font` not being set before `measureText` calls in multi-line splitting, causing incorrect width calculations
- Fix column auto-sizer not detecting width changes due to reference equality check
- Fix `useCallback` missing `enableRowInsertEdge` dependency (ESLint exhaustive-deps)
- Remove unused `rowHeightsRevision` state variable and all setter calls
- Fix variable shadowing: `rows` → `rowCount` in bubble layout calculation
- Fix strict boolean expressions: use explicit null/undefined checks instead of truthy checks
- Fix nullish coalescing: use `??` instead of `||` for better null/undefined handling

### Changed
- **Text cell measurement behavior**: When `allowWrapping` is enabled (default), `measure()` now returns preferred width (200-400px) instead of full text width
  - Prevents columns from auto-expanding to fit all text on one line
  - Allows grid to maintain reasonable column widths while still showing full content via wrapping
  - When `allowWrapping: false`, columns still auto-expand to fit content
- **Auto row height for multi-select cells**: Bubbles now wrap to multiple rows when needed
  - Pre-calculates required rows by simulating bubble layout
  - Properly centers multiple rows of bubbles vertically
  - No row limit - displays as many rows as needed to show all values
- All text-based cells now use `allowWrapping !== false` (defaults to true) instead of `allowWrapping === true`
- URI cell now passes `allowWrapping` parameter to all `drawTextCell` calls (including outline rendering)
- RowIDCell and MarkdownCell now support wrapping with proper measurement

### Performance
- Reduced memory allocations in multi-line text splitting
- Improved rendering performance for cells with wrapping enabled
- Better caching in text measurement utilities

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
