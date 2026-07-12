#include <Arduino.h>
#include <SimpleDHT.h>
#include <U8g2lib.h>
#include <Wire.h>

// กำหนดพินของเซนเซอร์ DHT22 (ย้ายมาที่ GPIO 5 แล้ว)
#define DHT_PIN 5

// ขาสำหรับเชื่อมต่อหน้าจอ OLED 0.96" I2C
#define OLED_SDA 20
#define OLED_SCL 21

// สร้างอ็อบเจกต์หน้าจอ OLED SSD1306 (128x64) I2C แบบ Hardware
U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, /* reset=*/ U8X8_PIN_NONE, /* clock=*/ OLED_SCL, /* data=*/ OLED_SDA);

// สร้างอ็อบเจกต์ SimpleDHT22
SimpleDHT22 dht22(DHT_PIN);

// ตัวแปรสำหรับจัดเวลาการทำงานแบบ Non-blocking
unsigned long last_read_ms = 0;
const unsigned long READ_INTERVAL_MS = 2000; // อ่านค่าทุกๆ 2 วินาที

void draw_status_on_oled(const char* status_text, float temp = NAN, float humid = NAN) {
    u8g2.clearBuffer();
    
    if (isnan(temp) || isnan(humid)) {
        // แสดงสถานะทั่วไป
        u8g2.setFont(u8g2_font_helvB12_tr);
        u8g2.drawStr(0, 36, status_text);
    } else {
        // แสดงค่าอุณหภูมิและความชื้นตัวหนาขนาดใหญ่ 2 แถว
        char temp_str[20];
        char humid_str[20];
        sprintf(temp_str, "T: %.1f C", temp);
        sprintf(humid_str, "H: %.1f %%", humid);
        
        u8g2.setFont(u8g2_font_helvB18_tr); // ฟอนต์ Helvetica หนา ขนาด 18
        u8g2.drawStr(0, 26, temp_str);
        u8g2.drawStr(0, 56, humid_str);
    }
    
    u8g2.sendBuffer();
}

void setup() {
    // เริ่มต้น Serial Monitor (ช่อง USB CDC)
    Serial.begin(115200);
    
    // หน่วงเวลาเพื่อให้พอร์ต USB CDC ใน ESP32-C3 พร้อมใช้งาน
    unsigned long start_time = millis();
    while (!Serial && (millis() - start_time < 3000)) {
        delay(10);
    }
    
    Serial.println("=========================================");
    Serial.println("Smart Weather Station - ESP32-C3 Initialized");
    Serial.println("Reading temperature and humidity from DHT22...");
    Serial.println("=========================================");

    // เริ่มต้นหน้าจอ OLED
    Serial.println("[DEBUG] Initializing OLED Display...");
    u8g2.begin();
    draw_status_on_oled("OLED OK. Initializing...");
    Serial.println("[DEBUG] OLED Display initialized.");

    // ตั้งพินแบบ Input Pull-up เพื่อความเสถียรของ DHT22 (เผื่อเคสไม่มีตัวต้านทานภายนอก)
    pinMode(DHT_PIN, INPUT_PULLUP);
    
    draw_status_on_oled("System Running...");
}

void loop() {
    unsigned long now_ms = millis();

    // ดึงค่าเซนเซอร์ทุกๆ READ_INTERVAL_MS
    if (now_ms - last_read_ms >= READ_INTERVAL_MS) {
        last_read_ms = now_ms;

        Serial.println("[DEBUG] Requesting data from DHT22...");
        
        float temperature = 0;
        float humidity = 0;
        int err = SimpleDHTErrSuccess;
        
        // อ่านค่าจาก DHT22 ด้วย SimpleDHT
        if ((err = dht22.read2(&temperature, &humidity, NULL)) != SimpleDHTErrSuccess) {
            Serial.printf("[ERROR] Read DHT22 failed, err code = %d\n", err);
            draw_status_on_oled("Sensor Read Error!");
            return;
        }

        Serial.println("[DEBUG] Data received from DHT22.");

        // ปริ้นผลลัพธ์ออก Serial Monitor
        Serial.printf("[INFO] Temp: %.2f *C | Humid: %.2f %%\n", temperature, humidity);
        
        // อัปเดตข้อมูลขึ้นจอ OLED
        draw_status_on_oled("Reading...", temperature, humidity);
    }
}

