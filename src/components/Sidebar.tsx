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
            <Link to="/">
              <span className="menu-icon">🏠</span>
              <span>Dashboard</span>
            </Link>
          </li>

          <li>
            <Link to="/pacientes">
              <span className="menu-icon">👤</span>
              <span>Pacientes</span>
            </Link>
          </li>

          <li>
            <Link to="/agenda">
              <span className="menu-icon">📅</span>
              <span>Agenda</span>
            </Link>
          </li>

          <li>
            <Link to="/historia-clinica">
              <span className="menu-icon">📋</span>
              <span>Historia Clínica</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* INVENTARIO Y VENTAS */}
      <div className="grupo">
        <h4>INVENTARIO Y VENTAS</h4>

        <ul>
          <li>
            <Link to="/recetas">
              <span className="menu-icon">👓</span>
              <span>Recetas</span>
            </Link>
          </li>

          <li>
            <Link to="/ordenes">
              <span className="menu-icon">📝</span>
              <span>Órdenes</span>
            </Link>
          </li>

          <li>
            <Link to="/inventario">
              <span className="menu-icon">📦</span>
              <span>Inventario</span>
            </Link>
          </li>

          <li>
            <Link to="/ventas">
              <span className="menu-icon">🛒</span>
              <span>Ventas</span>
            </Link>
          </li>

          <li>
            <Link to="/caja">
              <span className="menu-icon">💰</span>
              <span>Caja</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* ADMINISTRACIÓN */}
      <div className="grupo">
        <h4>ADMINISTRACIÓN</h4>

        <ul>
          <li>
            <Link
              to="/configuracion-optica"
              className="config-link"
            >
              <span className="menu-icon">⚙️</span>

              <span className="menu-configuracion">
                <span className="menu-configuracion-principal">
                  Configuración
                </span>

                <span className="menu-configuracion-secundario">
                  de la Óptica
                </span>
              </span>
            </Link>
          </li>

          <li>
            <Link to="/importaciones">
              <span className="menu-icon">📥</span>
              <span>Importaciones</span>
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
