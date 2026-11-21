#!/usr/bin/env bash
# Lets the E2E test runner post HID key events (Support/Keyboard.swift) on a CI Mac.
# macOS silently drops events posted by a process without Accessibility/PostEvent consent, and
# nobody is there to click the consent dialog. GitHub's macOS runners have SIP disabled, so the
# consent can be written straight into the TCC databases. Never run this on a developer Mac:
# grant the runner in System Settings > Privacy & Security > Accessibility instead.
set -euo pipefail

if [[ "${CI:-}" != "true" ]]; then
  echo "Refusing to edit TCC databases outside CI." >&2
  exit 1
fi

RUNNER_BUNDLE_ID="org.reactjs.native.DevUtilityE2ETests.xctrunner"
NOW=$(date +%s)

for database in "/Library/Application Support/com.apple.TCC/TCC.db" \
                "$HOME/Library/Application Support/com.apple.TCC/TCC.db"; do
  for service in kTCCServiceAccessibility kTCCServicePostEvent; do
    sudo sqlite3 "$database" "INSERT OR REPLACE INTO access
      (service, client, client_type, auth_value, auth_reason, auth_version, flags, last_modified)
      VALUES ('$service', '$RUNNER_BUNDLE_ID', 0, 2, 4, 1, 0, $NOW);"
  done
  sudo sqlite3 "$database" "SELECT service, client, auth_value FROM access WHERE client = '$RUNNER_BUNDLE_ID';"
done
