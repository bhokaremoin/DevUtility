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
}
