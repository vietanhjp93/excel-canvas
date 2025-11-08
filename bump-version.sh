#!/bin/bash

# Quick version bump script
# Usage:
#   ./bump-version.sh         # Auto patch bump
#   ./bump-version.sh minor   # Minor bump  
#   ./bump-version.sh major   # Major bump

set -e

BUMP_TYPE=${1:-"patch"}

echo "🚀 Bumping $BUMP_TYPE version..."

# Run update script with auto-confirmation
echo "y" | ./update-version.sh "$BUMP_TYPE"

# Get new version
NEW_VERSION=$(jq -r ".version" package.json)

echo ""
echo "📦 Building packages..."
npm run build --workspaces

echo ""
echo "📝 Committing changes..."
git add .
git commit -m "v$NEW_VERSION - Bump $BUMP_TYPE version"

echo ""
echo "🏷️  Creating git tag..."
git tag "v$NEW_VERSION"

echo ""
echo "✅ Done! Version bumped to $NEW_VERSION"
echo ""
echo "Next steps:"
echo "  1. Push: git push && git push --tags"
echo "  2. Publish: npm run publish"
