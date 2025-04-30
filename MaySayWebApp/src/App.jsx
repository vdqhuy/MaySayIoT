import { useEffect, useState } from 'react';
import { fetchStatus, updateThreshold, updateFanStatus, updateFanMode } from './api';
import './App.css';

function App() {
  const [temperature, setTemperature] = useState(0);
  const [fanStatus, setFanStatus] = useState("OFF");
  const [threshold, setThreshold] = useState(60);
  const [fanMode, setFanMode] = useState("AUTO");
  const [appBtnState, setAppBtnState] = useState(false);
  const [newThreshold, setNewThreshold] = useState("");
  const [isSwitchDisabled, setIsSwitchDisabled] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

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
      // ⏱️ Mở khóa lại sau 7 giây
      setTimeout(() => {
        setIsSwitchDisabled(false);
        setIsButtonDisabled(false);
      }, 7000);
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
      }, 7000);
    }
  };  

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>🔥 IoT Fan Dashboard</h1>
      <p>Nhiệt độ hiện tại: <strong>{temperature}°C</strong></p>
      <p>Trạng thái quạt: <strong style={{ color: fanStatus === "ON" ? "green" : "gray" }}>{fanStatus}</strong></p>
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
          checked={fanMode === "MANUAL" && fanStatus === "ON"}
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

      <p>Ngưỡng hiện tại: <strong>{threshold}°C</strong></p>

      <input
        type="number"
        value={newThreshold}
        onChange={(e) => setNewThreshold(e.target.value)}
        placeholder="Nhập ngưỡng mới"
      />
      <button onClick={handleUpdateThreshold} style={{ marginLeft: '1rem' }}>Cập nhật</button>
    </div>
  );
}

export default App;
