import { useEffect, useState } from "react";
import MainLayout from "../layout/MainLayout";
import PageHeader from "../components/PageHeader";
import HistoriaClinicaForm from "../components/HistoriaClinicaForm";
import { supabase } from "../lib/supabase";


interface Paciente {
  id: number;
  ficha: string | null;
  rut: string | null;
  nombres: string;
  apellidos: string | null;
  telefono: string | null;
}


function HistoriaClinica() {


  const [pacientes, setPacientes] =
    useState<Paciente[]>([]);


  const [busqueda, setBusqueda] =
    useState("");


  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<Paciente | null>(null);


  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);



  async function cargarPacientes() {


    const { data, error } =
      await supabase
        .from("pacientes")
        .select(
          `
          id,
          ficha,
          rut,
          nombres,
          apellidos,
          telefono
          `
        )
        .order(
          "nombres",
          {
            ascending:true
          }
        );



    if(error){

      console.error(
        "Error cargando pacientes:",
        error.message
      );

      return;

    }



    setPacientes(
      data || []
    );

  }





  useEffect(() => {

    cargarPacientes();

  }, []);





  const pacientesFiltrados =
    pacientes.filter((paciente)=>{


      const texto =
        `${paciente.nombres}
        ${paciente.apellidos}
        ${paciente.rut}
        ${paciente.ficha}`
        .toLowerCase();



      return texto.includes(
        busqueda.toLowerCase()
      );


    });





  function abrirFormulario(
    paciente: Paciente
  ){

    setPacienteSeleccionado(
      paciente
    );


    setMostrarFormulario(
      true
    );

  }





  function cerrarFormulario(){

    setMostrarFormulario(
      false
    );


    setPacienteSeleccionado(
      null
    );

  }





  return (

    <MainLayout>


      <PageHeader
        titulo="Historia Clínica"
        subtitulo="Consulta y administración de historias clínicas de pacientes"
      />



      <div
        style={{
          background:"#ffffff",
          borderRadius:"20px",
          padding:"35px",
          boxShadow:"0 8px 25px rgba(0,0,0,.08)"
        }}
      >



        <h2
          style={{
            color:"#333",
            marginBottom:"20px"
          }}
        >
          👤 Buscar Paciente
        </h2>




        <input

          type="text"

          placeholder="Buscar por nombre, RUT o ficha..."

          value={busqueda}

          onChange={(e)=>
            setBusqueda(
              e.target.value
            )
          }


          style={{
            width:"100%",
            padding:"14px",
            borderRadius:"12px",
            border:"1px solid #ddd",
            fontSize:"16px",
            marginBottom:"25px"
          }}

        />




        <div
          style={{
            display:"grid",
            gap:"15px"
          }}
        >

           
          {pacientesFiltrados.length === 0 && (

            <div
              style={{
                background:"#f8f9fb",
                padding:"25px",
                borderRadius:"15px",
                textAlign:"center",
                color:"#666"
              }}
            >

              No se encontraron pacientes.

            </div>

          )}






          {pacientesFiltrados.map(
            (paciente)=>(


              <div
                key={paciente.id}

                style={{
                  background:"#f8f9fb",
                  borderRadius:"15px",
                  padding:"20px",
                  display:"flex",
                  justifyContent:"space-between",
                  alignItems:"center",
                  gap:"20px"
                }}

              >



                <div>


                  <h3
                    style={{
                      marginBottom:"8px",
                      color:"#333"
                    }}
                  >

                    👤 {paciente.nombres} {paciente.apellidos}

                  </h3>



                  <p
                    style={{
                      margin:"4px 0",
                      color:"#666"
                    }}
                  >

                    📋 Ficha:
                    {" "}
                    {paciente.ficha || "Sin ficha"}

                  </p>




                  <p
                    style={{
                      margin:"4px 0",
                      color:"#666"
                    }}
                  >

                    🪪 RUT:
                    {" "}
                    {paciente.rut || "Sin RUT"}

                  </p>




                  <p
                    style={{
                      margin:"4px 0",
                      color:"#666"
                    }}
                  >

                    📞 Teléfono:
                    {" "}
                    {paciente.telefono || "Sin teléfono"}

                  </p>


                </div>






                <button

                  onClick={()=>
                    abrirFormulario(
                      paciente
                    )
                  }


                  style={{
                    background:"#cc001f",
                    color:"#fff",
                    border:"none",
                    padding:"12px 20px",
                    borderRadius:"10px",
                    cursor:"pointer",
                    fontWeight:"600"
                  }}

                >

                  🩺 Nueva Historia

                </button>



              </div>


            )

          )}



        </div>



      </div>







      {mostrarFormulario &&
        pacienteSeleccionado && (


          <div
            style={{
              position:"fixed",
              top:0,
              left:0,
              width:"100%",
              height:"100%",
              background:"rgba(0,0,0,.45)",
              display:"flex",
              justifyContent:"center",
              alignItems:"center",
              padding:"20px",
              zIndex:9999,
              overflowY:"auto"
            }}
          >



            <div
              style={{
                background:"#fff",
                borderRadius:"20px",
                padding:"30px",
                width:"100%",
                maxWidth:"900px",
                maxHeight:"90vh",
                overflowY:"auto"
              }}
            >



              <div
                style={{
                  display:"flex",
                  justifyContent:"space-between",
                  alignItems:"center",
                  marginBottom:"20px"
                }}
              >



                <h2>
                  Historia Clínica
                </h2>



                <button

                  onClick={
                    cerrarFormulario
                  }


                  style={{
                    border:"none",
                    background:"#eee",
                    borderRadius:"50%",
                    width:"35px",
                    height:"35px",
                    cursor:"pointer",
                    fontSize:"18px"
                  }}

                >

                  ✕


                </button>



              </div>





              <HistoriaClinicaForm

                paciente={
                  pacienteSeleccionado
                }


                onClose={
                  cerrarFormulario
                }


                onGuardado={()=>{
                  
                  cerrarFormulario();

                  cargarPacientes();

                }}


              />



            </div>


          </div>


        )

      }




    </MainLayout>

  );

}


export default HistoriaClinica;
