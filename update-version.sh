#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function update {
    jq --indent 4 "$1" $2 > $2.tmp
    mv $2.tmp $2
}

function print_usage {
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./update-version.sh [VERSION|BUMP_TYPE] [--commit|--release]"
    echo ""
    echo -e "${YELLOW}Bump Types:${NC}"
    echo "  patch       Auto-increment patch (1.1.34 -> 1.1.35) ${GREEN}[default]${NC}"
    echo "  minor       Auto-increment minor (1.1.34 -> 1.2.0)"
    echo "  major       Auto-increment major (1.1.34 -> 2.0.0)"
    echo "  X.Y.Z       Set specific version"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  --commit    Auto-commit and tag after version update"
    echo "  --release   Build, test, commit, tag, and push (GitHub Actions will publish)"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./update-version.sh                    # Patch bump only"
    echo "  ./update-version.sh patch --commit     # Patch + commit + tag"
    echo "  ./update-version.sh minor --release    # Minor + full release"
    echo "  ./update-version.sh 2.0.0 --commit     # Specific version + commit"
    echo ""
}

function increment_version {
    local version=$1
    local bump_type=$2
    
    version=$(echo $version | tr -d '"')
    IFS='.' read -ra VERSION_PARTS <<< "$version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}
    
    case $bump_type in
        major) major=$((major + 1)); minor=0; patch=0 ;;
        minor) minor=$((minor + 1)); patch=0 ;;
        patch|*) patch=$((patch + 1)) ;;
    esac
    
    echo "$major.$minor.$patch"
}

ARG1=${1:-"patch"}
ARG2=${2:-""}

AUTO_COMMIT=false
AUTO_RELEASE=false

if [[ "$ARG2" == "--commit" ]]; then
    AUTO_COMMIT=true
elif [[ "$ARG2" == "--publish" ]] || [[ "$ARG2" == "--release" ]]; then
    AUTO_COMMIT=true
    AUTO_RELEASE=true
fi

CUR_VERSION=$(jq -r ".version" package.json)
echo -e "${BLUE}Current version:${NC} $CUR_VERSION"

if [[ "$ARG1" == "major" ]] || [[ "$ARG1" == "minor" ]] || [[ "$ARG1" == "patch" ]]; then
    NEW_VERSION=$(increment_version "$CUR_VERSION" "$ARG1")
    echo -e "${GREEN}Bumping $ARG1:${NC} $CUR_VERSION -> $NEW_VERSION"
elif [[ "$ARG1" == "help" ]] || [[ "$ARG1" == "--help" ]] || [[ "$ARG1" == "-h" ]]; then
    print_usage
    exit 0
elif [[ "$ARG1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    NEW_VERSION="$ARG1"
    echo -e "${GREEN}Setting version:${NC} $NEW_VERSION"
else
    echo -e "${RED}Error: Invalid version${NC}"
    print_usage
    exit 1
fi

echo ""
if [[ "$AUTO_RELEASE" == true ]]; then
    echo -e "${YELLOW}Will: Update -> Build -> Test -> Commit -> Tag -> Push${NC}"
    echo -e "${YELLOW}(GitHub Actions will handle npm publish)${NC}"
elif [[ "$AUTO_COMMIT" == true ]]; then
    echo -e "${YELLOW}Will: Update -> Commit -> Tag${NC}"
fi

echo -e "${YELLOW}Continue?${NC} (y/N)"
read -r CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted.${NC}"
    exit 0
fi

VERSION="\"$NEW_VERSION\""

echo ""
echo -e "${BLUE}📝 Updating versions...${NC}"
update ".version = $VERSION" package.json

for DIR in "cells" "source" "core"; do
    pushd packages/$DIR > /dev/null
    update ".version = $VERSION" package.json
    popd > /dev/null
done

for DIR in "cells" "source"; do
    pushd packages/$DIR > /dev/null
    update ".dependencies.\"excel-canvas\" = $VERSION" package.json
    popd > /dev/null
done

echo -e "${GREEN}✅ Version updated to $NEW_VERSION${NC}"

# For release: sync README, build, and test BEFORE committing
if [[ "$AUTO_RELEASE" == true ]]; then
    echo ""
    echo -e "${BLUE}📄 Syncing README to packages...${NC}"
    cp README.md packages/core/README.md
    cp README.md packages/cells/README.md
    cp README.md packages/source/README.md

    echo ""
    echo -e "${BLUE}🏗️  Building...${NC}"
    npm run build

    echo ""
    echo -e "${BLUE}🧪 Running tests...${NC}"
    npm run test -- --run
fi

# Commit and tag
if [[ "$AUTO_COMMIT" == true ]]; then
    echo ""
    echo -e "${BLUE}📝 Committing...${NC}"
    git add .
    git commit -m "⬆️ v$NEW_VERSION"
    git tag "v$NEW_VERSION"
    echo -e "${GREEN}✅ Committed and tagged${NC}"
fi

# For release: push to GitHub (Actions will publish to npm)
if [[ "$AUTO_RELEASE" == true ]]; then
    echo ""
    echo -e "${BLUE}🚀 Pushing to GitHub...${NC}"
    git push && git push --tags

    echo ""
    echo -e "${GREEN}✅ Release complete!${NC}"
    echo -e "${YELLOW}GitHub Actions will publish to npm automatically.${NC}"
    echo -e "${YELLOW}Check: https://github.com/vietanhjp93/excel-canvas/actions${NC}"
else
    echo ""
    echo -e "${YELLOW}Next:${NC}"
    if [[ "$AUTO_COMMIT" == true ]]; then
        echo "  git push && git push --tags"
    else
        echo "  git add . && git commit -m 'v$NEW_VERSION'"
        echo "  git tag v$NEW_VERSION"
        echo "  git push && git push --tags"
    fi
fi
