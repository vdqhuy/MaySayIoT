#include <WiFi.h>
#include <WebServer.h>
#include "LoRa_E32.h"

// WiFi credentials
const char* ssid = "Hanh L3";
const char* password = "antrongnoingoicoitivi";

// Web Server
WebServer server(80);

// LoRa
HardwareSerial LoRaSerial(2);
LoRa_E32 e32ttl(&LoRaSerial);

// System Variables
float currentTemp = -1000;
float threshold = 34.0;
bool fanStatus = false; // Fan status ON/OFF

unsigned long lastTempRequestMillis = 0;

void handleGetStatus() {
  // Gửi dữ liệu hiện tại dạng JSON
  String response = "{";
  response += "\"temperature\":" + String(currentTemp) + ",";
  response += "\"fanStatus\":" + String(fanStatus ? "true" : "false") + ",";
  response += "\"threshold\":" + String(threshold);
  response += "}";
  
  server.send(200, "application/json", response);
}

void handleSetThreshold() {
  if (server.hasArg("threshold")) {
    float newThreshold = server.arg("threshold").toFloat();
    threshold = newThreshold;
    
    // Gửi threshold mới xuống Node nếu cần
    String thresholdMsg = "THRESHOLD:" + String(threshold);
    e32ttl.sendMessage(thresholdMsg);
    Serial.println("Đặt threshold mới: " + thresholdMsg);
    
    server.send(200, "text/plain", "Threshold updated");
  } else {
    server.send(400, "text/plain", "Missing threshold parameter");
  }
}

void handleSetFan() {
  if (server.hasArg("status")) {
    String status = server.arg("status");
    if (status == "on") {
      fanStatus = true;
      e32ttl.sendMessage("FAN:ON");
    } else if (status == "off") {
      fanStatus = false;
      e32ttl.sendMessage("FAN:OFF");
    }
    Serial.println("Đặt trạng thái quạt: " + status);
    
    // Tạo JSON object
    StaticJsonDocument<200> doc;
    doc["message"] = "Fan status updated";
    doc["fanStatus"] = fanStatus;

    String response;
    serializeJson(doc, response);

    server.send(200, "application/json", response);
  } else {
    // Nếu thiếu tham số
    StaticJsonDocument<200> doc;
    doc["error"] = "Missing status parameter";

    String response;
    serializeJson(doc, response);

    server.send(400, "application/json", response);
  }
}

void checkFanByTemp() {
  if (currentTemp >= threshold && !fanStatus) {
    fanStatus = true;
    e32ttl.sendMessage("FAN:ON");
    Serial.println("Tự động bật quạt do vượt ngưỡng");
  } else if (currentTemp < threshold && fanStatus) {
    fanStatus = false;
    e32ttl.sendMessage("FAN:OFF");
    Serial.println("Tự động tắt quạt do dưới ngưỡng");
  }
}

void handleLoRaData() {
  ResponseContainer rs = e32ttl.receiveMessage();
  String data = rs.data;
  data.trim();
  Serial.println("Nhận từ LoRa: " + data);

  if (data.startsWith("TEMP:")) {
    float temp = data.substring(5).toFloat();
    currentTemp = temp;
    Serial.println("Cập nhật nhiệt độ: " + String(currentTemp));
    checkFanByTemp();
  }
}

void setup() {
  Serial.begin(9600);
  LoRaSerial.begin(9600, SERIAL_8N1, 16, 17); // TX=17, RX=16
  e32ttl.begin();

  // WiFi Connect
  WiFi.begin(ssid, password);
  Serial.print("Kết nối WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" OK");

  Serial.println("Địa chỉ IP ESP32: " + WiFi.localIP().toString());

  // WebServer Routes
  server.on("/status", HTTP_GET, handleGetStatus);
  server.on("/set-threshold", HTTP_POST, handleSetThreshold);
  server.on("/set-fan", HTTP_POST, handleSetFan);

  server.begin();
  Serial.println("Web server đã khởi động!");

  Serial.println("Gateway sẵn sàng.");
}

void loop() {
  unsigned long now = millis();

  // Đọc dữ liệu LoRa
  if (e32ttl.available() > 1) {
    handleLoRaData();
  }

  // Nếu chưa có nhiệt độ, gửi yêu cầu REQ sau mỗi 10 giây
  if (currentTemp == -1000 && now - lastTempRequestMillis > 10000) {
    e32ttl.sendMessage("REQ");
    lastTempRequestMillis = now;
    Serial.println("Gửi yêu cầu nhiệt độ đến Node");
  }

  // Xử lý request HTTP
  server.handleClient();
}
