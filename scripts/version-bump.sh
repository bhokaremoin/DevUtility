#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$PROJECT_ROOT/macos/DevUtility-macOS/Info.plist"
BUILD_SCRIPT="$PROJECT_ROOT/scripts/build-release.sh"
PACKAGE_JSON="$PROJECT_ROOT/package.json"

# Get current version from package.json
CURRENT=$(node -p "require('$PACKAGE_JSON').version")

echo "Current version: $CURRENT"
read -rp "New version: " NEW_VERSION

if [[ -z "$NEW_VERSION" ]]; then
  echo "Error: No version entered."
  exit 1
fi

# Validate semver format
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+(\.[0-9]+)?$ ]]; then
  echo "Error: Version must be in format x.y or x.y.z"
  exit 1
fi

echo ""
echo "Bumping $CURRENT → $NEW_VERSION in:"

# 1. package.json
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('$PACKAGE_JSON', 'utf8'));
  pkg.version = '$NEW_VERSION';
  fs.writeFileSync('$PACKAGE_JSON', JSON.stringify(pkg, null, 2) + '\n');
"
echo "  ✓ package.json"

# 2. Info.plist (CFBundleShortVersionString)
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $NEW_VERSION" "$PLIST"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_VERSION" "$PLIST"
echo "  ✓ macos/DevUtility-macOS/Info.plist"

# 3. build-release.sh VERSION variable
sed -i '' "s/^VERSION=.*/VERSION=\"$NEW_VERSION\"/" "$BUILD_SCRIPT"
echo "  ✓ scripts/build-release.sh"

echo ""
echo "Done. Run 'npm run build-release' to build and package."
