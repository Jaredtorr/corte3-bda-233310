function Navbar({ pantalla, setPantalla }) {
  const botones = [
    { id: "login", label: "Login" },
    { id: "mascotas", label: "Mascotas" },
    { id: "vacunacion", label: "Vacunación Pendiente" },
  ];

  return (
    <nav className="bg-slate-700 px-6 py-2 flex gap-2">
      {botones.map((b) => (
        <button
          key={b.id}
          onClick={() => setPantalla(b.id)}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            pantalla === b.id
              ? "bg-blue-500 text-white"
              : "bg-slate-500 text-white hover:bg-slate-400"
          }`}
        >
          {b.label}
        </button>
      ))}
    </nav>
  );
}

export default Navbar;