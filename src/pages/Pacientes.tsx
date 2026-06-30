import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

import MainLayout from "../layout/MainLayout";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import DataTable from "../components/DataTable";

import PatientModal from "../components/PatientModal";
import PatientForm from "../components/PatientForm";

function Pacientes() {
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);

  const columnas = [
    "ID",
    "Nombre",
    "Teléfono",
    "Edad",
    "Ciudad",
    "Acciones"
  ];

  const [pacientes, setPacientes] = useState<any[][]>([]);

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

    if (!data) return;

    const filas = data.map((p) => [
      p.id?.toString() || "",
      `${p.nombres} ${p.apellidos}`,
      p.telefono || "",
      p.edad?.toString() || "",
      p.ciudad || "",
      p
    ]);

    setPacientes(filas);
  }

  function editarPaciente(paciente: any) {
    setPacienteSeleccionado(paciente);
    setOpenModal(true);
  }

  async function eliminarPaciente(paciente: any) {
    const confirmar = window.confirm(
      `¿Eliminar a ${paciente.nombres} ${paciente.apellidos}?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("pacientes")
      .delete()
      .eq("id", paciente.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Paciente eliminado correctamente");

    cargarPacientes();

     }

   const { data, error } = await supabase
  .from("pacientes")
  .select("*")
  .order("id");

console.log(data);
console.log(error);
    
  return (
    <MainLayout>
      <PageHeader
        titulo="Pacientes"
        subtitulo="Gestión de pacientes registrados"
      />

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
          onClick={() => {
            setPacienteSeleccionado(null);
            setOpenModal(true);
          }}
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
        onEditar={editarPaciente}
        onEliminar={eliminarPaciente}
      />

      <PatientModal
        isOpen={openModal}
        title={
          pacienteSeleccionado
            ? "Editar Paciente"
            : "Nuevo Paciente"
        }
        onClose={() => {
          setOpenModal(false);
          setPacienteSeleccionado(null);
        }}
      >
        <PatientForm
          paciente={pacienteSeleccionado}
          onClose={() => {
            setOpenModal(false);
            setPacienteSeleccionado(null);
          }}
          onPacienteGuardado={cargarPacientes}
        />
      </PatientModal>
    </MainLayout>
  );
}

export default Pacientes;
