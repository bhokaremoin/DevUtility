import Foundation

/// Lets a tool's JS close its own panel, for example when Esc has nothing else to do.
@objc(ToolPanelModule)
final class ToolPanelModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func hide(_ toolId: String) {
    DispatchQueue.main.async {
      ToolPanels.shared.controller(for: toolId)?.hide()
    }
  }
}
