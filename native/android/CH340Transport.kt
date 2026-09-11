package com.as608.reactnative

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Log
import java.io.ByteArrayOutputStream
import kotlin.concurrent.thread

class CH340Transport(private val context: Context) {
    companion object {
        private const val TAG = "AS608_USB"
        const val ACTION_PERMISSION = "com.as608.reactnative.USB_PERMISSION"

        private const val REQ_READ_VERSION = 0x5F
        private const val REQ_SERIAL_INIT = 0xA1
        private const val REQ_WRITE_REG = 0x9A
        private const val REQ_MODEM_CTRL = 0xA4

        private const val LCR_ENABLE_RX = 0x80
        private const val LCR_ENABLE_TX = 0x40
        private const val LCR_CS8 = 0x03
        private const val LCR_STOP_BITS_2 = 0x04
        private const val LCR_ENABLE_PAR = 0x08
        private const val LCR_PAR_EVEN = 0x10
    }

    private val manager =
        context.getSystemService(Context.USB_SERVICE) as UsbManager

    private var connection: UsbDeviceConnection? = null
    private var usbDevice: UsbDevice? = null
    private var usbInterface: UsbInterface? = null
    private var inEndpoint: UsbEndpoint? = null
    private var outEndpoint: UsbEndpoint? = null

    // The working Flutter implementation used a continuous native USB reader
    // and buffered the received bytes before satisfying protocol reads.
    // Keep the same transport model here.
    private val readLock = Object()
    private val rxBuffer = ByteArrayOutputStream()
    @Volatile private var readerRunning = false
    private var readerThread: Thread? = null

    fun listDevices(): List<Map<String, Any?>> =
        manager.deviceList.values.map { d ->
            mapOf(
                "deviceId" to d.deviceId,
                "deviceName" to d.deviceName,
                "productName" to d.productName,
                "manufacturerName" to d.manufacturerName,
                "vendorId" to d.vendorId,
                "productId" to d.productId,
                "interfaceCount" to d.interfaceCount,
                "deviceClass" to d.deviceClass
            )
        }

    fun isOpen(): Boolean =
        connection != null && inEndpoint != null && outEndpoint != null

    fun open(
        device: UsbDevice,
        baudRate: Int = 57600,
        dataBits: Int = 8,
        stopBits: Int = 1,
        parity: Int = 0,
        onPermission: (Boolean, Throwable?) -> Unit
    ) {
        if (!manager.hasPermission(device)) {
            requestPermission(
                device,
                baudRate,
                dataBits,
                stopBits,
                parity,
                onPermission
            )
            return
        }

        try {
            openGranted(device, baudRate, dataBits, stopBits, parity)
            onPermission(true, null)
        } catch (e: Throwable) {
            onPermission(false, e)
        }
    }

    private fun requestPermission(
        device: UsbDevice,
        baudRate: Int,
        dataBits: Int,
        stopBits: Int,
        parity: Int,
        callback: (Boolean, Throwable?) -> Unit
    ) {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(c: Context?, intent: Intent?) {
                if (intent?.action != ACTION_PERMISSION) return

                try {
                    context.unregisterReceiver(this)
                } catch (_: Exception) {
                }

                val granted = intent.getBooleanExtra(
                    UsbManager.EXTRA_PERMISSION_GRANTED,
                    false
                )

                if (!granted) {
                    callback(
                        false,
                        IllegalStateException("USB permission denied")
                    )
                    return
                }

                val d =
                    if (Build.VERSION.SDK_INT >= 33) {
                        intent.getParcelableExtra(
                            UsbManager.EXTRA_DEVICE,
                            UsbDevice::class.java
                        )
                    } else {
                        @Suppress("DEPRECATION")
                        intent.getParcelableExtra(
                            UsbManager.EXTRA_DEVICE
                        )
                    }

                if (d == null) {
                    callback(
                        false,
                        IllegalStateException(
                            "USB device missing after permission grant"
                        )
                    )
                    return
                }

                try {
                    openGranted(
                        d,
                        baudRate,
                        dataBits,
                        stopBits,
                        parity
                    )
                    callback(true, null)
                } catch (e: Throwable) {
                    callback(false, e)
                }
            }
        }

