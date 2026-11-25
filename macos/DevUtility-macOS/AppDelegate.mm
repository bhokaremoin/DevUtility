#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import "DevUtility-Swift.h"

@implementation AppDelegate

// MARK: - E2E

// Only the E2E build honors the --e2e-* flags, so a stray flag can never wipe a user's data.
- (BOOL)isE2EFlagSet:(NSString *)flag
{
#if E2E_BUILD
  return [[[NSProcessInfo processInfo] arguments] containsObject:flag];
#else
  return NO;
#endif
}

- (BOOL)isE2EResetRequested
{
  return [self isE2EFlagSet:@"--e2e-reset"];
}

// MARK: - Onboarding

static NSString *const HasShownMultiToolOnboardingKey = @"hasShownMultiToolOnboarding";

// The first launch after the update to separate tools opens Settings once, so the new per-tool
// shortcuts are seen; later launches open nothing.
- (void)showMultiToolOnboardingIfNeeded
{
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  if ([self isE2EFlagSet:@"--e2e-skip-onboarding"] || [defaults boolForKey:HasShownMultiToolOnboardingKey]) {
    return;
  }
  [[SettingsWindowController shared] showWithOpenedFromToolId:nil];
  [defaults setBool:YES forKey:HasShownMultiToolOnboardingKey];
}

// MARK: - Lifecycle

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
  NSDictionary *initialProperties = @{@"isE2EReset": @([self isE2EResetRequested])};
  if ([self isE2EResetRequested]) {
    [GlobalShortcutModule resetShortcutsForE2E];
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:HasShownMultiToolOnboardingKey];
  }

  // RCTAppDelegate starts the bridge and puts the first tool's root view in a default window.
  // That root moves into its tool panel; the other roots come from the same bridge.
  self.moduleName = @"ClipboardTool";
  self.initialProps = initialProperties;
  [super applicationDidFinishLaunching:notification];

  NSView *clipboardRootView = [self takeRootViewFromDefaultWindow];
  if (clipboardRootView == nil) {
    NSLog(@"[DevUtility] ERROR: No default window found after super init");
    return;
  }
  NSView *snippetsRootView = [self.rootViewFactory viewWithModuleName:@"SnippetsTool" initialProperties:initialProperties];
  [[ToolPanels shared] setUpWithRootViews:@{@"clipboard": clipboardRootView, @"snippets": snippetsRootView}];

  NSView *settingsRootView = [self.rootViewFactory viewWithModuleName:@"Settings" initialProperties:@{}];
  [[SettingsWindowController shared] setUpWithRootView:settingsRootView];

  [self showMultiToolOnboardingIfNeeded];
}

- (NSView *)takeRootViewFromDefaultWindow
{
  for (NSWindow *window in [NSApp windows]) {
    if ([window isKindOfClass:[NSPanel class]] || window.contentView == nil) {
      continue;
    }
    NSView *rootView = window.contentView;
    window.contentView = [[NSView alloc] initWithFrame:NSZeroRect];
    [window setDelegate:nil];
    [window orderOut:nil];
    [window close];
    return rootView;
  }
  return nil;
}

// Keep the app alive even when all windows are closed — the status bar icon
// is the only persistent UI element.
- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender
{
  return NO;
}

// Opening the app again (for example from Finder) while nothing is visible opens the first tool.
- (BOOL)applicationShouldHandleReopen:(NSApplication *)sender hasVisibleWindows:(BOOL)flag
{
  if (!flag) {
    [[ToolPanels shared] showFirstTool];
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
