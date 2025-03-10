import React from 'react';
import './App.css';
import Dashboard from './Dashboard';
import './Dashboard.css';  // Import the dashboard styling

function App() {
  return (
    <div className="App">
      <h1 className="app-header">Dashboard with Excel Data</h1>
      <Dashboard />
    </div>
  );
}

export default App;
