# Hardware & Library Specs (ESP32-C3)

## Hardware

| Part | Model | Interface | Notes |
|---|---|---|---|
| Microcontroller | ESP32-C3 Super Mini | USB CDC / Serial / Wi-Fi / BLE | บอร์ดขนาดเล็ก ใช้ชิป RISC-V 32-bit Single-Core |
| Sensor | DHT22 (AM2302) | 1-Wire Digital Signal | ใช้ในการวัดค่าอุณหภูมิและความชื้นสัมพัทธ์แบบเรียลไทม์ |
| Display | OLED 0.96" | I2C (Address: 0x3C) | จอขนาด 128x64 พิกเซล ชนิด Monochrome |

## Libraries

| Purpose | Library | Status | Notes |
|---|---|---|---|
| ควบคุมหน้าจอ OLED | olikraus/U8g2 | active | รองรับการทำงานร่วมกับบอร์ดสถาปัตยกรรม RISC-V ได้ดี มีฟอนต์และเครื่องมือกราฟิกครบครัน |
| สื่อสารกับ DHT22 | winlinvip/SimpleDHT | active | ไลบรารีอ่านพัลส์ที่มีระบบ Safety Timeout เพื่อหลีกเลี่ยงการวนลูปค้าง (WDT crash) เมื่อไม่มีเซนเซอร์ต่ออยู่ |


## Datasheet / References
- **ESP32-C3 Datasheet:** [ESP32-C3 Technical Reference Manual](https://www.espressif.com/sites/default/files/documentation/esp32-c3_technical_reference_manual_en.pdf)
- **DHT22 (AM2302) Datasheet:** [AM2302 Product Manual](https://cdn-shop.adafruit.com/datasheets/Digital+humidity+and+temperature+sensor+AM2302.pdf)
- **U8g2 Library Wiki:** [U8g2 Reference Wiki](https://github.com/olikraus/u8g2/wiki)

## Hardware Issues
*(ยังไม่พบปัญหาในการต่อฮาร์ดแวร์ขณะนี้)*

## Test Notes
*(รอผลการทดสอบการอ่านค่า DHT22 และวาดหน้าจอ OLED)*
