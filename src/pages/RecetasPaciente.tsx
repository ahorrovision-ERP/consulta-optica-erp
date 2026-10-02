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

interface Receta {
  id: number;
  numero_formula: string | null;
  fecha: string | null;
  fecha_receta: string | null;
  fecha_control: string | null;
  profesional: string | null;
  esfera_od: number | null;
  cilindro_od: number | null;
  eje_od: number | null;
  esfera_oi: number | null;
  cilindro_oi: number | null;
  eje_oi: number | null;
  adicion_od: number | null;
  adicion_oi: number | null;
  agudeza_visual_od: string | null;
  agudeza_visual_oi: string | null;
  distancia_pupilar: string | null;
  tipo_receta: string | null;
  motivo_receta: string | null;
  tipo_cristal: string | null;
  armazon: string | null;
  observaciones: string | null;
  origen: string | null;
  rx_od_original?: string | null;
  rx_oi_original?: string | null;
}

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

function numero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : null;
}

function fechaVisible(valor: string | null): string {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString("es-CL");
}

/**
 * Lee la RX original tal como fue importada.
 * Requiere signos explícitos (+/-). Nunca agrega un signo por inferencia.
 */
function separarRxOriginal(valor: string | null | undefined): {
  esfera: string | null;
  cilindro: string | null;
  eje: string | null;
  valida: boolean;
} {
  const original = String(valor ?? "").trim();

  if (!original) {
    return { esfera: null, cilindro: null, eje: null, valida: false };
  }

  const completa = original.match(
    /^\s*([+-]\d+(?:[.,]\d+)?)\s+([+-]\d+(?:[.,]\d+)?)°(\d{1,3})\s*$/
  );

  if (completa) {
    return {
      esfera: completa[1],
      cilindro: completa[2],
      eje: completa[3],
      valida: true
    };
  }

  const simple = original.match(
    /^\s*([+-]\d+(?:[.,]\d+)?)\s*$/
  );

  if (simple) {
    return {
      esfera: simple[1],
      cilindro: null,
      eje: null,
      valida: true
    };
  }

  return { esfera: null, cilindro: null, eje: null, valida: false };
}

function estiloBoton() {
  return {
    border: "1px solid #ddd",
    background: "#fff",
    color: "#333",
    borderRadius: "9px",
    padding: "9px 12px",
    fontWeight: 700,
    cursor: "pointer"
  } as const;
}

