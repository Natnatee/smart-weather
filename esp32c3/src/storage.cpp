#include "storage.h"
#include "config.h"
#include <time.h>

// จองพื้นที่ static array ใน RAM ล่วงหน้าเพื่อป้องกัน Memory Fragmentation
static WeatherRecord storage_buffer[MAX_STORAGE_RECORDS];
static uint16_t head = 0;
static uint16_t tail = 0;
static uint16_t count = 0;

void init_storage() {
    head = 0;
    tail = 0;
    count = 0;
    Serial.printf("[STORAGE] Initialized pre-allocated buffer for %d records (~%d KB)\n", 
                  MAX_STORAGE_RECORDS, (int)(sizeof(storage_buffer) / 1024));
}

void push_weather_record(uint32_t timestamp, float temp, float humid, bool rain) {
    WeatherRecord record;
    record.timestamp = timestamp;
    record.temp = (int16_t)round(temp * 10.0f);
    record.humid = (uint8_t)constrain((int)round(humid), 0, 100);
    record.rain = rain ? 1 : 0;

    storage_buffer[head] = record;
    head = (head + 1) % MAX_STORAGE_RECORDS;

    if (count < MAX_STORAGE_RECORDS) {
        count++;
    } else {
        // หาก buffer เต็ม 24 ชม. ให้เลื่อน tail เพื่อวนทับข้อมูลเก่าสุด (FIFO Overwrite)
        tail = (tail + 1) % MAX_STORAGE_RECORDS;
        Serial.println("[STORAGE] Buffer full! Overwriting oldest record (FIFO).");
    }

    // แปลง Unix Timestamp ให้เป็นข้อความวันที่/เวลาอ่านง่าย เช่น 2026-07-19 21:43:10
    char time_str[25];
    if (timestamp > 1600000000) {
        time_t t = (time_t)timestamp;
        struct tm *timeinfo = localtime(&t);
        if (timeinfo != nullptr) {
            strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", timeinfo);
        } else {
            snprintf(time_str, sizeof(time_str), "%u", timestamp);
        }
    } else {
        snprintf(time_str, sizeof(time_str), "+%u s (Uptime)", timestamp);
    }

    Serial.printf("[STORAGE] Record saved. Total stored: %d/%d (Time: %s, Temp: %.1f C, Humid: %d %%, Rain: %d)\n",
                  count, MAX_STORAGE_RECORDS, time_str, temp, record.humid, record.rain);
}

uint16_t get_storage_count() {
    return count;
}

bool get_record_at(uint16_t index, WeatherRecord &record) {
    if (index >= count) {
        return false;
    }
    uint16_t pos = (tail + index) % MAX_STORAGE_RECORDS;
    record = storage_buffer[pos];
    return true;
}

void clear_storage_up_to(uint16_t n) {
    if (n >= count) {
        head = 0;
        tail = 0;
        count = 0;
    } else {
        tail = (tail + n) % MAX_STORAGE_RECORDS;
        count -= n;
    }
    Serial.printf("[STORAGE] Cleared %d records. Remaining: %d\n", n, count);
}
