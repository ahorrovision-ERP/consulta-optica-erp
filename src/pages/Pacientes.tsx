import { useRef, useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";

import MainLayout from "../layout/MainLayout";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import DataTable from "../components/DataTable";

import PatientModal from "../components/PatientModal";
import PatientForm from "../components/PatientForm";

interface Paciente {
  id: number;
  ficha: string | null;
  rut: string | null;
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

function normalizarCabecera(valor: string): string {
  return valor
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "");
}

function separarCSV(linea: string, separador: string): string[] {
  const resultado: string[] = [];
  let actual = "";
  let dentroComillas = false;

  for (let i = 0; i < linea.length; i += 1) {
    const caracter = linea[i];

    if (caracter === '"') {
      if (dentroComillas && linea[i + 1] === '"') {
        actual += '"';
        i += 1;
      } else {
        dentroComillas = !dentroComillas;
      }

      continue;
    }

    if (caracter === separador && !dentroComillas) {
      resultado.push(actual.trim());
      actual = "";
      continue;
    }

    actual += caracter;
  }

  resultado.push(actual.trim());
  return resultado;
}

function parsearCSV(texto: string): Record<string, string>[] {
  const lineas = texto
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((linea) => linea.trim() !== "");

  if (lineas.length < 2) {
    return [];
  }

  const separador =
    lineas[0].includes(";") ? ";" : ",";

  const cabeceras = separarCSV(
    lineas[0],
    separador
  ).map(normalizarCabecera);

  return lineas.slice(1).map((linea) => {
    const valores = separarCSV(
      linea,
      separador
    );

    const fila: Record<string, string> = {};

    cabeceras.forEach((cabecera, indice) => {
      fila[cabecera] = valores[indice] || "";
    });

    return fila;
  });
}


async function leerFilasExcel(
  archivo: File
): Promise<Record<string, string>[]> {
  const buffer = await archivo.arrayBuffer();

  const libro = XLSX.read(buffer, {
    type: "array",
    cellDates: false
  });

  if (libro.SheetNames.length === 0) {
    return [];
  }

  const nombreHoja = libro.SheetNames.includes("Hoja1")
    ? "Hoja1"
    : libro.SheetNames[0];

  const hoja = libro.Sheets[nombreHoja];

  if (!hoja) {
    return [];
  }

  const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    hoja,
    {
      defval: "",
      raw: false
    }
  );

  return filas.map((fila) => {
    const resultado: Record<string, string> = {};

    Object.entries(fila).forEach(([cabecera, valor]) => {
      resultado[normalizarCabecera(cabecera)] =
        String(valor ?? "").trim();
    });

    return resultado;
  });
}

async function leerArchivoPacientes(
  archivo: File
): Promise<Record<string, string>[]> {
  const nombre = archivo.name.toLowerCase();

  if (
    nombre.endsWith(".xlsx") ||
    nombre.endsWith(".xls")
  ) {
    return leerFilasExcel(archivo);
  }

  return parsearCSV(await archivo.text());
}

function escaparHTML(valor: unknown): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function valorCSV(
  fila: Record<string, string>,
  nombres: string[]
): string {
  for (const nombre of nombres) {
    const clave = normalizarCabecera(nombre);

    if (
      Object.prototype.hasOwnProperty.call(
        fila,
        clave
      )
    ) {
      return fila[clave].trim();
    }
  }

  return "";
}

function numeroSeguro(valor: string): number | null {
  if (!valor.trim()) {
    return null;
  }

  const limpio = valor
    .replace(/\./g, "")
    .replace(",", ".");

  const numero = Number(limpio);

  return Number.isFinite(numero)
    ? numero
    : null;
}

