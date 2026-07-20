import { pgTable, serial, real, boolean, timestamp } from "drizzle-orm/pg-core";

export const weatherLogs = pgTable("weather_logs", {
  id: serial("id").primaryKey(),
  temperature: real("temperature").notNull(),
  humidity: real("humidity").notNull(),
  rainDetected: boolean("rain_detected").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
