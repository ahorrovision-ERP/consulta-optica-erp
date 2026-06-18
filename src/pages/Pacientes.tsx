import { useState, useEffect } from "react";
// import { supabase } from "../supabase";
import { supabase } from "../lib/supabase";

import MainLayout from "../layout/MainLayout";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import DataTable from "../components/DataTable";

import PatientModal from "../components/PatientModal";
import PatientForm from "../components/PatientForm";

function Pacientes() {

  const [openModal, setOpenModal] = useState(false);

  const columnas = [
    "ID",
    "Nombre",
    "Teléfono",
    "Edad",
    "Ciudad",
    "Acciones"
  ];

  const [pacientes, setPacientes] = useState<string[][]>([]);
  useEffect(() => {
  cargarPacientes();
}, []);

  async function cargarPacientes() {

  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .order("id");

  if (error) {
    console.error(error);
    return;
  }

  const filas = data.map((p: any) => [
    p.id?.toString(),
    `${p.nombres} ${p.apellidos}`,
    p.telefono || "",
    p.edad?.toString() || "",
    p.ciudad || "",
    "✏️ 🗑️"
  ]);

  setPacientes(filas);
}

  return (
    <MainLayout>

      <PageHeader
        titulo="Pacientes"
        subtitulo="Gestión de pacientes registrados"
      />

      {/* Barra superior */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          alignItems: "center",
          marginBottom: "25px"
        }}
      >

        <div style={{ flex: 1 }}>
          <SearchBar />
        </div>

        <button
          className="btn-primary"
          onClick={() => setOpenModal(true)}
        >
          + Nuevo
        </button>

        <button className="btn-secondary">
          Importar Excel
        </button>

        <button className="btn-secondary">
          Exportar
        </button>

      </div>

      <DataTable
        columns={columnas}
        data={pacientes}
      />

      {/* Modal */}
      <PatientModal
        isOpen={openModal}
        title="Nuevo Paciente"
        onClose={() => setOpenModal(false)}
      >
        <PatientForm />
      </PatientModal>

    </MainLayout>
  );
}

export default Pacientes;
