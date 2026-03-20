// ShortcutRecorderViewManagerBridge.m
// DevUtility
//
// Description: Obj-C bridge declaration for ShortcutRecorderManager (Swift).
// Registers the view manager with the React Native bridge so the JS side can
// instantiate it with `requireNativeComponent('ShortcutRecorder')`.

#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(ShortcutRecorderManager, RCTViewManager)
@end