function RecetasPaciente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [recetas, setRecetas] = useState<Receta[]>([]);
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

    const [pacienteResult, recetasResult] = await Promise.all([
      supabase
        .from("pacientes")
        .select("id, ficha, rut, rut_titular, nombres, apellidos, telefono, email")
        .eq("id", pacienteId)
        .maybeSingle(),

      supabase
        .from("recetas")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("fecha_receta", { ascending: false })
        .order("id", { ascending: false })
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

    if (recetasResult.error) {
      setError(`No se pudieron cargar las recetas: ${recetasResult.error.message}`);
      setCargando(false);
      return;
    }

    setPaciente(pacienteResult.data as Paciente);
    setRecetas((recetasResult.data ?? []) as Receta[]);
    setCargando(false);
  }

  useEffect(() => {
    void cargarDatos();
  }, [id]);

  const tituloPaciente = useMemo(() => {
    if (!paciente) return "Recetas del paciente";
    return `${paciente.nombres} ${paciente.apellidos || ""}`.trim();
  }, [paciente]);

  function imprimirReceta(receta: Receta) {
    const nombre = tituloPaciente;
    const fecha = fechaVisible(receta.fecha_receta || receta.fecha);

    const rxOd = separarRxOriginal(receta.rx_od_original);
    const rxOi = separarRxOriginal(receta.rx_oi_original);

    const odEsfera = rxOd.valida && rxOd.esfera
      ? rxOd.esfera
      : receta.esfera_od !== null
        ? "Signo original no registrado"
        : "—";

    const odCilindro = rxOd.valida && rxOd.cilindro
      ? rxOd.cilindro
      : receta.cilindro_od !== null
        ? "Signo original no registrado"
        : "—";

    const oiEsfera = rxOi.valida && rxOi.esfera
      ? rxOi.esfera
      : receta.esfera_oi !== null
        ? "Signo original no registrado"
        : "—";

    const oiCilindro = rxOi.valida && rxOi.cilindro
      ? rxOi.cilindro
      : receta.cilindro_oi !== null
        ? "Signo original no registrado"
        : "—";

    const ventana = window.open("", "_blank", "width=900,height=700");

    if (!ventana) {
      alert("El navegador bloqueó la ventana de impresión.");
      return;
    }

    ventana.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receta - Ahorro Visión</title>
          <style>
            @page{size:A5 portrait;margin:10mm}
            body{font-family:Arial,sans-serif;color:#222}
            h1{margin:0;color:#cc001f}
            .sub{color:#666;margin:4px 0 18px}
            table{width:100%;border-collapse:collapse}
            th,td{border:1px solid #ccc;padding:8px;text-align:left}
            th{background:#f3f3f3}
            .box{margin-top:14px;padding:12px;border:1px solid #ddd;border-radius:10px}
          </style>
        </head>
        <body>
          <h1>Ahorro Visión ERP</h1>
          <div class="sub">Receta óptica · ${fecha}</div>
          <div class="box"><strong>Paciente:</strong> ${nombre}</div>
          <div class="box"><strong>Nº fórmula:</strong> ${receta.numero_formula || "—"}</div>
          <div class="box">
            <table>
              <thead>
                <tr><th>Ojo</th><th>Esfera</th><th>Cilindro</th><th>Eje</th></tr>
              </thead>
              <tbody>
                <tr><td>OD</td><td>${odEsfera}</td><td>${odCilindro}</td><td>${rxOd.valida && rxOd.eje ? rxOd.eje + "°" : receta.eje_od ?? "—"}</td></tr>
                <tr><td>OI</td><td>${oiEsfera}</td><td>${oiCilindro}</td><td>${rxOi.valida && rxOi.eje ? rxOi.eje + "°" : receta.eje_oi ?? "—"}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="box"><strong>Profesional:</strong> ${receta.profesional || "—"}</div>
          <div class="box"><strong>Observaciones:</strong> ${receta.observaciones || "—"}</div>
          <script>
            window.onload=function(){window.print()};
            window.onafterprint=function(){window.close()};
          </script>
        </body>
      </html>
    `);

    ventana.document.close();
  }

  return (
    <MainLayout>
      <PageHeader
        titulo="Recetas"
        subtitulo="Historial de recetas del paciente seleccionado"
      />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <button type="button" style={estiloBoton()} onClick={() => navigate(-1)}>
          ← Volver a Pacientes
        </button>

        <Link
          to="/recetas"
          style={{
            ...estiloBoton(),
            textDecoration: "none"
          }}
        >
          Ir a Recetas
        </Link>
      </div>

      {cargando ? (
        <div style={caja}>Cargando recetas...</div>
      ) : error ? (
        <div style={{ ...caja, color: "#b00020", background: "#fff0f1" }}>{error}</div>
      ) : paciente ? (
        <>
          <div style={caja}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#222" }}>{tituloPaciente}</div>
            <div style={{ marginTop: 6, color: "#666", fontSize: 13 }}>
              RUT paciente: {paciente.rut ? formatearRut(paciente.rut) : "—"}
              {" · "}
              RUT titular: {paciente.rut_titular ? formatearRut(paciente.rut_titular) : "—"}
              {" · "}
              Ficha: {paciente.ficha || "—"}
            </div>
          </div>

          {recetas.length === 0 ? (
            <div style={caja}>
              <strong>No hay recetas registradas para esta persona.</strong>
              <div style={{ marginTop: 6, color: "#777" }}>
                Esto no significa que el paciente no tenga ficha médica.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {recetas.map((receta) => {
                const od = separarRxOriginal(receta.rx_od_original);
                const oi = separarRxOriginal(receta.rx_oi_original);

                return (
                  <section key={receta.id} style={caja}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 800 }}>
                          Fórmula {receta.numero_formula || `#${receta.id}`}
                        </div>
                        <div style={{ marginTop: 5, color: "#666", fontSize: 13 }}>
                          Fecha: {fechaVisible(receta.fecha_receta || receta.fecha)}
                          {" · "}
                          Profesional: {receta.profesional || "—"}
                        </div>
                      </div>

                      <button type="button" style={estiloBoton()} onClick={() => imprimirReceta(receta)}>
                        🖨️ Imprimir receta
                      </button>
                    </div>

                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
                      <thead>
                        <tr>
                          {["OJO", "ESFERA", "CILINDRO", "EJE", "AV"].map((titulo) => (
                            <th
                              key={titulo}
                              style={{
                                padding: "10px 8px",
                                background: "#555",
                                color: "#fff",
                                textAlign: "left",
                                fontSize: 12
                              }}
                            >
                              {titulo}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        <tr>
                          <td style={tdReceta}>OD</td>
                          <td style={tdReceta}>{od.valida && od.esfera ? od.esfera : receta.esfera_od !== null ? "Signo original no registrado" : "—"}</td>
                          <td style={tdReceta}>{od.valida && od.cilindro ? od.cilindro : receta.cilindro_od !== null ? "Signo original no registrado" : "—"}</td>
                          <td style={tdReceta}>{od.valida && od.eje ? `${od.eje}°` : receta.eje_od !== null ? `${receta.eje_od}°` : "—"}</td>
                          <td style={tdReceta}>{receta.agudeza_visual_od || "—"}</td>
                        </tr>

                        <tr>
                          <td style={tdReceta}>OI</td>
                          <td style={tdReceta}>{oi.valida && oi.esfera ? oi.esfera : receta.esfera_oi !== null ? "Signo original no registrado" : "—"}</td>
                          <td style={tdReceta}>{oi.valida && oi.cilindro ? oi.cilindro : receta.cilindro_oi !== null ? "Signo original no registrado" : "—"}</td>
                          <td style={tdReceta}>{oi.valida && oi.eje ? `${oi.eje}°` : receta.eje_oi !== null ? `${receta.eje_oi}°` : "—"}</td>
                          <td style={tdReceta}>{receta.agudeza_visual_oi || "—"}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 14 }}>
                      <div style={dato}><strong>Adición OD</strong><br />{numero(receta.adicion_od) ?? "—"}</div>
                      <div style={dato}><strong>Adición OI</strong><br />{numero(receta.adicion_oi) ?? "—"}</div>
                      <div style={dato}><strong>DP</strong><br />{receta.distancia_pupilar || "—"}</div>
                      <div style={dato}><strong>Tipo cristal</strong><br />{receta.tipo_cristal || "—"}</div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                      <div style={dato}><strong>Motivo</strong><br />{receta.motivo_receta || "—"}</div>
                      <div style={dato}><strong>Armazón</strong><br />{receta.armazon || "—"}</div>
                    </div>

                    <div style={{ ...dato, marginTop: 10 }}>
                      <strong>Observaciones</strong>
                      <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{receta.observaciones || "—"}</div>
                    </div>

                    {(receta.rx_od_original || receta.rx_oi_original) && (
                      <div style={{ marginTop: 10, fontSize: 12, color: "#777" }}>
                        RX original conservada:{" "}
                        {receta.rx_od_original ? `OD ${receta.rx_od_original}` : ""}
                        {receta.rx_od_original && receta.rx_oi_original ? " · " : ""}
                        {receta.rx_oi_original ? `OI ${receta.rx_oi_original}` : ""}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
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
  boxShadow: "0 5px 18px rgba(0,0,0,.05)",
  marginBottom: "16px"
} as const;

const tdReceta = {
  padding: "10px 8px",
  borderBottom: "1px solid #eee",
  fontSize: "14px"
} as const;

const dato = {
  padding: "11px 12px",
  background: "#fafafa",
  border: "1px solid #ececec",
  borderRadius: "9px",
  color: "#555",
  fontSize: "13px",
  lineHeight: 1.5
} as const;

export default RecetasPaciente;
