package com.dropmate

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    loadReactNative(this)
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val name = "Delivery Requests"
      val descriptionText = "Notifications for new parcel delivery requests"
      val importance = NotificationManager.IMPORTANCE_HIGH
      val channel = NotificationChannel("delivery_requests", name, importance).apply {
        description = descriptionText
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 500, 200, 500)
        setBypassDnd(true)
        setShowBadge(true)
      }
      
      // Set custom sound for background notifications
      try {
        val soundUri = Uri.parse("android.resource://" + packageName + "/raw/request_alert")
        val audioAttributes = AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_NOTIFICATION)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
        channel.setSound(soundUri, audioAttributes)
      } catch (e: Exception) {
        e.printStackTrace()
      }

      val notificationManager: NotificationManager =
        getSystemService(NOTIFICATION_SERVICE) as NotificationManager
      notificationManager.createNotificationChannel(channel)

      // 2. Standard alerts channel (with system sound and vibration)
      val updatesName = "Updates & Cancellations"
      val updatesDesc = "Notifications for withdrawn requests and status updates"
      val updatesChannel = NotificationChannel("standard_alerts", updatesName, NotificationManager.IMPORTANCE_DEFAULT).apply {
        description = updatesDesc
        enableVibration(true)
        // Uses default system sound and vibration
      }
      notificationManager.createNotificationChannel(updatesChannel)
    }
  }
}
