package com.as608.reactnative

import android.Manifest
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionManager

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SimInfoModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val SMS_PERMISSION_REQUEST = 7001

        private const val ACTION_SMS_SENT =
            "com.as608.reactnative.SMS_SENT"

        private const val ACTION_SMS_DELIVERED =
            "com.as608.reactnative.SMS_DELIVERED"
    }

    override fun getName() = "SimInfo"

    // -------------------------------------------------------------------------
    // SIM INFORMATION
    // -------------------------------------------------------------------------

    @ReactMethod
    fun getActiveSims(promise: Promise) {
        try {
            if (!hasPhoneStatePermission()) {
                promise.reject(
                    "PHONE_STATE_PERMISSION_REQUIRED",
                    "READ_PHONE_STATE permission is required"
                )
                return
            }

            val subscriptionManager =
                reactContext.getSystemService(
                    Context.TELEPHONY_SUBSCRIPTION_SERVICE
                ) as SubscriptionManager

            val subscriptions =
                subscriptionManager.activeSubscriptionInfoList

            val result = Arguments.createArray()

            subscriptions?.forEach { subscription ->

                val sim = Arguments.createMap()

                sim.putInt(
                    "slotIndex",
                    subscription.simSlotIndex
                )

                sim.putInt(
                    "subscriptionId",
                    subscription.subscriptionId
                )

                sim.putString(
                    "carrierName",
                    subscription.carrierName?.toString()
                )

                sim.putString(
                    "displayName",
                    subscription.displayName?.toString()
                )

                sim.putString(
                    "countryIso",
                    subscription.countryIso
                )

                result.pushMap(sim)
            }

            promise.resolve(result)

        } catch (e: Exception) {
            promise.reject(
                "SIM_INFO_ERROR",
                e.message,
                e
            )
        }
    }

    // -------------------------------------------------------------------------
    // PERMISSIONS
    // -------------------------------------------------------------------------

    private fun hasPhoneStatePermission(): Boolean {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
            reactContext.checkSelfPermission(
                Manifest.permission.READ_PHONE_STATE
            ) == PackageManager.PERMISSION_GRANTED
    }

    private fun hasSmsPermission(): Boolean {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
            reactContext.checkSelfPermission(
                Manifest.permission.SEND_SMS
            ) == PackageManager.PERMISSION_GRANTED
    }

    @ReactMethod
    fun hasSmsPermission(promise: Promise) {
        promise.resolve(hasSmsPermission())
    }

    @ReactMethod
    fun requestSmsPermission(promise: Promise) {
        try {
            if (hasSmsPermission()) {
                promise.resolve(true)
                return
            }

            val activity = reactContext.currentActivity

            if (activity == null) {
                promise.reject(
                    "NO_ACTIVITY",
                    "Current Android activity is unavailable"
                )
                return
            }

            activity.requestPermissions(
                arrayOf(
                    Manifest.permission.SEND_SMS
                ),
                SMS_PERMISSION_REQUEST
            )

            /*
             * Android does not return the permission result directly
             * through this Promise. The JS side should call hasSmsPermission()
             * after the Android permission dialog has been handled.
             */
            promise.resolve(true)

        } catch (e: Exception) {
            promise.reject(
                "SMS_PERMISSION_ERROR",
                e.message,
                e
            )
        }
    }

    // -------------------------------------------------------------------------
    // SMS
    // -------------------------------------------------------------------------

    @ReactMethod
    fun sendSms(
        subscriptionId: Int,
        phoneNumber: String,
        message: String,
        promise: Promise
    ) {
        try {

            if (phoneNumber.isBlank()) {
                promise.reject(
                    "INVALID_PHONE_NUMBER",
                    "Phone number cannot be empty"
                )
                return
            }

            if (message.isBlank()) {
                promise.reject(
                    "INVALID_MESSAGE",
                    "SMS message cannot be empty"
                )
                return
            }

            if (!hasSmsPermission()) {
                promise.reject(
                    "SMS_PERMISSION_REQUIRED",
                    "SEND_SMS permission is required"
                )
                return
            }

            if (!hasPhoneStatePermission()) {
                promise.reject(
                    "PHONE_STATE_PERMISSION_REQUIRED",
                    "READ_PHONE_STATE permission is required"
                )
                return
            }

            val subscriptionManager =
                reactContext.getSystemService(
                    Context.TELEPHONY_SUBSCRIPTION_SERVICE
                ) as SubscriptionManager

            val subscription =
                subscriptionManager.activeSubscriptionInfoList
                    ?.firstOrNull {
                        it.subscriptionId == subscriptionId
                    }

            if (subscription == null) {
                promise.reject(
                    "SIM_NOT_FOUND",
                    "SIM with subscriptionId $subscriptionId is not active"
                )
                return
            }

            val smsManager = getSmsManager(subscriptionId)

            val parts =
                smsManager.divideMessage(message)

            val sentIntents = ArrayList<PendingIntent>()
            val deliveryIntents = ArrayList<PendingIntent>()

            for (i in parts.indices) {

                val sentIntent = PendingIntent.getBroadcast(
                    reactContext,
                    createRequestCode(),
                    Intent(ACTION_SMS_SENT).apply {
                        setPackage(reactContext.packageName)

                        putExtra("subscriptionId", subscriptionId)
                        putExtra("partIndex", i)
                        putExtra("totalParts", parts.size)
                    },
                    pendingIntentFlags()
                )

                val deliveryIntent = PendingIntent.getBroadcast(
                    reactContext,
                    createRequestCode(),
                    Intent(ACTION_SMS_DELIVERED).apply {
                        setPackage(reactContext.packageName)

                        putExtra("subscriptionId", subscriptionId)
                        putExtra("partIndex", i)
                        putExtra("totalParts", parts.size)
                    },
                    pendingIntentFlags()
                )

                sentIntents.add(sentIntent)
                deliveryIntents.add(deliveryIntent)
            }

            /*
             * sendTextMessage() is used for a single-part SMS.
             *
             * sendMultipartTextMessage() is used automatically when
             * divideMessage() produces multiple parts.
             */
            if (parts.size == 1) {

                smsManager.sendTextMessage(
                    phoneNumber,
                    null,
                    message,
                    sentIntents[0],
                    deliveryIntents[0]
                )

            } else {

                smsManager.sendMultipartTextMessage(
                    phoneNumber,
                    null,
                    parts,
                    sentIntents,
                    deliveryIntents
                )
            }

            val result = Arguments.createMap()

            result.putBoolean("success", true)
            result.putInt("subscriptionId", subscriptionId)
            result.putInt(
                "slotIndex",
                subscription.simSlotIndex
            )
            result.putString(
                "carrierName",
                subscription.carrierName?.toString()
            )
            result.putString("phoneNumber", phoneNumber)
            result.putInt("parts", parts.size)

            promise.resolve(result)

        } catch (e: Exception) {

            promise.reject(
                "SMS_SEND_ERROR",
                e.message,
                e
            )
        }
    }

    // -------------------------------------------------------------------------
    // SMS MANAGER
    // -------------------------------------------------------------------------

    private fun getSmsManager(
        subscriptionId: Int
    ): SmsManager {

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {

            reactContext.getSystemService(
                SmsManager::class.java
            ).createForSubscriptionId(subscriptionId)

        } else {

            @Suppress("DEPRECATION")
            SmsManager.getSmsManagerForSubscriptionId(
                subscriptionId
            )
        }
    }

    // -------------------------------------------------------------------------
    // SMS CALLBACKS
    // -------------------------------------------------------------------------

    private fun pendingIntentFlags(): Int {

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {

            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_MUTABLE

        } else {

            PendingIntent.FLAG_UPDATE_CURRENT
        }
    }

    private fun createRequestCode(): Int {
        return (System.currentTimeMillis() % Int.MAX_VALUE).toInt()
    }

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------

    override fun invalidate() {
        super.invalidate()
    }
}