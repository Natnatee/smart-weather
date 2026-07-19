#pragma once

#include <Arduino.h>

struct WeatherRecord {
    uint32_t timestamp; // Unix Timestamp หรือ Relative seconds
    int16_t temp;       // อุณหภูมิ x 10 (เช่น 28.5 -> 285)
    uint8_t humid;      // ความชื้น % (0-100)
    uint8_t rain;       // สภาพฝน (1 = ตก, 0 = ไม่ตก)
};

void init_storage();
void push_weather_record(uint32_t timestamp, float temp, float humid, bool rain);
uint16_t get_storage_count();
bool get_record_at(uint16_t index, WeatherRecord &record);
void clear_storage_up_to(uint16_t count);
