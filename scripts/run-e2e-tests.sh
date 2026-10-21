#!/bin/bash
# Builds the E2E configuration and runs the XCUITest suite against it.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RESULTS_DIR="$PROJECT_ROOT/build/e2e"
RESULT_BUNDLE="$RESULTS_DIR/DevUtilityE2E-$(date +%Y%m%d-%H%M%S).xcresult"
INSTALLED_APP_ID="org.reactjs.native.DevUtility"

# The installed DevUtility registers the same global shortcut as the test build;
# while it runs, the test build's shortcut registration fails and hotkey tests break.
installed_app_was_running=$(osascript -e "application id \"$INSTALLED_APP_ID\" is running" 2>/dev/null || echo false)
if [[ "$installed_app_was_running" == "true" ]]; then
  echo "==> Quitting installed DevUtility for the test run (it is reopened afterwards)"
  osascript -e "quit app id \"$INSTALLED_APP_ID\""
fi
reopen_installed_app() {
  if [[ "$installed_app_was_running" == "true" ]]; then
    open -b "$INSTALLED_APP_ID" || true
  fi
}
trap reopen_installed_app EXIT

mkdir -p "$RESULTS_DIR"
xcodebuild test \
  -workspace "$PROJECT_ROOT/macos/DevUtility.xcworkspace" \
  -scheme DevUtility-macOS \
  -configuration E2E \
  -derivedDataPath "$PROJECT_ROOT/build/e2e-derived-data" \
  -resultBundlePath "$RESULT_BUNDLE" \
  -only-testing:DevUtilityE2ETests \
  NODE_BINARY="$(command -v node)" \
  "$@"

echo "Results: $RESULT_BUNDLE"
