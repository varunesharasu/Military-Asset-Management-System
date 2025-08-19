// frontend/src/components/TransferPage.jsx
import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import '../styles/TransferPage.css';

export default function TransferPage() {
  const [transfers, setTransfers] = useState([]);
  const [form, setForm] = useState({ equipmentType: '', quantity: '', fromBase: '', toBase: '' });

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const res = await axios.get('/transfers');
      setTransfers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/transfers', form);
    setForm({ equipmentType: '', quantity: '', fromBase: '', toBase: '' });
    fetchTransfers();
  };

  return (
    <div className="page">
      <h2>Transfer Assets</h2>
      <form onSubmit={handleSubmit} className="form">
        <input placeholder="Equipment Type" value={form.equipmentType} onChange={e => setForm({ ...form, equipmentType: e.target.value })} required />
        <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
        <input placeholder="From Base" value={form.fromBase} onChange={e => setForm({ ...form, fromBase: e.target.value })} />
        <input placeholder="To Base" value={form.toBase} onChange={e => setForm({ ...form, toBase: e.target.value })} required />
        <button type="submit">Transfer</button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Qty</th>
            <th>From</th>
            <th>To</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map(t => (
            <tr key={t._id}>
              <td>{t.equipmentType}</td>
              <td>{t.quantity}</td>
              <td>{t.fromBase || '-'}</td>
              <td>{t.toBase}</td>
              <td>{new Date(t.date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}