import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Pacientes from "./pages/Pacientes";
import Agenda from "./pages/Agenda";
import HistoriaClinica from "./pages/HistoriaClinica";
import Recetas from "./pages/Recetas";
import Ordenes from "./pages/Ordenes";
import Ventas from "./pages/Ventas";
import ConfiguracionOptica from "./pages/ConfiguracionOptica";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/pacientes"
          element={<Pacientes />}
        />

        <Route
          path="/agenda"
          element={<Agenda />}
        />

        <Route
          path="/historia-clinica"
          element={<HistoriaClinica />}
        />

        <Route
          path="/recetas"
          element={<Recetas />}
        />

        <Route
          path="/ordenes"
          element={<Ordenes />}
        />

        <Route
          path="/ventas"
          element={<Ventas />}
        />

        <Route
          path="/configuracion-optica"
          element={<ConfiguracionOptica />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
