import XCTest

enum AppLauncher {
  static let launchTimeout: TimeInterval = 20

  static func launchFresh() -> XCUIApplication {
    Pasteboard.clear()
    let app = XCUIApplication()
    app.launchArguments = ["--e2e-reset"]
    app.launch()
    waitUntilReady(app)
    return app
  }

  static func relaunchKeepingData(_ app: XCUIApplication) -> XCUIApplication {
    app.terminate()
    Pasteboard.clear()
    app.launchArguments = []
    app.launch()
    waitUntilReady(app)
    return app
  }

  private static func waitUntilReady(_ app: XCUIApplication) {
    let clipboardTab = app.descendants(matching: .any)["header.tab.clipboard"]
    XCTAssertTrue(
      clipboardTab.waitForExistence(timeout: launchTimeout),
      "DevUtility did not finish launching"
    )
  }
}
