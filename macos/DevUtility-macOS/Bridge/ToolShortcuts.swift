import KeyboardShortcuts

extension KeyboardShortcuts.Name {
  static let toggleClipboard = Self("toggleClipboard", default: .init(.v, modifiers: [.control, .option]))
  static let toggleSnippets = Self("toggleSnippets", default: .init(.s, modifiers: [.control, .option]))
}

/// Maps each tool to the global shortcut that toggles it. The shortcut library stores the user's
/// choice under the name, so these names must never change.
enum ToolShortcuts {
  static func name(for toolId: String) -> KeyboardShortcuts.Name? {
    switch toolId {
    case "clipboard": return .toggleClipboard
    case "snippets": return .toggleSnippets
    default: return nil
    }
  }

  static var allNames: [KeyboardShortcuts.Name] {
    ToolRegistry.all.compactMap { name(for: $0.id) }
  }
}
