#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE="$PROJECT_ROOT/macos/DevUtility.xcworkspace"
SCHEME="DevUtility-macOS"
ARCHIVE_PATH="$PROJECT_ROOT/build/DevUtility.xcarchive"
EXPORT_PATH="$PROJECT_ROOT/build/export"
VERSION="${VERSION:-1.0}"
NODE_BINARY="$(which node)"

echo "==> Cleaning previous build artifacts..."
rm -rf "$ARCHIVE_PATH" "$EXPORT_PATH"
mkdir -p "$PROJECT_ROOT/build"

echo "==> Archiving..."
xcodebuild archive \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  NODE_BINARY="$NODE_BINARY" \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO

echo "==> Copying .app from archive..."
mkdir -p "$EXPORT_PATH"
cp -R "$ARCHIVE_PATH/Products/Applications/DevUtility.app" "$EXPORT_PATH/DevUtility.app"

echo "==> Stripping quarantine xattrs..."
xattr -cr "$EXPORT_PATH/DevUtility.app"

echo "==> Creating DMG..."
rm -f "$PROJECT_ROOT/build/DevUtility-$VERSION.dmg"

create-dmg \
  --volname "DevUtility" \
  --window-size 600 400 \
  --icon-size 120 \
  --icon "DevUtility.app" 150 185 \
  --app-drop-link 450 185 \
  --hide-extension "DevUtility.app" \
  "$PROJECT_ROOT/build/DevUtility-$VERSION.dmg" \
  "$EXPORT_PATH/DevUtility.app"

echo ""
echo "Done! Artifacts:"
echo "  App:  $EXPORT_PATH/DevUtility.app"
echo "  DMG:  $PROJECT_ROOT/build/DevUtility-$VERSION.dmg"
