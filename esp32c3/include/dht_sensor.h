#pragma once

#include <Arduino.h>

void init_dht_sensor();
bool read_dht_sensor(float &temperature, float &humidity);
