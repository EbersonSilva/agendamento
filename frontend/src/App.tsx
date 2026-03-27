import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Booking } from "./components/Booking"
import { DailySchedule } from "./components/DailySchedule"
import { AllAppointments } from "./components/AllAppointments"
import { Metrics } from "./components/Metrics"
import { PendingAppointments } from "./components/PendingAppointments"
import { AdminDashboard } from "./components/AdminDashboard"
import { Settings} from "./components/Settings"
import { ChangePassword } from "./components/ChangePassword"
import { PrivateRoute } from "./components/PrivateRoute"
import { Login } from "./components/Login"


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Booking />} />
        <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>}>
          <Route index element={<DailySchedule />} /> 
          <Route path="novo-agendamento" element={<Booking mode="admin" />} />
          <Route path="agendamentos" element={<AllAppointments />} />
          <Route path="metricas" element={<Metrics />} />
          <Route path="pendentes" element={<PendingAppointments />} />
          <Route path="configuracoes" element={<Settings/>} />
          <Route path="alterar-senha" element={<ChangePassword />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );

}   