function Pacientes() {
  const [pacientesRegistros, setPacientesRegistros] =
    useState<Paciente[]>([]);

  const [pacientes, setPacientes] = useState<
    any[][]
  >([]);

  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<any>(null);

  const [openModal, setOpenModal] =
    useState(false);

  const [importando, setImportando] =
    useState(false);

  const [mensaje, setMensaje] = useState("");
  const [errorMensaje, setErrorMensaje] =
    useState("");

  const inputImportarRef =
    useRef<HTMLInputElement>(null);

  const columnas = [
    "ID",
    "Nombre",
    "Teléfono",
    "Edad",
    "Ciudad",
    "Acciones"
  ];

  async function cargarPacientes() {
    const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .order("id");

    if (error) {
      console.error(error);
      setErrorMensaje(
        "No se pudieron cargar los pacientes: " +
          error.message
      );
      return;
    }

    if (!data) return;

    const registros = data as Paciente[];

    const filas = registros.map((paciente) => [
      paciente.id?.toString() || "",
      `${paciente.nombres} ${paciente.apellidos || ""}`.trim(),
      paciente.telefono || "",
      paciente.edad?.toString() || "",
      paciente.ciudad || "",
      paciente
    ]);

    setPacientesRegistros(registros);
    setPacientes(filas);
  }

  function editarPaciente(paciente: any) {
    setPacienteSeleccionado(paciente);
    setOpenModal(true);
    setMensaje("");
    setErrorMensaje("");
  }

  async function eliminarPaciente(
    paciente: any
  ) {
    const confirmar = window.confirm(
      `¿Eliminar a ${paciente.nombres} ${paciente.apellidos || ""}?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("pacientes")
      .delete()
      .eq("id", paciente.id);

    if (error) {
      alert(error.message);
      return;
    }

    setMensaje(
      "✓ Paciente eliminado correctamente."
    );

    await cargarPacientes();
  }

  async function importarArchivo(
    evento: ChangeEvent<HTMLInputElement>
  ) {
    const archivo = evento.target.files?.[0];

    if (!archivo) return;

    setImportando(true);
    setMensaje("");
    setErrorMensaje("");

    try {
      const filas = await leerArchivoPacientes(archivo);

      if (filas.length === 0) {
        throw new Error(
          "El archivo no contiene filas válidas."
        );
      }

      const { data: existentes, error: existentesError } =
        await supabase
          .from("pacientes")
          .select("ficha, rut");

      if (existentesError) {
        throw existentesError;
      }

      const fichasExistentes = new Set(
        (existentes || [])
          .map((item) =>
            String(item.ficha || "")
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      );

      const rutsExistentes = new Set(
        (existentes || [])
          .map((item) =>
            String(item.rut || "")
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      );

      const registros: Array<{
        ficha: string | null;
        rut: string | null;
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
      }> = [];

      const erroresFila: string[] = [];
      const fichasArchivo = new Set<string>();
      const rutsArchivo = new Set<string>();

      for (
        let indice = 0;
        indice < filas.length;
        indice += 1
      ) {
        const fila = filas[indice];

        const nombres = valorCSV(fila, [
          "Nombres",
          "Nombre"
        ]);

        if (!nombres) {
          erroresFila.push(
            `Fila ${indice + 2}: falta Nombres.`
          );
          continue;
        }

        const ficha = valorCSV(fila, [
          "Ficha",
          "N° Ficha",
          "Numero Ficha",
          "N ficha"
        ]);

        const rut = valorCSV(fila, [
          "RUT",
          "Rut",
          "Documento",
          "Documento identidad",
          "Identificacion",
          "Identificación"
        ]);

        const fichaNormalizada = ficha
          .trim()
          .toLowerCase();

        const rutNormalizado = rut
          .trim()
          .toLowerCase();

        if (
          fichaNormalizada &&
          (
            fichasExistentes.has(
              fichaNormalizada
            ) ||
            fichasArchivo.has(
              fichaNormalizada
            )
          )
        ) {
          erroresFila.push(
            `Fila ${indice + 2}: ficha ${ficha} duplicada; se omitió.`
          );
          continue;
        }

        if (
          rutNormalizado &&
          (
            rutsExistentes.has(
              rutNormalizado
            ) ||
            rutsArchivo.has(
              rutNormalizado
            )
          )
        ) {
          erroresFila.push(
            `Fila ${indice + 2}: RUT/Documento ${rut} ya existe o está repetido; se omitió.`
          );
          continue;
        }

        if (fichaNormalizada) {
          fichasArchivo.add(
            fichaNormalizada
          );
        }

        if (rutNormalizado) {
          rutsArchivo.add(
            rutNormalizado
          );
        }

        const fechaNacimiento = valorCSV(
          fila,
          [
            "Fecha nacimiento",
            "Fecha de nacimiento",
            "FechaNacimiento"
          ]
        );

        registros.push({
          ficha: ficha || null,
          rut: rut || null,
          nombres: nombres.trim(),
          apellidos:
            valorCSV(fila, [
              "Apellidos",
              "Apellido"
            ]) || null,
          fecha_nacimiento:
            fechaNacimiento || null,
          edad: numeroSeguro(
            valorCSV(fila, [
              "Edad"
            ])
          ),
          sexo:
            valorCSV(fila, [
              "Sexo",
              "Genero",
              "Género"
            ]) || null,
          telefono:
            valorCSV(fila, [
              "Telefono",
              "Teléfono",
              "Celular",
              "Movil",
              "Móvil"
            ]) || null,
          email:
            valorCSV(fila, [
              "Email",
              "Correo",
              "Correo electronico",
              "Correo electrónico"
            ]) || null,
          direccion:
            valorCSV(fila, [
              "Direccion",
              "Dirección"
            ]) || null,
          comuna:
            valorCSV(fila, [
              "Comuna"
            ]) || null,
          ciudad:
            valorCSV(fila, [
              "Ciudad"
            ]) || null,
          ocupacion:
            valorCSV(fila, [
              "Ocupacion",
              "Ocupación"
            ]) || null,
          observaciones:
            valorCSV(fila, [
              "Observaciones",
              "Observacion",
              "Observación"
            ]) || null
        });
      }

      let importados = 0;

      for (
        let inicio = 0;
        inicio < registros.length;
        inicio += 50
      ) {
        const bloque = registros.slice(
          inicio,
          inicio + 50
        );

        const { error } = await supabase
          .from("pacientes")
          .insert(bloque);

        if (error) {
          for (const registro of bloque) {
            const { error: errorIndividual } =
              await supabase
                .from("pacientes")
                .insert([registro]);

            if (errorIndividual) {
              erroresFila.push(
                `No se pudo importar ${registro.nombres} ${registro.apellidos || ""}: ${errorIndividual.message}`
              );
            } else {
              importados += 1;
            }
          }
        } else {
          importados += bloque.length;
        }
      }

      await cargarPacientes();

      setMensaje(
        `✓ Importación terminada. ${importados} paciente(s) importado(s).` +
          (
            erroresFila.length > 0
              ? ` ${erroresFila.length} fila(s) fueron omitidas o presentaron errores.`
              : ""
          )
      );

      if (erroresFila.length > 0) {
        console.warn(
          "Detalles de importación:",
          erroresFila
        );
      }
    } catch (error: any) {
      console.error(error);

      setErrorMensaje(
        error?.message ||
          "No fue posible importar el archivo."
      );
    } finally {
      setImportando(false);

      if (inputImportarRef.current) {
        inputImportarRef.current.value = "";
      }
    }
  }

  function exportarExcel() {
    if (pacientesRegistros.length === 0) {
      alert(
        "No hay pacientes para exportar."
      );
      return;
    }

    const encabezados = [
      "ID",
      "Ficha",
      "RUT",
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
      "Fecha registro"
    ];

    const filas = pacientesRegistros.map(
      (paciente) => [
        paciente.id,
        paciente.ficha || "",
        paciente.rut || "",
        paciente.nombres || "",
        paciente.apellidos || "",
        paciente.fecha_nacimiento || "",
        paciente.edad ?? "",
        paciente.sexo || "",
        paciente.telefono || "",
        paciente.email || "",
        paciente.direccion || "",
        paciente.comuna || "",
        paciente.ciudad || "",
        paciente.ocupacion || "",
        paciente.observaciones || "",
        paciente.fecha_registro || ""
      ]
    );

    const hoja = XLSX.utils.aoa_to_sheet([
      encabezados,
      ...filas
    ]);

    hoja["!cols"] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 16 },
      { wch: 20 },
      { wch: 24 },
      { wch: 16 },
      { wch: 8 },
      { wch: 14 },
      { wch: 16 },
      { wch: 28 },
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 40 },
      { wch: 22 }
    ];

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
  }

  function descargarPlantillaExcel() {
    const encabezados = [
      "Ficha",
      "RUT",
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
      "Observaciones"
    ];

    const ejemplo = [
      "F-0001",
      "12345678-9",
      "Juan",
      "Pérez",
      "1980-05-15",
      "46",
      "Masculino",
      "+56912345678",
      "juan@email.com",
      "Av. Ejemplo 123",
      "Ñuñoa",
      "Santiago",
      "Profesional",
      "Cliente importado"
    ];

    const hoja = XLSX.utils.aoa_to_sheet([
      encabezados,
      ejemplo
    ]);

    hoja["!cols"] = [
      { wch: 15 },
      { wch: 16 },
      { wch: 20 },
      { wch: 24 },
      { wch: 18 },
      { wch: 8 },
      { wch: 14 },
      { wch: 18 },
      { wch: 30 },
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 40 }
    ];

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

  function imprimirPDF() {
    if (pacientesRegistros.length === 0) {
      alert(
        "No hay pacientes para imprimir."
      );
      return;
    }

    const filas = pacientesRegistros
      .map(
        (paciente) => `
          <tr>
            <td>${escaparHTML(paciente.id)}</td>
            <td>${escaparHTML(paciente.ficha || "")}</td>
            <td>${escaparHTML(paciente.rut || "")}</td>
            <td>${escaparHTML(paciente.nombres || "")}</td>
            <td>${escaparHTML(paciente.apellidos || "")}</td>
            <td>${escaparHTML(paciente.telefono || "")}</td>
            <td>${escaparHTML(paciente.email || "")}</td>
            <td>${escaparHTML(paciente.comuna || "")}</td>
            <td>${escaparHTML(paciente.ciudad || "")}</td>
          </tr>
        `
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
          <meta charset="utf-8" />
          <title>Pacientes - Ahorro Visión</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }

            body {
              font-family: Arial, sans-serif;
              color: #222;
              margin: 0;
              padding: 0;
            }

            h1 {
              color: #cc001f;
              margin: 0 0 4px;
            }

            .subtitulo {
              color: #666;
              margin-bottom: 18px;
              font-size: 13px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }

            th {
              background: #f1f1f1;
              text-align: left;
              padding: 7px;
              border: 1px solid #ccc;
            }

            td {
              padding: 6px;
              border: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <h1>Ahorro Visión ERP</h1>
          <div class="subtitulo">
            Listado de pacientes · ${new Date().toLocaleDateString("es-CL")}
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ficha</th>
                <th>RUT</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Comuna</th>
                <th>Ciudad</th>
              </tr>
            </thead>

            <tbody>
              ${filas}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };

            window.onafterprint = function() {
              window.close();
            };
          </script>
        </body>
      </html>
    `);

    ventana.document.close();
  }

  return (
    <MainLayout>
      <PageHeader
        titulo="Pacientes"
        subtitulo="Gestión de pacientes registrados"
      />

      {(mensaje || errorMensaje) && (
        <div
          style={{
            marginBottom: "20px",
            padding: "13px 16px",
            borderRadius: "10px",
            background: errorMensaje
              ? "#fff0f1"
              : "#eef8f0",
            color: errorMensaje
              ? "#b00020"
              : "#25723a",
            fontSize: "14px",
            fontWeight: 600
          }}
        >
          {errorMensaje || mensaje}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "25px",
          flexWrap: "wrap"
        }}
      >
        <div style={{ flex: 1, minWidth: "260px" }}>
          <SearchBar />
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setPacienteSeleccionado(null);
            setOpenModal(true);
            setMensaje("");
            setErrorMensaje("");
          }}
        >
          + Nuevo
        </button>

        <button
          className="btn-secondary"
          onClick={() =>
            inputImportarRef.current?.click()
          }
          disabled={importando}
        >
          {importando
            ? "Importando..."
            : "↑ Importar Excel"}
        </button>

        <button
          className="btn-secondary"
          onClick={descargarPlantillaExcel}
        >
          ↓ Plantilla Excel
        </button>

        <button
          className="btn-secondary"
          onClick={exportarExcel}
        >
          ↓ Exportar Excel
        </button>

        <button
          className="btn-secondary"
          onClick={imprimirPDF}
        >
          🖨️ Imprimir / PDF
        </button>

        <input
          ref={inputImportarRef}
          type="file"
          accept=".xlsx,.xls,.csv,.txt"
          onChange={importarArchivo}
          style={{ display: "none" }}
        />
      </div>

      <DataTable
        columns={columnas}
        data={pacientes}
        onEditar={editarPaciente}
        onEliminar={eliminarPaciente}
      />

      <PatientModal
        isOpen={openModal}
        title={
          pacienteSeleccionado
            ? "Editar Paciente"
            : "Nuevo Paciente"
        }
        onClose={() => {
          setOpenModal(false);
          setPacienteSeleccionado(null);
        }}
      >
        <PatientForm
          paciente={pacienteSeleccionado}
          onClose={() => {
            setOpenModal(false);
            setPacienteSeleccionado(null);
          }}
          onPacienteGuardado={cargarPacientes}
        />
      </PatientModal>
    </MainLayout>
  );
}

export default Pacientes;
