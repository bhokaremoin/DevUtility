# Multi-tool Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn DevUtility's single tabbed panel into separate tools (Clipboard, Snippets), each with its own menu-bar icon, floating panel, global shortcut, opening position and closing rule, plus a separate Settings window.

**Architecture:** One app process and one React Native bridge. A native `ToolRegistry` declares each tool (size, position rule, closing rule, icon). One `ToolPanelController` per tool owns its panel, status item and hotkey, and reuses step 3's `PanelPresenter`. Pure decisions (panel frame, outside-click rule, shortcut conflicts) live in small Swift files that a host-less unit test target compiles directly. JS is split into one root per tool plus a Settings root, all registered in `index.js` and sharing one JS context.

**Tech Stack:** React Native macOS 0.76, Swift 5 (AppKit), KeyboardShortcuts 2.4.0, Jest, XCTest (unit) and XCUITest (E2E), GitHub Actions `macos-26` with Xcode 26.3.

**Spec:** `docs/superpowers/specs/2026-10-21-multi-tool-panels-and-e2e-design.md` (step 4 of "Delivery order"). Read its Product decisions, Architecture and Test catalogue before any task.

## Global Constraints

- Tool ids: `clipboard`, `snippets`. RN module names: `ClipboardTool`, `SnippetsTool`, `Settings`.
- Default shortcuts: Clipboard `⌃⌥V`, Snippets `⌃⌥S`. KeyboardShortcuts names `toggleClipboard`, `toggleSnippets`. `toggleApp` (`⌃⌥D`) is retired and not migrated.
- Panel sizes: Clipboard 560×420 (min 420×300), Snippets 800×600 (min 480×360). Resizable; size and position are not remembered.
- Positions: Clipboard puts the panel's top-left at the mouse pointer, clamped into the `visibleFrame` of the screen the mouse is on. Snippets centers in that `visibleFrame`.
- Storage keys (`@devutility/snippets`, `@devutility/clipboard_history`) and the production bundle ID `org.reactjs.native.DevUtility` are unchanged.
- Tool panels sit at `.floating`. The Settings window sits at `NSWindow.Level(rawValue: NSWindow.Level.floating.rawValue + 1)` and is shown with `makeKeyAndOrderFront`.
- UserDefaults flag `hasShownMultiToolOnboarding`. Launch flags `--e2e-reset` (also clears that flag and both shortcuts) and `--e2e-skip-onboarding`, honoured only by the `E2E` build.
- Accessibility identifiers, used only in page objects:
  - Status items `statusItem.clipboard`, `statusItem.snippets`.
  - Windows `clipboard.window`, `snippets.window`, `settings.window`.
  - Headers `clipboard.header.clearAll`, `clipboard.header.help`, `snippets.header.add`, `snippets.header.help`, `snippets.header.close`.
  - Settings, per tool: `settings.shortcut.<toolId>` (recorder), `.current`, `.reset` and `.conflictNote` on the same prefix.
  - Existing row, detail, search and sheet ids keep their names.
- Every task is test-first. E2E needs an unlocked screen. When the screen is locked, push and use CI (`gh workflow run Test --ref <branch>`), as `CLAUDE.project.md` says. Never `sleep` in tests.
- New and changed files drop the change-log-style file headers and the docstrings that only restate the code (spec, delivery step 4).
- Branch: `feat/multi-tool-panels`, one PR, reviewed with `h-pr-review` before merge.

## Rulings (where this plan decides something the spec leaves open)

- **Root creation:** the first root (`ClipboardTool`) still comes from `RCTAppDelegate` and is moved out of the default window, as today (proven in step 3). `SnippetsTool` and `Settings` come from `self.rootViewFactory viewWithModuleName:initialProperties:` (proven in the step-1 spike). This is lower risk than overriding window creation. If it is wrong, the cost is an extra hidden window at launch that we close.
- **E2E reset with several roots:** all roots share one JS context, so `StorageResetGate` awaits one module-level `resetStorageOnce()` promise. Each root waits for it, and storage is cleared exactly once.
- **Toggle on a visible but not key panel:** this brings the panel to the front and makes it key; it does not hide it. Only a visible and key panel hides on its icon or shortcut.
- **Hiding a panel while another tool panel is visible:** this makes that other panel key instead of handing focus back to another app.
- **Debounce:** the 350 ms toggle debounce is per tool.
- **⌘,** is handled natively (no JS round trip). With Settings already open, it brings the same window to the front.
- **Settings window:** 520×440, not resizable, titled "DevUtility Settings", centered on the mouse's screen. It closes with its close button. It lists the tools in registry order, each with a recorder, a "Current:" label and a "Reset to <default>" button. The old "Behavior" card is removed.
- **Conflict note text:** `Removed this shortcut from <Tool display name>.`, shown under the tool that took the shortcut until the next change.
- **Clipboard icon:** SF Symbol `list.clipboard`, a template image. Snippets keeps the `MenuBarIcon` asset.

