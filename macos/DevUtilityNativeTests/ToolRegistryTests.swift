import AppKit
import XCTest

final class ToolRegistryTests: XCTestCase {
  func test_toolsAreClipboardThenSnippets() {
    XCTAssertEqual(ToolRegistry.all.map(\.id), ["clipboard", "snippets"])
  }

  func test_clipboardIsASmallPanelAtTheMouseThatClosesOnOutsideClicks() throws {
    let clipboard = try XCTUnwrap(ToolRegistry.tool(withId: "clipboard"))

    XCTAssertEqual(clipboard.displayName, "Clipboard")
    XCTAssertEqual(clipboard.moduleName, "ClipboardTool")
    XCTAssertEqual(clipboard.size, NSSize(width: 560, height: 420))
    XCTAssertEqual(clipboard.minimumSize, NSSize(width: 420, height: 300))
    XCTAssertEqual(clipboard.openingPosition, .atMousePointer)
    XCTAssertEqual(clipboard.closingRule, .closesOnOutsideClick)
    XCTAssertEqual(clipboard.icon, .systemSymbol("list.clipboard"))
  }

  func test_snippetsIsALargeCenteredPanelThatClosesOnlyExplicitly() throws {
    let snippets = try XCTUnwrap(ToolRegistry.tool(withId: "snippets"))

    XCTAssertEqual(snippets.displayName, "Snippets")
    XCTAssertEqual(snippets.moduleName, "SnippetsTool")
    XCTAssertEqual(snippets.size, NSSize(width: 800, height: 600))
    XCTAssertEqual(snippets.minimumSize, NSSize(width: 480, height: 360))
    XCTAssertEqual(snippets.openingPosition, .centeredOnMouseScreen)
    XCTAssertEqual(snippets.closingRule, .closesOnlyExplicitly)
    XCTAssertEqual(snippets.icon, .asset("MenuBarIcon"))
  }

  func test_anUnknownIdHasNoTool() {
    XCTAssertNil(ToolRegistry.tool(withId: "calculator"))
  }
}
