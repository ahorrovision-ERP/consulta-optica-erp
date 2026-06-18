import "./Sidebar.css";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">

      {/* LOGO */}
      <div className="logo-container">

        <img
          src={logo}
          alt="Óptica Ahorro Visión"
          className="logo"
        />

        <h1>Ahorro Visión ERP</h1>

        <p className="subtitle">
          Sistema de Gestión Óptica
        </p>

      </div>


      {/* GENERAL */}
      <div className="grupo">

        <h4>GENERAL</h4>

        <ul>

          <li>
            <Link to="/">Dashboard</Link>
          </li>

          <li>
            <Link to="/pacientes">Pacientes</Link>
          </li>

          <li>
            <Link to="/agenda">Agenda</Link>
          </li>

          <li>
            <Link to="/historia-clinica">
              Historia Clínica
            </Link>
          </li>

        </ul>

      </div>


      {/* INVENTARIO */}
      <div className="grupo">

        <h4>INVENTARIO Y VENTAS</h4>

        <ul>

          <li>
            <Link to="/recetas">
              Recetas
            </Link>
          </li>

          <li>
            <Link to="/ordenes">
              Órdenes
            </Link>
          </li>

          <li>
            <Link to="/ventas">
              Ventas
            </Link>
          </li>

        </ul>

      </div>


      {/* FOOTER */}
      <div className="sidebar-footer">

        <div className="branch-card">

          <div className="branch-icon">
            🏪
          </div>

          <div>

            <strong>
              Óptica Ahorro Visión
            </strong>

            <p>
              Ñuñoa - Macul
            </p>

          </div>

        </div>


        <div className="user-info">

          <strong>
            Administrador
          </strong>

          <p>
            Perfil Principal
          </p>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;
