import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";

import MainLayout from "../layout/MainLayout";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import PatientModal from "../components/PatientModal";
import PatientForm from "../components/PatientForm";

interface Paciente {
  id: number;
  ficha: string | null;
  rut: string | null;
  rut_titular?: string | null;
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
  fecha_registro: string | null;
}

function normalizarTexto(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarDocumento(valor: unknown): string {
  return String(valor ?? "")
    .toUpperCase()
    .replace(/[^0-9K]/g, "");
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

    if (i > 0 && posiciones % 3 === 0) {
      resultado += ".";
    }

    resultado += cuerpo[i];
  }

  return `${resultado}-${dv}`;
}

function capitalizarTexto(valor: unknown): string {
  const texto = String(valor ?? "").trim();

  if (!texto) return "";

  return texto
    .toLocaleLowerCase("es-CL")
    .split(" ")
    .filter(Boolean)
    .map((palabra) =>
      palabra
        .split("-")
        .map((parte) =>
          parte ? parte.charAt(0).toLocaleUpperCase("es-CL") + parte.slice(1) : ""
        )
        .join("-")
    )
    .join(" ");
}

function escaparFiltroSupabase(valor: string): string {
  return valor
    .replace(/[%(),]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escaparHTML(valor: unknown): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function Pacientes() {
  const navigate = useNavigate();

  const [registros, setRegistros] = useState<Paciente[]>([]);
  const [filas, setFilas] = useState<any[][]>([]);
  const [seleccionado, setSeleccionado] = useState<Paciente | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [soloTitular, setSoloTitular] = useState(false);

  const [recetasPorPaciente, setRecetasPorPaciente] =
    useState<Map<number, number>>(new Map());

  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [errorMensaje, setErrorMensaje] = useState("");

  const [orden, setOrden] = useState<"id" | "nombre" | "rut">("id");
  const [ascendente, setAscendente] = useState(true);

  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(25);
  const [totalRegistros, setTotalRegistros] = useState(0);

  const [gruposTitular, setGruposTitular] = useState<Map<string, number>>(
    new Map()
  );

  const columnas = [
    "ID",
    "Ficha",
    "RUT paciente",
    "RUT titular",
    "Paciente",
    "Contacto",
    "Recetas",
    "Acciones",
  ];

  async function cargarPacientes() {
    setCargando(true);
    setErrorMensaje("");

    try {
      const desde = (pagina - 1) * porPagina;
      const hasta = desde + porPagina - 1;

      let consulta = supabase
        .from("pacientes")
        .select("*", { count: "exact" });

      const textoOriginal = busqueda.trim();
      const texto = escaparFiltroSupabase(textoOriginal);
      const documento = normalizarDocumento(textoOriginal);

      if (soloTitular) {
        consulta = consulta.not("rut_titular", "is", null);
      }

      if (texto) {
        const palabras = normalizarTexto(texto)
          .split(" ")
          .filter(Boolean)
          .slice(0, 5);

        const condiciones: string[] = [];

        palabras.forEach((palabra) => {
          const filtro = escaparFiltroSupabase(palabra);

          if (!filtro) return;

          condiciones.push(`nombres.ilike.%${filtro}%`);
          condiciones.push(`apellidos.ilike.%${filtro}%`);
          condiciones.push(`ficha.ilike.%${filtro}%`);
          condiciones.push(`telefono.ilike.%${filtro}%`);
          condiciones.push(`email.ilike.%${filtro}%`);
          condiciones.push(`comuna.ilike.%${filtro}%`);
          condiciones.push(`ciudad.ilike.%${filtro}%`);
          condiciones.push(`rut.ilike.%${filtro}%`);
          condiciones.push(`rut_titular.ilike.%${filtro}%`);
        });

        if (documento) {
          condiciones.push(`rut.ilike.%${documento}%`);
          condiciones.push(`rut_titular.ilike.%${documento}%`);
        }

        if (condiciones.length) {
          consulta = consulta.or(condiciones.join(","));
        }
      }

      if (orden === "nombre") {
        consulta = consulta
          .order("nombres", { ascending: ascendente })
          .order("apellidos", { ascending: ascendente })
          .order("id", { ascending: true });
      } else if (orden === "rut") {
        consulta = consulta
          .order("rut_titular", {
            ascending: ascendente,
            nullsFirst: false,
          })
          .order("rut", {
            ascending: ascendente,
            nullsFirst: false,
          })
          .order("id", { ascending: true });
      } else {
        consulta = consulta.order("id", { ascending: ascendente });
      }

      const {
        data: pacientesData,
        error: pacientesError,
        count,
      } = await consulta.range(desde, hasta);

      if (pacientesError) {
        throw pacientesError;
      }

      const lista = (pacientesData ?? []) as Paciente[];

      setRegistros(lista);
      setTotalRegistros(count ?? 0);

      const ids = lista.map((p) => p.id);

      const conteos = new Map<number, number>();

      if (ids.length) {
        const { data: recetasData, error: recetasError } = await supabase
          .from("recetas")
          .select("paciente_id")
          .in("paciente_id", ids);

        if (recetasError) {
          throw recetasError;
        }

        (recetasData ?? []).forEach((r) => {
          const id = Number(r.paciente_id);

          if (Number.isFinite(id)) {
            conteos.set(id, (conteos.get(id) ?? 0) + 1);
          }
        });
      }

      setRecetasPorPaciente(conteos);

      const rutsTitulares = Array.from(
        new Set(
          lista
            .map((p) => normalizarDocumento(p.rut_titular))
            .filter(Boolean)
        )
      );

      const grupos = new Map<string, number>();

      if (rutsTitulares.length) {
        const { data: asociados, error: asociadosError } = await supabase
          .from("pacientes")
          .select("rut_titular")
          .in("rut_titular", rutsTitulares);

        if (asociadosError) {
          throw asociadosError;
        }

        (asociados ?? []).forEach((persona) => {
          const rut = normalizarDocumento(persona.rut_titular);

          if (rut) {
            grupos.set(rut, (grupos.get(rut) ?? 0) + 1);
          }
        });
      }

      setGruposTitular(grupos);
    } catch (error: unknown) {
      console.error(error);

      const mensajeError =
        error instanceof Error
          ? error.message
          : String(error ?? "error desconocido");

      setErrorMensaje(
        `No se pudieron cargar los pacientes: ${mensajeError}`
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      void cargarPacientes();
    }, 250);

    return () => window.clearTimeout(temporizador);
  }, [pagina, porPagina, busqueda, soloTitular, orden, ascendente]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, soloTitular, porPagina]);

  useEffect(() => {
    setFilas(
      registros.map((p) => {
        const nombre = `${capitalizarTexto(p.nombres)} ${capitalizarTexto(
          p.apellidos
        )}`.trim();

        const rutTitular = normalizarDocumento(p.rut_titular);
        const personas = rutTitular
          ? gruposTitular.get(rutTitular) ?? 0
          : 0;

        const contacto = [p.telefono, p.email]
          .filter(Boolean)
          .join(" · ");

        return [
          String(p.id),
          p.ficha || "—",
          p.rut ? formatearRut(p.rut) : "—",
          p.rut_titular ? formatearRut(p.rut_titular) : "—",
          [
            nombre,
            personas > 1
              ? `RUT compartido · ${personas} personas`
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
          contacto || "—",
          String(recetasPorPaciente.get(p.id) ?? 0),
          p,
        ];
      })
    );
  }, [registros, gruposTitular, recetasPorPaciente]);

  function editarPaciente(p: Paciente) {
    setSeleccionado(p);
    setModalAbierto(true);
    setMensaje("");
    setErrorMensaje("");
  }

  async function eliminarPaciente(p: Paciente) {
    const nombre = `${capitalizarTexto(p.nombres)} ${capitalizarTexto(
      p.apellidos
    )}`.trim();

    const tieneRecetas = (recetasPorPaciente.get(p.id) ?? 0) > 0;

    const pregunta = tieneRecetas
      ? `El paciente ${nombre} tiene recetas asociadas. La base de datos puede impedir su eliminación.\n\n¿Intentar eliminarlo?`
      : `¿Eliminar a ${nombre}?`;

    if (!window.confirm(pregunta)) return;

    setMensaje("");
    setErrorMensaje("");

    const { error } = await supabase
      .from("pacientes")
      .delete()
      .eq("id", p.id);

    if (error) {
      setErrorMensaje(
        `No se pudo eliminar el paciente: ${error.message}`
      );
      return;
    }

    setMensaje("✓ Paciente eliminado correctamente.");

    if (registros.length === 1 && pagina > 1) {
      setPagina((valor) => valor - 1);
    } else {
      await cargarPacientes();
    }
  }

  function cambiarOrden(nueva: "id" | "nombre" | "rut") {
    if (orden === nueva) {
      setAscendente((valor) => !valor);
    } else {
      setOrden(nueva);
      setAscendente(true);
      setPagina(1);
    }
  }

  function cambiarPorPagina(valor: number) {
    setPorPagina(valor);
    setPagina(1);
  }

  function paginaAnterior() {
    setPagina((valor) => Math.max(1, valor - 1));
  }

  function paginaSiguiente() {
    const totalPaginas = Math.max(
      1,
      Math.ceil(totalRegistros / porPagina)
    );

    setPagina((valor) => Math.min(totalPaginas, valor + 1));
  }

  async function exportarExcel() {
    setCargando(true);
    setErrorMensaje("");

    try {
      let consulta = supabase
        .from("pacientes")
        .select("*");

      const texto = escaparFiltroSupabase(busqueda.trim());

      if (soloTitular) {
        consulta = consulta.not("rut_titular", "is", null);
      }

      if (texto) {
        const palabras = normalizarTexto(texto)
          .split(" ")
          .filter(Boolean)
          .slice(0, 5);

        const condiciones: string[] = [];

        palabras.forEach((palabra) => {
          const filtro = escaparFiltroSupabase(palabra);

          if (!filtro) return;

          condiciones.push(`nombres.ilike.%${filtro}%`);
          condiciones.push(`apellidos.ilike.%${filtro}%`);
          condiciones.push(`ficha.ilike.%${filtro}%`);
          condiciones.push(`telefono.ilike.%${filtro}%`);
          condiciones.push(`email.ilike.%${filtro}%`);
          condiciones.push(`comuna.ilike.%${filtro}%`);
          condiciones.push(`ciudad.ilike.%${filtro}%`);
          condiciones.push(`rut.ilike.%${filtro}%`);
          condiciones.push(`rut_titular.ilike.%${filtro}%`);
        });

        if (condiciones.length) {
          consulta = consulta.or(condiciones.join(","));
        }
      }

      const { data, error } = await consulta.order("id", {
        ascending: true,
      });

      if (error) throw error;

      const lista = (data ?? []) as Paciente[];

      if (!lista.length) {
        alert("No hay pacientes para exportar.");
        return;
      }

      const ids = lista.map((p) => p.id);
      const conteos = new Map<number, number>();

      if (ids.length) {
        const { data: recetasData, error: recetasError } = await supabase
          .from("recetas")
          .select("paciente_id")
          .in("paciente_id", ids);

        if (recetasError) throw recetasError;

        (recetasData ?? []).forEach((r) => {
          const id = Number(r.paciente_id);

          if (Number.isFinite(id)) {
            conteos.set(id, (conteos.get(id) ?? 0) + 1);
          }
        });
      }

      const encabezados = [
        "ID",
        "Ficha",
        "RUT paciente",
        "RUT titular",
        "Nombres",
        "Apellidos",
        "Fecha nacimiento",
        "Edad",
        "Sexo",
        "Teléfono",
        "Email",
        "Dirección",
        "Comuna",
        "Ciudad",
        "Ocupación",
        "Observaciones",
        "Fecha registro",
        "Cantidad recetas",
      ];

      const datos = lista.map((p) => [
        p.id,
        p.ficha || "",
        p.rut || "",
        p.rut_titular || "",
        p.nombres || "",
        p.apellidos || "",
        p.fecha_nacimiento || "",
        p.edad ?? "",
        p.sexo || "",
        p.telefono || "",
        p.email || "",
        p.direccion || "",
        p.comuna || "",
        p.ciudad || "",
        p.ocupacion || "",
        p.observaciones || "",
        p.fecha_registro || "",
        conteos.get(p.id) ?? 0,
      ]);

      const hoja = XLSX.utils.aoa_to_sheet([
        encabezados,
        ...datos,
      ]);

      hoja["!cols"] = encabezados.map((_, i) => ({
        wch:
          [
            8, 15, 16, 16, 22, 24, 18, 8, 14, 18, 30, 30, 18,
            18, 22, 40, 22, 16,
          ][i] || 16,
      }));

      const libro = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        libro,
        hoja,
        "Pacientes"
      );

      XLSX.writeFile(
        libro,
        `pacientes-ahorro-vision-${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      );
    } catch (error: unknown) {
      console.error(error);

      const mensajeError =
        error instanceof Error
          ? error.message
          : String(error ?? "error desconocido");

      setErrorMensaje(
        `No se pudo exportar el listado: ${mensajeError}`
      );
    } finally {
      setCargando(false);
    }
  }

  function descargarPlantilla() {
    const encabezados = [
      "Ficha",
      "RUT paciente",
      "RUT titular",
      "Nombres",
      "Apellidos",
      "Fecha nacimiento",
      "Edad",
      "Sexo",
      "Teléfono",
      "Email",
      "Dirección",
      "Comuna",
      "Ciudad",
      "Ocupación",
      "Observaciones",
    ];

    const ejemplo = [
      "F-0001",
      "12345678-9",
      "",
      "Juan",
      "Pérez",
      "1980-05-15",
      46,
      "Masculino",
      "+56912345678",
      "juan@email.com",
      "Av. Ejemplo 123",
      "Ñuñoa",
      "Santiago",
      "Profesional",
      "Cliente",
    ];

    const hoja = XLSX.utils.aoa_to_sheet([
      encabezados,
      ejemplo,
    ]);

    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      libro,
      hoja,
      "Pacientes"
    );

    XLSX.writeFile(
      libro,
      "plantilla-pacientes-ahorro-vision.xlsx"
    );
  }

  async function imprimirPDF() {
    setCargando(true);

    try {
      const { data, error } = await supabase
        .from("pacientes")
        .select(
          "id,ficha,rut,rut_titular,nombres,apellidos,telefono,email,comuna"
        )
        .order("id", { ascending: true });

      if (error) throw error;

      const lista = (data ?? []) as Paciente[];

      if (!lista.length) {
        alert("No hay pacientes para imprimir.");
        return;
      }

      const html = lista
        .map(
          (p) => `
          <tr>
            <td>${escaparHTML(p.id)}</td>
            <td>${escaparHTML(p.ficha || "")}</td>
            <td>${escaparHTML(formatearRut(p.rut))}</td>
            <td>${escaparHTML(formatearRut(p.rut_titular))}</td>
            <td>${escaparHTML(
              `${capitalizarTexto(p.nombres)} ${capitalizarTexto(
                p.apellidos
              )}`.trim()
            )}</td>
            <td>${escaparHTML(p.telefono || "")}</td>
            <td>${escaparHTML(p.email || "")}</td>
            <td>${escaparHTML(p.comuna || "")}</td>
          </tr>`
        )
        .join("");

      const ventana = window.open(
        "",
        "_blank",
        "width=1200,height=800"
      );

      if (!ventana) {
        alert(
          "El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para este sitio."
        );
        return;
      }

      ventana.document.write(`
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Pacientes - Ahorro Visión</title>
          <style>
            @page{size:A4 landscape;margin:10mm}
            body{font-family:Arial,sans-serif;color:#222;margin:0}
            h1{color:#cc001f;margin:0 0 4px}
            .sub{color:#666;margin-bottom:18px;font-size:13px}
            table{width:100%;border-collapse:collapse;font-size:9px}
            th{background:#f1f1f1;text-align:left;padding:6px;border:1px solid #ccc}
            td{padding:5px;border:1px solid #ddd;vertical-align:top}
          </style>
        </head>
        <body>
          <h1>Ahorro Visión ERP</h1>
          <div class="sub">
            Listado de pacientes · ${new Date().toLocaleDateString(
              "es-CL"
            )}
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ficha</th>
                <th>RUT paciente</th>
                <th>RUT titular</th>
                <th>Paciente</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Comuna</th>
              </tr>
            </thead>
            <tbody>${html}</tbody>
          </table>
          <script>
            window.onload=function(){window.print()};
            window.onafterprint=function(){window.close()};
          </script>
        </body>
        </html>
      `);

      ventana.document.close();
    } catch (error: unknown) {
      console.error(error);

      const mensajeError =
        error instanceof Error
          ? error.message
          : String(error ?? "error desconocido");

      setErrorMensaje(
        `No se pudo preparar la impresión: ${mensajeError}`
      );
    } finally {
      setCargando(false);
    }
  }

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalRegistros / porPagina)
  );

  const desdeRegistro =
    totalRegistros === 0
      ? 0
      : (pagina - 1) * porPagina + 1;

  const hastaRegistro = Math.min(
    pagina * porPagina,
    totalRegistros
  );

  return (
    <MainLayout>
      <PageHeader
        titulo="Pacientes"
        subtitulo="Gestión de pacientes, RUT titulares y personas asociadas"
      />

      {(mensaje || errorMensaje) && (
        <div
          style={{
            marginBottom: 20,
            padding: "13px 16px",
            borderRadius: 10,
            background: errorMensaje ? "#fff0f1" : "#eef8f0",
            color: errorMensaje ? "#b00020" : "#25723a",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {errorMensaje || mensaje}
        </div>
      )}

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 16,
          marginBottom: 18,
          boxShadow: "0 4px 14px rgba(0,0,0,.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por nombre, apellido, RUT, RUT titular, ficha, teléfono o email..."
            style={{
              flex: 1,
              minWidth: 320,
              boxSizing: "border-box",
              border: "1px solid #d8d8d8",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 14,
              outline: "none",
            }}
          />

          <button
            className="btn-primary"
            onClick={() => {
              setSeleccionado(null);
              setModalAbierto(true);
              setMensaje("");
              setErrorMensaje("");
            }}
          >
            + Nuevo
          </button>

          <button
            className="btn-secondary"
            onClick={() => void exportarExcel()}
          >
            ↓ Exportar Excel
          </button>

          <button
            className="btn-secondary"
            onClick={descargarPlantilla}
          >
            ↓ Plantilla
          </button>

          <button
            className="btn-secondary"
            onClick={() => void imprimirPDF()}
          >
            🖨️ Imprimir / PDF
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: 12,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setSoloTitular((valor) => !valor);
              setPagina(1);
            }}
            style={{
              border: "1px solid #d5d5d5",
              background: soloTitular ? "#f3f3f3" : "#fff",
              color: "#333",
              borderRadius: 8,
              padding: "8px 11px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {soloTitular
              ? "✓ Solo con RUT titular"
              : "Mostrar solo con RUT titular"}
          </button>

          <span style={{ fontSize: 13, color: "#666" }}>
            {totalRegistros.toLocaleString("es-CL")} paciente(s)
          </span>

          <span style={{ color: "#ccc" }}>•</span>

          <button
            type="button"
            onClick={() => cambiarOrden("id")}
            style={{
              border: 0,
              background: "transparent",
              color: orden === "id" ? "#cc001f" : "#666",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ID {orden === "id" ? (ascendente ? "↑" : "↓") : ""}
          </button>

          <button
            type="button"
            onClick={() => cambiarOrden("nombre")}
            style={{
              border: 0,
              background: "transparent",
              color: orden === "nombre" ? "#cc001f" : "#666",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Nombre{" "}
            {orden === "nombre"
              ? ascendente
                ? "↑"
                : "↓"
              : ""}
          </button>

          <button
            type="button"
            onClick={() => cambiarOrden("rut")}
            style={{
              border: 0,
              background: "transparent",
              color: orden === "rut" ? "#cc001f" : "#666",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            RUT {orden === "rut" ? (ascendente ? "↑" : "↓") : ""}
          </button>
        </div>
      </div>

      {busqueda.trim() && registros.length > 0 && (
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #e3e3e3",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".4px",
              color: "#777",
              marginBottom: 8,
            }}
          >
            Personas encontradas
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {registros.slice(0, 12).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => editarPaciente(p)}
                style={{
                  border: "1px solid #ddd",
                  background: "#fff",
                  borderRadius: 9,
                  padding: "9px 11px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    color: "#222",
                  }}
                >
                  {`${capitalizarTexto(p.nombres)} ${capitalizarTexto(
                    p.apellidos
                  )}`.trim()}
                </strong>

                <span
                  style={{
                    display: "block",
                    marginTop: 3,
                    fontSize: 12,
                    color: "#666",
                  }}
                >
                  {p.rut
                    ? `RUT ${formatearRut(p.rut)}`
                    : p.rut_titular
                      ? `Titular ${formatearRut(p.rut_titular)}`
                      : `Ficha ${p.ficha || "sin ficha"}`}
                  {" · "}
                  {recetasPorPaciente.get(p.id) ?? 0} receta(s)
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {cargando ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 30,
            textAlign: "center",
            color: "#666",
          }}
        >
          Cargando pacientes...
        </div>
      ) : (
        <>
          <DataTable
            columns={columnas}
            data={filas}
            onVerReceta={(p) =>
              navigate(`/pacientes/${p.id}/recetas`)
            }
            onVerFicha={(p) =>
              navigate(`/pacientes/${p.id}/ficha-medica`)
            }
            onEditar={editarPaciente}
            onEliminar={eliminarPaciente}
          />

          <div
            style={{
              marginTop: 18,
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                color: "#666",
                fontSize: 13,
              }}
            >
              Mostrando{" "}
              <strong>
                {desdeRegistro.toLocaleString("es-CL")}
              </strong>{" "}
              -{" "}
              <strong>
                {hastaRegistro.toLocaleString("es-CL")}
              </strong>{" "}
              de{" "}
              <strong>
                {totalRegistros.toLocaleString("es-CL")}
              </strong>{" "}
              registros
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 13,
                  color: "#555",
                }}
              >
                Por página
                <select
                  value={porPagina}
                  onChange={(e) =>
                    cambiarPorPagina(Number(e.target.value))
                  }
                  style={{
                    border: "1px solid #d5d5d5",
                    borderRadius: 7,
                    padding: "7px 9px",
                    background: "#fff",
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>

              <button
                type="button"
                disabled={pagina <= 1}
                onClick={paginaAnterior}
                style={{
                  border: "1px solid #d5d5d5",
                  background: pagina <= 1 ? "#f3f3f3" : "#fff",
                  color: pagina <= 1 ? "#aaa" : "#333",
                  borderRadius: 7,
                  padding: "7px 12px",
                  cursor:
                    pagina <= 1 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                ← Anterior
              </button>

              <span
                style={{
                  minWidth: 95,
                  textAlign: "center",
                  fontSize: 13,
                  color: "#555",
                  fontWeight: 600,
                }}
              >
                Página {pagina} de {totalPaginas}
              </span>

              <button
                type="button"
                disabled={pagina >= totalPaginas}
                onClick={paginaSiguiente}
                style={{
                  border: "1px solid #d5d5d5",
                  background:
                    pagina >= totalPaginas ? "#f3f3f3" : "#fff",
                  color:
                    pagina >= totalPaginas ? "#aaa" : "#333",
                  borderRadius: 7,
                  padding: "7px 12px",
                  cursor:
                    pagina >= totalPaginas
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: 600,
                }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </>
      )}

      <PatientModal
        isOpen={modalAbierto}
        title={
          seleccionado ? "Editar Paciente" : "Nuevo Paciente"
        }
        onClose={() => {
          setModalAbierto(false);
          setSeleccionado(null);
        }}
      >
        <PatientForm
          paciente={seleccionado}
          onClose={() => {
            setModalAbierto(false);
            setSeleccionado(null);
          }}
          onPacienteGuardado={async () => {
            setModalAbierto(false);
            setSeleccionado(null);
            setPagina(1);
            await cargarPacientes();
          }}
        />
      </PatientModal>
    </MainLayout>
  );
}

export default Pacientes;
