---
id: "smart-weather"
title: "Smart Weather"
category: "smart-iot"
tags: ["ESP32-C3", "IoT", "3D Printing", "Next.js", "Drizzle ORM", "Neon PostgreSQL"]
demoUrl: "https://smart-weather-two.vercel.app/"
videoUrl: ""
businessOutcome: "ระบบตรวจวัดและบันทึกสภาวะแวดล้อมพื้นที่วางเครื่องพิมพ์ 3D Outdoor เรียลไทม์ 24 ชม. เพื่อประเมินสภาวะอุณหภูมิที่เหมาะสมกับการพิมพ์ PLA และแจ้งเตือนป้องกันเส้นพลาสติกชื้นเสื่อมสภาพ"
techSpecs:
  embedded: ["ESP32-C3 Super Mini", "DHT Sensor", "Rain Sensor", "OLED Display 0.96\"", "PlatformIO (C++)"]
  web: ["Next.js 16", "React 19", "Tailwind CSS", "Custom SVG Smooth Line Chart"]
  design3D: []
  automation: ["Neon PostgreSQL (Cloud DB)", "Drizzle ORM", "Vercel Deployment"]
---

# Summary
ระบบ IoT เฝ้าระวังและบันทึกข้อมูลสภาพอากาศ (อุณหภูมิ, ความชื้นสัมพัทธ์, และสถานะฝนตก) แบบเรียลไทม์สำหรับพื้นที่ตั้งเครื่องพิมพ์ 3D ด้านนอกอาคาร ช่วยประเมินความพร้อมของสภาพแวดล้อมก่อนพิมพ์ชิ้นงานและดูแลรักษาวัสดุพิมพ์

# Features
- **Real-time Monitoring**: ตรวจวัดอุณหภูมิ ความชื้น และสถานะฝนตก ส่งข้อมูลเข้า Cloud API ทุกๆ 5 วินาที
- **OLED Local Display**: แสดงผลสถิติปัจจุบันบนจอ OLED 0.96 นิ้วที่ตัวเครื่อง ESP32-C3
- **Auto Reconnect System**: ระบบจัดการเชื่อมต่อ Wi-Fi และ HTTP POST อัตโนมัติเมื่อสัญญาณหลุด
- **Modern Web Dashboard**: หน้าเว็บแสดงผลแบบ Dark Mode Glassmorphism รองรับการใช้งานทั้งบนมือถือและเดสก์ท็อป
- **Smooth Interactive SVG Chart**: กราฟแนวโน้มแบบเส้นโค้ง Bezier แสดงผลตามช่วงเวลาตั้งแต่ 00:00 น. ของวัน พร้อมระบบ Interactive Crosshair & Tooltip
- **Daily Min/Max/Avg Analytics**: สรุปค่าอุณหภูมิสูงสุด ต่ำสุด และค่าเฉลี่ยประจำวัน เพื่อประเมินความพร้อมก่อนพิมพ์ชิ้นงาน 3D
