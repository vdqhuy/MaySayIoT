#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "LoRa_E32.h"

#define ONE_WIRE_BUS 4
#define RELAY_PIN 26

LiquidCrystal_I2C lcd(0x27, 16, 2);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

HardwareSerial LoRaSerial(2);
LoRa_E32 e32ttl(&LoRaSerial);

float temperature = 0.0;
float latestTemperature = -1000.0; // Giá trị ban đầu rất nhỏ để chắc chắn sẽ gửi lần đầu
bool fanIsOn = false;
int tempThreshold = 34; // Ngưỡng mặc định

unsigned long lastSendMillis = 0;
const unsigned long sendInterval = 5000; // Gửi mỗi 5 giây

void turnOnFan() {
  digitalWrite(RELAY_PIN, HIGH);
  fanIsOn = true;
}

void turnOffFan() {
  digitalWrite(RELAY_PIN, LOW);
  fanIsOn = false;
}

void receiveLoRa() {
  Serial.println(e32ttl.available());
  if (e32ttl.available() > 1) {
    ResponseContainer rs = e32ttl.receiveMessage();
    String data = rs.data;
    data.trim();
    Serial.println("LoRa received: " + data);

    if (data.startsWith("FAN:")) {
      String command = data.substring(4);
      if (command == "ON") {
        turnOnFan();
      } else if (command == "OFF") {
        turnOffFan();
      }
    }
    else if (data == "REQ") {
      String msg = "TEMP:" + String(temperature, 1);
      e32ttl.sendMessage(msg);
      Serial.println("Đã gửi yêu cầu REQ, nhiệt độ là: " + msg);
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
  lcd.print(fanIsOn ? "BAT " : "TAT ");
}

void setup() {
  Serial.begin(9600);
  LoRaSerial.begin(9600, SERIAL_8N1, 16, 17); // TX=17, RX=16
  e32ttl.begin();

  sensors.begin();
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  lcd.init();
  lcd.backlight();
  lcd.clear();
}

void loop() {
  unsigned long now = millis();

  // Mỗi 5 giây đo và nếu thay đổi thì gửi
  if (now - lastSendMillis > sendInterval) {
    lastSendMillis = now;

    receiveLoRa(); // Nhận yêu cầu từ Gateway nếu có
    
    sensors.requestTemperatures();
    temperature = sensors.getTempCByIndex(0);

    if (temperature != latestTemperature) {  // So sánh nhiệt độ mới với nhiệt độ cũ
      latestTemperature = temperature;       // Cập nhật lại nhiệt độ cũ
      String msg = "TEMP:" + String(temperature, 1);
      e32ttl.sendMessage(msg);
      Serial.println("Đã gửi nhiệt độ: " + msg);
    } else {
      Serial.println("Nhiệt độ không đổi, không gửi.");
    }
  }

  // Bật/tắt quạt tự động dựa vào ngưỡng
  if (temperature >= tempThreshold && !fanIsOn) {
    turnOnFan();
  }
  else if (temperature < tempThreshold && fanIsOn) {
    turnOffFan();
  }

  updateLCD();
}
