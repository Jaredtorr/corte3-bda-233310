import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Mascotas from "./pages/Mascotas";
import Vacunacion from "./pages/Vacunacion";

function App() {
  const [pantalla, setPantalla] = useState("dashboard");
  const [sesion, setSesion] = useState({ rol: null, vet_id: null });

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar pantalla={pantalla} setPantalla={setPantalla} sesion={sesion} setSesion={setSesion} />
      <main className="flex-1 overflow-y-auto p-6">
        {pantalla === "dashboard" && (
          <Dashboard sesion={sesion} setSesion={setSesion} setPantalla={setPantalla} />
        )}
        {pantalla === "mascotas" && (
          <Mascotas sesion={sesion} />
        )}
        {pantalla === "vacunacion" && (
          <Vacunacion sesion={sesion} />
        )}
      </main>
    </div>
  );
}

export default App;