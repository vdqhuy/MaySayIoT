import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL;

export const fetchStatus = async () => {
  const res = await axios.get(`${API_URL}/status`);
  return res.data;
};

export const updateThreshold = async (threshold) => {
  const res = await axios.post(`${API_URL}/set-threshold`, { threshold });
  return res.data;
};

export const updateFanStatus = async (fanStatus) => {
    const res = await axios.post(`${API_URL}/set-fan-status`, { fanStatus });
    return res.data;
};

export const updateFanMode = async (mode, appBtnState) => {
    const res = await axios.post(`${API_URL}/set-fan-mode`, { 
        fanMode: mode,
        appBtnState: appBtnState
     });
    return res.data;
};

export const setFanSchedule = async (scheduleTime, scheduleAction) => {
  const res = await axios.post(`${API_URL}/set-fan-schedule`, { 
      time: scheduleTime,
      action: scheduleAction
   });
  return res.data;
};  