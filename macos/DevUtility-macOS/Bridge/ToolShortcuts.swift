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

  /// Clears `toolId`'s shortcut from every other tool that has the same keys, because the library
  /// would fire every tool bound to them. Returns the ids of the tools that lost their shortcut.
  @MainActor
  static func removeFromOtherTools(theShortcutOf toolId: String) -> [String] {
    let current = ToolRegistry.all.map { tool in (toolId: tool.id, binding: binding(for: tool.id)) }
    let toolsToClear = ShortcutConflictResolver.toolsToClear(
      assigning: binding(for: toolId), to: toolId, current: current)
    for clearedToolId in toolsToClear {
      if let clearedName = name(for: clearedToolId) {
        KeyboardShortcuts.setShortcut(nil, for: clearedName)
      }
    }
    return toolsToClear
  }

  @MainActor
  private static func binding(for toolId: String) -> ShortcutBinding? {
    guard let name = name(for: toolId),
          let shortcut = KeyboardShortcuts.getShortcut(for: name) else { return nil }
    return ShortcutBinding(keyCode: shortcut.carbonKeyCode, modifiers: shortcut.modifiers.rawValue)
  }
}

extension Notification.Name {
  /// Posted after the user records or clears a tool's shortcut. `userInfo`: `assignedToolId`,
  /// and `clearedToolIds`, the tools that lost the same shortcut.
  static let toolShortcutDidChange = Notification.Name("toolShortcutDidChange")
}
