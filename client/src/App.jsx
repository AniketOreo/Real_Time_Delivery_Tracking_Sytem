import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

import PlaceOrder from './pages/customer/PlaceOrder';
import OrderHistory from './pages/customer/OrderHistory';
import TrackOrder from './pages/customer/TrackOrder';

import AgentDashboard from './pages/agent/AgentDashboard';

import ManageOrders from './pages/admin/ManageOrders';
import ManageUsers from './pages/admin/ManageUsers';
import LiveMonitor from './pages/admin/LiveMonitor';
import Reports from './pages/admin/Reports';

import AIChatBot from './components/AIChatBot';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/customer/place-order" element={
          <ProtectedRoute roles={['customer']}><PlaceOrder /></ProtectedRoute>
        } />
        <Route path="/customer/history" element={
          <ProtectedRoute roles={['customer']}><OrderHistory /></ProtectedRoute>
        } />
        <Route path="/customer/track/:id" element={
          <ProtectedRoute roles={['customer', 'admin']}><TrackOrder /></ProtectedRoute>
        } />

        <Route path="/agent" element={
          <ProtectedRoute roles={['agent']}><AgentDashboard /></ProtectedRoute>
        } />

        <Route path="/admin/orders" element={
          <ProtectedRoute roles={['admin']}><ManageOrders /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute roles={['admin']}><ManageUsers /></ProtectedRoute>
        } />
        <Route path="/admin/monitor" element={
          <ProtectedRoute roles={['admin']}><LiveMonitor /></ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute roles={['admin']}><Reports /></ProtectedRoute>
        } />

        <Route path="*" element={<div className="container">Page not found.</div>} />
      </Routes>
      
      <AIChatBot />
    </>
  );
}