## Review Focus

1. Pressing Snippets' shortcut while Clipboard is open and key, then Clipboard's again: each press acts on its own tool. Snippets opens on top, and Clipboard is brought to front (not closed) because it was visible but not key. Test in Task 4.
2. Pressing the two tools' shortcuts within 350 ms: both open (the debounce is per tool, not global). Test in Task 4.
3. Closing Clipboard with Esc while Snippets is also open: Snippets becomes key and typing goes into its search, not into the app that was in front before. Test in Task 6.
4. Pressing ⌘, twice, or "Settings…" with Settings already open: still exactly one Settings window, in front and key. Test in Task 3.
5. Clearing a tool's shortcut in the recorder (its ✕): the tool has no shortcut, its icon still toggles it, and "Current:" shows `Not set`. Test in Task 8.

---

### Task 1: Pure native logic and the Swift unit test target

**Files:**
- Create: `macos/DevUtility-macOS/Tools/ToolDefinition.swift`
- Create: `macos/DevUtility-macOS/Tools/ToolRegistry.swift`
- Create: `macos/DevUtility-macOS/Panels/PanelFrameCalculator.swift`
- Create: `macos/DevUtility-macOS/Panels/OutsideClickRule.swift`
- Create: `macos/DevUtility-macOS/Settings/ShortcutConflictResolver.swift`
- Create: `macos/DevUtilityNativeTests/PanelFrameCalculatorTests.swift`, `OutsideClickRuleTests.swift`, `ShortcutConflictResolverTests.swift`, `ToolRegistryTests.swift`
- Create: `scripts/xcode/add-native-targets.rb`
- Modify: `package.json` (scripts `test:native`, `xcode:add-native-targets`; `test:all` runs `test:native` after `test:unit`), `CLAUDE.project.md` (commands table)

**Interfaces:**
- Produces (AppKit/Foundation only, no KeyboardShortcuts and no React):
  ```swift
  enum OpeningPosition { case atMousePointer, centeredOnMouseScreen }
  enum ClosingRule { case closesOnOutsideClick, closesOnlyExplicitly }
  enum ToolIcon { case asset(String), systemSymbol(String) }
  struct ToolDefinition { let id: String; let displayName: String; let moduleName: String
    let icon: ToolIcon; let size: NSSize; let minimumSize: NSSize
    let openingPosition: OpeningPosition; let closingRule: ClosingRule }
  enum ToolRegistry { static let all: [ToolDefinition]; static func tool(withId id: String) -> ToolDefinition? }
  struct ScreenArea { let frame: NSRect; let visibleFrame: NSRect }
  enum PanelFrameCalculator {
    static func visibleFrame(containing mouse: NSPoint, screens: [ScreenArea]) -> NSRect
    static func frame(for position: OpeningPosition, size: NSSize, mouse: NSPoint, visibleFrame: NSRect) -> NSRect }
  enum ClickLocation { case ownPanel, ownStatusItem, ownSheetOrAlert, settingsOpenedFromThisPanel, otherDevUtilityWindow, otherApp }
  enum OutsideClickRule { static func shouldClose(_ rule: ClosingRule, after click: ClickLocation) -> Bool }
  struct ShortcutBinding: Equatable { let keyCode: Int; let modifiers: UInt }
  enum ShortcutConflictResolver {
    static func toolsToClear(assigning binding: ShortcutBinding?, to toolId: String,
                             current: [(toolId: String, binding: ShortcutBinding?)]) -> [String] }
  ```

- [ ] **Step 1: Add the test target script.** `add-native-targets.rb` (xcodeproj gem, written in the style of `add-e2e-targets.rb`) is idempotent and does three things:
  - It syncs the app target's sources to every `.swift` file under `macos/DevUtility-macOS/**`, dropping references to files that no longer exist, so later tasks can move files into folders.
  - It creates the unit test bundle `DevUtilityNativeTests` (no host app, `MACOSX_DEPLOYMENT_TARGET` 14.0, `CODE_SIGN_IDENTITY` `-`), compiling `macos/DevUtilityNativeTests/**/*.swift` plus the five pure files above.
  - It creates the shared scheme `DevUtilityNativeTests`, which builds and tests only that target.

  Then set `"test:native": "xcodebuild test -workspace macos/DevUtility.xcworkspace -scheme DevUtilityNativeTests -destination 'platform=macOS'"`.
