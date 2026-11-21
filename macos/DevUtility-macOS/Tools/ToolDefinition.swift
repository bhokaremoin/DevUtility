import AppKit

enum OpeningPosition {
  case atMousePointer
  case centeredOnMouseScreen
}

enum ClosingRule {
  case closesOnOutsideClick
  case closesOnlyExplicitly
}

enum ToolIcon: Equatable {
  case asset(String)
  case systemSymbol(String)
}

/// Everything that makes one tool behave differently from another. A tool's behavior is declared
/// here rather than coded per tool, so adding a tool is one entry in `ToolRegistry`.
struct ToolDefinition {
  let id: String
  let displayName: String
  /// The name its React Native root is registered under in `index.js`.
  let moduleName: String
  let icon: ToolIcon
  let size: NSSize
  let minimumSize: NSSize
  let openingPosition: OpeningPosition
  let closingRule: ClosingRule
}
