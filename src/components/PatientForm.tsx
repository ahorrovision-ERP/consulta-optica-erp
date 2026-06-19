import { useState } from "react";
import { supabase } from "../lib/supabase";

interface Props {
  onClose: () => void;
  onPacienteGuardado: () => void;
}

function PatientForm({
  onClose,
  onPacienteGuardado
}: Props) {

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [rut, setRut] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [comuna, setComuna] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [ocupacion, setOcupacion] = useState("");
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


    if (error) {

      alert(error.message);
      return;

    }

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
```
