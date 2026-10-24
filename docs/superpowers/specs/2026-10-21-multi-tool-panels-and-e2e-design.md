# Multi-tool panels and end-to-end testing: design

Date: 2026-10-21 (revised 2026-10-22 after spec review)
Status: approved (review delegated by the developer to a reviewer agent; findings applied)

## Goal

DevUtility today is one floating panel with tabs (Clipboard, Snippets, Settings) behind one global
shortcut (`⌃⌥D`). Two problems:

1. Opening it often needs a second click: on macOS 14+ the panel appears but ignores the keyboard
   until clicked.
2. The tools are bundled together. The developer wants to open exactly the tool they need, from its
   own menu-bar icon or shortcut, with each tool behaving in its own way, and to keep adding tools.

Alongside this, the repo has no tests. All manual testing should be replaced by an end-to-end suite
that drives the real app (clicks, typing, scrolling, global shortcuts, clipboard), and all future work
in this repo is test-driven.

## Success criteria

- One click on a tool's icon, or one press of its shortcut, opens exactly that tool, as the key
  window, ready for keyboard input (see "Ready for input"), every time.
- Each tool opens where its rule says and closes the way its rule says.
- Adding a tool means one registry entry, one JS folder and an icon.
- `npm run test:all` runs lint, Jest, Swift unit tests and the full XCUITest suite against a real
  build of the app, locally and in CI, and the suite covers every behavior in the test catalogue.

## Product decisions

