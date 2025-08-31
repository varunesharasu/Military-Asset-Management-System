// frontend/src/components/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <h3>AssetSys</h3>
      <div>
        {user && <span>{user.username} ({user.role})</span>}
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}