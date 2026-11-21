import XCTest

enum AppLauncher {
  static let launchTimeout: TimeInterval = 20

  static func launchFresh() -> XCUIApplication {
    refuseToDriveANonE2EBuild()
    Pasteboard.clear()
    let app = XCUIApplication()
    app.launchArguments = ["--e2e-reset", "--e2e-skip-onboarding"]
    app.launch()
    waitUntilReady(app)
    return app
  }

  static func relaunchKeepingData(_ app: XCUIApplication) -> XCUIApplication {
    refuseToDriveANonE2EBuild()
    app.terminate()
    Pasteboard.clear()
    app.launchArguments = ["--e2e-skip-onboarding"]
    app.launch()
    waitUntilReady(app)
    return app
  }

  // Built in any other configuration, the app under test is the Debug app, which shares its bundle
  // ID and data with the installed DevUtility and ignores --e2e-reset. The suite would then clear
  // the developer's real clipboard history, snippets and shortcut. XCTest cannot stop a whole run
  // from a test, so crash before anything is launched.
  private static func refuseToDriveANonE2EBuild() {
    #if !E2E_BUILD
    fatalError("DevUtilityE2ETests must run against the E2E build configuration (-configuration E2E or npm run test:e2e)")
    #endif
  }

  // No panel opens at launch, so the app is ready once every tool's menu-bar icon is there.
  private static func waitUntilReady(_ app: XCUIApplication) {
    let menuBar = MenuBar(app: app)
    for toolId in ["clipboard", "snippets"] {
      XCTAssertTrue(
        menuBar.icon(for: toolId).waitForExistence(timeout: launchTimeout),
        "the \(toolId) menu-bar icon did not appear"
      )
    }
  }
}
