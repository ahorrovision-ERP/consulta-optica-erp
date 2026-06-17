import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="logo-container">

        <img
          src="/logo.png"
          alt="Óptica Ahorro Visión"
          className="logo"
        />

        <h1>Ahorro Visión ERP</h1>

        <p className="subtitle">
          Sistema de Gestión Óptica
        </p>

      </div>

      {/* Menú General */}
      <div className="grupo">

        <h4>GENERAL</h4>

        <ul>

          <li className="active">
            Dashboard
          </li>

          <li>
            Pacientes
          </li>

          <li>
            Agenda
          </li>

          <li>
            Historia Clínica
          </li>

        </ul>

      </div>

      {/* Inventario */}
      <div className="grupo">

        <h4>INVENTARIO Y VENTAS</h4>

        <ul>

          <li>
            Recetas
          </li>

          <li>
            Órdenes
          </li>

          <li>
            Ventas
          </li>

        </ul>

      </div>

      {/* Pie */}
      <div className="sidebar-footer">

        <div className="branch-card">

          <div className="branch-icon">
            🏪
          </div>

          <div>

            <strong>Óptica Ahorro Visión</strong>
            

            <p>Ñuñoa - Macul</p>

          </div>

        </div>

        <div className="user-info">

          <strong>Administrador</strong>

          <p>Perfil Principal</p>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;