- [ ] **Step 2: Write the failing tests.** Values use a 1440×900 screen whose `visibleFrame` is `(0, 0, 1440, 875)`.
  - `PanelFrameCalculatorTests`:
    - `test_atMousePointerPutsTopLeftAtTheMouse`: mouse (300, 700), size 560×420 → frame (300, 280, 560, 420).
    - `test_atMousePointerClampsAtTheRightEdge`: mouse (1400, 700) → x 880.
    - `test_atMousePointerClampsAtTheBottomEdge`: mouse (300, 100) → y 0.
    - `test_atMousePointerInTheMenuBarOpensJustBelowIt`: mouse (300, 890) → y 455.
    - `test_panelLargerThanTheScreenStartsAtTheVisibleOrigin`: size 2000×1000 → origin (0, 0).
    - `test_centeredOnMouseScreen`: size 800×600 → origin (320, 137.5).
    - `test_visibleFrameComesFromTheScreenUnderTheMouse`: screens `[(0,0,1440,900)/(0,0,1440,875), (-1920,0,1920,1080)/(-1920,0,1920,1055)]`, mouse (-500, 500) → the second visibleFrame.
    - `test_mouseOnNoScreenFallsBackToTheFirstScreen`.
  - `OutsideClickRuleTests`:
    - `closesOnlyExplicitly` returns false for every `ClickLocation`.
    - `closesOnOutsideClick` returns true only for `otherApp` and `otherDevUtilityWindow`.
  - `ShortcutConflictResolverTests`:
    - `test_assigningAnotherToolsShortcutClearsItThere` → `["snippets"]`.
    - `test_assigningAFreeShortcutClearsNothing` → `[]`.
    - `test_reassigningTheSameToolsOwnShortcutClearsNothing` → `[]`.
    - `test_clearingAShortcutClearsNothing` (binding `nil`) → `[]`.
  - `ToolRegistryTests`:
    - The ids are `["clipboard", "snippets"]` in that order.
    - Sizes, minimum sizes, positions, closing rules and module names match the Global Constraints.
    - The icons are `.systemSymbol("list.clipboard")` and `.asset("MenuBarIcon")`.
- [ ] **Step 3: Run `npm run xcode:add-native-targets && npm run test:native`.** Expected: it fails to compile, because the types don't exist yet.
- [ ] **Step 4: Implement the five files.** In `frame(for:)`, "top-left at the mouse" is `origin = (mouse.x, mouse.y - size.height)` in AppKit coordinates. Clamp x into `[minX, maxX - width]` and y into `[minY, maxY - height]`, and when the panel is larger than the area, use `minX`/`minY`.
- [ ] **Step 5: Run `npm run xcode:add-native-targets && npm run test:native`.** Expected: all pass. Then run `npm run lint && npm run typecheck && npm run test:unit`. Expected: green.
- [ ] **Step 6: Commit** `feat(native): add tool registry and pure panel, click and shortcut rules`.

### Task 2: Reorganise JS by tool (no behavior change)

**Files:**
- Create the folders `src/tools/clipboard/`, `src/tools/snippets/`, `src/settings/` and `src/shared/`, and move the existing files into them:
  - `src/tools/clipboard/`: `ClipCopyScreen` (renamed `ClipboardScreen`), `ClipMasterRow`, `ClipDetailView`, `useClipboardHistory`, `useClipboardPoller`, `clipboardHistoryList`, `clipboardStorage`, `clipboardNative`.
  - `src/tools/snippets/`: `SnippetManagerScreen` (renamed `SnippetsScreen`), `SnippetRow`, `SnippetDetailView`, `AddSnippetModal`, `useSnippets`, `snippetSearch`, `snippetStorage`.
  - `src/settings/`: `SettingsScreen`.
  - `src/shared/`: `theme`, `constants`, `types`, `utils`, `useListNavigation`, `useCopyFeedback`, `useKeyboardShortcuts`, `ShortcutsModal`, `data/shortcuts`, `native/*`, `StorageResetGate`.
