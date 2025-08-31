// frontend/src/components/PurchasesPage.jsx
import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import '../styles/PurchasesPage.css';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [form, setForm] = useState({ equipmentType: '', quantity: '', base: '' });

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await axios.get('/purchases');
      setPurchases(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/purchases', form);
    setForm({ equipmentType: '', quantity: '', base: '' });
    fetchPurchases();
  };

  return (
    <div className="page">
      <h2>Purchases</h2>
      <form onSubmit={handleSubmit} className="form">
        <input placeholder="Equipment Type" value={form.equipmentType} onChange={e => setForm({ ...form, equipmentType: e.target.value })} required />
        <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
        <input placeholder="Base" value={form.base} onChange={e => setForm({ ...form, base: e.target.value })} required />
        <button type="submit">Record Purchase</button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Quantity</th>
            <th>Base</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map(p => (
            <tr key={p._id}>
              <td>{p.equipmentType}</td>
              <td>{p.quantity}</td>
              <td>{p.base}</td>
              <td>{new Date(p.date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}