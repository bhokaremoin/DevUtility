import Cocoa
import KeyboardShortcuts

/// Hosts the shortcut library's recorder for the tool named by the `toolId` prop. The recorder
/// stores what the user records itself, so the new shortcut works at once.
final class ShortcutRecorderView: NSView {
  private var recorder: KeyboardShortcuts.RecorderCocoa?

  @objc var toolId: NSString = "" {
    didSet { showRecorder(for: toolId as String) }
  }

  private func showRecorder(for toolId: String) {
    recorder?.removeFromSuperview()
    guard let name = ToolShortcuts.name(for: toolId) else { return }

    let recorder = KeyboardShortcuts.RecorderCocoa(for: name)
    recorder.setAccessibilityIdentifier("settings.shortcut.\(toolId)")
    recorder.translatesAutoresizingMaskIntoConstraints = false
    addSubview(recorder)
    NSLayoutConstraint.activate([
      recorder.leadingAnchor.constraint(equalTo: leadingAnchor),
      recorder.trailingAnchor.constraint(equalTo: trailingAnchor),
      recorder.topAnchor.constraint(equalTo: topAnchor),
      recorder.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
    self.recorder = recorder
  }
}

@objc(ShortcutRecorderManager)
final class ShortcutRecorderManager: RCTViewManager {
  override static func requiresMainQueueSetup() -> Bool { true }

  override func view() -> NSView {
    ShortcutRecorderView()
  }
}
