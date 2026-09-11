package com.as608.reactnative

import android.util.Log
import java.io.ByteArrayOutputStream

class AS608Exception(message: String, val status: Int? = null) : Exception(message)

data class AS608Packet(val type: Int, val data: ByteArray, val length: Int)

data class FingerprintMatch(val id: Int, val confidence: Int)

data class TemplateMatch(val matched: Boolean, val score: Int, val status: Int)

class AS608Protocol(private val transport: CH340Transport) {
    companion object {
        const val OK = 0x00
        const val PACKET_RECEIVE_ERR = 0x01
        const val NO_FINGER = 0x02
        const val IMAGE_FAIL = 0x03
        const val IMAGE_MESS = 0x06
        const val FEATURE_FAIL = 0x07
        const val NO_MATCH = 0x08
        const val NOT_FOUND = 0x09
        const val ENROLL_MISMATCH = 0x0A
        const val BAD_LOCATION = 0x0B
        const val DB_RANGE_FAIL = 0x0C
        const val UPLOAD_FEATURE_FAIL = 0x0D
        const val PACKET_RESPONSE_FAIL = 0x0E
        const val UPLOAD_FAIL = 0x0F
        const val DELETE_FAIL = 0x10
        const val DB_CLEAR_FAIL = 0x11
        const val PASS_FAIL = 0x13
        const val INVALID_IMAGE = 0x15
        const val FLASH_ERR = 0x18
        const val INVALID_REG = 0x1A
        const val ADDR_CODE = 0x20
        const val PASS_VERIFY = 0x21

        const val COMMAND_PACKET = 0x01
        const val DATA_PACKET = 0x02
        const val ACK_PACKET = 0x07
        const val END_DATA_PACKET = 0x08

        const val CMD_GET_IMAGE = 0x01
        const val CMD_IMAGE2TZ = 0x02
        const val CMD_MATCH = 0x03
        const val CMD_SEARCH = 0x04
        const val CMD_REG_MODEL = 0x05
        const val CMD_STORE = 0x06
        const val CMD_LOAD = 0x07
        const val CMD_UPLOAD = 0x08
        const val CMD_DOWNLOAD = 0x09
        const val CMD_UPLOAD_IMAGE = 0x0A
        const val CMD_DELETE = 0x0C
        const val CMD_EMPTY = 0x0D
        const val CMD_READ_SYS_PARAM = 0x0F
        const val CMD_SET_PASSWORD = 0x12
        const val CMD_VERIFY_PASSWORD = 0x13
        const val CMD_HIGH_SPEED_SEARCH = 0x1B
        const val CMD_TEMPLATE_COUNT = 0x1D
        const val CMD_READ_INDEX_TABLE = 0x1F
        const val CMD_AURA_LED_CONFIG = 0x35
        const val CMD_LED_ON = 0x50
        const val CMD_LED_OFF = 0x51
        const val IMAGE_SIZE = 256 * 288 / 2
    }

    var capacity = 64
        private set
    var packetLength = 64
        private set
    var sensorBaudRate = 57600
        private set
    var fingerId = 0xFFFF
        private set
    var confidence = 0xFFFF
        private set
    var cachedTemplateCount = 0
        private set

    private fun u16(v: Int) = byteArrayOf((v shr 8).toByte(), v.toByte())
    private fun readU16(b: ByteArray, off: Int = 0) = ((b[off].toInt() and 0xFF) shl 8) or (b[off + 1].toInt() and 0xFF)
    private fun hex(v: Int) = "%02X".format(v and 0xFF)

    fun buildPacket(type: Int, data: ByteArray): ByteArray {
        val length = data.size + 2
        var sum = ((length shr 8) and 0xFF) + (length and 0xFF) + type
        for (b in data) sum += b.toInt() and 0xFF
        val out = ByteArrayOutputStream()
        out.write(
            byteArrayOf(
                0xEF.toByte(),
                0x01,
                0xFF.toByte(),
                0xFF.toByte(),
                0xFF.toByte(),
                0xFF.toByte(),
                type.toByte()
            )
        )
        out.write(u16(length))
        out.write(data)
        out.write(u16(sum and 0xFFFF))
        return out.toByteArray()
    }

