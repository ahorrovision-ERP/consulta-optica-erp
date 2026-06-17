import logo from "../assets/logo.png";
function Sidebar() {
  return (
    <aside className="sidebar">

     <div className="logo-container">

     <img
  src="/logo.png"
  style={{
    width: "180px",
    display: "block",
    margin: "20px auto"
  }}
/>

   <h1>Ahorro Visión ERP</h1>

<p>Sistema de Gestión Óptica</p>

</div>

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
Sucursales: Ñuñoa - Macul
Usuario: Administrador
    </aside>
  );
}

export default Sidebar;
