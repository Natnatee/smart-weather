"use client";

import { useEffect, useState, useMemo } from "react";
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
  const [activeTab, setActiveTab] = useState<"overview" | "chart" | "stats">("overview");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

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
    const interval = setInterval(fetchWeatherData, 5000);
    return () => clearInterval(interval);
  }, []);

  const latest = logs[0];

  // คำนวณค่า Max, Min, Avg
  const stats = useMemo(() => {
    if (logs.length === 0) {
      return {
        maxTemp: 0,
        minTemp: 0,
        avgTemp: 0,
        maxHumid: 0,
        minHumid: 0,
        avgHumid: 0,
        rainCount: 0,
      };
    }

    let maxT = -Infinity;
    let minT = Infinity;
    let sumT = 0;

    let maxH = -Infinity;
    let minH = Infinity;
    let sumH = 0;

    let rainCnt = 0;

    logs.forEach((log) => {
      if (log.temperature > maxT) maxT = log.temperature;
      if (log.temperature < minT) minT = log.temperature;
      sumT += log.temperature;

      if (log.humidity > maxH) maxH = log.humidity;
      if (log.humidity < minH) minH = log.humidity;
      sumH += log.humidity;

      if (log.rainDetected) rainCnt++;
    });

    return {
      maxTemp: maxT,
      minTemp: minT,
      avgTemp: sumT / logs.length,
      maxHumid: maxH,
      minHumid: minH,
      avgHumid: sumH / logs.length,
      rainCount: rainCnt,
    };
  }, [logs]);

  // เตรียมข้อมูลสำหรับวาด SVG Graph (เรียงเวลาจากเก่าไปใหม่)
  const chartData = useMemo(() => {
    return [...logs].reverse();
  }, [logs]);

  // Downsample ข้อมูลเมื่อมีจุดข้อมูลเยอะเกินไป เพื่อให้กราฟเรียบสวย ไม่เป็นกระจุกไข่ปลา
  const sampledChartData = useMemo(() => {
    if (chartData.length <= 40) return chartData;
    const step = (chartData.length - 1) / 39;
    const sampled: WeatherLog[] = [];
    for (let i = 0; i < 40; i++) {
      const idx = Math.round(i * step);
      if (chartData[idx]) sampled.push(chartData[idx]);
    }
    return sampled;
  }, [chartData]);

  // ฟังก์ชันสร้าง Smooth Cubic Bezier Path สำหรับกราฟ
  const createSmoothPath = (
    data: WeatherLog[],
    key: "temperature" | "humidity",
    width: number,
    height: number,
    minVal: number,
    maxVal: number
  ) => {
    if (data.length < 2) return "";
    const range = maxVal - minVal || 1;
    const paddingY = 20;
    const usableHeight = height - paddingY * 2;

    const points = data.map((d, i) => ({
      x: (i / (data.length - 1)) * width,
      y: height - paddingY - ((d[key] - minVal) / range) * usableHeight,
    }));

    let path = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return path;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Top Mobile-Friendly Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-sky-500/20 border border-slate-700">
              <Image
                src="/icon.png"
                alt="smart-weather logo"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent leading-tight">
                smart-weather
              </h1>
              <p className="text-[10px] text-slate-400">IoT Weather Station</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] text-slate-300 font-mono">
              {lastRefreshed ? lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Syncing"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-5">
        {/* Navigation Tabs (Mobile Priority) */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium text-slate-400">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              activeTab === "overview"
                ? "bg-sky-500 text-white font-semibold shadow-md shadow-sky-500/20"
                : "hover:text-slate-200"
            }`}
          >
            <span>📱</span> ภาพรวม
          </button>

          <button
            onClick={() => setActiveTab("chart")}
            className={`py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              activeTab === "chart"
                ? "bg-sky-500 text-white font-semibold shadow-md shadow-sky-500/20"
                : "hover:text-slate-200"
            }`}
          >
            <span>📈</span> กราฟแนวโน้ม
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              activeTab === "stats"
                ? "bg-sky-500 text-white font-semibold shadow-md shadow-sky-500/20"
                : "hover:text-slate-200"
            }`}
          >
            <span>📊</span> สถิติ Max/Min
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Temperature Card */}
              <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 p-4 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-amber-400/90">อุณหภูมิปัจจุบัน</p>
                    <h2 className="text-3xl font-black text-amber-400 mt-1">
                      {latest ? `${latest.temperature.toFixed(1)}°C` : "--°C"}
                    </h2>
                  </div>
                  <div className="text-2xl">🌡️</div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>มิน: <strong className="text-amber-300">{stats.minTemp.toFixed(1)}°C</strong></span>
                  <span>แม็กซ์: <strong className="text-amber-300">{stats.maxTemp.toFixed(1)}°C</strong></span>
                </div>
              </div>

              {/* Humidity Card */}
              <div className="rounded-2xl bg-gradient-to-br from-sky-500/10 via-slate-900 to-slate-900 border border-sky-500/20 p-4 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-sky-400/90">ความชื้นสัมพัทธ์</p>
                    <h2 className="text-3xl font-black text-sky-400 mt-1">
                      {latest ? `${latest.humidity.toFixed(1)}%` : "--%"}
                    </h2>
                  </div>
                  <div className="text-2xl">💧</div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>มิน: <strong className="text-sky-300">{stats.minHumid.toFixed(1)}%</strong></span>
                  <span>แม็กซ์: <strong className="text-sky-300">{stats.maxHumid.toFixed(1)}%</strong></span>
                </div>
              </div>

              {/* Rain Sensor Card */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 via-slate-900 to-slate-900 border border-indigo-500/20 p-4 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-indigo-400/90">สถานะฝนตก</p>
                    <h2 className="text-xl font-bold mt-2">
                      {latest ? (
                        latest.rainDetected ? (
                          <span className="text-rose-400 flex items-center gap-1.5">🌧️ ตรวจพบฝน</span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1.5">☀️ ปกติ</span>
                        )
                      ) : (
                        "--"
                      )}
                    </h2>
                  </div>
                  <div className="text-2xl">☁️</div>
                </div>
                <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                  ตรวจพบฝนในประวัติ: <strong className="text-indigo-300">{stats.rainCount} ครั้ง</strong>
                </div>
              </div>
            </div>

            {/* Quick Recent Data Table */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <h3 className="text-sm font-semibold text-slate-200">ประวัติข้อมูลวันนี้ (ตั้งแต่ 00:00 น. - {logs.length} รายการ)</h3>
                <span className="text-[10px] text-slate-400">อัปเดตอัตโนมัติ</span>
              </div>

              {loading ? (
                <div className="text-center py-8 text-xs text-slate-500">กำลังโหลด...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">ยังไม่มีข้อมูลในระบบ</div>
              ) : (
                <div className="divide-y divide-slate-800/60 max-h-[380px] overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-800/30 px-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 text-[10px]">#{log.id}</span>
                        <span className="text-slate-300 font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleTimeString("th-TH")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-semibold">
                        <span className="text-amber-400">{log.temperature.toFixed(1)}°C</span>
                        <span className="text-sky-400">{log.humidity.toFixed(1)}%</span>
                        {log.rainDetected ? (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">ฝน</span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">แห้ง</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE CHART */}
        {activeTab === "chart" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Temperature Smooth Line Chart Card */}
            {(() => {
              const temps = chartData.map((d) => d.temperature);
              const rawMin = temps.length > 0 ? Math.min(...temps) : 0;
              const rawMax = temps.length > 0 ? Math.max(...temps) : 100;
              const minVal = Math.floor(rawMin - 1);
              const maxVal = Math.ceil(rawMax + 1);
              const midVal = ((maxVal + minVal) / 2).toFixed(1);
              const width = 500;
              const height = 160;
              const paddingY = 20;

              const pathD = createSmoothPath(sampledChartData, "temperature", width, height, minVal, maxVal);

              const hoverItem = hoveredPointIndex !== null && chartData[hoveredPointIndex] ? chartData[hoveredPointIndex] : null;

              return (
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                        🌡️
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">กราฟแนวโน้มอุณหภูมิ (°C)</h3>
                        <p className="text-[10px] text-slate-400">อัปเดตแบบเรียลไทม์ • ทั้งหมด {chartData.length} จุดข้อมูล</p>
                      </div>
                    </div>
                    {latest && (
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block text-[10px]">ล่าสุด</span>
                        <span className="text-base font-black text-amber-400 font-mono">
                          {latest.temperature.toFixed(1)}°C
                        </span>
                      </div>
                    )}
                  </div>

                  {chartData.length < 2 ? (
                    <div className="text-center py-16 text-xs text-slate-500">ต้องมีข้อมูลอย่างน้อย 2 รายการเพื่อวาดกราฟ</div>
                  ) : (
                    <div className="relative pt-1">
                      {/* Grid Lines & Y-Axis Scale Overlay */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-slate-500 opacity-60 pb-6 pt-5">
                        <div className="border-b border-slate-800/80 w-full flex justify-between px-1">
                          <span>{maxVal.toFixed(1)}°C</span>
                        </div>
                        <div className="border-b border-slate-800/40 w-full border-dashed flex justify-between px-1">
                          <span>{midVal}°C</span>
                        </div>
                        <div className="border-b border-slate-800/80 w-full flex justify-between px-1">
                          <span>{minVal.toFixed(1)}°C</span>
                        </div>
                      </div>

                      {/* SVG Canvas */}
                      <div className="relative w-full h-48">
                        <svg
                          className="w-full h-full overflow-visible cursor-crosshair"
                          viewBox={`0 0 ${width} ${height}`}
                          preserveAspectRatio="none"
                          onMouseLeave={() => setHoveredPointIndex(null)}
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const mouseX = e.clientX - rect.left;
                            const pct = Math.max(0, Math.min(1, mouseX / rect.width));
                            const targetIdx = Math.round(pct * (chartData.length - 1));
                            setHoveredPointIndex(targetIdx);
                          }}
                        >
                          <defs>
                            <linearGradient id="tempSmoothGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.08" />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                            </linearGradient>
                            <filter id="tempGlow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                          </defs>

                          {/* Gradient Fill under Line */}
                          {pathD && (
                            <path
                              d={`${pathD} L ${width},${height - paddingY} L 0,${height - paddingY} Z`}
                              fill="url(#tempSmoothGrad)"
                            />
                          )}

                          {/* Main Glowing Smooth Line */}
                          {pathD && (
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              filter="url(#tempGlow)"
                            />
                          )}

                          {/* Interactive Hover Vertical Guide Line */}
                          {hoveredPointIndex !== null && chartData[hoveredPointIndex] && (
                            <line
                              x1={(hoveredPointIndex / (chartData.length - 1)) * width}
                              y1={paddingY}
                              x2={(hoveredPointIndex / (chartData.length - 1)) * width}
                              y2={height - paddingY}
                              stroke="#f59e0b"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                              className="opacity-80"
                            />
                          )}

                          {/* Active Hover Dot Indicator */}
                          {hoveredPointIndex !== null && chartData[hoveredPointIndex] && (() => {
                            const d = chartData[hoveredPointIndex];
                            const x = (hoveredPointIndex / (chartData.length - 1)) * width;
                            const range = maxVal - minVal || 1;
                            const usableHeight = height - paddingY * 2;
                            const y = height - paddingY - ((d.temperature - minVal) / range) * usableHeight;
                            return (
                              <g key="hover-dot">
                                <circle cx={x} cy={y} r="8" fill="#f59e0b" fillOpacity="0.3" className="animate-ping" />
                                <circle cx={x} cy={y} r="5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2.5" />
                              </g>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* X-Axis Time Labels */}
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2 px-1 pt-1 border-t border-slate-800/60">
                        <span>{new Date(chartData[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {chartData.length > 2 && (
                          <span>{new Date(chartData[Math.floor(chartData.length / 2)].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        <span>{new Date(chartData[chartData.length - 1].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Tooltip on Hover */}
                      {hoverItem && (
                        <div
                          className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-amber-500/30 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-3 text-xs z-20 transition-all"
                        >
                          <span className="text-slate-400 font-mono text-[11px]">
                            ⏰ {new Date(hoverItem.createdAt).toLocaleTimeString("th-TH")}
                          </span>
                          <span className="font-bold text-amber-400">
                            🌡️ {hoverItem.temperature.toFixed(1)}°C
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Humidity Smooth Line Chart Card */}
            {(() => {
              const humids = chartData.map((d) => d.humidity);
              const rawMin = humids.length > 0 ? Math.min(...humids) : 0;
              const rawMax = humids.length > 0 ? Math.max(...humids) : 100;
              const minVal = Math.floor(rawMin - 1);
              const maxVal = Math.ceil(rawMax + 1);
              const midVal = ((maxVal + minVal) / 2).toFixed(1);
              const width = 500;
              const height = 160;
              const paddingY = 20;

              const pathD = createSmoothPath(sampledChartData, "humidity", width, height, minVal, maxVal);

              const hoverItem = hoveredPointIndex !== null && chartData[hoveredPointIndex] ? chartData[hoveredPointIndex] : null;

              return (
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
                        💧
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">กราฟแนวโน้มความชื้นสัมพัทธ์ (%)</h3>
                        <p className="text-[10px] text-slate-400">อัปเดตแบบเรียลไทม์ • ทั้งหมด {chartData.length} จุดข้อมูล</p>
                      </div>
                    </div>
                    {latest && (
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block text-[10px]">ล่าสุด</span>
                        <span className="text-base font-black text-sky-400 font-mono">
                          {latest.humidity.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {chartData.length < 2 ? (
                    <div className="text-center py-16 text-xs text-slate-500">ต้องมีข้อมูลอย่างน้อย 2 รายการเพื่อวาดกราฟ</div>
                  ) : (
                    <div className="relative pt-1">
                      {/* Grid Lines & Y-Axis Scale Overlay */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-slate-500 opacity-60 pb-6 pt-5">
                        <div className="border-b border-slate-800/80 w-full flex justify-between px-1">
                          <span>{maxVal.toFixed(1)}%</span>
                        </div>
                        <div className="border-b border-slate-800/40 w-full border-dashed flex justify-between px-1">
                          <span>{midVal}%</span>
                        </div>
                        <div className="border-b border-slate-800/80 w-full flex justify-between px-1">
                          <span>{minVal.toFixed(1)}%</span>
                        </div>
                      </div>

                      {/* SVG Canvas */}
                      <div className="relative w-full h-48">
                        <svg
                          className="w-full h-full overflow-visible cursor-crosshair"
                          viewBox={`0 0 ${width} ${height}`}
                          preserveAspectRatio="none"
                          onMouseLeave={() => setHoveredPointIndex(null)}
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const mouseX = e.clientX - rect.left;
                            const pct = Math.max(0, Math.min(1, mouseX / rect.width));
                            const targetIdx = Math.round(pct * (chartData.length - 1));
                            setHoveredPointIndex(targetIdx);
                          }}
                        >
                          <defs>
                            <linearGradient id="humidSmoothGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.08" />
                              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                            </linearGradient>
                            <filter id="humidGlow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                          </defs>

                          {/* Gradient Fill under Line */}
                          {pathD && (
                            <path
                              d={`${pathD} L ${width},${height - paddingY} L 0,${height - paddingY} Z`}
                              fill="url(#humidSmoothGrad)"
                            />
                          )}

                          {/* Main Glowing Smooth Line */}
                          {pathD && (
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#38bdf8"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              filter="url(#humidGlow)"
                            />
                          )}

                          {/* Interactive Hover Vertical Guide Line */}
                          {hoveredPointIndex !== null && chartData[hoveredPointIndex] && (
                            <line
                              x1={(hoveredPointIndex / (chartData.length - 1)) * width}
                              y1={paddingY}
                              x2={(hoveredPointIndex / (chartData.length - 1)) * width}
                              y2={height - paddingY}
                              stroke="#38bdf8"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                              className="opacity-80"
                            />
                          )}

                          {/* Active Hover Dot Indicator */}
                          {hoveredPointIndex !== null && chartData[hoveredPointIndex] && (() => {
                            const d = chartData[hoveredPointIndex];
                            const x = (hoveredPointIndex / (chartData.length - 1)) * width;
                            const range = maxVal - minVal || 1;
                            const usableHeight = height - paddingY * 2;
                            const y = height - paddingY - ((d.humidity - minVal) / range) * usableHeight;
                            return (
                              <g key="hover-dot-humid">
                                <circle cx={x} cy={y} r="8" fill="#38bdf8" fillOpacity="0.3" className="animate-ping" />
                                <circle cx={x} cy={y} r="5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.5" />
                              </g>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* X-Axis Time Labels */}
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2 px-1 pt-1 border-t border-slate-800/60">
                        <span>{new Date(chartData[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {chartData.length > 2 && (
                          <span>{new Date(chartData[Math.floor(chartData.length / 2)].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        <span>{new Date(chartData[chartData.length - 1].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Tooltip on Hover */}
                      {hoverItem && (
                        <div
                          className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-sky-500/30 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-3 text-xs z-20 transition-all"
                        >
                          <span className="text-slate-400 font-mono text-[11px]">
                            ⏰ {new Date(hoverItem.createdAt).toLocaleTimeString("th-TH")}
                          </span>
                          <span className="font-bold text-sky-400">
                            💧 {hoverItem.humidity.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: MAX / MIN STATS */}
        {activeTab === "stats" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Temperature Max/Min Breakdown */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <span className="text-amber-400 text-lg">🌡️</span>
                <h3 className="text-sm font-bold text-slate-100">สถิติมุมมองอุณหภูมิ (Temperature Summary)</h3>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                  <p className="text-[10px] text-amber-400 font-medium">สูงสุด (MAX)</p>
                  <p className="text-xl font-black text-amber-300 mt-1">{stats.maxTemp.toFixed(1)}°C</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-medium">เฉลี่ย (AVG)</p>
                  <p className="text-xl font-black text-slate-200 mt-1">{stats.avgTemp.toFixed(1)}°C</p>
                </div>

                <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-xl">
                  <p className="text-[10px] text-sky-400 font-medium">ต่ำสุด (MIN)</p>
                  <p className="text-xl font-black text-sky-300 mt-1">{stats.minTemp.toFixed(1)}°C</p>
                </div>
              </div>
            </div>

            {/* Humidity Max/Min Breakdown */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <span className="text-sky-400 text-lg">💧</span>
                <h3 className="text-sm font-bold text-slate-100">สถิติมุมมองความชื้น (Humidity Summary)</h3>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-xl">
                  <p className="text-[10px] text-sky-400 font-medium">สูงสุด (MAX)</p>
                  <p className="text-xl font-black text-sky-300 mt-1">{stats.maxHumid.toFixed(1)}%</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-medium">เฉลี่ย (AVG)</p>
                  <p className="text-xl font-black text-slate-200 mt-1">{stats.avgHumid.toFixed(1)}%</p>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl">
                  <p className="text-[10px] text-indigo-400 font-medium">ต่ำสุด (MIN)</p>
                  <p className="text-xl font-black text-indigo-300 mt-1">{stats.minHumid.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Rain Summary Breakdown */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                  🌧️
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">ประวัติฝนตก</h4>
                  <p className="text-[10px] text-slate-400">จากข้อมูลสะสมทั้งหมด</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-indigo-300">{stats.rainCount} ครั้ง</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
