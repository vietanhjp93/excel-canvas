# Changelog

All notable changes to this project will be documented in this file.

## [1.1.13] - 2025-11-03

### Added
- **MultiSelectCell**: Export `measureMultiSelectCellHeight` helper function for calculating required height with bubble wrapping
- **MultiSelectCell**: Export `isMultiSelectCell` type guard for runtime type checking
- **DatePickerCell**: New `allowWrapping` property to control text wrapping in date display

### Fixed
- **MultiSelectCell**: Fix bubble wrapping in multi-select mode - now properly wraps to multiple rows without row limit
- **MultiSelectCell**: Fix vertical centering of multi-row bubbles
- **MultiSelectCell**: Fix single-select mode rendering to use `drawTextCell` with wrapping support
- **MultiSelectCell**: Fix `onPaste` to only keep first value in single-select mode
- **MultiSelectCell**: Fix `onChange` handler to properly handle both single and multi-select modes
- **MultiSelectCell**: Auto-close editor after selection in single-select mode
- **DatePickerCell**: Add proper wrapping support in `measure()` function

### Changed
- **MultiSelectCell**: Single-select mode now renders as text (with wrapping support) instead of bubbles
- **MultiSelectCell**: Multi-select mode bubbles now wrap to unlimited rows based on content
- **MultiSelectCell**: `allowMultiSelect` defaults to `true` (multi-select mode)
- **MultiSelectCell**: `allowWrapping` defaults to `true` for single-select text display
- Updated dependency: `excel-canvas` to `1.1.13`

### Tests
- Add comprehensive test suite for single-select mode (`multi-select-single-mode.test.tsx`)
- Test single value selection, value replacement, creation mode, and paste behavior

## [1.1.0] - 2025-11-03

### Added
- **MultiSelectCell**: New `allowMultiSelect` property to support single-select mode
  - When `allowMultiSelect: false`, the cell behaves as a single-select dropdown
  - Defaults to `true` for backward compatibility
  - Single-select mode auto-closes after selection
  - Single-select displays as text, multi-select displays as bubbles
  - Works seamlessly with existing `allowCreation` and `allowDuplicates` properties

### Features
- Single-select dropdown functionality using MultiSelectCell
- Auto-close behavior for single-select mode
- Improved rendering for single vs multi-select modes

## [1.0.0] - Initial Release

### Added
- DatePickerCell: Date selection with calendar picker
- DropdownCell: Simple dropdown selection
- MultiSelectCell: Multi-select dropdown with creation support
- RangeCell: Range slider input
- SparklineCell: Inline sparkline charts
- And more cell types...
