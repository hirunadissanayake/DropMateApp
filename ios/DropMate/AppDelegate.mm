#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <Firebase.h>
#if DEBUG
#import <AudioToolbox/AudioToolbox.h>
#import <UserNotifications/UserNotifications.h>
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  self.moduleName = @"DropMate";
  self.dependencyProvider = [RCTAppDependencyProvider new];
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

#if DEBUG
- (void)applicationDidBecomeActive:(UIApplication *)application
{
  NSURL *soundURL = [[NSBundle mainBundle] URLForResource:@"request_alert" withExtension:@"caf"];
  SystemSoundID soundID = 0;
  OSStatus soundStatus = soundURL
      ? AudioServicesCreateSystemSoundID((__bridge CFURLRef)soundURL, &soundID)
      : -50;
  NSLog(@"[ParcelSound] bundledCAF=%@ systemSoundStatus=%d (0 means valid)",
        soundURL ? @"YES" : @"NO", (int)soundStatus);
  if (soundStatus == 0) AudioServicesDisposeSystemSoundID(soundID);

  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
    NSLog(@"[ParcelSound] authorization=%ld sounds=%ld alerts=%ld (settings: 0=unsupported, 1=disabled, 2=enabled)",
          (long)settings.authorizationStatus, (long)settings.soundSetting, (long)settings.alertSetting);
  }];
  [center getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> *notifications) {
    for (UNNotification *notification in notifications) {
      NSDictionary *payload = notification.request.content.userInfo;
      NSString *type = payload[@"type"];
      if ([type isEqualToString:@"DELIVERY_REQUEST"] || [type isEqualToString:@"match_request"]) {
        NSLog(@"[ParcelSound] delivered type=%@ aps.sound=%@",
              type, payload[@"aps"][@"sound"] ?: @"MISSING");
      }
    }
  }];
}
#endif

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
