import {
  useEffect,
  useMemo,
  useState,
  type FormEvent
} from "react";

import MainLayout from "../layout/MainLayout";
import PageHeader from "../components/PageHeader";
import { supabase } from "../lib/supabase";

interface Paciente {
  id: number;
  ficha: string | null;
  rut: string | null;
  rut_titular: string | null;
  nombres: string;
  apellidos: string | null;
}

interface Receta {
  id: number;
  paciente_id: number | null;

  numero_formula: string | null;
  fecha_receta: string | null;
  fecha_control: string | null;
  profesional: string | null;
  tipo_receta: string | null;
  motivo_receta: string | null;

  esfera_od: number | null;
  cilindro_od: number | null;
  eje_od: number | null;
  adicion_od: string | null;
  agudeza_visual_od: string | null;

  esfera_oi: number | null;
  cilindro_oi: number | null;
  eje_oi: number | null;
  adicion_oi: string | null;
  agudeza_visual_oi: string | null;

  distancia_pupilar: string | null;
  tipo_cristal: string | null;
  armazon: string | null;
  origen: string | null;
  observaciones: string | null;

  fecha_registro: string | null;
  fecha_actualizacion: string | null;

  // Conserva literalmente los signos de la RX cuando la receta fue registrada
  // desde el formulario o cuando el dato histórico los trae explícitamente.
  rx_od_original: string | null;
  rx_oi_original: string | null;
}

interface FormularioReceta {
  paciente_id: string;

  numero_formula: string;
  fecha_receta: string;
  fecha_control: string;
  profesional: string;

  tipo_receta: string;
  motivo_receta: string;

  esfera_od: string;
  cilindro_od: string;
  eje_od: string;
  adicion_od: string;
  agudeza_visual_od: string;

  esfera_oi: string;
  cilindro_oi: string;
  eje_oi: string;
  adicion_oi: string;
  agudeza_visual_oi: string;

  distancia_pupilar: string;
  tipo_cristal: string;
  armazon: string;
  origen: string;
  observaciones: string;
}

function obtenerFechaActual(): string {
  return new Date().toISOString().slice(0, 10);
}

const formularioInicial: FormularioReceta = {
  paciente_id: "",

  numero_formula: "",
  fecha_receta: obtenerFechaActual(),
  fecha_control: "",
  profesional: "",

  tipo_receta: "Lejos",
  motivo_receta: "",

  esfera_od: "",
  cilindro_od: "",
  eje_od: "",
  adicion_od: "",
  agudeza_visual_od: "",

  esfera_oi: "",
  cilindro_oi: "",
  eje_oi: "",
  adicion_oi: "",
  agudeza_visual_oi: "",

  distancia_pupilar: "",
  tipo_cristal: "",
  armazon: "",
  origen: "Óptica",
  observaciones: ""
};

