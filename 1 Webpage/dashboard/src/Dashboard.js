import React, { useState, useEffect } from 'react';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import fetchSheetData from './api/googleSheets';
import './Dashboard.css'; // Link to your CSS layout file

// Register Chart.js modules
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [chartData, setChartData] = useState(null);
  const [prediction, setPrediction] = useState('');
  const [distance, setDistance] = useState(0.0);
  const [flowRate, setFlowRate] = useState(0.0);

  // ✅ Fetch ALL readings from Google Sheets for the chart
  const fetchData = async () => {
    const sheetData = await fetchSheetData();
    console.log("Raw sheet data:", sheetData); // Debug

    if (sheetData && sheetData.length) {
      // Filter valid rows
      const validRows = sheetData.filter(
        (item) =>
          item.length >= 2 &&
          !isNaN(parseFloat(item[0])) && // Distance
          !isNaN(parseFloat(item[1]))   // FlowRate
      );

      console.log("Filtered valid rows:", validRows);

      // X-axis as Reading numbers
      const labels = validRows.map((_, index) => `Reading ${index + 1}`);
      const distanceData = validRows.map((item) => parseFloat(item[0]));
      const flowrateData = validRows.map((item) => parseFloat(item[1]));

      const newChartData = {
        labels: labels,
        datasets: [
          {
            label: 'Distance (m)',
            data: distanceData,
            borderColor: 'rgb(13, 96, 220)', // Blue
            tension: 0.3,
          },
          {
            label: 'Flowrate (m³/s)',
            data: flowrateData,
            borderColor: 'rgb(254, 137, 4)', // Orange
            tension: 0.3,
          },
        ],
      };

      setChartData(newChartData);
    } else {
      console.log("No sheet data available.");
      setChartData(null);
    }
  };

  // Fetch prediction from backend
  const fetchPrediction = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/predict');
      const data = await response.json();
      console.log("Prediction:", data);
      setPrediction(data.Prediction);
      setDistance(data.Distance);
      setFlowRate(data.FlowRate);
    } catch (error) {
      console.error('Error fetching prediction:', error);
      setPrediction('Error fetching prediction');
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchData();
    fetchPrediction();
  }, []);

  // Manual refresh button
  const handleRefresh = () => {
    fetchData();
    fetchPrediction();
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center', marginTop: '20px' }}>Flood Prediction Dashboard</h2>

      <div className="dashboard-container">

        {/* Left side - Graph */}
        <div className="graph-container">
          {chartData ? <Line data={chartData} /> : <p>Loading data...</p>}
        </div>

        {/* Right side - Readings + Prediction */}
        <div className="content-container">

          {/* Latest Sensor Readings */}
          <div className="card">
            <h3>Latest Sensor Readings</h3>
            <p><strong>Distance:</strong> {distance} m</p>
            <p><strong>Flow Rate:</strong> {flowRate} m³/s</p>
            <button onClick={handleRefresh}>Refresh Data</button>
          </div>

          {/* Prediction Card */}
          <div className="card">
            <h3>Prediction</h3>
            {prediction ? (
              <p style={{
                fontWeight: 'bold',
                fontSize: '20px',
                color: prediction === 'Flood Risk' ? '#e63946' : '#2a9d8f'
              }}>
                {prediction === 'Flood Risk' ? '⚠️ ' : '✅ '} {prediction}
              </p>
            ) : (
              <p>Loading prediction...</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
