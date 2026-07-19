#pragma once

#include <Arduino.h>
#include <U8g2lib.h>

void init_oled();
void draw_status_on_oled(const char* status_text, float temp = NAN, float humid = NAN);
void draw_rain_alert_on_oled();
