import XCTest

final class SettingsTests: XCTestCase {
  private var app: XCUIApplication!

  override func setUp() {
    continueAfterFailure = false
    app = AppLauncher.launchFresh()
  }

  override func tearDown() {
    app.terminate()
  }

  func test_recordedShortcutWorksAndTheOldOneStops() {
    let clipboard = ClipboardPanel(app: app).open()
    let settings = clipboard.openSettings()
    settings.recordShortcut(for: "clipboard", "k", modifiers: [.control, .option], shownAs: "⌃⌥K")

    let otherApp = OtherApp.bringToFront()
    otherApp.typeKey("v", modifierFlags: [.control, .option])
    XCTAssertTrue(clipboard.staysVisible(for: 2), "the old shortcut still toggled Clipboard")
    otherApp.typeKey("k", modifierFlags: [.control, .option])
    // Clipboard is open but no longer key, so the first press brings it to front and the second closes it.
    otherApp.typeKey("k", modifierFlags: [.control, .option])
    clipboard.waitUntilHidden()
  }

  func test_resetRestoresEachToolsDefaultShortcut() {
    let settings = ClipboardPanel(app: app).open().openSettings()
    settings.recordShortcut(for: "clipboard", "k", modifiers: [.control, .option], shownAs: "⌃⌥K")
    settings.recordShortcut(for: "snippets", "j", modifiers: [.control, .option], shownAs: "⌃⌥J")
    settings.resetShortcut(for: "clipboard")
    settings.resetShortcut(for: "snippets")
    Wait.until("the Clipboard recorder shows its default") { settings.recorderText(for: "clipboard") == "⌃⌥V" }
    Wait.until("the Snippets recorder shows its default") { settings.recorderText(for: "snippets") == "⌃⌥S" }

    let otherApp = OtherApp.bringToFront()
    let snippets = SnippetsPanel(app: app)
    otherApp.typeKey("j", modifierFlags: [.control, .option])
    XCTAssertTrue(snippets.staysHidden(for: 2), "the custom shortcut still opened Snippets after reset")
    otherApp.typeKey("s", modifierFlags: [.control, .option])
    snippets.waitUntilVisible()
  }

  func test_customShortcutSurvivesRelaunch() {
    let settings = ClipboardPanel(app: app).open().openSettings()
    settings.recordShortcut(for: "snippets", "k", modifiers: [.control, .option], shownAs: "⌃⌥K")
    app = AppLauncher.relaunchKeepingData(app)
    let relaunchedSettings = ClipboardPanel(app: app).open().openSettings()
    Wait.until("the custom shortcut is still set") { relaunchedSettings.currentShortcutText(for: "snippets") == "⌃⌥K" }
  }

  // MARK: - The Settings window

  func test_commandCommaOpensSettingsInFrontAndKey() {
    ClipboardPanel(app: app).open().press(",", modifiers: .command)
    let settings = SettingsWindow(app: app)
    settings.waitUntilShown()
    // Settings opens over the panel, so it is hittable only when it is in front.
    XCTAssertTrue(settings.window.isHittable, "Settings opened behind the panel")
    settings.recordShortcut(for: "clipboard", "k", modifiers: [.control, .option], shownAs: "⌃⌥K")
  }

  func test_settingsMenuItemOpensSettings() {
    MenuBar(app: app).chooseFromRightClickMenu(.settings, on: ClipboardPanel.toolId)
    SettingsWindow(app: app).waitUntilShown()
  }

  func test_openingSettingsAgainKeepsOneWindow() {
    let clipboard = ClipboardPanel(app: app).open()
    let settings = clipboard.openSettings()
    MenuBar(app: app).chooseFromRightClickMenu(.settings, on: SnippetsPanel.toolId)
    clipboard.press(",", modifiers: .command)
    XCTAssertTrue(settings.window.isHittable, "Settings is no longer in front")
    XCTAssertEqual(settings.openWindowCount, 1)
  }

  func test_keysTypedInSettingsAreNotHandledByThePanel() {
    let clipboard = ClipboardPanel(app: app).open()
    Pasteboard.write("first")
    clipboard.waitForRowText(0, toEqual: "first")
    Pasteboard.write("second")
    clipboard.waitForRowText(0, toEqual: "second")
    Pasteboard.clear()
    clipboard.selectRow(0)
    Wait.until("row 0 is selected") { clipboard.isRowSelected(0) }

    let settings = clipboard.openSettings()
    settings.recorder(for: "clipboard").click()
    Keyboard.press(.downArrow)
    Keyboard.press(.returnKey)

    XCTAssertTrue(Pasteboard.staysEmpty(for: 1), "Return in Settings copied a clipboard row")
    XCTAssertTrue(clipboard.rowStaysSelected(0, for: 1), "↓ in Settings moved the panel's selection")
  }

  // MARK: - Shortcut clashes between tools

  func test_assigningAnotherToolsShortcutMovesItAndShowsTheNote() {
    let settings = ClipboardPanel(app: app).open().openSettings()
    settings.recordShortcut(for: "clipboard", "s", modifiers: [.control, .option], shownAs: "⌃⌥S")

    Wait.until("Snippets has no shortcut") { settings.currentShortcutText(for: "snippets") == "Not set" }
    Wait.until("the note names Snippets") {
      settings.conflictNote(for: "clipboard").displayedText == "Removed this shortcut from Snippets."
    }

    let clipboard = ClipboardPanel(app: app)
    let snippets = SnippetsPanel(app: app)
    let otherApp = OtherApp.bringToFront()
    // Clipboard is open but no longer key, so ⌃⌥S brings it to front; only Snippets staying shut matters.
    otherApp.typeKey("s", modifierFlags: [.control, .option])
    XCTAssertTrue(snippets.staysHidden(for: 2), "⌃⌥S still opened Snippets")
    XCTAssertTrue(clipboard.isVisible)
  }

  func test_clearingAShortcutLeavesTheToolWithoutOne() {
    let settings = SnippetsPanel(app: app).open().openSettings()
    settings.clearShortcut(for: "clipboard")
    Wait.until("Clipboard has no shortcut") { settings.currentShortcutText(for: "clipboard") == "Not set" }

    let clipboard = ClipboardPanel(app: app)
    let otherApp = OtherApp.bringToFront()
    otherApp.typeKey("v", modifierFlags: [.control, .option])
    XCTAssertTrue(clipboard.staysHidden(for: 2), "the cleared shortcut still opened Clipboard")
    MenuBar(app: app).clickIcon(for: ClipboardPanel.toolId)
    clipboard.waitUntilVisible()
  }
}