    @Synchronized
    fun writePacket(type: Int, data: ByteArray) {
        transport.write(buildPacket(type, data))
    }

    @Synchronized
    fun readPacket(): AS608Packet {
        while (true) {
            val first = transport.read(1)[0].toInt() and 0xFF
            if (first != 0xEF) continue
            val second = transport.read(1)[0].toInt() and 0xFF
            if (second == 0x01) break
        }
        transport.read(4) // address
        val type = transport.read(1)[0].toInt() and 0xFF
        val lengthBytes = transport.read(2)
        val length = readU16(lengthBytes)
        if (length < 2) throw AS608Exception("Invalid AS608 packet length: $length")
        val data = transport.read(length - 2)
        val checksum = readU16(transport.read(2))
        var expected = ((length shr 8) and 0xFF) + (length and 0xFF) + type
        for (b in data) expected += b.toInt() and 0xFF
        expected = expected and 0xFFFF
        if (expected != checksum) throw AS608Exception(
            "Checksum error: expected 0x%04X received 0x%04X".format(
                expected,
                checksum
            )
        )
        return AS608Packet(type, data, length)
    }

    private fun ack(command: Int, vararg params: Int): AS608Packet {
        val data = ByteArray(params.size + 1)
        data[0] = command.toByte()
        for (i in params.indices) {
            data[i + 1] = params[i].toByte()
        }
        writePacket(COMMAND_PACKET, data)
        val p = readPacket()
        if (p.type != ACK_PACKET) {
            throw AS608Exception(
                "Expected ACK packet, got 0x${hex(p.type)}"
            )
        }
        if (p.data.isEmpty()) {
            throw AS608Exception("Empty ACK packet")
        }
        return p
    }

    fun sendCommand(command: Int, vararg params: Int): Int = ack(command, *params).data[0].toInt() and 0xFF

    fun verifyPassword(password: Long = 0): Boolean {
        val p = byteArrayOf(
            (password shr 24).toByte(),
            (password shr 16).toByte(),
            (password shr 8).toByte(),
            password.toByte()
        )
        return sendCommand(CMD_VERIFY_PASSWORD, *p.map { it.toInt() and 0xFF }.toIntArray()) == OK
    }

    fun getParameters(): Map<String, Any> {
        val p = ack(CMD_READ_SYS_PARAM).data
        if (p.size < 17) throw AS608Exception("Invalid system parameter response")
        val status = p[0].toInt() and 0xFF
        val statusReg = readU16(p, 1)
        val systemId = readU16(p, 3)
        capacity = readU16(p, 5)
        val security = readU16(p, 7)
        val address =
            ((p[9].toLong() and 0xFF) shl 24) or ((p[10].toLong() and 0xFF) shl 16) or ((p[11].toLong() and 0xFF) shl 8) or (p[12].toLong() and 0xFF)
        val packetCode = readU16(p, 13)
        packetLength = when (packetCode) {
            0 -> 32; 1 -> 64; 2 -> 128; 3 -> 256; else -> packetCode
        }
        sensorBaudRate = readU16(p, 15) * 9600
        return mapOf(
            "status" to status,
            "statusReg" to statusReg,
            "systemId" to systemId,
            "capacity" to capacity,
            "securityLevel" to security,
            "deviceAddress" to address,
            "packetLength" to packetLength,
            "baudRate" to sensorBaudRate
        )
    }

