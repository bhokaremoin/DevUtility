# Multi-tool panels and end-to-end testing: design

Date: 2026-10-21
Status: approved in discussion, awaiting spec review

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

- One click on a tool's icon, or one press of its shortcut, opens exactly that tool, focused and
  ready for typing, every time.
- Each tool opens where its rule says and closes the way its rule says.
- Adding a tool means one registry entry, one JS folder and an icon.
- `npm run test:all` runs lint, Jest, Swift unit tests and the full XCUITest suite against a real
  build of the app, locally and in CI, and the suite covers every behavior listed in the test
  catalogue below.

## Product decisions

| Topic | Decision |
|---|---|
| App shape | One app process. Each tool has its own menu-bar icon, floating `NSPanel` and global shortcut. |
| Tools | Clipboard history, Snippets. Settings is a separate window, not a tool. |
| Opening position | Clipboard: panel's top-left at the mouse pointer, pushed inward to stay fully on the screen the mouse is on. Snippets: centered on the screen the mouse is on. Positions are not remembered. |
| Panel size | Clipboard 560×420, Snippets 800×600. Both resizable (minimum 480×360 for Snippets, 420×300 for Clipboard); size is not remembered. |
| Menu-bar icons | All tool icons always visible. Left-click toggles that tool. Right-click menu: `Open <Tool>`, `Settings…`, separator, `Quit DevUtility`. Clipboard gets a new clipboard glyph; Snippets keeps `</>`. Both are template images. |
| Default shortcuts | Clipboard `⌃⌥V`, Snippets `⌃⌥S`. The old `toggleApp` shortcut (`⌃⌥D`) is retired and not migrated. |
| Shortcut conflicts | Assigning a shortcut already used by another tool clears it from that tool and shows a note naming it. |
| Settings | One normal (non-floating) window, opened by `Settings…` or `⌘,` from any panel. Lists each tool with a shortcut recorder and a Reset button. |
| Multiple panels | Any number may be open. Keyboard input goes to the focused panel only. |
| Closing: Clipboard | Click anywhere outside it (including on another DevUtility panel), its shortcut, its icon, or `Esc` once nothing is left to clear. |
| Closing: Snippets | Its ✕ header button, its shortcut or its icon. `Esc` clears search/selection but never closes it. Stays open while other apps are used. |
| In-panel keys | `↑/↓` move selection, `Enter`/`⌘Enter` copy, `Esc` steps back, `⌘F` focuses search (Snippets only), `⌘,` opens Settings. `⌘1/2/3` are removed. |
| Panel headers | Clipboard: `Clear all`, `?`. Snippets: `+ Add`, `?`, `✕`. Each `?` sheet lists only that tool's shortcuts. |
| Launch | No panel opens at launch. The first launch after this update opens Settings once (tracked by a stored flag). |
| Data | Storage keys are unchanged, so existing clipboard history and snippets carry over. The production bundle ID (`org.reactjs.native.DevUtility`) is unchanged for the same reason. |

## Focus bug

Cause: `PanelManager.show()` calls `NSRunningApplication.current.activate(options: [])` on macOS 14+.
Activation there is cooperative, and the frontmost app may decline it, so the floating panel is drawn
but never becomes key.

Fix direction: make the panel a non-activating panel (`.nonactivatingPanel` style) that can still
become key, call `NSApp.activate()` and `makeKeyAndOrderFront`, and verify `isKeyWindow` after
showing. The E2E test that types immediately after opening the panel decides whether the fix works.
The same show logic is reused by every tool's panel controller.

## Architecture

### Native (Swift), by feature

```
macos/DevUtility-macOS/
  Tools/
    ToolDefinition.swift          id, display name, icon, default shortcut, size, OpeningPosition, ClosingRule
    ToolRegistry.swift            ordered list of tools; adding a tool = one entry
  Panels/
    ToolPanelController.swift     one per tool: its NSPanel, status item, hotkey, show/hide/toggle
    PanelFrameCalculator.swift    pure: (OpeningPosition, mouse point, screen frame, size) -> NSRect
    PanelDismissal.swift          applies ClosingRule; installs the outside-click monitor only for .closesOnOutsideClick
  Settings/
    SettingsWindowController.swift  normal NSWindow hosting the Settings RN root
    ShortcutConflictResolver.swift  pure: (tool, new shortcut, current assignments) -> assignments to clear
  Bridge/
    GlobalShortcutModule.swift    get/reset/observe shortcut per tool id
    KeyEventModule.swift          emits key events tagged with the focused tool id
    ShortcutRecorderViewManager.swift  recorder bound to a tool id
  AppDelegate.mm                  starts one RN host, creates a root view per tool and for Settings
```

`PanelManager.swift` is replaced by `ToolPanelController`. `AppDelegate` no longer moves the
template's single window into a panel; it creates one RN root view per registered tool and one for
Settings from a single JS runtime.

`ToolDefinition` uses enums so behavior is declared, not coded per tool:

```swift
enum OpeningPosition { case atMousePointer, centeredOnMouseScreen }
enum ClosingRule { case closesOnOutsideClick, closesOnlyExplicitly }
```

### JS, by feature

```
src/tools/clipboard/   ClipboardTool.tsx (RN root) + its components, hooks, services
src/tools/snippets/    SnippetsTool.tsx (RN root) + its components, hooks, services
src/settings/          SettingsWindow.tsx
src/shared/            theme, list navigation, copy feedback, native module wrappers
index.js               registers 'ClipboardTool', 'SnippetsTool', 'Settings'
```

Each root subscribes to `KeyEventModule` events and ignores events whose `toolId` is not its own.
The native `ToolRegistry` owns tool ids, and each JS root is registered under a matching name.

### Error handling

- A tool whose RN root fails to load logs the error and leaves its icon in place; other tools keep
  working.
