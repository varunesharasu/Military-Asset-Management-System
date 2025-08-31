// frontend/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [filters, setFilters] = useState({ base: '', equipmentType: '' });
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await axios.get('/assets/dashboard', { params: filters });
        setMetrics(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetrics();
  }, [filters]);

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>

      <div className="filters">
        <input
          placeholder="Base"
          value={filters.base}
          onChange={(e) => setFilters({ ...filters, base: e.target.value })}
        />
        <input
          placeholder="Equipment Type"
          value={filters.equipmentType}
          onChange={(e) => setFilters({ ...filters, equipmentType: e.target.value })}
        />
      </div>

      <div className="metrics">
        <div className="metric">
          <h3>Opening Balance</h3>
          <p>{metrics.openingBalance || 0}</p>
        </div>
        <div className="metric">
          <h3>Closing Balance</h3>
          <p>{metrics.closingBalance || 0}</p>
        </div>
        <div className="metric clickable" onClick={() => setShowPopup(true)}>
          <h3>Net Movement</h3>
          <p>{metrics.netMovement || 0}</p>
        </div>
        <div className="metric">
          <h3>Assigned</h3>
          <p>{metrics.assigned || 0}</p>
        </div>
        <div className="metric">
          <h3>Expended</h3>
          <p>{metrics.expended || 0}</p>
        </div>
      </div>

      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Detailed Net Movement</h3>
            <p>Purchases: {metrics.purchases || 0}</p>
            <p>Transfer In: {metrics.transfersIn || 0}</p>
            <p>Transfer Out: {metrics.transfersOut || 0}</p>
            <button onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}