import { useState, useEffect } from "react";

const API = "http://localhost:8000";

function Login({ sesion, setSesion }) {
  const [rol, setRol] = useState("");
  const [vetId, setVetId] = useState("");
  const [veterinarios, setVeterinarios] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (rol === "rol_veterinario") {
      fetch(`${API}/veterinarios`)
        .then((r) => r.json())
        .then(setVeterinarios)
        .catch(() => setMsg({ tipo: "err", texto: "Error cargando veterinarios" }));
    }
  }, [rol]);

  async function handleLogin() {
    if (!rol) {
      setMsg({ tipo: "err", texto: "Selecciona un rol." });
      return;
    }
    if (rol === "rol_veterinario" && !vetId) {
      setMsg({ tipo: "err", texto: "Selecciona un veterinario." });
      return;
    }

    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rol,
        vet_id: vetId ? parseInt(vetId) : null,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setSesion({ rol: data.rol, vet_id: data.vet_id });
      setMsg({ tipo: "ok", texto: `✅ ${data.mensaje}` });
    } else {
      setMsg({ tipo: "err", texto: `❌ ${data.detail}` });
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Iniciar Sesión</h2>

      {sesion.rol && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-sm">
          Sesión activa: <strong>{sesion.rol}</strong>
          {sesion.vet_id && ` · vet_id=${sesion.vet_id}`}
        </div>
      )}

      <label className="block text-sm font-medium mb-1">Rol</label>
      <select
        value={rol}
        onChange={(e) => { setRol(e.target.value); setVetId(""); }}
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4 text-sm"
      >
        <option value="">-- Selecciona un rol --</option>
        <option value="rol_admin">Administrador</option>
        <option value="rol_recepcion">Recepción</option>
        <option value="rol_veterinario">Veterinario</option>
      </select>

      {rol === "rol_veterinario" && (
        <>
          <label className="block text-sm font-medium mb-1">Veterinario</label>
          <select
            value={vetId}
            onChange={(e) => setVetId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4 text-sm"
          >
            <option value="">-- Selecciona veterinario --</option>
            {veterinarios.map((v) => (
              <option key={v.id} value={v.id}>{v.nombre}</option>
            ))}
          </select>
        </>
      )}

      <button
        onClick={handleLogin}
        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium"
      >
        Entrar
      </button>

      {msg && (
        <div className={`mt-4 p-3 rounded text-sm ${
          msg.tipo === "ok"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {msg.texto}
        </div>
      )}
    </div>
  );
}

export default Login;