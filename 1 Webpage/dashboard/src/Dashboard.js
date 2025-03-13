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
            label: 'Distance (cm)',
            data: distanceData,
            borderColor: '#4dabf7', // Light blue for better visibility
            tension: 0.3,
          },
          {
            label: 'Flowrate (L/min)',
            data: flowrateData,
            borderColor: '#ffa94d', // Light orange for better visibility
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

  // ✅ Chart.js options for dark mode with vertical lines removed
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#E0E0E0', // Legend text color
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#E0E0E0' // X-axis label color
        },
        grid: {
          display: false // ❌ Removes vertical grid lines
        }
      },
      y: {
        ticks: {
          color: '#E0E0E0' // Y-axis label color
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)' // ✅ Light white horizontal grid lines
        }
      }
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
      <h2 style={{ textAlign: 'center', marginTop: '20px', color: '#FFFFFF' }}>DANIEL WAVAMUNNO | S23B23/091</h2>

      <div className="dashboard-container">

        {/* Left side - Graph */}
        <div className="graph-container">
          <h2 style={{ textAlign: 'center', marginTop: '20px', color: '#FFFFFF' }}>Chart Visualization</h2>
          {chartData ? <Line data={chartData} options={chartOptions} /> : <p style={{ color: '#E0E0E0' }}>Loading data...</p>}
        </div>

        {/* Right side - Readings + Prediction */}
        <div className="content-container">
          <h2 style={{ textAlign: 'center', marginTop: '20px', color: '#FFFFFF' }}>Readings & Prediction</h2>
          {/* Latest Sensor Readings */}
          <div className="card">
            <h3>Latest Sensor Readings</h3>
            <p><strong>Distance:</strong> {distance} cm</p>
            <p><strong>Flow Rate:</strong> {flowRate} L/min</p>
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

      {/* Footer Section */}
      <footer className="footer">
        <div className="footer-links">
          <a href="https://github.com/your-repo-link" target="_blank" rel="noopener noreferrer">GitHub-Code</a>
          <a href="https://your-documentation-link" target="_blank" rel="noopener noreferrer">Documentation</a>
          <a href="https://your-poster-link" target="_blank" rel="noopener noreferrer">Research-Poster</a>
          <a href="https://your-documentation-link" target="_blank" rel="noopener noreferrer">Documentation</a>
          <a href="https://your-documentation-link" target="_blank" rel="noopener noreferrer">Documentation</a>
          <a href="https://your-documentation-link" target="_blank" rel="noopener noreferrer">Documentation</a>
          <a href="https://your-documentation-link" target="_blank" rel="noopener noreferrer">Documentation</a>
        </div>
        <div className="footer-copy">
          © 2025 Floods in Uganda [Simulation of River Manafwa]. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
