#pragma once

#include <Arduino.h>

void init_wifi();
bool connect_wifi();
void disconnect_wifi();
bool is_wifi_connected();
void sync_time_ntp();
uint32_t get_current_timestamp();
bool send_stored_records_to_server();
