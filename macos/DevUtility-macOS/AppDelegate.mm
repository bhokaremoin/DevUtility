#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import "DevUtility-Swift.h"

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
  self.moduleName = @"DevUtility";
  self.initialProps = @{};

  [super applicationDidFinishLaunching:notification];

  NSWindow *defaultWindow = nil;
  for (NSWindow *w in [NSApp windows]) {
    if (![w isKindOfClass:[NSPanel class]] && w.contentView != nil) {
      defaultWindow = w;
      break;
    }
  }

  if (defaultWindow) {
    NSView *rootView = defaultWindow.contentView;
    defaultWindow.contentView = [[NSView alloc] initWithFrame:NSZeroRect];
    [defaultWindow setDelegate:nil];
    [defaultWindow orderOut:nil];
    [defaultWindow close];

    [[PanelManager shared] setupWith:rootView];
    [[PanelManager shared] show];
  } else {
    NSLog(@"[DevUtility] ERROR: No default window found after super init");
  }
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender
{
  return NO;
}

- (BOOL)applicationShouldHandleReopen:(NSApplication *)sender hasVisibleWindows:(BOOL)flag
{
  if (!flag) {
    [[PanelManager shared] show];
  }
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

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
