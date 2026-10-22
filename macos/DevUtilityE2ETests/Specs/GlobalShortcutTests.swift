import XCTest

final class GlobalShortcutTests: XCTestCase {
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

  func test_defaultShortcutTogglesThePanelWhileAnotherAppIsFrontmost() {
    let otherApp = OtherApp.bringToFront()
    otherApp.typeKey("d", modifierFlags: [.control, .option])
    panel.waitUntilHidden()
    otherApp.typeKey("d", modifierFlags: [.control, .option])
    panel.waitUntilVisible()
  }
}
