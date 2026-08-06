import LogoOptica from "./LogoOptica";

interface Props {

  paciente: any;

  historia: any;

}



function FichaClinicaDocumento({

  paciente,

  historia

}: Props) {



 return (

<div
  className="print-area"
  style={{
    background:"#ffffff",

    padding:"40px",

    borderRadius:"10px",

    color:"#333",

    fontFamily:"Arial, sans-serif",

    boxSizing:"border-box",

    width:"100%",

    maxWidth:"100%"

  }}
>



      {/* CABECERA */}


      <div

        style={{

          display:"flex",

          justifyContent:"space-between",

          alignItems:"center",

          borderBottom:"2px solid #cc001f",

          paddingBottom:"20px",

          marginBottom:"25px"

        }}

      >



        <LogoOptica />





        <div

          style={{

            textAlign:"right"

          }}

        >


          <h1
  style={{
    margin: 0,
    color: "#cc001f",
    fontSize: "28px",
    lineHeight: "1.1",
    whiteSpace: "normal"
  }}
>

            Ahorro Visión ERP

          </h1>




          <h3
  style={{
    marginTop: "8px",
    marginBottom: 0,
    color: "#555",
    fontSize: "16px"
  }}
>
            Ficha Clínica Óptica

          </h3>



        </div>



      </div>







      {/* DATOS PACIENTE */}


      <section>


        <h3

          style={{

            background:"#f5f5f5",

            padding:"10px",

            borderRadius:"8px"

          }}

        >

          👤 Datos del Paciente

        </h3>



        <div

          style={{

            display:"grid",

            gridTemplateColumns:"1fr 1fr",

            gap:"10px"

          }}

        >


          <p>

            <strong>
              Nombre:
            </strong>

            {" "}

            {paciente.nombres}

            {" "}

            {paciente.apellidos}

          </p>



          <p>

            <strong>
              RUT:
            </strong>

            {" "}

            {paciente.rut || "-"}

          </p>



          <p>

            <strong>
              Ficha:
            </strong>

            {" "}

            {paciente.ficha || "-"}

          </p>



          <p>

            <strong>
              Teléfono:
            </strong>

            {" "}

            {paciente.telefono || "-"}

          </p>


        </div>


      </section>






      {/* CONSULTA */}


      <section>


        <h3

          style={{

            background:"#f5f5f5",

            padding:"10px",

            borderRadius:"8px",

            marginTop:"25px"

          }}

        >

          📝 Consulta

        </h3>



        <p>

          <strong>
            Fecha:
          </strong>

          {" "}

          {

            historia.fecha_registro

            ?

            new Date(
              historia.fecha_registro
            )
            .toLocaleDateString(
              "es-CL"
            )

            :

            "-"

          }

        </p>




        <p>

          <strong>
            Motivo:
          </strong>

          {" "}

          {

            historia.motivo_consulta ||

            "-"

          }

        </p>




        <p>

          <strong>
            Antecedentes:
          </strong>

          <br/>

          {

            historia.antecedentes ||

            "-"

          }

        </p>



      </section>

            {/* REFRACCIÓN */}


      <section>


        <h3

          style={{

            background:"#f5f5f5",

            padding:"10px",

            borderRadius:"8px",

            marginTop:"25px"

          }}

        >

          👓 Refracción

        </h3>





        <table

  style={{

    width:"100%",

    maxWidth:"100%",

    borderCollapse:"collapse",

    marginTop:"15px",

    tableLayout:"fixed"

  }}

>



          <thead>


            <tr>


              <th

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  background:"#eeeeee"

                }}

              >

                OJO

              </th>


              <th

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  background:"#eeeeee",

                  width:"12%"

                }}

              >

                ESFERA

              </th>



              <th

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  background:"#eeeeee",

                  width:"22%"

                }}

              >

                CILINDRO

              </th>



              <th

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  background:"#eeeeee",

                  width:"22%"

                }}

              >

                EJE

              </th>



              <th

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  background:"#eeeeee",

                  width:"20%"

                }}

              >

                AV

              </th>



            </tr>


          </thead>





          <tbody>



            <tr>


              <td

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  textAlign:"center",

                  fontWeight:"bold"

                }}

              >

                OD

              </td>


              <td

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  textAlign:"center"

                }}

              >

                {historia.esfera_od || "-"}

              </td>



              <td

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  textAlign:"center"

                }}

              >

                {historia.cilindro_od || "-"}

              </td>




              <td

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  textAlign:"center"

                }}

              >

                {historia.eje_od || "-"}

              </td>




              <td

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  textAlign:"center"

                }}

              >

                {historia.agudeza_visual_od || "-"}

              </td>



            </tr>







            <tr>


              <td

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  textAlign:"center",

                  fontWeight:"bold"

                }}

              >

                OI

              </td>



              <td

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  textAlign:"center"

                }}

              >

                {historia.esfera_oi || "-"}

              </td>




              <td

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  textAlign:"center"

                }}

              >

                {historia.cilindro_oi || "-"}

              </td>




              <td

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  textAlign:"center"

                }}

              >

                {historia.eje_oi || "-"}

              </td>




              <td

                style={{

                  border:"1px solid #ccc",

                  padding:"10px",

                  textAlign:"center"

                }}

              >

                {historia.agudeza_visual_oi || "-"}

              </td>



            </tr>



          </tbody>



        </table>






        <div

          style={{

            display:"grid",

            gridTemplateColumns:"1fr 1fr",

            gap:"15px",

            marginTop:"20px"

          }}

        >



          <div

            style={{

              border:"1px solid #ddd",

              padding:"12px",

              borderRadius:"8px"

            }}

          >

            <strong>
              Adición:
            </strong>


            {" "}

            {historia.adicion || "-"}


          </div>





          <div

            style={{

              border:"1px solid #ddd",

              padding:"12px",

              borderRadius:"8px"

            }}

          >

            <strong>
              Distancia Pupilar:
            </strong>


            {" "}

            {historia.distancia_pupilar || "-"}


          </div>



        </div>


      </section>








      {/* EXAMEN CLÍNICO */}



      <section>


        <h3

          style={{

            background:"#f5f5f5",

            padding:"10px",

            borderRadius:"8px",

            marginTop:"25px"

          }}

        >

          🔬 Examen Clínico

        </h3>





        <div

          style={{

            border:"1px solid #ddd",

            borderRadius:"8px",

            padding:"15px",

            marginBottom:"10px"

          }}

        >

          <strong>
            Biomicroscopía
          </strong>


          <p>

            {historia.biomicroscopia || "-"}

          </p>


        </div>





        <div

          style={{

            border:"1px solid #ddd",

            borderRadius:"8px",

            padding:"15px",

            marginBottom:"10px"

          }}

        >

          <strong>
            Tonometría
          </strong>


          <p>

            {historia.tonometria || "-"}

          </p>


        </div>





        <div

          style={{

            border:"1px solid #ddd",

            borderRadius:"8px",

            padding:"15px"

          }}

        >

          <strong>
            Fondo de Ojo
          </strong>


          <p>

            {historia.fondo_ojo || "-"}

          </p>


        </div>



      </section>

            {/* DIAGNÓSTICO */}


      <section>


        <h3

          style={{

            background:"#f5f5f5",

            padding:"10px",

            borderRadius:"8px",

            marginTop:"25px"

          }}

        >

          🩺 Diagnóstico

        </h3>




        <div

          style={{

            border:"1px solid #ddd",

            borderRadius:"8px",

            padding:"15px",

            minHeight:"70px"

          }}

        >

          {

            historia.diagnostico ||

            "Sin diagnóstico registrado"

          }


        </div>



      </section>







      {/* TRATAMIENTO */}


      <section>


        <h3

          style={{

            background:"#f5f5f5",

            padding:"10px",

            borderRadius:"8px",

            marginTop:"25px"

          }}

        >

          💊 Tratamiento / Indicaciones

        </h3>





        <div

          style={{

            border:"1px solid #ddd",

            borderRadius:"8px",

            padding:"15px",

            minHeight:"70px"

          }}

        >


          {

            historia.tratamiento ||

            "Sin tratamiento registrado"

          }


        </div>



      </section>







      {/* OBSERVACIONES */}


      <section>


        <h3

          style={{

            background:"#f5f5f5",

            padding:"10px",

            borderRadius:"8px",

            marginTop:"25px"

          }}

        >

          📝 Observaciones Generales

        </h3>





        <div

          style={{

            border:"1px solid #ddd",

            borderRadius:"8px",

            padding:"15px",

            minHeight:"80px"

          }}

        >


          {

            historia.observaciones ||

            "Sin observaciones"

          }


        </div>



      </section>








      {/* FIRMA PROFESIONAL */}



      <div

        style={{

          display:"grid",

          gridTemplateColumns:"1fr 1fr",

          gap:"40px",

          marginTop:"60px",

          textAlign:"center"

        }}

      >



        <div>


          <div

            style={{

              borderTop:"1px solid #333",

              paddingTop:"10px"

            }}

          >

            Profesional / Óptico

          </div>


        </div>





        <div>


          <div

            style={{

              borderTop:"1px solid #333",

              paddingTop:"10px"

            }}

          >

            Firma Paciente

          </div>


        </div>



      </div>








      {/* PIE DOCUMENTO */}



      <div

        style={{

          marginTop:"40px",

          paddingTop:"20px",

          borderTop:"1px solid #ddd",

          textAlign:"center",

          color:"#777",

          fontSize:"12px"

        }}

      >


        <p>

          Ahorro Visión ERP

        </p>


        <p>

          Documento generado electrónicamente

        </p>


        <p>

          Fecha emisión:

          {" "}

          {

            new Date()

            .toLocaleDateString(

              "es-CL"

            )

          }

        </p>



      </div>





    </div>

  );


}



export default FichaClinicaDocumento;
