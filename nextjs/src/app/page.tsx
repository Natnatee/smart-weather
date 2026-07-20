"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface WeatherLog {
  id: number;
  temperature: number;
  humidity: number;
  rainDetected: boolean;
  createdAt: string;
}

export default function Home() {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchWeatherData = async () => {
    try {
      const res = await fetch("/api/weather");
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setLogs(result.data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch weather data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 5000); // Refresh ทุก 5 วินาที
    return () => clearInterval(interval);
  }, []);

  const latest = logs[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between pb-8 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-sky-500/20 border border-slate-700">
            <Image
              src="/ChatGPT Image Jul 20, 2026, 07_50_34 AM.png"
              alt="smart-weather logo"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              smart-weather
            </h1>
            <p className="text-xs text-slate-400">IoT Weather Station Monitor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-slate-300 font-medium">
            Live {lastRefreshed ? `(${lastRefreshed.toLocaleTimeString()})` : ""}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto py-8 space-y-8">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Temperature Card */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900/80 backdrop-blur border border-slate-800 p-6 shadow-xl hover:border-amber-500/50 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">อุณหภูมิ (Temperature)</p>
                <h2 className="text-4xl font-extrabold text-amber-400 mt-2">
                  {latest ? `${latest.temperature.toFixed(1)}°C` : "--°C"}
                </h2>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                🌡️
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              {latest ? `อัปเดตล่าสุด: ${new Date(latest.createdAt).toLocaleTimeString()}` : "รอข้อมูลจาก ESP32..."}
            </div>
          </div>

          {/* Humidity Card */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900/80 backdrop-blur border border-slate-800 p-6 shadow-xl hover:border-sky-500/50 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">ความชื้นสัมพัทธ์ (Humidity)</p>
                <h2 className="text-4xl font-extrabold text-sky-400 mt-2">
                  {latest ? `${latest.humidity.toFixed(1)}%` : "--%"}
                </h2>
              </div>
              <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20">
                💧
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              {latest ? "เซนเซอร์ DHT22" : "รอข้อมูลจาก ESP32..."}
            </div>
          </div>

          {/* Rain Sensor Card */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900/80 backdrop-blur border border-slate-800 p-6 shadow-xl hover:border-indigo-500/50 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">สถานะฝน (Rain Status)</p>
                <h2 className="text-2xl font-bold mt-2">
                  {latest ? (
                    latest.rainDetected ? (
                      <span className="text-rose-400 flex items-center gap-2">🌧️ ตรวจพบฝนตก</span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-2">☀️ ฝนไม่ตก</span>
                    )
                  ) : (
                    "--"
                  )}
                </h2>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                🌧️
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              {latest ? "เซนเซอร์ Rain Sensor" : "รอข้อมูลจาก ESP32..."}
            </div>
          </div>
        </div>

        {/* Data Log Table */}
        <div className="rounded-2xl bg-slate-900/80 backdrop-blur border border-slate-800 p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <h3 className="text-lg font-semibold text-slate-200">ประวัติข้อมูลสภาพอากาศ (Recent Logs)</h3>
            <span className="text-xs text-slate-400">แสดงสูงสุด 50 รายการล่าสุด</span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-500">กำลังโหลดข้อมูล...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <p>ยังไม่มีข้อมูลในระบบ</p>
              <p className="text-xs text-slate-600">
                เมื่อ ESP32-C3 ยิง HTTP POST เข้ามาที่ <code className="text-sky-400">/api/weather</code> ข้อมูลจะปรากฏที่นี่ทันที
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">ID</th>
                    <th className="px-4 py-3">เวลาที่บันทึก</th>
                    <th className="px-4 py-3">อุณหภูมิ (°C)</th>
                    <th className="px-4 py-3">ความชื้น (%)</th>
                    <th className="px-4 py-3 rounded-r-lg">สถานะฝน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400">#{log.id}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {new Date(log.createdAt).toLocaleString("th-TH")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-amber-400">
                        {log.temperature.toFixed(1)} °C
                      </td>
                      <td className="px-4 py-3 font-semibold text-sky-400">
                        {log.humidity.toFixed(1)} %
                      </td>
                      <td className="px-4 py-3">
                        {log.rainDetected ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            ฝนตก
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ปกติ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
