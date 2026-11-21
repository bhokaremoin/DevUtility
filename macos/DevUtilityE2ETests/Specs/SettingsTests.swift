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
    let panel = MainPanel(app: app)
    let settings = panel.openSettings()
    settings.recordShortcut("k", modifiers: [.control, .option], shownAs: "⌃⌥K")

    let otherApp = OtherApp.bringToFront()
    otherApp.typeKey("d", modifierFlags: [.control, .option])
    XCTAssertTrue(panel.staysVisible(for: 2), "the old shortcut still toggled the panel")
    otherApp.typeKey("k", modifierFlags: [.control, .option])
    panel.waitUntilHidden()
  }

  func test_resetRestoresTheDefaultShortcut() {
    let panel = MainPanel(app: app)
    let settings = panel.openSettings()
    settings.recordShortcut("k", modifiers: [.control, .option], shownAs: "⌃⌥K")
    settings.resetShortcut()
    // The "Current:" label already reads ⌃⌥D before Reset, so only the recorder proves the change.
    Wait.until("the recorder shows the default shortcut") { settings.recorderText == "⌃⌥D" }

    let otherApp = OtherApp.bringToFront()
    otherApp.typeKey("k", modifierFlags: [.control, .option])
    XCTAssertTrue(panel.staysVisible(for: 2), "the custom shortcut still toggled the panel after reset")
    otherApp.typeKey("d", modifierFlags: [.control, .option])
    panel.waitUntilHidden()
  }

  func test_customShortcutSurvivesRelaunch() {
    let settings = MainPanel(app: app).openSettings()
    settings.recordShortcut("k", modifiers: [.control, .option], shownAs: "⌃⌥K")
    app = AppLauncher.relaunchKeepingData(app)
    let relaunchedSettings = MainPanel(app: app).openSettings()
    Wait.until("the custom shortcut is still set") { relaunchedSettings.currentShortcutText == "⌃⌥K" }
  }

  // MARK: - The Settings window

  func test_commandCommaOpensSettingsInFrontAndKey() {
    MainPanel(app: app).press(",", modifiers: .command)
    let settings = SettingsWindow(app: app)
    settings.waitUntilShown()
    // Settings opens centered over the centered panel, so it is hittable only when it is in front.
    XCTAssertTrue(settings.window.isHittable, "Settings opened behind the panel")
    settings.recordShortcut("k", modifiers: [.control, .option], shownAs: "⌃⌥K")
  }

  func test_settingsMenuItemOpensSettings() {
    MenuBar(app: app).chooseFromRightClickMenu("Settings…")
    SettingsWindow(app: app).waitUntilShown()
  }

  func test_openingSettingsAgainKeepsOneWindow() {
    let settings = MainPanel(app: app).openSettings()
    MenuBar(app: app).chooseFromRightClickMenu("Settings…")
    MainPanel(app: app).press(",", modifiers: .command)
    XCTAssertTrue(settings.window.isHittable, "Settings is no longer in front")
    XCTAssertEqual(settings.openWindowCount, 1)
  }

  func test_keysTypedInSettingsAreNotHandledByThePanel() {
    Pasteboard.write("first")
    let clipboard = ClipboardTab(app: app)
    clipboard.waitForRowText(0, toEqual: "first")
    Pasteboard.write("second")
    clipboard.waitForRowText(0, toEqual: "second")
    Pasteboard.clear()
    XCTAssertTrue(clipboard.isRowSelected(0))

    let settings = MainPanel(app: app).openSettings()
    settings.recorder.click()
    Keyboard.press(.downArrow)
    Keyboard.press(.returnKey)

    XCTAssertTrue(Pasteboard.staysEmpty(for: 1), "Return in Settings copied a clipboard row")
    XCTAssertTrue(clipboard.rowStaysSelected(0, for: 1), "↓ in Settings moved the panel's selection")
  }
}
