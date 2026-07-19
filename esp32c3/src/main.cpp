#include <Arduino.h>
#include "config.h"
#include "oled_display.h"
#include "dht_sensor.h"
#include "rain_sensor.h"
#include "storage.h"
#include "wifi_manager.h"

static unsigned long last_read_ms = 0;
static unsigned long last_storage_ms = 0;
static unsigned long last_upload_ms = 0;
static unsigned long last_screen_toggle_ms = 0;

static float current_temp = NAN;
static float current_humid = NAN;
static bool current_rain = false;
static bool show_rain_screen = false;
static bool last_rain_state = false;

static void update_display(bool raining) {
    if (raining && show_rain_screen) {
        draw_rain_alert_on_oled();
    } else {
        draw_status_on_oled("Reading...", current_temp, current_humid);
    }
}

void setup() {
    Serial.begin(115200);
    
    // หน่วงเวลาเพื่อให้พอร์ต USB CDC ใน ESP32-C3 พร้อมใช้งาน
    unsigned long start_time = millis();
    while (!Serial && (millis() - start_time < 3000)) {
        delay(10);
    }
    
    Serial.println("=========================================");
    Serial.println("Smart Weather Station - ESP32-C3 Initialized");
    if (USE_MOCK_DATA) {
        Serial.println("Running in MOCK DATA mode for simulation!");
    } else {
        Serial.println("Reading DHT11 & Rain Sensor...");
    }
    Serial.println("=========================================");

    init_oled();
    init_dht_sensor();
    init_rain_sensor();
    init_storage();
    init_wifi();

    // ต่อ Wi-Fi ครั้งแรกตอนเริ่มเครื่องเพื่อซิงก์เวลา NTP ทันที
    Serial.println("[SETUP] Connecting Wi-Fi to sync NTP time on boot...");
    draw_status_on_oled("Syncing Time...");
    if (connect_wifi()) {
        sync_time_ntp();
        disconnect_wifi();
        Serial.println("[SETUP] NTP Time synced successfully on boot!");
    } else {
        Serial.println("[SETUP] Initial Wi-Fi sync failed. Will sync on next upload cycle.");
    }
    
    draw_status_on_oled("System Running...");
}

void loop() {
    unsigned long now_ms = millis();

    // 1. อ่านค่าเซนเซอร์ทุกๆ READ_INTERVAL_MS (2 วินาที)
    if (now_ms - last_read_ms >= READ_INTERVAL_MS) {
        last_read_ms = now_ms;
        if (read_dht_sensor(current_temp, current_humid)) {
            Serial.printf("[INFO] Temp: %.2f *C | Humid: %.2f %%\n", current_temp, current_humid);
        }
    }

    // 2. ตรวจจับสถานะฝนตก
    current_rain = is_raining();
    if (current_rain != last_rain_state) {
        last_rain_state = current_rain;
        if (current_rain) {
            Serial.println("[WARNING] Rain detected!");
            show_rain_screen = true;
            last_screen_toggle_ms = now_ms;
        } else {
            Serial.println("[INFO] Rain stopped.");
            show_rain_screen = false;
        }
        update_display(current_rain);
    }

    // 3. สลับหน้าจอ OLED เมื่อฝนตก (ทุก 3 วินาที)
    if (current_rain) {
        if (now_ms - last_screen_toggle_ms >= 3000) {
            last_screen_toggle_ms = now_ms;
            show_rain_screen = !show_rain_screen;
            update_display(current_rain);
        }
    } else {
        static unsigned long last_display_update = 0;
        if (now_ms - last_display_update >= READ_INTERVAL_MS) {
            last_display_update = now_ms;
            update_display(false);
        }
    }

    // 4. บันทึกข้อมูลลง RAM Storage ทุกๆ STORAGE_INTERVAL_MS (10 วินาที)
    if (now_ms - last_storage_ms >= STORAGE_INTERVAL_MS) {
        last_storage_ms = now_ms;
        if (!isnan(current_temp) && !isnan(current_humid)) {
            uint32_t ts = get_current_timestamp();
            push_weather_record(ts, current_temp, current_humid, current_rain);
        }
    }

    // 5. เชื่อมต่อ Wi-Fi และส่งข้อมูลทุกๆ UPLOAD_INTERVAL_MS (10 นาที)
    if (now_ms - last_upload_ms >= UPLOAD_INTERVAL_MS) {
        last_upload_ms = now_ms;
        Serial.println("[TIMER] 10-Minute Upload Interval Reached.");
        
        if (connect_wifi()) {
            send_stored_records_to_server();
            disconnect_wifi();
        } else {
            Serial.println("[TIMER] Wi-Fi connection failed. Will retry in next 10-minute cycle.");
        }
    }
}
