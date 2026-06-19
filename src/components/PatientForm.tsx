import { useState } from "react";
import { supabase } from "../lib/supabase";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

function PatientForm({ onClose, onSaved }: Props) {

  const [nombre, setNombre] = useState("");
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
          nombres: nombre,
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

    alert("Paciente guardado");

    onSaved();

    onClose();

  }

  return (

    <form onSubmit={guardarPaciente}>

      {/* FILA 1 */}

      <div className="form-row">

        <div className="form-group">

          <label>Nombre completo</label>

          <input
            type="text"
            value={nombre}
            onChange={(e) =>
              setNombre(e.target.value)
            }
          />

        </div>

        <div className="form-group">

          <label>RUT</label>

          <input
            type="text"
            value={rut}
            onChange={(e) =>
              setRut(e.target.value)
            }
          />

        </div>

      </div>


      {/* FILA 2 */}

      <div className="form-row">

        <div className="form-group">

          <label>Teléfono</label>

          <input
            type="text"
            value={telefono}
            onChange={(e) =>
              setTelefono(e.target.value)
            }
          />

        </div>

        <div className="form-group">

          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

        </div>

      </div>


      {/* FILA 3 */}

      <div className="form-row">

        <div className="form-group">

          <label>Ciudad</label>

          <input
            type="text"
            value={ciudad}
            onChange={(e) =>
              setCiudad(e.target.value)
            }
          />

        </div>

        <div className="form-group">

          <label>Dirección</label>

          <input
            type="text"
            value={direccion}
            onChange={(e) =>
              setDireccion(e.target.value)
            }
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
