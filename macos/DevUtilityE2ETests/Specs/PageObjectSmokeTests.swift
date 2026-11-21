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

  func test_everyScreenOpens() {
    XCTAssertTrue(ClipboardPanel(app: app).open().emptyState.waitForExistence(timeout: Wait.defaultTimeout))
    let snippets = SnippetsPanel(app: app).open()
    XCTAssertEqual(snippets.emptyStateTitle, "No snippets yet")
    XCTAssertEqual(snippets.openSettings().currentShortcutText(for: "clipboard"), "⌃⌥V")
  }
}
