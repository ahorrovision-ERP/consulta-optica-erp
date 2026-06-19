import { useState } from "react";
import { supabase } from "../lib/supabase";

function PatientForm() {

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [rut, setRut] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [observaciones, setObservaciones] = useState("");

  async function guardarPaciente(
    e: React.FormEvent
  ) {

    e.preventDefault();

    const { error } = await supabase
      .from("pacientes")
      .insert([
        {
          nombres,
          apellidos,
          rut,
          telefono,
          email,
          ciudad,
          direccion,
          observaciones
        }
      ]);

    if (error) {

      alert("Error al guardar");

      console.log(error);

      return;
    }

    alert("Paciente guardado correctamente");

    window.location.reload();
  }

  return (

    <form onSubmit={guardarPaciente}>

      {/* FILA 1 */}

      <div className="form-row">

        <div className="form-group">
          <label>Nombres</label>

          <input
            type="text"
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Apellidos</label>

          <input
            type="text"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
          />
        </div>

      </div>


      {/* FILA 2 */}

      <div className="form-row">

        <div className="form-group">
          <label>RUT</label>

          <input
            type="text"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Teléfono</label>

          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>

      </div>


      {/* FILA 3 */}

      <div className="form-row">

        <div className="form-group">
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Ciudad</label>

          <input
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
          />
        </div>

      </div>


      {/* FILA 4 */}

      <div className="form-group">

        <label>Dirección</label>

        <input
          type="text"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
        />

      </div>


      {/* OBSERVACIONES */}

      <div className="form-group">

        <label>Observaciones</label>

        <textarea
          rows={5}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        ></textarea>

      </div>


      {/* BOTONES */}

      <div className="form-buttons">

        <button
          type="button"
          className="btn-secondary"
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="btn-primary"
        >
          Guardar Paciente
        </button>

      </div>

    </form>

  );

}

export default PatientForm;
