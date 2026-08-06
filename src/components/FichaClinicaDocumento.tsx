import LogoOptica from "./LogoOptica";

interface Props {
  paciente: any;
  historia: any;
}

function FichaClinicaDocumento({
  paciente,
  historia
}: Props) {

  const fechaConsulta = historia.fecha_registro
    ? new Date(historia.fecha_registro).toLocaleDateString("es-CL")
    : "-";

  const fechaEmision = new Date().toLocaleDateString("es-CL");

  return (
    <>
      {/* =====================================================
          ESTILOS EXCLUSIVOS DE IMPRESIÓN
          ===================================================== */}

      <style>
        {`
          @media print {

            @page {
              size: A5 portrait;
              margin: 0;
            }

            html,
            body {
              width: 148mm !important;
              min-width: 148mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }

            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /*
              Ocultar toda la aplicación.
            */

            body * {
              visibility: hidden !important;
            }

            /*
              Mostrar únicamente la ficha.
            */

            .print-area,
            .print-area * {
              visibility: visible !important;
            }

            /*
              HOJA REAL A5
            */

            .print-area {
              position: absolute !important;

              left: 0 !important;
              top: 0 !important;

              width: 148mm !important;
              min-width: 148mm !important;
              max-width: 148mm !important;

              margin: 0 !important;
              padding: 0 !important;

              background: #ffffff !important;

              border: none !important;
              border-radius: 0 !important;

              box-shadow: none !important;

              overflow: visible !important;

              box-sizing: border-box !important;

              font-family: Arial, Helvetica, sans-serif !important;

              color: #333333 !important;
            }

            /*
              CONTENEDOR INTERNO
            */

            .print-page {
              width: 148mm !important;
              min-width: 148mm !important;
              max-width: 148mm !important;

              min-height: 210mm !important;

              box-sizing: border-box !important;

              padding: 7mm !important;

              margin: 0 !important;

              background: #ffffff !important;

              overflow: visible !important;
            }

            /*
              CABECERA
            */

            .print-header {
              display: grid !important;

              grid-template-columns: 32mm 1fr !important;

              column-gap: 5mm !important;

              align-items: center !important;

              width: 100% !important;

              min-width: 0 !important;

              padding-bottom: 5mm !important;

              margin-bottom: 5mm !important;

              border-bottom: 1.5px solid #cc001f !important;
            }

            .print-logo {
              width: 32mm !important;

              min-width: 0 !important;

              max-width: 32mm !important;

              display: flex !important;

              align-items: center !important;

              justify-content: flex-start !important;

              overflow: hidden !important;
            }

            .print-logo img {
              display: block !important;

              width: auto !important;

              max-width: 30mm !important;

              max-height: 18mm !important;

              object-fit: contain !important;
            }

            .print-title {
              min-width: 0 !important;

              width: 100% !important;

              text-align: right !important;

              overflow: visible !important;

              word-break: normal !important;

              overflow-wrap: normal !important;
            }

            .print-title h1 {
              display: block !important;

              width: 100% !important;

              max-width: 100% !important;

              margin: 0 !important;

              padding: 0 !important;

              color: #cc001f !important;

              font-size: 17px !important;

              line-height: 1.15 !important;

              font-weight: 700 !important;

              white-space: normal !important;

              word-break: normal !important;

              overflow-wrap: normal !important;

              overflow: visible !important;
            }

            .print-title h3 {
              display: block !important;

              width: 100% !important;

              max-width: 100% !important;

              margin: 2mm 0 0 0 !important;

              padding: 0 !important;

              color: #555555 !important;

              font-size: 10px !important;

              line-height: 1.2 !important;

              font-weight: 600 !important;

              white-space: normal !important;

              word-break: normal !important;

              overflow-wrap: normal !important;

              overflow: visible !important;
            }

            /*
              SECCIONES
            */

            .print-section {
              width: 100% !important;

              max-width: 100% !important;

              min-width: 0 !important;

              margin: 0 0 4mm 0 !important;

              padding: 0 !important;

              box-sizing: border-box !important;

              overflow: visible !important;
            }

            /*
              TITULOS DE SECCIÓN
            */

            .print-section-title {
              width: 100% !important;

              max-width: 100% !important;

              box-sizing: border-box !important;

              background: #f1f1f1 !important;

              border-radius: 2mm !important;

              padding: 2mm 2.5mm !important;

              margin: 0 0 2.5mm 0 !important;

              color: #333333 !important;

              font-size: 10px !important;

              line-height: 1.2 !important;

              font-weight: 700 !important;

              break-after: avoid !important;

              page-break-after: avoid !important;
            }

            /*
              DATOS DEL PACIENTE
            */

            .patient-grid {
              display: grid !important;

              grid-template-columns: 1fr 1fr !important;

              gap: 1.5mm 5mm !important;

              width: 100% !important;

              max-width: 100% !important;

              min-width: 0 !important;
            }

            .patient-item {
              min-width: 0 !important;

              max-width: 100% !important;

              font-size: 8.5px !important;

              line-height: 1.3 !important;

              overflow-wrap: anywhere !important;

              word-break: normal !important;
            }

            /*
              TEXTO GENERAL
            */

            .print-area p {
              margin: 0 0 2mm 0 !important;

              padding: 0 !important;

              font-size: 8.5px !important;

              line-height: 1.35 !important;

              overflow-wrap: anywhere !important;

              word-break: normal !important;
            }

            /*
              REFRACCIÓN
            */

            .refraction-table {
              width: 100% !important;

              max-width: 100% !important;

              min-width: 0 !important;

              table-layout: fixed !important;

              border-collapse: collapse !important;

              border-spacing: 0 !important;

              margin: 0 !important;

              padding: 0 !important;

              font-size: 8px !important;

              break-inside: avoid !important;

              page-break-inside: avoid !important;
            }

            .refraction-table th,
            .refraction-table td {
              box-sizing: border-box !important;

              border: 1px solid #c8c8c8 !important;

              padding: 1.8mm 1mm !important;

              text-align: center !important;

              vertical-align: middle !important;

              line-height: 1.15 !important;

              min-width: 0 !important;

              overflow: hidden !important;

              overflow-wrap: normal !important;

              word-break: normal !important;

              white-space: normal !important;
            }

            .refraction-table th {
              background: #eeeeee !important;

              font-size: 7.5px !important;

              font-weight: 700 !important;
            }

            .refraction-table th:nth-child(1),
            .refraction-table td:nth-child(1) {
              width: 17% !important;
            }

            .refraction-table th:nth-child(2),
            .refraction-table td:nth-child(2) {
              width: 20% !important;
            }

            .refraction-table th:nth-child(3),
            .refraction-table td:nth-child(3) {
              width: 22% !important;
            }

            .refraction-table th:nth-child(4),
            .refraction-table td:nth-child(4) {
              width: 17% !important;
            }

            .refraction-table th:nth-child(5),
            .refraction-table td:nth-child(5) {
              width: 24% !important;
            }

            /*
              ADICIÓN / DISTANCIA PUPILAR
            */

            .refraction-extra {
              display: grid !important;

              grid-template-columns: 1fr 1fr !important;

              gap: 2.5mm !important;

              width: 100% !important;

              max-width: 100% !important;

              margin-top: 2.5mm !important;
            }

            .refraction-box {
              min-width: 0 !important;

              max-width: 100% !important;

              box-sizing: border-box !important;

              border: 1px solid #dddddd !important;

              border-radius: 1.5mm !important;

              padding: 2mm !important;

              font-size: 8px !important;

              line-height: 1.25 !important;

              overflow-wrap: anywhere !important;
            }

            /*
              EXAMEN CLÍNICO
            */

            .clinical-box {
              width: 100% !important;

              max-width: 100% !important;

              min-width: 0 !important;

              box-sizing: border-box !important;

              border: 1px solid #dddddd !important;

              border-radius: 1.5mm !important;

              padding: 2.5mm !important;

              margin: 0 0 2mm 0 !important;

              font-size: 8px !important;

              line-height: 1.3 !important;

              overflow-wrap: anywhere !important;

              break-inside: avoid !important;

              page-break-inside: avoid !important;
            }

            .clinical-box strong {
              display: block !important;

              margin-bottom: 1mm !important;

              font-size: 8px !important;
            }

            .clinical-box p {
              margin: 0 !important;

              font-size: 8px !important;
            }

            /*
              DIAGNÓSTICO / TRATAMIENTO / OBSERVACIONES
            */

            .text-box {
              width: 100% !important;

              max-width: 100% !important;

              min-width: 0 !important;

              box-sizing: border-box !important;

              border: 1px solid #dddddd !important;

              border-radius: 1.5mm !important;

              padding: 2.5mm !important;

              font-size: 8px !important;

              line-height: 1.35 !important;

              overflow-wrap: anywhere !important;

              word-break: normal !important;

              break-inside: auto !important;

              page-break-inside: auto !important;
            }

            /*
              FIRMA
            */

            .signature-area {
              display: grid !important;

              grid-template-columns: 1fr 1fr !important;

              gap: 8mm !important;

              width: 100% !important;

              max-width: 100% !important;

              margin-top: 10mm !important;

              text-align: center !important;

              font-size: 8px !important;
            }

            .signature-line {
              border-top: 1px solid #333333 !important;

              padding-top: 2mm !important;
            }

            /*
              PIE
            */

            .document-footer {
              width: 100% !important;

              max-width: 100% !important;

              box-sizing: border-box !important;

              margin-top: 6mm !important;

              padding-top: 2.5mm !important;

              border-top: 1px solid #dddddd !important;

              text-align: center !important;

              color: #777777 !important;

              font-size: 6.5px !important;

              line-height: 1.3 !important;
            }

            .document-footer p {
              margin: 0 0 1mm 0 !important;

              font-size: 6.5px !important;
            }

            /*
              IMPORTANTE:
              No permitir anchos mayores a la hoja.
            */

            .print-area *,
            .print-page * {
              max-width: 100% !important;

              box-sizing: border-box !important;
            }

            /*
              Los botones no se imprimen.
            */

            button,
            input,
            select,
            textarea {
              display: none !important;
            }
          }
        `}
      </style>


      {/* =====================================================
          CONTENEDOR PRINCIPAL
          ===================================================== */}

      <div
        className="print-area"
        style={{
          background: "#ffffff",
          padding: "40px",
          borderRadius: "10px",
          color: "#333",
          fontFamily: "Arial, sans-serif",
          boxSizing: "border-box",
          width: "100%",
          maxWidth: "100%"
        }}
      >

        {/* ===================================================
            HOJA
            =================================================== */}

        <div
          className="print-page"
          style={{
            background: "#ffffff",
            boxSizing: "border-box",
            width: "100%",
            maxWidth: "100%"
          }}
        >

          {/* =================================================
              CABECERA
              ================================================= */}

          <div
            className="print-header"
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: "20px",
              alignItems: "center",
              borderBottom: "2px solid #cc001f",
              paddingBottom: "20px",
              marginBottom: "25px"
            }}
          >

            <div
              className="print-logo"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start"
              }}
            >
              <LogoOptica />
            </div>


            <div
              className="print-title"
              style={{
                textAlign: "right",
                minWidth: 0
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


          {/* =================================================
              DATOS DEL PACIENTE
              ================================================= */}

          <section className="print-section">

            <h3
              className="print-section-title"
              style={{
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "8px",
                margin: 0
              }}
            >
              👤 Datos del Paciente
            </h3>


            <div
              className="patient-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px"
              }}
            >

              <div className="patient-item">
                <strong>Nombre:</strong>{" "}
                {paciente.nombres} {paciente.apellidos}
              </div>


              <div className="patient-item">
                <strong>RUT:</strong>{" "}
                {paciente.rut || "-"}
              </div>


              <div className="patient-item">
                <strong>Ficha:</strong>{" "}
                {paciente.ficha || "-"}
              </div>


              <div className="patient-item">
                <strong>Teléfono:</strong>{" "}
                {paciente.telefono || "-"}
              </div>

            </div>

          </section>


          {/* =================================================
              CONSULTA
              ================================================= */}

          <section className="print-section">

            <h3
              className="print-section-title"
              style={{
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "8px"
              }}
            >
              📝 Consulta
            </h3>


            <p>
              <strong>Fecha:</strong>{" "}
              {fechaConsulta}
            </p>


            <p>
              <strong>Motivo:</strong>{" "}
              {historia.motivo_consulta || "-"}
            </p>


            <p>
              <strong>Antecedentes:</strong>
              <br />
              {historia.antecedentes || "-"}
            </p>

          </section>


          {/* =================================================
              REFRACCIÓN
              ================================================= */}

          <section className="print-section">

            <h3
              className="print-section-title"
              style={{
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "8px"
              }}
            >
              👓 Refracción
            </h3>


            <table
              className="refraction-table"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed"
              }}
            >

              <thead>

                <tr>

                  <th>OJO</th>

                  <th>ESFERA</th>

                  <th>CILINDRO</th>

                  <th>EJE</th>

                  <th>AV</th>

                </tr>

              </thead>


              <tbody>

                <tr>

                  <td>
                    <strong>OD</strong>
                  </td>

                  <td>
                    {historia.esfera_od || "-"}
                  </td>

                  <td>
                    {historia.cilindro_od || "-"}
                  </td>

                  <td>
                    {historia.eje_od || "-"}
                  </td>

                  <td>
                    {historia.agudeza_visual_od || "-"}
                  </td>

                </tr>


                <tr>

                  <td>
                    <strong>OI</strong>
                  </td>

                  <td>
                    {historia.esfera_oi || "-"}
                  </td>

                  <td>
                    {historia.cilindro_oi || "-"}
                  </td>

                  <td>
                    {historia.eje_oi || "-"}
                  </td>

                  <td>
                    {historia.agudeza_visual_oi || "-"}
                  </td>

                </tr>

              </tbody>

            </table>


            <div className="refraction-extra">

              <div className="refraction-box">

                <strong>Adición:</strong>{" "}
                {historia.adicion || "-"}

              </div>


              <div className="refraction-box">

                <strong>Distancia Pupilar:</strong>{" "}
                {historia.distancia_pupilar || "-"}

              </div>

            </div>

          </section>


          {/* =================================================
              EXAMEN CLÍNICO
              ================================================= */}

          <section className="print-section">

            <h3
              className="print-section-title"
              style={{
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "8px"
              }}
            >
              🔬 Examen Clínico
            </h3>


            <div className="clinical-box">

              <strong>Biomicroscopía</strong>

              <p>
                {historia.biomicroscopia || "-"}
              </p>

            </div>


            <div className="clinical-box">

              <strong>Tonometría</strong>

              <p>
                {historia.tonometria || "-"}
              </p>

            </div>


            <div className="clinical-box">

              <strong>Fondo de Ojo</strong>

              <p>
                {historia.fondo_ojo || "-"}
              </p>

            </div>

          </section>


          {/* =================================================
              DIAGNÓSTICO
              ================================================= */}

          <section className="print-section">

            <h3
              className="print-section-title"
              style={{
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "8px"
              }}
            >
              🩺 Diagnóstico
            </h3>


            <div className="text-box">

              {historia.diagnostico ||
                "Sin diagnóstico registrado"}

            </div>

          </section>


          {/* =================================================
              TRATAMIENTO
              ================================================= */}

          <section className="print-section">

            <h3
              className="print-section-title"
              style={{
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "8px"
              }}
            >
              💊 Tratamiento / Indicaciones
            </h3>


            <div className="text-box">

              {historia.tratamiento ||
                "Sin tratamiento registrado"}

            </div>

          </section>


          {/* =================================================
              OBSERVACIONES
              ================================================= */}

          <section className="print-section">

            <h3
              className="print-section-title"
              style={{
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "8px"
              }}
            >
              📝 Observaciones Generales
            </h3>


            <div className="text-box">

              {historia.observaciones ||
                "Sin observaciones"}

            </div>

          </section>


          {/* =================================================
              FIRMAS
              ================================================= */}

          <div
            className="signature-area"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "40px",
              marginTop: "60px",
              textAlign: "center"
            }}
          >

            <div>

              <div
                className="signature-line"
                style={{
                  borderTop: "1px solid #333",
                  paddingTop: "10px"
                }}
              >
                Profesional / Óptico
              </div>

            </div>


            <div>

              <div
                className="signature-line"
                style={{
                  borderTop: "1px solid #333",
                  paddingTop: "10px"
                }}
              >
                Firma Paciente
              </div>

            </div>

          </div>


          {/* =================================================
              PIE DEL DOCUMENTO
              ================================================= */}

          <div
            className="document-footer"
            style={{
              marginTop: "40px",
              paddingTop: "20px",
              borderTop: "1px solid #ddd",
              textAlign: "center",
              color: "#777",
              fontSize: "12px"
            }}
          >

            <p>
              Ahorro Visión ERP
            </p>


            <p>
              Documento generado electrónicamente
            </p>


            <p>
              Fecha emisión: {fechaEmision}
            </p>

          </div>

        </div>

      </div>
    </>
  );
}

export default FichaClinicaDocumento;
