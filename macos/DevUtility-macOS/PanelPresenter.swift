// PanelPresenter.swift
// DevUtility
//
// Description: Shows and hides a panel as the key window without activating the app.
// Architecture Role: Used by PanelManager. Activation on macOS 14+ is a request the system can
//   decline (it does for an app launched in the background), and an inactive app's ordinary
//   window gets no keys. A non-activating panel takes key status on its own, so keys reach it
//   whether or not DevUtility is the active app. A click inside the panel still makes the window
//   server activate DevUtility, so hiding hands focus back to the app that was in front before.

import Cocoa

final class PanelPresenter {
  private let panel: NSPanel
  private var appInFrontBeforeShow: NSRunningApplication?

  init(panel: NSPanel) {
    self.panel = panel
  }

  func show(at origin: NSPoint) {
    let frontmostApp = NSWorkspace.shared.frontmostApplication
    appInFrontBeforeShow = frontmostApp == .current ? nil : frontmostApp
    panel.setFrameOrigin(origin)
    panel.makeKeyAndOrderFront(nil)
    // The window server can finish ordering the panel in after this run-loop turn; retry once then.
    DispatchQueue.main.async { [panel] in
      guard panel.isVisible, !panel.isKeyWindow else { return }
      panel.makeKey()
      if !panel.isKeyWindow {
        NSLog("[DevUtility] panel did not become key after show")
      }
    }
  }

  func hide() {
    panel.orderOut(nil)
    returnFocusIfThePanelTookIt()
  }

  private func returnFocusIfThePanelTookIt() {
    // A click on another app makes that app frontmost before the panel hides, so this also
    // leaves the focus that click gave it.
    guard NSWorkspace.shared.frontmostApplication == .current,
          let previousApp = appInFrontBeforeShow,
          !previousApp.isTerminated else { return }
    previousApp.activate(options: [])
  }
}
