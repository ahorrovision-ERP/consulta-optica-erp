export default function Dashboard() {
  return (
    <div className="dashboard-container">

      <aside className="sidebar">

        <div className="logo">
          <h1>VisionPro ERP</h1>
          <span>Optical Management</span>
        </div>

        <nav>

          <div className="menu-title">GENERAL</div>

          <button className="menu-item active">
            Dashboard
          </button>

          <button className="menu-item">
            Pacientes
          </button>

          <button className="menu-item">
            Agenda
          </button>

          <button className="menu-item">
            Historia Clínica
          </button>

          <div className="menu-title">
            INVENTARIO Y VENTAS
          </div>

          <button className="menu-item">
            Recetas
          </button>

          <button className="menu-item">
            Ordenes
          </button>

          <button className="menu-item">
            Ventas
          </button>

          <button className="menu-item">
            Inventario
          </button>

        </nav>

      </aside>


      <main className="content">

        <h1>Dashboard Overview</h1>

        <div className="cards">

          <div className="card">
            <h3>Total Pacientes</h3>
            <h2>1,284</h2>
          </div>

          <div className="card">
            <h3>Ventas Hoy</h3>
            <h2>$2,450</h2>
          </div>

          <div className="card">
            <h3>Ordenes Pendientes</h3>
            <h2>42</h2>
          </div>

          <div className="card">
            <h3>Ingresos Mensuales</h3>
            <h2>$54,200</h2>
          </div>

        </div>

      </main>

    </div>
  );
}
