// frontend/src/pages/Home.jsx
import React from 'react';
import Dashboard from '../components/Dashboard';
import PurchasesPage from '../components/PurchasesPage';
import TransferPage from '../components/TransferPage';
import AssignmentsExpendituresPage from '../components/AssignmentsExpendituresPage';
import '../styles/Home.css';

export default function Home() {
  return (
    <div className="home">
      <h1>Military Asset Management System</h1>
      <Dashboard />
      <PurchasesPage />
      <TransferPage />
      <AssignmentsExpendituresPage />
    </div>
  );
}