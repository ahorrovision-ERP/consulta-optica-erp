import { useEffect, useMemo, useState, type FormEvent, type CSSProperties } from "react";
import MainLayout from "../layout/MainLayout";
import PageHeader from "../components/PageHeader";
import { supabase } from "../lib/supabase";

interface Producto {
  id: number;
  codigo: string | null;
  nombre: string;
  categoria_id: number | null;
  tipo_producto: string | null;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  stock: number | null;
  stock_minimo: number | null;
  precio_compra: number | null;
  precio_venta: number | null;
  activo: boolean | null;
  referencia: string | null;
  material: string | null;
  indice_refraccion: number | null;
  esfera_min: number | null;
  esfera_max: number | null;
  cilindro_min: number | null;
  cilindro_max: number | null;
  tratamiento: string | null;
  proveedor_marca: string | null;
  ubicacion: string | null;
  observaciones: string | null;
  created_at: string | null;
}

interface FormularioProducto {
  codigo: string;
  nombre: string;
  categoria_id: string;
  tipo_producto: string;
  marca: string;
  modelo: string;
  color: string;
  stock: string;
  stock_minimo: string;
  precio_compra: string;
  precio_venta: string;
  activo: boolean;
  referencia: string;
  material: string;
  indice_refraccion: string;
  esfera_min: string;
  esfera_max: string;
  cilindro_min: string;
  cilindro_max: string;
  tratamiento: string;
  proveedor_marca: string;
  ubicacion: string;
  observaciones: string;
}

interface Categoria {
  id: number;
  [key: string]: unknown;
}

const FORMULARIO_INICIAL: FormularioProducto = {
  codigo: "",
  nombre: "",
  categoria_id: "",
  tipo_producto: "ARMAZON",
  marca: "",
  modelo: "",
  color: "",
  stock: "0",
  stock_minimo: "0",
  precio_compra: "0",
  precio_venta: "0",
  activo: true,
  referencia: "",
  material: "",
  indice_refraccion: "",
  esfera_min: "",
  esfera_max: "",
  cilindro_min: "",
  cilindro_max: "",
  tratamiento: "",
  proveedor_marca: "",
  ubicacion: "",
  observaciones: ""
};

const TIPOS = [
  { value: "ARMAZON", label: "Armazón" },
  { value: "CRISTAL", label: "Cristal" },
  { value: "TRATAMIENTO", label: "Tratamiento" },
  { value: "ACCESORIO", label: "Accesorio" },
  { value: "OTRO", label: "Otro" }
];

function numero(valor: string | number | null | undefined): number {
  if (valor === null || valor === undefined || valor === "") return 0;
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function moneda(valor: number | null | undefined): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(numero(valor));
}

function textoCategoria(categoria: Categoria | undefined): string {
  if (!categoria) return "Sin categoría";
  const posibles = ["nombre", "descripcion", "name", "titulo"];
  for (const campo of posibles) {
    const valor = categoria[campo];
    if (typeof valor === "string" && valor.trim()) return valor;
  }
  return `Categoría ${categoria.id}`;
}

function etiquetaTipo(tipo: string | null | undefined): string {
  return TIPOS.find((item) => item.value === tipo)?.label || tipo || "Otro";
}

function inputStyle(): CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 13px",
    border: "1px solid #dedede",
    borderRadius: "10px",
    background: "#fff",
    color: "#222",
    fontSize: "14px",
    outline: "none"
  };
}

function labelStyle(): CSSProperties {
  return {
    display: "block",
    marginBottom: "7px",
    color: "#444",
    fontSize: "13px",
    fontWeight: 700
  };
}

function botonSecundarioStyle(): CSSProperties {
  return {
    border: "1px solid #ddd",
    background: "#fff",
    color: "#333",
    borderRadius: "10px",
    padding: "11px 15px",
    fontWeight: 700,
    cursor: "pointer"
  };
}

