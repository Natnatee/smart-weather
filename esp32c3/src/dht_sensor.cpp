#include "dht_sensor.h"
#include "config.h"
#include "oled_display.h"
#include <SimpleDHT.h>

// คลาส Wrapper ปรับปรุงพิเศษสำหรับ ESP32 เพื่อแก้ปัญหา Watchdog Reset
class SafeSimpleDHT11 : public SimpleDHT11 {
public:
    SafeSimpleDHT11(int pin) : SimpleDHT11(pin) {
        levelTimeout = 5000; // ลด Timeout จาก 500ms เหลือ 5ms (5,000 us) ป้องกันการค้างนานจนโดน Watchdog Reset
    }
};

static SafeSimpleDHT11 dht11(DHT_PIN);

void init_dht_sensor() {
    pinMode(DHT_PIN, INPUT_PULLUP);
}

bool read_dht_sensor(float &temperature, float &humidity) {
#if USE_MOCK_DATA
    static float mock_temp = 28.5;
    static float mock_humid = 65.0;
    
    // สุ่มเพิ่มลดทีละนิด (-0.2 ถึง +0.2)
    mock_temp += ((random(0, 100) - 50) / 250.0);
    mock_humid += ((random(0, 100) - 50) / 100.0);
    
    // ควบคุมไม่ให้ค่าหลุดขอบเขตที่เหมาะสม
    if (mock_temp < 20.0) mock_temp = 20.0;
    if (mock_temp > 40.0) mock_temp = 40.0;
    if (mock_humid < 40.0) mock_humid = 40.0;
    if (mock_humid > 95.0) mock_humid = 95.0;
    
    temperature = mock_temp;
    humidity = mock_humid;

    Serial.println("[DEBUG] Generating Mock Data...");
    return true;
#else
    Serial.println("[DEBUG] Requesting data from DHT11...");
    int err = SimpleDHTErrSuccess;
    
    // อ่านค่าจาก DHT11 ด้วย SimpleDHT ที่ปรับจูน Timeout แล้ว
    if ((err = dht11.read2(&temperature, &humidity, NULL)) != SimpleDHTErrSuccess) {
        Serial.printf("[ERROR] Read DHT11 failed, err code = %d\n", err);
        draw_status_on_oled("Sensor Read Error!");
        return false;
    }
    Serial.println("[DEBUG] Data received from DHT11.");
    return true;
#endif
}
