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
  fecha_nacimiento: string | null;
  edad: number | null;
  sexo: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  comuna: string | null;
  ciudad: string | null;
  ocupacion: string | null;
  observaciones: string | null;
}

interface Receta {
  id: number;
  paciente_id: number;
  numero_formula: string | null;
  fecha: string | null;
  fecha_receta: string | null;
  fecha_control: string | null;
  profesional: string | null;
  esfera_od: number | string | null;
  cilindro_od: number | string | null;
  eje_od: number | string | null;
  esfera_oi: number | string | null;
  cilindro_oi: number | string | null;
  eje_oi: number | string | null;
  adicion_od: number | string | null;
  adicion_oi: number | string | null;
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

type Historia = Record<string, unknown> & {
  id?: number;
  paciente_id?: number;
  fecha_registro?: string | null;
};

function formatearRut(valor: string | null | undefined): string {
  const limpio = String(valor ?? "").trim();
  if (!limpio) return "—";
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

function mostrar(valor: unknown): string {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    return "—";
  }
  return String(valor);
}

function fechaVisible(valor: unknown): string {
  if (!valor) return "—";
  const textoFecha = String(valor);
  if (/^\d{4}-\d{2}-\d{2}$/.test(textoFecha)) {
    const [anio, mes, dia] = textoFecha.split("-");
    return `${dia}/${mes}/${anio}`;
  }
  const fecha = new Date(textoFecha);
  if (Number.isNaN(fecha.getTime())) return textoFecha;
  return fecha.toLocaleString("es-CL");
}

function textoHistoria(historia: Historia, campos: string[]): string {
  for (const campo of campos) {
    const valor = historia[campo];
    if (valor !== null && valor !== undefined && String(valor).trim()) {
      return String(valor);
    }
  }
  return "—";
}

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
      valida: true,
    };
  }

  const simple = original.match(/^\s*([+-]\d+(?:[.,]\d+)?)\s*$/);
  if (simple) {
    return { esfera: simple[1], cilindro: null, eje: null, valida: true };
  }

  return { esfera: null, cilindro: null, eje: null, valida: false };
}

function mostrarDioptria(
  valorNumerico: unknown,
  original: string | null | undefined,
  parte: "esfera" | "cilindro"
): string {
  const rx = separarRxOriginal(original);
  const valorOriginal = parte === "esfera" ? rx.esfera : rx.cilindro;
  if (rx.valida && valorOriginal) return valorOriginal;
  if (valorNumerico === null || valorNumerico === undefined || valorNumerico === "") return "—";

  const numero = Number(valorNumerico);
  if (!Number.isFinite(numero)) return String(valorNumerico);
  // No agregar un signo positivo que no esté conservado en los datos.
  if (numero < 0) return String(valorNumerico);
  return "Signo original no registrado";
}

function mostrarEje(valorNumerico: unknown, original: string | null | undefined): string {
  const rx = separarRxOriginal(original);
  if (rx.valida && rx.eje) return `${rx.eje}°`;
  if (valorNumerico === null || valorNumerico === undefined || valorNumerico === "") return "—";
  return `${String(valorNumerico)}°`;
}

