import XCTest

final class LaunchSmokeTests: XCTestCase {
  func test_appLaunchesWithMenuBarIconAndPanel() {
    let app = XCUIApplication()
    app.launch()
    defer { app.terminate() }

    XCTAssertTrue(app.statusItems["statusItem.app"].waitForExistence(timeout: 20))
    XCTAssertTrue(app.descendants(matching: .any)["header.tab.clipboard"].waitForExistence(timeout: 20))
  }
}
