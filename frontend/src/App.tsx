import { Routes, Route, Navigate } from "react-router-dom";
import CustomerLayout from "@/components/layout/CustomerLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import HomePage from "@/pages/customer/HomePage";
import TreatmentPage from "@/pages/customer/TreatmentPage";
import BookingPage from "@/pages/customer/BookingPage";
import BookingConfirmation from "@/pages/customer/BookingConfirmation";
import AdminLogin from "@/pages/admin/AdminLogin";
import Dashboard from "@/pages/admin/Dashboard";
import AdminCalendar from "@/pages/admin/AdminCalendar";
import AdminTreatments from "@/pages/admin/AdminTreatments";
import AdminAppointments from "@/pages/admin/AdminAppointments";
import AdminSettings from "@/pages/admin/AdminSettings";

function App() {
  return (
    <Routes>
      {/* Customer Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/treatments" element={<Navigate to="/#treatments" replace />} />
        <Route path="/treatments/:slug" element={<TreatmentPage />} />
        <Route path="/book/:slug" element={<BookingPage />} />
        <Route path="/booking-confirmed" element={<BookingConfirmation />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<AdminCalendar />} />
        <Route path="treatments" element={<AdminTreatments />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}

export default App;
