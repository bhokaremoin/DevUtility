// AppDelegate.mm
// DevUtility
//
// Description: Application delegate implementation for the DevUtility macOS target.
// Architecture Role: Entry point for app lifecycle events. Bootstraps the React
//   Native bridge via super, then transplants the RN root view from the default
//   NSWindow into PanelManager's custom NSPanel.

#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import "DevUtility-Swift.h"   // Swift–ObjC bridging header for PanelManager

@implementation AppDelegate

// MARK: - Lifecycle

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
  self.moduleName = @"DevUtility";
  self.initialProps = @{};

  // Let RCTAppDelegate create the React Native root view inside a default window.
  [super applicationDidFinishLaunching:notification];

  // Find the plain NSWindow that RCTAppDelegate created (not our NSPanel).
  NSWindow *defaultWindow = nil;
  for (NSWindow *w in [NSApp windows]) {
    if (![w isKindOfClass:[NSPanel class]] && w.contentView != nil) {
      defaultWindow = w;
      break;
    }
  }

  if (defaultWindow) {
    // Detach the React Native root view from the default window so we can
    // hand it to PanelManager without the window interfering with sizing.
    NSView *rootView = defaultWindow.contentView;
    defaultWindow.contentView = [[NSView alloc] initWithFrame:NSZeroRect];
    [defaultWindow setDelegate:nil];
    [defaultWindow orderOut:nil];
    [defaultWindow close];

    // Give PanelManager the root view; it will embed it in the floating NSPanel.
    [[PanelManager shared] setupWith:rootView];
    [[PanelManager shared] show];
  } else {
    NSLog(@"[DevUtility] ERROR: No default window found after super init");
  }
}

// Keep the app alive even when all windows are closed — the status bar icon
// is the only persistent UI element.
- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender
{
  return NO;
}

// Re-show the panel when the user clicks the Dock icon while no window is visible.
- (BOOL)applicationShouldHandleReopen:(NSApplication *)sender hasVisibleWindows:(BOOL)flag
{
  if (!flag) {
    [[PanelManager shared] show];
  }
  return YES;
}

// MARK: - React Native Bundle

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

/// Returns the JS bundle URL: Metro dev server in DEBUG, bundled jsbundle in release.
- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (BOOL)concurrentRootEnabled
{
#ifdef RN_FABRIC_ENABLED
  return true;
#else
  return false;
#endif
}

@end
