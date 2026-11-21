import XCTest

final class PanelBehaviorTests: XCTestCase {
  private var app: XCUIApplication!
  private var clipboard: ClipboardPanel!
  private var snippets: SnippetsPanel!

  override func setUp() {
    continueAfterFailure = false
    Keyboard.requirePermissionToPostEvents()
    app = AppLauncher.launchFresh()
    clipboard = ClipboardPanel(app: app)
    snippets = SnippetsPanel(app: app)
  }

  override func tearDown() {
    app.terminate()
  }

  // MARK: - One panel, icon and shortcut per tool

  func test_eachToolHasItsOwnIconAndTheOldSingleIconIsGone() {
    let menuBar = MenuBar(app: app)
    XCTAssertTrue(menuBar.icon(for: ClipboardPanel.toolId).exists)
    XCTAssertTrue(menuBar.icon(for: SnippetsPanel.toolId).exists)
    XCTAssertFalse(app.statusItems["statusItem.app"].exists, "the old single icon is still there")
  }

  func test_noPanelOpensAtLaunch() {
    XCTAssertTrue(clipboard.staysHidden(for: 2), "Clipboard opened at launch")
    XCTAssertTrue(snippets.staysHidden(for: 0.1), "Snippets opened at launch")
  }

  func test_bothPanelsCanBeOpenAtOnce() {
    clipboard.open()
    snippets.open()
    XCTAssertTrue(clipboard.staysVisible(for: 1), "opening Snippets closed Clipboard")
  }

  func test_keysReachOnlyTheKeyPanel() {
    clipboardWithTwoRows().selectRow(0)
    snippets.open()
    for title in ["Second", "First"] {
      snippets.addSnippet(title: title, description: "", tags: "", content: "\(title) content")
    }
    snippets.selectRow(0)
    Keyboard.press(.downArrow)
    Wait.until("the Snippets selection moved") { self.snippets.isRowSelected(1) }
    XCTAssertTrue(clipboard.rowStaysSelected(0, for: 1), "↓ in Snippets also moved the Clipboard selection")
  }

  // MARK: - Shortcuts acting on open panels

  func test_shortcutOnAPanelThatIsOpenButBehindBringsItToFront() {
    clipboardWithTwoRows().selectRow(0)
    pressShortcut("s")
    snippets.waitUntilVisible()
    // Clipboard is open but no longer key: its shortcut brings it to front instead of closing it.
    pressShortcut("v")
    XCTAssertTrue(clipboard.staysVisible(for: 1), "the shortcut closed Clipboard while Snippets was in front")
    Keyboard.press(.downArrow)
    Wait.until("keys reach Clipboard again") { self.clipboard.isRowSelected(1) }
    XCTAssertTrue(snippets.isVisible, "bringing Clipboard to front closed Snippets")
  }

  func test_bothShortcutsPressedBackToBackOpenBothPanels() {
    OtherApp.bringToFront()
    pressShortcut("v")
    pressShortcut("s")
    clipboard.waitUntilVisible()
    snippets.waitUntilVisible()
  }

  // MARK: - Helpers

  private func clipboardWithTwoRows() -> ClipboardPanel {
    clipboard.open()
    for text in ["older", "newer"] {
      Pasteboard.write(text)
      clipboard.waitForRowText(0, toEqual: text)
    }
    return clipboard
  }

  private func pressShortcut(_ key: Character) {
    Keyboard.press(key, modifiers: [.maskControl, .maskAlternate])
  }
}