function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState<FormularioProducto>(FORMULARIO_INICIAL);

  async function cargarDatos() {
    setCargando(true);
    setError("");

    const [productosResult, categoriasResult] = await Promise.all([
      supabase
        .from("productos")
        .select("*")
        .order("id", { ascending: false }),
      supabase
        .from("categorias")
        .select("*")
        .order("id", { ascending: true })
    ]);

    if (productosResult.error) {
      console.error(productosResult.error);
      setError("No se pudieron cargar los productos: " + productosResult.error.message);
      setProductos([]);
    } else {
      setProductos((productosResult.data || []) as Producto[]);
    }

    if (categoriasResult.error) {
      console.warn("No se pudieron cargar las categorías:", categoriasResult.error.message);
      setCategorias([]);
    } else {
      setCategorias((categoriasResult.data || []) as Categoria[]);
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const categoriaPorId = useMemo(() => {
    const mapa = new Map<number, Categoria>();
    categorias.forEach((categoria) => mapa.set(categoria.id, categoria));
    return mapa;
  }, [categorias]);

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      const coincideBusqueda = !termino || [
        producto.codigo,
        producto.referencia,
        producto.nombre,
        producto.marca,
        producto.modelo,
        producto.color,
        producto.material,
        producto.tratamiento,
        producto.proveedor_marca
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(termino);

      const coincideTipo =
        filtroTipo === "TODOS" || (producto.tipo_producto || "OTRO") === filtroTipo;

      const stock = numero(producto.stock);
      const minimo = numero(producto.stock_minimo);
      const bajoStock = stock <= minimo;

      const coincideEstado =
        filtroEstado === "TODOS" ||
        (filtroEstado === "ACTIVOS" && producto.activo !== false) ||
        (filtroEstado === "INACTIVOS" && producto.activo === false) ||
        (filtroEstado === "BAJO_STOCK" && bajoStock);

      return coincideBusqueda && coincideTipo && coincideEstado;
    });
  }, [productos, busqueda, filtroTipo, filtroEstado]);

  const estadisticas = useMemo(() => {
    const activos = productos.filter((producto) => producto.activo !== false).length;
    const bajoStock = productos.filter(
      (producto) => numero(producto.stock) <= numero(producto.stock_minimo)
    ).length;
    const valorInventario = productos.reduce(
      (total, producto) => total + numero(producto.stock) * numero(producto.precio_compra),
      0
    );

    return {
      total: productos.length,
      activos,
      bajoStock,
      valorInventario
    };
  }, [productos]);

  function abrirNuevo() {
    setProductoEditando(null);
    setFormulario(FORMULARIO_INICIAL);
    setMensaje("");
    setError("");
    setMostrarFormulario(true);
  }

  function abrirEditar(producto: Producto) {
    setProductoEditando(producto);
    setFormulario({
      codigo: producto.codigo || "",
      nombre: producto.nombre || "",
      categoria_id: producto.categoria_id?.toString() || "",
      tipo_producto: producto.tipo_producto || "ARMAZON",
      marca: producto.marca || "",
      modelo: producto.modelo || "",
      color: producto.color || "",
      stock: String(numero(producto.stock)),
      stock_minimo: String(numero(producto.stock_minimo)),
      precio_compra: String(numero(producto.precio_compra)),
      precio_venta: String(numero(producto.precio_venta)),
      activo: producto.activo !== false,
      referencia: producto.referencia || "",
      material: producto.material || "",
      indice_refraccion: producto.indice_refraccion?.toString() || "",
      esfera_min: producto.esfera_min?.toString() || "",
      esfera_max: producto.esfera_max?.toString() || "",
      cilindro_min: producto.cilindro_min?.toString() || "",
      cilindro_max: producto.cilindro_max?.toString() || "",
      tratamiento: producto.tratamiento || "",
      proveedor_marca: producto.proveedor_marca || "",
      ubicacion: producto.ubicacion || "",
      observaciones: producto.observaciones || ""
    });
    setMensaje("");
    setError("");
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    if (guardando) return;
    setMostrarFormulario(false);
    setProductoEditando(null);
    setFormulario(FORMULARIO_INICIAL);
  }

  function cambiarCampo(campo: keyof FormularioProducto, valor: string | boolean) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardarProducto(evento: FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setMensaje("");
    setError("");

    if (!formulario.nombre.trim()) {
      setError("El nombre del producto es obligatorio.");
      setGuardando(false);
      return;
    }

    const stock = Math.max(0, Math.trunc(numero(formulario.stock)));
    const stockMinimo = Math.max(0, Math.trunc(numero(formulario.stock_minimo)));

    const datos = {
      codigo: formulario.codigo.trim() || null,
      nombre: formulario.nombre.trim(),
      categoria_id: formulario.categoria_id ? Number(formulario.categoria_id) : null,
      tipo_producto: formulario.tipo_producto || "OTRO",
      marca: formulario.marca.trim() || null,
      modelo: formulario.modelo.trim() || null,
      color: formulario.color.trim() || null,
      stock,
      stock_minimo: stockMinimo,
      precio_compra: Math.max(0, numero(formulario.precio_compra)),
      precio_venta: Math.max(0, numero(formulario.precio_venta)),
      activo: formulario.activo,
      referencia: formulario.referencia.trim() || null,
      material: formulario.material.trim() || null,
      indice_refraccion: formulario.indice_refraccion === "" ? null : numero(formulario.indice_refraccion),
      esfera_min: formulario.esfera_min === "" ? null : numero(formulario.esfera_min),
      esfera_max: formulario.esfera_max === "" ? null : numero(formulario.esfera_max),
      cilindro_min: formulario.cilindro_min === "" ? null : numero(formulario.cilindro_min),
      cilindro_max: formulario.cilindro_max === "" ? null : numero(formulario.cilindro_max),
      tratamiento: formulario.tratamiento.trim() || null,
      proveedor_marca: formulario.proveedor_marca.trim() || null,
      ubicacion: formulario.ubicacion.trim() || null,
      observaciones: formulario.observaciones.trim() || null
    };

    let resultado;

    if (productoEditando) {
      resultado = await supabase
        .from("productos")
        .update(datos)
        .eq("id", productoEditando.id);
    } else {
      resultado = await supabase
        .from("productos")
        .insert([datos]);
    }

    if (resultado.error) {
      console.error(resultado.error);
      setError("No se pudo guardar el producto: " + resultado.error.message);
      setGuardando(false);
      return;
    }

    await cargarDatos();
    setMensaje(productoEditando ? "✓ Producto actualizado correctamente." : "✓ Producto creado correctamente.");
    setGuardando(false);

    if (!productoEditando) {
      setFormulario(FORMULARIO_INICIAL);
    }
  }

  async function eliminarProducto(producto: Producto) {
    const confirmar = window.confirm(
      `¿Eliminar el producto "${producto.nombre}"${producto.codigo ? ` (${producto.codigo})` : ""}?\n\nEsta acción no elimina los movimientos históricos.`
    );

    if (!confirmar) return;

    const { error: errorDelete } = await supabase
      .from("productos")
      .delete()
      .eq("id", producto.id);

    if (errorDelete) {
      alert("No se pudo eliminar el producto: " + errorDelete.message);
      return;
    }

    setProductos((actual) => actual.filter((item) => item.id !== producto.id));
  }

  async function ajustarStock(producto: Producto) {
    const actual = numero(producto.stock);
    const entrada = window.prompt(
      `Producto: ${producto.nombre}\nStock actual: ${actual}\n\nIngresa la cantidad a sumar o restar.\nEjemplo: 5 para entrada, -2 para salida.`,
      "0"
    );

    if (entrada === null) return;

    const cambio = Number(entrada);
    if (!Number.isFinite(cambio) || !Number.isInteger(cambio) || cambio === 0) {
      alert("Ingresa un número entero distinto de 0.");
      return;
    }

    const nuevoStock = actual + cambio;
    if (nuevoStock < 0) {
      alert("El stock no puede quedar negativo.");
      return;
    }

    const observacion = window.prompt(
      "Observación del movimiento:",
      cambio > 0 ? "Entrada de inventario" : "Salida de inventario"
    );

    if (observacion === null) return;

    const { error: errorUpdate } = await supabase
      .from("productos")
      .update({ stock: nuevoStock })
      .eq("id", producto.id);

    if (errorUpdate) {
      alert("No se pudo actualizar el stock: " + errorUpdate.message);
      return;
    }

    const { error: errorMovimiento } = await supabase
      .from("inventario_movimientos")
      .insert([
        {
          producto_id: producto.id,
          tipo_movimiento: cambio > 0 ? "ENTRADA" : "SALIDA",
          cantidad: Math.abs(cambio),
          observacion: observacion.trim() || null,
          fecha: new Date().toISOString()
        }
      ]);

    if (errorMovimiento) {
      console.error("Movimiento no registrado:", errorMovimiento);
      alert(
        "El stock se actualizó, pero no se pudo registrar el movimiento: " +
          errorMovimiento.message
      );
    }

    setProductos((actualProductos) =>
      actualProductos.map((item) =>
        item.id === producto.id ? { ...item, stock: nuevoStock } : item
      )
    );
  }

  function exportarCSV() {
    const encabezados = [
      "ID",
      "Código",
      "Referencia",
      "Nombre",
      "Tipo",
      "Categoría",
      "Marca",
      "Modelo",
      "Color",
      "Material",
      "Índice",
      "Esfera mín",
      "Esfera máx",
      "Cilindro mín",
      "Cilindro máx",
      "Tratamiento",
      "Stock",
      "Stock mínimo",
      "Precio compra",
      "Precio venta",
      "Proveedor/Marca",
      "Ubicación",
      "Activo"
    ];

    const filas = productosFiltrados.map((producto) => [
      producto.id,
      producto.codigo || "",
      producto.referencia || "",
      producto.nombre,
      etiquetaTipo(producto.tipo_producto),
      textoCategoria(categoriaPorId.get(producto.categoria_id || -1)),
      producto.marca || "",
      producto.modelo || "",
      producto.color || "",
      producto.material || "",
      producto.indice_refraccion ?? "",
      producto.esfera_min ?? "",
      producto.esfera_max ?? "",
      producto.cilindro_min ?? "",
      producto.cilindro_max ?? "",
      producto.tratamiento || "",
      numero(producto.stock),
      numero(producto.stock_minimo),
      numero(producto.precio_compra),
      numero(producto.precio_venta),
      producto.proveedor_marca || "",
      producto.ubicacion || "",
      producto.activo === false ? "No" : "Sí"
    ]);

    const escapar = (valor: unknown) => {
      const texto = String(valor ?? "");
      return `"${texto.replace(/"/g, '""')}"`;
    };

    const csv = [encabezados, ...filas]
      .map((fila) => fila.map(escapar).join(";"))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `inventario-ahorro-vision-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }

  const tipoSeleccionado = formulario.tipo_producto;
  const mostrarDatosCristal = tipoSeleccionado === "CRISTAL";
  const mostrarDatosArmazon = tipoSeleccionado === "ARMAZON";

  return (
    <MainLayout>
      <PageHeader
        titulo="Inventario"
        subtitulo="Gestión de productos, stock y referencias de la óptica"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "15px",
          marginBottom: "24px"
        }}
      >
        {[
          ["Productos", estadisticas.total.toString(), "📦"],
          ["Activos", estadisticas.activos.toString(), "✓"],
          ["Bajo stock", estadisticas.bajoStock.toString(), "⚠"],
          ["Valor a costo", moneda(estadisticas.valorInventario), "💰"]
        ].map(([titulo, valor, icono]) => (
          <div
            key={titulo}
            style={{
              background: "#fff",
              border: "1px solid #ececec",
              borderRadius: "16px",
              padding: "19px 20px",
              boxShadow: "0 4px 18px rgba(0,0,0,.045)"
            }}
          >
            <div style={{ color: "#777", fontSize: "13px", fontWeight: 700 }}>{icono} {titulo}</div>
            <div style={{ color: "#222", fontSize: "24px", fontWeight: 800, marginTop: "7px" }}>{valor}</div>
          </div>
        ))}
      </div>

      {mensaje && (
        <div
          style={{
            marginBottom: "18px",
            padding: "12px 15px",
            borderRadius: "10px",
            background: "#eef8f0",
            color: "#25723a",
            fontWeight: 600
          }}
        >
          {mensaje}
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: "18px",
            padding: "12px 15px",
            borderRadius: "10px",
            background: "#fff0f1",
            color: "#b00020",
            fontWeight: 600
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: "#fff",
          border: "1px solid #ececec",
          borderRadius: "18px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 4px 18px rgba(0,0,0,.045)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "15px",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "16px"
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "#222", fontSize: "20px" }}>Catálogo de productos</h2>
            <p style={{ margin: "6px 0 0", color: "#777", fontSize: "13px" }}>
              Los productos de aquí podrán utilizarse posteriormente en recetas, órdenes y ventas.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="button" style={botonSecundarioStyle()} onClick={exportarCSV}>
              ↓ Exportar CSV
            </button>
            <button
              type="button"
              onClick={abrirNuevo}
              style={{
                border: "none",
                background: "#cc001f",
                color: "#fff",
                borderRadius: "10px",
                padding: "11px 17px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              + Nuevo producto
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(260px, 1fr) 190px 170px auto",
            gap: "10px",
            alignItems: "center"
          }}
        >
          <input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por código, referencia, marca, modelo o nombre..."
            style={inputStyle()}
          />

          <select value={filtroTipo} onChange={(event) => setFiltroTipo(event.target.value)} style={inputStyle()}>
            <option value="TODOS">Todos los tipos</option>
            {TIPOS.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
            ))}
          </select>

          <select value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value)} style={inputStyle()}>
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVOS">Activos</option>
            <option value="INACTIVOS">Inactivos</option>
            <option value="BAJO_STOCK">Bajo stock</option>
          </select>

          <button
            type="button"
            style={botonSecundarioStyle()}
            onClick={() => {
              setBusqueda("");
              setFiltroTipo("TODOS");
              setFiltroEstado("TODOS");
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #ececec",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: "0 4px 18px rgba(0,0,0,.045)"
        }}
      >
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong style={{ color: "#222" }}>Listado</strong>
            <span style={{ color: "#888", marginLeft: "8px", fontSize: "13px" }}>{productosFiltrados.length} productos</span>
          </div>
          <button type="button" onClick={cargarDatos} style={{ ...botonSecundarioStyle(), padding: "8px 12px" }}>
            ↻ Actualizar
          </button>
        </div>

        {cargando ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#777" }}>
            Cargando inventario...
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div style={{ padding: "55px 30px", textAlign: "center" }}>
            <div style={{ fontSize: "42px", marginBottom: "10px" }}>📦</div>
            <h3 style={{ margin: 0, color: "#333" }}>No hay productos para mostrar</h3>
            <p style={{ color: "#777", marginBottom: "20px" }}>
              Crea el primer producto del inventario o modifica los filtros de búsqueda.
            </p>
            <button
              type="button"
              onClick={abrirNuevo}
              style={{
                border: "none",
                background: "#cc001f",
                color: "#fff",
                borderRadius: "10px",
                padding: "11px 17px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              + Crear producto
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1150px" }}>
              <thead>
                <tr style={{ background: "#f7f7f7" }}>
                  {["Producto", "Tipo", "Referencia / Código", "Stock", "Precio venta", "Ubicación", "Estado", "Acciones"].map((titulo) => (
                    <th
                      key={titulo}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        borderBottom: "1px solid #e7e7e7",
                        color: "#555",
                        fontSize: "12px",
                        fontWeight: 800,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((producto) => {
                  const stock = numero(producto.stock);
                  const minimo = numero(producto.stock_minimo);
                  const bajo = stock <= minimo;
                  const inactivo = producto.activo === false;

                  return (
                    <tr key={producto.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "13px 14px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: 800, color: "#222" }}>{producto.nombre}</div>
                        <div style={{ marginTop: "4px", color: "#777", fontSize: "12px" }}>
                          {[producto.marca, producto.modelo, producto.color].filter(Boolean).join(" · ") || "Sin marca / modelo"}
                        </div>
                        <div style={{ marginTop: "4px", color: "#999", fontSize: "11px" }}>
                          {textoCategoria(categoriaPorId.get(producto.categoria_id || -1))}
                        </div>
                      </td>
                      <td style={{ padding: "13px 14px", verticalAlign: "top" }}>
                        <span style={{
                          display: "inline-block",
                          background: "#f1f1f1",
                          borderRadius: "20px",
                          padding: "5px 9px",
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "#555"
                        }}>
                          {etiquetaTipo(producto.tipo_producto)}
                        </span>
                      </td>
                      <td style={{ padding: "13px 14px", verticalAlign: "top" }}>
                        <div style={{ color: "#333", fontWeight: 700 }}>{producto.referencia || "—"}</div>
                        <div style={{ color: "#888", marginTop: "3px", fontSize: "12px" }}>{producto.codigo || "Sin código"}</div>
                      </td>
                      <td style={{ padding: "13px 14px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: 800, color: bajo ? "#b00020" : "#222" }}>{stock}</div>
                        <div style={{ color: "#999", fontSize: "11px", marginTop: "3px" }}>mín. {minimo}</div>
                      </td>
                      <td style={{ padding: "13px 14px", verticalAlign: "top", fontWeight: 800, color: "#222" }}>
                        {moneda(producto.precio_venta)}
                      </td>
                      <td style={{ padding: "13px 14px", verticalAlign: "top", color: "#555" }}>
                        {producto.ubicacion || "—"}
                      </td>
                      <td style={{ padding: "13px 14px", verticalAlign: "top" }}>
                        {inactivo ? (
                          <span style={{ color: "#777", background: "#eee", borderRadius: "20px", padding: "5px 9px", fontSize: "11px", fontWeight: 800 }}>Inactivo</span>
                        ) : bajo ? (
                          <span style={{ color: "#9b4b00", background: "#fff3df", borderRadius: "20px", padding: "5px 9px", fontSize: "11px", fontWeight: 800 }}>Bajo stock</span>
                        ) : (
                          <span style={{ color: "#24723b", background: "#edf7ef", borderRadius: "20px", padding: "5px 9px", fontSize: "11px", fontWeight: 800 }}>Activo</span>
                        )}
                      </td>
                      <td style={{ padding: "13px 14px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => ajustarStock(producto)}
                            style={{ ...botonSecundarioStyle(), padding: "7px 9px", fontSize: "12px" }}
                          >
                            Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirEditar(producto)}
                            style={{ ...botonSecundarioStyle(), padding: "7px 9px", fontSize: "12px" }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarProducto(producto)}
                            style={{
                              border: "none",
                              background: "#fff0f1",
                              color: "#b00020",
                              borderRadius: "10px",
                              padding: "7px 9px",
                              fontWeight: 800,
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostrarFormulario && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cerrarFormulario();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,.48)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "min(1100px, 100%)",
              maxHeight: "92vh",
              overflowY: "auto",
              borderRadius: "20px",
              boxShadow: "0 20px 70px rgba(0,0,0,.25)"
            }}
          >
            <div
              style={{
                padding: "22px 24px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px"
              }}
            >
              <div>
                <h2 style={{ margin: 0, color: "#222" }}>
                  {productoEditando ? "Editar producto" : "Nuevo producto"}
                </h2>
                <p style={{ margin: "6px 0 0", color: "#777", fontSize: "13px" }}>
                  Completa los datos de inventario y la referencia comercial.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarFormulario}
                style={{ border: "none", background: "#f1f1f1", color: "#444", width: "38px", height: "38px", borderRadius: "50%", cursor: "pointer", fontSize: "18px" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={guardarProducto} style={{ padding: "24px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "16px"
                }}
              >
                <div>
                  <label style={labelStyle()}>Tipo de producto *</label>
                  <select
                    value={formulario.tipo_producto}
                    onChange={(event) => cambiarCampo("tipo_producto", event.target.value)}
                    style={inputStyle()}
                  >
                    {TIPOS.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle()}>Código</label>
                  <input value={formulario.codigo} onChange={(event) => cambiarCampo("codigo", event.target.value)} placeholder="Ej: RB5228-001" style={inputStyle()} />
                </div>

                <div>
                  <label style={labelStyle()}>Referencia</label>
                  <input value={formulario.referencia} onChange={(event) => cambiarCampo("referencia", event.target.value)} placeholder="Referencia del fabricante" style={inputStyle()} />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle()}>Nombre comercial *</label>
                  <input required value={formulario.nombre} onChange={(event) => cambiarCampo("nombre", event.target.value)} placeholder="Ej: Armazón Ray-Ban RX 5228" style={inputStyle()} />
                </div>

                <div>
                  <label style={labelStyle()}>Categoría</label>
                  <select value={formulario.categoria_id} onChange={(event) => cambiarCampo("categoria_id", event.target.value)} style={inputStyle()}>
                    <option value="">Sin categoría</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>{textoCategoria(categoria)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle()}>Marca</label>
                  <input value={formulario.marca} onChange={(event) => cambiarCampo("marca", event.target.value)} placeholder="Ray-Ban, Essilor..." style={inputStyle()} />
                </div>

                <div>
                  <label style={labelStyle()}>Modelo</label>
                  <input value={formulario.modelo} onChange={(event) => cambiarCampo("modelo", event.target.value)} placeholder="Modelo" style={inputStyle()} />
                </div>

                <div>
                  <label style={labelStyle()}>Color</label>
                  <input value={formulario.color} onChange={(event) => cambiarCampo("color", event.target.value)} placeholder="Negro, carey..." style={inputStyle()} />
                </div>

                <div>
                  <label style={labelStyle()}>Proveedor / Marca comercial</label>
                  <input value={formulario.proveedor_marca} onChange={(event) => cambiarCampo("proveedor_marca", event.target.value)} placeholder="Proveedor o distribuidor" style={inputStyle()} />
                </div>

                <div>
                  <label style={labelStyle()}>Ubicación</label>
                  <input value={formulario.ubicacion} onChange={(event) => cambiarCampo("ubicacion", event.target.value)} placeholder="Vitrina 1 / Bodega A" style={inputStyle()} />
                </div>

                {mostrarDatosArmazon && (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      background: "#fafafa",
                      border: "1px solid #eee",
                      borderRadius: "14px",
                      padding: "16px",
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                      gap: "14px"
                    }}
                  >
                    <div style={{ gridColumn: "1 / -1" }}>
                      <strong style={{ color: "#333" }}>Datos del armazón</strong>
                      <p style={{ margin: "5px 0 0", color: "#888", fontSize: "12px" }}>
                        Estos campos permitirán seleccionarlo después desde una orden de trabajo.
                      </p>
                    </div>
                    <div>
                      <label style={labelStyle()}>Marca</label>
                      <input value={formulario.marca} onChange={(event) => cambiarCampo("marca", event.target.value)} style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle()}>Modelo</label>
                      <input value={formulario.modelo} onChange={(event) => cambiarCampo("modelo", event.target.value)} style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle()}>Color</label>
                      <input value={formulario.color} onChange={(event) => cambiarCampo("color", event.target.value)} style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle()}>Referencia</label>
                      <input value={formulario.referencia} onChange={(event) => cambiarCampo("referencia", event.target.value)} style={inputStyle()} />
                    </div>
                  </div>
                )}

                {mostrarDatosCristal && (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      background: "#fafafa",
                      border: "1px solid #eee",
                      borderRadius: "14px",
                      padding: "16px",
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                      gap: "14px"
                    }}
                  >
                    <div style={{ gridColumn: "1 / -1" }}>
                      <strong style={{ color: "#333" }}>Especificaciones del cristal</strong>
                      <p style={{ margin: "5px 0 0", color: "#888", fontSize: "12px" }}>
                        Aquí se guardan referencia, material, índice, rangos de dioptría y tratamiento.
                      </p>
                    </div>
                    <div>
                      <label style={labelStyle()}>Material</label>
                      <input value={formulario.material} onChange={(event) => cambiarCampo("material", event.target.value)} placeholder="CR-39, policarbonato..." style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle()}>Índice de refracción</label>
                      <input type="number" step="0.01" value={formulario.indice_refraccion} onChange={(event) => cambiarCampo("indice_refraccion", event.target.value)} placeholder="1.56" style={inputStyle()} />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={labelStyle()}>Tratamiento</label>
                      <input value={formulario.tratamiento} onChange={(event) => cambiarCampo("tratamiento", event.target.value)} placeholder="Antirreflejo, fotocromático, filtro azul..." style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle()}>Esfera mínima</label>
                      <input type="number" step="0.25" value={formulario.esfera_min} onChange={(event) => cambiarCampo("esfera_min", event.target.value)} style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle()}>Esfera máxima</label>
                      <input type="number" step="0.25" value={formulario.esfera_max} onChange={(event) => cambiarCampo("esfera_max", event.target.value)} style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle()}>Cilindro mínimo</label>
                      <input type="number" step="0.25" value={formulario.cilindro_min} onChange={(event) => cambiarCampo("cilindro_min", event.target.value)} style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle()}>Cilindro máximo</label>
                      <input type="number" step="0.25" value={formulario.cilindro_max} onChange={(event) => cambiarCampo("cilindro_max", event.target.value)} style={inputStyle()} />
                    </div>
                  </div>
                )}

                <div>
                  <label style={labelStyle()}>Stock inicial</label>
                  <input type="number" min="0" step="1" value={formulario.stock} onChange={(event) => cambiarCampo("stock", event.target.value)} style={inputStyle()} />
                </div>

                <div>
                  <label style={labelStyle()}>Stock mínimo</label>
                  <input type="number" min="0" step="1" value={formulario.stock_minimo} onChange={(event) => cambiarCampo("stock_minimo", event.target.value)} style={inputStyle()} />
                </div>

                <div>
                  <label style={labelStyle()}>Precio de compra</label>
                  <input type="number" min="0" step="1" value={formulario.precio_compra} onChange={(event) => cambiarCampo("precio_compra", event.target.value)} style={inputStyle()} />
                </div>

                <div>
                  <label style={labelStyle()}>Precio de venta</label>
                  <input type="number" min="0" step="1" value={formulario.precio_venta} onChange={(event) => cambiarCampo("precio_venta", event.target.value)} style={inputStyle()} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle()}>Observaciones</label>
                  <textarea value={formulario.observaciones} onChange={(event) => cambiarCampo("observaciones", event.target.value)} placeholder="Información adicional del producto" rows={3} style={{ ...inputStyle(), resize: "vertical" }} />
                </div>

                <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px", paddingTop: "4px" }}>
                  <input id="producto-activo" type="checkbox" checked={formulario.activo} onChange={(event) => cambiarCampo("activo", event.target.checked)} style={{ width: "17px", height: "17px" }} />
                  <label htmlFor="producto-activo" style={{ color: "#444", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                    Producto activo y disponible para usar en ventas/órdenes
                  </label>
                </div>
              </div>

              {(mensaje || error) && (
                <div
                  style={{
                    marginTop: "18px",
                    padding: "11px 13px",
                    borderRadius: "10px",
                    background: error ? "#fff0f1" : "#eef8f0",
                    color: error ? "#b00020" : "#25723a"
                  }}
                >
                  {error || mensaje}
                </div>
              )}

              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "18px",
                  borderTop: "1px solid #eee",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px"
                }}
              >
                <button type="button" onClick={cerrarFormulario} style={botonSecundarioStyle()}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    border: "none",
                    background: "#cc001f",
                    color: "#fff",
                    borderRadius: "10px",
                    padding: "11px 18px",
                    fontWeight: 800,
                    cursor: guardando ? "not-allowed" : "pointer",
                    opacity: guardando ? 0.7 : 1
                  }}
                >
                  {guardando ? "Guardando..." : productoEditando ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default Productos;
