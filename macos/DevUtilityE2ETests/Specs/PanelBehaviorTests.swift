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

  // MARK: - Where each panel opens, and its size

  func test_clipboardOpensWithItsTopLeftAtTheMousePointer() {
    let pointer = CGPoint(x: Screen.visibleFrame.minX + 300, y: Screen.visibleFrame.minY + 120)
    Mouse.move(to: pointer)
    pressShortcut("v")
    clipboard.waitUntilVisible()
    assertEqual(clipboard.window.frame.origin, pointer, "Clipboard's top-left")
  }

  func test_clipboardStaysInsideTheScreenNearTheBottomRightCorner() {
    let visible = Screen.visibleFrame
    Mouse.move(to: CGPoint(x: visible.maxX - 10, y: visible.maxY - 10))
    pressShortcut("v")
    clipboard.waitUntilVisible()
    let frame = clipboard.window.frame
    XCTAssertLessThanOrEqual(frame.maxX, visible.maxX + 1, "Clipboard runs off the right edge")
    XCTAssertLessThanOrEqual(frame.maxY, visible.maxY + 1, "Clipboard runs off the bottom edge")
  }

  func test_clipboardIconOpensItJustBelowTheMenuBar() {
    MenuBar(app: app).clickIcon(for: ClipboardPanel.toolId)
    clipboard.waitUntilVisible()
    XCTAssertEqual(clipboard.window.frame.minY, Screen.menuBarHeight, accuracy: 2)
  }

  func test_snippetsOpensCentered() {
    Mouse.move(to: CGPoint(x: Screen.visibleFrame.minX + 50, y: Screen.visibleFrame.minY + 50))
    pressShortcut("s")
    snippets.waitUntilVisible()
    let frame = snippets.window.frame
    assertEqual(CGPoint(x: frame.midX, y: frame.midY), CGPoint(x: Screen.visibleFrame.midX, y: Screen.visibleFrame.midY), "Snippets' center")
  }

  func test_defaultSizesAre560x420And800x600() {
    clipboard.open()
    snippets.open()
    XCTAssertEqual(clipboard.window.frame.size, CGSize(width: 560, height: 420))
    XCTAssertEqual(snippets.window.frame.size, CGSize(width: 800, height: 600))
  }

  func test_clipboardResizesDownToItsMinimumAndReopensAtItsDefaultSize() {
    clipboard.open()
    shrinkAsFarAsPossible(clipboard.window)
    XCTAssertEqual(clipboard.window.frame.size, CGSize(width: 420, height: 300))
    MenuBar(app: app).clickIcon(for: ClipboardPanel.toolId)
    clipboard.waitUntilHidden()
    clipboard.open()
    XCTAssertEqual(clipboard.window.frame.size, CGSize(width: 560, height: 420))
  }

  func test_snippetsResizesDownToItsMinimumAndReopensAtItsDefaultSize() {
    snippets.open()
    shrinkAsFarAsPossible(snippets.window)
    XCTAssertEqual(snippets.window.frame.size, CGSize(width: 480, height: 360))
    MenuBar(app: app).clickIcon(for: SnippetsPanel.toolId)
    snippets.waitUntilHidden()
    snippets.open()
    XCTAssertEqual(snippets.window.frame.size, CGSize(width: 800, height: 600))
  }

  // MARK: - What closes each panel

  func test_clipboardClosesOnAClickInAnotherApp() {
    OtherApp.bringToFront()
    openClipboardInTheTopLeftCorner()
    Mouse.click(at: point(in: OtherApp.window.frame, outside: clipboard.window.frame))
    clipboard.waitUntilHidden()
  }

  func test_clipboardClosesOnAClickOnTheDesktop() {
    openClipboardInTheTopLeftCorner()
    Mouse.click(at: CGPoint(x: Screen.visibleFrame.maxX - 20, y: Screen.visibleFrame.maxY - 20))
    clipboard.waitUntilHidden()
  }

  func test_clipboardClosesOnAClickOnTheSnippetsPanel() {
    snippets.open()
    openClipboardInTheTopLeftCorner()
    Mouse.click(at: point(in: snippets.window.frame, outside: clipboard.window.frame))
    clipboard.waitUntilHidden()
    XCTAssertTrue(snippets.isVisible, "the click closed Snippets")
  }

  func test_snippetsStaysOpenOnClicksOutsideIt() {
    OtherApp.bringToFront()
    pressShortcut("s")
    snippets.waitUntilVisible()
    Mouse.click(at: point(in: OtherApp.window.frame, outside: snippets.window.frame))
    openClipboardInTheTopLeftCorner()
    Mouse.click(at: point(in: clipboard.window.frame, outside: snippets.window.frame))
    XCTAssertTrue(snippets.staysVisible(for: 2), "a click outside Snippets closed it")
  }

  func test_clickingClipboardsOwnIconClosesItForGood() {
    clipboard.open()
    Mouse.click(MenuBar(app: app).icon(for: ClipboardPanel.toolId))
    clipboard.waitUntilHidden()
    XCTAssertTrue(clipboard.staysHidden(for: 1), "Clipboard reopened after its icon closed it")
  }

  func test_clipboardStaysOpenThroughItsClearAllAlert() {
    clipboard.open()
    Pasteboard.write("keep me")
    clipboard.waitForRowText(0, toEqual: "keep me")
    clipboard.clearAll(confirm: false)
    XCTAssertTrue(clipboard.staysVisible(for: 1), "answering the Clear all alert closed Clipboard")
  }

  func test_clipboardStaysOpenForClicksInTheSettingsItOpened() {
    let settings = clipboard.open().openSettings()
    Mouse.click(settings.recorder(for: ClipboardPanel.toolId))
    XCTAssertTrue(clipboard.staysVisible(for: 1), "a click in Settings closed the Clipboard that opened it")
  }

  func test_snippetsCloseButtonClosesIt() {
    snippets.open()
    snippets.closeButton.click()
    snippets.waitUntilHidden()
  }

  func test_closingClipboardWhileSnippetsIsOpenLeavesTheKeyboardWithSnippets() {
    OtherApp.bringToFront()
    pressShortcut("s")
    snippets.waitUntilVisible()
    pressShortcut("v")
    clipboard.waitUntilVisible()
    Keyboard.press(.escape)
    clipboard.waitUntilHidden()
    Keyboard.type("nginx")
    snippets.waitForSearchText("nginx")
  }

  // MARK: - Helpers

  private func openClipboardInTheTopLeftCorner() {
    Mouse.move(to: CGPoint(x: Screen.visibleFrame.minX + 10, y: Screen.visibleFrame.minY + 10))
    pressShortcut("v")
    clipboard.waitUntilVisible()
  }

  /// A point just inside one corner of `frame` that is not covered by `other`.
  private func point(in frame: CGRect, outside other: CGRect, file: StaticString = #filePath, line: UInt = #line) -> CGPoint {
    let inset: CGFloat = 8
    let corners = [
      CGPoint(x: frame.maxX - inset, y: frame.maxY - inset),
      CGPoint(x: frame.minX + inset, y: frame.maxY - inset),
      CGPoint(x: frame.maxX - inset, y: frame.minY + inset),
      CGPoint(x: frame.minX + inset, y: frame.minY + inset),
    ]
    guard let corner = corners.first(where: { !other.contains($0) }) else {
      XCTFail("every corner of \(frame) is covered by \(other)", file: file, line: line)
      return .zero
    }
    return corner
  }

  private func assertEqual(_ actual: CGPoint, _ expected: CGPoint, _ what: String, file: StaticString = #filePath, line: UInt = #line) {
    XCTAssertEqual(actual.x, expected.x, accuracy: 2, "\(what) x", file: file, line: line)
    XCTAssertEqual(actual.y, expected.y, accuracy: 2, "\(what) y", file: file, line: line)
  }

  /// Drags the bottom-right corner past the top-left corner, so the window stops at its minimum size.
  private func shrinkAsFarAsPossible(_ window: XCUIElement) {
    let bottomRightCorner = window.coordinate(withNormalizedOffset: CGVector(dx: 1, dy: 1)).withOffset(CGVector(dx: -2, dy: -2))
    let pastTopLeft = window.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: -50, dy: -50))
    bottomRightCorner.press(forDuration: 0.2, thenDragTo: pastTopLeft)
  }

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
