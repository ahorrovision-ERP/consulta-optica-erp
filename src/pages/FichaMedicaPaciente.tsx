import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

import MainLayout from "../layout/MainLayout";
import PageHeader from "../components/PageHeader";

interface Paciente {
  id: number;
  ficha: string | null;
  rut: string | null;
  rut_titular: string | null;
  nombres: string;
  apellidos: string | null;
  telefono: string | null;
  email: string | null;
}

type Historia = Record<string, unknown> & {
  id?: number;
  paciente_id?: number;
  fecha_registro?: string | null;
};

function formatearRut(valor: string | null | undefined): string {
  const limpio = String(valor ?? "").trim();
  if (!limpio) return "";
  const normalizado = limpio.replace(/\./g, "").replace(/-/g, "");
  if (normalizado.length < 2) return limpio;
  const cuerpo = normalizado.slice(0, -1);
  const dv = normalizado.slice(-1);
  let resultado = "";
  for (let i = 0; i < cuerpo.length; i += 1) {
    const posiciones = cuerpo.length - i;
    if (i > 0 && posiciones % 3 === 0) resultado += ".";
    resultado += cuerpo[i];
  }
  return `${resultado}-${dv}`;
}

function fechaVisible(valor: unknown): string {
  if (!valor) return "—";
  const fecha = new Date(String(valor));
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString("es-CL");
}

function texto(historia: Historia, campos: string[]): string {
  for (const campo of campos) {
    const valor = historia[campo];
    if (valor !== null && valor !== undefined && String(valor).trim()) {
      return String(valor);
    }
  }
  return "";
}

function mostrarDioptriaHistoria(
  valor: unknown,
  original: unknown
): string {
  const textoOriginal = String(original ?? "").trim();

  // Si existe el valor original, se respeta literalmente.
  if (textoOriginal) {
    return textoOriginal;
  }

  if (valor === null || valor === undefined || valor === "") {
    return "—";
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return String(valor);
  }

  // Nunca inventamos el signo positivo. Un valor negativo conserva
  // el signo que forma parte del valor almacenado; para 0/positivos,
  // avisamos que el signo original no quedó registrado.
  if (numero < 0) {
    return String(valor);
  }

  return "Signo original no registrado";
}

