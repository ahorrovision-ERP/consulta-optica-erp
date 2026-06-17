import logo from "../assets/logo.png";
function Sidebar() {
  return (
    <aside className="sidebar">

      <h1>AHORRO VISION ERP</h1>
      <p>Optical Management</p>

      <div className="grupo">
        <h4>GENERAL</h4>

        <ul>
          <li>Dashboard</li>
          <li>Pacientes</li>
          <li>Agenda</li>
          <li>Historia Clínica</li>
        </ul>
      </div>

      <div className="grupo">
        <h4>INVENTARIO Y VENTAS</h4>

        <ul>
          <li>Recetas</li>
          <li>Ordenes</li>
          <li>Ventas</li>
        </ul>
      </div>

    </aside>
  );
}

export default Sidebar;