function formatearFecha(
  fecha: string | null
): string {
  if (!fecha) {
    return "-";
  }

  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

function limpiarNumeroTexto(valor: string): string {
  return valor.trim().replace(",", ".");
}

function convertirNumeroOpcional(
  valor: string
): number | null {
  const texto = limpiarNumeroTexto(valor);

  if (!texto) {
    return null;
  }

  const numero = Number(texto);

  if (!Number.isFinite(numero)) {
    return null;
  }

  return numero;
}

function tieneSignoExplicito(valor: string): boolean {
  return /^[+-](?:\d+(?:[.,]\d+)?)$/.test(
    valor.trim()
  );
}

function obtenerPartesRxOriginal(
  valor: string | null
): {
  esfera: string;
  cilindro: string;
  eje: string;
} {
  const original = String(valor || "").trim();

  if (!original) {
    return { esfera: "", cilindro: "", eje: "" };
  }

  const completa = original.match(
    /^\s*([+-]\d+(?:[.,]\d+)?)\s+([+-]\d+(?:[.,]\d+)?)°(\d{1,3})\s*$/
  );

  if (completa) {
    return {
      esfera: completa[1],
      cilindro: completa[2],
      eje: completa[3]
    };
  }

  const simple = original.match(
    /^\s*([+-]\d+(?:[.,]\d+)?)\s*$/
  );

  if (simple) {
    return { esfera: simple[1], cilindro: "", eje: "" };
  }

  return { esfera: "", cilindro: "", eje: "" };
}

function valorDioParaEditar(
  valorNumerico: number | null,
  original: string | null,
  parte: "esfera" | "cilindro"
): string {
  const partes = obtenerPartesRxOriginal(original);

  if (partes[parte]) {
    return partes[parte];
  }

  // Un negativo almacenado en numeric es inequívocamente negativo.
  // Un positivo/0 no revela si originalmente se escribió con + o sin signo,
  // por lo que se deja vacío y obliga a reingresarlo explícitamente.
  if (valorNumerico !== null && valorNumerico < 0) {
    return String(valorNumerico);
  }

  return "";
}

function formatearDioptriaListado(
  valorNumerico: number | null,
  original: string | null,
  parte: "esfera" | "cilindro"
): string {
  const partes = obtenerPartesRxOriginal(original);

  if (partes[parte]) {
    return partes[parte];
  }

  if (valorNumerico === null || valorNumerico === undefined) {
    return "-";
  }

  if (valorNumerico < 0) {
    return String(valorNumerico);
  }

  return "Signo no registrado";
}

function valorAdicionParaEditar(
  valor: string | null
): string {
  const texto = String(valor || "").trim();

  return tieneSignoExplicito(texto)
    ? texto
    : "";
}

function Recetas() {
  const [pacientes, setPacientes] =
    useState<Paciente[]>([]);

  const [recetas, setRecetas] =
    useState<Receta[]>([]);

  const [
    formulario,
    setFormulario
  ] = useState<FormularioReceta>(
    formularioInicial
  );

  const [
    pacienteBusqueda,
    setPacienteBusqueda
  ] = useState("");

  const [
    busquedaListado,
    setBusquedaListado
  ] = useState("");

  const [
    recetaEditando,
    setRecetaEditando
  ] = useState<Receta | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [errorMensaje, setErrorMensaje] =
    useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);

    const [
      resultadoPacientes,
      resultadoRecetas
    ] = await Promise.all([
      supabase
        .from("pacientes")
        .select(
          "id, ficha, rut, rut_titular, nombres, apellidos"
        )
        .order("nombres", {
          ascending: true
        })
        .order("apellidos", {
          ascending: true
        }),

      supabase
        .from("recetas")
        .select("*")
        .order("fecha_receta", {
          ascending: false
        })
        .order("id", {
          ascending: false
        })
    ]);

    if (resultadoPacientes.error) {
      console.error(
        "Error cargando pacientes:",
        resultadoPacientes.error
      );

      setErrorMensaje(
        "No se pudieron cargar los pacientes: " +
          resultadoPacientes.error.message
      );
    } else {
      setPacientes(
        resultadoPacientes.data || []
      );
    }

    if (resultadoRecetas.error) {
      console.error(
        "Error cargando recetas:",
        resultadoRecetas.error
      );

      setErrorMensaje(
        "No se pudieron cargar las recetas: " +
          resultadoRecetas.error.message
      );
    } else {
      setRecetas(
        resultadoRecetas.data || []
      );
    }

    setCargando(false);
  }

  function actualizarCampo(
    campo: keyof FormularioReceta,
    valor: string
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor
    }));
  }

  function obtenerPaciente(
    pacienteId: number | null
  ): Paciente | undefined {
    if (!pacienteId) {
      return undefined;
    }

    return pacientes.find(
      (paciente) =>
        paciente.id === pacienteId
    );
  }

  function obtenerNombrePaciente(
    pacienteId: number | null
  ): string {
    const paciente =
      obtenerPaciente(pacienteId);

    if (!paciente) {
      return "Paciente no encontrado";
    }

    return `${paciente.nombres} ${
      paciente.apellidos || ""
    }`.trim();
  }

  const pacientesFiltrados = useMemo(() => {
    const texto =
      pacienteBusqueda
        .trim()
        .toLowerCase();

    if (!texto) {
      return pacientes;
    }

    return pacientes.filter(
      (paciente) => {
        const nombre =
          `${paciente.nombres} ${
            paciente.apellidos || ""
          }`.toLowerCase();

        const rut =
          (
            paciente.rut || ""
          ).toLowerCase();

        const rutTitular =
          (
            paciente.rut_titular || ""
          ).toLowerCase();

        const ficha =
          (
            paciente.ficha || ""
          ).toLowerCase();

        return (
          nombre.includes(texto) ||
          rut.includes(texto) ||
          rutTitular.includes(texto) ||
          ficha.includes(texto)
        );
      }
    );
  }, [
    pacientes,
    pacienteBusqueda
  ]);

  const recetasFiltradas = useMemo(() => {
    const texto =
      busquedaListado
        .trim()
        .toLowerCase();

    if (!texto) {
      return recetas;
    }

    return recetas.filter(
      (receta) => {
        const paciente =
          obtenerPaciente(
            receta.paciente_id
          );

        const nombre =
          obtenerNombrePaciente(
            receta.paciente_id
          ).toLowerCase();

        const rut =
          (
            paciente?.rut || ""
          ).toLowerCase();

        const ficha =
          (
            paciente?.ficha || ""
          ).toLowerCase();

        const numeroFormula =
          (
            receta.numero_formula || ""
          ).toLowerCase();

        return (
          nombre.includes(texto) ||
          rut.includes(texto) ||
          ficha.includes(texto) ||
          numeroFormula.includes(texto)
        );
      }
    );
  }, [
    recetas,
    busquedaListado,
    pacientes
  ]);

  function seleccionarPaciente(
    pacienteId: string
  ) {
    actualizarCampo(
      "paciente_id",
      pacienteId
    );

    const paciente =
      pacientes.find(
        (item) =>
          item.id === Number(pacienteId)
      );

    if (paciente) {
      setPacienteBusqueda(
        `${paciente.nombres} ${
          paciente.apellidos || ""
        }`.trim()
      );
    }
  }

  function limpiarFormulario(
    limpiarMensajes = true
  ) {
    setFormulario({
      ...formularioInicial,
      fecha_receta: obtenerFechaActual()
    });

    setPacienteBusqueda("");
    setRecetaEditando(null);

    if (limpiarMensajes) {
      setMensaje("");
      setErrorMensaje("");
    }
  }

  function editarReceta(
    receta: Receta
  ) {
    setRecetaEditando(receta);

    const paciente =
      obtenerPaciente(
        receta.paciente_id
      );

    setPacienteBusqueda(
      paciente
        ? `${paciente.nombres} ${
            paciente.apellidos || ""
          }`.trim()
        : ""
    );

    setFormulario({
      paciente_id:
        receta.paciente_id !== null
          ? String(receta.paciente_id)
          : "",

      numero_formula:
        receta.numero_formula || "",

      fecha_receta:
        receta.fecha_receta || "",

      fecha_control:
        receta.fecha_control || "",

      profesional:
        receta.profesional || "",

      tipo_receta:
        receta.tipo_receta ||
        "Lejos",

      motivo_receta:
        receta.motivo_receta || "",

      esfera_od:
        valorDioParaEditar(
          receta.esfera_od,
          receta.rx_od_original,
          "esfera"
        ),

      cilindro_od:
        valorDioParaEditar(
          receta.cilindro_od,
          receta.rx_od_original,
          "cilindro"
        ),

      eje_od:
        receta.eje_od !== null
          ? String(receta.eje_od)
          : "",

      adicion_od:
        valorAdicionParaEditar(
          receta.adicion_od
        ),

      agudeza_visual_od:
        receta.agudeza_visual_od || "",

      esfera_oi:
        valorDioParaEditar(
          receta.esfera_oi,
          receta.rx_oi_original,
          "esfera"
        ),

      cilindro_oi:
        valorDioParaEditar(
          receta.cilindro_oi,
          receta.rx_oi_original,
          "cilindro"
        ),

      eje_oi:
        receta.eje_oi !== null
          ? String(receta.eje_oi)
          : "",

      adicion_oi:
        valorAdicionParaEditar(
          receta.adicion_oi
        ),

      agudeza_visual_oi:
        receta.agudeza_visual_oi || "",

      distancia_pupilar:
        receta.distancia_pupilar || "",

      tipo_cristal:
        receta.tipo_cristal || "",

      armazon:
        receta.armazon || "",

      origen:
        receta.origen || "",

      observaciones:
        receta.observaciones || ""
    });

    setMensaje("");
    setErrorMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function guardarReceta(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMensaje("");
    setErrorMensaje("");

    if (!formulario.paciente_id) {
      setErrorMensaje(
        "Debes seleccionar un paciente."
      );
      return;
    }

    if (!formulario.fecha_receta) {
      setErrorMensaje(
        "Debes indicar la fecha de la receta."
      );
      return;
    }

    const camposDioptricos = [
      { nombre: "Esfera OD", valor: formulario.esfera_od },
      { nombre: "Cilindro OD", valor: formulario.cilindro_od },
      { nombre: "Adición OD", valor: formulario.adicion_od },
      { nombre: "Esfera OI", valor: formulario.esfera_oi },
      { nombre: "Cilindro OI", valor: formulario.cilindro_oi },
      { nombre: "Adición OI", valor: formulario.adicion_oi }
    ];

    for (const campo of camposDioptricos) {
      if (campo.valor.trim() && !tieneSignoExplicito(campo.valor)) {
        setErrorMensaje(
          `${campo.nombre}: debes escribir el signo + o - explícitamente. Ejemplo: +1.00 o -1.00.`
        );
        return;
      }
    }

    const esferaOD = convertirNumeroOpcional(formulario.esfera_od);
    const cilindroOD = convertirNumeroOpcional(formulario.cilindro_od);
    const ejeOD = convertirNumeroOpcional(formulario.eje_od);
    const esferaOI = convertirNumeroOpcional(formulario.esfera_oi);
    const cilindroOI = convertirNumeroOpcional(formulario.cilindro_oi);
    const ejeOI = convertirNumeroOpcional(formulario.eje_oi);

    if (
      formulario.esfera_od.trim() &&
      esferaOD === null
    ) {
      setErrorMensaje("La esfera OD no contiene un número válido.");
      return;
    }

    if (
      formulario.cilindro_od.trim() &&
      cilindroOD === null
    ) {
      setErrorMensaje("El cilindro OD no contiene un número válido.");
      return;
    }

    if (
      formulario.esfera_oi.trim() &&
      esferaOI === null
    ) {
      setErrorMensaje("La esfera OI no contiene un número válido.");
      return;
    }

    if (
      formulario.cilindro_oi.trim() &&
      cilindroOI === null
    ) {
      setErrorMensaje("El cilindro OI no contiene un número válido.");
      return;
    }

    if (
      formulario.eje_od.trim() &&
      (
        ejeOD === null ||
        !Number.isInteger(ejeOD) ||
        ejeOD < 0 ||
        ejeOD > 180
      )
    ) {
      setErrorMensaje(
        "El eje OD debe ser un número entero entre 0 y 180."
      );
      return;
    }

    if (
      formulario.eje_oi.trim() &&
      (
        ejeOI === null ||
        !Number.isInteger(ejeOI) ||
        ejeOI < 0 ||
        ejeOI > 180
      )
    ) {
      setErrorMensaje(
        "El eje OI debe ser un número entero entre 0 y 180."
      );
      return;
    }

    if (formulario.cilindro_od.trim() && !formulario.eje_od.trim()) {
      setErrorMensaje("Si registras cilindro OD, debes indicar también el eje OD.");
      return;
    }

    if (
      (formulario.cilindro_od.trim() || formulario.eje_od.trim()) &&
      !formulario.esfera_od.trim()
    ) {
      setErrorMensaje("Si registras cilindro o eje OD, debes indicar también la esfera OD con signo explícito. Ejemplo: +0.00.");
      return;
    }

    if (!formulario.cilindro_od.trim() && formulario.eje_od.trim()) {
      setErrorMensaje("El eje OD requiere un cilindro OD explícito.");
      return;
    }

    if (formulario.cilindro_oi.trim() && !formulario.eje_oi.trim()) {
      setErrorMensaje("Si registras cilindro OI, debes indicar también el eje OI.");
      return;
    }

    if (
      (formulario.cilindro_oi.trim() || formulario.eje_oi.trim()) &&
      !formulario.esfera_oi.trim()
    ) {
      setErrorMensaje("Si registras cilindro o eje OI, debes indicar también la esfera OI con signo explícito. Ejemplo: +0.00.");
      return;
    }

    if (!formulario.cilindro_oi.trim() && formulario.eje_oi.trim()) {
      setErrorMensaje("El eje OI requiere un cilindro OI explícito.");
      return;
    }

    setGuardando(true);

    const datos = {
      paciente_id:
        Number(formulario.paciente_id),

      numero_formula:
        formulario.numero_formula.trim() ||
        null,

      fecha_receta:
        formulario.fecha_receta,

      fecha_control:
        formulario.fecha_control ||
        null,

      profesional:
        formulario.profesional.trim() ||
        null,

      tipo_receta:
        formulario.tipo_receta.trim() ||
        null,

      motivo_receta:
        formulario.motivo_receta.trim() ||
        null,

      esfera_od: esferaOD,

      cilindro_od: cilindroOD,

      eje_od:
        ejeOD !== null
          ? Math.trunc(ejeOD)
          : null,

      rx_od_original:
        [
          formulario.esfera_od.trim(),
          formulario.cilindro_od.trim()
            ? `${formulario.cilindro_od.trim()}°${ejeOD !== null ? Math.trunc(ejeOD) : ""}`
            : ""
        ]
          .filter(Boolean)
          .join(" ") || null,

      adicion_od:
        formulario.adicion_od.trim() ||
        null,

      agudeza_visual_od:
        formulario.agudeza_visual_od.trim() ||
        null,

      esfera_oi: esferaOI,

      cilindro_oi: cilindroOI,

      eje_oi:
        ejeOI !== null
          ? Math.trunc(ejeOI)
          : null,

      rx_oi_original:
        [
          formulario.esfera_oi.trim(),
          formulario.cilindro_oi.trim()
            ? `${formulario.cilindro_oi.trim()}°${ejeOI !== null ? Math.trunc(ejeOI) : ""}`
            : ""
        ]
          .filter(Boolean)
          .join(" ") || null,

      adicion_oi:
        formulario.adicion_oi.trim() ||
        null,

      agudeza_visual_oi:
        formulario.agudeza_visual_oi.trim() ||
        null,

      distancia_pupilar:
        formulario.distancia_pupilar.trim() ||
        null,

      tipo_cristal:
        formulario.tipo_cristal.trim() ||
        null,

      armazon:
        formulario.armazon.trim() ||
        null,

      origen:
        formulario.origen.trim() ||
        null,

      observaciones:
        formulario.observaciones.trim() ||
        null,

      fecha_actualizacion:
        new Date().toISOString()
    };

    let error = null;

    if (recetaEditando) {
      const resultado =
        await supabase
          .from("recetas")
          .update(datos)
          .eq(
            "id",
            recetaEditando.id
          );

      error = resultado.error;
    } else {
      const resultado =
        await supabase
          .from("recetas")
          .insert([datos]);

      error = resultado.error;
    }

    if (error) {
      console.error(
        "Error guardando receta:",
        error
      );

      setErrorMensaje(
        "No se pudo guardar la receta: " +
          error.message
      );

      setGuardando(false);

      return;
    }

    const mensajeExito =
      recetaEditando
        ? "✓ Receta actualizada correctamente."
        : "✓ Receta guardada correctamente.";

    limpiarFormulario(false);

    setMensaje(mensajeExito);
    setErrorMensaje("");
    setGuardando(false);

    await cargarDatos();
  }

  async function eliminarReceta(
    receta: Receta
  ) {
    const nombrePaciente =
      obtenerNombrePaciente(
        receta.paciente_id
      );

    const referencia =
      receta.numero_formula
        ? ` (${receta.numero_formula})`
        : "";

    const confirmar =
      window.confirm(
        `¿Eliminar la receta de ${nombrePaciente}${referencia}?`
      );

    if (!confirmar) {
      return;
    }

    setMensaje("");
    setErrorMensaje("");

    const { error } =
      await supabase
        .from("recetas")
        .delete()
        .eq(
          "id",
          receta.id
        );

    if (error) {
      console.error(
        "Error eliminando receta:",
        error
      );

      setErrorMensaje(
        "No se pudo eliminar la receta: " +
          error.message
      );

      return;
    }

    if (
      recetaEditando &&
      recetaEditando.id === receta.id
    ) {
      limpiarFormulario(false);
    }

    setMensaje(
      "✓ Receta eliminada correctamente."
    );

    setErrorMensaje("");

    await cargarDatos();
  }

  return (
    <MainLayout>

      <PageHeader
        titulo="Recetas"
        subtitulo="Emisión, consulta y administración de recetas ópticas"
      />

      <style>
        {`
          .recetas-contenedor {
            display: flex;
            flex-direction: column;
            gap: 25px;
            padding-bottom: 40px;
          }

          .recetas-card {
            background: #ffffff;
            border-radius: 18px;
            padding: 28px;
            box-sizing: border-box;
            box-shadow:
              0 7px 24px rgba(0, 0, 0, .07);
          }

          .recetas-card h2 {
            margin: 0;
            color: #222222;
            font-size: 22px;
            font-weight: 700;
          }

          .recetas-descripcion {
            margin: 7px 0 24px 0;
            color: #777777;
            font-size: 14px;
          }

          .bloque-receta {
            margin-top: 20px;
            padding: 20px;
            background: #fafafa;
            border: 1px solid #eeeeee;
            border-radius: 15px;
            box-sizing: border-box;
          }

          .titulo-bloque {
            margin: 0 0 17px 0;
            color: #333333;
            font-size: 16px;
            font-weight: 700;
          }

          .recetas-grid {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 18px;
          }

          .recetas-grid-2 {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 18px;
          }

          .ojo-grid {
            display: grid;
            grid-template-columns:
              repeat(5, minmax(0, 1fr));
            gap: 12px;
          }

          .campo {
            min-width: 0;
          }

          .campo-full {
            grid-column: 1 / -1;
          }

          .campo label {
            display: block;
            margin-bottom: 7px;
            color: #333333;
            font-size: 13px;
            font-weight: 700;
          }

          .campo input,
          .campo select,
          .campo textarea {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #dddddd;
            border-radius: 10px;
            padding: 11px 13px;
            color: #333333;
            background: #ffffff;
            font-family: Arial, sans-serif;
            font-size: 14px;
            outline: none;
            transition:
              border-color .15s ease,
              box-shadow .15s ease;
          }

          .campo input:focus,
          .campo select:focus,
          .campo textarea:focus {
            border-color: #cc001f;
            box-shadow:
              0 0 0 3px rgba(204, 0, 31, .08);
          }

          .campo textarea {
            min-height: 110px;
            resize: vertical;
          }

          .paciente-seleccionado {
            margin-top: 8px;
            color: #247a3d;
            font-size: 12px;
            font-weight: 600;
          }

          .botones-formulario {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 10px;
            margin-top: 25px;
            flex-wrap: wrap;
          }

          .boton-receta {
            border: none;
            border-radius: 10px;
            padding: 11px 18px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition:
              opacity .15s ease,
              transform .15s ease;
          }

          .boton-receta:hover {
            transform: translateY(-1px);
          }

          .boton-receta:disabled {
            opacity: .65;
            cursor: not-allowed;
            transform: none;
          }

          .boton-primario {
            background: #cc001f;
            color: #ffffff;
          }

          .boton-secundario {
            background: #eeeeee;
            color: #333333;
          }

          .mensaje-ok {
            padding: 13px 16px;
            border-radius: 10px;
            background: #eaf7ee;
            color: #247a3d;
            font-size: 14px;
          }

          .mensaje-error {
            padding: 13px 16px;
            border-radius: 10px;
            background: #fff0f2;
            color: #b0001b;
            font-size: 14px;
          }

          .busqueda-listado {
            margin-bottom: 20px;
          }

          .busqueda-listado input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #dddddd;
            border-radius: 10px;
            padding: 12px 14px;
            color: #333333;
            font-size: 14px;
            outline: none;
          }

          .busqueda-listado input:focus {
            border-color: #cc001f;
            box-shadow:
              0 0 0 3px rgba(204, 0, 31, .08);
          }

          .tabla-scroll {
            width: 100%;
            overflow-x: auto;
          }

          .tabla-recetas {
            width: 100%;
            min-width: 1200px;
            border-collapse: collapse;
          }

          .tabla-recetas th {
            padding: 12px 10px;
            background: #f4f4f4;
            border-bottom: 1px solid #dddddd;
            color: #333333;
            font-size: 12px;
            font-weight: 700;
            text-align: left;
            white-space: nowrap;
          }

          .tabla-recetas td {
            padding: 12px 10px;
            border-bottom: 1px solid #eeeeee;
            color: #555555;
            font-size: 13px;
            vertical-align: middle;
          }

          .nombre-paciente {
            color: #333333;
            font-weight: 700;
          }

          .dato-secundario {
            margin-top: 3px;
            color: #888888;
            font-size: 11px;
          }

          .acciones-tabla {
            display: flex;
            gap: 7px;
            flex-wrap: wrap;
          }

          .boton-tabla {
            border: none;
            border-radius: 8px;
            padding: 8px 10px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          }

          .boton-editar {
            background: #eeeeee;
            color: #333333;
          }

          .boton-eliminar {
            background: #fff0f2;
            color: #b0001b;
          }

          .estado-vacio {
            padding: 35px 15px;
            color: #777777;
            text-align: center;
          }

          .contador-recetas {
            color: #888888;
            font-size: 13px;
          }

          @media (max-width: 1100px) {
            .recetas-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .ojo-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 700px) {
            .recetas-card {
              padding: 18px;
            }

            .recetas-grid,
            .recetas-grid-2,
            .ojo-grid {
              grid-template-columns: 1fr;
            }

            .campo-full {
              grid-column: auto;
            }
          }
        `}
      </style>

      <div className="recetas-contenedor">

        {mensaje && (
          <div className="mensaje-ok">
            {mensaje}
          </div>
        )}

        {errorMensaje && (
          <div className="mensaje-error">
            {errorMensaje}
          </div>
        )}

        {/* =====================================================
            NUEVA RECETA / EDICIÓN
            ===================================================== */}

        <div className="recetas-card">

          <h2>
            {recetaEditando
              ? "Editar receta"
              : "Nueva receta"}
          </h2>

          <p className="recetas-descripcion">
            Registra y administra la receta óptica
            asociada al paciente.
          </p>

          <form
            onSubmit={guardarReceta}
          >

            {/* PACIENTE */}

            <div className="bloque-receta">

              <h3 className="titulo-bloque">
                👤 Paciente
              </h3>

              <div className="recetas-grid-2">

                <div className="campo">

                  <label>
                    Buscar paciente
                  </label>

                  <input
                    type="text"
                    value={
                      pacienteBusqueda
                    }
                    onChange={(event) =>
                      setPacienteBusqueda(
                        event.target.value
                      )
                    }
                    placeholder="Nombre, RUT o ficha"
                  />

                </div>

                <div className="campo">

                  <label>
                    Seleccionar paciente *
                  </label>

                  <select
                    value={
                      formulario.paciente_id
                    }
                    onChange={(event) =>
                      seleccionarPaciente(
                        event.target.value
                      )
                    }
                    required
                  >

                    <option value="">
                      Seleccionar paciente
                    </option>

                    {pacientesFiltrados.map(
                      (paciente) => (
                        <option
                          key={
                            paciente.id
                          }
                          value={
                            paciente.id
                          }
                        >
                          {
                            paciente.nombres
                          }{" "}
                          {
                            paciente.apellidos ||
                            ""
                          }
                          {paciente.rut_titular ? ` · Titular ${paciente.rut_titular}` : ""}
                          {
                            paciente.ficha
                              ? ` · Ficha ${paciente.ficha}`
                              : ""
                          }
                        </option>
                      )
                    )}

                  </select>

                  {formulario.paciente_id && (
                    <div className="paciente-seleccionado">
                      ✓{" "}
                      {
                        obtenerNombrePaciente(
                          Number(
                            formulario.paciente_id
                          )
                        )
                      }
                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* DATOS GENERALES */}

            <div className="bloque-receta">

              <h3 className="titulo-bloque">
                📋 Datos de la receta
              </h3>

              <div className="recetas-grid">

                <div className="campo">

                  <label>
                    Nº de fórmula
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.numero_formula
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "numero_formula",
                        event.target.value
                      )
                    }
                    placeholder="Ej: F-000125"
                  />

                </div>

                <div className="campo">

                  <label>
                    Fecha de receta *
                  </label>

                  <input
                    type="date"
                    value={
                      formulario.fecha_receta
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "fecha_receta",
                        event.target.value
                      )
                    }
                    required
                  />

                </div>

                <div className="campo">

                  <label>
                    Fecha de control
                  </label>

                  <input
                    type="date"
                    value={
                      formulario.fecha_control
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "fecha_control",
                        event.target.value
                      )
                    }
                  />

                </div>

                <div className="campo">

                  <label>
                    Profesional
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.profesional
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "profesional",
                        event.target.value
                      )
                    }
                    placeholder="Nombre del profesional"
                  />

                </div>

                <div className="campo">

                  <label>
                    Tipo de receta
                  </label>

                  <select
                    value={
                      formulario.tipo_receta
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "tipo_receta",
                        event.target.value
                      )
                    }
                  >

                    <option value="Lejos">
                      Lejos
                    </option>

                    <option value="Cerca">
                      Cerca
                    </option>

                    <option value="Multifocal">
                      Multifocal
                    </option>

                    <option value="Bifocal">
                      Bifocal
                    </option>

                    <option value="Monofocal">
                      Monofocal
                    </option>

                    <option value="Ocupacional">
                      Ocupacional
                    </option>

                    <option value="Lentes de contacto">
                      Lentes de contacto
                    </option>

                  </select>

                </div>

                <div className="campo">

                  <label>
                    Origen
                  </label>

                  <select
                    value={
                      formulario.origen
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "origen",
                        event.target.value
                      )
                    }
                  >

                    <option value="Óptica">
                      Óptica
                    </option>

                    <option value="Consulta externa">
                      Consulta externa
                    </option>

                    <option value="Particular">
                      Particular
                    </option>

                    <option value="Otro">
                      Otro
                    </option>

                  </select>

                </div>

                <div className="campo campo-full">

                  <label>
                    Motivo de la receta
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.motivo_receta
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "motivo_receta",
                        event.target.value
                      )
                    }
                    placeholder="Ej: Renovación, cambio de graduación, primera receta..."
                  />

                </div>

              </div>

            </div>

            {/* OD */}

            <div className="bloque-receta">

              <h3 className="titulo-bloque">
                👁️ Ojo Derecho (OD)
              </h3>

              <div className="ojo-grid">

                <div className="campo">

                  <label>
                    Esfera · signo obligatorio (+ / -)
                  </label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      formulario.esfera_od
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "esfera_od",
                        event.target.value
                      )
                    }
                    placeholder="Ej: +2.50 o -2.50"
                  />

                </div>

                <div className="campo">

                  <label>
                    Cilindro · signo obligatorio (+ / -)
                  </label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      formulario.cilindro_od
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "cilindro_od",
                        event.target.value
                      )
                    }
                    placeholder="Ej: +0.75 o -0.75"
                  />

                </div>

                <div className="campo">

                  <label>
                    Eje
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="180"
                    step="1"
                    value={
                      formulario.eje_od
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "eje_od",
                        event.target.value
                      )
                    }
                    placeholder="0 - 180"
                  />

                </div>

                <div className="campo">

                  <label>
                    Adición · signo obligatorio (+ / -)
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.adicion_od
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "adicion_od",
                        event.target.value
                      )
                    }
                    placeholder="Ej: +2.00 o -2.00"
                  />

                </div>

                <div className="campo">

                  <label>
                    Agudeza visual
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.agudeza_visual_od
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "agudeza_visual_od",
                        event.target.value
                      )
                    }
                    placeholder="20/20"
                  />

                </div>

              </div>

            </div>

            {/* OI */}

            <div className="bloque-receta">

              <h3 className="titulo-bloque">
                👁️ Ojo Izquierdo (OI)
              </h3>

              <div className="ojo-grid">

                <div className="campo">

                  <label>
                    Esfera · signo obligatorio (+ / -)
                  </label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      formulario.esfera_oi
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "esfera_oi",
                        event.target.value
                      )
                    }
                    placeholder="Ej: +2.25 o -2.25"
                  />

                </div>

                <div className="campo">

                  <label>
                    Cilindro · signo obligatorio (+ / -)
                  </label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      formulario.cilindro_oi
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "cilindro_oi",
                        event.target.value
                      )
                    }
                    placeholder="Ej: +0.50 o -0.50"
                  />

                </div>

                <div className="campo">

                  <label>
                    Eje
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="180"
                    step="1"
                    value={
                      formulario.eje_oi
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "eje_oi",
                        event.target.value
                      )
                    }
                    placeholder="0 - 180"
                  />

                </div>

                <div className="campo">

                  <label>
                    Adición · signo obligatorio (+ / -)
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.adicion_oi
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "adicion_oi",
                        event.target.value
                      )
                    }
                    placeholder="Ej: +2.00 o -2.00"
                  />

                </div>

                <div className="campo">

                  <label>
                    Agudeza visual
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.agudeza_visual_oi
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "agudeza_visual_oi",
                        event.target.value
                      )
                    }
                    placeholder="20/20"
                  />

                </div>

              </div>

            </div>

            {/* DATOS ÓPTICOS */}

            <div className="bloque-receta">

              <h3 className="titulo-bloque">
                👓 Datos ópticos
              </h3>

              <div className="recetas-grid">

                <div className="campo">

                  <label>
                    Distancia pupilar
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.distancia_pupilar
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "distancia_pupilar",
                        event.target.value
                      )
                    }
                    placeholder="Ej: 63 mm"
                  />

                </div>

                <div className="campo">

                  <label>
                    Tipo de cristal
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.tipo_cristal
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "tipo_cristal",
                        event.target.value
                      )
                    }
                    placeholder="Ej: Monofocal orgánico"
                  />

                </div>

                <div className="campo">

                  <label>
                    Armazón
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.armazon
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "armazon",
                        event.target.value
                      )
                    }
                    placeholder="Ej: Metal"
                  />

                </div>

                <div className="campo campo-full">

                  <label>
                    Observaciones
                  </label>

                  <textarea
                    value={
                      formulario.observaciones
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "observaciones",
                        event.target.value
                      )
                    }
                    placeholder="Indicaciones, observaciones o información adicional..."
                  />

                </div>

              </div>

            </div>

            {/* BOTONES */}

            <div className="botones-formulario">

              {recetaEditando && (
                <button
                  type="button"
                  className="boton-receta boton-secundario"
                  onClick={() =>
                    limpiarFormulario()
                  }
                  disabled={guardando}
                >
                  Cancelar edición
                </button>
              )}

              <button
                type="button"
                className="boton-receta boton-secundario"
                onClick={() =>
                  limpiarFormulario()
                }
                disabled={guardando}
              >
                Limpiar
              </button>

              <button
                type="submit"
                className="boton-receta boton-primario"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : recetaEditando
                  ? "Actualizar receta"
                  : "Guardar receta"}
              </button>

            </div>

          </form>

        </div>

        {/* =====================================================
            LISTADO DE RECETAS
            ===================================================== */}

        <div className="recetas-card">

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              marginBottom: "8px",
              flexWrap: "wrap"
            }}
          >

            <h2>
              Recetas registradas
            </h2>

            <span className="contador-recetas">
              {recetasFiltradas.length}{" "}
              {recetasFiltradas.length === 1
                ? "receta"
                : "recetas"}
            </span>

          </div>

          <p className="recetas-descripcion">
            Consulta, edita o elimina las
            recetas almacenadas.
          </p>

          <div className="busqueda-listado">

            <input
              type="text"
              value={
                busquedaListado
              }
              onChange={(event) =>
                setBusquedaListado(
                  event.target.value
                )
              }
              placeholder="Buscar por paciente, RUT, ficha o número de fórmula..."
            />

          </div>

          {cargando ? (
            <div className="estado-vacio">
              Cargando recetas...
            </div>
          ) : recetasFiltradas.length ===
            0 ? (
            <div className="estado-vacio">
              No hay recetas registradas.
            </div>
          ) : (
            <div className="tabla-scroll">

              <table className="tabla-recetas">

                <thead>

                  <tr>

                    <th>
                      Paciente
                    </th>

                    <th>
                      Nº fórmula
                    </th>

                    <th>
                      Fecha
                    </th>

                    <th>
                      Tipo
                    </th>

                    <th>
                      OD
                    </th>

                    <th>
                      OI
                    </th>

                    <th>
                      DP
                    </th>

                    <th>
                      Profesional
                    </th>

                    <th>
                      Acciones
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {recetasFiltradas.map(
                    (receta) => {
                      const paciente =
                        obtenerPaciente(
                          receta.paciente_id
                        );

                      return (
                        <tr
                          key={
                            receta.id
                          }
                        >

                          <td>

                            <div className="nombre-paciente">
                              {
                                obtenerNombrePaciente(
                                  receta.paciente_id
                                )
                              }
                            </div>

                            {paciente?.rut && (
                              <div className="dato-secundario">
                                RUT:{" "}
                                {
                                  paciente.rut
                                }
                              </div>
                            )}

                            {paciente?.ficha && (
                              <div className="dato-secundario">
                                Ficha:{" "}
                                {
                                  paciente.ficha
                                }
                              </div>
                            )}

                          </td>

                          <td>
                            {
                              receta.numero_formula ||
                              "-"
                            }
                          </td>

                          <td>
                            {formatearFecha(
                              receta.fecha_receta
                            )}
                          </td>

                          <td>
                            {
                              receta.tipo_receta ||
                              "-"
                            }
                          </td>

                          <td>
                            {formatearDioptriaListado(
                              receta.esfera_od,
                              receta.rx_od_original,
                              "esfera"
                            )}
                            {" / "}
                            {formatearDioptriaListado(
                              receta.cilindro_od,
                              receta.rx_od_original,
                              "cilindro"
                            )}
                            {" / "}
                            {receta.eje_od !== null ? `${receta.eje_od}°` : "-"}
                          </td>

                          <td>
                            {formatearDioptriaListado(
                              receta.esfera_oi,
                              receta.rx_oi_original,
                              "esfera"
                            )}
                            {" / "}
                            {formatearDioptriaListado(
                              receta.cilindro_oi,
                              receta.rx_oi_original,
                              "cilindro"
                            )}
                            {" / "}
                            {receta.eje_oi !== null ? `${receta.eje_oi}°` : "-"}
                          </td>

                          <td>
                            {
                              receta.distancia_pupilar ||
                              "-"
                            }
                          </td>

                          <td>
                            {
                              receta.profesional ||
                              "-"
                            }
                          </td>

                          <td>

                            <div className="acciones-tabla">

                              <button
                                type="button"
                                className="boton-tabla boton-editar"
                                onClick={() =>
                                  editarReceta(
                                    receta
                                  )
                                }
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                className="boton-tabla boton-eliminar"
                                onClick={() =>
                                  eliminarReceta(
                                    receta
                                  )
                                }
                              >
                                Eliminar
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

    </MainLayout>
  );
}

export default Recetas;
