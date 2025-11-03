# Changelog

All notable changes to this project will be documented in this file.

## [1.1.16] - 2025-11-03

### Fixed
- Fix MultiSelectCell editor to use updated cell values when finishing edit
  - Now correctly passes updated values in `onFinishedEditing` callback
  - Fixes issue where pressing Enter/Tab would save old values

### Changed
- Updated dependency: `excel-canvas` to `1.1.16`

## [1.1.13] - 2025-11-03

### Fixed
- **MultiSelectCell**: Fix editor not using updated values on finish (enter/tab key)
- **MultiSelectCell**: Fix bubble wrapping - now wraps to unlimited rows
- **MultiSelectCell**: Fix vertical centering of multi-row bubbles
- **MultiSelectCell**: Fix single-select mode to render as text with wrapping
- **DatePickerCell**: Add wrapping support in measure function

### Changed
- **MultiSelectCell**: Single-select renders as text, multi-select as bubbles
- Updated dependency: `excel-canvas` to `1.1.13`

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
