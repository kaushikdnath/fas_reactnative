package com.as608.reactnative

import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class AS608Module(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val executor: ExecutorService = Executors.newSingleThreadExecutor()
    private val transport = CH340Transport(reactContext)
    private val protocol = AS608Protocol(transport)

    override fun getName() = "AS608"

    @ReactMethod
    fun addListener(eventName: String) {
    }

    @ReactMethod
    fun removeListeners(count: Int) {
    }

    private fun emit(event: String, message: String, extra: Map<String, Any?> = emptyMap()) {
        val map = Arguments.createMap()
        map.putString("message", message)
        for ((k, v) in extra) when (v) {
            is String -> map.putString(k, v)
            is Int -> map.putInt(k, v)
            is Long -> map.putDouble(k, v.toDouble())
            is Boolean -> map.putBoolean(k, v)
            is Double -> map.putDouble(k, v)
        }
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(event, map)
    }

    private fun fail(promise: Promise, error: Throwable) {
        if (error is AS608Exception) promise.reject(
            "AS608_ERROR",
            error.message,
            error.status?.let { Throwable("status=0x%02X".format(it)) })
        else promise.reject("AS608_NATIVE_ERROR", error.message, error)
    }

    @ReactMethod
    fun listDevices(promise: Promise) {
        try {
            promise.resolve(Arguments.makeNativeArray(transport.listDevices().map { Arguments.makeNativeMap(it) }))
        } catch (e: Throwable) {
            fail(promise, e)
        }
    }

    @ReactMethod
    fun connect(deviceId: Int, options: ReadableMap?, promise: Promise) {
        val baud = options?.getInt("baudRate") ?: 57600
        val dataBits = options?.getInt("dataBits") ?: 8
        val stopBits = options?.getInt("stopBits") ?: 1
        val parity = options?.getInt("parity") ?: 0
        transport.open(
            transport.listDevices().firstOrNull { (it["deviceId"] as? Int) == deviceId }?.let { findDevice(deviceId) }
                ?: run { promise.reject("DEVICE_NOT_FOUND", "USB device $deviceId not found"); return },
            baud,
            dataBits,
            stopBits,
            parity
        ) { ok, error ->
            if (ok) {
                try {
                    // USB opened is not the same as AS608 communication being ready.
                    // Perform a real sensor command before reporting Connected.
                    val params = protocol.getParameters()
                    val status = params["status"] as? Int ?: -1

                    if (status != AS608Protocol.OK) {
                        transport.close()
                        throw AS608Exception(
                            "AS608 responded with status 0x%02X".format(status),
                            status
                        )
                    }

                    emit(
                        "AS608_STATUS",
                        "Connected",
                        mapOf(
                            "capacity" to protocol.capacity,
                            "packetLength" to protocol.packetLength,
                            "baudRate" to protocol.sensorBaudRate
                        )
                    )
                    promise.resolve(true)
                } catch (e: Throwable) {
                    transport.close()
                    fail(promise, e)
                }
            } else {
                fail(
                    promise,
                    error ?: IllegalStateException("USB open failed")
                )
            }
        }
    }

    private fun findDevice(deviceId: Int): android.hardware.usb.UsbDevice? =
        (reactContext.getSystemService(android.content.Context.USB_SERVICE) as android.hardware.usb.UsbManager).deviceList.values.firstOrNull { it.deviceId == deviceId }

    @ReactMethod
    fun disconnect(promise: Promise) {
        try {
            transport.close(); emit("AS608_STATUS", "Disconnected"); promise.resolve(true)
        } catch (e: Throwable) {
            fail(promise, e)
        }
    }

    @ReactMethod
    fun isConnected(promise: Promise) {
        promise.resolve(transport.isOpen())
    }

    @ReactMethod
    fun initialize(promise: Promise) = executor.execute {
        try {
            protocol.led(false)
            if (!protocol.verifyPassword()) throw AS608Exception("AS608 password verification failed")
            val params = protocol.getParameters()
            if ((params["status"] as Int) != AS608Protocol.OK) throw AS608Exception("Failed to read sensor parameters")
            protocol.getTemplateCount(); protocol.led(false)
            promise.resolve(Arguments.makeNativeMap(params + mapOf("templateCount" to protocol.cachedTemplateCount)))
            emit("AS608_STATUS", "Initialized", mapOf("templateCount" to protocol.cachedTemplateCount))
        } catch (e: Throwable) {
            fail(promise, e)
        }
    }

    @ReactMethod
    fun getParameters(promise: Promise) = async(promise) { protocol.getParameters() }
    @ReactMethod
    fun getTemplateCount(promise: Promise) = async(promise) { protocol.getTemplateCount() }
    @ReactMethod
    fun getOccupiedSlots(promise: Promise) = async(promise) { protocol.occupiedSlots() }
    @ReactMethod
    fun getFreeSlots(promise: Promise) =
        async(promise) { (0 until protocol.capacity).filter { it !in protocol.occupiedSlots() } }

    @ReactMethod
    fun getImage(promise: Promise) = async(promise) { protocol.getImage() }
    @ReactMethod
    fun image2Tz(slot: Int, promise: Promise) = async(promise) { protocol.image2Tz(slot) }
    @ReactMethod
    fun createModel(promise: Promise) = async(promise) { protocol.createModel() }
    @ReactMethod
    fun storeModel(location: Int, promise: Promise) = async(promise) { protocol.storeModel(location) }
    @ReactMethod
    fun loadModel(location: Int, slot: Int, promise: Promise) = async(promise) { protocol.loadModel(location, slot) }
    @ReactMethod
    fun deleteModel(location: Int, promise: Promise) = async(promise) { protocol.deleteModel(location) }
    @ReactMethod
    fun clearDatabase(promise: Promise) = async(promise) {
        val status = protocol.clearDatabase()
        emit("AS608_STATUS", "Device database cleared", mapOf("status" to status))
        status
    }

    @ReactMethod
    fun search(slot: Int, startPage: Int, pageCount: Int?, promise: Promise) =
        async(promise) { protocol.search(slot, startPage, pageCount ?: protocol.capacity)?.toMap() }

    @ReactMethod
    fun fastSearch(slot: Int, startPage: Int, pageCount: Int?, promise: Promise) =
        async(promise) { protocol.fastSearch(slot, startPage, pageCount ?: protocol.capacity)?.toMap() }

    @ReactMethod
    fun identify(fast: Boolean, pageCount: Int?, promise: Promise) = executor.execute {
        try {
            emit("AS608_STATUS", "Place finger")
            val match = protocol.identify(fast, pageCount ?: protocol.capacity)
            if (match == null) emit("AS608_STATUS", "No match") else emit(
                "AS608_STATUS",
                "Match found",
                mapOf("id" to match.id, "confidence" to match.confidence)
            )
            promise.resolve(match?.toWritableMap())
        } catch (e: Throwable) {
            fail(promise, e)
        }
    }

    @ReactMethod
    fun enroll(location: Int, promise: Promise) = executor.execute {
        try {
            protocol.enroll(location) { emit("AS608_ENROLL", it) }
            promise.resolve(true)
        } catch (e: Throwable) {
            fail(promise, e)
        }
    }

    @ReactMethod
    fun captureLiveFeature(promise: Promise) = executor.execute {
        try {
            emit("AS608_STATUS", "Place finger"); protocol.captureLiveFeature(); promise.resolve(true)
        } catch (e: Throwable) {
            fail(promise, e)
        }
    }

    @ReactMethod
    fun matchTemplates(promise: Promise) = async(promise) { protocol.matchTemplates().toMap() }

    @ReactMethod
    fun uploadTemplate(slot: Int, promise: Promise) = executor.execute {
        try {
            val bytes = protocol.uploadTemplate(slot); promise.resolve(
                Arguments.makeNativeMap(
                    mapOf(
                        "base64" to Base64.encodeToString(
                            bytes,
                            Base64.NO_WRAP
                        ), "length" to bytes.size
                    )
                )
            )
        } catch (e: Throwable) {
            fail(promise, e)
        }
    }

    @ReactMethod
    fun downloadTemplate(base64: String, slot: Int, promise: Promise) = executor.execute {
        try {
            protocol.downloadTemplate(Base64.decode(base64, Base64.DEFAULT), slot); promise.resolve(true)
        } catch (e: Throwable) {
            fail(promise, e)
        }
    }

    @ReactMethod
    fun readIndexTable(page: Int, promise: Promise) =
        async(promise) { Base64.encodeToString(protocol.readIndexTable(page), Base64.NO_WRAP) }

    @ReactMethod
    fun setBaudRate(code: Int, promise: Promise) = async(promise) { protocol.setBaudRate(code) }
    @ReactMethod
    fun setSecurityLevel(level: Int, promise: Promise) = async(promise) { protocol.setSecurityLevel(level) }
    @ReactMethod
    fun setPacketSize(size: Int, promise: Promise) = async(promise) { protocol.setPacketSize(size) }
    @ReactMethod
    fun led(on: Boolean, promise: Promise) = async(promise) { protocol.led(on) }
    @ReactMethod
    fun auraLed(control: Int, speed: Int, color: Int, count: Int, promise: Promise) =
        async(promise) { protocol.auraLed(control, speed, color, count) }

    @ReactMethod
    fun buildPacket(type: Int, data: ReadableMap, promise: Promise) {
        promise.reject("UNSUPPORTED", "Use buildPacketBytes with an array")
    }

    @ReactMethod
    fun buildPacketBytes(type: Int, data: com.facebook.react.bridge.ReadableArray, promise: Promise) {
        try {
            promise.resolve(
                Base64.encodeToString(
                    protocol.buildPacket(
                        type,
                        ByteArray(data.size()) { data.getInt(it).toByte() }), Base64.NO_WRAP
                )
            )
        } catch (e: Throwable) {
            fail(promise, e)
        }
    }

    private fun async(promise: Promise, work: () -> Any?) = executor.execute {
        try {
            promise.resolve(toWritable(work()))
        } catch (e: Throwable) {
            fail(promise, e)
        }
    }

    private fun toWritable(value: Any?): Any? = when (value) {
        is FingerprintMatch -> value.toMap()
        is TemplateMatch -> value.toMap()
        is Map<*, *> -> Arguments.makeNativeMap(value.mapKeys { it.key.toString() })
        is List<*> -> Arguments.makeNativeArray(value)
        else -> value
    }

    private fun FingerprintMatch.toMap() = mapOf("id" to id, "confidence" to confidence)
    private fun FingerprintMatch.toWritableMap() =
        Arguments.createMap().apply {
            putInt("id", id)
            putInt("confidence", confidence)
        }

    private fun TemplateMatch.toMap() =
        mapOf("matched" to matched, "score" to score, "status" to status)

    override fun invalidate() {
        try {
            transport.close()
        } catch (_: Exception) {
        }; executor.shutdownNow(); super.invalidate()
    }
}
