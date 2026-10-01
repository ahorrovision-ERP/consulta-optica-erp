import { useEffect, useMemo, useState } from "react";
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
  return String(valor ?? "").toUpperCase().replace(/[^0-9K]/g, "");
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
  const [recetasPorPaciente, setRecetasPorPaciente] = useState<Map<number, number>>(new Map());
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [errorMensaje, setErrorMensaje] = useState("");
  const [orden, setOrden] = useState<"id" | "nombre" | "rut">("id");
  const [ascendente, setAscendente] = useState(true);

  const columnas = [
    "ID", "Ficha", "RUT paciente", "RUT titular", "Paciente", "Contacto", "Recetas", "Acciones"
  ];

  async function cargarPacientes() {
    setCargando(true);
    setErrorMensaje("");
    try {
      const [{ data: pacientesData, error: pacientesError }, { data: recetasData, error: recetasError }] = await Promise.all([
        supabase.from("pacientes").select("*").order("id"),
        supabase.from("recetas").select("paciente_id")
      ]);
      if (pacientesError) throw pacientesError;
      if (recetasError) throw recetasError;

      const lista = (pacientesData ?? []) as Paciente[];
      const conteos = new Map<number, number>();
      (recetasData ?? []).forEach((r) => {
        const id = Number(r.paciente_id);
        if (Number.isFinite(id)) conteos.set(id, (conteos.get(id) ?? 0) + 1);
      });
      setRegistros(lista);
      setRecetasPorPaciente(conteos);
    } catch (error: any) {
      console.error(error);
      setErrorMensaje(`No se pudieron cargar los pacientes: ${error?.message || "error desconocido"}`);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { void cargarPacientes(); }, []);

  const gruposTitular = useMemo(() => {
    const grupos = new Map<string, Paciente[]>();
    registros.forEach((p) => {
      const rut = normalizarDocumento(p.rut_titular);
      if (!rut) return;
      const grupo = grupos.get(rut) ?? [];
      grupo.push(p);
      grupos.set(rut, grupo);
    });
    return grupos;
  }, [registros]);

  const filtrados = useMemo(() => {
    const texto = normalizarTexto(busqueda);
    const doc = normalizarDocumento(busqueda);
    const lista = registros.filter((p) => {
      if (soloTitular && !p.rut_titular) return false;
      if (!texto) return true;
      const nombre = normalizarTexto(`${p.nombres} ${p.apellidos ?? ""}`);
      const campos = [
        nombre, normalizarTexto(p.ficha), normalizarTexto(p.telefono),
        normalizarTexto(p.email), normalizarTexto(p.comuna), normalizarTexto(p.ciudad),
        normalizarTexto(p.rut), normalizarTexto(p.rut_titular)
      ];
      return campos.some((c) => c.includes(texto)) ||
        (doc && (normalizarDocumento(p.rut).includes(doc) || normalizarDocumento(p.rut_titular).includes(doc)));
    });

    lista.sort((a, b) => {
      let resultado = 0;
      if (orden === "id") resultado = a.id - b.id;
      if (orden === "nombre") {
        resultado = normalizarTexto(`${a.nombres} ${a.apellidos ?? ""}`).localeCompare(
          normalizarTexto(`${b.nombres} ${b.apellidos ?? ""}`)
        );
      }
      if (orden === "rut") {
        resultado = normalizarDocumento(a.rut_titular || a.rut).localeCompare(
          normalizarDocumento(b.rut_titular || b.rut)
        );
      }
      return ascendente ? resultado : -resultado;
    });
    return lista;
  }, [registros, busqueda, soloTitular, orden, ascendente]);

  useEffect(() => {
    setFilas(filtrados.map((p) => {
      const nombre = `${p.nombres} ${p.apellidos || ""}`.trim();
      const grupo = p.rut_titular ? gruposTitular.get(normalizarDocumento(p.rut_titular)) : undefined;
      const personas = grupo?.length ?? 0;
      const contacto = [p.telefono, p.email].filter(Boolean).join(" · ");
      return [
        String(p.id),
        p.ficha || "—",
        p.rut ? formatearRut(p.rut) : "—",
        p.rut_titular ? formatearRut(p.rut_titular) : "—",
        [nombre, personas > 1 ? `RUT compartido · ${personas} personas` : ""].filter(Boolean).join("\n"),
        contacto || "—",
        String(recetasPorPaciente.get(p.id) ?? 0),
        p
      ];
    }));
  }, [filtrados, gruposTitular, recetasPorPaciente]);

  function editarPaciente(p: Paciente) {
    setSeleccionado(p);
    setModalAbierto(true);
    setMensaje("");
    setErrorMensaje("");
  }

  async function eliminarPaciente(p: Paciente) {
    const nombre = `${p.nombres} ${p.apellidos || ""}`.trim();
    const tieneRecetas = (recetasPorPaciente.get(p.id) ?? 0) > 0;
    const pregunta = tieneRecetas
      ? `El paciente ${nombre} tiene recetas asociadas. La base de datos puede impedir su eliminación.\n\n¿Intentar eliminarlo?`
      : `¿Eliminar a ${nombre}?`;
    if (!window.confirm(pregunta)) return;

    setMensaje(""); setErrorMensaje("");
    const { error } = await supabase.from("pacientes").delete().eq("id", p.id);
    if (error) {
      setErrorMensaje(`No se pudo eliminar el paciente: ${error.message}`);
      return;
    }
    setMensaje("✓ Paciente eliminado correctamente.");
    await cargarPacientes();
  }

  function cambiarOrden(nueva: "id" | "nombre" | "rut") {
    if (orden === nueva) setAscendente((v) => !v);
    else { setOrden(nueva); setAscendente(true); }
  }

  function exportarExcel() {
    if (!registros.length) { alert("No hay pacientes para exportar."); return; }
    const encabezados = [
      "ID", "Ficha", "RUT paciente", "RUT titular", "Nombres", "Apellidos",
      "Fecha nacimiento", "Edad", "Sexo", "Teléfono", "Email", "Dirección",
      "Comuna", "Ciudad", "Ocupación", "Observaciones", "Fecha registro", "Cantidad recetas"
    ];
    const data = registros.map((p) => [
      p.id, p.ficha || "", p.rut || "", p.rut_titular || "", p.nombres || "", p.apellidos || "",
      p.fecha_nacimiento || "", p.edad ?? "", p.sexo || "", p.telefono || "", p.email || "",
      p.direccion || "", p.comuna || "", p.ciudad || "", p.ocupacion || "", p.observaciones || "",
      p.fecha_registro || "", recetasPorPaciente.get(p.id) ?? 0
    ]);
    const hoja = XLSX.utils.aoa_to_sheet([encabezados, ...data]);
    hoja["!cols"] = encabezados.map((_, i) => ({ wch: [8,15,16,16,22,24,18,8,14,18,30,30,18,18,22,40,22,16][i] || 16 }));
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Pacientes");
    XLSX.writeFile(libro, `pacientes-ahorro-vision-${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  function descargarPlantilla() {
    const encabezados = [
      "Ficha", "RUT paciente", "RUT titular", "Nombres", "Apellidos", "Fecha nacimiento",
      "Edad", "Sexo", "Teléfono", "Email", "Dirección", "Comuna", "Ciudad", "Ocupación", "Observaciones"
    ];
    const ejemplo = [
      "F-0001", "12345678-9", "", "Juan", "Pérez", "1980-05-15", 46, "Masculino",
      "+56912345678", "juan@email.com", "Av. Ejemplo 123", "Ñuñoa", "Santiago", "Profesional", "Cliente"
    ];
    const hoja = XLSX.utils.aoa_to_sheet([encabezados, ejemplo]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Pacientes");
    XLSX.writeFile(libro, "plantilla-pacientes-ahorro-vision.xlsx");
  }

  function imprimirPDF() {
    if (!registros.length) { alert("No hay pacientes para imprimir."); return; }
    const html = registros.map((p) => `
      <tr>
        <td>${escaparHTML(p.id)}</td><td>${escaparHTML(p.ficha || "")}</td>
        <td>${escaparHTML(formatearRut(p.rut))}</td><td>${escaparHTML(formatearRut(p.rut_titular))}</td>
        <td>${escaparHTML(`${p.nombres} ${p.apellidos || ""}`.trim())}</td>
        <td>${escaparHTML(p.telefono || "")}</td><td>${escaparHTML(p.email || "")}</td><td>${escaparHTML(p.comuna || "")}</td>
      </tr>`).join("");
    const ventana = window.open("", "_blank", "width=1200,height=800");
    if (!ventana) { alert("El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para este sitio."); return; }
    ventana.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Pacientes - Ahorro Visión</title><style>
      @page{size:A4 landscape;margin:10mm} body{font-family:Arial,sans-serif;color:#222;margin:0} h1{color:#cc001f;margin:0 0 4px}.sub{color:#666;margin-bottom:18px;font-size:13px}
      table{width:100%;border-collapse:collapse;font-size:9px}th{background:#f1f1f1;text-align:left;padding:6px;border:1px solid #ccc}td{padding:5px;border:1px solid #ddd;vertical-align:top}
    </style></head><body><h1>Ahorro Visión ERP</h1><div class="sub">Listado de pacientes · ${new Date().toLocaleDateString("es-CL")}</div>
    <table><thead><tr><th>ID</th><th>Ficha</th><th>RUT paciente</th><th>RUT titular</th><th>Paciente</th><th>Teléfono</th><th>Email</th><th>Comuna</th></tr></thead><tbody>${html}</tbody></table>
    <script>window.onload=function(){window.print()};window.onafterprint=function(){window.close()}</script></body></html>`);
    ventana.document.close();
  }

  return (
    <MainLayout>
      <PageHeader titulo="Pacientes" subtitulo="Gestión de pacientes, RUT titulares y personas asociadas" />

      {(mensaje || errorMensaje) && <div style={{ marginBottom:20, padding:"13px 16px", borderRadius:10, background:errorMensaje?"#fff0f1":"#eef8f0", color:errorMensaje?"#b00020":"#25723a", fontSize:14, fontWeight:600 }}>{errorMensaje || mensaje}</div>}

      <div style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:12, padding:16, marginBottom:18, boxShadow:"0 4px 14px rgba(0,0,0,.04)" }}>
        <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, apellido, RUT, RUT titular, ficha, teléfono o email..." style={{ flex:1, minWidth:320, boxSizing:"border-box", border:"1px solid #d8d8d8", borderRadius:10, padding:"12px 14px", fontSize:14, outline:"none" }} />
          <button className="btn-primary" onClick={() => { setSeleccionado(null); setModalAbierto(true); setMensaje(""); setErrorMensaje(""); }}>+ Nuevo</button>
          <button className="btn-secondary" onClick={exportarExcel}>↓ Exportar Excel</button>
          <button className="btn-secondary" onClick={descargarPlantilla}>↓ Plantilla</button>
          <button className="btn-secondary" onClick={imprimirPDF}>🖨️ Imprimir / PDF</button>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginTop:12 }}>
          <button type="button" onClick={() => setSoloTitular((v) => !v)} style={{ border:"1px solid #d5d5d5", background:soloTitular?"#f3f3f3":"#fff", color:"#333", borderRadius:8, padding:"8px 11px", cursor:"pointer", fontWeight:600 }}>
            {soloTitular ? "✓ Solo con RUT titular" : "Mostrar solo con RUT titular"}
          </button>
          <span style={{ fontSize:13, color:"#666" }}>{busqueda.trim() ? `${filtrados.length} resultado(s)` : `${registros.length} paciente(s)`}</span>
          <span style={{ color:"#ccc" }}>•</span>
          <button type="button" onClick={() => cambiarOrden("id")} style={{ border:0, background:"transparent", color:orden==="id"?"#cc001f":"#666", cursor:"pointer", fontWeight:600 }}>ID {orden==="id"?(ascendente?"↑":"↓"):""}</button>
          <button type="button" onClick={() => cambiarOrden("nombre")} style={{ border:0, background:"transparent", color:orden==="nombre"?"#cc001f":"#666", cursor:"pointer", fontWeight:600 }}>Nombre {orden==="nombre"?(ascendente?"↑":"↓"):""}</button>
          <button type="button" onClick={() => cambiarOrden("rut")} style={{ border:0, background:"transparent", color:orden==="rut"?"#cc001f":"#666", cursor:"pointer", fontWeight:600 }}>RUT {orden==="rut"?(ascendente?"↑":"↓"):""}</button>
        </div>
      </div>

      {busqueda.trim() && filtrados.length > 0 && <div style={{ background:"#fafafa", border:"1px solid #e3e3e3", borderRadius:12, padding:"14px 16px", marginBottom:18 }}>
        <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:".4px", color:"#777", marginBottom:8 }}>Personas encontradas</div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {filtrados.slice(0,12).map((p) => <button key={p.id} type="button" onClick={() => editarPaciente(p)} style={{ border:"1px solid #ddd", background:"#fff", borderRadius:9, padding:"9px 11px", cursor:"pointer", textAlign:"left" }}>
            <strong style={{ display:"block", color:"#222" }}>{`${p.nombres} ${p.apellidos || ""}`.trim()}</strong>
            <span style={{ display:"block", marginTop:3, fontSize:12, color:"#666" }}>{p.rut ? `RUT ${formatearRut(p.rut)}` : p.rut_titular ? `Titular ${formatearRut(p.rut_titular)}` : `Ficha ${p.ficha || "sin ficha"}`} · {recetasPorPaciente.get(p.id) ?? 0} receta(s)</span>
          </button>)}
        </div>
        {filtrados.length > 12 && <div style={{ marginTop:10, fontSize:12, color:"#777" }}>Se muestran los primeros 12 resultados; la tabla contiene el resto.</div>}
      </div>}

      {cargando ? (
        <div style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:12, padding:30, textAlign:"center", color:"#666" }}>
          Cargando pacientes...
        </div>
      ) : (
        <DataTable
          columns={columnas}
          data={filas}
          onVerReceta={(p) => navigate(`/pacientes/${p.id}/recetas`)}
          onVerFicha={(p) => navigate(`/pacientes/${p.id}/ficha-medica`)}
          onEditar={editarPaciente}
          onEliminar={eliminarPaciente}
        />
      )}

      <PatientModal isOpen={modalAbierto} title={seleccionado ? "Editar Paciente" : "Nuevo Paciente"} onClose={() => { setModalAbierto(false); setSeleccionado(null); }}>
        <PatientForm paciente={seleccionado} onClose={() => { setModalAbierto(false); setSeleccionado(null); }} onPacienteGuardado={cargarPacientes} />
      </PatientModal>
    </MainLayout>
  );
}

export default Pacientes;
