import Cocoa

/// The floating panel that hosts one tool's React Native root.
final class ToolPanel: NSPanel {
  let toolId: String

  init(tool: ToolDefinition) {
    toolId = tool.id
    // .nonactivatingPanel must be set at creation: toggling it later is unreliable in AppKit.
    super.init(
      contentRect: NSRect(origin: .zero, size: tool.size),
      styleMask: [.nonactivatingPanel, .titled, .fullSizeContentView, .resizable],
      backing: .buffered,
      defer: false
    )
    titlebarAppearsTransparent = true
    titleVisibility = .hidden
    isMovableByWindowBackground = true
    level = .floating
    collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
    hidesOnDeactivate = false
    isReleasedWhenClosed = false
    becomesKeyOnlyIfNeeded = false
    backgroundColor = NSColor(red: 0.051, green: 0.051, blue: 0.051, alpha: 1.0)
    hasShadow = true
    minSize = tool.minimumSize
    setAccessibilityIdentifier("\(tool.id).window")
  }

  override var canBecomeKey: Bool { true }
  override var canBecomeMain: Bool { true }

  // Esc reaches KeyEventModule, which lets the tool's JS decide what Esc does.
  override func cancelOperation(_ sender: Any?) {}
}