function FichaMedicaPaciente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [historias, setHistorias] = useState<Historia[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarDatos() {
    const pacienteId = Number(id);
    if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
      setError("Paciente no válido.");
      setCargando(false);
      return;
    }

    setCargando(true);
    setError("");

    const [pacienteResult, historiasResult, recetasResult] = await Promise.all([
      supabase
        .from("pacientes")
        .select(
          "id,ficha,rut,rut_titular,nombres,apellidos,fecha_nacimiento,edad,sexo,telefono,email,direccion,comuna,ciudad,ocupacion,observaciones"
        )
        .eq("id", pacienteId)
        .maybeSingle(),
      supabase
        .from("historias_clinicas")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("fecha_registro", { ascending: false }),
      supabase
        .from("recetas")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("fecha_receta", { ascending: false })
        .order("id", { ascending: false }),
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
      setError(`No se pudo cargar la historia clínica: ${historiasResult.error.message}`);
      setCargando(false);
      return;
    }
    if (recetasResult.error) {
      setError(`No se pudieron cargar las recetas: ${recetasResult.error.message}`);
      setCargando(false);
      return;
    }

    setPaciente(pacienteResult.data as Paciente);
    setHistorias((historiasResult.data ?? []) as Historia[]);
    setRecetas((recetasResult.data ?? []) as Receta[]);
    setCargando(false);
  }

  useEffect(() => {
    void cargarDatos();
  }, [id]);

  const nombre = useMemo(() => {
    if (!paciente) return "Ficha médica";
    return `${paciente.nombres} ${paciente.apellidos || ""}`.trim();
  }, [paciente]);

  function obtenerResumenCompartir(): string {
    if (!paciente) return "Ficha médica de Ahorro Visión";
    const receta = recetas[0];
    const lineas = [
      "Ahorro Visión · Resumen de ficha óptica",
      `Paciente: ${nombre}`,
      `RUT paciente: ${formatearRut(paciente.rut)}`,
      `RUT titular: ${formatearRut(paciente.rut_titular)}`,
      `Ficha: ${mostrar(paciente.ficha)}`,
      `Teléfono: ${mostrar(paciente.telefono)}`,
      `Correo: ${mostrar(paciente.email)}`,
    ];

    if (receta) {
      lineas.push(
        "",
        `Última receta: ${mostrar(receta.numero_formula || `#${receta.id}`)}`,
        `Fecha: ${fechaVisible(receta.fecha_receta || receta.fecha)}`,
        `OD — Esfera: ${mostrarDioptria(receta.esfera_od, receta.rx_od_original, "esfera")}; Cilindro: ${mostrarDioptria(receta.cilindro_od, receta.rx_od_original, "cilindro")}; Eje: ${mostrarEje(receta.eje_od, receta.rx_od_original)}`,
        `OI — Esfera: ${mostrarDioptria(receta.esfera_oi, receta.rx_oi_original, "esfera")}; Cilindro: ${mostrarDioptria(receta.cilindro_oi, receta.rx_oi_original, "cilindro")}; Eje: ${mostrarEje(receta.eje_oi, receta.rx_oi_original)}`,
        `DP: ${mostrar(receta.distancia_pupilar)}`,
        `Profesional: ${mostrar(receta.profesional)}`
      );
    } else {
      lineas.push("", "No hay recetas registradas para este paciente.");
    }
    lineas.push("", "Este es un resumen. Para compartir la ficha completa, imprímela o guárdala como PDF y adjunta el archivo manualmente.");
    return lineas.join("\n");
  }

  function prepararCorreo() {
    if (!paciente) return;
    const asunto = `Ficha médica óptica - ${nombre}`;
    const url = `mailto:${encodeURIComponent(paciente.email || "")}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(obtenerResumenCompartir())}`;
    window.location.href = url;
  }

  function compartirWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(obtenerResumenCompartir())}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <MainLayout>
      <style>{`
        @page { size: A4 portrait; margin: 12mm; }
        @media print {
          html, body, #root { height: auto !important; min-height: 0 !important; overflow: visible !important; background: #fff !important; }
          .sidebar, .ficha-no-imprimir { display: none !important; }
          main { height: auto !important; min-height: 0 !important; overflow: visible !important; padding: 0 !important; }
          .ficha-imprimible { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: 0 !important; }
          .ficha-seccion, .ficha-receta { break-inside: avoid-page; box-shadow: none !important; }
          .ficha-imprimible h1 { font-size: 20px !important; }
          .ficha-imprimible h2 { font-size: 15px !important; }
          .ficha-imprimible p, .ficha-imprimible div, .ficha-imprimible td, .ficha-imprimible th { overflow-wrap: anywhere; }
        }
      `}</style>

      <div className="ficha-no-imprimir">
        <PageHeader
          titulo="Ficha médica"
          subtitulo="Datos del paciente, recetas e historia clínica vinculados automáticamente"
        />

        <div style={barraAcciones}>
          <button type="button" onClick={() => navigate(-1)} style={botonSecundario}>
            ← Volver
          </button>
          <Link to={id ? `/pacientes/${id}/recetas` : "/recetas"} style={enlaceBoton}>
            Ver historial de recetas
          </Link>
          <button type="button" onClick={() => window.print()} style={botonPrimario} disabled={cargando || !paciente}>
            🖨️ Imprimir / Guardar PDF
          </button>
          <button type="button" onClick={prepararCorreo} style={botonSecundario} disabled={cargando || !paciente}>
            ✉️ Preparar correo
          </button>
          <button type="button" onClick={compartirWhatsApp} style={botonSecundario} disabled={cargando || !paciente}>
            WhatsApp
          </button>
        </div>
        <p style={notaCompartir}>
          La ficha impresa incluye los datos del paciente, las recetas registradas y la historia clínica. Correo y WhatsApp preparan un resumen; para enviar la ficha completa, guarda primero el PDF y adjúntalo manualmente.
        </p>
      </div>

      {cargando ? (
        <div style={caja}>Cargando ficha médica y datos vinculados...</div>
      ) : error ? (
        <div style={{ ...caja, color: "#b00020", background: "#fff0f1" }}>{error}</div>
      ) : paciente ? (
        <div className="ficha-imprimible" style={contenedorImpresion}>
          <header style={cabeceraImpresion}>
            <div>
              <div style={{ color: "#cc001f", fontWeight: 800, fontSize: 12, letterSpacing: 1 }}>
                ÓPTICA AHORRO VISIÓN
              </div>
              <h1 style={{ margin: "5px 0", fontSize: 24, color: "#222" }}>Ficha médica óptica</h1>
              <div style={{ color: "#666", fontSize: 12 }}>Información consolidada del paciente</div>
            </div>
            <div style={{ textAlign: "right", color: "#666", fontSize: 12 }}>
              <div>Impresión: {fechaVisible(new Date().toISOString())}</div>
              <div>Ficha: {mostrar(paciente.ficha)}</div>
            </div>
          </header>

          <section className="ficha-seccion" style={cajaSeccion}>
            <h2 style={tituloSeccion}>1. Identificación y contacto del paciente</h2>
            <div style={cuadriculaDatos}>
              <Dato etiqueta="Nombre completo" valor={nombre} destacado />
              <Dato etiqueta="RUT del paciente" valor={formatearRut(paciente.rut)} />
              <Dato etiqueta="RUT del titular" valor={formatearRut(paciente.rut_titular)} />
              <Dato etiqueta="N.º de ficha" valor={mostrar(paciente.ficha)} />
              <Dato etiqueta="Teléfono" valor={mostrar(paciente.telefono)} />
              <Dato etiqueta="Correo electrónico" valor={mostrar(paciente.email)} />
              <Dato etiqueta="Fecha de nacimiento" valor={fechaVisible(paciente.fecha_nacimiento)} />
              <Dato etiqueta="Edad" valor={paciente.edad === null || paciente.edad === undefined ? "—" : `${paciente.edad} años`} />
              <Dato etiqueta="Sexo" valor={mostrar(paciente.sexo)} />
              <Dato etiqueta="Dirección" valor={mostrar(paciente.direccion)} />
              <Dato etiqueta="Comuna" valor={mostrar(paciente.comuna)} />
              <Dato etiqueta="Ciudad" valor={mostrar(paciente.ciudad)} />
              <Dato etiqueta="Ocupación" valor={mostrar(paciente.ocupacion)} />
            </div>
            {paciente.observaciones && (
              <div style={{ ...datoAnchoCompleto, marginTop: 10 }}>
                <strong>Observaciones del registro del paciente:</strong>
                <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{paciente.observaciones}</div>
              </div>
            )}
          </section>

          <section className="ficha-seccion" style={cajaSeccion}>
            <h2 style={tituloSeccion}>2. Recetas ópticas vinculadas</h2>
            <p style={descripcionSeccion}>
              Estas recetas se cargan desde el registro del paciente. No es necesario volver a escribir la fórmula en la ficha.
            </p>
            {recetas.length === 0 ? (
              <p style={{ color: "#666", marginBottom: 0 }}>No hay recetas registradas para esta persona.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {recetas.map((receta) => (
                  <article key={receta.id} className="ficha-receta" style={cajaReceta}>
                    <div style={encabezadoReceta}>
                      <div>
                        <h3 style={{ margin: 0, color: "#222", fontSize: 15 }}>
                          Fórmula {mostrar(receta.numero_formula || `#${receta.id}`)}
                        </h3>
                        <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                          Fecha: {fechaVisible(receta.fecha_receta || receta.fecha)} · Profesional: {mostrar(receta.profesional)}
                        </div>
                      </div>
                      <div style={etiquetaTipo}>{mostrar(receta.tipo_receta)}</div>
                    </div>

                    <div style={{ overflowX: "auto", marginTop: 10 }}>
                      <table style={tabla}>
                        <thead>
                          <tr>
                            <th style={th}>Ojo</th>
                            <th style={th}>Esfera</th>
                            <th style={th}>Cilindro</th>
                            <th style={th}>Eje</th>
                            <th style={th}>AV</th>
                            <th style={th}>Adición</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={td}><strong>OD</strong></td>
                            <td style={td}>{mostrarDioptria(receta.esfera_od, receta.rx_od_original, "esfera")}</td>
                            <td style={td}>{mostrarDioptria(receta.cilindro_od, receta.rx_od_original, "cilindro")}</td>
                            <td style={td}>{mostrarEje(receta.eje_od, receta.rx_od_original)}</td>
                            <td style={td}>{mostrar(receta.agudeza_visual_od)}</td>
                            <td style={td}>{mostrar(receta.adicion_od)}</td>
                          </tr>
                          <tr>
                            <td style={td}><strong>OI</strong></td>
                            <td style={td}>{mostrarDioptria(receta.esfera_oi, receta.rx_oi_original, "esfera")}</td>
                            <td style={td}>{mostrarDioptria(receta.cilindro_oi, receta.rx_oi_original, "cilindro")}</td>
                            <td style={td}>{mostrarEje(receta.eje_oi, receta.rx_oi_original)}</td>
                            <td style={td}>{mostrar(receta.agudeza_visual_oi)}</td>
                            <td style={td}>{mostrar(receta.adicion_oi)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div style={cuadriculaReceta}>
                      <Dato etiqueta="Distancia pupilar (DP)" valor={mostrar(receta.distancia_pupilar)} />
                      <Dato etiqueta="Tipo de cristal" valor={mostrar(receta.tipo_cristal)} />
                      <Dato etiqueta="Armazón" valor={mostrar(receta.armazon)} />
                      <Dato etiqueta="Motivo de receta" valor={mostrar(receta.motivo_receta)} />
                      <Dato etiqueta="Fecha de control" valor={fechaVisible(receta.fecha_control)} />
                      <Dato etiqueta="Origen" valor={mostrar(receta.origen)} />
                    </div>
                    {receta.observaciones && (
                      <div style={{ ...datoAnchoCompleto, marginTop: 10 }}>
                        <strong>Observaciones de la receta:</strong>
                        <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{receta.observaciones}</div>
                      </div>
                    )}
                    {(receta.rx_od_original || receta.rx_oi_original) && (
                      <div style={{ marginTop: 9, color: "#666", fontSize: 11 }}>
                        Fórmula original importada: {receta.rx_od_original ? `OD ${receta.rx_od_original}` : ""}{receta.rx_od_original && receta.rx_oi_original ? " · " : ""}{receta.rx_oi_original ? `OI ${receta.rx_oi_original}` : ""}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="ficha-seccion" style={cajaSeccion}>
            <h2 style={tituloSeccion}>3. Historia clínica y consultas registradas</h2>
            {historias.length === 0 ? (
              <p style={{ color: "#666", marginBottom: 0 }}>
                No hay consultas clínicas registradas. Los datos del paciente y sus recetas se muestran igualmente en esta ficha.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {historias.map((historia, indice) => (
                  <article key={String(historia.id ?? indice)} className="ficha-receta" style={cajaHistoria}>
                    <h3 style={{ margin: 0, fontSize: 15, color: "#222" }}>Consulta {historias.length - indice}</h3>
                    <div style={{ color: "#666", fontSize: 12, marginTop: 4, marginBottom: 12 }}>
                      Fecha: {fechaVisible(historia.fecha_registro)}
                    </div>

                    <div style={cuadriculaReceta}>
                      <Dato etiqueta="Motivo de consulta" valor={textoHistoria(historia, ["motivo_consulta", "motivo"])} />
                      <Dato etiqueta="Antecedentes" valor={textoHistoria(historia, ["antecedentes"])} />
                    </div>

                    <h4 style={subtituloSeccion}>Refracción / agudeza visual registrada en la consulta</h4>
                    <div style={{ overflowX: "auto" }}>
                      <table style={tabla}>
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
                            <td style={td}>{mostrarDioptria(historia.esfera_od, historia.rx_od_original as string | null, "esfera")}</td>
                            <td style={td}>{mostrarDioptria(historia.cilindro_od, historia.rx_od_original as string | null, "cilindro")}</td>
                            <td style={td}>{mostrarEje(historia.eje_od, historia.rx_od_original as string | null)}</td>
                            <td style={td}>{mostrar(historia.agudeza_visual_od)}</td>
                          </tr>
                          <tr>
                            <td style={td}><strong>OI</strong></td>
                            <td style={td}>{mostrarDioptria(historia.esfera_oi, historia.rx_oi_original as string | null, "esfera")}</td>
                            <td style={td}>{mostrarDioptria(historia.cilindro_oi, historia.rx_oi_original as string | null, "cilindro")}</td>
                            <td style={td}>{mostrarEje(historia.eje_oi, historia.rx_oi_original as string | null)}</td>
                            <td style={td}>{mostrar(historia.agudeza_visual_oi)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <h4 style={subtituloSeccion}>Examen clínico</h4>
                    <div style={cuadriculaReceta}>
                      <Dato etiqueta="Biomicroscopía" valor={textoHistoria(historia, ["biomicroscopia", "biomicroscopia_od", "biomicroscopia_oi"])} />
                      <Dato etiqueta="Tonometría" valor={textoHistoria(historia, ["tonometria"])} />
                      <Dato etiqueta="Fondo de ojo" valor={textoHistoria(historia, ["fondo_ojo"])} />
                    </div>

                    <h4 style={subtituloSeccion}>Conclusión y plan</h4>
                    <div style={cuadriculaReceta}>
                      <Dato etiqueta="Diagnóstico" valor={textoHistoria(historia, ["diagnostico", "diagnóstico"])} />
                      <Dato etiqueta="Tratamiento / indicaciones" valor={textoHistoria(historia, ["tratamiento", "indicaciones"])} />
                    </div>
                    <div style={{ ...datoAnchoCompleto, marginTop: 10 }}>
                      <strong>Observaciones clínicas:</strong>
                      <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{textoHistoria(historia, ["observaciones", "observacion"])}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <footer style={pieImpresion}>
            Documento generado desde Ahorro Visión ERP con los datos registrados en el sistema. Los campos sin información guardada se muestran como “—”.
          </footer>
        </div>
      ) : null}
    </MainLayout>
  );
}

function Dato({ etiqueta, valor, destacado = false }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <div style={datoBase}>
      <div style={etiquetaDato}>{etiqueta}</div>
      <div style={{ ...valorDato, ...(destacado ? { fontSize: 15, color: "#222", fontWeight: 800 } : {}) }}>{valor}</div>
    </div>
  );
}

const barraAcciones = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  flexWrap: "wrap" as const,
  marginBottom: 8,
};

const botonSecundario = {
  border: "1px solid #ddd",
  background: "#fff",
  color: "#333",
  borderRadius: 9,
  padding: "9px 12px",
  fontWeight: 700,
  cursor: "pointer",
} as const;

const botonPrimario = {
  ...botonSecundario,
  border: "1px solid #cc001f",
  background: "#cc001f",
  color: "#fff",
} as const;

const enlaceBoton = {
  ...botonSecundario,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
} as const;

const notaCompartir = {
  color: "#666",
  fontSize: 12,
  lineHeight: 1.5,
  margin: "0 0 17px",
};

const contenedorImpresion = {
  width: "100%",
  boxSizing: "border-box" as const,
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: 14,
  padding: 22,
  boxShadow: "0 5px 18px rgba(0,0,0,.05)",
  color: "#333",
};

const cabeceraImpresion = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  borderBottom: "2px solid #cc001f",
  paddingBottom: 16,
  marginBottom: 18,
};

const cajaSeccion = {
  background: "#fff",
  border: "1px solid #e8e8e8",
  borderRadius: 11,
  padding: 16,
  marginBottom: 15,
};

const tituloSeccion = {
  margin: "0 0 12px",
  color: "#cc001f",
  fontSize: 16,
};

const descripcionSeccion = {
  color: "#666",
  fontSize: 12,
  margin: "-5px 0 12px",
};

const cuadriculaDatos = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 9,
};

const cuadriculaReceta = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 9,
  marginTop: 10,
};

const datoBase = {
  minWidth: 0,
  padding: "9px 10px",
  background: "#fafafa",
  border: "1px solid #eee",
  borderRadius: 8,
};

const etiquetaDato = {
  color: "#777",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: 0.3,
  marginBottom: 4,
};

const valorDato = {
  color: "#333",
  fontSize: 13,
  lineHeight: 1.4,
  overflowWrap: "anywhere" as const,
};

const datoAnchoCompleto = {
  padding: "10px 12px",
  background: "#fafafa",
  border: "1px solid #eee",
  borderRadius: 8,
  color: "#555",
  fontSize: 12,
  lineHeight: 1.5,
};

const cajaReceta = {
  border: "1px solid #e7e7e7",
  borderRadius: 9,
  padding: 13,
  background: "#fff",
};

const cajaHistoria = {
  border: "1px solid #e7e7e7",
  borderRadius: 9,
  padding: 13,
  background: "#fcfcfc",
};

const encabezadoReceta = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap" as const,
};

const etiquetaTipo = {
  display: "inline-block",
  padding: "5px 8px",
  borderRadius: 20,
  background: "#f4f4f4",
  color: "#555",
  fontSize: 11,
  fontWeight: 700,
};

const tabla = {
  width: "100%",
  borderCollapse: "collapse" as const,
  fontSize: 12,
};

const th = {
  textAlign: "left" as const,
  padding: "8px 7px",
  background: "#555",
  color: "#fff",
  fontSize: 11,
  whiteSpace: "nowrap" as const,
};

const td = {
  padding: "8px 7px",
  borderBottom: "1px solid #eee",
  fontSize: 12,
  verticalAlign: "top" as const,
};

const subtituloSeccion = {
  margin: "14px 0 8px",
  color: "#444",
  fontSize: 12,
};

const pieImpresion = {
  borderTop: "1px solid #ddd",
  paddingTop: 10,
  marginTop: 5,
  color: "#777",
  fontSize: 10,
  lineHeight: 1.4,
};

export default FichaMedicaPaciente;
