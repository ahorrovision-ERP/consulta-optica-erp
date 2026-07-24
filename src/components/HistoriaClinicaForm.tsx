import { useState } from "react";
import { supabase } from "../lib/supabase";

interface Props {
  paciente: any;
  onClose: () => void;
  onGuardado: () => void;
}

function HistoriaClinicaForm({
  paciente,
  onClose,
  onGuardado
}: Props) {


  const [motivoConsulta, setMotivoConsulta] =
    useState("");

  const [antecedentes, setAntecedentes] =
    useState("");

  const [agudezaVisualOD, setAgudezaVisualOD] =
    useState("");

  const [agudezaVisualOI, setAgudezaVisualOI] =
    useState("");

  const [esferaOD, setEsferaOD] =
    useState("");

  const [esferaOI, setEsferaOI] =
    useState("");

  const [cilindroOD, setCilindroOD] =
    useState("");

  const [cilindroOI, setCilindroOI] =
    useState("");

  const [ejeOD, setEjeOD] =
    useState("");

  const [ejeOI, setEjeOI] =
    useState("");

  const [adicion, setAdicion] =
    useState("");

  const [distanciaPupilar, setDistanciaPupilar] =
    useState("");

  const [diagnostico, setDiagnostico] =
    useState("");

  const [tratamiento, setTratamiento] =
    useState("");

  const [observaciones, setObservaciones] =
    useState("");


  async function guardarHistoria(
    e: React.FormEvent
  ) {

    e.preventDefault();


    const { error } = await supabase
      .from("historias_clinicas")
      .insert([
        {
          paciente_id: paciente.id,

          motivo_consulta: motivoConsulta,

          antecedentes,

          agudeza_visual_od:
            agudezaVisualOD,

          agudeza_visual_oi:
            agudezaVisualOI,

          esfera_od:
            esferaOD,

          esfera_oi:
            esferaOI,

          cilindro_od:
            cilindroOD,

          cilindro_oi:
            cilindroOI,

          eje_od:
            ejeOD,

          eje_oi:
            ejeOI,

          adicion,

          distancia_pupilar:
            distanciaPupilar,

          diagnostico,

          tratamiento,

          observaciones
        }
      ]);


    if (error) {

      alert(error.message);

      return;

    }


    alert(
      "Historia clínica guardada correctamente"
    );


    onGuardado();

    onClose();

  }

        <div className="form-row">

        <div className="form-group">

          <label>
            Agudeza Visual OD
          </label>

          <input
            type="text"
            value={agudezaOD}
            onChange={(e) =>
              setAgudezaOD(e.target.value)
            }
            placeholder="Ej: 20/20"
          />

        </div>


        <div className="form-group">

          <label>
            Agudeza Visual OI
          </label>

          <input
            type="text"
            value={agudezaOI}
            onChange={(e) =>
              setAgudezaOI(e.target.value)
            }
            placeholder="Ej: 20/25"
          />

        </div>

      </div>



      {/* REFRACCIÓN */}

      <h3
        style={{
          marginTop:"30px",
          marginBottom:"15px"
        }}
      >
        👓 Refracción
      </h3>



      <div className="form-row">

        <div className="form-group">

          <label>
            OD Esfera
          </label>

          <input
            value={esferaOD}
            onChange={(e)=>
              setEsferaOD(e.target.value)
            }
          />

        </div>


        <div className="form-group">

          <label>
            OI Esfera
          </label>

          <input
            value={esferaOI}
            onChange={(e)=>
              setEsferaOI(e.target.value)
            }
          />

        </div>

      </div>



      <div className="form-row">


        <div className="form-group">

          <label>
            OD Cilindro
          </label>

          <input
            value={cilindroOD}
            onChange={(e)=>
              setCilindroOD(e.target.value)
            }
          />

        </div>



        <div className="form-group">

          <label>
            OI Cilindro
          </label>

          <input
            value={cilindroOI}
            onChange={(e)=>
              setCilindroOI(e.target.value)
            }
          />

        </div>


      </div>



      <div className="form-row">


        <div className="form-group">

          <label>
            OD Eje
          </label>

          <input
            value={ejeOD}
            onChange={(e)=>
              setEjeOD(e.target.value)
            }
          />

        </div>



        <div className="form-group">

          <label>
            OI Eje
          </label>

          <input
            value={ejeOI}
            onChange={(e)=>
              setEjeOI(e.target.value)
            }
          />

        </div>


      </div>




      {/* EXAMEN CLÍNICO */}


      <h3
        style={{
          marginTop:"30px",
          marginBottom:"15px"
        }}
      >
        🔬 Examen Clínico
      </h3>



      <div className="form-group">

        <label>
          Biomicroscopía
        </label>

        <textarea
          rows={3}
          value={biomicroscopia}
          onChange={(e)=>
            setBiomicroscopia(e.target.value)
          }
        />

      </div>



      <div className="form-group">

        <label>
          Tonometría
        </label>

        <textarea
          rows={3}
          value={tonometria}
          onChange={(e)=>
            setTonometria(e.target.value)
          }
        />

      </div>



      <div className="form-group">

        <label>
          Fondo de ojo
        </label>

        <textarea
          rows={3}
          value={fondoOjo}
          onChange={(e)=>
            setFondoOjo(e.target.value)
          }
        />

      </div>

              {/* DIAGNÓSTICO Y TRATAMIENTO */}

      <h3
        style={{
          marginTop:"30px",
          marginBottom:"15px"
        }}
      >
        🩺 Diagnóstico y Tratamiento
      </h3>



      <div className="form-group">

        <label>
          Diagnóstico
        </label>

        <textarea
          rows={3}
          value={diagnostico}
          onChange={(e)=>
            setDiagnostico(e.target.value)
          }
        />

      </div>



      <div className="form-group">

        <label>
          Tratamiento / Indicaciones
        </label>

        <textarea
          rows={3}
          value={tratamiento}
          onChange={(e)=>
            setTratamiento(e.target.value)
          }
        />

      </div>



      <div className="form-group">

        <label>
          Observaciones Generales
        </label>

        <textarea
          rows={4}
          value={observaciones}
          onChange={(e)=>
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
          Guardar Historia Clínica
        </button>


      </div>


    </form>

  );

}


export default HistoriaClinicaForm;
