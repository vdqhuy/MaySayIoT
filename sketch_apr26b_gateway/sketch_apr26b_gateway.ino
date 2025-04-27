#include <WiFi.h>
#include <FirebaseESP32.h>
#include "LoRa_E32.h"

// Firebase config
#define FIREBASE_HOST "maysay-6221e-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "s1nnZOt8dKppKu3AWaBk8einp5bps9wPU9XUODKM"

// WiFi credentials
char ssid[] = "Hanh L3";
char pass[] = "antrongnoingoicoitivi";

// Firebase and LoRa
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

HardwareSerial LoRaSerial(2);
LoRa_E32 e32ttl(&LoRaSerial);


unsigned long lastRequestMillis = 0;
unsigned long lastFirebaseMillis = 0;

float currentTemp = -1000;
float threshold = 34.0;
bool fanStatus = false;         // Current fan status

void checkAndUpdateFan() {
  if (Firebase.getBool(fbdo, "/fan")) {
    bool desiredFanStatus = fbdo.boolData();
    if (desiredFanStatus != fanStatus) {    
      fanStatus = desiredFanStatus;
      String cmd = fanStatus ? "FAN:ON" : "FAN:OFF";
      e32ttl.sendMessage(cmd);
      Serial.println("Gửi lệnh điều khiển quạt: " + cmd);
    }
  }
}

void checkAndUpdateFanByTemp() {
  if (currentTemp >= threshold && !fanStatus) {
    fanStatus = true;
    Firebase.setBool(fbdo, "/fan", true);
    Serial.println("Tự động bật quạt (theo ngưỡng mới)");
  } else if (currentTemp < threshold && fanStatus) {
    fanStatus = false;
    Firebase.setBool(fbdo, "/fan", false);
    Serial.println("Tự động tắt quạt (theo ngưỡng mới)");
  }
}

void handleLoRaResponse() {
  ResponseContainer rs = e32ttl.receiveMessage();
  String data = rs.data;
  data.trim();
  Serial.println("Nhận LoRa: " + data);

  if (data.startsWith("TEMP:")) {
    float temp = data.substring(5).toFloat();
    Serial.println("Nhiệt độ: " + String(temp));
    Firebase.setFloat(fbdo, "/temperature", temp);

    currentTemp = temp;
    // Kiểm tra nhiệt độ với threshold ngay khi có nhiệt độ mới
    checkAndUpdateFanByTemp();
  }
}


void setup() {
  Serial.begin(9600);
  LoRaSerial.begin(9600, SERIAL_8N1, 16, 17); // TX=17, RX=16
  e32ttl.begin();

  WiFi.begin(ssid, pass);
  Serial.print("Kết nối WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" OK");

  // Firebase
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  config.database_url = FIREBASE_HOST;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Gateway sẵn sàng.");
}

void loop() {
  unsigned long now = millis();

  // Gửi yêu cầu lấy nhiệt độ mỗi 5 giây
  // if (now - lastRequestMillis > 5000) {
  //   lastRequestMillis = now;
  //   e32ttl.sendMessage("REQ");
  // }

  // Đọc trạng thái quạt từ Firebase mỗi 500ms
  // if (now - lastFirebaseMillis > 500) {
  //   lastFirebaseMillis = now;
  //   checkAndUpdateFan();
  // }

  // Nhận dữ liệu từ Node
  if (e32ttl.available() > 1) {
    handleLoRaResponse();
  }

  if (currentTemp == -1000) {
    Serial.println("Chưa có nhiệt độ, gửi yêu cầu REQ đến Node");
    e32ttl.sendMessage("REQ");
    delay(10000);
  }

  // // Theo dõi threshold thay đổi từ Firebase mỗi 500ms
  // static unsigned long lastThresholdCheck = 0;
  // if (now - lastThresholdCheck > 500) {
  //   lastThresholdCheck = now;

  //   if (Firebase.getFloat(fbdo, "/threshold")) {
  //     float newThreshold = fbdo.floatData();
  //     if (newThreshold != threshold) { // Nếu threshold thay đổi
  //       Serial.println("Threshold mới: " + String(newThreshold));
  //       threshold = newThreshold;

  //       // Gửi ngưỡng mới xuống Node
  //       String thresholdMsg = "THRESHOLD:" + String(threshold);
  //       e32ttl.sendMessage(thresholdMsg);
  //       Serial.println("Đã gửi ngưỡng nhiệt độ mới: " + thresholdMsg);
  //     }
  //   } else {
  //     Serial.println("Không đọc được threshold từ Firebase!");
  //   }

  //   // Kiểm tra lại nhiệt độ với threshold mới
  //   checkAndUpdateFanByTemp();
  // }
}
