import MainLayout from "../layout/MainLayout";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import DataTable from "../components/DataTable";

function Pacientes() {
  const columnas = [
    "ID",
    "Nombre",
    "Teléfono",
    "Edad",
    "Ciudad"
  ];

  const pacientes = [
    ["1", "Juan Pérez", "+56 9 4567 8912", "45", "Santiago"],
    ["2", "María González", "+56 9 8123 4567", "29", "Macul"],
    ["3", "Pedro Ramírez", "+56 9 9988 7766", "61", "Ñuñoa"],
    ["4", "Elena García", "+56 9 4455 6677", "37", "Providencia"],
    ["5", "Carlos Muñoz", "+56 9 2233 8899", "52", "La Florida"]
  ];

  return (
    <MainLayout>

      <PageHeader
        titulo="Pacientes"
        subtitulo="Gestión de pacientes registrados"
      />

      <SearchBar />

      <div
  style={{
    display: "flex",
    gap: "20px",
    alignItems: "center",
    marginBottom: "30px"
  }}
>
  <div style={{ flex: 1 }}>
    <SearchBar />
  </div>

  <button
    style={{
      background: "#cc001f",
      color: "white",
      border: "none",
      padding: "16px 24px",
      borderRadius: "15px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer"
    }}
  >
    + Nuevo Paciente
  </button>
</div>

      <DataTable
        columns={columnas}
        data={pacientes}
      />

    </MainLayout>
  );
}

export default Pacientes;
