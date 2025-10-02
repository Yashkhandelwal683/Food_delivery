import React from 'react';
import Home from './pages/Home';
import BillingPage from './pages/BillingPage';
import { ToastContainer } from "react-toastify";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/billing" element={<BillingPage />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
