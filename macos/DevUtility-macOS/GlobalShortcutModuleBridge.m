#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(GlobalShortcutModule, NSObject)
RCT_EXTERN_METHOD(getShortcut:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(resetShortcut)
@end
