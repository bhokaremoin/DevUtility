#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ToolPanelModule, NSObject)

RCT_EXTERN_METHOD(hide:(NSString *)toolId)
RCT_EXTERN_METHOD(endEditing:(NSString *)toolId)

@end
