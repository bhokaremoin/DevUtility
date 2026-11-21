#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(GlobalShortcutModule, NSObject)

RCT_EXTERN_METHOD(getShortcut:(NSString *)toolId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(resetShortcut:(NSString *)toolId)

@end
