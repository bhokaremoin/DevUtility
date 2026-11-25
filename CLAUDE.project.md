# Project context

DevUtility is a macOS menu-bar app (React Native for macOS 0.76 + Swift native modules) with two
tools, Clipboard and Snippets, each with its own menu-bar icon, floating panel and global shortcut,
plus a Settings window. Spec: `docs/superpowers/specs/2026-10-21-multi-tool-panels-and-e2e-design.md`.

- Native code is by feature: `Tools/` (the registry that declares each tool), `Panels/` (one
  `ToolPanelController` per tool, opening and closing rules), `Settings/`, `Bridge/` (React Native
  modules). JS is by tool: `src/tools/<tool>/`, `src/settings/`, `src/shared/`.
- Adding a tool: one `ToolRegistry` entry, a shortcut name in `Bridge/ToolShortcuts.swift`, its JS
  root registered in `index.js` under the registry's `moduleName`, and an icon.

## Setup

- `npm install`, then `npm run pods`.
- One-time per Mac, in a real terminal (needs your password):
  `sudo automationmodetool enable-automationmode-without-authentication`.
- One-time per Mac, after the first `npm run test:e2e`: allow `DevUtilityE2ETests-Runner` under
  System Settings > Privacy & Security > Accessibility. The focus specs post real key events
  (`Support/Keyboard.swift`) and fail at setup without it. CI grants it in
  `scripts/ci/allow-e2e-runner-to-post-key-events.sh`.

## Commands

| Command | What it does |
|---|---|
| `npm start` + `npm run macos` | Run the app in Debug against Metro |
| `npm run test:unit` | Jest unit tests |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run test:native` | Swift unit tests for the pure native rules (`macos/DevUtilityNativeTests`, no app build, seconds) |
| `npm run test:e2e` | Build the `E2E` configuration and run the XCUITest suite (`build/e2e/*.xcresult`) |
| `npm run test:all` | Everything above; the definition-of-done command and what CI runs |
| `npm run xcode:add-e2e-targets` | Re-run after adding Swift files under `macos/DevUtilityE2ETests/` so they join the target |
| `npm run xcode:add-native-targets` | Re-run after adding, moving or deleting files under `macos/DevUtility-macOS/` or `macos/DevUtilityNativeTests/`: syncs the app target's sources and the unit test target |

## Rules

- All work is test-driven: write the failing test first (E2E for user-visible behavior, Jest for
  pure logic), then the code.
- E2E tests use page objects in `macos/DevUtilityE2ETests/Pages/`; identifiers
  (`<area>.<element>[.<index>]`) appear only there.
- Never `sleep` in tests; wait for a condition. To prove something does *not* happen, check that
  it holds over a window with `Wait.holds(for:)` (`ClipboardPanel.staysVisible`, `rowCountStays`).
  It samples every 100 ms; an inverted `XCTNSPredicateExpectation` looks only about once a second,
  so over a short window it passes without ever checking.
- A spec that only characterizes existing behavior must be shown able to fail: break the product
  code on a throwaway branch, run CI on it (`gh workflow run Test --ref <branch>`), then delete it.

## Gotchas

- E2E needs an unlocked, awake screen: with the Mac locked XCUITest sees no windows and every
  test fails at launch. When you can't run it locally, push and let CI (GitHub Actions
  `macos-26`, free for this public repo, ~20 min) be the evidence: push the failing test first,
  the fix right after.
- CI pins Xcode 26.3 (`.github/workflows/test.yml`) because Xcode 26.6's compiler rejects the
  `fmt` pod shipped with React Native 0.76 (consteval errors). Lift the pin after upgrading React
  Native to a release whose `fmt` builds with the runner's default Xcode.
- The `E2E` build has its own bundle ID (`org.reactjs.native.DevUtility.e2e`) and data, and is the
  only build that honors `--e2e-reset` and `--e2e-skip-onboarding` (no first-launch Settings window;
  `AppLauncher` passes it unless a spec is about launch). Its data lives in
  `~/Library/Application Support/org.reactjs.native.DevUtility.e2e` (the app is not sandboxed).
- `npm run test:e2e` quits an installed DevUtility (same global shortcut) and reopens it afterwards.
- A React Native `testID` becomes the accessibility identifier, but a plain `View`/`Text` is only
  visible to XCUITest when it also has `accessible`.
- In XCUITest use `XCUIKeyboardKey.return`; `.enter` is the keypad Enter (key code 76), which the
  app's key handler does not treat as Return (36).
- XCUITest's `typeKey`/`typeText`/`click` activate the app before sending input, so they can't
  show focus or activation bugs. Specs about those use `Support/Keyboard.swift` and
  `Support/Mouse.swift`, which post HID-level events like a real keyboard and mouse. Check the
  frontmost app with `OtherApp.isFrontmost` (NSWorkspace); `XCUIApplication.state` reports
  foreground for any running app.
- A mouse-down inside a tool panel makes macOS activate DevUtility even though the panel is
  non-activating (accepted limit, see the spec's Focus bug section). Open tools by their shortcut
  (HID keys) when a spec must keep the app inactive.
- Floating panels are not listed in `app.windows`; page objects find a panel by its identifier
  (`<toolId>.window`, `settings.window`) among all elements. Look elements up inside the tool's
  window: both panels can be open and share identifiers such as `shortcuts.sheet`.
- Clipboard closes on any click outside it, including a click on the Snippets icon or panel. A
  spec that needs both panels open opens Snippets first and Clipboard last.
- XCUITest's `rightClick()` on a status item times out waiting for a menu notification; use
  `Mouse.rightClick`, and find the icon menu's items by identifier (`statusMenu.*`), because the
  app menu has its own Settings… and Quit items.
- A registered global shortcut swallows its keys before any window sees them, so Settings switches
  the tools' shortcuts off while it is the key window (`SettingsWindowController`).
- Type definitions: `react-native` is mapped to `react-native-macos` in `tsconfig.json`.
