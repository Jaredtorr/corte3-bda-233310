import { useState } from "react";

const API = "http://localhost:8000";

function Vacunacion({ sesion }) {
  const [resultados, setResultados] = useState([]);
  const [msg, setMsg] = useState(null);

  async function cargar() {
    setMsg({ tipo: "info", texto: "Consultando... revisa los logs de la API para ver CACHE HIT o MISS." });

    const params = new URLSearchParams({
      rol: sesion.rol || "rol_admin",
      ...(sesion.vet_id && { vet_id: sesion.vet_id }),
    });

    const res = await fetch(`${API}/vacunacion-pendiente?${params}`);
    const json = await res.json();

    if (!res.ok) {
      setMsg({ tipo: "err", texto: `❌ ${json.detail}` });
      setResultados([]);
      return;
    }

    const resultadosData = json.data || json;
    setResultados(resultadosData);

    if (resultadosData.length === 0) {
      setMsg({ tipo: "ok", texto: "✅ Todas las mascotas están al día." });
    } else {
      setMsg({ tipo: "ok", texto: `✅ ${resultadosData.length} registros encontrados. [${json.cache || ""}] ${json.latencia_ms || ""}ms` });
    }
  }

  function getBadge(estado) {
    if (estado === "VACUNA VENCIDA") {
      return "bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold";
    }
    return "bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold";
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Vacunación Pendiente</h2>

      {sesion.rol && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-sm">
          Sesión: <strong>{sesion.rol}</strong>
          {sesion.vet_id && ` · vet_id=${sesion.vet_id}`}
        </div>
      )}

      <div className="text-xs text-gray-500 mb-4">
        💡 Haz clic dos veces seguidas y observa los logs de la API:<br />
        Primera consulta → <code>[CACHE MISS]</code> · Segunda consulta → <code>[CACHE HIT]</code>
      </div>

      <button
        onClick={cargar}
        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium"
      >
        Consultar vacunación pendiente
      </button>

      {msg && (
        <div className={`mt-4 p-3 rounded text-sm ${
          msg.tipo === "err"
            ? "bg-red-50 text-red-700 border border-red-200"
            : msg.tipo === "ok"
            ? "bg-green-50 text-green-700 border border-green-200"
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
                <th className="px-3 py-2 text-left">Mascota</th>
                <th className="px-3 py-2 text-left">Especie</th>
                <th className="px-3 py-2 text-left">Dueño</th>
                <th className="px-3 py-2 text-left">Vacuna</th>
                <th className="px-3 py-2 text-left">Última Aplicación</th>
                <th className="px-3 py-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{r.mascota_nombre}</td>
                  <td className="px-3 py-2">{r.especie}</td>
                  <td className="px-3 py-2">{r.dueno_nombre}</td>
                  <td className="px-3 py-2">{r.vacuna_nombre}</td>
                  <td className="px-3 py-2">{r.ultima_aplicacion || "Nunca"}</td>
                  <td className="px-3 py-2">
                    <span className={getBadge(r.estado_vacuna)}>
                      {r.estado_vacuna}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Vacunacion;