- Create: `src/shared/toolIds.ts` with `export type ToolId = 'clipboard' | 'snippets'`.
- Modify: `src/App.tsx` (imports only) and `__tests__/*.test.ts` (import paths only, no assertion changes).

- [ ] **Step 1: Move the files with `git mv`, fix the imports, and remove the barrel `index.ts` files that no longer group anything.** No logic changes.
- [ ] **Step 2: Run `npm run lint && npm run typecheck && npm run test:unit`.** Expected: green, with 17 Jest tests, the same as before.
- [ ] **Step 3: Run the E2E suite (`npm run test:e2e`, or CI).** Expected: 69/69. This proves the move changed nothing.
- [ ] **Step 4: Commit** `refactor(js): organise source by tool`.

### Task 3: Settings becomes its own window

Do this while the app still has one panel, so the Settings change is reviewed on its own.

**Files:**
- Create: `macos/DevUtility-macOS/Settings/SettingsWindowController.swift`
- Create: `src/settings/SettingsWindow.tsx` (the RN root `Settings`, which renders `SettingsScreen` for the still-single `toggleApp` shortcut)
- Modify:
  - `index.js`: register `Settings`.
  - `AppDelegate.mm`: create the `Settings` root through `rootViewFactory`.
  - `KeyEventModule.swift`:
    - ⌘, opens Settings natively.
    - The module acts only when the key window is the tool panel; otherwise events pass through.
  - `PanelManager.swift`: right-click menu gets `Settings…`.
  - `src/App.tsx`, `TopHeader.tsx`: the Settings tab and gear are removed.
- Test:
  - `Pages/SettingsWindow.swift` (new; replaces `SettingsTab.swift`).
  - `Specs/SettingsTests.swift`.
  - `Specs/PageObjectSmokeTests.swift`.
  - `KeyboardNavigationTests.swift` (the ⌘, test).
  - `KeyboardFocusTests.swift` (the recorder spec opens Settings with ⌘, already).

**Interfaces:**
- Produces: `@objc final class SettingsWindowController: NSObject` with `@objc static let shared`, `func setUp(rootView: NSView)`, `@objc func show(openedFromToolId: String?)`, `var openedFromToolId: String? { get }` (cleared when the window closes), `var window: NSWindow`.

- [ ] **Step 1: Write the failing E2E specs in `SettingsTests`.**
  - `test_commandCommaOpensSettingsInFrontAndKey`: assert the window `settings.window` exists, `isHittable` is true, and typing into the recorder is accepted.
  - `test_settingsMenuItemOpensSettings`: right-click the icon, then click `Settings…`.
  - `test_openingSettingsTwiceKeepsOneWindow` (Review Focus 4): `app.windows.matching(identifier: "settings.window").count == 1` after ⌘, twice and after `Settings…`.
  - `test_keysTypedInSettingsAreNotInterceptedByThePanel`: with the panel open, press ⌘, then ↓ and Return inside the recorder. The panel's selection stays at row 0 and the pasteboard stays empty (`Pasteboard.staysEmpty`).
  - Move the existing `SettingsTests` to the new `SettingsWindow` page object; their assertions are unchanged.
- [ ] **Step 2: Run them.** Expected: FAIL (no `settings.window`).
- [ ] **Step 3: Implement.**
  - The controller's window uses the Rulings values, sets accessibility id `settings.window`, and has `isReleasedWhenClosed = false`.
  - `show` re-centers the window only when it isn't already visible.
  - `KeyEventModule` checks `NSApp.keyWindow is UtilityPanel` before handling any key.
- [ ] **Step 4: Run the whole E2E suite.** Expected: all green, including the migrated specs. `test_commandCommaOpensSettings` and `test_everyTabOpensFromTheHeader` become the window versions above (Settings is no longer a tab).
- [ ] **Step 5: Commit** `feat(settings): open settings in its own window`.

### Task 4: One panel, icon and shortcut per tool

**Files:**
- Create:
  - `macos/DevUtility-macOS/Panels/ToolPanelController.swift`.
  - `macos/DevUtility-macOS/Panels/ToolPanel.swift`: the step-3 `UtilityPanel` moved here and renamed, with `let toolId: String`.
  - `macos/DevUtility-macOS/Bridge/ToolPanelModule.swift`.
  - `macos/DevUtility-macOS/Bridge/ToolShortcuts.swift`: `KeyboardShortcuts.Name` per tool id.
  - `src/tools/clipboard/ClipboardTool.tsx`, `ClipboardHeader.tsx`, `src/tools/snippets/SnippetsTool.tsx`, `SnippetsHeader.tsx`, `src/shared/native/ToolPanel.ts`.
