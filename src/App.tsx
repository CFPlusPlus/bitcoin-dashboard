import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import DcaCalculatorPage from "./pages/DcaCalculatorPage";
import ToolsPage from "./pages/ToolsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="tools/dca-rechner" element={<DcaCalculatorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
