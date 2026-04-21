import { useState } from "react";

const API = "http://localhost:8000";

function Mascotas({ sesion }) {
  const [nombre, setNombre] = useState("");
  const [resultados, setResultados] = useState([]);
  const [msg, setMsg] = useState(null);

  async function buscar() {
    setMsg(null);

    const params = new URLSearchParams({
      nombre,
      rol: sesion.rol || "rol_admin",
      ...(sesion.vet_id && { vet_id: sesion.vet_id }),
    });

    const res = await fetch(`${API}/mascotas?${params}`);
    const data = await res.json();

    if (!res.ok) {
      setMsg({ tipo: "err", texto: `❌ ${data.detail}` });
      setResultados([]);
      return;
    }

    setResultados(data);

    if (data.length === 0) {
      setMsg({ tipo: "info", texto: "Sin resultados." });
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Búsqueda de Mascotas</h2>

      {sesion.rol && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-sm">
          Sesión: <strong>{sesion.rol}</strong>
          {sesion.vet_id && ` · vet_id=${sesion.vet_id}`}
        </div>
      )}

      <div className="text-xs text-gray-500 mb-2">
        💡 Prueba inyección aquí: <code>' OR '1'='1</code> o <code>'; DROP TABLE mascotas; --</code>
      </div>

      <label className="block text-sm font-medium mb-1">Nombre de la mascota</label>
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && buscar()}
        placeholder="Ej: Firulais"
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4 text-sm"
      />

      <button
        onClick={buscar}
        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium"
      >
        Buscar
      </button>

      {msg && (
        <div className={`mt-4 p-3 rounded text-sm ${
          msg.tipo === "err"
            ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-gray-50 text-gray-600 border border-gray-200"
        }`}>
          {msg.texto}
        </div>
      )}

      {resultados.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Especie</th>
                <th className="px-3 py-2 text-left">Nacimiento</th>
                <th className="px-3 py-2 text-left">Dueño</th>
                <th className="px-3 py-2 text-left">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((m) => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{m.id}</td>
                  <td className="px-3 py-2 font-medium">{m.nombre}</td>
                  <td className="px-3 py-2">{m.especie}</td>
                  <td className="px-3 py-2">{m.fecha_nacimiento || "-"}</td>
                  <td className="px-3 py-2">{m.dueno}</td>
                  <td className="px-3 py-2">{m.telefono || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Mascotas;