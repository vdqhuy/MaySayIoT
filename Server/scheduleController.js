const schedule = require("node-schedule");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

const { setFanStatusManual } = require("./fanState");
const { setHeaterStatus } = require("./heaterState");

dayjs.extend(utc);
dayjs.extend(timezone);

const schedules = [];

function setFanSchedule(req, res) {
  const { time, action } = req.body;

  if (!time || !["ON", "OFF"].includes(action)) {
    return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
  }

  const [hour, minute] = time.split(":").map(Number);
  const nowVN = dayjs().tz("Asia/Ho_Chi_Minh");
  let targetTime = nowVN.hour(hour).minute(minute).second(0);

  if (targetTime.isBefore(nowVN)) {
    targetTime = targetTime.add(1, "day");
  }

  const realDate = targetTime.toDate();
  // console.log("⏰ Lịch hẹn giờ quạt:", realDate);

  const job = schedule.scheduleJob(realDate, () => {
    const newStatus = action === "ON";
    setFanStatusManual(newStatus); // ✅ cập nhật từ file state riêng
    console.log(`🕒 Hành động: Quạt ${action} lúc ${time}`);
  });

  schedules.push({ time, action, job });

  return res.json({ message: `✅ Đã đặt lịch quạt ${action} lúc ${time} (giờ VN)` });
}

function setFanScheduleUntil(req, res) {
  const { time, action } = req.body;

  if (!time || !["ON", "OFF"].includes(action)) {
    return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
  }

  const [hour, minute] = time.split(":").map(Number);
  const nowVN = dayjs().tz("Asia/Ho_Chi_Minh");
  let targetTime = nowVN.hour(hour).minute(minute).second(0);

  if (targetTime.isBefore(nowVN)) {
    targetTime = targetTime.add(1, "day");
  }

  const realDate = targetTime.toDate();
  // console.log("⏰ Lịch hẹn giờ quạt:", realDate);

  const newStatus = action === "ON";
  setFanStatusManual(newStatus);

  const job = schedule.scheduleJob(realDate, () => {
    const newAction = action === "ON" ? "OFF" : "ON";
    
    setFanStatusManual(!newStatus); // ✅ cập nhật từ file state riêng
    console.log(`⏳ Hành động: Quạt ${newAction} lúc ${time}`);
  });

  schedules.push({ time, action, job });

  return res.json({ message: `✅ Đã đặt lịch quạt ${action} cho tới lúc ${time} (giờ VN)` });
}

function setHeaterScheduleUntil(req, res) {
  const { time, action } = req.body;

  if (!time || !["ON", "OFF"].includes(action)) {
    return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
  }

  const [hour, minute] = time.split(":").map(Number);
  const nowVN = dayjs().tz("Asia/Ho_Chi_Minh");
  let targetTime = nowVN.hour(hour).minute(minute).second(0);

  if (targetTime.isBefore(nowVN)) {
    targetTime = targetTime.add(1, "day");
  }

  const realDate = targetTime.toDate();
  const newStatus = action === "ON";
  setHeaterStatus(newStatus);

  const job = schedule.scheduleJob(realDate, () => {
    const newAction = action === "ON" ? "OFF" : "ON";
    setHeaterStatus(!newStatus);
    console.log(`⏳ Hành động: Lò ${newAction} lúc ${time}`);
  });

  schedules.push({ time, action, job });

  return res.json({ message: `✅ Đã đặt lịch lò ${action} cho tới lúc ${time} (giờ VN)` });
}

module.exports = { setFanSchedule, setFanScheduleUntil, setHeaterScheduleUntil };
