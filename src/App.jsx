import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import WaiterDashboard from './pages/WaiterDashboard';
import KDS from './pages/KDS';
import Billing from './pages/Billing';
import Admin from './pages/Admin';
import Login from './pages/Login';
import QuickBill from './pages/QuickBill';
import ProtectedRoute from './components/ProtectedRoute';
import { usePosStore } from './store/posStore';
import { useAuthStore } from './store/authStore';

import CustomerLogin from './pages/CustomerLogin';
import CustomerDashboard from './pages/CustomerDashboard';

function App() {
  const fetchData = usePosStore(state => state.fetchData);
  const fetchUsers = useAuthStore(state => state.fetchUsers);

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, [fetchData, fetchUsers]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer" element={<CustomerDashboard />} />
        
        {/* All routes inside Layout are protected to some degree */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/waiter" replace />} />
          
          <Route path="waiter" element={
            <ProtectedRoute allowedRoles={['waiter', 'admin', 'manager']}>
              <WaiterDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="kds" element={
            <ProtectedRoute allowedRoles={['kitchen_manager', 'admin', 'manager']}>
              <KDS />
            </ProtectedRoute>
          } />
          
          <Route path="billing" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Billing />
            </ProtectedRoute>
          } />
          
          <Route path="takeaway" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'waiter']}>
              <QuickBill />
            </ProtectedRoute>
          } />
          
          <Route path="admin" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Admin />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
