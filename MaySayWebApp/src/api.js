import axios from 'axios'

export const fetchStatus = async () => {
  const res = await axios.get('/status');
  return res.data;
};

export const updateThreshold = async (threshold) => {
  const res = await axios.post('/set-threshold', { threshold });
  return res.data;
};

export const updateFanStatus = async (fanStatus) => {
    const res = await axios.post('/set-fan-status', { fanStatus });
    return res.data;
};

export const updateFanMode = async (mode, appBtnState) => {
    const res = await axios.post('/set-fan-mode', { 
        fanMode: mode,
        appBtnState: appBtnState
     });
    return res.data;
};  