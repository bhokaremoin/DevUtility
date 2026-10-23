import XCTest

final class PageObjectSmokeTests: XCTestCase {
  private var app: XCUIApplication!

  override func setUp() {
    continueAfterFailure = false
    app = AppLauncher.launchFresh()
  }

  override func tearDown() {
    app.terminate()
  }

  func test_everyTabOpensFromTheHeader() {
    let panel = MainPanel(app: app)
    XCTAssertTrue(panel.openClipboard().emptyState.waitForExistence(timeout: Wait.defaultTimeout))
    XCTAssertEqual(panel.openSnippets().emptyStateTitle, "No snippets yet")
    XCTAssertEqual(panel.openSettings().currentShortcutText, "⌃⌥D")
  }
}
