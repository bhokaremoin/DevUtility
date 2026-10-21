import XCTest

final class ResetFlagTests: XCTestCase {
  func test_resetFlagStartsWithEmptyClipboardHistory() {
    var app = AppLauncher.launchFresh()
    Pasteboard.write("left over from a previous test")
    let firstRow = MainPanel(app: app).openClipboard().row(0)
    XCTAssertTrue(firstRow.waitForExistence(timeout: Wait.defaultTimeout))

    app.terminate()
    app = AppLauncher.launchFresh()
    defer { app.terminate() }

    let emptyState = MainPanel(app: app).openClipboard().emptyState
    XCTAssertTrue(emptyState.waitForExistence(timeout: Wait.defaultTimeout))
  }
}
