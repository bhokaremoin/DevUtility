import Cocoa
import KeyboardShortcuts

/// Reads and resets each tool's global shortcut for the Settings screen. The shortcuts themselves
/// are registered by each tool's ToolPanelController.
@objc(GlobalShortcutModule)
final class GlobalShortcutModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { true }

  @objc static func resetShortcutsForE2E() {
    KeyboardShortcuts.reset(ToolShortcuts.allNames)
  }

  /// `tools`: every tool in registry order, as `{id, displayName, defaultShortcutLabel}`.
  /// React Native reads constants on the main queue because of requiresMainQueueSetup.
  @objc func constantsToExport() -> [AnyHashable: Any] {
    MainActor.assumeIsolated { ["tools": toolConstants()] }
  }

  @MainActor private func toolConstants() -> [[String: String]] {
    ToolRegistry.all.map { tool -> [String: String] in
      let defaultShortcut = ToolShortcuts.name(for: tool.id)?.defaultShortcut
      return [
        "id": tool.id,
        "displayName": tool.displayName,
        "defaultShortcutLabel": defaultShortcut?.description ?? "",
      ]
    }
  }

  /// Resolves with `{keyCode, modifiers, description}`, or `null` when the tool has no shortcut.
  @objc func getShortcut(
    _ toolId: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard let name = ToolShortcuts.name(for: toolId) else {
        reject("unknown_tool", "No tool with id \(toolId)", nil)
        return
      }
      guard let shortcut = KeyboardShortcuts.getShortcut(for: name) else {
        resolve(NSNull())
        return
      }
      var result: [String: Any] = [
        "modifiers": Int(shortcut.modifiers.rawValue),
        "description": shortcut.description,
      ]
      if let key = shortcut.key {
        result["keyCode"] = Int(key.rawValue)
      }
      resolve(result)
    }
  }

  @objc func resetShortcut(_ toolId: String) {
    DispatchQueue.main.async {
      guard let name = ToolShortcuts.name(for: toolId) else { return }
      KeyboardShortcuts.reset(name)
    }
  }
}
