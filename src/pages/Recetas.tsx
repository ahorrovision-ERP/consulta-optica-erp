import {
  useEffect,
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

function convertirNumeroConSigno(
  valor: string
): number | null {
  const texto = valor.trim().replace(",", ".");

  if (!texto) {
    return null;
  }

  const numero = Number(texto);

  if (!Number.isFinite(numero)) {
    return null;
  }

  return numero;
}

function tieneSignoExplicito(
  valor: string
): boolean {
  return /^[+-]\d+(?:[.,]\d+)?$/.test(
    valor.trim()
  );
}

function validarDioptria(
  valor: string,
  campo: string
): string | null {
  const texto = valor.trim();

  if (!texto) {
    return null;
  }

  if (!tieneSignoExplicito(texto)) {
    return `${campo} debe comenzar explícitamente con + o -. Ejemplo: +1.00 o -1.00.`;
  }

  const numero = convertirNumeroConSigno(texto);

  if (numero === null) {
    return `${campo} no contiene un número válido.`;
  }

  return null;
}

function extraerComponentesRxOriginal(
  valor: string | null
): {
  esfera: string;
  cilindro: string;
  eje: string;
} {
  const texto = String(valor ?? "").trim();

  if (!texto) {
    return {
      esfera: "",
      cilindro: "",
      eje: ""
    };
  }

  const completa = texto.match(
    /^\s*([+-]\d+(?:[.,]\d+)?)\s+([+-]\d+(?:[.,]\d+)?)°(\d{1,3})\s*$/
  );

  if (completa) {
    return {
      esfera: completa[1],
      cilindro: completa[2],
      eje: completa[3]
    };
  }

  const simple = texto.match(
    /^\s*([+-]\d+(?:[.,]\d+)?)\s*$/
  );

  if (simple) {
    return {
      esfera: simple[1],
      cilindro: "",
      eje: ""
    };
  }

  return {
    esfera: "",
    cilindro: "",
    eje: ""
  };
}

function valorParaEdicion(
  valor: number | null,
  original: string | null,
  componente: "esfera" | "cilindro"
): string {
  const partes = extraerComponentesRxOriginal(original);

  if (componente === "esfera" && partes.esfera) {
    return partes.esfera;
  }

  if (componente === "cilindro" && partes.cilindro) {
    return partes.cilindro;
  }

  if (valor === null || valor === undefined) {
    return "";
  }

  // Un número negativo conserva su signo matemáticamente.
  // Para valores 0 o positivos cuyo signo original no está disponible,
  // no inventamos "+": obligamos a que el usuario lo ingrese explícitamente.
  if (valor < 0) {
    return String(valor);
  }

  return "";
}

function construirRxOriginal(
  esfera: string,
  cilindro: string,
  eje: string
): string | null {
  const e = esfera.trim();
  const c = cilindro.trim();
  const a = eje.trim();

  if (!e && !c) {
    return null;
  }

  if (c) {
    return a
      ? `${e} ${c}°${a}`
      : `${e} ${c}`;
  }

  return e;
}

function mostrarDioptriaListado(
  valor: number | null,
  original: string | null,
  componente: "esfera" | "cilindro"
): string {
  const partes = extraerComponentesRxOriginal(original);

  if (
    componente === "esfera" &&
    partes.esfera
  ) {
    return partes.esfera;
  }

  if (
    componente === "cilindro" &&
    partes.cilindro
  ) {
    return partes.cilindro;
  }

  if (valor === null || valor === undefined) {
    return "-";
  }

  if (valor < 0) {
    return String(valor);
  }

  return "Signo no registrado";
}

function formatearEjeListado(
  valor: number | null
): string {
  if (valor === null || valor === undefined) {
    return "-";
  }

  return `${valor}°`;
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

  const [pacientesBusqueda, setPacientesBusqueda] =
    useState<Paciente[]>([]);

  const [buscandoPacientes, setBuscandoPacientes] =
    useState(false);

  const [
    busquedaListado,
    setBusquedaListado
  ] = useState("");

  const [paginaRecetas, setPaginaRecetas] =
    useState(1);

  const [porPaginaRecetas, setPorPaginaRecetas] =
    useState(25);

  const [totalRecetas, setTotalRecetas] =
    useState(0);

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
    void cargarDatos(paginaRecetas);
  }, [paginaRecetas, porPaginaRecetas, busquedaListado]);

  useEffect(() => {
    const texto = pacienteBusqueda.trim();

    if (!texto) {
      setPacientesBusqueda([]);
      setBuscandoPacientes(false);
      return;
    }

    const temporizador = window.setTimeout(() => {
      void buscarPacientes(texto);
    }, 300);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [pacienteBusqueda]);

  async function buscarPacientes(texto: string) {
    setBuscandoPacientes(true);

    const textoSeguro = texto.trim();

    if (!textoSeguro) {
      setPacientesBusqueda([]);
      setBuscandoPacientes(false);
      return;
    }

    const { data, error } = await supabase
      .from("pacientes")
      .select("id, ficha, rut, nombres, apellidos")
      .or(
        `nombres.ilike.%${textoSeguro}%,apellidos.ilike.%${textoSeguro}%,rut.ilike.%${textoSeguro}%,ficha.ilike.%${textoSeguro}%`
      )
      .order("nombres", { ascending: true })
      .order("apellidos", { ascending: true })
      .limit(25);

    if (error) {
      console.error("Error buscando pacientes:", error);
      setErrorMensaje(
        "No se pudieron buscar pacientes: " + error.message
      );
      setPacientesBusqueda([]);
      setBuscandoPacientes(false);
      return;
    }

    const encontrados = (data ?? []) as Paciente[];
    setPacientesBusqueda(encontrados);

    setPacientes((actuales) => {
      const mapa = new Map<number, Paciente>();

      actuales.forEach((paciente) => mapa.set(paciente.id, paciente));
      encontrados.forEach((paciente) => mapa.set(paciente.id, paciente));

      return Array.from(mapa.values());
    });

    setBuscandoPacientes(false);
  }

  async function cargarDatos(pagina = paginaRecetas) {
    setCargando(true);

    const desde = (pagina - 1) * porPaginaRecetas;
    const hasta = desde + porPaginaRecetas - 1;
    const textoBusqueda = busquedaListado.trim();

    let consultaRecetas = supabase
      .from("recetas")
      .select("*", { count: "exact" })
      .order("fecha_receta", { ascending: false })
      .order("id", { ascending: false });

    if (textoBusqueda) {
      consultaRecetas = consultaRecetas.ilike(
        "numero_formula",
        `%${textoBusqueda}%`
      );
    }

    const { data: recetasData, error: recetasError, count } =
      await consultaRecetas.range(desde, hasta);

    if (recetasError) {
      console.error("Error cargando recetas:", recetasError);
      setErrorMensaje(
        "No se pudieron cargar las recetas: " + recetasError.message
      );
      setRecetas([]);
      setTotalRecetas(0);
      setCargando(false);
      return;
    }

    const recetasPagina = (recetasData ?? []) as Receta[];
    setRecetas(recetasPagina);
    setTotalRecetas(count ?? 0);
    setPaginaRecetas(pagina);

    const idsPacientes = Array.from(
      new Set(
        recetasPagina
          .map((receta) => receta.paciente_id)
          .filter((id): id is number =>
            typeof id === "number" && Number.isFinite(id)
          )
      )
    );

    if (idsPacientes.length > 0) {
      const { data: pacientesData, error: pacientesError } =
        await supabase
          .from("pacientes")
          .select("id, ficha, rut, nombres, apellidos")
          .in("id", idsPacientes);

      if (pacientesError) {
        console.error(
          "Error cargando pacientes de recetas:",
          pacientesError
        );
        setErrorMensaje(
          "No se pudieron cargar los pacientes de las recetas: " +
            pacientesError.message
        );
      } else {
        setPacientes((actuales) => {
          const mapa = new Map<number, Paciente>();

          actuales.forEach((paciente) => mapa.set(paciente.id, paciente));
          (pacientesData ?? []).forEach((paciente) => {
            mapa.set(paciente.id, paciente as Paciente);
          });

          return Array.from(mapa.values());
        });
      }
    }

    setCargando(false);
  }

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalRecetas / porPaginaRecetas)
  );

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

  const pacientesOpciones = (() => {
    const mapa = new Map<number, Paciente>();

    pacientesBusqueda.forEach((paciente) => mapa.set(paciente.id, paciente));

    const pacienteSeleccionado = obtenerPaciente(
      formulario.paciente_id ? Number(formulario.paciente_id) : null
    );

    if (pacienteSeleccionado) {
      mapa.set(pacienteSeleccionado.id, pacienteSeleccionado);
    }

    return Array.from(mapa.values());
  })();

  function seleccionarPaciente(
    pacienteId: string
  ) {
    actualizarCampo(
      "paciente_id",
      pacienteId
    );

    const paciente =
      pacientesBusqueda.find(
        (item) => item.id === Number(pacienteId)
      ) ||
      pacientes.find(
        (item) => item.id === Number(pacienteId)
      );

    if (paciente) {
      setPacientes((actuales) => {
        if (actuales.some((item) => item.id === paciente.id)) {
          return actuales;
        }

        return [...actuales, paciente];
      });

      setPacienteBusqueda(
        `${paciente.nombres} ${paciente.apellidos || ""}`.trim()
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
    setPacientesBusqueda([]);
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

      esfera_od: valorParaEdicion(
        receta.esfera_od,
        receta.rx_od_original,
        "esfera"
      ),

      cilindro_od: valorParaEdicion(
        receta.cilindro_od,
        receta.rx_od_original,
        "cilindro"
      ),

      eje_od:
        receta.eje_od !== null
          ? String(receta.eje_od)
          : extraerComponentesRxOriginal(
              receta.rx_od_original
            ).eje,

      adicion_od:
        receta.adicion_od || "",

      agudeza_visual_od:
        receta.agudeza_visual_od || "",

      esfera_oi: valorParaEdicion(
        receta.esfera_oi,
        receta.rx_oi_original,
        "esfera"
      ),

      cilindro_oi: valorParaEdicion(
        receta.cilindro_oi,
        receta.rx_oi_original,
        "cilindro"
      ),

      eje_oi:
        receta.eje_oi !== null
          ? String(receta.eje_oi)
          : extraerComponentesRxOriginal(
              receta.rx_oi_original
            ).eje,

      adicion_oi:
        receta.adicion_oi || "",

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

    const errorEsferaOD = validarDioptria(
      formulario.esfera_od,
      "La esfera OD"
    );

    if (errorEsferaOD) {
      setErrorMensaje(errorEsferaOD);
      return;
    }

    const errorCilindroOD = validarDioptria(
      formulario.cilindro_od,
      "El cilindro OD"
    );

    if (errorCilindroOD) {
      setErrorMensaje(errorCilindroOD);
      return;
    }

    const errorEsferaOI = validarDioptria(
      formulario.esfera_oi,
      "La esfera OI"
    );

    if (errorEsferaOI) {
      setErrorMensaje(errorEsferaOI);
      return;
    }

    const errorCilindroOI = validarDioptria(
      formulario.cilindro_oi,
      "El cilindro OI"
    );

    if (errorCilindroOI) {
      setErrorMensaje(errorCilindroOI);
      return;
    }

    const errorAdicionOD = validarDioptria(
      formulario.adicion_od,
      "La adición OD"
    );

    if (errorAdicionOD) {
      setErrorMensaje(errorAdicionOD);
      return;
    }

    const errorAdicionOI = validarDioptria(
      formulario.adicion_oi,
      "La adición OI"
    );

    if (errorAdicionOI) {
      setErrorMensaje(errorAdicionOI);
      return;
    }

    const esferaOD =
      convertirNumeroConSigno(
        formulario.esfera_od
      );

    const cilindroOD =
      convertirNumeroConSigno(
        formulario.cilindro_od
      );

    const ejeOD =
      convertirNumeroConSigno(
        formulario.eje_od
      );

    const esferaOI =
      convertirNumeroConSigno(
        formulario.esfera_oi
      );

    const cilindroOI =
      convertirNumeroConSigno(
        formulario.cilindro_oi
      );

    const ejeOI =
      convertirNumeroConSigno(
        formulario.eje_oi
      );

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

      rx_od_original:
        construirRxOriginal(
          formulario.esfera_od,
          formulario.cilindro_od,
          formulario.eje_od
        ),

      rx_oi_original:
        construirRxOriginal(
          formulario.esfera_oi,
          formulario.cilindro_oi,
          formulario.eje_oi
        ),

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

    setPaginaRecetas(1);
    await cargarDatos(1);
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

    const paginaObjetivo = Math.min(
      paginaRecetas,
      Math.max(
        1,
        Math.ceil(
          Math.max(totalRecetas - 1, 0) /
            porPaginaRecetas
        )
      )
    );

    await cargarDatos(paginaObjetivo);
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

          .paciente-buscando,
          .paciente-sin-resultados {
            margin-top: 8px;
            color: #777777;
            font-size: 12px;
          }

          .contador-recetas {
            color: #888888;
            font-size: 13px;
          }

          .paginacion-recetas {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-top: 18px;
            padding-top: 16px;
            border-top: 1px solid #eeeeee;
            flex-wrap: wrap;
          }

          .paginacion-grupo {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .paginacion-boton {
            border: 1px solid #dddddd;
            background: #ffffff;
            color: #333333;
            border-radius: 8px;
            padding: 8px 11px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          }

          .paginacion-boton:disabled {
            opacity: .45;
            cursor: not-allowed;
          }

          .paginacion-select {
            border: 1px solid #dddddd;
            border-radius: 8px;
            padding: 8px 10px;
            background: #ffffff;
            color: #333333;
            font-size: 12px;
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
            Registra y administra la receta óptica asociada al paciente. Las dioptrías requieren signo explícito (+/-).
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

                    {pacientesOpciones.map(
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
                          {
                            paciente.ficha
                              ? ` · Ficha ${paciente.ficha}`
                              : ""
                          }
                        </option>
                      )
                    )}

                  </select>

                  {buscandoPacientes && (
                    <div className="paciente-buscando">
                      Buscando pacientes...
                    </div>
                  )}

                  {!buscandoPacientes &&
                    pacienteBusqueda.trim() &&
                    pacientesOpciones.length === 0 && (
                      <div className="paciente-sin-resultados">
                        No se encontraron pacientes con esa búsqueda.
                      </div>
                    )}

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
                    Esfera
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
                    placeholder="+1.00 o -1.00"
                  />

                </div>

                <div className="campo">

                  <label>
                    Cilindro
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
                    placeholder="+0.50 o -0.50"
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
                    Adición
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
                    placeholder="+2.00 o -2.00"
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

              <div
                style={{
                  marginTop: "10px",
                  color: "#777777",
                  fontSize: "12px"
                }}
              >
                Las dioptrías deben llevar signo explícito: +1.00 o -1.00. No se acepta un valor sin + o -.
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
                    Esfera
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
                    placeholder="-2.25"
                  />

                </div>

                <div className="campo">

                  <label>
                    Cilindro
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
                    placeholder="-0.50"
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
                    Adición
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
                    placeholder="+2.00 o -2.00"
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

              <div
                style={{
                  marginTop: "10px",
                  color: "#777777",
                  fontSize: "12px"
                }}
              >
                Las dioptrías deben llevar signo explícito: +1.00 o -1.00. No se acepta un valor sin + o -.
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
              {totalRecetas}{" "}
              {totalRecetas === 1
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
              onChange={(event) => {
                setBusquedaListado(event.target.value);
                setPaginaRecetas(1);
              }}
              placeholder="Buscar por número de fórmula..."
            />

          </div>

          {cargando ? (
            <div className="estado-vacio">
              Cargando recetas...
            </div>
          ) : recetas.length ===
            0 ? (
            <div className="estado-vacio">
              No hay recetas registradas.
            </div>
          ) : (
            <>
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

                  {recetas.map(
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
                            {mostrarDioptriaListado(
                              receta.esfera_od,
                              receta.rx_od_original,
                              "esfera"
                            )}
                            {" / "}
                            {mostrarDioptriaListado(
                              receta.cilindro_od,
                              receta.rx_od_original,
                              "cilindro"
                            )}
                            {" / "}
                            {formatearEjeListado(
                              receta.eje_od
                            )}
                          </td>

                          <td>
                            {mostrarDioptriaListado(
                              receta.esfera_oi,
                              receta.rx_oi_original,
                              "esfera"
                            )}
                            {" / "}
                            {mostrarDioptriaListado(
                              receta.cilindro_oi,
                              receta.rx_oi_original,
                              "cilindro"
                            )}
                            {" / "}
                            {formatearEjeListado(
                              receta.eje_oi
                            )}
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

            <div className="paginacion-recetas">
              <div className="paginacion-grupo">
                <button
                  type="button"
                  className="paginacion-boton"
                  onClick={() => setPaginaRecetas(1)}
                  disabled={paginaRecetas <= 1 || cargando}
                >
                  « Primera
                </button>

                <button
                  type="button"
                  className="paginacion-boton"
                  onClick={() =>
                    setPaginaRecetas((actual) => Math.max(1, actual - 1))
                  }
                  disabled={paginaRecetas <= 1 || cargando}
                >
                  ‹ Anterior
                </button>

                <span className="contador-recetas">
                  Página {paginaRecetas} de {totalPaginas}
                </span>

                <button
                  type="button"
                  className="paginacion-boton"
                  onClick={() =>
                    setPaginaRecetas((actual) =>
                      Math.min(totalPaginas, actual + 1)
                    )
                  }
                  disabled={paginaRecetas >= totalPaginas || cargando}
                >
                  Siguiente ›
                </button>

                <button
                  type="button"
                  className="paginacion-boton"
                  onClick={() => setPaginaRecetas(totalPaginas)}
                  disabled={paginaRecetas >= totalPaginas || cargando}
                >
                  Última »
                </button>
              </div>

              <div className="paginacion-grupo">
                <span className="contador-recetas">
                  Mostrar
                </span>

                <select
                  className="paginacion-select"
                  value={porPaginaRecetas}
                  onChange={(event) => {
                    setPorPaginaRecetas(Number(event.target.value));
                    setPaginaRecetas(1);
                  }}
                  disabled={cargando}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>

                <span className="contador-recetas">
                  por página
                </span>
              </div>
              </div>
            </>
          )}

        </div>

      </div>

    </MainLayout>
  );
}

export default Recetas;
