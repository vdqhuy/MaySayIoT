#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 4
#define RELAY_PIN 26
#define BUTTON_PIN 25

LiquidCrystal_I2C lcd(0x27, 16, 2);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

HardwareSerial LoRaSerial(2);

float temperature = 0.0;
bool fanIsOn = false;
bool manualMode = false;
int tempThreshold = 30;
unsigned long fanStartTime = 0;
unsigned long autoOffDuration = 30UL * 60UL * 1000UL;
unsigned long lastButtonPress = 0;
bool lastButtonState = HIGH;

unsigned long lastSendTime = 0;
const unsigned long sendInterval = 5000; // gửi nhiệt độ mỗi 5 giây

void turnOnFan() {
  digitalWrite(RELAY_PIN, HIGH);
  fanIsOn = true;
  fanStartTime = millis();
  Serial.println("Node has turned on FAN");
}

void turnOffFan() {
  digitalWrite(RELAY_PIN, LOW);
  fanIsOn = false;
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
  if (fanIsOn) fanStatus = "ON";
  else fanStatus = "OFF";
    
  String msg = "FAN:" + fanStatus;
  LoRaSerial.println(msg);
}

void sendModeStatus() {
  String modeMsg = manualMode ? "MODE:MANU" : "MODE:AUTO";
  LoRaSerial.println(modeMsg);
}

void checkButton() {
  bool currentState = digitalRead(BUTTON_PIN);
  if (currentState == LOW && lastButtonState == HIGH && millis() - lastButtonPress > 500) {
    manualMode = !manualMode;
    sendModeStatus();
    lastButtonPress = millis();
  }
  lastButtonState = currentState;
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
      if (!manualMode) return;
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
  lcd.print(fanIsOn ? "BAT " : "TAT ");
  lcd.print(" ");
  lcd.print(manualMode ? "MANU " : "AUTO ");
}

void setup() {
  Serial.begin(9600);
  LoRaSerial.begin(9600, SERIAL_8N1, 16, 17);

  sensors.begin();
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  digitalWrite(RELAY_PIN, LOW);

  lcd.init();
  lcd.backlight();
  lcd.clear();
}

void loop() {
  receiveLoRa();
  checkButton();

  sensors.requestTemperatures();
  temperature = sensors.getTempCByIndex(0);

  // if (!manualMode && temperature >= tempThreshold && !fanIsOn) {
  //   turnOnFan();
  // }

  // if (!manualMode && temperature < tempThreshold && fanIsOn) {
  //   turnOffFan();
  // }

  // if (!manualMode && fanIsOn && millis() - fanStartTime >= autoOffDuration) {
  //   turnOffFan();
  // }

  // unsigned long now = millis();
  // if (now - lastSendTime >= sendInterval) {
  //   sendTemperature();
  //   lastSendTime = now;
  // }

  updateLCD();
}