- Move into `Bridge/`: `GlobalShortcutModule.swift`, `KeyEventModule.swift` and `ShortcutRecorderViewManager.swift` (with their `.m` bridges). Move `PanelPresenter.swift` into `Panels/`.
- Delete: `PanelManager.swift`, `src/App.tsx`, `src/shared/components/TopHeader.tsx`.
- Modify:
  - `AppDelegate.mm`: one root per tool, no panel at launch, `--e2e-reset` resets both tool shortcuts.
  - `index.js`.
  - `StorageResetGate`: `resetStorageOnce()`.
  - `GlobalShortcutModule`: `getShortcut(toolId)`, `resetShortcut(toolId)`, and `constantsToExport` `{tools: [{id, displayName, defaultShortcutLabel}]}`.
  - `ShortcutRecorderViewManager`: a `toolId` prop, accessibility id `settings.shortcut.<toolId>`.
  - `SettingsScreen`: one row per tool from the constants.
  - `useKeyboardShortcuts`: takes a `toolId` and ignores events tagged with another tool.
  - `KeyEventModule`:
    - Tags every event with `toolId` taken from `NSApp.keyWindow as? ToolPanel`.
    - `onNavigate` and ⌘1/⌘2/⌘3 are removed.
    - `hidePanel` moves to `ToolPanelModule.hide(toolId)`.
- Test:
  - Pages: `ClipboardPanel.swift` and `SnippetsPanel.swift` replace `MainPanel`, `ClipboardTab` and `SnippetsTab`. `MenuBar` takes `icon(for toolId:)`.
  - `AppLauncher`: passes `--e2e-skip-onboarding` and waits for both status items, not a visible panel.
  - New `Specs/PanelBehaviorTests.swift`.
  - Migrate every existing spec to the new pages:
    - `GlobalShortcutTests`: `⌃⌥V` and `⌃⌥S`, each toggling only its tool.
    - `MenuBarTests`: one test per icon.
    - `ResetFlagTests`: resets both shortcuts.
    - `KeyboardFocusTests`: open the tool directly instead of switching tabs.
    - Delete `test_commandOneAndTwoSwitchBetweenClipboardAndSnippets`, since the spec removes ⌘1/⌘2. Say so in the PR body.

**Interfaces:**
- Consumes: `ToolDefinition`, `ToolRegistry`, `PanelPresenter(panel:)`.
- Produces:
  - `final class ToolPanelController` with `init(tool: ToolDefinition, rootView: NSView)`, `func toggle()`, `func show()`, `func hide()`, `var isVisible: Bool`, `var panel: ToolPanel`.
  - `@objc final class ToolPanels: NSObject`: the `@objc static let shared` registry of controllers, with `@objc func setUp(rootViews: [String: NSView])`, `func controller(for toolId: String) -> ToolPanelController?` and `func visiblePanels(excluding toolId: String) -> [ToolPanel]`.
  - JS: `ToolPanel.hide(toolId: ToolId): void` and `useKeyboardShortcuts(toolId: ToolId, handlers)`.

- [ ] **Step 1: Write the failing E2E specs in `PanelBehaviorTests`.**
  - `test_eachToolHasItsOwnIcon`.
  - `test_clipboardIconTogglesOnlyClipboard`.
  - `test_snippetsIconTogglesOnlySnippets`.
  - `test_bothPanelsCanBeOpenAtOnce`.
  - `test_keysReachOnlyTheKeyPanel`: Snippets is key, ↓ moves the Snippets selection, and Clipboard's selection stays at row 0.
  - `test_noPanelOpensAtLaunch`: `staysHidden(for: 2)` on both windows.
  - `test_shortcutOnAVisibleButNotKeyPanelBringsItToFront` (Review Focus 1).
  - `test_shortcutsForBothToolsInQuickSuccessionOpenBoth` (Review Focus 2: post ⌃⌥V then ⌃⌥S with no wait between them).
  - `test_rightClickMenuOffersOpenSettingsAndQuit`: the items `Open Clipboard`, `Settings…` and `Quit DevUtility`, each one working.

  In `GlobalShortcutTests`, write `test_clipboardShortcutTogglesOnlyClipboard` and `test_snippetsShortcutTogglesOnlySnippets`.
