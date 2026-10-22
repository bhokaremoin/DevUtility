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

    let clipboard = MainPanel(app: app).openClipboard()
    XCTAssertTrue(clipboard.emptyState.waitForExistence(timeout: Wait.defaultTimeout))
    XCTAssertTrue(clipboard.rowCountStays(0, for: 1), "old history appeared after the reset launch")
  }
}
