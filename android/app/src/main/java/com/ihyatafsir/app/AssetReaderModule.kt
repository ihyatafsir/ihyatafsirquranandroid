package com.ihyatafsir.app

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import java.io.BufferedReader
import java.io.InputStreamReader

class AssetReaderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "AssetReader"

    @ReactMethod
    fun readAsset(assetPath: String, promise: Promise) {
        try {
            val inputStream = reactApplicationContext.assets.open(assetPath)
            val reader = BufferedReader(InputStreamReader(inputStream, "UTF-8"))
            val content = reader.readText()
            reader.close()
            inputStream.close()
            promise.resolve(content)
        } catch (e: Exception) {
            promise.reject("ASSET_READ_ERROR", e.message, e)
        }
    }
}
