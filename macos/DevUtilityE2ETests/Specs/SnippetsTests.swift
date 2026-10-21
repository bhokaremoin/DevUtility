import XCTest

final class SnippetsTests: XCTestCase {
  private var app: XCUIApplication!
  private var snippets: SnippetsTab!

  override func setUp() {
    continueAfterFailure = false
    app = AppLauncher.launchFresh()
    snippets = MainPanel(app: app).openSnippets()
  }

  override func tearDown() {
    app.terminate()
  }

  private func addNginxAndDocker() {
    snippets.addSnippet(title: "Nginx proxy", description: "Reverse proxy config", tags: "web, ops", content: "server { listen 80; }")
    snippets.addSnippet(title: "Docker cleanup", description: "Free disk space", tags: "containers", content: "docker system prune")
  }

  func test_addedSnippetAppearsAtTheTop() {
    addNginxAndDocker()
    XCTAssertEqual(snippets.rowTitle(0), "Docker cleanup")
    XCTAssertEqual(snippets.rowTitle(1), "Nginx proxy")
  }

  func test_saveIsDisabledWithoutTitle() {
    let dialog = snippets.openAddDialog()
    dialog.fill(title: "", description: "", tags: "", content: "only content")
    XCTAssertFalse(dialog.saveButton.isEnabled)
  }

  func test_saveIsDisabledWithoutContent() {
    let dialog = snippets.openAddDialog()
    dialog.fill(title: "Only title", description: "", tags: "", content: "")
    XCTAssertFalse(dialog.saveButton.isEnabled)
  }

  func test_cancelInAddDialogSavesNothing() {
    let dialog = snippets.openAddDialog()
    dialog.fill(title: "Discard me", description: "", tags: "", content: "x")
    dialog.cancel()
    XCTAssertTrue(snippets.rowCountStays(0, for: 2))
    XCTAssertEqual(snippets.emptyStateTitle, "No snippets yet")
  }

  func test_searchMatchesTitleCaseInsensitively() {
    addNginxAndDocker()
    snippets.search(for: "NGINX")
    Wait.until("one result") { self.snippets.rowCount == 1 }
    XCTAssertEqual(snippets.rowTitle(0), "Nginx proxy")
  }

  func test_searchMatchesDescription() {
    addNginxAndDocker()
    snippets.search(for: "disk space")
    Wait.until("one result") { self.snippets.rowCount == 1 }
    XCTAssertEqual(snippets.rowTitle(0), "Docker cleanup")
  }

  func test_searchMatchesTags() {
    addNginxAndDocker()
    snippets.search(for: "ops")
    Wait.until("one result") { self.snippets.rowCount == 1 }
    XCTAssertEqual(snippets.rowTitle(0), "Nginx proxy")
  }

  func test_searchDoesNotMatchContent() {
    addNginxAndDocker()
    snippets.search(for: "prune")
    Wait.until("no results") { self.snippets.rowCount == 0 }
    XCTAssertEqual(snippets.emptyStateTitle, "No matching snippets")
  }

  func test_searchTreatsRegexCharactersLiterally() {
    snippets.addSnippet(title: "Build c++ (debug)", description: "", tags: "", content: "make")
    snippets.addSnippet(title: "Other", description: "", tags: "", content: "x")
    snippets.search(for: "c++ (")
    Wait.until("one result") { self.snippets.rowCount == 1 }
    XCTAssertEqual(snippets.rowTitle(0), "Build c++ (debug)")
  }

  func test_emptyStateWhenNoSnippets() {
    XCTAssertEqual(snippets.emptyStateTitle, "No snippets yet")
  }

  func test_copyingASnippetPutsContentOnPasteboard() {
    addNginxAndDocker()
    snippets.clickCopy(onRow: 1)
    Wait.until("the pasteboard holds the content") { Pasteboard.read() == "server { listen 80; }" }
  }

  func test_editedContentPersistsAcrossRelaunch() {
    addNginxAndDocker()
    snippets.selectRow(0)
    snippets.replaceDetailText(with: "docker image prune -a")
    snippets.clickDetailSave()
    app = AppLauncher.relaunchKeepingData(app)
    snippets = MainPanel(app: app).openSnippets()
    snippets.selectRow(0)
    Wait.until("the edited content is shown") { self.snippets.detailEditor.displayedText == "docker image prune -a" }
  }

  func test_deleteCancelKeepsSnippet() {
    addNginxAndDocker()
    snippets.selectRow(0)
    snippets.deleteSelected(confirm: false)
    XCTAssertTrue(snippets.rowCountStays(2, for: 2))
  }

  func test_deleteConfirmRemovesSnippet() {
    addNginxAndDocker()
    snippets.selectRow(0)
    snippets.deleteSelected(confirm: true)
    Wait.until("one snippet left") { self.snippets.rowCount == 1 }
    XCTAssertEqual(snippets.rowTitle(0), "Nginx proxy")
  }

  func test_longListScrolls() {
    for number in 1...20 {
      snippets.addSnippet(title: "Snippet \(number)", description: "", tags: "", content: "content \(number)")
    }
    snippets.scrollToBottom()
    Wait.until("the oldest snippet is visible") { self.snippets.isRowVisible(19) }
  }
}
