package com.as608.reactnative

import android.content.Context
import android.telephony.SubscriptionManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SimInfoModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "SimInfo"

    @ReactMethod
    fun getActiveSims(promise: Promise) {
        try {
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
}