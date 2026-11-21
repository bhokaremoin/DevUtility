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

  func test_clickingTheClipboardIconTogglesOnlyClipboard() {
    let clipboard = ClipboardPanel(app: app)
    let menuBar = MenuBar(app: app)
    menuBar.clickIcon(for: ClipboardPanel.toolId)
    clipboard.waitUntilVisible()
    XCTAssertTrue(SnippetsPanel(app: app).staysHidden(for: 1), "the Clipboard icon opened Snippets")
    menuBar.clickIcon(for: ClipboardPanel.toolId)
    clipboard.waitUntilHidden()
  }

  func test_clickingTheSnippetsIconTogglesOnlySnippets() {
    let snippets = SnippetsPanel(app: app)
    let menuBar = MenuBar(app: app)
    menuBar.clickIcon(for: SnippetsPanel.toolId)
    snippets.waitUntilVisible()
    XCTAssertTrue(ClipboardPanel(app: app).staysHidden(for: 1), "the Snippets icon opened Clipboard")
    menuBar.clickIcon(for: SnippetsPanel.toolId)
    snippets.waitUntilHidden()
  }

  func test_rightClickMenuOpensTheTool() {
    MenuBar(app: app).chooseFromRightClickMenu("Open Snippets", on: SnippetsPanel.toolId)
    SnippetsPanel(app: app).waitUntilVisible()
  }

  func test_rightClickMenuOpensSettings() {
    MenuBar(app: app).chooseFromRightClickMenu("Settings…", on: ClipboardPanel.toolId)
    SettingsWindow(app: app).waitUntilShown()
  }

  func test_rightClickMenuQuitsTheApp() {
    MenuBar(app: app).chooseFromRightClickMenu("Quit DevUtility", on: ClipboardPanel.toolId)
    XCTAssertTrue(app.wait(for: .notRunning, timeout: Wait.defaultTimeout), "DevUtility is still running")
  }
}
