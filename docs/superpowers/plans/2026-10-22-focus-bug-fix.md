# Focus Bug Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keys typed right after the panel opens, or right after a search field is focused by code, reach the app without a click first. This fixes the "have to click multiple times" bug.

**Architecture:** E2E specs first reproduce two problems:
- keystrokes lost after a React Native text input is focused by code;
- the panel activating the app.

Debugging then finds the exact cause of the lost keystrokes, with evidence. The fix has two separate changes:
1. The window-focus change the spec already decided. The panel becomes a non-activating panel shown with no app activation. Its show/hide logic moves into a small reusable `PanelPresenter`, which step 4 moves into `ToolPanelController`. `KeyEventModule` reads the event's own window rather than `NSApp.keyWindow`.
2. The text-input fix that the debugging finds.

**Tech Stack:** React Native for macOS 0.76 (old architecture), Swift (AppKit `NSPanel`), XCUITest, GitHub Actions `macos-26`.

**Spec:** `docs/superpowers/specs/2026-10-21-multi-tool-panels-and-e2e-design.md`. The relevant sections are "Focus bug", "Keyboard routing", "Delivery order" step 3 and its spike results, and the catalogue items marked **[step 3]**.

## Global Constraints

- Work on branch `fix/panel-keyboard-focus`, created from `test/e2e-foundation` once PR #1's review fixes land. Never commit to `main`.
- Commits follow Conventional Commits and end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01KGsmAssYfT2eNfN8BxeCyy
  ```
- All work is test-first. A spec is committed and shown failing for the expected reason before the code that fixes it.
- CI triggers:
  - The `Test` workflow runs on `pull_request` and on `workflow_dispatch`, not on branch pushes. This plan's branch therefore gets a draft PR at its first push.
  - Throwaway branches (`ci/*`) run with `gh workflow run Test --ref <branch>`, which has worked for every earlier mutation run.
  - The developer's screen is locked, so E2E evidence comes from CI.
- Identifiers appear only in page objects (`macos/DevUtilityE2ETests/Pages/`). Tests never `sleep`.
- Existing tests are never weakened. Page objects keep clicking a field before typing, because that is what a user does. Only the new specs skip the click on purpose.
- The production bundle ID `org.reactjs.native.DevUtility` is unchanged.
- `npm run test:all` must pass before any task is reported complete, on CI for the E2E layer.
- New code has no change-log-style file headers and no docstrings that restate the code.
- These specs use `⌘2` to reach Snippets. Step 4 removes `⌘1/2/3`, and at that point they move to opening the Snippets tool directly.

## Review Focus

1. **Typing right after `⌘2` or `⌘F`, with no click.** The characters appear in Snippets search, complete and with none dropped. This is the user's daily path and the bug itself.
2. **Panel opened by the global shortcut or the menu-bar icon while another app is frontmost.** The other app stays frontmost (DevUtility is not activated), and `↓` and typing work at once.
3. **Panel key while DevUtility is inactive.** The Clear-all alert, the Settings shortcut recorder, and `Enter` inside Snippets search must behave as they do today. No existing spec covers this state, because every existing spec runs with the app active. The new specs in Task 1 cover it.
4. **Reopening.** After a hide and show that remounts Snippets, the focus-on-mount path works again, so the fix does not depend on first-launch timing.
5. **Dropped first character.** A spec that types "nginx" and gets "ginx" must fail with the actual value in its message, because the two symptoms point to different causes.

---

### Task 1: Failing specs for keyboard focus and app activation

**Files:**
- Create: `macos/DevUtilityE2ETests/Specs/KeyboardFocusTests.swift`
- Modify: `macos/DevUtilityE2ETests/Pages/SnippetsTab.swift` (add `searchText`, `waitForSearchText`)
- Run: `npm run xcode:add-e2e-targets` so the new file joins the target

**Interfaces:**
- Consumes:
  - `AppLauncher.launchFresh() -> XCUIApplication`
  - `MainPanel(app:)`: `waitUntilVisible()`, `waitUntilHidden()`, `press(_:modifiers:)` (String and `XCUIKeyboardKey` overloads), `type(_:)`, `openSettings() -> SettingsTab`, `openSnippets() -> SnippetsTab`
  - `OtherApp.bringToFront() -> XCUIApplication`
  - `MenuBar(app:).clickIcon()`
  - `Pasteboard.write(_:)`, `Pasteboard.clear()`, `Pasteboard.staysEmpty(for:) -> Bool`
  - `ClipboardTab(app:)`: `waitForRowText(_:toEqual:)`, `isRowSelected(_:)`, `clearAll(confirm:)`, `rowCount`, `rowCountStays(_:for:)`, `emptyState`
  - `SnippetsTab(app:)`: `isSearchFocused`, `search(for:)`, `addSnippet(title:description:tags:content:)`, `rowCount`
  - `SettingsTab.recordShortcut(_:modifiers:shownAs:)`
  - `Wait.until(_:timeout:file:line:_:)`
- Produces:
  - `SnippetsTab.searchText: String`, the field's value, or `""` when empty
  - `SnippetsTab.waitForSearchText(_:file:line:)`, whose failure message includes the actual text

Check these signatures against the code before writing the specs. PR #1's review fixes may have renamed one. If one differs, use the real one and say so in the report.

- [ ] **Step 1: Add the page-object members to `SnippetsTab`**

```swift
  var searchText: String { (searchField.value as? String) ?? "" }

  func waitForSearchText(_ expected: String, file: StaticString = #filePath, line: UInt = #line) {
    Wait.until("search shows \"\(expected)\" (it shows \"\(searchText)\")", file: file, line: line) {
      self.searchText == expected
    }
  }
```

If `Wait.until` builds its message before the wait, so that the actual value is stale, put the actual value into the failure some other way. One option is an `XCTAssertEqual(searchText, expected, file:line:)` after a `Wait.until` that returns without failing. Keep the message honest.

- [ ] **Step 2: Write the specs**

```swift
import XCTest

final class KeyboardFocusTests: XCTestCase {
  private var app: XCUIApplication!
  private var panel: MainPanel!

  override func setUp() {
    continueAfterFailure = false
    app = AppLauncher.launchFresh()
    panel = MainPanel(app: app)
    panel.waitUntilVisible()
  }

  override func tearDown() {
    app.terminate()
  }

  // MARK: - Typing after programmatic focus

  func test_typingRightAfterSwitchingToSnippetsGoesIntoSearch() {
    panel.press("2", modifiers: .command)
    let snippets = SnippetsTab(app: app)
    Wait.until("search has keyboard focus") { snippets.isSearchFocused }
    panel.type("nginx")
    snippets.waitForSearchText("nginx")
  }

  func test_typingRightAfterCommandFGoesIntoSearch() {
    panel.press("f", modifiers: .command)
    let snippets = SnippetsTab(app: app)
    Wait.until("search has keyboard focus") { snippets.isSearchFocused }
    panel.type("docker")
    snippets.waitForSearchText("docker")
  }

  func test_typingWorksAgainAfterSnippetsIsRemountedByReopening() {
    panel.press("2", modifiers: .command)
    panel.press("1", modifiers: .command)
    panel.press(.escape)
    panel.waitUntilHidden()
    let otherApp = OtherApp.bringToFront()
    otherApp.typeKey("d", modifierFlags: [.control, .option])
    panel.waitUntilVisible()
    panel.press("2", modifiers: .command)
    let snippets = SnippetsTab(app: app)
    Wait.until("search has keyboard focus") { snippets.isSearchFocused }
    panel.type("again")
    snippets.waitForSearchText("again")
  }

  // MARK: - Panel over another app

  func test_shortcutOpensThePanelWithoutActivatingTheApp() {
    let otherApp = hidePanelThenReopenItFromAnotherApp()
    XCTAssertEqual(otherApp.state, .runningForeground, "opening the panel activated DevUtility")
  }

  func test_iconOpensThePanelWithoutActivatingTheApp() {
    let menuBar = MenuBar(app: app)
    menuBar.clickIcon()
    panel.waitUntilHidden()
    let otherApp = OtherApp.bringToFront()
    menuBar.clickIcon()
    panel.waitUntilVisible()
    XCTAssertEqual(otherApp.state, .runningForeground, "opening the panel activated DevUtility")
  }

  func test_arrowKeysWorkRightAfterTheShortcutOpensThePanelOverAnotherApp() {
    Pasteboard.write("older")
    let clipboard = ClipboardTab(app: app)
    clipboard.waitForRowText(0, toEqual: "older")
    Pasteboard.write("newer")
    clipboard.waitForRowText(0, toEqual: "newer")
    let otherApp = hidePanelThenReopenItFromAnotherApp()
    panel.press(.downArrow)
    Wait.until("row 1 is selected") { clipboard.isRowSelected(1) }
    XCTAssertEqual(otherApp.state, .runningForeground, "sending keys activated DevUtility")
  }

  func test_typingWorksRightAfterTheShortcutOpensSnippetsOverAnotherApp() {
    let otherApp = hidePanelThenReopenItFromAnotherApp()
    panel.press("2", modifiers: .command)
    let snippets = SnippetsTab(app: app)
    Wait.until("search has keyboard focus") { snippets.isSearchFocused }
    panel.type("menu")
    snippets.waitForSearchText("menu")
    XCTAssertEqual(otherApp.state, .runningForeground, "sending keys activated DevUtility")
  }

  // MARK: - Panel key while the app is inactive

  func test_clearAllAlertWorksWhileAnotherAppIsFrontmost() {
    Pasteboard.write("keep me")
    let clipboard = ClipboardTab(app: app)
    clipboard.waitForRowText(0, toEqual: "keep me")
    _ = hidePanelThenReopenItFromAnotherApp()
    clipboard.clearAll(confirm: false)
    XCTAssertTrue(clipboard.rowCountStays(1, for: 2), "Cancel cleared the history")
    clipboard.clearAll(confirm: true)
    Wait.until("history is empty") { clipboard.emptyState.exists }
  }

  func test_shortcutRecorderWorksWhileAnotherAppIsFrontmost() {
    _ = hidePanelThenReopenItFromAnotherApp()
    let settings = panel.openSettings()
    settings.recordShortcut("k", modifiers: [.control, .option], shownAs: "⌃⌥K")
  }

  func test_enterInsideSnippetSearchDoesNotCopyWhileAnotherAppIsFrontmost() {
    let snippets = panel.openSnippets()
    snippets.addSnippet(title: "Nginx proxy", description: "", tags: "", content: "proxy_pass")
    _ = hidePanelThenReopenItFromAnotherApp()
    snippets.search(for: "Nginx")
    Pasteboard.clear()
    panel.press(.return)
    XCTAssertTrue(Pasteboard.staysEmpty(for: 2), "Enter inside search copied the snippet")
  }

  // MARK: - Helpers

  private func hidePanelThenReopenItFromAnotherApp() -> XCUIApplication {
    let otherApp = OtherApp.bringToFront()
    otherApp.typeKey("d", modifierFlags: [.control, .option])
    panel.waitUntilHidden()
    otherApp.typeKey("d", modifierFlags: [.control, .option])
    panel.waitUntilVisible()
    return otherApp
  }
}
```

Notes for the implementer:
- **`panel.press` and `panel.type` send keys through `XCUIApplication`.** If XCUITest activates DevUtility before it synthesizes keys, the over-another-app specs would pass without testing anything. The trailing `otherApp.state` assertions detect that. After Task 3, if they still fail only because of the key sending (the activation-only specs pass), the masking is real. In that case, send the keys through `otherApp.typeKey`/`otherApp.typeText` for those specs, and record why.
- **`test_arrowKeysWork…` expects row 1 after one `↓`.** That relies on `useListNavigation` auto-selecting row 0. Verify it. If the starting selection differs, adapt the expected row to today's real behavior and explain why.
- **Esc in `test_typingWorksAgain…`.** On an empty Clipboard tab, Esc falls through to `hidePanel`, so `⌘1` then Esc hides the panel. The reopen and `⌘2` then remount Snippets, which runs the focus-on-mount path again.
- **Keep the empty-description add.** If `addSnippet` with an empty description cannot save (`canSave`), pass a non-empty description.
- **Possible XCUITest failure in an inactive app.** XCUITest's keyboard-focus check ("Neither element nor any descendant has keyboard focus") may behave differently when the target app is inactive. If it blocks `panel.type`, report it. Do not route around it silently.

- [ ] **Step 3: Show RED on CI**

```bash
git add macos/DevUtilityE2ETests/Specs/KeyboardFocusTests.swift macos/DevUtilityE2ETests/Pages/SnippetsTab.swift macos/DevUtility.xcodeproj/project.pbxproj
git commit -m "test(e2e): reproduce keys lost after programmatic focus"
git push -u origin fix/panel-keyboard-focus
gh pr create --draft --base test/e2e-foundation --title "fix(panel): accept keys right after the panel opens" --body "Step 3 of docs/superpowers/specs/2026-10-21-multi-tool-panels-and-e2e-design.md. Work in progress."
```

Record the run ID and each failure line. Expected:

| Spec | Expected today |
|---|---|
| `test_typingRightAfterSwitchingToSnippetsGoesIntoSearch` | FAIL at the search text (the bug) |
| `test_typingRightAfterCommandFGoesIntoSearch` | FAIL at the search text |
| `test_typingWorksAgainAfterSnippetsIsRemountedByReopening` | FAIL at the search text |
| `test_typingWorksRightAfterTheShortcutOpensSnippetsOverAnotherApp` | FAIL at the search text, or at the activation assertion |
| `test_shortcutOpensThePanelWithoutActivatingTheApp` | FAIL if `activate(options: [])` succeeds on CI; may pass if macOS declines it |
| `test_iconOpensThePanelWithoutActivatingTheApp` | same as the line above |
| `test_arrowKeysWork…`, `test_clearAllAlert…`, `test_shortcutRecorder…`, `test_enterInsideSnippetSearch…` | may pass today; they guard Task 3's window change |

If a typing spec passes, or fails anywhere other than the search text, stop and report it. The reproduction is then wrong. If both activation specs pass today, the no-activation decision has no failing test. Report that, and Task 3 goes ahead on the spec's decision, guarded by the "may pass" specs.

---

### Task 2: Find the root cause of lost keystrokes (systematic debugging)

**Files:**
- Modify: `docs/superpowers/specs/2026-10-21-multi-tool-panels-and-e2e-design.md`:
  - add a "Root cause (step 3)" paragraph under "Focus bug";
  - add `KeyboardFocusTests` to the E2E structure list.
- Temporary only, on throwaway branch `ci/focus-diagnostics`, deleted afterwards: an experiment switch, logging, and a workflow tweak.

**Interfaces:**
- Produces: a written root cause with evidence, and the fix it implies, for Task 3.

Use `superpowers:systematic-debugging`. Do not guess a fix. The spike already established:
- the panel is key and the app is active;
- the first responder is the field editor of the `RCTUITextField` behind `snippets.search`;
- key events reach the window, and `KeyEventModule` passes them through;
- no text is committed;
- one click on the field fixes it.

- [ ] **Step 1: Form hypotheses from the code.** Read how RN-macOS 0.76 focuses a text input: `RCTUITextField` and `RCTBaseTextInputView` in `node_modules/react-native-macos/Libraries/Text/TextInput/`, the `focus` command, `reactFocus`, `becomeFirstResponder`, and the field-editor setup. Read `src/screens/SnippetManagerScreen.tsx`. The candidates:
  - **(a)** Focus runs before the view is in the panel's window, or while it moves between windows, so the field editor belongs to another window.
  - **(b)** `makeFirstResponder` succeeds, but the field editor is not attached to the cell or editable until a mouse-down calls `selectText`/`editWithFrame`.
  - **(c)** Another responder swallows `insertText:` or `keyDown:`. Candidates are the RN root view, `UtilityPanel`, and the `ShortcutsModal` focus trap.
  - **(d)** The 100 ms `setTimeout` focus races the tab render.
  - **(e)** `keyDownEvents`/`onKeyDown` on the search `TextInput` changes how the field handles keys.
  - **(f)** The controlled `value={searchQuery}` reverts inserted text: a stale value or an event-count mismatch looks like "not committed". Compare JS `onChangeText` with the native `textDidChange`.

- [ ] **Step 2: One CI run that tests every hypothesis.** On `ci/focus-diagnostics`:
  1. Add an E2E-only experiment switch, read from a launch argument `--focus-experiment=<name>`. On the native side, use `#if E2E_BUILD`. On the JS side, pass it as an initial prop the same way `isE2EReset` is passed. Each named experiment removes or changes exactly one suspect, for example:
     - focusing through `requestAnimationFrame` after layout instead of `setTimeout`;
     - focusing natively with `window.makeFirstResponder` plus `selectText`;
     - no `onKeyDown`/`keyDownEvents`;
     - an uncontrolled input;
     - no `ShortcutsModal` focus trap.
  2. Add one test per experiment that launches with that argument and runs the steps of `test_typingRightAfterSwitchingToSnippetsGoesIntoSearch`.
  3. Add `NSLog` lines for each key event in the panel:
     - the event's window and `NSApp.keyWindow`;
     - `firstResponder` and its class;
     - the field editor's `delegate`;
     - whether the field editor's superview chain contains the search field;
     - `isEditable`;
     - the JS `onChangeText` value, logged with `console.log`, which reaches the native log in Release.
  4. In `.github/workflows/test.yml`, on this branch only:
     - replace `npm run test:all` with the direct `xcodebuild test` command from `scripts/run-e2e-tests.sh`. Keep its flags, and narrow with `-only-testing:DevUtilityE2ETests/FocusExperimentTests` (replacing, not adding to, the script's `-only-testing:DevUtilityE2ETests`);
     - add an `if: always()` step that runs `log show --last 20m --style compact --predicate 'process == "DevUtility"' > app.log`;
     - upload `app.log` and the `.xcresult` as artifacts.
  5. Run it with `gh workflow run Test --ref ci/focus-diagnostics`, then download the artifacts (`gh run download`).

  The experiment that turns green, together with the log lines, is the evidence. If none turns green, form new hypotheses from the logs and repeat. Each round is one CI run.

- [ ] **Step 3: Delete the throwaway branch**, locally and on the remote.

- [ ] **Step 4: Write up the root cause in the spec** under "Focus bug": the cause, the evidence (log lines and run IDs), and the chosen fix. The fix lives in app code. Patching `react-native-macos` (with `patch-package`) is allowed only if no app-level fix exists, and then say why. Commit:

```bash
git add docs/superpowers/specs/2026-10-21-multi-tool-panels-and-e2e-design.md
git commit -m "docs(spec): record the root cause of lost keystrokes"
```

---

### Task 3: Fix it in two changes

**Files:**
- Create: `macos/DevUtility-macOS/PanelPresenter.swift`
- Modify:
  - `macos/DevUtility-macOS/PanelManager.swift`
  - `macos/DevUtility-macOS/KeyEventModule.swift`
  - `macos/DevUtility.xcodeproj/project.pbxproj`
  - whatever Task 2's root cause names, for example `src/screens/SnippetManagerScreen.tsx`

**Interfaces:**
- Consumes: Task 2's root cause.
- Produces: `PanelPresenter(panel: NSPanel)` with `show(at origin: NSPoint)` and `hide()`. Step 4 moves it into `ToolPanelController`.

- [ ] **Step 1: Present the window without activating the app (decided in the spec).**

`PanelPresenter.swift`:

```swift
import Cocoa

/// Shows a panel as the key window without activating the app. A non-activating panel can take
/// key status on its own, while app activation on macOS 14+ is cooperative and can be declined.
final class PanelPresenter {
  private let panel: NSPanel

  init(panel: NSPanel) {
    self.panel = panel
  }

  func show(at origin: NSPoint) {
    panel.setFrameOrigin(origin)
    panel.makeKeyAndOrderFront(nil)
    DispatchQueue.main.async { [panel] in
      guard panel.isVisible, !panel.isKeyWindow else { return }
      panel.makeKey()
      if !panel.isKeyWindow {
        NSLog("[DevUtility] panel did not become key after show")
      }
    }
  }

  func hide() {
    panel.orderOut(nil)
  }
}
```

Changes in `PanelManager`:
- `styleMask: [.nonactivatingPanel, .titled, .fullSizeContentView]` at init.
- `private var presenter: PanelPresenter!`, created in `setup(with:)`.
- `show()` keeps its screen and centering math, then calls `presenter.show(at: NSPoint(x: x, y: y))` and `installClickOutsideMonitor()`. It no longer calls `NSRunningApplication.current.activate`.
- `hide()` calls `presenter.hide()` and `removeClickOutsideMonitor()`.

In `KeyEventModule.handleKeyEvent`, read `event.window?.firstResponder` instead of `NSApp.keyWindow?.firstResponder`, in both the `isTextInputFocused` check and the arrow-key branch. The event's own window stays correct while the app is inactive.

Add `PanelPresenter.swift` to the `DevUtility-macOS` target with a one-off `xcodeproj` Ruby script kept in the scratchpad and not committed. `scripts/xcode/add-e2e-targets.rb` only globs the test folder. Verify the change by building Debug, Release and E2E.

Commit with explicit paths, then push:

```bash
git add macos/DevUtility-macOS/PanelPresenter.swift macos/DevUtility-macOS/PanelManager.swift macos/DevUtility-macOS/KeyEventModule.swift macos/DevUtility.xcodeproj/project.pbxproj
git commit -m "refactor(panel): show the panel as a non-activating key window"
git push
```

Expected on CI:
- the activation specs and every "while another app is frontmost" spec pass;
- the typing specs may still fail;
- every existing spec passes.

If an alert, the recorder, or `Enter` in search breaks, do not weaken the spec. Use `superpowers:systematic-debugging` to find out why, then fix it. One option is to activate the app only for that interaction. Record the reasoning.

- [ ] **Step 2: Fix the text input.** Implement the fix Task 2 recorded, as the smallest change that removes the cause. Keep today's behavior: search is focused on mount and by `⌘F`.

```bash
git add <the exact files the fix touches>
git commit -m "fix(snippets): accept keys right after programmatic focus"
git push
```

Expected: every spec in `KeyboardFocusTests` passes, and the whole suite stays green.

---

### Task 4: Docs and PR

**Files:**
- Modify: `CLAUDE.project.md`

- [ ] **Step 1:** Replace the gotcha "Keys sent to a programmatically focused React Native text field are lost until it is clicked" with a one-line summary of the root cause and the rule it sets for future code (for example, "focus inputs through X, never Y"). Add one more gotcha: the panel is non-activating, so code that needs the app active, such as a modal alert, must activate it explicitly.
- [ ] **Step 2:** Commit, push, and confirm CI is green:

```bash
git add CLAUDE.project.md
git commit -m "docs: replace the focus-bug gotcha with its root cause"
git push
```

Then:
- update the draft PR's description: what changed, why, and how it was tested, with run IDs;
- mark the PR ready;
- after PR #1 merges, retarget it to `main` (`gh pr edit --base main`);
- run `h-pr-review` on it.
