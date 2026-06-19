import { useState } from "react";
import { supabase } from "../lib/supabase";

interface Props {
  onClose: () => void;
  onPacienteGuardado: () => void;
  paciente?: any;
}

function PatientForm({
  onClose,
  onPacienteGuardado,
  paciente
}: Props) {

  const [nombres, setNombres] =
    useState(paciente?.nombres || "");

  const [apellidos, setApellidos] =
    useState(paciente?.apellidos || "");

  const [rut, setRut] =
    useState(paciente?.rut || "");

  const [fechaNacimiento, setFechaNacimiento] =
    useState(paciente?.fecha_nacimiento || "");

  const [edad, setEdad] =
    useState(
      paciente?.edad?.toString() || ""
    );

  const [sexo, setSexo] =
    useState(paciente?.sexo || "");

  const [telefono, setTelefono] =
    useState(paciente?.telefono || "");

  const [email, setEmail] =
    useState(paciente?.email || "");

  const [direccion, setDireccion] =
    useState(paciente?.direccion || "");

  const [comuna, setComuna] =
    useState(paciente?.comuna || "");

  const [ciudad, setCiudad] =
    useState(paciente?.ciudad || "");

  const [ocupacion, setOcupacion] =
    useState(paciente?.ocupacion || "");

  const [observaciones, setObservaciones] =
    useState(
      paciente?.observaciones || ""
    );



  async function guardarPaciente(
    e: React.FormEvent
  ) {

    e.preventDefault();

    let error;

    if (paciente) {

      const resultado = await supabase
        .from("pacientes")
        .update({
          nombres,
          apellidos,
          rut,
          fecha_nacimiento: fechaNacimiento,
          edad: Number(edad),
          sexo,
          telefono,
          email,
          direccion,
          comuna,
          ciudad,
          ocupacion,
          observaciones
        })
        .eq("id", paciente.id);

      error = resultado.error;

    } else {

      const resultado = await supabase
        .from("pacientes")
        .insert([
          {
            nombres,
            apellidos,
            rut,
            fecha_nacimiento: fechaNacimiento,
            edad: Number(edad),
            sexo,
            telefono,
            email,
            direccion,
            comuna,
            ciudad,
            ocupacion,
            observaciones
          }
        ]);

      error = resultado.error;

    }


    if (error) {

      alert(error.message);
      return;

    }


    if (paciente)
      alert("Paciente actualizado correctamente");
    else
      alert("Paciente guardado correctamente");


    onPacienteGuardado();

    onClose();

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

          <label>Fecha nacimiento</label>

          <input
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
          />

        </div>

      </div>



      {/* FILA 3 */}

      <div className="form-row">

        <div className="form-group">

          <label>Edad</label>

          <input
            type="number"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
          />

        </div>


        <div className="form-group">

          <label>Sexo</label>

          <select
            value={sexo}
            onChange={(e) => setSexo(e.target.value)}
          >

            <option value="">Seleccione</option>
            <option>Masculino</option>
            <option>Femenino</option>

          </select>

        </div>

      </div>



      {/* FILA 4 */}

      <div className="form-row">

        <div className="form-group">

          <label>Teléfono</label>

          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />

        </div>


        <div className="form-group">

          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

        </div>

      </div>



      {/* FILA 5 */}

      <div className="form-row">

        <div className="form-group">

          <label>Dirección</label>

          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
          />

        </div>


        <div className="form-group">

          <label>Comuna</label>

          <input
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
          />

        </div>

      </div>



      {/* FILA 6 */}

      <div className="form-row">

        <div className="form-group">

          <label>Ciudad</label>

          <input
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
          />

        </div>


        <div className="form-group">

          <label>Ocupación</label>

          <input
            value={ocupacion}
            onChange={(e) => setOcupacion(e.target.value)}
          />

        </div>

      </div>



      {/* OBSERVACIONES */}

      <div className="form-group">

        <label>Observaciones</label>

        <textarea
          rows={5}
          value={observaciones}
          onChange={(e) =>
            setObservaciones(e.target.value)
          }
        />

      </div>



      {/* BOTONES */}

      <div className="form-buttons">

        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
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

