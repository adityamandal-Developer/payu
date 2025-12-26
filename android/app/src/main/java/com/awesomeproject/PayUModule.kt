package com.awesomeproject

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import `in`.payu.payu_upi_sdk.PayUUpiSdk
import `in`.payu.payu_upi_sdk.PayUUpiSdkInitializer
import `in`.payu.payu_upi_sdk.PaymentResponse
import `in`.payu.payu_upi_sdk.entity.PayUPaymentParams
import org.json.JSONObject

class PayUModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var paymentPromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String {
        return "PayUModule"
    }

    @ReactMethod
    fun initializePayU(merchantKey: String, isProduction: Boolean, promise: Promise) {
        try {
            val environment = if (isProduction) {
                PayUUpiSdkInitializer.Environment.PRODUCTION
            } else {
                PayUUpiSdkInitializer.Environment.TEST
            }

            PayUUpiSdk.init(
                activity = currentActivity,
                merchantKey = merchantKey,
                environment = environment
            )

            promise.resolve("PayU SDK Initialized")
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", e.message)
        }
    }

    @ReactMethod
    fun makePayment(paymentParams: ReadableMap, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity not available")
            return
        }

        try {
            paymentPromise = promise

            val params = PayUPaymentParams.Builder()
                .setAmount(paymentParams.getString("amount") ?: "")
                .setIsProduction(paymentParams.getBoolean("isProduction"))
                .setProductInfo(paymentParams.getString("productInfo") ?: "")
                .setKey(paymentParams.getString("key") ?: "")
                .setPhone(paymentParams.getString("phone") ?: "")
                .setTransactionId(paymentParams.getString("txnid") ?: "")
                .setFirstName(paymentParams.getString("firstname") ?: "")
                .setEmail(paymentParams.getString("email") ?: "")
                .setSurl(paymentParams.getString("surl") ?: "")
                .setFurl(paymentParams.getString("furl") ?: "")
                .setEnvironment(PayUUpiSdkInitializer.Environment.TEST)
                .setUserCredential(paymentParams.getString("hash") ?: "")
                .build()

            PayUUpiSdk.openPaymentActivity(activity, params)

        } catch (e: Exception) {
            promise.reject("PAYMENT_ERROR", e.message)
            paymentPromise = null
        }
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == PayUUpiSdk.PAYU_UPI_SDK_PAYMENT_REQUEST_CODE) {
            handlePaymentResult(data)
        }
    }

    private fun handlePaymentResult(data: Intent?) {
        val promise = paymentPromise ?: return

        try {
            if (data != null) {
                val response = PaymentResponse.fromIntent(data)

                val result = Arguments.createMap()
                result.putString("status", response.paymentStatus)
                result.putString("message", response.message)
                result.putString("txnId", response.txnId)
                result.putString("paymentId", response.paymentId)

                // Additional fields
                response.amount?.let { result.putString("amount", it) }
                response.merchantKey?.let { result.putString("merchantKey", it) }

                promise.resolve(result)
            } else {
                promise.reject("NO_DATA", "No payment data received")
            }
        } catch (e: Exception) {
            promise.reject("RESULT_ERROR", e.message)
        } finally {
            paymentPromise = null
        }
    }

    override fun onNewIntent(intent: Intent?) {
        // Not needed for this implementation
    }
}
