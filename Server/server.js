const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const { setFanSchedule, setFanScheduleUntil, setHeaterScheduleUntil } = require('./scheduleController');
const {
  setFanStatusManual,
  getFanStatusManual
} = require('./fanState'); // ✅ sử dụng từ file state riêng
const { setHeaterStatus, getHeaterStatus } = require('./heaterState');

const port = 3000;

let currentTemp = 0;
let currentHeaterStatus = false;
let currentHeaterStatusApp = false;
let currentFanStatus = false;
let currentFanMode = false;
let tempThreshold = 60; // Default
let currentAppBtnState = false; // Default

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/update-status', (req, res) => {
  currentTemp = req.body.temperature;
  currentHeaterStatus = req.body.heaterStatus == "ON" ? true : false;
  currentHeaterStatusApp = req.body.heaterStatusApp == "ON" ? true : false;
  currentFanStatus = req.body.fanStatus == "ON" ? true : false;
  currentFanMode = req.body.fanMode == "AUTO" ? true : false;
  const appBtnStateOnNode = req.body.currentAppBtnState == 1 ? true : false;

  let actions = [];

  // Đồng bộ trạng thái app button
  if (currentAppBtnState != appBtnStateOnNode) {
    const vip_action = currentAppBtnState ? "APP_HIGH" : "APP_LOW";
    console.log(`⚡ Hành động VIP: ${vip_action}`);
    actions.push(vip_action);
  }

  // Heater logic
  if (getHeaterStatus()) {
    if (!currentHeaterStatus) {
      actions.push("HEATER_ON");
      currentHeaterStatus = true;
    }
  } else {
    if (currentHeaterStatus) {
      actions.push("HEATER_OFF");
      currentHeaterStatus = false;
    }
  }

  // Fan logic
  if (currentFanMode) {
    if (currentTemp >= tempThreshold && !currentFanStatus) {
      actions.push("FAN_ON");
      currentFanStatus = true;
    } else if (currentTemp < tempThreshold && currentFanStatus) {
      actions.push("FAN_OFF");
      currentFanStatus = false;
    }
  } else {
    if (getFanStatusManual() && !currentFanStatus) {
      actions.push("FAN_ON");
      currentFanStatus = true;
    } else if (!getFanStatusManual() && currentFanStatus) {
      actions.push("FAN_OFF");
      currentFanStatus = false;
    }
  }

  // Gửi tất cả các hành động
  if (actions.length === 0) {
    console.log("⚡ Hành động: NO_ACTION");
    actions.push("NO_ACTION");
  } else {
    console.log("⚡ Các hành động:", actions);
  }

  res.json({ actions });
});

// API Web giao diện gọi lấy trạng thái
app.get('/status', (req, res) => {
  res.json({
    temperature: currentTemp,
    heaterStatus: currentHeaterStatus ? "ON" : "OFF",
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
  if (currentFanMode) {
    return res.status(400).json({ message: "Chế độ quạt không phải MANUAL" });
  }

  const newManualStatus = req.body.fanStatus === "ON";
  setFanStatusManual(newManualStatus);
  console.log("🔁 Trạng thái quạt mới (MANUAL):", newManualStatus);

  res.json({
    message: "Fan status updated!",
    fanStatus: newManualStatus ? "ON" : "OFF"
  });
});

// API bật tắt lò
app.post('/set-heater-status', (req, res) => {
  const newHeaterStatus = req.body.heaterStatus === "ON";
  setHeaterStatus(newHeaterStatus);
  console.log("🔁 Trạng thái lò mới:", newHeaterStatus);

  res.json({
    message: "Heater status updated!",
    heaterStatus: newHeaterStatus ? "ON" : "OFF"
  });
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

// API dành riêng cho node (không có nút app)
app.post('/node/set-fan-mode', (req, res) => {
  const requestedMode = req.body.fanMode === "AUTO" ? true : false;
  currentFanMode = requestedMode;

  console.log("🔄 [Node] Chế độ quạt đã chuyển sang:", currentFanMode ? "AUTO" : "MANUAL");

  res.json({
    message: "Fan mode updated!",
    fanMode: currentFanMode ? "AUTO" : "MANUAL"
  });
});

app.post('/node/set-heater-status', (req, res) => {
  const requestMode = req.body.heaterStatus === "ON" ? true : false;
  currentHeaterStatus = requestMode;

  console.log("🔄 [Node] Trạng thái lò đã chuyển sang:", currentHeaterStatus ? "ON" : "OFF");

  res.json({
    message: "Heater status updated!",
    heaterStatus: currentHeaterStatus ? "ON" : "OFF"
  });
});

// API đặt lịch
app.post('/set-fan-schedule', setFanSchedule);

// API đặt lịch 2.0
app.post('/set-fan-schedule-until', setFanScheduleUntil);

// API đặt lịch cho lò
app.post('/set-heater-schedule-until', setHeaterScheduleUntil);

// Bắt đầu server
app.listen(port, () => {
  console.log(`🚀 Server chạy ở http://localhost:${port}`);
});
