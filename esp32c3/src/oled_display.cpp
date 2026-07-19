#include "oled_display.h"
#include "config.h"

// สร้างอ็อบเจกต์หน้าจอ OLED SSD1306 (128x64) I2C แบบ Hardware
static U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, /* reset=*/ U8X8_PIN_NONE, /* clock=*/ OLED_SCL, /* data=*/ OLED_SDA);

void init_oled() {
    Serial.println("[DEBUG] Initializing OLED Display...");
    u8g2.begin();
    draw_status_on_oled("OLED OK. Initializing...");
    Serial.println("[DEBUG] OLED Display initialized.");
}

void draw_status_on_oled(const char* status_text, float temp, float humid) {
    u8g2.clearBuffer();
    
    if (isnan(temp) || isnan(humid)) {
        // แสดงสถานะทั่วไป
        u8g2.setFont(u8g2_font_helvB12_tr);
        u8g2.drawStr(0, 36, status_text);
    } else {
        // แสดงค่าอุณหภูมิและความชื้นตัวหนาขนาดใหญ่ 2 แถว
        char temp_str[20];
        char humid_str[20];
        snprintf(temp_str, sizeof(temp_str), "T: %.1f C", temp);
        snprintf(humid_str, sizeof(humid_str), "H: %.1f %%", humid);
        
        u8g2.setFont(u8g2_font_helvB18_tr); // ฟอนต์ Helvetica หนา ขนาด 18
        u8g2.drawStr(0, 26, temp_str);
        u8g2.drawStr(0, 56, humid_str);
    }
    
    u8g2.sendBuffer();
}

void draw_rain_alert_on_oled() {
    u8g2.clearBuffer();
    
    // วาดหยดน้ำตรงกลาง (Large Raindrop)
    u8g2.drawDisc(64, 26, 9);
    u8g2.drawTriangle(64, 10, 55, 26, 73, 26);
    
    // หยดน้ำเล็กด้านซ้าย-ขวา
    u8g2.drawDisc(38, 20, 3);
    u8g2.drawTriangle(38, 14, 35, 20, 41, 20);
    
    u8g2.drawDisc(90, 20, 3);
    u8g2.drawTriangle(90, 14, 87, 20, 93, 20);

    // แสดงข้อความเตือนฝนตก
    u8g2.setFont(u8g2_font_helvB12_tr);
    u8g2.drawStr(2, 56, "RAIN DETECTED!");
    
    u8g2.sendBuffer();
}
