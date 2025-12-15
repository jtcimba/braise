//
//  AppDelegate.mm
//  braise
//
//  Created by Jake Cimbalista on 12/6/25.
//

#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTBridge.h>

@interface AppDelegate ()
@property (nonatomic, strong) id pendingRecipe;
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"braise";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  // Check if app was launched from a URL
  NSURL *url = launchOptions[UIApplicationLaunchOptionsURLKey];
  if (url) {
    [self processImportURL:url];
  }

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (void)processImportURL:(NSURL *)url {
  // Handle deep link: braise://import-complete
  // Recipe data is stored in App Group UserDefaults, not in the URL
  if ([url.scheme isEqualToString:@"braise"] && [url.host isEqualToString:@"import-complete"]) {
    // Read recipe from App Group UserDefaults
    NSUserDefaults *sharedDefaults = [[NSUserDefaults alloc] initWithSuiteName:@"group.com.braise.recipe"];
    if (sharedDefaults) {
      id recipeObj = [sharedDefaults objectForKey:@"importedRecipe"];
      if (recipeObj) {
        // Emit the event with the recipe
        [self emitImportEvent:recipeObj retryCount:0];
        // Clear the recipe from UserDefaults after reading
        [sharedDefaults removeObjectForKey:@"importedRecipe"];
        [sharedDefaults synchronize];
      }
    }
  }
}

- (void)emitImportEvent:(id)recipeObj retryCount:(int)retryCount {
  if (self.bridge) {
    [self.bridge enqueueJSCall:@"RCTDeviceEventEmitter"
                         method:@"emit"
                           args:@[@"ImportCompleted", recipeObj]
                     completion:nil];
    self.pendingRecipe = nil;
  } else {
    // Bridge not ready yet, store recipe and retry (max 10 retries = 5 seconds)
    if (retryCount < 10) {
      self.pendingRecipe = recipeObj;
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self emitImportEvent:recipeObj retryCount:retryCount + 1];
      });
    } else {
      NSLog(@"Failed to emit ImportCompleted event - bridge never became ready");
      self.pendingRecipe = nil;
    }
  }
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  [self processImportURL:url];
  return YES;
}

@end
