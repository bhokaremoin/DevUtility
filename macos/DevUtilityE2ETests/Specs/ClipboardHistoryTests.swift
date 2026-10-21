import XCTest

final class ClipboardHistoryTests: XCTestCase {
  private var app: XCUIApplication!
  private var clipboard: ClipboardTab!

  override func setUp() {
    continueAfterFailure = false
    app = AppLauncher.launchFresh()
    clipboard = MainPanel(app: app).openClipboard()
  }

  override func tearDown() {
    app.terminate()
  }

  private func copyAndWaitForTopRow(_ text: String) {
    Pasteboard.write(text)
    clipboard.waitForRowText(0, toEqual: text)
  }

  func test_emptyHistoryShowsEmptyState() {
    XCTAssertTrue(clipboard.emptyState.exists)
  }

  func test_copiedTextAppearsAtTopOfHistory() {
    copyAndWaitForTopRow("first")
    copyAndWaitForTopRow("second")
    XCTAssertEqual(clipboard.rowText(1), "first")
  }

  func test_sameTextCopiedTwiceInARowIsAddedOnce() {
    copyAndWaitForTopRow("repeat me")
    Pasteboard.write("repeat me")
    copyAndWaitForTopRow("marker")
    XCTAssertEqual(clipboard.rowCount, 2)
  }

  func test_sameTextCopiedAgainLaterIsAddedAgain() {
    copyAndWaitForTopRow("again")
    copyAndWaitForTopRow("in between")
    copyAndWaitForTopRow("again")
    XCTAssertEqual(clipboard.rowCount, 3)
  }

  func test_recopyingAHistoryRowDoesNotAddADuplicate() {
    copyAndWaitForTopRow("older")
    copyAndWaitForTopRow("newer")
    clipboard.clickCopy(onRow: 1)
    Wait.until("the pasteboard holds the re-copied row") { Pasteboard.read() == "older" }
    copyAndWaitForTopRow("marker")
    XCTAssertEqual(clipboard.rowCount, 3)
  }

  func test_historyKeepsOnlyTheFifteenNewestItems() {
    for number in 1...16 {
      copyAndWaitForTopRow("item \(number)")
    }
    clipboard.scrollToBottom()
    Wait.until("the oldest item is evicted") { self.clipboard.rowCount == 15 }
    XCTAssertEqual(clipboard.rowText(0), "item 16")
    XCTAssertEqual(clipboard.rowText(14), "item 2")
  }

  func test_longTextIsTruncatedInRowAndFullInDetail() {
    let longText = String(repeating: "x", count: 200)
    Pasteboard.write(longText)
    Wait.until("the long item appears") { self.clipboard.row(0).exists }
    XCTAssertEqual(clipboard.rowText(0), String(repeating: "x", count: 120) + "…")
    clipboard.selectRow(0)
    XCTAssertEqual(clipboard.detailEditor.displayedText, longText)
  }

  func test_rowCopyButtonCopiesTextAndShowsFeedback() {
    copyAndWaitForTopRow("copy me")
    copyAndWaitForTopRow("other")
    clipboard.clickCopy(onRow: 1)
    Wait.until("the pasteboard holds the row text") { Pasteboard.read() == "copy me" }
    XCTAssertEqual(clipboard.copyButtonLabel(onRow: 1), "Copied to clipboard")
  }

  func test_editedTextCanBeCopiedWithoutSaving() {
    copyAndWaitForTopRow("original")
    clipboard.selectRow(0)
    clipboard.replaceDetailText(with: "edited")
    clipboard.clickDetailCopy()
    Wait.until("the pasteboard holds the edited text") { Pasteboard.read() == "edited" }
    XCTAssertEqual(clipboard.rowText(0), "original")
  }

  func test_savingAnEditUpdatesTheRow() {
    copyAndWaitForTopRow("before edit")
    clipboard.selectRow(0)
    clipboard.replaceDetailText(with: "after edit")
    clipboard.clickDetailSave()
    clipboard.waitForRowText(0, toEqual: "after edit")
  }

  func test_historySurvivesRelaunch() {
    copyAndWaitForTopRow("persist me")
    app = AppLauncher.relaunchKeepingData(app)
    clipboard = MainPanel(app: app).openClipboard()
    clipboard.waitForRowText(0, toEqual: "persist me")
  }

  func test_clearAllCancelKeepsHistory() {
    copyAndWaitForTopRow("keep me")
    clipboard.clearAll(confirm: false)
    XCTAssertEqual(clipboard.rowText(0), "keep me")
  }

  func test_clearAllConfirmEmptiesHistory() {
    copyAndWaitForTopRow("delete me")
    clipboard.clearAll(confirm: true)
    XCTAssertTrue(clipboard.emptyState.waitForExistence(timeout: Wait.defaultTimeout))
  }

  func test_listScrollsToOlderItems() {
    for number in 1...15 {
      copyAndWaitForTopRow("scroll item \(number)")
    }
    clipboard.scrollToBottom()
    Wait.until("the oldest row is visible") { self.clipboard.row(14).isHittable }
  }

  func test_copyingASnippetAddsItToHistory() {
    let snippets = MainPanel(app: app).openSnippets()
    snippets.addSnippet(title: "Greeting", description: "", tags: "", content: "hello from snippet")
    snippets.clickCopy(onRow: 0)
    clipboard = MainPanel(app: app).openClipboard()
    clipboard.waitForRowText(0, toEqual: "hello from snippet")
  }

  func test_unicodeAndMultilineTextRoundTrips() {
    let text = "naïve café 😀\nनमस्ते\n第二行"
    Pasteboard.write(text)
    Wait.until("the unicode item appears") { self.clipboard.row(0).exists }
    copyAndWaitForTopRow("marker")
    Pasteboard.clear()
    clipboard.clickCopy(onRow: 1)
    Wait.until("the pasteboard holds the exact text") { Pasteboard.read() == text }
  }

  func test_veryLargeTextIsCapturedAndTruncated() {
    let largeText = String(repeating: "abcdefghij", count: 10_000)
    Pasteboard.write(largeText)
    Wait.until("the large item appears", timeout: 10) { self.clipboard.row(0).exists }
    XCTAssertEqual(clipboard.rowText(0).count, 121)
  }

  func test_whitespaceOnlyTextIsCapturedToday() {
    Pasteboard.write("   ")
    Wait.until("the whitespace item appears") { self.clipboard.row(0).exists }
    XCTAssertEqual(clipboard.rowCount, 1)
  }
}
