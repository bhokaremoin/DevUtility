/// A shortcut as the shortcut library stores it, without depending on that library.
struct ShortcutBinding: Equatable {
  let keyCode: Int
  let modifiers: UInt
}

/// The shortcut library fires every handler bound to the same keys, so two tools must never share
/// a shortcut: the tool that takes it wins, and the others lose it.
enum ShortcutConflictResolver {
  static func toolsToClear(
    assigning binding: ShortcutBinding?,
    to toolId: String,
    current: [(toolId: String, binding: ShortcutBinding?)]
  ) -> [String] {
    guard let binding else { return [] }

    return current
      .filter { $0.toolId != toolId && $0.binding == binding }
      .map(\.toolId)
  }
}
