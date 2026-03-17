import Cocoa
import KeyboardShortcuts

@objc(ShortcutRecorderManager)
class ShortcutRecorderManager: RCTViewManager {

  override static func requiresMainQueueSetup() -> Bool { true }

  override func view() -> NSView {
    let recorder = KeyboardShortcuts.RecorderCocoa(for: .toggleApp)
    recorder.setContentHuggingPriority(.defaultHigh, for: .horizontal)
    recorder.setContentHuggingPriority(.defaultHigh, for: .vertical)
    return recorder
  }
}
