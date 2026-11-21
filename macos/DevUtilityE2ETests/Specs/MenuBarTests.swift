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

  func test_rightClickMenuNamesItsToolAndOpensIt() {
    let menuBar = MenuBar(app: app)
    Mouse.rightClick(menuBar.icon(for: SnippetsPanel.toolId))
    let openItem = menuBar.rightClickMenuItem(.openTool)
    XCTAssertTrue(openItem.waitForExistence(timeout: Wait.defaultTimeout), "the menu did not open")
    XCTAssertEqual(openItem.title, "Open Snippets")
    XCTAssertEqual(menuBar.rightClickMenuItem(.settings).title, "Settings…")
    XCTAssertEqual(menuBar.rightClickMenuItem(.quit).title, "Quit DevUtility")
    Mouse.click(openItem)
    SnippetsPanel(app: app).waitUntilVisible()
  }

  func test_rightClickMenuOpensSettings() {
    MenuBar(app: app).chooseFromRightClickMenu(.settings, on: ClipboardPanel.toolId)
    SettingsWindow(app: app).waitUntilShown()
  }

  func test_rightClickMenuQuitsTheApp() {
    MenuBar(app: app).chooseFromRightClickMenu(.quit, on: ClipboardPanel.toolId)
    XCTAssertTrue(app.wait(for: .notRunning, timeout: Wait.defaultTimeout), "DevUtility is still running")
  }
}
