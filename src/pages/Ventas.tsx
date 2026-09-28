import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
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

interface Producto {
  id: number;
  codigo: string | null;
  nombre: string;
  tipo_producto: string | null;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  stock: number | null;
  precio_venta: number | null;
  activo: boolean | null;
}

interface OrdenTrabajo {
  id: number;
  numero_ot: string | null;
  venta_id: number | null;
  paciente_id: number | null;
  receta_id: number | null;
  fecha_ingreso: string | null;
  fecha_entrega: string | null;
  estado: string | null;
}

interface MetodoPago {
  id: number;
  nombre: string;
  activo: boolean | null;
}

interface Venta {
  id: number;
  numero_venta: string | null;
  paciente_id: number | null;
  fecha: string | null;
  subtotal: number | null;
  descuento: number | null;
  total: number | null;
  estado: string | null;
  observaciones: string | null;
}

interface DetalleVenta {
  id?: number;
  venta_id?: number;
  producto_id: number | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  producto?: Producto;
}

interface FormularioVenta {
  numero_venta: string;
  paciente_id: string;
  orden_trabajo_id: string;
  descuento: string;
  estado: string;
  observaciones: string;
}

interface FormularioDetalle {
  producto_id: string;
  cantidad: string;
  precio_unitario: string;
}

interface FormularioAbono {
  monto: string;
  metodo_pago: string;
  observacion: string;
}

const FORMULARIO_VENTA_INICIAL: FormularioVenta = {
  numero_venta: "",
  paciente_id: "",
  orden_trabajo_id: "",
  descuento: "0",
  estado: "Pendiente",
  observaciones: ""
};

const FORMULARIO_DETALLE_INICIAL: FormularioDetalle = {
  producto_id: "",
  cantidad: "1",
  precio_unitario: ""
};

const FORMULARIO_ABONO_INICIAL: FormularioAbono = {
  monto: "0",
  metodo_pago: "",
  observacion: ""
};

function numero(valor: string | number | null | undefined): number {
  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }

  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
}

function moneda(valor: string | number | null | undefined): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(numero(valor));
}

function formatearFechaHora(fecha: string | null): string {
  if (!fecha) {
    return "-";
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return valor.toLocaleString("es-CL");
}

function inputStyle(): CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 13px",
    border: "1px solid #dddddd",
    borderRadius: "10px",
    color: "#333333",
    background: "#ffffff",
    fontSize: "14px",
    outline: "none"
  };
}

function labelStyle(): CSSProperties {
  return {
    display: "block",
    marginBottom: "7px",
    color: "#333333",
    fontSize: "13px",
    fontWeight: 700
  };
}

