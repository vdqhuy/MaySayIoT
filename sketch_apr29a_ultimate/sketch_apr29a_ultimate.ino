#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 4
#define RELAY_PIN 26
#define BUTTON_PIN 25
#define RELAY_PIN_DRYER 13

LiquidCrystal_I2C lcd(0x27, 16, 2);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

HardwareSerial LoRaSerial(2);

float temperature = 0.0;
bool fanStatus = false;
bool fanMode = true;
int tempThreshold = 30;
unsigned long fanStartTime = 0;
unsigned long autoOffDuration = 30UL * 60UL * 1000UL;
unsigned long lastButtonPress = 0;
bool lastButtonState = HIGH;

unsigned long lastSendTime = 0;
const unsigned long sendInterval = 5000; // gửi nhiệt độ mỗi 5 giây

/* ========== Gateway ==========*/
#include <WiFi.h>
#include <HTTPClient.h>
#include "LoRa_E32.h"

char ssid[] = "Hanh L3";
char pass[] = "antrongnoingoicoitivi";

// const char* serverUrl = "http://192.168.1.5:3000";
const char* serverUrl = "https://maysayiot.onrender.com";

bool currentAppBtnState = LOW;

void sendStatusToServer(float temp) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(String(serverUrl) + "/update-status");
    http.addHeader("Content-Type", "application/json");

    String payload = 
    "{\"temperature\":" + String(temp) + ", " +
    "\"heaterStatus\":\"" + (heaterStatus ? "ON" : "OFF") + "\", " +
    "\"fanStatus\":\"" + (fanStatus ? "ON" : "OFF") + "\", " +
    "\"fanMode\":\"" + (fanMode ? "AUTO" : "MANUAL") + "\", " +
    "\"currentAppBtnState\":\"" + currentAppBtnState + "\"}";

    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Server response: " + response);

      if (response == "HEATER_ON" && !heaterStatus) turnOnHeater();
      else if (response == "HEATER_OFF" && heaterStatus) turnOffHeater();
      else if (response == "FAN_ON" && !fanStatus) {
        fanStatus = true;
        turnOnFan();
      } else if (response == "FAN_OFF" && fanStatus) {
        fanStatus = false;
        turnOffFan();
      } else if (response == "APP_HIGH") {
        currentAppBtnState = HIGH;
      } else if (response == "APP_LOW") {
        currentAppBtnState = LOW;
      }
    } else {
      Serial.println("Lỗi gửi dữ liệu tới server");
    }
    http.end();
  }
}

