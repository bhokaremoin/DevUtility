import XCTest

final class GlobalShortcutTests: XCTestCase {
  private var app: XCUIApplication!

  override func setUp() {
    continueAfterFailure = false
    app = AppLauncher.launchFresh()
  }

  override func tearDown() {
    app.terminate()
  }

  func test_clipboardShortcutTogglesOnlyClipboardWhileAnotherAppIsFrontmost() {
    let clipboard = ClipboardPanel(app: app)
    let snippets = SnippetsPanel(app: app)
    let otherApp = OtherApp.bringToFront()
    otherApp.typeKey("v", modifierFlags: [.control, .option])
    clipboard.waitUntilVisible()
    XCTAssertTrue(snippets.staysHidden(for: 1), "the Clipboard shortcut opened Snippets")
    otherApp.typeKey("v", modifierFlags: [.control, .option])
    clipboard.waitUntilHidden()
  }

  func test_snippetsShortcutTogglesOnlySnippetsWhileAnotherAppIsFrontmost() {
    let clipboard = ClipboardPanel(app: app)
    let snippets = SnippetsPanel(app: app)
    let otherApp = OtherApp.bringToFront()
    otherApp.typeKey("s", modifierFlags: [.control, .option])
    snippets.waitUntilVisible()
    XCTAssertTrue(clipboard.staysHidden(for: 1), "the Snippets shortcut opened Clipboard")
    otherApp.typeKey("s", modifierFlags: [.control, .option])
    snippets.waitUntilHidden()
  }
}
