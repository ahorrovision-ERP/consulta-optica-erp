import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import * as XLSX from "xlsx";
import MainLayout from "../layout/MainLayout";
import PageHeader from "../components/PageHeader";
import { supabase } from "../lib/supabase";

type FilaImportacion = {
  numero_formula: string;
  fecha: string | null;
  fecha_control: string | null;
  profesional: string;
  documento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  tipo_cristal: string;
  rxod: string;
  rxoi: string;
  adicion_od: string;
  adicion_oi: string;
  agudeza_visual_od: string;
  agudeza_visual_oi: string;
  observaciones: string;
};

interface Importacion {
  id: number;
  archivo_nombre: string | null;
  tipo_importacion: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: string;
  total_filas: number;
  registros_creados: number;
  registros_actualizados: number;
  registros_omitidos: number;
  registros_error: number;
  observaciones: string | null;
}

interface Preview {
  totalFilas: number;
  filasValidas: number;
  filasError: number;
  documentosUnicos: number;
  personasUnicas: number;
  filasRepetidas: number;
  conflictosNombre: number;
  conflictosDetalle: Array<{ documento: string; personas: string[] }>;
  filasConAdicion: number;
  filasConAgudeza: number;
  filasRXCompleta: number;
  filasRXSimple: number;
  filasRXNoReconocida: number;
  pacientesNuevos: number;
  pacientesExistentes: number;
  recetasExistentes: number;
}

function normalizarCabecera(valor: string): string {
  return valor
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "");
}

function valorFila(
  fila: Record<string, unknown>,
  nombres: string[]
): string {
  for (const nombre of nombres) {
    const clave = normalizarCabecera(nombre);
    const valor = fila[clave];

    if (valor !== undefined && valor !== null) {
      return String(valor).trim();
    }
  }

  return "";
}