void sendFanModeToServer() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(String(serverUrl) + "/node/set-fan-mode");
    http.addHeader("Content-Type", "application/json");

    String payload = "{\"fanMode\":\"" + String(fanMode ? "AUTO" : "MANUAL") + "\"}";

    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      Serial.print("📡 Gửi chế độ quạt: ");
      Serial.println(fanMode ? "AUTO" : "MANUAL");
    } else {
      Serial.print("❌ Lỗi gửi fanMode: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  }
}

/*========== Gateway ===========*/

void turnOnFan() {
  digitalWrite(RELAY_PIN, HIGH);
  fanStatus = true;
  fanStartTime = millis();
  Serial.println("Node has turned on FAN");
}

void turnOffFan() {
  digitalWrite(RELAY_PIN, LOW);
  fanStatus = false;
  Serial.println("Node has turned off FAN");
}

void sendTemperature() {
  sensors.requestTemperatures();
  temperature = sensors.getTempCByIndex(0);
  String msg = "TEMP:" + String(temperature, 1);
  LoRaSerial.println(msg);
}

void sendFanStatus() {
  String fanStatus = "";
  if (fanStatus) fanStatus = "ON";
  else fanStatus = "OFF";
    
  String msg = "FAN:" + fanStatus;
  LoRaSerial.println(msg);
}

void sendModeStatus() {
  String modeMsg = fanMode ? "MODE:AUTO" : "MODE:MANU";
  LoRaSerial.println(modeMsg);
}

void checkButton() {
  bool currentPhyBtnState = digitalRead(BUTTON_PIN);

  // Nếu LOW thì chuyển sang Manual mode
  if ((currentPhyBtnState == LOW && currentAppBtnState == LOW && fanMode == true) || (currentPhyBtnState == HIGH && currentAppBtnState == HIGH && fanMode == true)) {
    fanMode = false;
    // sendModeStatus();
    sendFanModeToServer();
  }
  // Nếu HIGH thì chuyển sang Auto mode
  else if ((currentPhyBtnState == HIGH && currentAppBtnState == LOW && fanMode == false) || (currentPhyBtnState == LOW && currentAppBtnState == HIGH && fanMode == false)) {
    fanMode = true;
    // sendModeStatus();
    sendFanModeToServer();
  }
}

void receiveLoRa() {
  while (LoRaSerial.available()) {
    String data = LoRaSerial.readStringUntil('\n');
    data.trim();
    Serial.println("LoRa received: " + data);

    if (data == "REQ") {
      Serial.println("Tempearture sent");
      sendTemperature();
      delay(100);
      Serial.println("Fan status sent");
      sendFanStatus();
      delay(100);
      Serial.println("Fan mode sent");
      sendModeStatus();
    }
    else if (data.startsWith("FAN:")) {
      if (fanMode) return;
      String command = data.substring(4);
      if (command == "ON") turnOnFan();
      else if (command == "OFF") turnOffFan();
    }
    else if (data.startsWith("TIME:")) {
      int minutes = data.substring(5).toInt();
      if (minutes > 0) {
        autoOffDuration = minutes * 60UL * 1000UL;
      }
    }
    else if (data.startsWith("THRESH:")) {
      tempThreshold = data.substring(7).toInt();
      Serial.print("Ngưỡng nhiệt độ mới: ");
      Serial.println(tempThreshold);
    }
  }
}

void updateLCD() {
  lcd.setCursor(0, 0);
  lcd.print("Nhiet do: ");
  lcd.print(temperature, 1);
  lcd.print("C   ");

  lcd.setCursor(0, 1);
  lcd.print("Quat: ");
  lcd.print(fanStatus ? "BAT " : "TAT ");
  lcd.print(" ");
  lcd.print(fanMode ? "AUTO " : "MANU ");
}

// Hàm kiểm tra trạng thái của relay
String dryerStatus() {
  int state = digitalRead(RELAY_PIN_DRYER);
  if (state == LOW) {
    return "ON";  // Relay đang BẬT (máy sấy đang chạy)
  } else {
    return "OFF"; // Relay đang TẮT (máy sấy dừng)
  }
}

void setup() {
  Serial.begin(9600);
  // LoRaSerial.begin(9600, SERIAL_8N1, 16, 17);

  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected!");

  Serial.println("Gateway sẵn sàng.");

  sensors.begin();
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  digitalWrite(RELAY_PIN, LOW);
  pinMode(RELAY_PIN_DRYER, OUTPUT);
  digitalWrite(RELAY_PIN_DRYER, HIGH);

  lcd.init();
  lcd.backlight();
  lcd.clear();
}

void loop() {
  // receiveLoRa();

  sensors.requestTemperatures();
  temperature = sensors.getTempCByIndex(0);

  // if (fanMode && temperature >= tempThreshold && !fanStatus) {
  //   turnOnFan();
  // }

  // if (fanMode && temperature < tempThreshold && fanStatus) {
  //   turnOffFan();
  // }

  // if (fanMode && fanStatus && millis() - fanStartTime >= autoOffDuration) {
  //   turnOffFan();
  // }

  unsigned long now = millis();
  if (now - lastSendTime >= sendInterval) {
    checkButton();

    // sendTemperature();
    sendStatusToServer(temperature);
    lastSendTime = now;
  }

  updateLCD();

  String status = dryerStatus();  // Gọi hàm để lấy trạng thái
  Serial.println("Trạng thái relay (máy sấy): " + status);
  delay(1000);
}