    fun getTemplateCount(): Int {
        val p = ack(CMD_TEMPLATE_COUNT).data
        if (p.size < 3) throw AS608Exception("Invalid template count response")

        val status = p[0].toInt() and 0xFF
        if (status != OK) {
            throw AS608Exception(
                "Template count failed: 0x${hex(status)}",
                status
            )
        }

        cachedTemplateCount = readU16(p, 1)
        return cachedTemplateCount
    }

    fun getImage() = sendCommand(CMD_GET_IMAGE)
    fun image2Tz(slot: Int) = sendCommand(CMD_IMAGE2TZ, slot)
    fun createModel() = sendCommand(CMD_REG_MODEL)
    fun storeModel(location: Int) = sendCommand(CMD_STORE, 1, location shr 8, location and 0xFF)
    fun loadModel(location: Int, slot: Int = 1) = sendCommand(CMD_LOAD, slot, location shr 8, location and 0xFF)
    fun deleteModel(location: Int) = sendCommand(CMD_DELETE, location shr 8, location and 0xFF, 0, 1)
    fun clearDatabase() = sendCommand(CMD_EMPTY)

    fun search(slot: Int = 1, startPage: Int = 0, pageCount: Int = capacity): FingerprintMatch? {
        val p = ack(CMD_SEARCH, slot, startPage shr 8, startPage and 0xFF, pageCount shr 8, pageCount and 0xFF).data
        if (p.size < 5) throw AS608Exception("Invalid search response")
        val status = p[0].toInt() and 0xFF
        fingerId = readU16(p, 1); confidence = readU16(p, 3)
        if (status == NOT_FOUND) return null
        if (status != OK) throw AS608Exception("Search failed: 0x${hex(status)}", status)
        return FingerprintMatch(fingerId, confidence)
    }

    fun fastSearch(slot: Int = 1, startPage: Int = 0, pageCount: Int = capacity): FingerprintMatch? {
        val p = ack(
            CMD_HIGH_SPEED_SEARCH,
            slot,
            startPage shr 8,
            startPage and 0xFF,
            pageCount shr 8,
            pageCount and 0xFF
        ).data
        if (p.size < 5) throw AS608Exception("Invalid fast-search response")
        val status = p[0].toInt() and 0xFF
        fingerId = readU16(p, 1); confidence = readU16(p, 3)
        if (status == NOT_FOUND) return null
        if (status != OK) throw AS608Exception("Fast search failed: 0x${hex(status)}", status)
        return FingerprintMatch(fingerId, confidence)
    }

    fun led(on: Boolean) = sendCommand(if (on) CMD_LED_ON else CMD_LED_OFF)
    fun auraLed(control: Int, speed: Int, color: Int, count: Int) =
        sendCommand(CMD_AURA_LED_CONFIG, control, speed, color, count)

    fun setRegister(register: Int, value: Int) = sendCommand(0x0E, register, value)
    fun setBaudRate(code: Int) = setRegister(0x04, code)
    fun setSecurityLevel(level: Int) = setRegister(0x05, level)
    fun setPacketSize(size: Int) = setRegister(0x06, size)

    fun captureWithLed() {
        led(false)
        while (true) {
            val status = getImage()
            if (status == NO_FINGER) {
                Thread.sleep(30); continue
            }
            if (status != OK) throw AS608Exception("Finger detection failed: 0x${hex(status)}", status)
            break
        }
        try {
            led(true); Thread.sleep(50)
        } finally {
            try {
                led(false)
            } catch (_: Exception) {
            }
        }
    }

