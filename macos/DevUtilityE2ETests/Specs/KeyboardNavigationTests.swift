import XCTest

final class KeyboardNavigationTests: XCTestCase {
  private var app: XCUIApplication!
  private var panel: MainPanel!

  override func setUp() {
    continueAfterFailure = false
    app = AppLauncher.launchFresh()
    panel = MainPanel(app: app)
  }

  override func tearDown() {
    app.terminate()
  }

  private func clipboardWithThreeItems() -> ClipboardTab {
    let clipboard = panel.openClipboard()
    for text in ["one", "two", "three"] {
      Pasteboard.write(text)
      clipboard.waitForRowText(0, toEqual: text)
    }
    return clipboard
  }

  func test_arrowKeysMoveTheSelection() {
    let clipboard = clipboardWithThreeItems()
    clipboard.selectRow(0)
    panel.press(.downArrow)
    Wait.until("row 1 is selected") { clipboard.isRowSelected(1) }
    panel.press(.upArrow)
    Wait.until("row 0 is selected") { clipboard.isRowSelected(0) }
  }

  func test_arrowKeysInsideTheDetailEditorMoveTheCursorNotTheSelection() {
    let clipboard = clipboardWithThreeItems()
    clipboard.selectRow(0)
    clipboard.detailEditor.click()
    panel.press(.downArrow)
    XCTAssertTrue(clipboard.rowStaysSelected(0, for: 2))
  }

  func test_enterCopiesTheSelectedItem() {
    let clipboard = clipboardWithThreeItems()
    clipboard.selectRow(1)
    Pasteboard.clear()
    // .return is the main Return key (keyCode 36); .enter is the keypad key, which the app does not handle.
    panel.press(.return)
    Wait.until("the pasteboard holds the selected item") { Pasteboard.read() == "two" }
  }

  func test_enterInsideATextInputDoesNotCopy() {
    let snippets = panel.openSnippets()
    snippets.addSnippet(title: "Entry", description: "", tags: "", content: "entry content")
    Pasteboard.clear()
    snippets.searchField.typeAfterFocusing("Entry")
    panel.press(.return)
    XCTAssertTrue(Pasteboard.staysEmpty(for: 2))
  }

  func test_commandEnterCopiesStoredTextNotUnsavedDraft() {
    let clipboard = clipboardWithThreeItems()
    clipboard.selectRow(0)
    clipboard.replaceDetailText(with: "unsaved draft")
    Pasteboard.clear()
    panel.press(.return, modifiers: .command)
    Wait.until("the pasteboard holds the stored text") { Pasteboard.read() == "three" }
  }

  func test_escapeInSnippetsClearsTheSearch() {
    let snippets = panel.openSnippets()
    snippets.addSnippet(title: "Alpha", description: "", tags: "", content: "a")
    snippets.search(for: "zzz")
    Wait.until("the search hides the snippet") { snippets.rowCount == 0 }
    panel.press(.escape)
    Wait.until("the cleared search shows the snippet again") { snippets.rowCount == 1 }
  }

  func test_commandFFocusesSnippetSearchFromAnotherTab() {
    _ = panel.openClipboard()
    panel.press("f", modifiers: .command)
    let snippets = SnippetsTab(app: app)
    Wait.until("the search has focus") { (snippets.searchField.value(forKey: "hasKeyboardFocus") as? Bool) == true }
  }

  func test_shortcutsHelpListsTheShortcuts() {
    panel.openShortcutsHelp()
    XCTAssertTrue(panel.shortcutsHelpTitle.exists)
    panel.closeShortcutsHelp()
    Wait.until("the help sheet is closed") { !self.panel.shortcutsHelpSheet.exists }
  }
}
