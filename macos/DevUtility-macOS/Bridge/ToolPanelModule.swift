import Foundation

/// Lets a tool's JS close its own panel, for example when Esc has nothing else to do, and end
/// text editing in it.
@objc(ToolPanelModule)
final class ToolPanelModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func hide(_ toolId: String) {
    DispatchQueue.main.async {
      ToolPanels.shared.controller(for: toolId)?.hide()
    }
  }

  /// Takes keyboard focus off whatever text input has it in the tool's panel. React Native's
  /// Keyboard.dismiss() does not blur a field that was focused from JS, such as Snippets' search.
  @objc func endEditing(_ toolId: String) {
    DispatchQueue.main.async {
      guard let panel = ToolPanels.shared.controller(for: toolId)?.panel else { return }
      panel.makeFirstResponder(nil)
    }
  }
}
