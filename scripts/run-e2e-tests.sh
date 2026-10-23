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

# The tests overwrite the pasteboard. Put the developer's text back before the installed app
# reopens, or its first poll would capture whatever test text was left into the real history.
# pbpaste prints nothing for non-text content; restoring that empty text still clears the
# leftover, and the app ignores an empty pasteboard.
saved_pasteboard="$(mktemp)"
pbpaste > "$saved_pasteboard" 2>/dev/null || true

restore_developer_environment() {
  pbcopy < "$saved_pasteboard" || true
  rm -f "$saved_pasteboard"
  if [[ "$installed_app_was_running" == "true" ]]; then
    open -b "$INSTALLED_APP_ID" || true
  fi
}
trap restore_developer_environment EXIT

mkdir -p "$RESULTS_DIR"
xcodebuild test \
  -workspace "$PROJECT_ROOT/macos/DevUtility.xcworkspace" \
  -scheme DevUtility-macOS \
  -configuration E2E \
  -derivedDataPath "$PROJECT_ROOT/build/e2e-derived-data" \
  -resultBundlePath "$RESULT_BUNDLE" \
  -only-testing:DevUtilityE2ETests/KeyboardFocusTests/test_iconOpensThePanelWithoutActivatingTheApp \
  -only-testing:DevUtilityE2ETests/KeyboardFocusTests/test_returnInsideSnippetSearchDoesNotCopyWhileAnotherAppIsFrontmost \
  -only-testing:DevUtilityE2ETests/KeyboardFocusTests/test_shortcutRecorderWorksWhileAnotherAppIsFrontmost \
  ONLY_ACTIVE_ARCH=YES \
  NODE_BINARY="$(command -v node)" \
  "$@"

echo "Results: $RESULT_BUNDLE"
