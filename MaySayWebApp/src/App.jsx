import { useEffect, useState } from 'react';
import { fetchStatus, updateThreshold, updateFanStatus, updateFanMode, setFanSchedule, setFanScheduleUntil } from './api';
import './App.css';
import TemperatureGauge from './TemperatureGauge';

function App() {
  const [temperature, setTemperature] = useState(0);
  const [fanStatus, setFanStatus] = useState("OFF");
  const [threshold, setThreshold] = useState(60);
  const [fanMode, setFanMode] = useState("AUTO");
  const [appBtnState, setAppBtnState] = useState(false);
  const [newThreshold, setNewThreshold] = useState("");
  const [isSwitchDisabled, setIsSwitchDisabled] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState(""); // hh:mm
  const [scheduleAction, setScheduleAction] = useState("ON"); // "ON" or "OFF"
  const [scheduleEndTime, setScheduleEndTime] = useState(""); // hh:mm


  const loadStatus = async () => {
    try {
      const data = await fetchStatus();
      setTemperature(data.temperature);
      setFanStatus(data.fanStatus);
      setThreshold(data.threshold);
      setFanMode(data.fanMode);
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    }
  };

  const handleUpdateThreshold = async () => {
    try {
      const res = await updateThreshold(Number(newThreshold));
      alert(res.message);
      loadStatus();
    } catch (error) {
      console.error("Lỗi khi cập nhật ngưỡng:", error);
    }
  };

  const handleManualFanToggle = async () => {
    if (fanMode !== "MANUAL" || (isSwitchDisabled && isButtonDisabled)) return;
    
    setIsSwitchDisabled(true); // ⛔ khóa switch
    setIsButtonDisabled(true); // ⛔ khóa nút chế độ quạt
  
    const nextStatus = fanStatus === "ON" ? "OFF" : "ON";
  
    try {
      const result = await updateFanStatus(nextStatus);
      console.log("🔁 Fan status updated:", result);
      setFanStatus(nextStatus);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật trạng thái quạt:", err);
      alert("Không thể cập nhật trạng thái quạt.");
    } finally {
      // ⏱️ Mở khóa lại sau 5 giây
      setTimeout(() => {
        setIsSwitchDisabled(false);
        setIsButtonDisabled(false);
      }, 5000);
    }
  };

  const handleToggleFanMode = async () => {
    if (isSwitchDisabled && isButtonDisabled) return;
    
    setIsSwitchDisabled(true); // ⛔ khóa switch
    setIsButtonDisabled(true); // ⛔ khóa nút chế độ quạt

    const nextMode = fanMode === "AUTO" ? "MANUAL" : "AUTO";
    try {
      const result = await updateFanMode(nextMode, !appBtnState);
      console.log("🔁 Fan mode updated:", result);
      setFanMode(nextMode);
      setAppBtnState(!appBtnState);
    } catch (error) {
      console.error("Lỗi khi đổi chế độ quạt:", error);
      alert("Không thể đổi chế độ quạt.");
    } finally {
      // ⏱️ Mở khóa lại sau 7 giây
      setTimeout(() => {
        setIsSwitchDisabled(false);
        setIsButtonDisabled(false);
      }, 10000);
    }
  };

  const handleSetSchedule = async () => {
    if (!scheduleTime) {
      alert("Vui lòng chọn thời gian!");
      return;
    }
  
    try {
      // Gọi API để gửi lệnh đặt lịch hẹn
      const result = await setFanSchedule(scheduleTime, scheduleAction)
      console.log("Đặt lịch thành công:", result);
      alert(result.message || "Đặt lịch thành công!");
    } catch (error) {
      console.error("Lỗi khi đặt lịch:", error);
      alert("Không thể đặt lịch. Vui lòng thử lại.");
    }
  };

  const handleSetScheduleUntil = async () => {
    if (!scheduleEndTime) {
      alert("Vui lòng chọn thời gian bắt đầu và kết thúc!");
      return;
    }
  
    try {
      const result = await setFanScheduleUntil(scheduleEndTime, scheduleAction);
      alert(result.message || "Đặt lịch thành công!");
    } catch (error) {
      console.error("Lỗi khi đặt lịch:", error);
      alert("Không thể đặt lịch. Vui lòng thử lại.");
    }
  };
  

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>🔥 IoT MaySay Dashboard</h1>
      <TemperatureGauge temperature={temperature} maxTemp={100} />
      <p>Nhiệt độ hiện tại: <strong>{temperature}°C</strong></p>
      <p>Trạng thái quạt: <strong style={{ color: fanStatus === "ON" ? "#4CAF50" : "gray" }}>{fanStatus}</strong></p>
      <div style={{ marginTop: "2rem", borderTop: "1px solid #ccc", paddingTop: "1rem" }}>
        <p>
          Chế độ quạt:{" "}
          <button
            disabled={isButtonDisabled}
            onClick={handleToggleFanMode}
            className={`mode-button ${fanMode.toLowerCase()}`}
          >
            {fanMode}
          </button>
        </p>


        <div style={{ marginTop: '1rem' }}>
          <label className="switch">
          <input
            type="checkbox"
            checked={fanStatus === "ON"}
            onChange={handleManualFanToggle}
            disabled={fanMode !== "MANUAL" || isSwitchDisabled}
          />
            <span
              className={`slider ${
                fanMode !== "MANUAL"
                  ? ""
                  : fanStatus === "ON"
                  ? "green"
                  : "red"
              }`}
            ></span>
          </label>
          <span style={{ marginLeft: "1rem" }}>
            {fanStatus === "ON" ? "Quạt đang bật" : "Quạt đang tắt"}
          </span>
        </div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 300}}>
        <h3>⏰ Hẹn giờ bật/tắt quạt</h3>
        <label>
          Chọn thời gian:
          <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
        </label>

        <label style={{ marginTop: '1rem' }}>
          Hành động:
          <select value={scheduleAction} onChange={(e) => setScheduleAction(e.target.value)}>
            <option value="ON">Bật</option>
            <option value="OFF">Tắt</option>
          </select>
        </label>
        <button 
          className='gen-button'
          disabled={fanMode !== "MANUAL" || isButtonDisabled}
          onClick={handleSetSchedule} style={{ marginTop: "1rem" }}>
          Đặt lịch
        </button>

        <h3>⏳ Hẹn giờ bật/tắt quạt cho tới khi</h3>
        <label>
          Thời gian kết thúc:
          <input type="time" value={scheduleEndTime} onChange={(e) => setScheduleEndTime(e.target.value)} />
        </label>
        <label>
          Hành động:
          <select value={scheduleAction} onChange={(e) => setScheduleAction(e.target.value)}>
            <option value="ON">Bật</option>
            <option value="OFF">Tắt</option>
          </select>
        </label>
        <button onClick={handleSetScheduleUntil}>Đặt lịch</button>
      </div>

      <div style={{ marginTop: "2rem", borderTop: "1px solid #ccc", paddingTop: "1rem" }}>
        <p>Ngưỡng hiện tại: <strong>{threshold}°C</strong></p>

        <input
          type="number"
          value={newThreshold}
          onChange={(e) => setNewThreshold(e.target.value)}
          placeholder="Nhập ngưỡng mới"
        />
        <button onClick={handleUpdateThreshold} style={{ marginLeft: '1rem' }}>Cập nhật</button>
      </div>
    </div>
  );
}

export default App;
