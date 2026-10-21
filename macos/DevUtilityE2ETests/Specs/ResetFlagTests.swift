import XCTest

final class ResetFlagTests: XCTestCase {
  func test_resetFlagStartsWithEmptyClipboardHistory() {
    var app = AppLauncher.launchFresh()
    Pasteboard.write("left over from a previous test")
    let firstRow = app.descendants(matching: .any)["clipboard.row.0"]
    XCTAssertTrue(firstRow.waitForExistence(timeout: Wait.defaultTimeout))

    app.terminate()
    app = AppLauncher.launchFresh()
    defer { app.terminate() }

    XCTAssertTrue(app.descendants(matching: .any)["clipboard.emptyState"].waitForExistence(timeout: Wait.defaultTimeout))
  }
}
