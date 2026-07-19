#include <Arduino.h>
#include <SimpleDHT.h>
#include <U8g2lib.h>
#include <Wire.h>

// เลือกโหมดการทดสอบ (1 = ใช้ข้อมูลจำลองสำหรับพัฒนาต่อ, 0 = อ่านจากเซนเซอร์จริง)
#define USE_MOCK_DATA 0

// กำหนดพินของเซนเซอร์ DHT22 (ย้ายมาที่ GPIO 5 แล้ว)
#define DHT_PIN 5

// ขาสำหรับเชื่อมต่อหน้าจอ OLED 0.96" I2C
#define OLED_SDA 20
#define OLED_SCL 21

// สร้างอ็อบเจกต์หน้าจอ OLED SSD1306 (128x64) I2C แบบ Hardware
U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, /* reset=*/ U8X8_PIN_NONE, /* clock=*/ OLED_SCL, /* data=*/ OLED_SDA);

// คลาส Wrapper ปรับปรุงพิเศษสำหรับ ESP32 เพื่อแก้ปัญหา Watchdog Reset
class SafeSimpleDHT11 : public SimpleDHT11 {
public:
    SafeSimpleDHT11(int pin) : SimpleDHT11(pin) {
        levelTimeout = 5000; // ลด Timeout จาก 500ms เหลือ 5ms (5,000 us) ป้องกันการค้างนานจนโดน Watchdog Reset
    }
};

// สร้างอ็อบเจกต์ SafeSimpleDHT11
SafeSimpleDHT11 dht11(DHT_PIN);

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
    if (USE_MOCK_DATA) {
        Serial.println("Running in MOCK DATA mode for simulation!");
    } else {
        Serial.println("Reading temperature and humidity from DHT11...");
    }
    Serial.println("=========================================");

    // เริ่มต้นหน้าจอ OLED
    Serial.println("[DEBUG] Initializing OLED Display...");
    u8g2.begin();
    draw_status_on_oled("OLED OK. Initializing...");
    Serial.println("[DEBUG] OLED Display initialized.");

    // ตั้งพินแบบ Input Pull-up เพื่อความเสถียร
    pinMode(DHT_PIN, INPUT_PULLUP);
    
    draw_status_on_oled("System Running...");
}

void loop() {
    unsigned long now_ms = millis();

    // ดึงค่าเซนเซอร์ทุกๆ READ_INTERVAL_MS
    if (now_ms - last_read_ms >= READ_INTERVAL_MS) {
        last_read_ms = now_ms;

        float temperature = 0;
        float humidity = 0;

#if USE_MOCK_DATA
        // จำลองข้อมูลอุณหภูมิและความชื้นสัมพัทธ์ (สุ่มเพิ่มลดช้าๆ)
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
#else
        Serial.println("[DEBUG] Requesting data from DHT11...");
        int err = SimpleDHTErrSuccess;
        
        // อ่านค่าจาก DHT11 ด้วย SimpleDHT ที่ปรับจูน Timeout แล้ว
        if ((err = dht11.read2(&temperature, &humidity, NULL)) != SimpleDHTErrSuccess) {
            Serial.printf("[ERROR] Read DHT11 failed, err code = %d\n", err);
            draw_status_on_oled("Sensor Read Error!");
            return;
        }
        Serial.println("[DEBUG] Data received from DHT11.");
#endif

        // ปริ้นผลลัพธ์ออก Serial Monitor
        Serial.printf("[INFO] Temp: %.2f *C | Humid: %.2f %%\n", temperature, humidity);
        
        // อัปเดตข้อมูลขึ้นจอ OLED
        draw_status_on_oled("Reading...", temperature, humidity);
    }
}

