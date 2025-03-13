import React from 'react';
import './App.css';
import Dashboard from './Dashboard';
import './Dashboard.css';  // Import the dashboard styling

function App() {
  return (
    <div className="App">
      <h1 className="app-header">FLOOD MONITORING DASHBOARD</h1>
      <Dashboard />
    </div>
  );
}

export default App;
