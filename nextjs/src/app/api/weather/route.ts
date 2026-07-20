import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { weatherLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

// GET /api/weather - ดึงข้อมูลสภาพอากาศล่าสุด 50 รายการ (เรียงตาม ID ล่าสุดลงมา)
export async function GET() {
  try {
    const logs = await db
      .select()
      .from(weatherLogs)
      .orderBy(desc(weatherLogs.id))
      .limit(50);

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error("Error fetching weather logs:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch weather logs" },
      { status: 500 }
    );
  }
}

// POST /api/weather - รับข้อมูลจาก ESP32-C3
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // รองรับทั้งแบบ Single Object, Array, และ Object ที่มีฟิลด์ records: [...]
    let items: any[] = [];
    if (Array.isArray(body)) {
      items = body;
    } else if (body && Array.isArray(body.records)) {
      items = body.records;
    } else {
      items = [body];
    }

    const recordsToInsert = items.map((item: any) => ({
      temperature: Number(item.temperature ?? item.temp ?? 0),
      humidity: Number(item.humidity ?? item.humid ?? 0),
      rainDetected: Boolean(item.rain_detected ?? item.rainDetected ?? item.rain ?? false),
    }));

    // บันทึกลงฐานข้อมูล Neon ผ่าน Drizzle ORM
    const inserted = await db.insert(weatherLogs).values(recordsToInsert).returning();

    return NextResponse.json(
      { success: true, count: inserted.length, data: inserted },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error inserting weather log:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to insert weather log" },
      { status: 400 }
    );
  }
}
