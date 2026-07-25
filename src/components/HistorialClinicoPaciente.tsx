import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";


interface Props {

  paciente: any;

  onClose: () => void;

}



function HistorialClinicoPaciente({

  paciente,

  onClose

}: Props) {



  const [historias, setHistorias] =
    useState<any[]>([]);



  const [cargando, setCargando] =
    useState(true);





  async function cargarHistorias() {


    setCargando(true);



    const { data, error } =

      await supabase

        .from("historias_clinicas")

        .select("*")

        .eq(
          "paciente_id",
          paciente.id
        )

        .order(
          "fecha_registro",
          {
            ascending:false
          }
        );





    if(error){

      console.error(
        "Error cargando historias:",
        error.message
      );

      setCargando(false);

      return;

    }





    setHistorias(
      data || []
    );


    setCargando(false);


  }






  useEffect(()=>{


    cargarHistorias();


  }, []);








  return (

    <div>


      <div

        style={{

          display:"flex",

          justifyContent:"space-between",

          alignItems:"center",

          marginBottom:"25px"

        }}

      >



        <div>


          <h2
            style={{
              color:"#333",
              marginBottom:"5px"
            }}
          >

            📚 Historial Clínico

          </h2>



          <p
            style={{
              color:"#666"
            }}
          >

            {paciente.nombres} {paciente.apellidos}

          </p>


        </div>





        <button

          onClick={onClose}

          style={{

            border:"none",

            background:"#eee",

            padding:"10px 15px",

            borderRadius:"10px",

            cursor:"pointer"

          }}

        >

          ✕ Cerrar

        </button>



      </div>







      {
        cargando ?


        (

          <p>
            Cargando historial...
          </p>

        )


        :


        historias.length === 0 ?


        (

          <div

            style={{

              background:"#f8f9fb",

              padding:"25px",

              borderRadius:"15px",

              textAlign:"center",

              color:"#666"

            }}

          >

            Este paciente aún no tiene historias clínicas registradas.


          </div>

        )


        :


        (

          <div

            style={{

              display:"grid",

              gap:"20px"

            }}

          >



          {

            historias.map(

              (historia)=>(


                <div

                  key={
                    historia.id
                  }


                  style={{

                    background:"#f8f9fb",

                    borderRadius:"15px",

                    padding:"25px",

                    border:"1px solid #eee"

                  }}

                >



                  <h3
                    style={{
                      color:"#cc001f",
                      marginBottom:"15px"
                    }}
                  >

                    📅 {

                      new Date(
                        historia.fecha_registro
                      )
                      .toLocaleDateString(
                        "es-CL"
                      )

                    }


                  </h3>





                  <p>

                    <strong>
                      Motivo:
                    </strong>

                    {" "}

                    {
                      historia.motivo_consulta ||
                      "Sin registro"
                    }


                  </p>





                  <p>

                    <strong>
                      Diagnóstico:
                    </strong>

                    {" "}

                    {
                      historia.diagnostico ||
                      "Sin diagnóstico"
                    }


                  </p>





                  <p>

                    <strong>
                      Tratamiento:
                    </strong>

                    {" "}

                    {
                      historia.tratamiento ||
                      "Sin tratamiento"
                    }


                  </p>





                  <p>

                    <strong>
                      Observaciones:
                    </strong>

                    {" "}

                    {
                      historia.observaciones ||
                      "Sin observaciones"
                    }


                  </p>





                  <div

                    style={{

                      marginTop:"20px",

                      display:"flex",

                      gap:"10px"

                    }}

                  >



                    <button

                      style={{

                        background:"#333",

                        color:"#fff",

                        border:"none",

                        padding:"10px 15px",

                        borderRadius:"8px",

                        cursor:"pointer"

                      }}

                    >

                      👁 Ver detalle

                    </button>




                    <button

                      style={{

                        background:"#cc001f",

                        color:"#fff",

                        border:"none",

                        padding:"10px 15px",

                        borderRadius:"8px",

                        cursor:"pointer"

                      }}

                    >

                      🖨 Imprimir

                    </button>




                  </div>



                </div>


              )

            )


          }



          </div>

        )

      }


    </div>

  );


}



export default HistorialClinicoPaciente;
