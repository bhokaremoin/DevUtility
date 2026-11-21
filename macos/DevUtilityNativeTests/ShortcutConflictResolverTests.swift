import XCTest

final class ShortcutConflictResolverTests: XCTestCase {
  private let controlOptionV = ShortcutBinding(keyCode: 9, modifiers: 786432)
  private let controlOptionS = ShortcutBinding(keyCode: 1, modifiers: 786432)
  private let controlOptionX = ShortcutBinding(keyCode: 7, modifiers: 786432)

  private var defaults: [(toolId: String, binding: ShortcutBinding?)] {
    [(toolId: "clipboard", binding: controlOptionV), (toolId: "snippets", binding: controlOptionS)]
  }

  func test_assigningAnotherToolsShortcutClearsItThere() {
    let cleared = ShortcutConflictResolver.toolsToClear(assigning: controlOptionS, to: "clipboard", current: defaults)

    XCTAssertEqual(cleared, ["snippets"])
  }

  func test_assigningAFreeShortcutClearsNothing() {
    let cleared = ShortcutConflictResolver.toolsToClear(assigning: controlOptionX, to: "clipboard", current: defaults)

    XCTAssertEqual(cleared, [])
  }

  func test_reassigningTheSameToolsOwnShortcutClearsNothing() {
    let cleared = ShortcutConflictResolver.toolsToClear(assigning: controlOptionV, to: "clipboard", current: defaults)

    XCTAssertEqual(cleared, [])
  }

  func test_clearingAShortcutClearsNothing() {
    let current: [(toolId: String, binding: ShortcutBinding?)] = [
      (toolId: "clipboard", binding: nil), (toolId: "snippets", binding: nil),
    ]

    let cleared = ShortcutConflictResolver.toolsToClear(assigning: nil, to: "clipboard", current: current)

    XCTAssertEqual(cleared, [])
  }
}
