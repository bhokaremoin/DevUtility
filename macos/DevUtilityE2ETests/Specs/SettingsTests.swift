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
    MenuBar(app: app).chooseFromRightClickMenu("Settings…", on: ClipboardPanel.toolId)
    SettingsWindow(app: app).waitUntilShown()
  }

  func test_openingSettingsAgainKeepsOneWindow() {
    let clipboard = ClipboardPanel(app: app).open()
    let settings = clipboard.openSettings()
    MenuBar(app: app).chooseFromRightClickMenu("Settings…", on: SnippetsPanel.toolId)
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
}
