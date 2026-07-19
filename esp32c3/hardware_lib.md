# Hardware & Library Specs (ESP32-C3)

## Hardware

| Part | Model | Interface | Notes |
|---|---|---|---|
| Microcontroller | ESP32-C3 Super Mini | USB CDC / Serial / Wi-Fi / BLE | บอร์ดขนาดเล็ก ใช้ชิป RISC-V 32-bit Single-Core |
| Sensor | DHT11 (หรือ DHT22 ที่ทำงานในโหมด DHT11) | 1-Wire Digital Signal | ใช้ในการวัดค่าอุณหภูมิและความชื้นสัมพัทธ์แบบเรียลไทม์ (พบข้อมูลดิบส่งแบบ DHT11) |
| Display | OLED 0.96" | I2C (Address: 0x3C) | จอขนาด 128x64 พิกเซล ชนิด Monochrome |

## Libraries

| Purpose | Library | Status | Notes |
|---|---|---|---|
| ควบคุมหน้าจอ OLED | olikraus/U8g2 | active | รองรับการทำงานร่วมกับบอร์ดสถาปัตยกรรม RISC-V ได้ดี มีฟอนต์และเครื่องมือกราฟิกครบครัน |
| สื่อสารกับ DHT11 | winlinvip/SimpleDHT | active | ไลบรารีถอดรหัสบิตข้อมูล สำหรับ ESP32 ได้เขียนคลาส SafeSimpleDHT11 ครอบทับเพื่อลด `levelTimeout` เหลือ 5ms ป้องกัน WDT crash |


## Datasheet / References
- **ESP32-C3 Datasheet:** [ESP32-C3 Technical Reference Manual](https://www.espressif.com/sites/default/files/documentation/esp32-c3_technical_reference_manual_en.pdf)
- **DHT22 (AM2302) Datasheet:** [AM2302 Product Manual](https://cdn-shop.adafruit.com/datasheets/Digital+humidity+and+temperature+sensor+AM2302.pdf)
- **U8g2 Library Wiki:** [U8g2 Reference Wiki](https://github.com/olikraus/u8g2/wiki)

## Hardware Issues
*(ยังไม่พบปัญหาในการต่อฮาร์ดแวร์ขณะนี้)*

## Test Notes
- ทดสอบอ่านค่าจริงจากเซนเซอร์ตัวใหม่ พบว่าการถอดรหัสข้อมูลแบบ DHT22 คืนค่าผิดปกติมาก (Temp: 742.60 °C, Humid: 921.80 %) ซึ่งเมื่อคำนวณด้วยสูตร DHT11 จะได้อุณหภูมิ 29.2 °C และความชื้น 36.2 % ซึ่งถูกต้องตรงตามความเป็นจริง
- ภายหลังพบปัญหาจากไลบรารี SimpleDHT ในช่วงแรก (เกิด Interrupt WDT timeout crash เนื่องจากตั้งค่า `levelTimeout` ของไลบรารีค้างไว้นานถึง 500ms เมื่อสัญญาณมีปัญหา) และพบปัญหา `TIMEOUT` จากไลบรารี `DHTesp`
- ปัจจุบันได้แก้ปัญหาอย่างถาวรโดยย้อนกลับมาใช้ไลบรารี `winlinvip/SimpleDHT` ร่วมกับคลาสปรับปรุงใหม่ `SafeSimpleDHT11` ที่เขียนลดค่า `levelTimeout` เหลือเพียง 5ms (5,000 us) ทำให้แก้ปัญหา WDT crash ได้ 100% และสามารถอ่านค่าอุณหภูมิและความชื้นสัมพัทธ์ของ DHT11 ได้อย่างถูกต้องแม่นยำ (อ้างอิง: 28.7 °C / 34.0%)