        val filter = IntentFilter(ACTION_PERMISSION)

        if (Build.VERSION.SDK_INT >= 33) {
            context.registerReceiver(
                receiver,
                filter,
                Context.RECEIVER_NOT_EXPORTED
            )
        } else {
            @Suppress("DEPRECATION")
            context.registerReceiver(receiver, filter)
        }

        val flags =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_MUTABLE or
                    PendingIntent.FLAG_UPDATE_CURRENT
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

        val pi = PendingIntent.getBroadcast(
            context,
            device.deviceId,
            Intent(ACTION_PERMISSION).setPackage(
                context.packageName
            ),
            flags
        )

        manager.requestPermission(device, pi)
    }

    private fun openGranted(
        device: UsbDevice,
        baudRate: Int,
        dataBits: Int,
        stopBits: Int,
        parity: Int
    ) {
        close()

        val conn = manager.openDevice(device)
            ?: throw IllegalStateException(
                "UsbManager.openDevice() returned null"
            )

        var selected: UsbInterface? = null
        var input: UsbEndpoint? = null
        var output: UsbEndpoint? = null

        for (i in 0 until device.interfaceCount) {
            val intf = device.getInterface(i)

            Log.d(
                TAG,
                "Interface[$i]: class=${intf.interfaceClass}, " +
                    "subclass=${intf.interfaceSubclass}, " +
                    "protocol=${intf.interfaceProtocol}, " +
                    "endpoints=${intf.endpointCount}"
            )

            var localIn: UsbEndpoint? = null
            var localOut: UsbEndpoint? = null

            for (j in 0 until intf.endpointCount) {
                val ep = intf.getEndpoint(j)

                Log.d(
                    TAG,
                    "Endpoint[$j]: address=0x${ep.address.toString(16)}, " +
                        "type=${ep.type}, direction=${ep.direction}, " +
                        "maxPacket=${ep.maxPacketSize}"
                )

                if (ep.type == UsbConstants.USB_ENDPOINT_XFER_BULK) {
                    if (ep.direction == UsbConstants.USB_DIR_IN) {
                        localIn = ep
                    } else if (ep.direction == UsbConstants.USB_DIR_OUT) {
                        localOut = ep
                    }
                }
            }

            if (localIn != null && localOut != null) {
                selected = intf
                input = localIn
                output = localOut
                break
            }
        }

        if (selected == null || input == null || output == null) {
            conn.close()
            throw IllegalStateException(
                "Could not find CH340 bulk IN/OUT endpoints"
            )
        }

        if (!conn.claimInterface(selected, true)) {
            conn.close()
            throw IllegalStateException(
                "Could not claim CH340 interface"
            )
        }

        try {
            configureCh340(
                conn,
                baudRate,
                dataBits,
                stopBits,
                parity
            )

            synchronized (readLock) {
                rxBuffer.reset()
            }

            connection = conn
            usbDevice = device
            usbInterface = selected
            inEndpoint = input
            outEndpoint = output

            startReader()

            Log.d(TAG, "USB device opened successfully")
        } catch (e: Throwable) {
            try {
                conn.releaseInterface(selected)
            } catch (_: Exception) {
            }
            conn.close()
            throw e
        }
    }

    private fun configureCh340(
        conn: UsbDeviceConnection,
        baudRate: Int,
        dataBits: Int,
        stopBits: Int,
        parity: Int
    ) {
        Log.d(TAG, "Configuring CH340...")

        val version = ByteArray(2)

        val versionResult = controlIn(
            conn,
            REQ_READ_VERSION,
            0,
            0,
            version
        )

        if (versionResult < 0) {
            throw IllegalStateException("CH340 version read failed")
        }

        Log.d(
            TAG,
            "CH340 version bytes=" +
                version.joinToString(" ") {
                    "%02X".format(it.toInt() and 0xFF)
                }
        )

        checkControl(
            controlOut(conn, REQ_SERIAL_INIT, 0, 0),
            "serial init"
        )

        setBaudRate(conn, baudRate)

        var lcr = LCR_ENABLE_RX or LCR_ENABLE_TX

        lcr = lcr or when (dataBits) {
            5 -> 0
            6 -> 1
            7 -> 2
            8 -> LCR_CS8
            else -> throw IllegalArgumentException(
                "Unsupported dataBits=$dataBits"
            )
        }

        lcr = lcr or when (stopBits) {
            1 -> 0
            2 -> LCR_STOP_BITS_2
            else -> throw IllegalArgumentException(
                "Unsupported stopBits=$stopBits"
            )
        }

        lcr = lcr or when (parity) {
            0 -> 0
            1 -> LCR_ENABLE_PAR
            2 -> LCR_ENABLE_PAR or LCR_PAR_EVEN
            else -> throw IllegalArgumentException(
                "Unsupported parity=$parity"
            )
        }

        checkControl(
            controlOut(
                conn,
                REQ_WRITE_REG,
                0x2518,
                lcr
            ),
            "line control"
        )

        checkControl(
            controlOut(
                conn,
                REQ_SERIAL_INIT,
                0x501F,
                0xD90A
            ),
            "CH340 state init"
        )

        setBaudRate(conn, baudRate)

        checkControl(
            controlOut(
                conn,
                REQ_MODEM_CTRL,
                0xFF,
                0
            ),
            "modem control"
        )

        Log.d(TAG, "CH340 configured")
    }

    private fun setBaudRate(
        conn: UsbDeviceConnection,
        baudRate: Int
    ) {
        if (baudRate <= 0) {
            throw IllegalArgumentException(
                "Invalid baud rate $baudRate"
            )
        }

        var factor = 1532620800L / baudRate.toLong()
        var divisor = 3L

        while (factor > 0xFFF0 && divisor > 0) {
            factor = factor shr 3
            divisor--
        }

        if (factor > 0xFFF0) {
            throw IllegalArgumentException(
                "Unsupported baud rate $baudRate"
            )
        }

        factor = 0x10000L - factor
        divisor = divisor or 0x80L

        val val1 =
            ((factor and 0xFF00) or divisor).toInt()

        val val2 = (factor and 0xFF).toInt()

        Log.d(
            TAG,
            "baud=$baudRate, " +
                "0x1312=0x${val1.toString(16)}, " +
                "0x0F2C=0x${val2.toString(16)}"
        )

        checkControl(
            controlOut(
                conn,
                REQ_WRITE_REG,
                0x1312,
                val1
            ),
            "baud high"
        )

        checkControl(
            controlOut(
                conn,
                REQ_WRITE_REG,
                0x0F2C,
                val2
            ),
            "baud low"
        )
    }

    private fun controlOut(
        conn: UsbDeviceConnection,
        request: Int,
        value: Int,
        index: Int
    ): Int =
        conn.controlTransfer(
            UsbConstants.USB_DIR_OUT or
                UsbConstants.USB_TYPE_VENDOR,
            request,
            value,
            index,
            null,
            0,
            1000
        )

    private fun controlIn(
        conn: UsbDeviceConnection,
        request: Int,
        value: Int,
        index: Int,
        buffer: ByteArray
    ): Int =
        conn.controlTransfer(
            UsbConstants.USB_DIR_IN or
                UsbConstants.USB_TYPE_VENDOR,
            request,
            value,
            index,
            buffer,
            buffer.size,
            1000
        )

    private fun checkControl(
        result: Int,
        operation: String
    ) {
        if (result < 0) {
            throw IllegalStateException(
                "CH340 $operation control transfer failed: $result"
            )
        }
    }

    @Synchronized
    fun write(data: ByteArray) {
        val conn = connection
            ?: throw IllegalStateException(
                "USB connection is not open"
            )

        val ep = outEndpoint
            ?: throw IllegalStateException(
                "USB OUT endpoint unavailable"
            )

        Log.d(
            TAG,
            "TX ${data.size} bytes: " +
                data.joinToString(" ") {
                    "%02X".format(it.toInt() and 0xFF)
                }
        )

        var offset = 0

        while (offset < data.size) {
            val len = minOf(4096, data.size - offset)
            val chunk = data.copyOfRange(
                offset,
                offset + len
            )

            val written = conn.bulkTransfer(
                ep,
                chunk,
                chunk.size,
                2000
            )

            Log.d(TAG, "bulkTransfer wrote=$written")

            if (written <= 0) {
                throw IllegalStateException(
                    "CH340 USB write failed: $written"
                )
            }

            offset += written
        }
    }

    private fun startReader() {
        stopReader()

        val conn = connection
            ?: throw IllegalStateException(
                "USB connection unavailable"
            )

        val ep = inEndpoint
            ?: throw IllegalStateException(
                "USB IN endpoint unavailable"
            )

        readerRunning = true

        readerThread = thread(
            name = "AS608-USB-Reader"
        ) {
            Log.d(TAG, "USB reader started")

            val buffer = ByteArray(4096)

            while (readerRunning) {
                try {
                    val count = conn.bulkTransfer(
                        ep,
                        buffer,
                        buffer.size,
                        1000
                    )

                    if (count > 0) {
                        synchronized(readLock) {
                            rxBuffer.write(
                                buffer,
                                0,
                                count
                            )
                            readLock.notifyAll()
                        }

                        Log.d(
                            TAG,
                            "RX $count bytes: " +
                                buffer.copyOfRange(0, count)
                                    .joinToString(" ") {
                                        "%02X".format(
                                            it.toInt() and 0xFF
                                        )
                                    }
                        )
                    }
                } catch (e: Throwable) {
                    if (readerRunning) {
                        Log.e(
                            TAG,
                            "USB reader error",
                            e
                        )
                    }
                }
            }

            Log.d(TAG, "USB reader stopped")
        }
    }

    private fun stopReader() {
        readerRunning = false

        synchronized(readLock) {
            readLock.notifyAll()
        }

        try {
            readerThread?.join(1200)
        } catch (_: InterruptedException) {
            Thread.currentThread().interrupt()
        }

        readerThread = null
    }

    @Synchronized
    fun read(length: Int, timeoutMs: Int = 3000): ByteArray {
        if (length <= 0) return ByteArray(0)

        if (!isOpen()) {
            throw IllegalStateException(
                "USB connection is not open"
            )
        }

        val deadline =
            System.currentTimeMillis() + timeoutMs

        synchronized(readLock) {
            while (rxBuffer.size() < length) {
                val remaining =
                    deadline - System.currentTimeMillis()

                if (remaining <= 0) {
                    throw IllegalStateException(
                        "CH340 USB read timeout: wanted $length, " +
                            "got ${rxBuffer.size()}"
                    )
                }

                try {
                    readLock.wait(remaining)
                } catch (_: InterruptedException) {
                    Thread.currentThread().interrupt()
                    throw IllegalStateException(
                        "CH340 USB read interrupted"
                    )
                }
            }

            val all = rxBuffer.toByteArray()
            val result = all.copyOfRange(0, length)

            rxBuffer.reset()
            if (all.size > length) {
                rxBuffer.write(
                    all,
                    length,
                    all.size - length
                )
            }

            Log.d(
                TAG,
                "READ $length bytes from buffer: " +
                    result.joinToString(" ") {
                        "%02X".format(it.toInt() and 0xFF)
                    }
            )

            return result
        }
    }

    @Synchronized
    fun close() {
        stopReader()

        val c = connection
        val i = usbInterface

        connection = null
        usbInterface = null
        inEndpoint = null
        outEndpoint = null
        usbDevice = null

        synchronized(readLock) {
            rxBuffer.reset()
            readLock.notifyAll()
        }

        if (c != null && i != null) {
            try {
                c.releaseInterface(i)
            } catch (_: Exception) {
            }
        }

        try {
            c?.close()
        } catch (_: Exception) {
        }
    }
}
