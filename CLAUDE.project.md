# Project context

DevUtility is a macOS menu-bar app (React Native for macOS 0.76 + Swift native modules) with a
clipboard history and a snippet manager. Spec for the multi-tool restructure:
`docs/superpowers/specs/2026-10-21-multi-tool-panels-and-e2e-design.md`.

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
| `npm run test:e2e` | Build the `E2E` configuration and run the XCUITest suite (`build/e2e/*.xcresult`) |
| `npm run test:all` | Everything above; the definition-of-done command and what CI runs |
| `npm run xcode:add-e2e-targets` | Re-run after adding Swift files under `macos/DevUtilityE2ETests/` so they join the target |

## Rules

- All work is test-driven: write the failing test first (E2E for user-visible behavior, Jest for
  pure logic), then the code.
- E2E tests use page objects in `macos/DevUtilityE2ETests/Pages/`; identifiers
  (`<area>.<element>[.<index>]`) appear only there.
- Never `sleep` in tests; wait for a condition. To prove something does *not* happen, use an
  inverted expectation over a window (`MainPanel.staysVisible`, `ClipboardTab.rowCountStays`).
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
  only build that honors `--e2e-reset`. Its data lives in
  `~/Library/Application Support/org.reactjs.native.DevUtility.e2e` (the app is not sandboxed).
- `npm run test:e2e` quits an installed DevUtility (same global shortcut) and reopens it afterwards.
- A React Native `testID` becomes the accessibility identifier, but a plain `View`/`Text` is only
  visible to XCUITest when it also has `accessible`.
- In XCUITest use `XCUIKeyboardKey.return`; `.enter` is the keypad Enter (key code 76), which the
  app's key handler does not treat as Return (36).
- Keys sent to a programmatically focused React Native text field are lost until it is clicked
  (known bug, fixed in delivery step 3); page objects click before typing.
- Type definitions: `react-native` is mapped to `react-native-macos` in `tsconfig.json`.
