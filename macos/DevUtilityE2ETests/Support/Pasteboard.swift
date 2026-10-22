import AppKit
import XCTest

enum Pasteboard {
  static func clear() {
    NSPasteboard.general.clearContents()
  }

  static func write(_ text: String) {
    let pasteboard = NSPasteboard.general
    pasteboard.clearContents()
    pasteboard.setString(text, forType: .string)
  }

  static func read() -> String? {
    NSPasteboard.general.string(forType: .string)
  }

  static func staysEmpty(for seconds: TimeInterval) -> Bool {
    let predicate = NSPredicate { _, _ in read() != nil }
    let pasteboardFilled = XCTNSPredicateExpectation(predicate: predicate, object: nil)
    pasteboardFilled.isInverted = true
    return XCTWaiter().wait(for: [pasteboardFilled], timeout: seconds) == .completed
  }
}
