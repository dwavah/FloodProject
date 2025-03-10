import React, { useState, useEffect } from 'react';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import fetchSheetData from './api/googleSheets';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard() {
  const [chartData, setChartData] = useState(null);
  const [prediction, setPrediction] = useState(null); // To store the prediction result

  // Fetch data from Google Sheets
  const fetchData = async () => {
    const sheetData = await fetchSheetData();

    if (sheetData.length) {
      const labels = sheetData.map((item) => item[0]); // Date (First column)
      const distanceData = sheetData.map((item) => parseFloat(item[1])); // Distance (Second column)
      const flowrateData = sheetData.map((item) => parseFloat(item[2])); // Flowrate (Third column)

      const newChartData = {
        labels: labels,
        datasets: [
          {
            label: 'Distance',
            data: distanceData,
            fill: false,
            borderColor: 'rgb(13, 96, 220)',
            tension: 0.1,
          },
          {
            label: 'Flowrate',
            data: flowrateData,
            fill: false,
            borderColor: 'rgb(254, 137, 4)',
            tension: 0.1,
          },
        ],
      };

      setChartData(newChartData); // Update the chart data
    }
  };

  // Fetch prediction from FastAPI backend
  const fetchPrediction = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      setPrediction(data.prediction);
    } catch (error) {
      console.error('Error fetching prediction:', error);
      setPrediction('Error fetching prediction');
    }
  };
  

  useEffect(() => {
    fetchData(); // Fetch data on initial render
    fetchPrediction(); // Fetch prediction on initial render

    const intervalId = setInterval(() => {
      fetchData(); // Fetch data every 5 seconds
      fetchPrediction(); // Fetch prediction every 5 seconds
    }, 5000);

    return () => clearInterval(intervalId); // Clear interval when component unmounts
  }, []);

  return (
    <div className="dashboard-container">
      <div className="graph-container">
        {/* Left side - Graph */}
        {chartData ? (
          <Line data={chartData} />
        ) : (
          <p>Loading data...</p>
        )}
      </div>

      <div className="content-container">
        {/* Right side - Prediction */}
        <h2>Prediction</h2>
        {prediction ? (
          <p>Prediction: {prediction}</p>
        ) : (
          <p>Loading prediction...</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
