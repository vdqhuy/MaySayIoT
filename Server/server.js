const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');

const port = 3000;

let currentTemp = 0;
let currentFanStatus = false;
let currentFanMode = false;
let tempThreshold = 60; // Default
let fanStatusManual = false; // Default
let currentAppBtnState = false; // Default

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Gateway gửi nhiệt độ vào
app.post('/update-status', (req, res) => {
  currentTemp = req.body.temperature;
  currentFanStatus = req.body.fanStatus == "ON" ? true : false;
  currentFanMode = req.body.fanMode == "AUTO" ? true : false;
  console.log("🔥 Nhiệt độ nhận được:", currentTemp);
  console.log("Trạng thái quạt hiện tại:", currentFanStatus);
  console.log("Chế độ quạt hiện tại:", currentFanMode);
  const appBtnStateOnNode = req.body.currentAppBtnState == 1 ? true : false;
  console.log("Trạng thái nút app trên Node:", appBtnStateOnNode);
  console.log("Trạng thái nút app trên Web:", currentAppBtnState);

  let action = "NO_ACTION";

  if (currentAppBtnState != appBtnStateOnNode) {
    action = currentAppBtnState ? "APP_HIGH" : "APP_LOW";
  } else if (currentFanMode) {
      if (currentTemp >= tempThreshold && !currentFanStatus) {
          currentFanStatus = true;
          action = "FAN_ON";
      } else if (currentTemp < tempThreshold && currentFanStatus) {
          currentFanStatus = false;
          action = "FAN_OFF";
      }
  } else {
    if (fanStatusManual) {
      currentFanStatus = true;
      action = "FAN_ON";
    }
    else {
      currentFanStatus = false;
      action = "FAN_OFF";
    }
  }

  console.log(`⚡ Hành động: ${action}`);
  res.send(action);
});

// API Web giao diện gọi lấy trạng thái
app.get('/status', (req, res) => {
  res.json({
    temperature: currentTemp,
    fanStatus: currentFanStatus ? "ON" : "OFF",
    threshold: tempThreshold,
    fanMode: currentFanMode ? "AUTO" : "MANUAL"
  });
});

// API chỉnh ngưỡng nhiệt độ
app.post('/set-threshold', (req, res) => {
  tempThreshold = req.body.threshold;
  console.log("🎯 Ngưỡng nhiệt độ mới:", tempThreshold);
  res.json({ message: "Threshold updated!", threshold: tempThreshold });
});

// API chỉnh quạt khi ở chế độ MANUAL
app.post('/set-fan-status', (req, res) => {
  if (currentFanMode) return res.status(400).json({ message: "Chế độ quạt không phải MANUAL" });
  fanStatusManual = req.body.fanStatus == "ON" ? true : false;
  console.log("🔁 Trạng thái quạt mới:", fanStatusManual);
  res.json({ message: "Fan status updated!", fanStatus: fanStatusManual ? "ON" : "OFF" });
});

// API bật tắt chế độ quạt (AUTO/MANUAL)
app.post('/set-fan-mode', (req, res) => {
  const requestedMode = req.body.fanMode === "AUTO" ? true : false;
  currentFanMode = requestedMode;
  currentAppBtnState = req.body.appBtnState;

  console.log("🔄 Chế độ quạt đã chuyển sang:", currentFanMode ? "AUTO" : "MANUAL");
  console.log("🔄 Trạng thái nút ứng dụng:", currentAppBtnState ? "HIGH" : "LOW");

  res.send(currentAppBtnState);
});

// API bật tắt chế độ quạt (AUTO/MANUAL)
app.post('/node/set-fan-mode', (req, res) => {
  const requestedMode = req.body.fanMode === "AUTO" ? true : false;
  currentFanMode = requestedMode;

  console.log("🔄 Chế độ quạt đã chuyển sang:", currentFanMode ? "AUTO" : "MANUAL");
  console.log("🔄 Trạng thái nút ứng dụng:", currentAppBtnState ? "HIGH" : "LOW");
 
  res.json({
    message: "Fan mode updated!",
    fanMode: currentFanMode ? "AUTO" : "MANUAL"
  });
});

app.listen(port, () => {
  console.log(`🚀 Server chạy ở http://localhost:${port}`);
});