- [ ] **Step 2: Run them.** Expected: FAIL (`statusItem.clipboard` missing).
- [ ] **Step 3: Implement.**
  - Panels open centered for now. Task 5 adds the per-tool rules.
  - `ToolPanelController` builds its `ToolPanel`:
    - Configured like today's panel, with `tool.size` and `tool.minimumSize`.
    - Accessibility id `<toolId>.window`.
  - It builds its status item:
    - Accessibility id `statusItem.<toolId>`.
    - Icon from `tool.icon`.
    - Left-click toggles; right-click shows the menu.
  - It registers `KeyboardShortcuts.onKeyDown(for: ToolShortcuts.name(for: tool.id))`.
  - Debounce is per controller.
  - `toggle()`: visible and key → `hide()`; visible and not key → `show()`; hidden → `show()`.
  - Each JS root mounts at launch inside its hidden panel.
  - ⌘, now passes the key panel's `toolId` to `SettingsWindowController.show(openedFromToolId:)` (Task 3 passed `nil`).
- [ ] **Step 4: Run the whole E2E suite and `npm run test:all`.** Expected: green, with the migrated specs passing with only page-object navigation changes.
- [ ] **Step 5: Commit** `feat(panels): give each tool its own panel, icon and shortcut`.

### Task 5: Opening positions and sizes

**Files:**
- Modify: `Panels/ToolPanelController.swift` (`show()` uses `PanelFrameCalculator` with `NSEvent.mouseLocation` and `NSScreen.screens`, and resets to `tool.size` on every show).
- Modify: `macos/DevUtilityE2ETests/Support/Mouse.swift` (add `static func move(to point: CGPoint)`, which posts a HID `mouseMoved`).
- Test: `Specs/PanelBehaviorTests.swift`.

- [ ] **Step 1: Write the failing specs.** XCUITest frames use top-left screen coordinates, the same as `CGEvent`. Allow a 2 pt tolerance.
  - `test_clipboardOpensWithItsTopLeftAtTheMousePointer`.
  - `test_clipboardStaysInsideTheScreenNearTheBottomRightCorner`.
  - `test_clipboardIconOpensItJustBelowTheMenuBar`: `minY` equals `NSScreen.main!.frame.maxY - visibleFrame.maxY`.
  - `test_snippetsOpensCentered`.
  - `test_defaultSizesAre560x420And800x600`.
  - `test_panelsResizeDownToTheirMinimumAndReopenAtTheDefaultSize`: drag the bottom-right corner far up and to the left, assert 420×300 and 480×360, then hide, reopen and assert the defaults.
- [ ] **Step 2: Run them.** Expected: FAIL (Clipboard opens centered at 800×600).
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the whole E2E suite.** Expected: green.
- [ ] **Step 5: Commit** `feat(panels): open each tool where its rule says, at its default size`.

### Task 6: Closing rules

**Files:**
- Create: `macos/DevUtility-macOS/Panels/PanelDismissal.swift`, which owns the global and local mouse-down monitors for one controller and asks `OutsideClickRule.shouldClose`.
- Modify:
  - `ToolPanelController`: installs `PanelDismissal` on show and removes it on hide. `hide()` makes the first panel from `ToolPanels.shared.visiblePanels(excluding:)` key; if there is none, it hands focus back through `PanelPresenter`.
  - `PanelPresenter`: add `hideKeepingFocus()`, used when another panel takes key.
  - `SnippetsHeader.tsx`: a ✕ button `snippets.header.close` that calls `ToolPanel.hide('snippets')`.
- Test: `Specs/PanelBehaviorTests.swift`.

**Interfaces:**
- Consumes: `ClickLocation` and `OutsideClickRule` (Task 1), `SettingsWindowController.openedFromToolId` (Task 3).
- `PanelDismissal` maps the window of a local click to a `ClickLocation`:
  - Its own panel → `.ownPanel`.
  - A window whose `sheetParent === panel`, or `NSApp.modalWindow` → `.ownSheetOrAlert`.
  - The Settings window while `openedFromToolId == tool.id` → `.settingsOpenedFromThisPanel`.
  - Its own status item's window → `.ownStatusItem`.
  - Any other window → `.otherDevUtilityWindow`.
  - Every global click → `.otherApp`.

