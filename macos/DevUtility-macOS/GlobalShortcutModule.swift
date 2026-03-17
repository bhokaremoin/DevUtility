import Cocoa
import KeyboardShortcuts

extension KeyboardShortcuts.Name {
  static let toggleApp = Self("toggleApp", default: .init(.d, modifiers: [.control, .option]))
}

@objc(GlobalShortcutModule)
class GlobalShortcutModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { true }

  override init() {
    super.init()
    KeyboardShortcuts.onKeyDown(for: .toggleApp) {
      PanelManager.shared.toggle()
    }
  }

  @objc func getShortcut(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard let shortcut = KeyboardShortcuts.getShortcut(for: .toggleApp) else {
        resolve(NSNull())
        return
      }
      var result: [String: Any] = [:]
      if let key = shortcut.key {
        result["keyCode"] = Int(key.rawValue)
      }
      result["modifiers"] = Int(shortcut.modifiers.rawValue)
      result["description"] = shortcut.description
      resolve(result)
    }
  }

  @objc func resetShortcut() {
    DispatchQueue.main.async {
      KeyboardShortcuts.reset(.toggleApp)
    }
  }
}
