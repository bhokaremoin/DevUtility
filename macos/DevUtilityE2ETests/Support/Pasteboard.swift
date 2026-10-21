import AppKit

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
}
