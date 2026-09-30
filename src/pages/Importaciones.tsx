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
  filasRepetidas: number;
  conflictosNombre: number;
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

      const filas = filasCrudas.map((fila) => ({
        numero_formula: valorFila(fila, ["NFormula", "Número fórmula", "Numero formula"]),
        fecha: convertirFechaExcel(fila[Object.keys(fila).find((key) => normalizarCabecera(key) === "fecha") || ""]),
        fecha_control: convertirFechaExcel(fila[Object.keys(fila).find((key) => normalizarCabecera(key) === "fechacontrol") || ""]),
        profesional: valorFila(fila, ["Profesional"]),
        documento: valorFila(fila, ["Documento", "RUT", "Rut"]),
        nombres: valorFila(fila, ["Nombres", "Nombre"]),
        apellidos: valorFila(fila, ["Apellidos", "Apellido"]),
        telefono: valorFila(fila, ["Celular", "Telefono", "Teléfono"]),
        email: valorFila(fila, ["correo", "Email", "Correo"]),
        tipo_cristal: valorFila(fila, ["Lente", "Tipo cristal"]),
        rxod: valorFila(fila, ["RXOD"]),
        rxoi: valorFila(fila, ["RXOI"]),
        adicion_od: valorFila(fila, ["AdicionOD", "Adición OD"]),
        adicion_oi: valorFila(fila, ["AdicionOI", "Adición OI"]),
        agudeza_visual_od: valorFila(fila, ["AgudezaVLejanaOD", "Agudeza visual OD"]),
        agudeza_visual_oi: valorFila(fila, ["AgudezaVLejanaOI", "Agudeza visual OI"]),
        observaciones: valorFila(fila, ["Observaciones"])
      }));

      setArchivo(file);
      setFilasImportacion(filas);

      const porDocumento = new Map<string, Set<string>>();
      filas.forEach((fila) => {
        const documento = normalizarDocumento(fila.documento);
        if (!documento) return;

        const identidad = `${fila.nombres.trim()}|${fila.apellidos.trim()}`.toLowerCase();
        if (!porDocumento.has(documento)) {
          porDocumento.set(documento, new Set());
        }
        porDocumento.get(documento)?.add(identidad);
      });

      const documentos = Array.from(porDocumento.keys());
      const documentosRepetidos = filas.length - documentos.length;
      const conflictosNombre = Array.from(porDocumento.values()).filter(
        (set) => set.size > 1
      ).length;

      let pacientesExistentes = 0;
      let recetasExistentes = 0;

      const documentosSet = new Set(documentos);

      if (documentosSet.size > 0) {
        const { data: pacientesData } = await supabase
          .from("pacientes")
          .select("id, rut");

        const docsDb = new Set(
          (pacientesData || [])
            .map((paciente) => normalizarDocumento(String(paciente.rut || "")))
            .filter(Boolean)
        );

        pacientesExistentes = documentos.filter((doc) => docsDb.has(doc)).length;
      }

      const formulas = filas
        .map((fila) => fila.numero_formula)
        .filter(Boolean);

      if (formulas.length > 0) {
        const formulasSet = new Set(formulas);
        const { data: recetasData } = await supabase
          .from("recetas")
          .select("numero_formula");

        recetasExistentes = (recetasData || []).filter(
          (receta) => receta.numero_formula && formulasSet.has(String(receta.numero_formula))
        ).length;
      }

      const filasValidas = filas.filter(
        (fila) =>
          normalizarDocumento(fila.documento) &&
          fila.nombres.trim()
      );

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

        if (
          fila.agudeza_visual_od ||
          fila.agudeza_visual_oi
        ) {
          filasConAgudeza += 1;
        }
      });

      setPreview({
        totalFilas: filas.length,
        filasValidas: filasValidas.length,
        filasError: filas.length - filasValidas.length,
        documentosUnicos: documentos.length,
        filasRepetidas: documentosRepetidos,
        conflictosNombre,
        filasConAdicion,
        filasConAgudeza,
        filasRXCompleta,
        filasRXSimple,
        filasRXNoReconocida,
        pacientesNuevos: documentos.length - pacientesExistentes,
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

    if (preview.conflictosNombre > 0) {
      const continuar = window.confirm(
        `Se detectaron ${preview.conflictosNombre} documento(s) que aparecen con nombres diferentes en el archivo.\n\nEl sistema mantendrá un solo paciente por documento y no modificará pacientes existentes. Las recetas se importarán asociadas al documento.\n\n¿Quieres continuar?`
      );

      if (!continuar) return;
    }

    const continuar = window.confirm(
      `Se importarán aproximadamente ${preview.pacientesNuevos.toLocaleString("es-CL")} paciente(s) nuevo(s) y ${preview.filasValidas.toLocaleString("es-CL")} fila(s) histórica(s) de receta.\n\nLa operación quedará registrada como un lote y podrá deshacerse posteriormente.\n\n¿Continuar?`
    );

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
                ["Filas repetidas", preview.filasRepetidas],
                ["Pacientes nuevos", preview.pacientesNuevos],
                ["Pacientes existentes", preview.pacientesExistentes],
                ["Recetas existentes", preview.recetasExistentes],
                ["Conflictos de nombre", preview.conflictosNombre]
              ].map(([titulo, valor]) => (
                <div
                  key={String(titulo)}
                  style={{
                    border: "1px solid #eeeeee",
                    borderRadius: "14px",
                    padding: "16px",
                    background:
                      titulo === "Conflictos de nombre" && Number(valor) > 0
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
              • Un paciente por RUT/documento normalizado.
              <br />
              • Varias filas del mismo paciente se convertirán en varias recetas históricas.
              <br />
              • RX completas se separarán en esfera, cilindro y eje.
              <br />
              • RX simples conservarán la esfera y dejarán cilindro/eje vacíos.
              <br />
              • Las recetas ya existentes por paciente + número de fórmula se omitirán.
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
