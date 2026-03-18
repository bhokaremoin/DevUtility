#!/bin/bash
set -e

PROJECT_ROOT="/Users/moin/Projects/utilityApp/DevUtility"
WORKSPACE="$PROJECT_ROOT/macos/DevUtility.xcworkspace"
SCHEME="DevUtility-macOS"
ARCHIVE_PATH="$PROJECT_ROOT/build/DevUtility.xcarchive"
EXPORT_PATH="$PROJECT_ROOT/build/export"
VERSION="1.0"
NODE_BINARY="/Users/moin/.nvm/versions/node/v24.13.1/bin/node"

echo "==> Cleaning previous build artifacts..."
rm -rf "$ARCHIVE_PATH" "$EXPORT_PATH"
mkdir -p "$PROJECT_ROOT/build"

echo "==> Archiving..."
xcodebuild archive \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  NODE_BINARY="$NODE_BINARY"

echo "==> Exporting .app..."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$PROJECT_ROOT/macos/ExportOptions.plist" \
  -exportPath "$EXPORT_PATH"

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
