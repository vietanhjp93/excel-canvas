# Version Management

This project uses automated version management scripts.

## Quick Start

### Auto-increment and commit (Recommended)

```bash
# Patch bump (1.1.34 -> 1.1.35) - auto commit + tag
npm run bump

# Minor bump (1.1.34 -> 1.2.0) - auto commit + tag  
npm run bump:minor

# Major bump (1.1.34 -> 2.0.0) - auto commit + tag
npm run bump:major
```

### Manual version update only

```bash
# Patch bump (1.1.34 -> 1.1.35)
npm run version:patch

# Minor bump (1.1.34 -> 1.2.0)
npm run version:minor

# Major bump (1.1.34 -> 2.0.0)
npm run version:major

# Set specific version
npm run version 1.2.3
```

## Scripts Available

### `npm run bump` (Automated)
- Auto-increments patch version
- Updates all package.json files
- Builds all packages
- Commits changes
- Creates git tag
- **Does NOT push or publish**

### `npm run version` (Manual)
- Updates version in all package.json files
- Requires confirmation
- Does not commit/tag/build

## Full Release Workflow

```bash
# 1. Bump version (auto-increment + commit + tag)
npm run bump

# 2. Push to remote
git push && git push --tags

# 3. Build and publish to npm
npm run publish
```

## Version Bump Types

- **patch** (1.1.34 -> 1.1.35): Bug fixes, minor improvements
- **minor** (1.1.34 -> 1.2.0): New features, backward compatible
- **major** (1.1.34 -> 2.0.0): Breaking changes

## What Gets Updated

All scripts update:
- Root `package.json`
- `packages/core/package.json`
- `packages/cells/package.json`
- `packages/source/package.json`
- Dependencies in cells and source packages

## Examples

```bash
# Quick patch release
npm run bump
git push && git push --tags
npm run publish

# Minor version release
npm run bump:minor
git push && git push --tags
npm run publish

# Manual version setting
npm run version 2.0.0
git add .
git commit -m "v2.0.0 - Major release"
git tag v2.0.0
npm run build --workspaces
npm run publish
```