function convertirFechaExcel(valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const anio = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, "0");
    const dia = String(valor.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
  }

  const texto = String(valor).trim();

  const iso = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${String(iso[2]).padStart(2, "0")}-${String(iso[3]).padStart(2, "0")}`;
  }

  const latino = texto.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (latino) {
    return `${latino[3]}-${String(latino[2]).padStart(2, "0")}-${String(latino[1]).padStart(2, "0")}`;
  }

  return null;
}

function normalizarDocumento(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[^0-9K]/g, "");
}

function normalizarTextoIdentidad(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9ÑÜ]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function claveIdentidad(fila: FilaImportacion): string {
  return `${normalizarTextoIdentidad(fila.nombres)}|${normalizarTextoIdentidad(fila.apellidos)}`;
}

function analizarRX(valor: string): "completa" | "simple" | "vacia" | "error" {
  if (!valor.trim()) {
    return "vacia";
  }

  const completo = /^\s*[+-]?\d+(?:,\d+)?\s+[+-]?\d+(?:,\d+)?°\d{1,3}\s*$/.test(valor);

  if (completo) {
    return "completa";
  }

  const simple = /^\s*[+-]?\d+(?:,\d+)?\s*$/.test(valor);

  if (simple) {
    return "simple";
  }

  return "error";
}

function numero(valor: unknown): number {
  const resultado = Number(valor || 0);
  return Number.isFinite(resultado) ? resultado : 0;
}

function formatearFechaHora(valor: string | null): string {
  if (!valor) return "-";
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) return valor;

  return fecha.toLocaleString("es-CL");
}

function Importaciones() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [filasImportacion, setFilasImportacion] = useState<FilaImportacion[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [importaciones, setImportaciones] = useState<Importacion[]>([]);

  const [procesandoArchivo, setProcesandoArchivo] = useState(false);
  const [importando, setImportando] = useState(false);
  const [deshaciendo, setDeshaciendo] = useState<number | null>(null);

  const [mensaje, setMensaje] = useState("");
  const [errorMensaje, setErrorMensaje] = useState("");

  const filasConDocumento = useMemo(() => {
    return filasImportacion.filter((fila) => normalizarDocumento(fila.documento));
  }, [filasImportacion]);

  useEffect(() => {
    cargarHistorial();
  }, []);

  async function cargarHistorial() {
    const { data, error } = await supabase
      .from("importaciones")
      .select("*")
      .order("id", { ascending: false })
      .limit(20);

    if (error) {
      console.error(error);
      return;
    }

    setImportaciones((data || []) as Importacion[]);
  }

  async function leerExcelSeleccionado(file: File) {
    setProcesandoArchivo(true);
    setMensaje("");
    setErrorMensaje("");

    try {
      const buffer = await file.arrayBuffer();
      const libro = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
        raw: true
      });

      const nombreHoja = libro.SheetNames.includes("Hoja1")
        ? "Hoja1"
        : libro.SheetNames[0];

      if (!nombreHoja) {
        throw new Error("El Excel no contiene hojas.");
      }

      const hoja = libro.Sheets[nombreHoja];

      if (!hoja) {
        throw new Error("No se pudo leer la hoja de datos.");
      }

      const filasCrudas = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        hoja,
        {
          defval: "",
          raw: true
        }
      );

      if (filasCrudas.length === 0) {
        throw new Error("La hoja no contiene registros.");
      }

      const filas = filasCrudas.map((fila) => {
        // XLSX conserva las cabeceras originales (por ejemplo, "NFormula").
        // Creamos una versión con cabeceras normalizadas para que la detección
        // funcione aunque el archivo use espacios, tildes, guiones o mayúsculas.
        const filaNormalizada = Object.fromEntries(
          Object.entries(fila).map(([clave, valor]) => [
            normalizarCabecera(clave),
            valor
          ])
        );

        return {
          numero_formula: valorFila(filaNormalizada, [
            "NFormula",
            "Número fórmula",
            "Numero formula"
          ]),
          fecha: convertirFechaExcel(filaNormalizada.fecha),
          fecha_control: convertirFechaExcel(filaNormalizada.fechacontrol),
          profesional: valorFila(filaNormalizada, ["Profesional"]),
          documento: valorFila(filaNormalizada, [
            "Documento",
            "RUT",
            "Rut"
          ]),
          nombres: valorFila(filaNormalizada, ["Nombres", "Nombre"]),
          apellidos: valorFila(filaNormalizada, ["Apellidos", "Apellido"]),
          telefono: valorFila(filaNormalizada, [
            "Celular",
            "Telefono",
            "Teléfono"
          ]),
          email: valorFila(filaNormalizada, [
            "correo",
            "Email",
            "Correo"
          ]),
          tipo_cristal: valorFila(filaNormalizada, [
            "Lente",
            "Tipo cristal"
          ]),
          rxod: valorFila(filaNormalizada, ["RXOD"]),
          rxoi: valorFila(filaNormalizada, ["RXOI"]),
          adicion_od: valorFila(filaNormalizada, [
            "AdicionOD",
            "Adición OD"
          ]),
          adicion_oi: valorFila(filaNormalizada, [
            "AdicionOI",
            "Adición OI"
          ]),
          agudeza_visual_od: valorFila(filaNormalizada, [
            "AgudezaVLejanaOD",
            "Agudeza visual OD"
          ]),
          agudeza_visual_oi: valorFila(filaNormalizada, [
            "AgudezaVLejanaOI",
            "Agudeza visual OI"
          ]),
          observaciones: valorFila(filaNormalizada, ["Observaciones"])
        };
      });

      setArchivo(file);
      setFilasImportacion(filas);

      const porDocumento = new Map<string, Map<string, string>>();

      filas.forEach((fila) => {
        const documento = normalizarDocumento(fila.documento);
        if (!documento) return;

        const identidad = claveIdentidad(fila);
        const nombreCompleto = [fila.nombres, fila.apellidos]
          .filter(Boolean)
          .join(" ")
          .trim();

        if (!porDocumento.has(documento)) {
          porDocumento.set(documento, new Map());
        }

        porDocumento.get(documento)?.set(identidad, nombreCompleto);
      });

      const documentos = Array.from(porDocumento.keys());
      const personasUnicas = Array.from(porDocumento.values()).reduce(
        (total, personas) => total + personas.size,
        0
      );

      // "Filas repetidas" significa filas cuyo documento aparece más de una vez,
      // aunque correspondan a personas distintas del mismo titular.
      const filasDocumentoRepetido = filas.length - documentos.length;

      const conflictos = Array.from(porDocumento.entries())
        .filter(([, personas]) => personas.size > 1)
        .map(([documento, personas]) => ({
          documento,
          personas: Array.from(personas.values())
        }))
        .sort((a, b) => a.documento.localeCompare(b.documento));

      const filasValidas = filas.filter(
        (fila) =>
          normalizarDocumento(fila.documento) &&
          fila.nombres.trim()
      );

      let pacientesExistentes = 0;
      let recetasExistentes = 0;

      // Buscamos por RUT del paciente o RUT titular + identidad de la persona.
      // Así dos personas distintas con el mismo RUT titular no se fusionan.
      const { data: pacientesData, error: pacientesError } = await supabase
        .from("pacientes")
        .select("id, rut, rut_titular, nombres, apellidos");

      if (pacientesError) {
        throw new Error(
          `No se pudo consultar pacientes para validar la importación: ${pacientesError.message}`
        );
      }

      const pacientesPorClave = new Map<string, number>();
      (pacientesData || []).forEach((paciente) => {
        const nombres = String(paciente.nombres || "");
        const apellidos = String(paciente.apellidos || "");
        const identidad = `${normalizarTextoIdentidad(nombres)}|${normalizarTextoIdentidad(apellidos)}`;

        const ruts = [paciente.rut, paciente.rut_titular]
          .map((rut) => normalizarDocumento(String(rut || "")))
          .filter(Boolean);

        ruts.forEach((rut) => {
          pacientesPorClave.set(`${rut}|${identidad}`, Number(paciente.id));
        });
      });

      const clavesFuente = new Map<string, string>();
      filas.forEach((fila) => {
        const documento = normalizarDocumento(fila.documento);
        if (!documento || !fila.nombres.trim()) return;
        const clave = `${documento}|${claveIdentidad(fila)}`;
        clavesFuente.set(clave, documento);
      });

      pacientesExistentes = Array.from(clavesFuente.keys()).filter((clave) =>
        pacientesPorClave.has(clave)
      ).length;

      // Recetas existentes: solo cuentan si el número de fórmula ya existe
      // para la misma persona, no simplemente para cualquier paciente.
      const { data: recetasData, error: recetasError } = await supabase
        .from("recetas")
        .select("numero_formula, paciente_id");

      if (recetasError) {
        throw new Error(
          `No se pudo consultar recetas para validar la importación: ${recetasError.message}`
        );
      }

      const recetasExistentesSet = new Set<string>();
      (recetasData || []).forEach((receta) => {
        const numeroFormula = String(receta.numero_formula || "").trim();
        if (!numeroFormula) return;

        const pacienteId = Number(receta.paciente_id);
        const paciente = (pacientesData || []).find(
          (item) => Number(item.id) === pacienteId
        );

        if (!paciente) return;

        const identidad = `${normalizarTextoIdentidad(String(paciente.nombres || ""))}|${normalizarTextoIdentidad(String(paciente.apellidos || ""))}`;
        const ruts = [paciente.rut, paciente.rut_titular]
          .map((rut) => normalizarDocumento(String(rut || "")))
          .filter(Boolean);

        ruts.forEach((rut) => {
          recetasExistentesSet.add(
            `${rut}|${identidad}|${numeroFormula}`
          );
        });
      });

      recetasExistentes = filas.filter((fila) => {
        const documento = normalizarDocumento(fila.documento);
        const numeroFormula = fila.numero_formula.trim();
        if (!documento || !numeroFormula || !fila.nombres.trim()) return false;

        return recetasExistentesSet.has(
          `${documento}|${claveIdentidad(fila)}|${numeroFormula}`
        );
      }).length;

      let filasRXCompleta = 0;
      let filasRXSimple = 0;
      let filasRXNoReconocida = 0;
      let filasConAdicion = 0;
      let filasConAgudeza = 0;

      filas.forEach((fila) => {
        const tipos = [
          analizarRX(fila.rxod),
          analizarRX(fila.rxoi)
        ];

        if (tipos.includes("completa")) filasRXCompleta += 1;
        if (tipos.includes("simple")) filasRXSimple += 1;
        if (tipos.includes("error")) filasRXNoReconocida += 1;

        if (fila.adicion_od || fila.adicion_oi) {
          filasConAdicion += 1;
        }

        if (fila.agudeza_visual_od || fila.agudeza_visual_oi) {
          filasConAgudeza += 1;
        }
      });

      setPreview({
        totalFilas: filas.length,
        filasValidas: filasValidas.length,
        filasError: filas.length - filasValidas.length,
        documentosUnicos: documentos.length,
        personasUnicas,
        filasRepetidas: filasDocumentoRepetido,
        conflictosNombre: conflictos.length,
        conflictosDetalle: conflictos,
        filasConAdicion,
        filasConAgudeza,
        filasRXCompleta,
        filasRXSimple,
        filasRXNoReconocida,
        pacientesNuevos: Math.max(0, personasUnicas - pacientesExistentes),
        pacientesExistentes,
        recetasExistentes
      });

      setMensaje(
        `✓ Archivo analizado: ${filas.length.toLocaleString("es-CL")} filas.`
      );
    } catch (error: any) {
      console.error(error);
      setArchivo(null);
      setFilasImportacion([]);
      setPreview(null);
      setErrorMensaje(
        error?.message || "No se pudo leer el archivo."
      );
    } finally {
      setProcesandoArchivo(false);
    }
  }

  async function iniciarImportacion() {
    if (!archivo || filasConDocumento.length === 0 || !preview) {
      setErrorMensaje(
        "Selecciona un archivo de datos válido antes de importar."
      );
      return;
    }

    const mensajeConfirmacion =
      `Se crearán/relacionarán ${preview.personasUnicas.toLocaleString("es-CL")} persona(s) a partir de ${preview.documentosUnicos.toLocaleString("es-CL")} RUT/documentos titulares y se procesarán ${preview.filasValidas.toLocaleString("es-CL")} receta(s).\n\n` +
      `Cuando un mismo RUT tenga más de una persona, cada persona quedará en una ficha independiente y ambas quedarán vinculadas al mismo RUT titular. No se fusionarán por RUT.\n\n` +
      `Los registros ya existentes para la misma persona + número de fórmula se omitirán.\n\n¿Continuar?`;

    const continuar = window.confirm(mensajeConfirmacion);

    if (!continuar) return;

    setImportando(true);
    setMensaje("");
    setErrorMensaje("");

    try {
      const { data: lote, error: loteError } = await supabase
        .from("importaciones")
        .insert({
          archivo_nombre: archivo.name,
          tipo_importacion: "PACIENTES_RECETAS",
          estado: "PREPARADA",
          total_filas: filasConDocumento.length
        })
        .select()
        .single();

      if (loteError || !lote) {
        throw new Error(
          loteError?.message ||
            "No se pudo crear el lote de importación."
        );
      }

      const resultado = await supabase.rpc(
        "importar_datos",
        {
          p_importacion_id: lote.id,
          p_filas: filasConDocumento
        }
      );

      if (resultado.error) {
        await supabase
          .from("importaciones")
          .update({
            estado: "ERROR",
            fecha_fin: new Date().toISOString(),
            observaciones: resultado.error.message
          })
          .eq("id", lote.id);

        throw resultado.error;
      }

      const datosResultado = resultado.data as {
        pacientes_nuevos: number;
        recetas_nuevas: number;
        omitidos: number;
        errores: number;
      };

      setMensaje(
        `✓ Importación #${lote.id} completada. ` +
          `${numero(datosResultado.pacientes_nuevos).toLocaleString("es-CL")} pacientes nuevos, ` +
          `${numero(datosResultado.recetas_nuevas).toLocaleString("es-CL")} recetas nuevas, ` +
          `${numero(datosResultado.omitidos).toLocaleString("es-CL")} omitidos y ` +
          `${numero(datosResultado.errores).toLocaleString("es-CL")} errores.`
      );

      setArchivo(null);
      setFilasImportacion([]);
      setPreview(null);

      await cargarHistorial();
    } catch (error: any) {
      console.error(error);
      setErrorMensaje(
        error?.message || "No se pudo completar la importación."
      );
    } finally {
      setImportando(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function deshacerImportacion(importacion: Importacion) {
    if (importacion.estado !== "COMPLETADA") {
      return;
    }

    const confirmar = window.confirm(
      `¿Deshacer la importación #${importacion.id}?\n\nArchivo: ${importacion.archivo_nombre || "-"}\n\nSolo se eliminarán los registros que ese lote creó. Los pacientes y recetas que ya existían antes no serán eliminados.`
    );

    if (!confirmar) return;

    setDeshaciendo(importacion.id);
    setMensaje("");
    setErrorMensaje("");

    try {
      const { data, error } = await supabase.rpc(
        "deshacer_importacion",
        { p_importacion_id: importacion.id }
      );

      if (error) {
        throw error;
      }

      setMensaje(
        typeof data === "string"
          ? `✓ ${data}`
          : "✓ Importación deshecha correctamente."
      );

      await cargarHistorial();
    } catch (error: any) {
      console.error(error);
      setErrorMensaje(
        error?.message || "No se pudo deshacer la importación."
      );
    } finally {
      setDeshaciendo(null);
    }
  }

  return (
    <MainLayout>
      <PageHeader
        titulo="Importaciones"
        subtitulo="Carga, valida y revierte información histórica sin mezclar módulos"
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "22px",
          paddingBottom: "40px"
        }}
      >
        {mensaje && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "12px",
              background: "#edf8f0",
              color: "#25723a",
              fontWeight: 600
            }}
          >
            {mensaje}
          </div>
        )}

        {errorMensaje && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "12px",
              background: "#fff0f1",
              color: "#b00020",
              fontWeight: 600
            }}
          >
            {errorMensaje}
          </div>
        )}

        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "28px",
            boxShadow: "0 7px 24px rgba(0,0,0,.07)"
          }}
        >
          <h2 style={{ margin: 0, color: "#222" }}>
            Importación de Datos
          </h2>

          <p
            style={{
              margin: "7px 0 22px",
              color: "#777",
              fontSize: "14px"
            }}
          >
            El archivo se analizará antes de guardar. Los datos se separarán automáticamente entre pacientes y recetas según las columnas detectadas.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "12px",
              alignItems: "center"
            }}
          >
            <div
              style={{
                border: "1px dashed #cfcfcf",
                borderRadius: "14px",
                padding: "18px",
                background: "#fafafa"
              }}
            >
              <strong style={{ color: "#333" }}>
                {archivo?.name || "Ningún archivo seleccionado"}
              </strong>

              <div
                style={{
                  marginTop: "5px",
                  color: "#888",
                  fontSize: "13px"
                }}
              >
                Formatos: .xlsx, .xls, .csv
              </div>
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={procesandoArchivo || importando}
              style={{
                border: "none",
                borderRadius: "10px",
                padding: "12px 18px",
                background: "#cc001f",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
                opacity:
                  procesandoArchivo || importando
                    ? 0.6
                    : 1
              }}
            >
              {procesandoArchivo
                ? "Analizando..."
                : "Seleccionar Excel"}
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void leerExcelSeleccionado(file);
                }
              }}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {preview && (
          <div
            style={{
              background: "#fff",
              borderRadius: "18px",
              padding: "28px",
              boxShadow: "0 7px 24px rgba(0,0,0,.07)"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                flexWrap: "wrap"
              }}
            >
              <div>
                <h2 style={{ margin: 0, color: "#222" }}>
                  Vista previa y validación
                </h2>
                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#777",
                    fontSize: "14px"
                  }}
                >
                  No se ha guardado nada todavía.
                </p>
              </div>

              <button
                type="button"
                onClick={iniciarImportacion}
                disabled={importando}
                style={{
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px 18px",
                  background: "#cc001f",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: importando ? 0.6 : 1
                }}
              >
                {importando
                  ? "Importando..."
                  : "Confirmar importación"}
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
                marginTop: "24px"
              }}
            >
              {[
                ["Filas", preview.totalFilas],
                ["Filas válidas", preview.filasValidas],
                ["Documentos únicos", preview.documentosUnicos],
                ["Personas identificadas", preview.personasUnicas],
                ["Filas con documento repetido", preview.filasRepetidas],
                ["Pacientes nuevos", preview.pacientesNuevos],
                ["Pacientes existentes", preview.pacientesExistentes],
                ["Recetas existentes", preview.recetasExistentes],
                ["Documentos con varias personas", preview.conflictosNombre]
              ].map(([titulo, valor]) => (
                <div
                  key={String(titulo)}
                  style={{
                    border: "1px solid #eeeeee",
                    borderRadius: "14px",
                    padding: "16px",
                    background:
                      titulo === "Documentos con varias personas" && Number(valor) > 0
                        ? "#fff8e8"
                        : "#fafafa"
                  }}
                >
                  <div
                    style={{
                      color: "#888",
                      fontSize: "12px",
                      marginBottom: "6px"
                    }}
                  >
                    {titulo}
                  </div>

                  <strong
                    style={{
                      fontSize: "23px",
                      color: "#222"
                    }}
                  >
                    {Number(valor).toLocaleString("es-CL")}
                  </strong>
                </div>
              ))}
            </div>

            {preview.conflictosDetalle.length > 0 && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "18px",
                  borderRadius: "13px",
                  background: "#fff8e8",
                  border: "1px solid #f0dfab",
                  color: "#5f5128",
                  fontSize: "13px",
                  lineHeight: 1.55
                }}
              >
                <strong>RUT con más de una persona</strong>
                <p style={{ margin: "7px 0 10px" }}>
                  Estos casos no se fusionarán. Cada persona tendrá su propia ficha y quedará vinculada al mismo RUT titular.
                </p>
                <div
                  style={{
                    maxHeight: "220px",
                    overflowY: "auto",
                    display: "grid",
                    gap: "6px"
                  }}
                >
                  {preview.conflictosDetalle.map((conflicto) => (
                    <div key={conflicto.documento}>
                      <strong>{conflicto.documento}:</strong>{" "}
                      {conflicto.personas.join(" · ")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: "18px",
                padding: "18px",
                borderRadius: "13px",
                background: "#f7f7f7",
                color: "#555",
                fontSize: "13px",
                lineHeight: 1.6
              }}
            >
              <strong>Qué hará el importador:</strong>
              <br />
              • El Documento/RUT del archivo se tratará como RUT titular o de referencia.
              <br />
              • Cada persona (nombres + apellidos) tendrá su propia ficha, aunque comparta el mismo RUT titular.
              <br />
              • Varias filas de la misma persona se convertirán en varias recetas históricas.
              <br />
              • RX completas se separarán en esfera, cilindro y eje.
              <br />
              • RX simples conservarán la esfera y dejarán cilindro/eje vacíos.
              <br />
              • Las recetas ya existentes para esa persona + número de fórmula se omitirán.
              <br />
              • Todo lo nuevo quedará asociado a este lote y podrá deshacerse.
            </div>
          </div>
        )}

        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "28px",
            boxShadow: "0 7px 24px rgba(0,0,0,.07)"
          }}
        >
          <h2 style={{ margin: 0, color: "#222" }}>
            Historial de importaciones
          </h2>

          <p
            style={{
              margin: "7px 0 22px",
              color: "#777",
              fontSize: "14px"
            }}
          >
            Cada carga queda registrada como un lote independiente.
          </p>

          {importaciones.length === 0 ? (
            <div
              style={{
                padding: "25px",
                background: "#fafafa",
                borderRadius: "12px",
                color: "#888"
              }}
            >
              Todavía no hay importaciones registradas.
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
                overflowY: "auto",
                maxHeight: "500px"
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "950px",
                  borderCollapse: "collapse"
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Lote",
                      "Archivo",
                      "Fecha",
                      "Estado",
                      "Filas",
                      "Creados",
                      "Omitidos",
                      "Errores",
                      "Acción"
                    ].map((titulo) => (
                      <th
                        key={titulo}
                        style={{
                          position: "sticky",
                          top: 0,
                          background: "#f3f3f3",
                          padding: "11px 9px",
                          borderBottom: "1px solid #ddd",
                          textAlign: "left",
                          fontSize: "12px",
                          color: "#555"
                        }}
                      >
                        {titulo}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {importaciones.map((importacion) => (
                    <tr key={importacion.id}>
                      <td style={tdStyle}>
                        <strong>#{importacion.id}</strong>
                      </td>

                      <td style={tdStyle}>
                        {importacion.archivo_nombre || "-"}
                      </td>

                      <td style={tdStyle}>
                        {formatearFechaHora(importacion.fecha_inicio)}
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "5px 9px",
                            borderRadius: "20px",
                            background:
                              importacion.estado === "COMPLETADA"
                                ? "#edf9f0"
                                : importacion.estado === "ANULADA"
                                  ? "#f2f2f2"
                                  : "#fff8e8",
                            color:
                              importacion.estado === "COMPLETADA"
                                ? "#25723a"
                                : importacion.estado === "ANULADA"
                                  ? "#666"
                                  : "#8a6500",
                            fontSize: "11px",
                            fontWeight: 800
                          }}
                        >
                          {importacion.estado}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        {numero(importacion.total_filas).toLocaleString("es-CL")}
                      </td>

                      <td style={tdStyle}>
                        {numero(importacion.registros_creados).toLocaleString("es-CL")}
                      </td>

                      <td style={tdStyle}>
                        {numero(importacion.registros_omitidos).toLocaleString("es-CL")}
                      </td>

                      <td style={tdStyle}>
                        {numero(importacion.registros_error).toLocaleString("es-CL")}
                      </td>

                      <td style={tdStyle}>
                        {importacion.estado === "COMPLETADA" && (
                          <button
                            type="button"
                            disabled={deshaciendo === importacion.id}
                            onClick={() =>
                              void deshacerImportacion(importacion)
                            }
                            style={{
                              border: "none",
                              borderRadius: "9px",
                              padding: "8px 11px",
                              background: "#fff0f1",
                              color: "#b00020",
                              fontWeight: 700,
                              cursor: "pointer",
                              opacity:
                                deshaciendo === importacion.id
                                  ? 0.6
                                  : 1
                            }}
                          >
                            {deshaciendo === importacion.id
                              ? "Deshaciendo..."
                              : "↩ Deshacer"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

const tdStyle: CSSProperties = {
  padding: "12px 9px",
  borderBottom: "1px solid #eeeeee",
  color: "#555",
  fontSize: "13px"
};

export default Importaciones;
