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
    Wait.holds(for: seconds) { read() == nil }
  }
}
