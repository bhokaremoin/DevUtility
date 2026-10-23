import XCTest

final class MenuBarTests: XCTestCase {
  private var app: XCUIApplication!

  override func setUp() {
    continueAfterFailure = false
    app = AppLauncher.launchFresh()
  }

  override func tearDown() {
    app.terminate()
  }

  func test_clickingTheIconTogglesThePanel() {
    let panel = MainPanel(app: app)
    let menuBar = MenuBar(app: app)
    panel.waitUntilVisible()
    menuBar.clickIcon()
    panel.waitUntilHidden()
    menuBar.clickIcon()
    panel.waitUntilVisible()
  }
}
