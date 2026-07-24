import MainLayout from "../layout/MainLayout";
import PageHeader from "../components/PageHeader";

function HistoriaClinica() {
  return (
    <MainLayout>
      <PageHeader
        titulo="Historia Clínica"
        subtitulo="Consulta y administración de historias clínicas de pacientes"
      />

      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "40px",
          boxShadow: "0 8px 25px rgba(0,0,0,.08)"
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px"
          }}
        >
          <div
            style={{
              fontSize: "70px",
              marginBottom: "20px"
            }}
          >
            🩺
          </div>

          <h2
            style={{
              marginBottom: "15px",
              color: "#333"
            }}
          >
            Módulo Historia Clínica
          </h2>

          <p
            style={{
              color: "#666",
              fontSize: "16px",
              maxWidth: "650px",
              margin: "0 auto",
              lineHeight: "1.7"
            }}
          >
            Desde este módulo podrás consultar, crear y administrar toda la
            información clínica de cada paciente, incluyendo antecedentes,
            anamnesis, agudeza visual, refracción, queratometría,
            biomicroscopía, tonometría, fondo de ojo, diagnóstico, tratamiento,
            recetas ópticas y evolución clínica.
          </p>

          <div
            style={{
              marginTop: "40px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
              gap: "20px"
            }}
          >
            <div
              style={{
                background: "#f8f9fb",
                borderRadius: "15px",
                padding: "20px"
              }}
            >
              <h3>👤 Paciente</h3>
              <p>Información general y antecedentes.</p>
            </div>

            <div
              style={{
                background: "#f8f9fb",
                borderRadius: "15px",
                padding: "20px"
              }}
            >
              <h3>👁 Examen Visual</h3>
              <p>Agudeza visual, refracción y queratometría.</p>
            </div>

            <div
              style={{
                background: "#f8f9fb",
                borderRadius: "15px",
                padding: "20px"
              }}
            >
              <h3>📄 Receta</h3>
              <p>Generación automática de receta óptica.</p>
            </div>

            <div
              style={{
                background: "#f8f9fb",
                borderRadius: "15px",
                padding: "20px"
              }}
            >
              <h3>📚 Historial</h3>
              <p>Consultas anteriores y seguimiento clínico.</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default HistoriaClinica;
