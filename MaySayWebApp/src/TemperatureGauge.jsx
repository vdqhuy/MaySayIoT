import React, { useRef, useEffect } from 'react';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import './App.css';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

const TemperatureGauge = ({ temperature, maxTemp = 100 }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');

    if (chartRef.current) chartRef.current.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 300, 0); // Gradient ngang
    gradient.addColorStop(0, '#ff0');    // Vàng (nhiệt độ thấp)
    gradient.addColorStop(0.5, '#ff8c00'); // Cam (nhiệt độ trung bình)
    gradient.addColorStop(1, '#f00');    // Đỏ (nhiệt độ cao)

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [temperature, maxTemp - temperature],
            backgroundColor: [gradient, '#e0e0e0'], // Áp dụng gradient cho phần nhiệt độ
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        rotation: -90,
        circumference: 180,
        cutout: '70%',
        animation: {
          duration: 0, // Tắt hiệu ứng animation
        },
        plugins: {
          tooltip: { enabled: false },
          legend: { display: false },
        },
      },
    });


    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [temperature, maxTemp]);

  return (
    <div className="gauge-wrapper">
      <div className="gauge-container">
        <canvas ref={canvasRef}></canvas>
        <div className="gauge-value">{temperature}°C</div>
      </div>
    </div>
  );
};

export default TemperatureGauge;
