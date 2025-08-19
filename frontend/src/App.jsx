// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import routes from './routes';
import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <div className="content">{routes}</div>
      </div>
    </BrowserRouter>
  );
}

export default App;