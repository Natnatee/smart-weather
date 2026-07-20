#include "wifi_manager.h"
#include "config.h"
#include "storage.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <time.h>

static bool ntp_synced = false;

void init_wifi() {
    WiFi.persistent(false);
    WiFi.mode(WIFI_OFF); // ปิด Wi-Fi Radio เพื่อประหยัดพลังงานเริ่มต้น
}

bool connect_wifi() {
    Serial.printf("[WIFI] Connecting directly to SSID: '%s' ...\n", WIFI_SSID);
    
    // ล้าง state เดิมและเปิดโหมด Station สดๆ ก่อนสั่งเชื่อมต่อ
    WiFi.persistent(false);
    WiFi.mode(WIFI_OFF);
    delay(100);
    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false); // ปิด Mode Sleep เพื่อการรับส่งสัญญาณเต็มกำลัง

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long start_time = millis();
    while (WiFi.status() != WL_CONNECTED && (millis() - start_time < WIFI_CONNECT_TIMEOUT_MS)) {
        delay(500);
        Serial.print(".");
        
        int status = WiFi.status();
        if (status == WL_CONNECT_FAILED) {
            Serial.println("\n[WIFI] Status: WL_CONNECT_FAILED (รหัสผ่านผิด หรือ WPA3 Security Mode ไม่ตรงกัน)");
            break;
        }
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("[WIFI] Connected Successfully! IP Address: %s (Channel: %d, RSSI: %d dBm)\n", 
                      WiFi.localIP().toString().c_str(), WiFi.channel(), WiFi.RSSI());
        
        if (!ntp_synced) {
            sync_time_ntp();
        }
        return true;
    } else {
        Serial.printf("[WIFI] Connection failed. Final Status Code = %d. Turning off Wi-Fi radio.\n", WiFi.status());
        disconnect_wifi();
        return false;
    }
}

void disconnect_wifi() {
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    Serial.println("[WIFI] Radio disconnected and turned off.");
}

bool is_wifi_connected() {
    return (WiFi.status() == WL_CONNECTED);
}

void sync_time_ntp() {
    Serial.println("[NTP] Syncing time with NTP Server (UTC+7 Thailand)...");
    configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov");
    
    struct tm timeinfo;
    unsigned long start_time = millis();
    while (!getLocalTime(&timeinfo) && (millis() - start_time < 5000)) {
        delay(200);
    }
    
    if (getLocalTime(&timeinfo)) {
        ntp_synced = true;
        Serial.printf("[NTP] Time synced successfully: %04d-%02d-%02d %02d:%02d:%02d\n",
                      timeinfo.tm_year + 1900, timeinfo.tm_mon + 1, timeinfo.tm_mday,
                      timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
    } else {
        Serial.println("[NTP] Time sync timed out.");
    }
}

uint32_t get_current_timestamp() {
    time_t now;
    time(&now);
    if (now > 1600000000) { // หากเวลาซิงก์สำเร็จแล้ว
        return (uint32_t)now;
    }
    // หากยังไม่ซิงก์เวลา ให้ใช้เวลา uptime เป็นวินาทีสัมพัทธ์
    return (uint32_t)(millis() / 1000);
}

bool send_stored_records_to_server() {
    uint16_t total_count = get_storage_count();
    if (total_count == 0) {
        Serial.println("[HTTP] No records to send.");
        return true;
    }

    if (!is_wifi_connected()) {
        Serial.println("[HTTP] Cannot send: Wi-Fi not connected.");
        return false;
    }

    Serial.printf("[HTTP] Preparing to send %d records to %s ...\n", total_count, API_SERVER_URL);

    // ส่งข้อมูลทีละ Batch (สูงสุด 100 รายการต่อ 1 HTTP Request)
    const uint16_t BATCH_SIZE = 100;
    
    while (get_storage_count() > 0) {
        uint16_t current_count = get_storage_count();
        uint16_t records_to_send = (current_count > BATCH_SIZE) ? BATCH_SIZE : current_count;

        // สร้าง JSON String
        String payload = "{\"device_id\":\"esp32c3_weather\",\"count\":";
        payload += String(records_to_send);
        payload += ",\"records\":[";

        for (uint16_t i = 0; i < records_to_send; i++) {
            WeatherRecord rec;
            if (get_record_at(i, rec)) {
                if (i > 0) payload += ",";
                payload += "{\"timestamp\":";
                payload += String(rec.timestamp);
                payload += ",\"temp\":";
                payload += String(rec.temp / 10.0f, 1);
                payload += ",\"humid\":";
                payload += String(rec.humid);
                payload += ",\"rain\":";
                payload += (rec.rain == 1) ? "true" : "false";
                payload += "}";
            }
        }
        payload += "]}";

        HTTPClient http;
        if (String(API_SERVER_URL).startsWith("https")) {
            WiFiClientSecure client;
            client.setInsecure();
            http.begin(client, API_SERVER_URL);
            http.addHeader("Content-Type", "application/json");

            Serial.printf("[HTTP] Sending batch payload via HTTPS (%d bytes, %d records)...\n", payload.length(), records_to_send);
            int http_code = http.POST(payload);

            if (http_code == 200 || http_code == 201) {
                Serial.printf("[HTTP] POST Success! Response Code: %d\n", http_code);
                clear_storage_up_to(records_to_send);
                http.end();
            } else {
                Serial.printf("[HTTP] POST Failed! Response Code: %d (%s)\n", http_code, http.errorToString(http_code).c_str());
                http.end();
                return false;
            }
        } else {
            http.begin(API_SERVER_URL);
            http.addHeader("Content-Type", "application/json");

            Serial.printf("[HTTP] Sending batch payload via HTTP (%d bytes, %d records)...\n", payload.length(), records_to_send);
            int http_code = http.POST(payload);

            if (http_code == 200 || http_code == 201) {
                Serial.printf("[HTTP] POST Success! Response Code: %d\n", http_code);
                clear_storage_up_to(records_to_send);
                http.end();
            } else {
                Serial.printf("[HTTP] POST Failed! Response Code: %d (%s)\n", http_code, http.errorToString(http_code).c_str());
                http.end();
                return false;
            }
        }
    }

    Serial.println("[HTTP] All batch uploads completed successfully!");
    return true;
}