    fun enroll(location: Int, progress: (String) -> Unit = {}) {
        progress("WAITING_FOR_FINGER"); captureWithLed(); progress("FIRST_FINGER_CAPTURED")
        var status = image2Tz(1)
        if (status != OK) throw AS608Exception("First image2tz failed: 0x${hex(status)}", status)
        progress("REMOVE_FINGER")
        while (true) {
            status = getImage(); if (status == NO_FINGER) break; Thread.sleep(100)
        }
        progress("WAITING_FOR_FINGER_AGAIN"); captureWithLed(); progress("SECOND_FINGER_CAPTURED")
        status = image2Tz(2)
        if (status != OK) throw AS608Exception("Second image2tz failed: 0x${hex(status)}", status)
        status = createModel()
        if (status == ENROLL_MISMATCH) throw AS608Exception("Two fingerprint scans do not match.", status)
        if (status != OK) throw AS608Exception("createModel failed: 0x${hex(status)}", status)
        status = storeModel(location)
        if (status != OK) throw AS608Exception("storeModel failed: 0x${hex(status)}", status)
        progress("STORED")
    }

    fun captureLiveFeature() {
        captureWithLed();
        val status = image2Tz(1); if (status != OK) throw AS608Exception("image2tz failed: 0x${hex(status)}", status)
    }

    fun matchTemplates(): TemplateMatch {
        val p = ack(CMD_MATCH).data
        if (p.size < 3) throw AS608Exception("Invalid MATCH response")
        val status = p[0].toInt() and 0xFF
        return TemplateMatch(status == OK, readU16(p, 1), status)
    }

    fun identify(fast: Boolean = true, pageCount: Int = capacity): FingerprintMatch? {
        captureWithLed()
        try {
            val s = image2Tz(1)
            if (s != OK) throw AS608Exception("image2tz failed: 0x${hex(s)}", s)
            return if (fast) fastSearch(1, 0, pageCount) else search(1, 0, pageCount)
        } finally {
            try {
                led(false)
            } catch (_: Exception) {
            }
        }
    }

    fun uploadTemplate(slot: Int = 1): ByteArray {
        val p = ack(CMD_UPLOAD, slot)
        val status = p.data[0].toInt() and 0xFF
        if (status != OK) throw AS608Exception("Template upload failed: 0x${hex(status)}", status)
        val out = ByteArrayOutputStream()
        while (true) {
            val packet = readPacket()
            if (packet.type != DATA_PACKET && packet.type != END_DATA_PACKET) throw AS608Exception(
                "Invalid template packet type 0x${
                    hex(
                        packet.type
                    )
                }"
            )
            out.write(packet.data)
            if (packet.type == END_DATA_PACKET) break
        }
        val result = out.toByteArray()
        if (result.isEmpty()) throw AS608Exception("Sensor returned an empty template")
        return result
    }

    fun downloadTemplate(template: ByteArray, slot: Int = 1) {
        if (template.size != 512) throw AS608Exception("AS608 template must be exactly 512 bytes; got ${template.size}")
        val status = sendCommand(CMD_DOWNLOAD, slot)
        if (status != OK) throw AS608Exception("downloadTemplate failed: 0x${hex(status)}", status)
        var offset = 0
        while (offset < template.size) {
            val end = minOf(offset + 128, template.size)
            writePacket(if (end == template.size) END_DATA_PACKET else DATA_PACKET, template.copyOfRange(offset, end))
            offset = end
        }
    }

    fun readIndexTable(page: Int = 0): ByteArray {
        val p = ack(CMD_READ_INDEX_TABLE, page).data
        if (p.size < 33) throw AS608Exception("Invalid index table response")
        val status = p[0].toInt() and 0xFF
        if (status != OK) throw AS608Exception("readIndexTable failed: 0x${hex(status)}", status)
        return p.copyOfRange(1, 33)
    }

    fun occupiedSlots(): List<Int> {
        val occupied = mutableListOf<Int>()
        val pages = minOf((capacity + 255) / 256, 4)
        for (page in 0 until pages) {
            val bitmap = readIndexTable(page)
            for (i in bitmap.indices) {
                val value = bitmap[i].toInt() and 0xFF
                for (bit in 0..7) {
                    val slot = page * 256 + i * 8 + bit
                    if (slot >= capacity) break
                    if ((value and (1 shl bit)) != 0) occupied.add(slot)
                }
            }
        }
        return occupied
    }
}
