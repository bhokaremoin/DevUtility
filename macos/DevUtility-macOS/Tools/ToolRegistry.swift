import AppKit

enum ToolRegistry {
  static let all: [ToolDefinition] = [
    ToolDefinition(
      id: "clipboard",
      displayName: "Clipboard",
      moduleName: "ClipboardTool",
      icon: .systemSymbol("list.clipboard"),
      size: NSSize(width: 560, height: 420),
      minimumSize: NSSize(width: 420, height: 300),
      openingPosition: .atMousePointer,
      closingRule: .closesOnOutsideClick
    ),
    ToolDefinition(
      id: "snippets",
      displayName: "Snippets",
      moduleName: "SnippetsTool",
      icon: .asset("MenuBarIcon"),
      size: NSSize(width: 800, height: 600),
      minimumSize: NSSize(width: 480, height: 360),
      openingPosition: .centeredOnMouseScreen,
      closingRule: .closesOnlyExplicitly
    ),
  ]

  static func tool(withId id: String) -> ToolDefinition? {
    all.first { $0.id == id }
  }
}