- [ ] **Step 1: Write the failing specs.**
  - `test_clipboardClosesOnAClickInAnotherApp`.
  - `test_clipboardClosesOnAClickOnTheDesktop`: click Finder's desktop through `Mouse.click(at:)` on an empty screen area.
  - `test_clipboardClosesOnAClickOnTheSnippetsPanel`.
  - `test_snippetsStaysOpenOnOutsideClicks`: `staysVisible(for: 2)` after clicks in another app and in Clipboard.
  - `test_clipboardStaysOpenForItsOwnIconClearAllAlertAndCommandComma`.
  - `test_snippetsCloseButtonClosesIt`.
  - `test_closingClipboardWhileSnippetsIsOpenMakesSnippetsKey` (Review Focus 3): typing after Esc goes into `snippets.search`, and `OtherApp.isFrontmost` is false.

  Keep the step-3 specs `test_hidingThePanelAfterAClickInsideItGivesFocusBackToTheOtherApp` and `test_clearAllAlertWorksWhileAnotherAppIsFrontmost` green.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the whole E2E suite.** Expected: green.
- [ ] **Step 5: Commit** `feat(panels): close each tool by its own rule`.

### Task 7: Keyboard rules per tool

**Files:**
- Create:
  - `src/tools/clipboard/clipboardEscape.ts` and `src/tools/snippets/snippetsEscape.ts`.
  - `__tests__/clipboardEscape.test.ts` and `__tests__/snippetsEscape.test.ts`.
  - `src/tools/clipboard/clipboardShortcuts.ts` and `src/tools/snippets/snippetsShortcuts.ts` (help data that replaces `src/shared/data/shortcuts.ts`).
- Modify:
  - `KeyEventModule`: ⌘F is emitted only when the key panel is `snippets`. Add event `onPanelShown` `{toolId}`, emitted by `ToolPanelController.show()`.
  - `ClipboardTool.tsx` and `SnippetsTool.tsx`: Esc goes through the pure functions; Snippets focuses search on `onPanelShown`.
  - `ShortcutsModal`: takes `sections`.
- Test: `KeyboardNavigationTests.swift` and `KeyboardFocusTests.swift`.

**Interfaces:**
- Produces:
  ```ts
  type ClipboardEscapeAction = 'closeSheet' | 'blurEditor' | 'hidePanel';
  function clipboardEscapeAction(state: {isSheetOpen: boolean; isEditorFocused: boolean}): ClipboardEscapeAction;
  type SnippetsEscapeAction = 'closeSheet' | 'closeAddDialog' | 'clearSearch' | 'blurInput' | 'none';
  function snippetsEscapeAction(state: {isSheetOpen: boolean; isAddDialogOpen: boolean; searchText: string; isInputFocused: boolean}): SnippetsEscapeAction;
  ```
