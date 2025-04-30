#include <WiFi.h>
#include <HTTPClient.h>
#include "LoRa_E32.h"

char ssid[] = "Hanh L3";
char pass[] = "antrongnoingoicoitivi";

HardwareSerial E32Serial(1);
LoRa_E32 e32ttl(&E32Serial);

bool fanManualControl = false;
int tempThreshold = 34;
bool fanStatus = false;

unsigned long lastRequestTime = 0;
const unsigned long requestInterval = 10000; // gửi yêu cầu mỗi 10s

const char* serverUrl = "http://192.168.1.5:3000";

void setup() {
  Serial.begin(9600);
  E32Serial.begin(9600, SERIAL_8N1, 16, 17);
  e32ttl.begin();

  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected!");

  Serial.println("Gateway sẵn sàng.");
}

void requestSensorData() {
  Serial.println("Temp request");
  e32ttl.sendMessage("REQ\n");
}

void sendStatusToServer(float temp) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(String(serverUrl) + "/update-status");
    http.addHeader("Content-Type", "application/json");

    String payload = "{\"temperature\":" + String(temp) + ", " + 
    "\"fanStatus\":" + String(fanStatus) + ", " +
    "\"fanManualControl\":" + String(fanManualControl) + "}";

    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Server response: " + response);

      if (response == "FAN_ON" && !fanStatus) {
        e32ttl.sendMessage("FAN:ON\n");
        fanStatus = true;
      } else if (response == "FAN_OFF" && fanStatus) {
        e32ttl.sendMessage("FAN:OFF\n");
        fanStatus = false;
      }
    } else {
      Serial.println("Lỗi gửi dữ liệu tới server");
    }
    http.end();
  }
}

void receiveLoRa() {
  if (e32ttl.available() > 1) {
    ResponseContainer rs = e32ttl.receiveMessage();
    String data = rs.data;
    Serial.println("Received: " + data);

    if (data.startsWith("TEMP:")) {
      float temp = data.substring(5).toFloat();
      sendStatusToServer(temp);

      if (!fanManualControl) {
        if (temp >= tempThreshold && !fanStatus) {
          e32ttl.sendMessage("FAN:ON\n");
          fanStatus = true;
        } else if (temp < tempThreshold && fanStatus) {
          e32ttl.sendMessage("FAN:OFF\n");
          fanStatus = false;
        }
      }
    }
    else if (data.startsWith("FAN:")) {
      String fan = data.substring(10);
      if (fan == "ON") 
        fanStatus = true;
      else if (fan == "OFF") 
        fanStatus = false;
    } 
    else if (data.startsWith("MODE:")) {
      String mode = data.substring(5);
      if (mode == "MANU") 
        fanManualControl = true;
      else if (mode == "AUTO") 
        fanManualControl = false;
    }
  }
}

void loop() {
  unsigned long now = millis();

  if (now - lastRequestTime >= requestInterval) {
    requestSensorData();
    lastRequestTime = now;
  }

  receiveLoRa();
}
