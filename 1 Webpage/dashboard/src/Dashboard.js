import React, { useState, useEffect } from 'react';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import fetchSheetData from './api/googleSheets';
import styled from 'styled-components';

// Register Chart.js modules
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Styled Components
const Container = styled.div`
  padding: 20px;
  font-family: Arial, sans-serif;
  max-width: 900px;
  margin: auto;
`;

const TitleText = styled.h2`
  margin-bottom: 20px;
  text-align: center;
`;

const Section = styled.div`
  margin-bottom: 30px;
`;

const Card = styled.div`
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
`;

const SensorItem = styled.p`
  margin: 10px 0;
  font-size: 16px;
`;

const PredictionText = styled.p`
  font-size: 22px;
  font-weight: bold;
  margin: 15px 0;
  color: ${(props) => (props.isRisk ? '#e63946' : '#2a9d8f')};
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: #0056b3;
  }
`;

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
    <Container>
      <TitleText>Flood Prediction Dashboard</TitleText>

      <Section>
        {chartData ? <Line data={chartData} /> : <p>Loading data...</p>}
      </Section>

      <Section>
        <Card>
          <h3>Latest Sensor Readings</h3>
          <SensorItem><strong>Distance:</strong> {distance} m</SensorItem>
          <SensorItem><strong>Flow Rate:</strong> {flowRate} m³/s</SensorItem>
          <Button onClick={handleRefresh}>Refresh Data</Button>
        </Card>

        <Card>
          <h3>Prediction</h3>
          {prediction ? (
            <PredictionText isRisk={prediction === "Flood Risk"}>
              {prediction === "Flood Risk" ? "⚠️ " : "✅ "} {prediction}
            </PredictionText>
          ) : (
            <p>Loading prediction...</p>
          )}
        </Card>
      </Section>
    </Container>
  );
}
