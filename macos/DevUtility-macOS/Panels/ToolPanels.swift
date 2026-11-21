import Cocoa

/// The controllers of every tool, created once at launch from the registry.
@objc final class ToolPanels: NSObject {
  @objc static let shared = ToolPanels()

  private var controllers: [ToolPanelController] = []

  /// `rootViews` maps a tool id to its React Native root view.
  @objc func setUp(rootViews: [String: NSView]) {
    controllers = ToolRegistry.all.compactMap { tool in
      guard let rootView = rootViews[tool.id] else {
        NSLog("[DevUtility] no root view for tool %@", tool.id)
        return nil
      }
      return ToolPanelController(tool: tool, rootView: rootView)
    }
  }

  func controller(for toolId: String) -> ToolPanelController? {
    controllers.first { $0.tool.id == toolId }
  }

  @objc func showFirstTool() {
    controllers.first?.show()
  }
}
