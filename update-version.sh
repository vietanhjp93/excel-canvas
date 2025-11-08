#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function update {
    echo $1 $2
    jq --indent 4 "$1" $2 > $2.tmp
    mv $2.tmp $2
}

function print_usage {
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./update-version.sh [VERSION|BUMP_TYPE]"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./update-version.sh 1.2.3       # Set specific version"
    echo "  ./update-version.sh patch       # Auto-increment patch (1.1.33 -> 1.1.34)"
    echo "  ./update-version.sh minor       # Auto-increment minor (1.1.33 -> 1.2.0)"
    echo "  ./update-version.sh major       # Auto-increment major (1.1.33 -> 2.0.0)"
    echo "  ./update-version.sh             # Auto-increment patch (default)"
    echo ""
}

function increment_version {
    local version=$1
    local bump_type=$2
    
    # Remove quotes if present
    version=$(echo $version | tr -d '"')
    
    # Split version into array
    IFS='.' read -ra VERSION_PARTS <<< "$version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}
    
    case $bump_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch|*)
            patch=$((patch + 1))
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Get current version
CUR_VERSION=$(jq -r ".version" package.json)
echo -e "${GREEN}Current version:${NC} $CUR_VERSION"

# Parse argument
ARG=${1:-"patch"}

# Check if argument is a bump type or specific version
if [[ "$ARG" == "major" ]] || [[ "$ARG" == "minor" ]] || [[ "$ARG" == "patch" ]]; then
    NEW_VERSION=$(increment_version "$CUR_VERSION" "$ARG")
    echo -e "${GREEN}Bumping $ARG version:${NC} $CUR_VERSION -> $NEW_VERSION"
elif [[ "$ARG" == "help" ]] || [[ "$ARG" == "--help" ]] || [[ "$ARG" == "-h" ]]; then
    print_usage
    exit 0
elif [[ "$ARG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    # Specific version provided
    NEW_VERSION="$ARG"
    echo -e "${GREEN}Setting version to:${NC} $NEW_VERSION"
else
    echo -e "${RED}Error: Invalid version format or bump type${NC}"
    echo "Version must be in format: X.Y.Z (e.g., 1.2.3)"
    echo "Or use bump type: major, minor, patch"
    print_usage
    exit 1
fi

# Confirm before proceeding
echo -e "${YELLOW}Update all packages to version $NEW_VERSION?${NC} (y/N)"
read -r CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted.${NC}"
    exit 0
fi

VERSION="\"$NEW_VERSION\""

echo -e "${GREEN}Updating root package.json...${NC}"
update ".version = $VERSION" package.json

echo -e "${GREEN}Updating package versions...${NC}"
for DIR in "cells" "source" "core"
do
    echo "  - packages/$DIR"
    pushd packages/$DIR > /dev/null
    update ".version = $VERSION" package.json
    popd > /dev/null
done

echo -e "${GREEN}Updating dependencies...${NC}"
for DIR in "cells" "source"
do
    echo "  - packages/$DIR dependencies"
    pushd packages/$DIR > /dev/null
    update ".dependencies.\"excel-canvas\" = $VERSION" package.json
    popd > /dev/null
done

echo ""
echo -e "${GREEN}✅ Version updated successfully to $NEW_VERSION${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review changes: git diff"
echo "  2. Commit: git add . && git commit -m 'Bump version to $NEW_VERSION'"
echo "  3. Tag: git tag v$NEW_VERSION"
echo "  4. Build: npm run build --workspaces"
echo "  5. Publish: npm run publish"