function FichaMedicaPaciente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [historias, setHistorias] = useState<Historia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarDatos() {
    const pacienteId = Number(id);

    if (!Number.isFinite(pacienteId)) {
      setError("Paciente no válido.");
      setCargando(false);
      return;
    }

    setCargando(true);
    setError("");

    const [pacienteResult, historiasResult] = await Promise.all([
      supabase
        .from("pacientes")
        .select("id, ficha, rut, rut_titular, nombres, apellidos, telefono, email")
        .eq("id", pacienteId)
        .maybeSingle(),

      supabase
        .from("historias_clinicas")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("fecha_registro", { ascending: false })
    ]);

    if (pacienteResult.error) {
      setError(`No se pudo cargar el paciente: ${pacienteResult.error.message}`);
      setCargando(false);
      return;
    }

    if (!pacienteResult.data) {
      setError("No se encontró el paciente.");
      setCargando(false);
      return;
    }

    if (historiasResult.error) {
      setError(`No se pudo cargar la ficha médica: ${historiasResult.error.message}`);
      setCargando(false);
      return;
    }

    setPaciente(pacienteResult.data as Paciente);
    setHistorias((historiasResult.data ?? []) as Historia[]);
    setCargando(false);
  }

  useEffect(() => {
    void cargarDatos();
  }, [id]);

  const nombre = useMemo(() => {
    if (!paciente) return "Ficha médica";
    return `${paciente.nombres} ${paciente.apellidos || ""}`.trim();
  }, [paciente]);

  return (
    <MainLayout>
      <PageHeader
        titulo="Ficha médica"
        subtitulo="Historia clínica de la persona seleccionada"
      />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            border: "1px solid #ddd",
            background: "#fff",
            color: "#333",
            borderRadius: "9px",
            padding: "9px 12px",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          ← Volver a Pacientes
        </button>

        <Link
          to="/historia-clinica"
          style={{
            border: "1px solid #ddd",
            background: "#fff",
            color: "#333",
            borderRadius: "9px",
            padding: "9px 12px",
            fontWeight: 700,
            textDecoration: "none"
          }}
        >
          Ir a Historia Clínica
        </Link>
      </div>

      {cargando ? (
        <div style={caja}>Cargando ficha médica...</div>
      ) : error ? (
        <div style={{ ...caja, color: "#b00020", background: "#fff0f1" }}>{error}</div>
      ) : paciente ? (
        <>
          <section style={caja}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{nombre}</div>
            <div style={{ color: "#666", fontSize: 13, marginTop: 6 }}>
              RUT paciente: {paciente.rut ? formatearRut(paciente.rut) : "—"}
              {" · "}
              RUT titular: {paciente.rut_titular ? formatearRut(paciente.rut_titular) : "—"}
              {" · "}
              Ficha: {paciente.ficha || "—"}
            </div>
          </section>

          {historias.length === 0 ? (
            <section style={caja}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>
                No hay ficha médica registrada para esta persona.
              </div>
              <p style={{ color: "#777", marginBottom: 0 }}>
                La ausencia de historia clínica es independiente de las recetas que tenga registradas.
              </p>
            </section>
          ) : (
            historias.map((historia, indice) => (
              <section
                key={String(historia.id ?? indice)}
                style={{
                  ...caja,
                  marginBottom: 18
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800 }}>
                  Consulta {historias.length - indice}
                </div>

                <div style={{ color: "#777", fontSize: 12, marginTop: 5 }}>
                  Fecha: {fechaVisible(historia.fecha_registro)}
                </div>

                <div style={bloque}>
                  <h3 style={tituloBloque}>Consulta</h3>
                  <p><strong>Motivo:</strong> {texto(historia, ["motivo_consulta", "motivo"]) || "—"}</p>
                  <p><strong>Antecedentes:</strong> {texto(historia, ["antecedentes"]) || "—"}</p>
                </div>

                <div style={bloque}>
                  <h3 style={tituloBloque}>Refracción</h3>

                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>Ojo</th>
                        <th style={th}>Esfera</th>
                        <th style={th}>Cilindro</th>
                        <th style={th}>Eje</th>
                        <th style={th}>AV</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td style={td}><strong>OD</strong></td>
                        <td style={td}>{mostrarDioptriaHistoria(historia.esfera_od, historia.rx_od_original)}</td>
                        <td style={td}>{mostrarDioptriaHistoria(historia.cilindro_od, historia.rx_od_original)}</td>
                        <td style={td}>{String(historia.eje_od ?? "—")}</td>
                        <td style={td}>{String(historia.agudeza_visual_od ?? "—")}</td>
                      </tr>

                      <tr>
                        <td style={td}><strong>OI</strong></td>
                        <td style={td}>{mostrarDioptriaHistoria(historia.esfera_oi, historia.rx_oi_original)}</td>
                        <td style={td}>{mostrarDioptriaHistoria(historia.cilindro_oi, historia.rx_oi_original)}</td>
                        <td style={td}>{String(historia.eje_oi ?? "—")}</td>
                        <td style={td}>{String(historia.agudeza_visual_oi ?? "—")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={bloque}>
                  <h3 style={tituloBloque}>Examen clínico</h3>
                  <p><strong>Biomicroscopía:</strong> {texto(historia, ["biomicroscopia", "biomicroscopia_od", "biomicroscopia_oi"]) || "—"}</p>
                  <p><strong>Tonometría:</strong> {texto(historia, ["tonometria"]) || "—"}</p>
                  <p><strong>Fondo de ojo:</strong> {texto(historia, ["fondo_ojo"]) || "—"}</p>
                </div>

                <div style={bloque}>
                  <h3 style={tituloBloque}>Diagnóstico</h3>
                  <div style={textoBox}>{texto(historia, ["diagnostico", "diagnóstico"]) || "—"}</div>
                </div>

                <div style={bloque}>
                  <h3 style={tituloBloque}>Tratamiento / indicaciones</h3>
                  <div style={textoBox}>{texto(historia, ["tratamiento", "indicaciones"]) || "—"}</div>
                </div>

                <div style={bloque}>
                  <h3 style={tituloBloque}>Observaciones</h3>
                  <div style={textoBox}>{texto(historia, ["observaciones", "observacion"]) || "—"}</div>
                </div>
              </section>
            ))
          )}
        </>
      ) : null}
    </MainLayout>
  );
}

const caja = {
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: "14px",
  padding: "18px",
  boxShadow: "0 5px 18px rgba(0,0,0,.05)"
} as const;

const bloque = {
  marginTop: 16,
  padding: "14px",
  border: "1px solid #ededed",
  borderRadius: "10px",
  background: "#fafafa"
} as const;

const tituloBloque = {
  margin: "0 0 9px",
  fontSize: 14,
  color: "#333"
} as const;

const textoBox = {
  color: "#555",
  whiteSpace: "pre-wrap",
  lineHeight: 1.5
} as const;

const th = {
  textAlign: "left" as const,
  padding: "9px 7px",
  background: "#555",
  color: "#fff",
  fontSize: 12
} as const;

const td = {
  padding: "9px 7px",
  borderBottom: "1px solid #eee",
  fontSize: 13
} as const;

export default FichaMedicaPaciente;
