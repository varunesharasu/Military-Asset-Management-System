// frontend/src/components/AssignmentsExpendituresPage.jsx
import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import '../styles/AssignmentsExpendituresPage.css';

export default function AssignmentsExpendituresPage() {
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({ equipmentType: '', quantity: '', base: '', personnel: '', type: 'Assigned' });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await axios.get('/assignments');
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/assignments', form);
    setForm({ equipmentType: '', quantity: '', base: '', personnel: '', type: 'Assigned' });
    fetchAssignments();
  };

  return (
    <div className="page">
      <h2>Assignments & Expenditures</h2>
      <form onSubmit={handleSubmit} className="form">
        <input placeholder="Equipment Type" value={form.equipmentType} onChange={e => setForm({ ...form, equipmentType: e.target.value })} required />
        <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
        <input placeholder="Base" value={form.base} onChange={e => setForm({ ...form, base: e.target.value })} required />
        <input placeholder="Personnel" value={form.personnel} onChange={e => setForm({ ...form, personnel: e.target.value })} required />
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
          <option value="Assigned">Assigned</option>
          <option value="Expended">Expended</option>
        </select>
        <button type="submit">Submit</button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Qty</th>
            <th>Base</th>
            <th>Personnel</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map(a => (
            <tr key={a._id}>
              <td>{a.equipmentType}</td>
              <td>{a.quantity}</td>
              <td>{a.base}</td>
              <td>{a.personnel}</td>
              <td>{a.type}</td>
              <td>{new Date(a.date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}