| Topic | Decision |
|---|---|
| App shape | One app process. Each tool has its own menu-bar icon, floating `NSPanel` and global shortcut. |
| Tools | Clipboard history, Snippets. Settings is a separate window, not a tool. |
| Opening position | Clipboard: panel's top-left at the mouse pointer, clamped to stay fully inside the `visibleFrame` of the screen the mouse is on (an icon click, with the pointer in the menu bar, therefore opens just below the menu bar). Snippets: centered in the `visibleFrame` of the screen the mouse is on. Positions are not remembered. |
| Panel size | Clipboard 560×420 (minimum 420×300), Snippets 800×600 (minimum 480×360). Both resizable; size is not remembered. |
| Menu-bar icons | All tool icons always visible. Left-click toggles that tool. Right-click menu: `Open <Tool>`, `Settings…`, separator, `Quit DevUtility`. Clipboard gets a new clipboard glyph; Snippets keeps `</>`. Both are template images. |
| Default shortcuts | Clipboard `⌃⌥V`, Snippets `⌃⌥S`. The old `toggleApp` shortcut (`⌃⌥D`) is retired and not migrated. |
| Shortcut conflicts | Assigning a shortcut already used by another tool clears it from that tool and shows a note naming it. |
| Settings | One normal window, opened by `Settings…` or `⌘,` from any panel. Lists each tool with a shortcut recorder and a Reset button. Always opens in front of any tool panels (see Architecture). |
| Multiple panels | Any number may be open. Keyboard input goes to the key panel only. |
| Closing: Clipboard | A click anywhere outside it (another app, the desktop, or another DevUtility panel), its shortcut, its icon, or `Esc` (see "Esc"). It does **not** close for: a click on its own menu-bar icon (that is the icon's toggle), its own confirmation alert ("Clear all"), or opening Settings via `⌘,`. |
| Closing: Snippets | Its ✕ header button, its shortcut or its icon. `Esc` never closes it. Stays open while other apps are used. |
| Esc | Every list always has a selected row (the first row is auto-selected), so "clearing the selection" is not a step. Clipboard: if the detail editor has focus, `Esc` removes focus from it; otherwise it closes the panel. Snippets: if the search has text, `Esc` clears it; else if an input has focus, `Esc` removes focus; otherwise nothing. An open `?` sheet or add dialog is closed by `Esc` first, in every tool. |
| In-panel keys | `↑/↓` move the selection (in a multiline editor they move the cursor instead). `Enter` copies the selected item when no text input has focus; `⌘Enter` always copies the selected item's **stored** text (not an unsaved draft). `⌘F` focuses search (Snippets only). `⌘,` opens Settings. `⌘1/2/3` are removed. |
| Ready for input | Clipboard: the panel is key and `↑/↓/Enter` act on the list immediately. Snippets: the panel is key and the search field has focus, so typing filters immediately. |
| Panel headers | Clipboard: `Clear all`, `?`. Snippets: `+ Add`, `?`, `✕`. Each `?` sheet lists only that tool's shortcuts. |
| Background capture | Clipboard captures copies from launch, whether or not its panel has ever been opened. |
| Launch | No panel opens at launch. The first launch after this update opens Settings once; the flag is stored in `UserDefaults` (`hasShownMultiToolOnboarding`) and cleared by `--e2e-reset`. |
| Data | Storage keys are unchanged, so existing clipboard history and snippets carry over. The production bundle ID (`org.reactjs.native.DevUtility`) is unchanged for the same reason. |

## Focus bug

Original hypothesis: `PanelManager.show()` calls `NSRunningApplication.current.activate(options: [])`
on macOS 14+; activation is cooperative and may be declined, so the panel never becomes key.

Spike finding (2026-10-22), which supersedes that hypothesis as the primary cause: the bug
reproduces even with DevUtility active. With the Snippets tab open, the app logged
`panelKey=1 appActive=1`, the first responder was the field editor of `RCTUITextField`
`snippets.search` (editable), and the key events `a`, `b`, `c` reached that window and were passed
through by `KeyEventModule`, yet no text was committed. After one click on the field, typing worked.
So the keystrokes are lost when a React Native text input receives focus programmatically
(`searchInputRef.current?.focus()` on mount / `⌘F`), not because the window is not key. Step 3 finds
the exact cause with systematic debugging, driven by the E2E test "type immediately after opening,
no click".

The non-activating-panel change below is still kept for the other-app-frontmost path, where the
spike showed the panel does become key without app activation.

Fix direction for window focus: the panel is created with `[.nonactivatingPanel, .titled, .fullSizeContentView]` in its style
mask at init (toggling `.nonactivatingPanel` later is unreliable in AppKit), keeps
`canBecomeKey = true`, and is shown with `makeKeyAndOrderFront(nil)` with **no** app activation:
a non-activating panel takes key status without activating the app, which is exactly what the
cooperative-activation rules allow. If the panel is still not key on the next runloop turn, call
`makeKey()` once and log the failure. The show/hide logic lives in a reusable unit so step 4 moves
it into `ToolPanelController` rather than rewriting it. The E2E test that presses keys immediately
after opening the panel, while another app is frontmost, decides whether the fix works.

Root cause (step 3, 2026-10-24): on CI the lost keys came from the original hypothesis after all.
Right after launch the app is inactive, `activate(options: [])` was declined, and the panel was
never key (`active=0 keyWindow=nil`, frontmost app Calculator or Finder). The spike's text-field
symptom did not reproduce once keys were posted at the HID level, as a real keyboard posts them:
XCUITest's `typeKey`/`typeText` activate the app first, which hid the bug in both directions. The
non-activating panel above fixed every typing and arrow-key spec. `KeyEventModule` reads the
event's own window instead of `NSApp.keyWindow`, which is nil while the app is inactive.

Accepted limit: a mouse-down inside the panel makes the window server activate DevUtility
(`-[NSApplication _handleActivatedEvent:]`, before the app sees the click). It happens with
`canBecomeMain` false too, and no app code can veto it. So opening the panel and pressing keys in
it never activate the app, but clicking in it does. To limit the cost, hiding the panel hands focus
back to the app that was frontmost when it opened, except when the panel hid because the user
clicked another app.

## Architecture

### Native (Swift), by feature

```
macos/DevUtility-macOS/
  Tools/
    ToolDefinition.swift          id, display name, icon, default shortcut, size, OpeningPosition, ClosingRule
    ToolRegistry.swift            ordered list of tools; adding a tool = one entry
  Panels/
    ToolPanelController.swift     one per tool: its NSPanel, status item, hotkey, show/hide/toggle
    PanelFrameCalculator.swift    pure: (OpeningPosition, mouse point, screen visibleFrame, size) -> NSRect
    PanelDismissal.swift          applies ClosingRule (see "Outside-click detection")
  Settings/
    SettingsWindowController.swift  NSWindow hosting the Settings RN root
    ShortcutConflictResolver.swift  pure: (tool, new shortcut, current assignments) -> tools to clear
  Bridge/
    GlobalShortcutModule.swift    get/reset per tool id; emits `onShortcutConflict` to JS
    KeyEventModule.swift          emits key events tagged with the key panel's tool id
    ShortcutRecorderViewManager.swift  recorder bound to a tool id
  AppDelegate.mm                  starts one RN bridge, creates a root view per tool and for Settings
```

`PanelManager.swift` is replaced by `ToolPanelController`. `AppDelegate` keeps subclassing
`RCTAppDelegate` for bridge setup but overrides window creation so no default window is made; it
then creates each root with `[[RCTRootView alloc] initWithBridge:self.bridge moduleName:<tool id>
initialProperties:nil]`. **All tool roots are created and mounted at launch** (panels hidden), so the
Clipboard poller runs from launch.

`ToolDefinition` uses enums so behavior is declared, not coded per tool:

```swift
enum OpeningPosition { case atMousePointer, centeredOnMouseScreen }
enum ClosingRule { case closesOnOutsideClick, closesOnlyExplicitly }
```

`PanelFrameCalculator` works in AppKit coordinates (origin bottom-left): "top-left at the mouse"
means `origin = (mouse.x, mouse.y - height)`, then clamped into `visibleFrame`.

### Outside-click detection

`NSEvent.addGlobalMonitorForEvents` only sees clicks delivered to other apps. For
`.closesOnOutsideClick`, `PanelDismissal` uses both:

- a global mouse-down monitor (clicks in other apps or the desktop), and
- a local mouse-down monitor that closes the panel when the click's window is another DevUtility
  panel or window.

Exemptions: clicks on the tool's own status item, on the panel's own sheets or alerts, and the
Settings window when it was opened from this panel by `⌘,`.

### Keyboard routing

`KeyEventModule`'s local monitor acts only when the key window is a tool panel. It tags each event
with that panel's tool id. In any other window (Settings, the shortcut recorder, system alerts) the
event passes through untouched. Each JS root ignores events whose `toolId` is not its own.

### Settings window in front of floating panels

Tool panels use the `.floating` window level. The Settings window uses a level one above it
(`NSWindow.Level(rawValue: NSWindow.Level.floating.rawValue + 1)`) and is shown with
`makeKeyAndOrderFront`, so it always appears in front and receives keyboard input without depending
on app activation (the app is `LSUIElement`, with no Dock icon). The spike confirms this; the E2E
suite checks Settings is frontmost and key after `⌘,` from Snippets.

### JS, by feature

```
src/tools/clipboard/   ClipboardTool.tsx (RN root) + its components, hooks, services
src/tools/snippets/    SnippetsTool.tsx (RN root) + its components, hooks, services
src/settings/          SettingsWindow.tsx
src/shared/            theme, list navigation, copy feedback, native module wrappers
index.js               registers 'ClipboardTool', 'SnippetsTool', 'Settings'
```

The native `ToolRegistry` owns tool ids; each JS root is registered under the same name.

### Error handling

- A tool whose RN root fails to load logs the error and leaves its icon in place; other tools keep
  working.
- Shortcuts that clash with system shortcuts are reported by the `KeyboardShortcuts` recorder's own
  built-in alert. (Version 2.4.0 does not report hotkey registration failures through its API, so
  there is no separate "could not register" state.)
- A clash between two tools is resolved by `ShortcutConflictResolver` (needed because the library
  fires both handlers for duplicate shortcuts) and reported to JS through `onShortcutConflict`.
- Storage read errors and clipboard read errors (including `useClipboardPoller`'s empty `catch`) fall
  back as today but are logged instead of silently swallowed.

## Testing

All work is test-driven: a failing test first (E2E for user-visible behavior, unit for pure logic),
then the code.

### Layers

| Layer | Tool | Covers | Command |
|---|---|---|---|
| JS unit | Jest (with the AsyncStorage jest mock configured) | search filter, history limit and de-duplication, list navigation, `Esc` logic, storage | `npm test` |
| Swift unit | XCTest (`DevUtilityNativeTests`) | panel frame calculation (edges, multiple screens), closing rules, conflict resolution | `npm run test:native` |
| End-to-end | XCUITest (`DevUtilityE2ETests`) | the real app: clicks, typing, scrolling, global shortcuts, system clipboard, relaunch persistence | `npm run test:e2e` |
| All | | lint + all of the above | `npm run test:all` |

Detox and Maestro do not support macOS. Appium's mac2 driver is XCUITest underneath with a server
and driver layer on top, so XCUITest is used directly.

### E2E build

A new `E2E` build configuration, copied from Release:

- JS bundled into the app (no Metro).
- Bundle ID `org.reactjs.native.DevUtility.e2e`, so its storage and shortcuts are separate from the
  installed app.
- Launch flags: `--e2e-reset` clears AsyncStorage, shortcuts and the onboarding flag at startup;
  `--e2e-skip-onboarding` suppresses the first-launch Settings window.

`npm run test:e2e` builds this configuration, quits any running DevUtility, runs the suite and keeps
the `.xcresult` bundle (with failure screenshots).

### E2E structure

```
macos/DevUtilityE2ETests/
  Support/  AppLauncher, Pasteboard, Keyboard and Mouse (HID-level input), OtherApp
  Pages/    MenuBar, ClipboardPanel, SnippetsPanel, SettingsWindow
  Specs/    ClipboardHistoryTests, SnippetsTests, KeyboardNavigationTests,
            PanelBehaviorTests, GlobalShortcutTests, SettingsTests,
            KeyboardFocusTests (keys right after opening, with another app frontmost)
```

- React Native `testID`s map to accessibility identifiers, named `<area>.<element>[.<index>]`
  (`clipboard.row.0`, `snippets.search`, `settings.shortcut.clipboard`). Each menu-bar
  `NSStatusBarButton` gets `statusItem.<toolId>` (today's single icon: `statusItem.app`). Only page
  objects reference these names. There are no `testID`s in `src/` today, so step 2 adds them to
  product code.
- `AppLauncher` clears `NSPasteboard.general` before every launch, so the poller never captures
  leftover clipboard content.
- Tests wait for conditions (up to ~5s, covering the 2s clipboard poll), never fixed sleeps.
- `Keyboard` sends key presses with `XCUIElement.typeKey` only, so CI needs no Accessibility grant.
  If the spike shows `typeKey` cannot trigger the global hotkey, global-shortcut tests use a
  `CGEvent` sender instead, run locally (with a one-time Accessibility grant) and are skipped on CI
  with an explicit skip message; the developer is told.

One-time local setup: `automationmodetool enable-automationmode-without-authentication`.

### Test catalogue

- Unmarked tests are written in step 2 against today's app and pass there.
- **[step 3]** tests are written first in step 3 (focus fix).
- **[new]** tests are written in step 4, before their code.
- **[changes in step 4]** tests pass in step 2 and are updated in step 4 where a product decision
  changes the behavior.

Every other step-2 test keeps passing after step 4 with only page-object navigation changes.

**ClipboardHistoryTests**
- copied text appears at the top of the history
- an empty history shows the empty state
- copying the same text twice in a row does not add a second entry (only consecutive repeats are
  skipped; the same text copied again later is added again)
- re-copying a history row does not add a duplicate entry
- a 16th item evicts the oldest; 15 are kept
- long text is truncated in the list and shown in full in the detail view
- a row's copy button puts its text on the clipboard and shows "Copied!"
- editing in the detail view then Copy copies the edited text without saving it
- editing then Save updates the row
- history survives quitting and relaunching
- Clear all asks for confirmation; Cancel keeps history, confirming empties it
- the list scrolls to reach older items
- copying a snippet adds its content to the clipboard history
- **[new]** copies are captured before the Clipboard panel has ever been opened

**SnippetsTests**
- adding a snippet (title, description, content, tags) shows it at the top
- adding without title or content is blocked (Save disabled)
- Cancel in the add dialog saves nothing
- search matches title, description and tags, case-insensitively, and does not match content
- a search with no results shows "No matching snippets"; no snippets shows "No snippets yet"
- copying a snippet puts its content on the clipboard
- editing content and saving persists across relaunch
- delete asks for confirmation; confirming removes the snippet
- a long list scrolls

**KeyboardNavigationTests**
- `↑/↓` move the selection
- `↑/↓` inside the detail editor move the cursor, not the selection
- `Enter` copies the selected item when no input has focus; `Enter` inside an input does not copy
- `⌘Enter` copies the selected item's stored text, not an unsaved draft
- `Esc` in Snippets clears the search text **[changes in step 4: `Esc` focus/close rules per the Esc decision]**
- `⌘F` focuses Snippets search **[changes in step 4: no longer switches tabs; Snippets only]**
- the `?` sheet lists the shortcuts
- **[new]** `Esc` closes an open `?` sheet or add dialog
- **[new]** `Esc` in Clipboard removes editor focus, then closes the panel
- **[new]** `Esc` never closes Snippets
- **[step 3]** keys work immediately after opening the panel while another app is frontmost, without clicking it

**PanelBehaviorTests [new]**
- one icon per tool; left-click toggles only that tool
- Clipboard opens at the mouse pointer and stays inside the screen near edges; an icon click opens it just below the menu bar; Snippets opens centered
- default sizes are 560×420 and 800×600; panels can be resized down to their minimum and reopen at the default size
- Clipboard closes on a click in another app, on the desktop, and on the Snippets panel; Snippets does not close on outside clicks
- Clipboard does not close for its own icon click, its "Clear all" alert, or `⌘,`
- the Snippets ✕ button closes it
- both panels open at once; keys reach only the key panel
- right-click menu shows Open / Settings… / Quit and each item works
- no panel opens at launch; the first launch opens Settings once and later launches do not
- Snippets opens with the search field focused

**GlobalShortcutTests**
- the default shortcut toggles the panel **[changes in step 4: `⌃⌥V` and `⌃⌥S`, each toggling only its tool]**
- the shortcut works while another app is frontmost

**SettingsTests**
- recording a new shortcut takes effect immediately and the old one stops working
- Reset restores the default **[changes in step 4: per-tool defaults]**
- a custom shortcut survives relaunch
- **[new]** `⌘,` and `Settings…` open the Settings window, frontmost and key, in front of Snippets
- **[new]** assigning another tool's shortcut clears it from that tool and shows the note
- **[new]** keys typed in Settings are not intercepted by tool panels

### CI

`.github/workflows/test.yml` runs on `macos-26` for every pull request and push to `main`:
`npm ci`, pod install, enable automation mode, `npm run test:all`. On failure it uploads the
`.xcresult` and screenshots. Once green, it becomes a required check on `main` (with the
developer's confirmation). The repository is public, so standard GitHub-hosted runners are free.

## Delivery order

Each step is its own branch and pull request, reviewed with `h-pr-review` before merge.

1. **Feasibility spike (throwaway).** Confirm:
   - XCUITest `typeKey` can trigger a global hotkey registered by `KeyboardShortcuts` (else `CGEvent`
     fallback);
   - XCUITest can click a menu-bar status item found by accessibility identifier;
   - RN `testID`s are found as accessibility identifiers;
   - one RN bridge can drive two root views in separate panels;
   - the Settings-window level approach puts it in front of a floating panel and makes it key;
   - the E2E build (RN-macOS 0.76, Xcode 26, ad-hoc signed, sandboxed entitlements) builds and
     the UI tests run on the `macos-26` GitHub runner.

   Any failure is reported to the developer before step 2.

   **Results (2026-10-22, local, Xcode 26.3, macOS 26.3):**
   - ✅ UI test target added with the `xcodeproj` Ruby gem (bundled with CocoaPods); needs
     `PRODUCT_NAME = $(TARGET_NAME)`. Tests run with `xcodebuild test -configuration Release`.
   - ✅ RN `testID` found as an accessibility identifier (`header.tab.snippets`, a button).
   - ✅ Status item found via `app.statusItems["statusItem.app"]`; clicks toggle the panel.
   - ✅ `typeKey` sent through another app (`XCUIApplication(bundleIdentifier:).typeKey`) triggers
     the `KeyboardShortcuts` global hotkey; `CGEvent` posting does not (no Accessibility grant) and
     is not needed. Typing through Finder costs ~30s per call (Finder idle wait), so the "other app"
     used by tests must be a lightweight one; step 2 picks it.
   - ✅ `rootViewFactory.viewWithModuleName:` creates a second RN root from the same bridge; both
     render and are hittable.
   - ✅ A window at `.floating + 1` is in front of floating panels and hittable.
   - ⚠️ Keyboard input to programmatically focused fields is lost until a click (see "Focus bug").
     This affects the Settings window too, so the Settings design follows step 3's fix.
   - ⚠️ After a click, the first character typed can be dropped; page objects click, wait for
     keyboard focus, then type.
   - ⏭ The CI run on `macos-26` is moved to step 2's first task (needs the workflow pushed).
   - Note: until the `E2E` configuration exists, test runs use the production bundle ID and so the
     developer's real data container; step 2 creates the separate bundle ID first.
2. **E2E foundation + current-app suite.** E2E build configuration, test targets, page objects,
   `testID`s and status-item identifiers in product code, Jest setup (AsyncStorage mock), npm
   scripts, CI workflow, `CLAUDE.project.md` (commands, setup, TDD rule), and every unmarked test in
   the catalogue, green against today's app.
3. **Focus bug fix**, test first, with the show logic in a reusable unit.
4. **Multi-tool restructure**, test first, per the architecture above. Also updates the README
   (shortcuts, features) and the shortcuts help data. New and changed code drops the existing
   change-log-style file headers and docstrings that restate the code.

## Out of scope

- Remembering panel position or size.
- Hiding individual menu-bar icons.
- Editing a snippet's title, description or tags.
- Searching snippet content.
- New tools beyond Clipboard and Snippets.
- Fixing `version-bump.sh` overwriting the CI version line in `build-release.sh` (tracked separately).
