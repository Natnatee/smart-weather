# Smart Weather (ESP32-C3 & Next.js Drizzle ORM)

ระบบวัดอุณหภูมิและความชื้นสัมพัทธ์สภาพอากาศด้วยเซนเซอร์ DHT22 และจอ OLED 0.96" โดยประมวลผลผ่าน ESP32-C3 และส่งข้อมูลไปยัง Next.js Serverless Backend เพื่อเก็บบันทึกข้อมูลในฐานข้อมูลและแสดงผลบนเว็บแอปพลิเคชันอย่างสวยงาม

## Features
- อ่านค่าอุณหภูมิ (°C) และความชื้นสัมพัทธ์ (%) แบบเรียลไทม์จาก DHT22
- แสดงผลอุณหภูมิและความชื้นสัมพัทธ์บนหน้าจอ OLED 0.96" I2C
- ปริ้นข้อมูลตรวจวัดออกทาง Serial Monitor แบบเรียลไทม์ (115200 baud)
- ส่งข้อมูลสภาพอากาศไปยังระบบ Serverless Backend ของ Next.js (เฟสถัดไป)
- แสดงข้อมูลสภาพอากาศและสถิติย้อนหลังทางหน้าเว็บ Next.js ดึงผ่าน Drizzle ORM (เฟสถัดไป)

## Hardware
1. **ESP32-C3 Super Mini Board** (RISC-V Single-Core 160MHz, 4MB Flash)
2. **DHT22 Sensor** (เซนเซอร์วัดอุณหภูมิและความชื้นสัมพัทธ์ความละเอียดสูง)
3. **OLED 0.96" Display** (จอ Monochrome I2C SSD1306/SH1106)
4. สายไฟเชื่อมต่อและบอร์ดทดลอง (Breadboard)

## Pin Map

### ESP32-C3 Super Mini Pinout
```text
          ESP32-C3 Super Mini Pinout
               +---------------+
         3V3 --| [ ]       [ ] |-- 5V
         GND --| [ ]       [ ] |-- GND
       GPIO2 --| [ ]       [ ] |-- GPIO21 (SCL)
       GPIO3 --| [ ]       [ ] |-- GPIO20 (SDA)
       GPIO4 --| [ ]       [ ] |-- GPIO10
       GPIO5 --| [ ]       [ ] |-- GPIO9 (BOOT)
       GPIO6 --| [ ]       [ ] |-- GPIO8 (LED)
       GPIO7 --| [ ]       [ ] |-- GPIO0
               +-------+-------+
                       | USB |
                       +-----+
```

### การต่อวงจร (Wiring Reference)
| Device | Pin | ESP32-C3 Pin | Function | Notes |
|---|---|---|---|---|
| **Rain Sensor** | VCC | **3V3** | Power Supply | แรงดันไฟเลี้ยง 3.3V |
| | GND | **GND** | Ground | กราวด์ร่วม |
| | DO | **GPIO 4** | Digital Output | สัญญาณดิจิทัล (Active LOW เมื่อตรวจจับหยดน้ำ) |
| **DHT22** | VCC | **3V3** | Power Supply | แรงดันไฟเลี้ยง 3.3V |
| | GND | **GND** | Ground | กราวด์ร่วม |
| | DATA | **GPIO 5** | Digital I/O | ต่อตัวต้านทาน 4.7kΩ - 10kΩ ดึงสัญญาณขึ้นไปยัง 3.3V |
| **OLED 0.96"**| VCC | **3V3** | Power Supply | แรงดันไฟเลี้ยง 3.3V |
| | GND | **GND** | Ground | กราวด์ร่วม |
| | SDA | **GPIO 20** | I2C Data | พอร์ต Hardware I2C SDA |
| | SCL | **GPIO 21** | I2C Clock | พอร์ต Hardware I2C SCL |


## Firmware Status
- **สถานะ:** Prototype (WIP) - ขณะนี้กำลังอยู่ในเฟสทดสอบการอ่านค่าเซนเซอร์และเขียน Log ออก Serial Monitor

## Getting Started

### ฝั่ง ESP32-C3 (PlatformIO)
1. ติดตั้ง [PlatformIO VSCode Extension](https://platformio.org/) หรือติดตั้ง CLI
2. เปิดโฟลเดอร์ `esp32c3` ใน VSCode / Command Line
3. รันคำสั่งคอมไพล์และอัปโหลดเฟิร์มแวร์ (รันด้วยตนเอง):
   ```bash
   # ไปยังโฟลเดอร์ esp32c3
   cd esp32c3

   # คอมไพล์โปรเจกต์
   pio run

   # อัปโหลดเฟิร์มแวร์ลงบอร์ด
   pio run -t upload

   # เปิด Serial Monitor
   pio device monitor -b 115200

   # รันทั้งหมด (อัปโหลดและเปิดหน้าจอ Serial Monitor)
   pio run -t upload -t monitor
   ```

## License
MIT