- The order of precedence is exactly the order of the union members (the spec's Esc decision).
- The help data:
  - Clipboard rows: `Open / close Clipboard` `⌃ ⌥ V`, `Move selection` `↑ / ↓`, `Copy selected` `Enter`, `Copy stored text` `⌘ Enter`, `Stop editing / close` `Esc`, `Open Settings` `⌘ ,`.
  - Snippets rows: `Open / close Snippets` `⌃ ⌥ S`, `Move selection` `↑ / ↓`, `Focus search` `⌘ F`, `Copy selected` `Enter`, `Copy stored text` `⌘ Enter`, `Clear search / stop editing` `Esc`, `Open Settings` `⌘ ,`.

- [ ] **Step 1: Write the failing Jest tests**, one per branch of each function, including precedence: a sheet open together with search text → `closeSheet`.
- [ ] **Step 2: Write the failing E2E specs.**
  - `test_escapeClosesAnOpenHelpSheetFirst`, in both tools.
  - `test_escapeClosesTheAddDialog`.
  - `test_escapeInClipboardBlursTheEditorThenClosesThePanel`.
  - `test_escapeNeverClosesSnippets`: `staysVisible(for: 1)` after three Escs.
  - `test_commandFInClipboardDoesNothing`.
  - `test_snippetsOpensWithSearchFocused`: type right after the shortcut, with no ⌘F.
  - `test_eachHelpSheetListsOnlyItsToolsShortcuts`.

  Update `test_commandFFocusesSnippetSearchFromAnotherTab` to "from the detail editor" (there are no tabs). `test_shortcutsHelpListsTheShortcuts` becomes the per-tool version.
- [ ] **Step 3: Run `npm run test:unit` and the E2E specs.** Expected: FAIL.
- [ ] **Step 4: Implement.**
- [ ] **Step 5: Run `npm run test:all`.** Expected: green.
- [ ] **Step 6: Commit** `feat(keys): apply each tool's own keyboard rules`.

### Task 8: Shortcut conflicts between tools

**Files:**
- Modify:
  - `Bridge/ShortcutRecorderViewManager.swift`: create `RecorderCocoa(for:onChange:)`. `onChange` reads every tool's current shortcut and calls `ShortcutConflictResolver.toolsToClear`. It runs `KeyboardShortcuts.setShortcut(nil, for:)` for each tool returned, then asks `GlobalShortcutModule` to emit the conflict event.
  - `Bridge/GlobalShortcutModule.swift`: becomes an `RCTEventEmitter` with the event `onShortcutConflict` `{assignedToolId: String, clearedToolIds: [String]}`.
  - `src/settings/SettingsScreen.tsx`:
    - Shows the conflict note (Rulings text, testID `settings.shortcut.<toolId>.conflictNote`).
    - Refreshes every "Current:" label on any change.
    - Shows `Not set` when a shortcut is nil.
- Test: `Specs/SettingsTests.swift`.

- [ ] **Step 1: Write the failing specs.**
  - `test_assigningAnotherToolsShortcutMovesItAndShowsTheNote`: record ⌃⌥S on Clipboard. Snippets' "Current:" becomes `Not set`, the note says `Removed this shortcut from Snippets.`, and ⌃⌥S now toggles Clipboard only.
  - `test_clearingAShortcutLeavesTheToolWithoutOne` (Review Focus 5): click the recorder's clear control. "Current:" shows `Not set`, ⌃⌥V does nothing (`staysHidden(for: 2)`), and the icon still toggles Clipboard.
  - `test_resetRestoresEachToolsOwnDefault`.
- [ ] **Step 2: Run them.** Expected: FAIL. With no resolver, both tools toggle on ⌃⌥S.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the whole E2E suite.** Expected: green.
- [ ] **Step 5: Commit** `feat(settings): move a shortcut between tools instead of sharing it`.

### Task 9: Launch, onboarding, background capture and logged errors

**Files:**
- Modify:
  - `AppDelegate.mm`:
    - On launch, when `hasShownMultiToolOnboarding` is false and `--e2e-skip-onboarding` is absent, call `SettingsWindowController.shared.show(openedFromToolId: nil)` and set the flag.
    - `--e2e-reset` removes the flag.
    - A root that fails to load is logged with `NSLog`, its icon stays, and the other tools keep working.
  - `useClipboardPoller.ts` and the storage services: replace silent `catch` blocks with `console.warn` and a short context message. Behavior is otherwise unchanged.
- Test: `Specs/PanelBehaviorTests.swift` and `Specs/ClipboardHistoryTests.swift`.

- [ ] **Step 1: Write the failing specs.**
  - `test_firstLaunchOpensSettingsOnceAndLaterLaunchesDoNot`: launch with `--e2e-reset` only and assert `settings.window`. Then relaunch with no flags and assert `staysHidden(for: 2)`.
  - `test_copiesAreCapturedBeforeTheClipboardPanelWasEverOpened`: copy right after launch, then open Clipboard; the row is there.
- [ ] **Step 2: Run them.** Expected: the onboarding spec fails. The capture spec may already pass, because Task 4 mounts every root at launch. If it does, prove it can fail: on a throwaway `ci/*` branch, mount the Clipboard root only on first show, run CI, then delete the branch (`CLAUDE.project.md` rule).
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `npm run test:all`.** Expected: green.
- [ ] **Step 5: Commit** `feat(app): open settings once after the update and log load errors`.

### Task 10: Docs and the final verification

**Files:**
- Modify:
  - `README.md`: tools, shortcuts, how to open and close each one.
  - `CLAUDE.project.md`:
    - The new commands.
    - Page objects per tool.
    - The `--e2e-skip-onboarding` flag.
    - Replace the gotcha "reach a screen by keyboard when a spec must keep the app inactive" with its per-tool version.
  - The spec: set Status to `implemented (step 4)` and update the E2E structure lines to match the real page names.

- [ ] **Step 1: Write the doc changes.**
- [ ] **Step 2: Run `npm run test:all` locally if the screen is unlocked, and in CI on the branch's head commit either way.** Expected: lint, typecheck, Jest, native unit tests and every E2E spec green. Paste the counts into the PR body.
- [ ] **Step 3: Commit** `docs: describe the separate tools and their shortcuts`.
- [ ] **Step 4: Open the PR** with title `feat(panels): split clipboard and snippets into separate tools`. The body says what changed, why, how it was tested, the deleted ⌘1/⌘2 spec and the Rulings. Then run `h-pr-review`.
