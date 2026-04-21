import { useState, useEffect } from "react";

const API = "http://localhost:8000";

function Sidebar({ pantalla, setPantalla, sesion, setSesion }) {
  const [rol, setRol] = useState("");
  const [vetId, setVetId] = useState("");
  const [veterinarios, setVeterinarios] = useState([]);

  useEffect(() => {
    fetch(`${API}/veterinarios`)
      .then((r) => r.json())
      .then(setVeterinarios)
      .catch(console.error);
  }, []);

  async function handleLogin(nuevoRol, nuevoVetId) {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rol: nuevoRol,
        vet_id: nuevoVetId ? parseInt(nuevoVetId) : null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSesion({ rol: data.rol, vet_id: data.vet_id });
    }
  }

  function onRolChange(e) {
    const nuevoRol = e.target.value;
    setRol(nuevoRol);
    setVetId("");
    if (nuevoRol && nuevoRol !== "rol_veterinario") {
      handleLogin(nuevoRol, null);
    }
  }

  function onVetChange(e) {
    const nuevoVetId = e.target.value;
    setVetId(nuevoVetId);
    if (nuevoVetId) {
      handleLogin("rol_veterinario", nuevoVetId);
    }
  }

  const navItems = [
    { id: "dashboard", label: "Panel de Control", icon: "⊞" },
    { id: "mascotas", label: "Búsqueda de Mascotas", icon: "🔍" },
    { id: "vacunacion", label: "Vacunaciones", icon: "💉" },
  ];

  return (
    <div className="w-56 bg-slate-800 text-white flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <div>
            <div className="font-bold text-sm">Clínica</div>
            <div className="font-bold text-sm">Veterinaria</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPantalla(item.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
              pantalla === item.id
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Cambio de rol */}
      <div className="p-3 border-t border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Cambio de Rol</p>
        <select
          value={rol}
          onChange={onRolChange}
          className="w-full bg-slate-700 text-white text-xs rounded px-2 py-1 mb-2 border border-slate-600"
        >
          <option value="">— Seleccionar Rol —</option>
          <option value="rol_admin">Administrador</option>
          <option value="rol_recepcion">Recepción</option>
          <option value="rol_veterinario">Veterinario</option>
        </select>

        {rol === "rol_veterinario" && (
          <select
            value={vetId}
            onChange={onVetChange}
            className="w-full bg-slate-700 text-white text-xs rounded px-2 py-1 mb-2 border border-slate-600"
          >
            <option value="">— Seleccionar Vet —</option>
            {veterinarios.map((v) => (
              <option key={v.id} value={v.id}>{v.nombre}</option>
            ))}
          </select>
        )}

        {sesion.rol && (
          <div className="text-xs text-green-400 mt-1">
            ✅ {sesion.rol}
            {sesion.vet_id && ` · vet_id=${sesion.vet_id}`}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700">
        <button
          onClick={() => setSesion({ rol: null, vet_id: null })}
          className="w-full text-left text-xs text-slate-400 hover:text-white flex items-center gap-2 py-1"
        >
          ⬅ Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

export default Sidebar;