import XCTest

struct SnippetsTab {
  let app: XCUIApplication

  private func element(_ identifier: String) -> XCUIElement {
    app.descendants(matching: .any)[identifier]
  }

  var searchField: XCUIElement { element("snippets.search") }

  var emptyStateTitle: String { element("snippets.emptyState.title").displayedText }

  var rowCount: Int {
    app.descendants(matching: .any)
      .matching(NSPredicate(format: "identifier MATCHES %@", "snippets\\.row\\.[0-9]+"))
      .count
  }

  func rowTitle(_ index: Int) -> String { element("snippets.row.\(index).title").displayedText }

  func selectRow(_ index: Int) { element("snippets.row.\(index)").click() }

  func isRowSelected(_ index: Int) -> Bool { element("snippets.row.\(index)").isSelected }

  func clickCopy(onRow index: Int) { element("snippets.row.\(index).copy").click() }

  func search(for text: String) {
    searchField.typeAfterFocusing(text)
  }

  func openAddDialog() -> AddSnippetDialog {
    element("header.addSnippet").click()
    XCTAssertTrue(element("snippets.add.title").waitForExistence(timeout: Wait.defaultTimeout))
    return AddSnippetDialog(app: app)
  }

  func addSnippet(title: String, description: String, tags: String, content: String) {
    let dialog = openAddDialog()
    dialog.fill(title: title, description: description, tags: tags, content: content)
    dialog.save()
  }

  var detailEditor: XCUIElement { element("snippets.detail.editor") }

  func replaceDetailText(with text: String) {
    detailEditor.focus()
    detailEditor.typeKey("a", modifierFlags: .command)
    detailEditor.typeText(text)
  }

  func clickDetailSave() { element("snippets.detail.save").click() }

  func deleteSelected(confirm: Bool) {
    element("snippets.detail.delete").click()
    element(confirm ? "snippets.detail.confirmDelete" : "snippets.detail.cancelDelete").click()
  }

  func scrollToBottom() {
    element("snippets.row.0").scroll(byDeltaX: 0, deltaY: -2000)
  }
}

struct AddSnippetDialog {
  let app: XCUIApplication

  private func element(_ identifier: String) -> XCUIElement {
    app.descendants(matching: .any)[identifier]
  }

  func fill(title: String, description: String, tags: String, content: String) {
    if !title.isEmpty { element("snippets.add.title").typeAfterFocusing(title) }
    if !description.isEmpty { element("snippets.add.description").typeAfterFocusing(description) }
    if !tags.isEmpty { element("snippets.add.tags").typeAfterFocusing(tags) }
    if !content.isEmpty { element("snippets.add.content").typeAfterFocusing(content) }
  }

  var saveButton: XCUIElement { element("snippets.add.save") }

  func save() { saveButton.click() }

  func cancel() { element("snippets.add.cancel").click() }
}
