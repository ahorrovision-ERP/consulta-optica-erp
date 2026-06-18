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
          justifyContent: "flex-end",
          marginTop: "20px",
          marginBottom: "20px"
        }}
      >
        <button
          style={{
            background: "var(--primary-color)",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "bold"
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
