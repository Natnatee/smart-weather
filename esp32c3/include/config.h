#pragma once

// เลือกโหมดการทดสอบ (1 = ใช้ข้อมูลจำลองสำหรับพัฒนาต่อ, 0 = อ่านจากเซนเซอร์จริง)
#define USE_MOCK_DATA 0

// กำหนดพินของเซนเซอร์ DHT22 (GPIO 5)
#define DHT_PIN 5

// กำหนดพิน Digital Output (DO) ของ Rain Sensor (GPIO 4)
#define RAIN_PIN 4

// ขาสำหรับเชื่อมต่อหน้าจอ OLED 0.96" I2C
#define OLED_SDA 20
#define OLED_SCL 21

// การตั้งค่า Wi-Fi และ Server API
#define WIFI_SSID "diamondwifi"
#define WIFI_PASSWORD "12345678m"
#define API_SERVER_URL "http://192.168.1.100:3000/api/weather"

// ตัวแปรจัดเวลาการทำงานแบบ Non-blocking
constexpr unsigned long READ_INTERVAL_MS = 2000;          // อ่านค่า DHT & Rain ทุกๆ 2 วินาที
constexpr unsigned long STORAGE_INTERVAL_MS = 10000;       // เก็บบันทึกลง RAM ทุกๆ 10 วินาที
constexpr unsigned long UPLOAD_INTERVAL_MS = 600000;       // ต่อ Wi-Fi ส่งข้อมูลทุกๆ 10 นาที (600,000 ms)
constexpr unsigned long WIFI_CONNECT_TIMEOUT_MS = 30000;   // Timeout ต่อ Wi-Fi 30 วินาที

// จำนวนชุดข้อมูลสูงสุดที่เก็บใน RAM FIFO Buffer (8,640 ชุด = 24 ชั่วโมง)
constexpr uint16_t MAX_STORAGE_RECORDS = 8640;
