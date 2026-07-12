# smart-weather

## Overview
ระบบตรวจวัดสภาพอากาศขนาดเล็ก (Smart Weather) ที่ใช้อ่านค่าอุณหภูมิและความชื้นสัมพัทธ์จากเซนเซอร์ DHT22 และแสดงผลบนหน้าจอ OLED 0.96" (I2C) ด้วยบอร์ด ESP32-C3 จากนั้นส่งข้อมูลผ่านระบบเครือข่ายไปยัง Serverless API ของ Next.js เพื่อจัดเก็บลงฐานข้อมูลและดึงมาแสดงผลบนเว็บแอปพลิเคชันอย่างสวยงาม

## Goals
1. อ่านข้อมูลอุณหภูมิและความชื้นสัมพัทธ์จากเซนเซอร์ DHT22 ได้อย่างแม่นยำและเสถียร
2. แสดงผลข้อมูลแบบเรียลไทม์บนจอ OLED 0.96" และ Serial Monitor
3. ส่งข้อมูลสภาพอากาศไปยัง Next.js Serverless API
4. บันทึกข้อมูลลงฐานข้อมูลโดยใช้ Drizzle ORM และดึงข้อมูลมาแสดงผลในฝั่ง Frontend ของ Next.js

## Hardware
1. **Microcontroller:** ESP32-C3 (บอร์ด Super Mini สถาปัตยกรรม RISC-V)
2. **Sensor:** DHT22 (วัดอุณหภูมิช่วง -40 ถึง 80 °C ความคลาดเคลื่อน ±0.5 °C, ความชื้นช่วง 0-100% ความคลาดเคลื่อน ±2%)
3. **Display:** จอ OLED 0.96" (Monochrome, I2C interface, ไดรเวอร์ SSD1306/SH1106)

## Pin Map

| Function | Pin | Device | Direction | Notes |
|---|---|---|---|---|
| DHT22 Data | **GPIO 5** | DHT22 | Input / Pull-up | ขา Digital I/O (ADC2) ย้ายจาก GPIO 4 เพื่อหลีกเลี่ยงปัญหาการอ่านค่าล้มเหลว |
| OLED SDA | **GPIO 20** | OLED 0.96" | I/O (Open Drain) | ขา Hardware I2C SDA มาตรฐานของ ESP32-C3 |
| OLED SCL | **GPIO 21** | OLED 0.96" | Output / Open Drain | ขา Hardware I2C SCL มาตรฐานของ ESP32-C3 |

## Electrical / Safety Notes
- เซนเซอร์ DHT22 และจอ OLED 0.96" ใช้แรงดันไฟเลี้ยง 3.3V จากบอร์ด ESP32-C3
- แนะนำให้ต่อตัวต้านทาน Pull-up ขนาด 4.7kΩ - 10kΩ ที่ขาข้อมูล (Data Pin) ของ DHT22 ไปยัง 3.3V หากโมดูลสำเร็จรูปไม่มี Pull-up ในตัว เพื่อความเสถียรของสัญญาณ

## Firmware Architecture
- พัฒนาบนเฟรมเวิร์ก Arduino ด้วย PlatformIO (บอร์ดคอนฟิกเป็น `lolin_c3_mini`)
- การทำงานแบบ Non-blocking โดยใช้ `millis()` ในการจัดตารางเวลาอ่านเซนเซอร์และอัปเดตข้อมูลบนหน้าจอ OLED
- โครงสร้างโปรแกรมเริ่มต้นอยู่ใน `esp32c3/src/main.cpp`

## Libraries
- **SimpleDHT (winlinvip):** ไลบรารีสแกนพัลส์แบบมีระบบ Safety Timeout ป้องกัน Watchdog crash ได้ดีกว่าเมื่อไม่มีเซนเซอร์ต่ออยู่
- **U8g2 (olikraus):** ไลบรารีสำหรับควบคุมหน้าจอ OLED (ทำงานร่วมกับชิป RISC-V ได้ดี)

## Build & Upload
สามารถรันผ่าน PlatformIO CLI (ผู้ใช้รันเอง):
```bash
# คอมไพล์โปรเจกต์
pio run

# อัปโหลด Firmware
pio run -t upload

# เปิด Serial Monitor
pio device monitor -b 115200

# อัปโหลดและเปิดจอมอนิเตอร์พร้อมกัน
pio run -t upload -t monitor
```

## Current State
- [x] ออกแบบ Pin Map
- [x] สร้างไฟล์ `rule.md` และ `project.md`
- [/] สร้างไฟล์โครงสร้างและโปรแกรมสำหรับอ่านค่าจาก DHT22 และแสดงผลผ่าน Serial Monitor

## Open Questions
- ไม่มี (รอทดสอบเฟสแรกอ่านค่าเซนเซอร์)

## Issue Log
1. **ปัญหาการอ่านข้อมูลจาก DHT22 ล้มเหลว (Failed to read):**
   - **อาการ:** เชื่อมต่อ DHT22 ที่ GPIO 3 และ GPIO 4 แล้ว ข้อมูลยังเป็น `NaN`
   - **วิธีแก้ไข:** ย้ายไปเชื่อมต่อที่ขา **GPIO 5** และอัปเดตโค้ดเฟิร์มแวร์ เพื่อเช็คและเปรียบเทียบสัญญาณ

2. **ปัญหาบอร์ดเกิดอาการ Watchdog Reset (WDT crash) เมื่อถอดเซนเซอร์ออก:**
   - **อาการ:** เมื่อถอดสาย DHT22 สัญญาณที่ขา DATA ค้างสถานะ HIGH ทำให้ไลบรารีของ Adafruit รอพัลส์สัญญาณค้างในลูปจนเกิด Watchdog Timeout
   - **วิธีแก้ไข:** เปลี่ยนมาใช้ไลบรารี **SimpleDHT** ในการอ่านข้อมูล ซึ่งมีเสถียรภาพและระบบป้องกันการวนลูปค้าง (Timeout check) ที่เหมาะสมสำหรับชิป ESP32-C3 RISC-V