function Ventas() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);

  const [formulario, setFormulario] = useState<FormularioVenta>(
    FORMULARIO_VENTA_INICIAL
  );

  const [formularioDetalle, setFormularioDetalle] =
    useState<FormularioDetalle>(FORMULARIO_DETALLE_INICIAL);

  const [formularioAbono, setFormularioAbono] =
    useState<FormularioAbono>(FORMULARIO_ABONO_INICIAL);

  const [detalles, setDetalles] = useState<DetalleVenta[]>([]);

  const [busquedaPaciente, setBusquedaPaciente] = useState("");
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [busquedaVenta, setBusquedaVenta] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [errorMensaje, setErrorMensaje] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    setErrorMensaje("");

    const [
      pacientesResult,
      productosResult,
      ordenesResult,
      metodosPagoResult,
      ventasResult
    ] = await Promise.all([
      supabase
        .from("pacientes")
        .select("id, ficha, rut, nombres, apellidos")
        .order("nombres", { ascending: true })
        .order("apellidos", { ascending: true }),

      supabase
        .from("productos")
        .select(
          "id, codigo, nombre, tipo_producto, marca, modelo, color, stock, precio_venta, activo"
        )
        .eq("activo", true)
        .order("nombre", { ascending: true }),

      supabase
        .from("ordenes_trabajo")
        .select(
          "id, numero_ot, venta_id, paciente_id, receta_id, fecha_ingreso, fecha_entrega, estado"
        )
        .order("id", { ascending: false }),

      supabase
        .from("metodos_pago")
        .select("id, nombre, activo")
        .eq("activo", true)
        .order("nombre", { ascending: true }),

      supabase
        .from("ventas")
        .select("*")
        .order("id", { ascending: false })
    ]);

    if (pacientesResult.error) {
      setErrorMensaje(
        "No se pudieron cargar los pacientes: " +
          pacientesResult.error.message
      );
    } else {
      setPacientes(pacientesResult.data || []);
    }

    if (productosResult.error) {
      setErrorMensaje(
        "No se pudieron cargar los productos: " +
          productosResult.error.message
      );
    } else {
      setProductos(productosResult.data || []);
    }

    if (ordenesResult.error) {
      setErrorMensaje(
        "No se pudieron cargar las órdenes: " +
          ordenesResult.error.message
      );
    } else {
      setOrdenes(ordenesResult.data || []);
    }

    if (metodosPagoResult.error) {
      setErrorMensaje(
        "No se pudieron cargar los métodos de pago: " +
          metodosPagoResult.error.message
      );
    } else {
      const metodos = metodosPagoResult.data || [];
      setMetodosPago(metodos);

      if (
        metodos.length > 0 &&
        !formularioAbono.metodo_pago
      ) {
        setFormularioAbono((actual) => ({
          ...actual,
          metodo_pago: metodos[0].nombre
        }));
      }
    }

    if (ventasResult.error) {
      setErrorMensaje(
        "No se pudieron cargar las ventas: " +
          ventasResult.error.message
      );
    } else {
      setVentas(ventasResult.data || []);
    }

    setCargando(false);
  }

  function cambiarVenta(
    campo: keyof FormularioVenta,
    valor: string
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor
    }));
  }

  function cambiarDetalle(
    campo: keyof FormularioDetalle,
    valor: string
  ) {
    setFormularioDetalle((actual) => ({
      ...actual,
      [campo]: valor
    }));
  }

  function cambiarAbono(
    campo: keyof FormularioAbono,
    valor: string
  ) {
    setFormularioAbono((actual) => ({
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
      (paciente) => paciente.id === pacienteId
    );
  }

  function nombrePaciente(
    pacienteId: number | null
  ): string {
    const paciente = obtenerPaciente(pacienteId);

    if (!paciente) {
      return "Paciente no encontrado";
    }

    return `${paciente.nombres} ${paciente.apellidos || ""}`.trim();
  }

  function obtenerProducto(
    productoId: number | null
  ): Producto | undefined {
    if (!productoId) {
      return undefined;
    }

    return productos.find(
      (producto) => producto.id === productoId
    );
  }

  const pacientesFiltrados = useMemo(() => {
    const texto = busquedaPaciente.trim().toLowerCase();

    if (!texto) {
      return pacientes;
    }

    return pacientes.filter((paciente) => {
      const nombre = `${paciente.nombres} ${paciente.apellidos || ""}`.toLowerCase();
      const rut = (paciente.rut || "").toLowerCase();
      const ficha = (paciente.ficha || "").toLowerCase();

      return (
        nombre.includes(texto) ||
        rut.includes(texto) ||
        ficha.includes(texto)
      );
    });
  }, [pacientes, busquedaPaciente]);

  const ordenesDisponibles = useMemo(() => {
    return ordenes.filter(
      (orden) =>
        !orden.venta_id &&
        (!formulario.paciente_id ||
          orden.paciente_id === Number(formulario.paciente_id))
    );
  }, [ordenes, formulario.paciente_id]);

  const productosFiltrados = useMemo(() => {
    const texto = busquedaProducto.trim().toLowerCase();

    const lista = productos.filter((producto) => {
      if (!texto) {
        return true;
      }

      const datos = [
        producto.codigo,
        producto.nombre,
        producto.tipo_producto,
        producto.marca,
        producto.modelo,
        producto.color
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return datos.includes(texto);
    });

    return lista.slice(0, 50);
  }, [productos, busquedaProducto]);

  const ventasFiltradas = useMemo(() => {
    const texto = busquedaVenta.trim().toLowerCase();

    if (!texto) {
      return ventas;
    }

    return ventas.filter((venta) => {
      const numeroVenta = (venta.numero_venta || "").toLowerCase();
      const paciente = nombrePaciente(venta.paciente_id).toLowerCase();
      const estado = (venta.estado || "").toLowerCase();

      return (
        numeroVenta.includes(texto) ||
        paciente.includes(texto) ||
        estado.includes(texto)
      );
    });
  }, [ventas, busquedaVenta, pacientes]);

  const subtotal = useMemo(() => {
    return detalles.reduce(
      (total, detalle) => total + numero(detalle.subtotal),
      0
    );
  }, [detalles]);

  const descuento = Math.max(0, numero(formulario.descuento));
  const total = Math.max(0, subtotal - descuento);
  const abono = Math.max(0, numero(formularioAbono.monto));
  const saldo = Math.max(0, total - abono);

  function seleccionarPaciente(pacienteId: string) {
    cambiarVenta("paciente_id", pacienteId);
    cambiarVenta("orden_trabajo_id", "");

    const paciente = pacientes.find(
      (item) => item.id === Number(pacienteId)
    );

    if (paciente) {
      setBusquedaPaciente(
        `${paciente.nombres} ${paciente.apellidos || ""}`.trim()
      );
    }
  }

  function seleccionarOT(ordenId: string) {
    cambiarVenta("orden_trabajo_id", ordenId);

    const orden = ordenes.find(
      (item) => item.id === Number(ordenId)
    );

    if (!orden) {
      return;
    }

    if (
      orden.paciente_id &&
      String(orden.paciente_id) !== formulario.paciente_id
    ) {
      cambiarVenta("paciente_id", String(orden.paciente_id));

      const paciente = obtenerPaciente(orden.paciente_id);
      if (paciente) {
        setBusquedaPaciente(
          `${paciente.nombres} ${paciente.apellidos || ""}`.trim()
        );
      }
    }
  }

  function seleccionarProducto(productoId: string) {
    cambiarDetalle("producto_id", productoId);

    const producto = productos.find(
      (item) => item.id === Number(productoId)
    );

    if (producto) {
      cambiarDetalle(
        "precio_unitario",
        producto.precio_venta !== null && producto.precio_venta !== undefined
          ? String(producto.precio_venta)
          : "0"
      );

      setBusquedaProducto(
        [
          producto.codigo,
          producto.marca,
          producto.modelo,
          producto.nombre
        ]
          .filter(Boolean)
          .join(" · ")
      );
    }
  }

  function agregarDetalle() {
    if (!formularioDetalle.producto_id) {
      setErrorMensaje("Selecciona un producto para agregarlo a la venta.");
      return;
    }

    const producto = obtenerProducto(
      Number(formularioDetalle.producto_id)
    );

    if (!producto) {
      setErrorMensaje("No se encontró el producto seleccionado.");
      return;
    }

    const cantidad = Math.trunc(
      numero(formularioDetalle.cantidad)
    );

    if (cantidad <= 0) {
      setErrorMensaje("La cantidad debe ser mayor que cero.");
      return;
    }

    const precio = Math.max(
      0,
      numero(formularioDetalle.precio_unitario)
    );

    const stockDisponible = numero(producto.stock);

    if (cantidad > stockDisponible) {
      setErrorMensaje(
        `El producto "${producto.nombre}" tiene stock disponible de ${stockDisponible}.`
      );
      return;
    }

    const subtotalDetalle = cantidad * precio;

    setDetalles((actuales) => [
      ...actuales,
      {
        producto_id: producto.id,
        cantidad,
        precio_unitario: precio,
        subtotal: subtotalDetalle,
        producto
      }
    ]);

    setFormularioDetalle(FORMULARIO_DETALLE_INICIAL);
    setBusquedaProducto("");
    setErrorMensaje("");
  }

  function quitarDetalle(indice: number) {
    setDetalles((actuales) =>
      actuales.filter((_, posicion) => posicion !== indice)
    );
  }

  function limpiarFormulario() {
    setFormulario({
      ...FORMULARIO_VENTA_INICIAL,
      numero_venta: obtenerNumeroVenta()
    });

    setFormularioDetalle(FORMULARIO_DETALLE_INICIAL);
    setFormularioAbono((actual) => ({
      ...FORMULARIO_ABONO_INICIAL,
      metodo_pago:
        metodosPago[0]?.nombre || actual.metodo_pago || ""
    }));

    setDetalles([]);
    setBusquedaPaciente("");
    setBusquedaProducto("");
    setMensaje("");
    setErrorMensaje("");
  }

  function obtenerNumeroVenta(): string {
    if (ventas.length === 0) {
      return "V-000001";
    }

    const ultima = ventas[0]?.numero_venta || "";
    const coincidencia = ultima.match(/(\d+)$/);

    if (!coincidencia) {
      return "V-000001";
    }

    const siguiente = Number(coincidencia[1]) + 1;
    return `V-${String(siguiente).padStart(6, "0")}`;
  }

  async function guardarVenta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    setMensaje("");
    setErrorMensaje("");

    if (!formulario.paciente_id) {
      setErrorMensaje("Debes seleccionar un paciente.");
      return;
    }

    if (!formulario.numero_venta.trim()) {
      setErrorMensaje("La venta debe tener un número de venta.");
      return;
    }

    if (detalles.length === 0) {
      setErrorMensaje("Debes agregar al menos un producto a la venta.");
      return;
    }

    if (abono > total) {
      setErrorMensaje(
        "El monto del abono no puede ser superior al total de la venta."
      );
      return;
    }

    if (abono > 0 && !formularioAbono.metodo_pago) {
      setErrorMensaje("Selecciona un método de pago para registrar el abono.");
      return;
    }

    setGuardando(true);

    const datosVenta = {
      numero_venta: formulario.numero_venta.trim(),
      paciente_id: Number(formulario.paciente_id),
      fecha: new Date().toISOString(),
      subtotal,
      descuento,
      total,
      estado:
        saldo === 0 && total > 0
          ? "Pagada"
          : formulario.estado || "Pendiente",
      observaciones: formulario.observaciones.trim() || null
    };

    const ventaResultado = await supabase
      .from("ventas")
      .insert([datosVenta])
      .select("id")
      .single();

    if (
      ventaResultado.error ||
      !ventaResultado.data
    ) {
      console.error(ventaResultado.error);
      setErrorMensaje(
        "No se pudo crear la venta: " +
          (
            ventaResultado.error?.message ||
            "No se recibió el ID de la venta."
          )
      );
      setGuardando(false);
      return;
    }

    const ventaId = ventaResultado.data.id;

    const detallesParaGuardar = detalles.map((detalle) => ({
      venta_id: ventaId,
      producto_id: detalle.producto_id,
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_unitario,
      subtotal: detalle.subtotal
    }));

    const detallesResultado = await supabase
      .from("detalle_ventas")
      .insert(detallesParaGuardar);

    if (detallesResultado.error) {
      console.error(detallesResultado.error);
      setErrorMensaje(
        "La venta se creó, pero no se pudieron guardar sus detalles: " +
          detallesResultado.error.message
      );
      setGuardando(false);
      return;
    }

    if (abono > 0) {
      const abonoResultado = await supabase
        .from("abonos")
        .insert([
          {
            venta_id: ventaId,
            fecha: new Date().toISOString(),
            monto: abono,
            metodo_pago: formularioAbono.metodo_pago,
            observacion:
              formularioAbono.observacion.trim() || null
          }
        ]);

      if (abonoResultado.error) {
        console.error(abonoResultado.error);
        setErrorMensaje(
          "La venta y sus productos se guardaron, pero no se pudo registrar el abono: " +
            abonoResultado.error.message
        );
        setGuardando(false);
        return;
      }
    }

    if (formulario.orden_trabajo_id) {
      const ordenResultado = await supabase
        .from("ordenes_trabajo")
        .update({
          venta_id: ventaId,
          estado:
            saldo === 0 && total > 0
              ? "Entregada"
              : undefined
        })
        .eq(
          "id",
          Number(formulario.orden_trabajo_id)
        );

      if (ordenResultado.error) {
        console.error(ordenResultado.error);
        setErrorMensaje(
          "La venta se guardó, pero no se pudo vincular con la OT: " +
            ordenResultado.error.message
        );
        setGuardando(false);
        await cargarDatos();
        return;
      }
    }

    setGuardando(false);

    const mensajeExito =
      abono > 0
        ? `✓ Venta ${formulario.numero_venta.trim()} creada correctamente. Abono registrado: ${moneda(abono)}.`
        : `✓ Venta ${formulario.numero_venta.trim()} creada correctamente.`;

    setFormulario({
      ...FORMULARIO_VENTA_INICIAL,
      numero_venta: obtenerNumeroVenta()
    });
    setFormularioDetalle(FORMULARIO_DETALLE_INICIAL);
    setFormularioAbono({
      ...FORMULARIO_ABONO_INICIAL,
      metodo_pago: metodosPago[0]?.nombre || ""
    });
    setDetalles([]);
    setBusquedaPaciente("");
    setBusquedaProducto("");
    setErrorMensaje("");
    setMensaje(mensajeExito);

    await cargarDatos();
  }

  async function anularVenta(venta: Venta) {
    if (venta.estado === "Anulada") {
      return;
    }

    const confirmar = window.confirm(
      `¿Anular la venta ${venta.numero_venta || `#${venta.id}`}?\n\nLa venta no se eliminará; quedará registrada como anulada.`
    );

    if (!confirmar) {
      return;
    }

    const { error: errorActualizar } = await supabase
      .from("ventas")
      .update({ estado: "Anulada" })
      .eq("id", venta.id);

    if (errorActualizar) {
      alert(
        "No se pudo anular la venta: " +
          errorActualizar.message
      );
      return;
    }

    setMensaje("✓ Venta anulada correctamente.");
    await cargarDatos();
  }

  return (
    <MainLayout>
      <PageHeader
        titulo="Ventas"
        subtitulo="Registro de ventas, cobros y productos comercializados"
      />

      <style>
        {`
          .ventas-contenedor {
            display: flex;
            flex-direction: column;
            gap: 24px;
            padding-bottom: 40px;
          }

          .ventas-card {
            background: #ffffff;
            border-radius: 18px;
            padding: 28px;
            box-sizing: border-box;
            box-shadow: 0 7px 24px rgba(0,0,0,.07);
          }

          .ventas-card h2 {
            margin: 0;
            color: #222;
            font-size: 22px;
          }

          .ventas-descripcion {
            margin: 7px 0 23px;
            color: #777;
            font-size: 14px;
          }

          .ventas-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 17px;
          }

          .ventas-grid-2 {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 17px;
          }

          .ventas-campo-full {
            grid-column: 1 / -1;
          }

          .ventas-bloque {
            margin-top: 20px;
            padding: 20px;
            background: #fafafa;
            border: 1px solid #eeeeee;
            border-radius: 15px;
          }

          .ventas-titulo-bloque {
            margin: 0 0 17px;
            color: #333;
            font-size: 16px;
            font-weight: 700;
          }

          .ventas-producto-editor {
            display: grid;
            grid-template-columns: 1fr 140px 170px auto;
            gap: 12px;
            align-items: end;
          }

          .ventas-productos-lista {
            max-height: 190px;
            overflow-y: auto;
            margin-top: 12px;
            background: #fff;
            border: 1px solid #eee;
            border-radius: 10px;
          }

          .ventas-producto-opcion {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 10px 13px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
          }

          .ventas-producto-opcion:last-child {
            border-bottom: none;
          }

          .ventas-producto-opcion:hover {
            background: #fafafa;
          }

          .ventas-producto-nombre {
            color: #333;
            font-size: 13px;
            font-weight: 700;
          }

          .ventas-producto-info {
            margin-top: 3px;
            color: #888;
            font-size: 11px;
          }

          .ventas-stock {
            color: #555;
            font-size: 11px;
            white-space: nowrap;
          }

          .ventas-tabla {
            width: 100%;
            border-collapse: collapse;
          }

          .ventas-tabla th {
            background: #f3f3f3;
            color: #333;
            padding: 11px 9px;
            font-size: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }

          .ventas-tabla td {
            padding: 11px 9px;
            border-bottom: 1px solid #eee;
            color: #555;
            font-size: 13px;
          }

          .ventas-resumen {
            display: flex;
            justify-content: flex-end;
            margin-top: 18px;
          }

          .ventas-totales {
            min-width: 300px;
            display: flex;
            flex-direction: column;
            gap: 9px;
          }

          .ventas-total-linea {
            display: flex;
            justify-content: space-between;
            color: #555;
            font-size: 14px;
          }

          .ventas-total-final {
            padding-top: 10px;
            border-top: 1px solid #ddd;
            color: #222;
            font-size: 19px;
            font-weight: 800;
          }

          .ventas-saldo {
            color: #b00020;
          }

          .ventas-pagado {
            color: #24723b;
          }

          .ventas-botones {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 24px;
            flex-wrap: wrap;
          }

          .ventas-boton {
            border: none;
            border-radius: 10px;
            padding: 11px 18px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }

          .ventas-boton:disabled {
            opacity: .65;
            cursor: not-allowed;
          }

          .ventas-boton-primario {
            background: #cc001f;
            color: #fff;
          }

          .ventas-boton-secundario {
            background: #eee;
            color: #333;
          }

          .ventas-boton-peligro {
            background: #fff0f1;
            color: #b00020;
          }

          .ventas-boton-mini {
            padding: 7px 10px;
            font-size: 12px;
          }

          .ventas-mensaje-ok {
            padding: 13px 16px;
            border-radius: 10px;
            background: #edf8f0;
            color: #24723b;
            font-size: 14px;
            font-weight: 600;
          }

          .ventas-mensaje-error {
            padding: 13px 16px;
            border-radius: 10px;
            background: #fff0f1;
            color: #b00020;
            font-size: 14px;
            font-weight: 600;
          }

          .ventas-busqueda {
            margin-bottom: 18px;
          }

          .ventas-estado {
            display: inline-block;
            padding: 5px 9px;
            border-radius: 20px;
            background: #eee;
            color: #555;
            font-size: 11px;
            font-weight: 800;
          }

          .ventas-resumen-paciente {
            margin-top: 8px;
            color: #24723b;
            font-size: 12px;
            font-weight: 600;
          }

          @media (max-width: 1100px) {
            .ventas-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .ventas-producto-editor {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 700px) {
            .ventas-card {
              padding: 18px;
            }

            .ventas-grid,
            .ventas-grid-2,
            .ventas-producto-editor {
              grid-template-columns: 1fr;
            }

            .ventas-campo-full {
              grid-column: auto;
            }

            .ventas-resumen {
              justify-content: flex-start;
            }
          }
        `}
      </style>

      <div className="ventas-contenedor">
        {mensaje && (
          <div className="ventas-mensaje-ok">{mensaje}</div>
        )}

        {errorMensaje && (
          <div className="ventas-mensaje-error">{errorMensaje}</div>
        )}

        <div className="ventas-card">
          <h2>Nueva venta</h2>
          <p className="ventas-descripcion">
            Registra una venta y, cuando corresponda, vincúlala con una orden de trabajo.
          </p>

          <form onSubmit={guardarVenta}>
            <div className="ventas-bloque">
              <h3 className="ventas-titulo-bloque">📋 Datos de la venta</h3>

              <div className="ventas-grid">
                <div>
                  <label style={labelStyle()}>Nº de venta *</label>
                  <input
                    value={formulario.numero_venta}
                    onChange={(event) =>
                      cambiarVenta("numero_venta", event.target.value)
                    }
                    required
                    placeholder="V-000001"
                    style={inputStyle()}
                  />
                </div>

                <div>
                  <label style={labelStyle()}>Estado</label>
                  <select
                    value={formulario.estado}
                    onChange={(event) =>
                      cambiarVenta("estado", event.target.value)
                    }
                    style={inputStyle()}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagada">Pagada</option>
                    <option value="Parcial">Pago parcial</option>
                    <option value="Anulada">Anulada</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle()}>Descuento</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formulario.descuento}
                    onChange={(event) =>
                      cambiarVenta("descuento", event.target.value)
                    }
                    style={inputStyle()}
                  />
                </div>
              </div>
            </div>

            <div className="ventas-bloque">
              <h3 className="ventas-titulo-bloque">👤 Paciente y orden de trabajo</h3>

              <div className="ventas-grid-2">
                <div>
                  <label style={labelStyle()}>Buscar paciente</label>
                  <input
                    value={busquedaPaciente}
                    onChange={(event) => setBusquedaPaciente(event.target.value)}
                    placeholder="Nombre, RUT o ficha"
                    style={inputStyle()}
                  />
                </div>

                <div>
                  <label style={labelStyle()}>Paciente *</label>
                  <select
                    value={formulario.paciente_id}
                    onChange={(event) => seleccionarPaciente(event.target.value)}
                    required
                    style={inputStyle()}
                  >
                    <option value="">Seleccionar paciente</option>
                    {pacientesFiltrados.map((paciente) => (
                      <option key={paciente.id} value={paciente.id}>
                        {paciente.nombres} {paciente.apellidos || ""}
                        {paciente.ficha ? ` · Ficha ${paciente.ficha}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle()}>Orden de trabajo</label>
                  <select
                    value={formulario.orden_trabajo_id}
                    onChange={(event) => seleccionarOT(event.target.value)}
                    disabled={!formulario.paciente_id}
                    style={inputStyle()}
                  >
                    <option value="">
                      {formulario.paciente_id
                        ? "Sin OT asociada"
                        : "Primero selecciona un paciente"}
                    </option>
                    {ordenesDisponibles.map((orden) => (
                      <option key={orden.id} value={orden.id}>
                        {orden.numero_ot || `OT #${orden.id}`} · {orden.estado || "Sin estado"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formulario.paciente_id && (
                <div className="ventas-resumen-paciente">
                  ✓ {nombrePaciente(Number(formulario.paciente_id))}
                </div>
              )}
            </div>

            <div className="ventas-bloque">
              <h3 className="ventas-titulo-bloque">📦 Productos</h3>

              <div>
                <label style={labelStyle()}>Buscar producto</label>
                <input
                  value={busquedaProducto}
                  onChange={(event) => setBusquedaProducto(event.target.value)}
                  placeholder="Código, marca, modelo o nombre"
                  style={inputStyle()}
                />
              </div>

              {productosFiltrados.length > 0 && (
                <div className="ventas-productos-lista">
                  {productosFiltrados.map((producto) => (
                    <div
                      key={producto.id}
                      className="ventas-producto-opcion"
                      onClick={() => seleccionarProducto(String(producto.id))}
                    >
                      <div>
                        <div className="ventas-producto-nombre">{producto.nombre}</div>
                        <div className="ventas-producto-info">
                          {[
                            producto.codigo,
                            producto.tipo_producto,
                            producto.marca,
                            producto.modelo,
                            producto.color
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      <div className="ventas-stock">
                        Stock: {producto.stock ?? 0} · {moneda(producto.precio_venta)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="ventas-producto-editor" style={{ marginTop: "16px" }}>
                <div>
                  <label style={labelStyle()}>Producto</label>
                  <select
                    value={formularioDetalle.producto_id}
                    onChange={(event) => seleccionarProducto(event.target.value)}
                    style={inputStyle()}
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.codigo ? `${producto.codigo} · ` : ""}
                        {producto.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle()}>Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formularioDetalle.cantidad}
                    onChange={(event) =>
                      cambiarDetalle("cantidad", event.target.value)
                    }
                    style={inputStyle()}
                  />
                </div>

                <div>
                  <label style={labelStyle()}>Precio unitario</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formularioDetalle.precio_unitario}
                    onChange={(event) =>
                      cambiarDetalle("precio_unitario", event.target.value)
                    }
                    style={inputStyle()}
                  />
                </div>

                <button
                  type="button"
                  className="ventas-boton ventas-boton-secundario"
                  onClick={agregarDetalle}
                >
                  + Agregar
                </button>
              </div>

              {detalles.length > 0 && (
                <>
                  <div style={{ overflowX: "auto", marginTop: "20px" }}>
                    <table className="ventas-tabla" style={{ minWidth: "720px" }}>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Cantidad</th>
                          <th>Precio</th>
                          <th>Subtotal</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalles.map((detalle, indice) => (
                          <tr key={`${detalle.producto_id}-${indice}`}>
                            <td>
                              <strong>{detalle.producto?.nombre || "Producto"}</strong>
                              {detalle.producto?.codigo && (
                                <div style={{ color: "#888", fontSize: "11px", marginTop: "3px" }}>
                                  Código: {detalle.producto.codigo}
                                </div>
                              )}
                            </td>
                            <td>{detalle.cantidad}</td>
                            <td>{moneda(detalle.precio_unitario)}</td>
                            <td>{moneda(detalle.subtotal)}</td>
                            <td>
                              <button
                                type="button"
                                className="ventas-boton ventas-boton-peligro ventas-boton-mini"
                                onClick={() => quitarDetalle(indice)}
                              >
                                Quitar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="ventas-resumen">
                    <div className="ventas-totales">
                      <div className="ventas-total-linea">
                        <span>Subtotal</span>
                        <strong>{moneda(subtotal)}</strong>
                      </div>
                      <div className="ventas-total-linea">
                        <span>Descuento</span>
                        <strong>- {moneda(descuento)}</strong>
                      </div>
                      <div className="ventas-total-linea ventas-total-final">
                        <span>Total</span>
                        <span>{moneda(total)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="ventas-bloque">
              <h3 className="ventas-titulo-bloque">💳 Cobro</h3>

              <div className="ventas-grid">
                <div>
                  <label style={labelStyle()}>Monto pagado / abono</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formularioAbono.monto}
                    onChange={(event) => cambiarAbono("monto", event.target.value)}
                    style={inputStyle()}
                  />
                </div>

                <div>
                  <label style={labelStyle()}>Método de pago</label>
                  <select
                    value={formularioAbono.metodo_pago}
                    onChange={(event) => cambiarAbono("metodo_pago", event.target.value)}
                    style={inputStyle()}
                  >
                    <option value="">Seleccionar método</option>
                    {metodosPago.map((metodo) => (
                      <option key={metodo.id} value={metodo.nombre}>
                        {metodo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle()}>Saldo pendiente</label>
                  <div
                    style={{
                      ...inputStyle(),
                      background: saldo > 0 ? "#fff7f7" : "#f1faf3",
                      color: saldo > 0 ? "#b00020" : "#24723b",
                      fontWeight: 800
                    }}
                  >
                    {moneda(saldo)}
                  </div>
                </div>

                <div className="ventas-campo-full">
                  <label style={labelStyle()}>Observación del pago</label>
                  <input
                    value={formularioAbono.observacion}
                    onChange={(event) => cambiarAbono("observacion", event.target.value)}
                    placeholder="Ej: Pago con tarjeta, abono inicial..."
                    style={inputStyle()}
                  />
                </div>
              </div>
            </div>

            <div className="ventas-bloque">
              <h3 className="ventas-titulo-bloque">📝 Observaciones de la venta</h3>
              <textarea
                value={formulario.observaciones}
                onChange={(event) => cambiarVenta("observaciones", event.target.value)}
                placeholder="Información adicional de la venta"
                rows={4}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "12px",
                  resize: "vertical",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "14px"
                }}
              />
            </div>

            <div className="ventas-botones">
              <button
                type="button"
                className="ventas-boton ventas-boton-secundario"
                onClick={limpiarFormulario}
                disabled={guardando}
              >
                Limpiar
              </button>

              <button
                type="submit"
                className="ventas-boton ventas-boton-primario"
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar venta"}
              </button>
            </div>
          </form>
        </div>

        <div className="ventas-card">
          <h2>Ventas registradas</h2>
          <p className="ventas-descripcion">
            Consulta las ventas realizadas y su estado actual.
          </p>

          <div className="ventas-busqueda">
            <input
              value={busquedaVenta}
              onChange={(event) => setBusquedaVenta(event.target.value)}
              placeholder="Buscar por Nº de venta, paciente o estado..."
              style={inputStyle()}
            />
          </div>

          {cargando ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#777" }}>
              Cargando ventas...
            </div>
          ) : ventasFiltradas.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#777" }}>
              No hay ventas registradas.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="ventas-tabla" style={{ minWidth: "950px" }}>
                <thead>
                  <tr>
                    <th>Nº venta</th>
                    <th>Paciente</th>
                    <th>Fecha</th>
                    <th>Subtotal</th>
                    <th>Descuento</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.map((venta) => (
                    <tr key={venta.id}>
                      <td>
                        <strong>{venta.numero_venta || `Venta #${venta.id}`}</strong>
                      </td>
                      <td>{nombrePaciente(venta.paciente_id)}</td>
                      <td>{formatearFechaHora(venta.fecha)}</td>
                      <td>{moneda(venta.subtotal)}</td>
                      <td>{moneda(venta.descuento)}</td>
                      <td><strong>{moneda(venta.total)}</strong></td>
                      <td>
                        <span className="ventas-estado">
                          {venta.estado || "Sin estado"}
                        </span>
                      </td>
                      <td>
                        {venta.estado !== "Anulada" && (
                          <button
                            type="button"
                            className="ventas-boton ventas-boton-peligro ventas-boton-mini"
                            onClick={() => anularVenta(venta)}
                          >
                            Anular
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

export default Ventas;
