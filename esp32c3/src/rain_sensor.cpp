#include "rain_sensor.h"
#include "config.h"

void init_rain_sensor() {
    pinMode(RAIN_PIN, INPUT_PULLUP);
}

bool is_raining() {
#if USE_MOCK_DATA
    // สลับจำลองฝนตกทุกๆ 10 วินาทีในโหมด Mock Data
    return ((millis() / 10000) % 2 == 1);
#else
    // โมดูล Rain Sensor LM393 ส่วนใหญ่เมื่อตรวจจับหยดน้ำ ขา DO จะส่งสัญญาณ LOW (0)
    return (digitalRead(RAIN_PIN) == LOW);
#endif
}
