import { useState } from "react";

const API = "http://localhost:8000";

function Dashboard({ sesion, setPantalla }) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [sqlWarning, setSqlWarning] = useState(false);
  const [cacheLogs, setCacheLogs] = useState([]);
  const [vacunacionData, setVacunacionData] = useState([]);

  const sqlPatterns = ["'", "--", ";", "DROP", "UNION", "SELECT", "OR '1'"];

  function detectSQL(input) {
    return sqlPatterns.some((p) => input.toUpperCase().includes(p.toUpperCase()));
  }

  async function buscarMascotas() {
    const params = new URLSearchParams({
      nombre: busqueda,
      rol: sesion.rol || "rol_admin",
      ...(sesion.vet_id && { vet_id: sesion.vet_id }),
    });
    const res = await fetch(`${API}/mascotas?${params}`);
    const data = await res.json();
    if (res.ok) setResultados(data);
  }

async function consultarVacunacion() {
    const params = new URLSearchParams({
      rol: sesion.rol || "rol_admin",
      ...(sesion.vet_id && { vet_id: sesion.vet_id }),
    });
    const res = await fetch(`${API}/vacunacion-pendiente?${params}`);
    const json = await res.json();

    if (res.ok) {
      setVacunacionData(json.data);
      setCacheLogs((prev) => {
        const num = prev.length + 1;
        return [
          ...prev.slice(-4),
          `Solicitud ${num} [${json.cache}] -> Tiempo: ${json.latencia_ms}ms`,
        ];
      });
    }
  }
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Panel de Control</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Columna izquierda */}
        <div className="space-y-4">
          {/* Info sesión */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-slate-700 mb-3">Información de la Sesión</h2>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                👨‍⚕️
              </div>
              <div>
                <p className="text-xs text-slate-500">Rol Activo:</p>
                <p className="font-bold text-sm text-slate-800">
                  {sesion.rol || "Sin sesión"}
                </p>
                {sesion.vet_id && (
                  <p className="text-xs text-slate-500">vet_id={sesion.vet_id}</p>
                )}
              </div>
            </div>
            {!sesion.rol && (
              <p className="text-xs text-amber-600 mt-3">
                ⚠️ Selecciona un rol en el sidebar para continuar.
              </p>
            )}
          </div>

          {/* Mascotas encontradas */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-slate-700 mb-3">Mascotas Encontradas</h2>
            {resultados.length === 0 ? (
              <p className="text-xs text-slate-400">
                Usa la búsqueda para ver mascotas aquí.
              </p>
            ) : (
              <div className="space-y-2">
                {resultados.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-1 border-b last:border-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      🐾
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.nombre}</p>
                      <p className="text-xs text-slate-400">{m.especie} · {m.dueno}</p>
                    </div>
                  </div>
                ))}
                {resultados.length > 5 && (
                  <button
                    onClick={() => setPantalla("mascotas")}
                    className="text-blue-500 text-xs hover:underline"
                  >
                    Ver todas ({resultados.length}) →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha */}
        <div className="col-span-2 space-y-4">
          {/* Búsqueda rápida */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-slate-700 mb-3">Búsqueda Rápida de Mascotas</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setSqlWarning(detectSQL(e.target.value));
                }}
                onKeyDown={(e) => e.key === "Enter" && buscarMascotas()}
                placeholder="Ej: Firulais"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={buscarMascotas}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700"
              >
                Buscar
              </button>
            </div>

            {sqlWarning && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex items-center gap-2">
                ⚠️ ¡Prueba de Inyección (SQLi) detectada en input!: <code className="bg-red-100 px-1 rounded">{busqueda}</code>
              </div>
            )}

            {resultados.length > 0 && !sqlWarning && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-2 py-2 text-left">ID</th>
                      <th className="px-2 py-2 text-left">Nombre</th>
                      <th className="px-2 py-2 text-left">Especie</th>
                      <th className="px-2 py-2 text-left">Dueño</th>
                      <th className="px-2 py-2 text-left">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((m) => (
                      <tr key={m.id} className="border-b hover:bg-gray-50">
                        <td className="px-2 py-2">{m.id}</td>
                        <td className="px-2 py-2 font-medium">{m.nombre}</td>
                        <td className="px-2 py-2">{m.especie}</td>
                        <td className="px-2 py-2">{m.dueno}</td>
                        <td className="px-2 py-2">{m.telefono}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Redis Log Monitor */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-slate-700 mb-1">Vacunación Pendiente + Cache Redis</h2>
            <p className="text-xs text-slate-400 mb-3">
              Presiona dos veces para ver CACHE MISS → CACHE HIT en el monitor.
            </p>

            <button
              onClick={consultarVacunacion}
              className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm hover:bg-slate-700 mb-3"
            >
              Consultar Vacunaciones Pendientes
            </button>

            {vacunacionData.length > 0 && (
              <p className="text-xs text-green-600 mb-2">
                ✅ {vacunacionData.length} registros encontrados
              </p>
            )}

            <p className="text-xs font-medium text-slate-600 mb-1">API Log Monitor</p>
            <div className="bg-slate-900 text-green-400 rounded-lg p-3 text-xs font-mono min-h-16">
              {cacheLogs.length === 0 ? (
                <span className="text-slate-500">Presiona el botón para ver logs...</span>
              ) : (
                cacheLogs.map((log, i) => (
                  <div key={i} className={log.includes("MISS") ? "text-yellow-400" : "text-green-400"}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;