- A stored shortcut that can no longer be registered (taken by the system) is shown as unset in
  Settings, with the reason.
- Storage read errors keep today's behavior (fall back to empty) but are logged instead of silently
  swallowed.

## Testing

All work is test-driven: a failing test first (E2E for user-visible behavior, unit for pure logic),
then the code.

### Layers

| Layer | Tool | Covers | Command |
|---|---|---|---|
| JS unit | Jest | search filter, history limit and de-duplication, list navigation, `Esc` step-back, storage | `npm test` |
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
- Launch flags: `--e2e-reset` clears AsyncStorage and shortcuts at startup; `--e2e-skip-onboarding`
  suppresses the first-launch Settings window.

`npm run test:e2e` builds this configuration, quits any running DevUtility, runs the suite and keeps
the `.xcresult` bundle (with failure screenshots).

### E2E structure

```
macos/DevUtilityE2ETests/
  Support/  AppLauncher, Pasteboard, Keyboard (global shortcut sender)
  Pages/    MenuBar, ClipboardPanel, SnippetsPanel, SettingsWindow
  Specs/    ClipboardHistoryTests, SnippetsTests, KeyboardNavigationTests,
            PanelBehaviorTests, GlobalShortcutTests, SettingsTests
```

React Native `testID`s map to accessibility identifiers, named `<area>.<element>[.<index>]`
(`clipboard.row.0`, `snippets.search`, `settings.shortcut.clipboard`). Only page objects reference
them. Tests wait for conditions (up to ~5s, covering the 2s clipboard poll), never fixed sleeps.

One-time local setup: `automationmodetool enable-automationmode-without-authentication`, plus
Accessibility permission for the test runner if the global-shortcut sender needs it.

### Test catalogue

Marked **[new]** are written in step 4, before their code. The rest are written in step 2 against
today's app and must keep passing after the restructure (only page-object navigation changes).

**ClipboardHistoryTests**
- copied text appears at the top of the history
- copying the same text twice in a row does not add a second entry (today's behavior: only
  consecutive repeats are skipped; the same text copied again later is added again)
- an empty clipboard history shows the empty state
- a 16th item evicts the oldest; 15 are kept
- long text is truncated in the list and shown in full in the detail view
- a row's copy button puts its text on the clipboard and shows "Copied!"
- editing in the detail view then Copy copies the edited text without saving it
- editing then Save updates the row
- history survives quitting and relaunching
- Clear all asks for confirmation; Cancel keeps history, confirming empties it
- the list scrolls to reach older items

**SnippetsTests**
- adding a snippet (title, description, content, tags) shows it at the top
- adding without title or content is blocked
- Cancel in the add dialog saves nothing
- search matches title, description, content and tags, case-insensitively
- a search with no results shows the empty state
- copying a snippet puts its content on the clipboard
- editing content and saving persists across relaunch
- delete asks for confirmation; confirming removes the snippet
- a long list scrolls

**KeyboardNavigationTests**
- `↑/↓` move the selection; `Enter` and `⌘Enter` copy the selected item
- `Esc` clears selection or search first; then closes the panel (Clipboard only **[new]**)
- `⌘F` focuses search in Snippets
- the `?` sheet lists that tool's shortcuts and closes on `Esc`
- typing immediately after opening a panel works without clicking it (focus bug, written in step 3)

**PanelBehaviorTests [new]**
- one icon per tool; left-click toggles only that tool
- Clipboard opens at the mouse pointer and stays on-screen near edges; Snippets opens centered
- default sizes are 560×420 and 800×600
- Clipboard closes on an outside click, including a click on the Snippets panel; Snippets does not
- the Snippets ✕ button closes it
- both panels open at once; keys reach only the focused one
- right-click menu shows Open / Settings… / Quit and each item works
- no panel opens at launch; the first launch opens Settings once

**GlobalShortcutTests**
- the default shortcut toggles the panel (today `⌃⌥D`; **[new]** `⌃⌥V` and `⌃⌥S`, each toggling only its tool)
- the shortcut works while another app is frontmost

**SettingsTests**
- recording a new shortcut takes effect immediately and the old one stops working
- Reset restores the default
- a custom shortcut survives relaunch
- **[new]** `⌘,` and `Settings…` open the Settings window
- **[new]** assigning another tool's shortcut clears it from that tool and shows the note

### CI

`.github/workflows/test.yml` runs on `macos-26` for every pull request and push to `main`:
`npm ci`, pod install, enable automation mode, `npm run test:all`. On failure it uploads the
`.xcresult` and screenshots. Once green, it becomes a required check on `main` (with the
developer's confirmation). The repository is public, so standard GitHub-hosted runners are free.

## Delivery order

Each step is its own branch and pull request, reviewed with `h-pr-review` before merge.

1. **Feasibility spike (throwaway).** Confirm XCUITest can trigger a global hotkey registered by the
   `KeyboardShortcuts` library, click a menu-bar status item, find RN elements by `testID`, and that
   one RN host can drive two root views in separate panels. Any failure is reported back before step 2.
2. **E2E foundation + current-app suite.** E2E build configuration, test targets, page objects,
   npm scripts, CI workflow, `CLAUDE.project.md` (commands, setup, TDD rule), and every non-[new]
   test in the catalogue, green against today's app.
3. **Focus bug fix**, test first.
4. **Multi-tool restructure**, test first, per the architecture above. Also updates the README
   (shortcuts, features) and the shortcuts help data.

## Out of scope

- Remembering panel position or size.
- Hiding individual menu-bar icons.
- Editing a snippet's title, description or tags.
- New tools beyond Clipboard and Snippets.
- Fixing `version-bump.sh` overwriting the CI version line in `build-release.sh` (tracked separately).
