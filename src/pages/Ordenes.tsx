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
  responsable: string | null;
  observaciones: string | null;
}

interface DetalleOrden {
  id?: number;
  orden_trabajo_id?: number;
  producto_id: number | null;
  tipo_item: string;
  ojo: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  observaciones: string | null;
}

interface FormularioOrden {
  numero_ot: string;
  paciente_id: string;
  receta_id: string;
  fecha_entrega: string;
  estado: string;
  responsable: string;
  observaciones: string;
}

interface FormularioDetalle {
  tipo_item: string;
  ojo: string;
  producto_id: string;
  descripcion: string;
  cantidad: string;
  precio_unitario: string;
  observaciones: string;
}

const formularioInicial: FormularioOrden = {
  numero_ot: "",
  paciente_id: "",
  receta_id: "",
  fecha_entrega: "",
  estado: "Ingresada",
  responsable: "",
  observaciones: ""
};

const detalleInicial: FormularioDetalle = {
  tipo_item: "ARMAZON",
  ojo: "",
  producto_id: "",
  descripcion: "",
  cantidad: "1",
  precio_unitario: "",
  observaciones: ""
};

function formatearFecha(
  fecha: string | null
): string {
  if (!fecha) {
    return "-";
  }

  const fechaSolo =
    fecha.substring(0, 10);

  const partes =
    fechaSolo.split("-");

  if (partes.length !== 3) {
    return fechaSolo;
  }

  return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

function formatearFechaHora(
  fecha: string | null
): string {
  if (!fecha) {
    return "-";
  }

  const fechaObjeto =
    new Date(fecha);

  if (
    Number.isNaN(
      fechaObjeto.getTime()
    )
  ) {
    return fecha;
  }

  return fechaObjeto.toLocaleString(
    "es-CL"
  );
}

function formatearMoneda(
  valor: number
): string {
  return new Intl.NumberFormat(
    "es-CL",
    {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0
    }
  ).format(valor || 0);
}

function obtenerNumeroOT(
  ultimaOrden: OrdenTrabajo | null
): string {
  if (!ultimaOrden?.numero_ot) {
    return "OT-000001";
  }

  const coincidencia =
    ultimaOrden.numero_ot.match(
      /(\d+)$/
    );

  if (!coincidencia) {
    return "OT-000001";
  }

  const numero =
    Number(
      coincidencia[1]
    ) + 1;

  return `OT-${String(
    numero
  ).padStart(6, "0")}`;
}

function Ordenes() {
  const [pacientes, setPacientes] =
    useState<Paciente[]>([]);

  const [recetas, setRecetas] =
    useState<Receta[]>([]);

  const [productos, setProductos] =
    useState<Producto[]>([]);

  const [ordenes, setOrdenes] =
    useState<OrdenTrabajo[]>([]);

  const [
    formulario,
    setFormulario
  ] = useState<FormularioOrden>(
    formularioInicial
  );

  const [
    formularioDetalle,
    setFormularioDetalle
  ] = useState<FormularioDetalle>(
    detalleInicial
  );

  const [
    detalles,
    setDetalles
  ] = useState<DetalleOrden[]>([]);

  const [
    busquedaPaciente,
    setBusquedaPaciente
  ] = useState("");

  const [
    busquedaProducto,
    setBusquedaProducto
  ] = useState("");

  const [
    busquedaOrden,
    setBusquedaOrden
  ] = useState("");

  const [
    ordenEditando,
    setOrdenEditando
  ] = useState<OrdenTrabajo | null>(
    null
  );

  const [
    cargando,
    setCargando
  ] = useState(true);

  const [
    guardando,
    setGuardando
  ] = useState(false);

  const [
    mensaje,
    setMensaje
  ] = useState("");

  const [
    errorMensaje,
    setErrorMensaje
  ] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    setErrorMensaje("");

    const [
      pacientesResult,
      recetasResult,
      productosResult,
      ordenesResult
    ] = await Promise.all([
      supabase
        .from("pacientes")
        .select(
          "id, ficha, rut, nombres, apellidos"
        )
        .order("nombres", {
          ascending: true
        })
        .order("apellidos", {
          ascending: true
        }),

      supabase
        .from("recetas")
        .select(
          `
            id,
            paciente_id,
            numero_formula,
            fecha_receta,
            fecha_control,
            profesional,
            tipo_receta,
            motivo_receta,
            esfera_od,
            cilindro_od,
            eje_od,
            adicion_od,
            agudeza_visual_od,
            esfera_oi,
            cilindro_oi,
            eje_oi,
            adicion_oi,
            agudeza_visual_oi,
            distancia_pupilar
          `
        )
        .order("fecha_receta", {
          ascending: false
        })
        .order("id", {
          ascending: false
        }),

      supabase
        .from("productos")
        .select(
          `
            id,
            codigo,
            nombre,
            tipo_producto,
            marca,
            modelo,
            color,
            stock,
            precio_venta,
            activo
          `
        )
        .eq("activo", true)
        .order("nombre", {
          ascending: true
        }),

      supabase
        .from("ordenes_trabajo")
        .select("*")
        .order("id", {
          ascending: false
        })
    ]);

    if (pacientesResult.error) {
      console.error(
        "Error cargando pacientes:",
        pacientesResult.error
      );

      setErrorMensaje(
        "No se pudieron cargar los pacientes: " +
          pacientesResult.error.message
      );
    } else {
      setPacientes(
        pacientesResult.data || []
      );
    }

    if (recetasResult.error) {
      console.error(
        "Error cargando recetas:",
        recetasResult.error
      );

      setErrorMensaje(
        "No se pudieron cargar las recetas: " +
          recetasResult.error.message
      );
    } else {
      setRecetas(
        recetasResult.data || []
      );
    }

    if (productosResult.error) {
      console.error(
        "Error cargando productos:",
        productosResult.error
      );

      setErrorMensaje(
        "No se pudieron cargar los productos: " +
          productosResult.error.message
      );
    } else {
      setProductos(
        productosResult.data || []
      );
    }

    if (ordenesResult.error) {
      console.error(
        "Error cargando órdenes:",
        ordenesResult.error
      );

      setErrorMensaje(
        "No se pudieron cargar las órdenes: " +
          ordenesResult.error.message
      );
    } else {
      const ordenesCargadas =
        ordenesResult.data || [];

      setOrdenes(
        ordenesCargadas
      );

      if (
        ordenesCargadas.length > 0 &&
        !formulario.numero_ot
      ) {
        setFormulario(
          (actual) => ({
            ...actual,
            numero_ot:
              obtenerNumeroOT(
                ordenesCargadas[0]
              )
          })
        );
      }

      if (
        ordenesCargadas.length === 0 &&
        !formulario.numero_ot
      ) {
        setFormulario(
          (actual) => ({
            ...actual,
            numero_ot:
              "OT-000001"
          })
        );
      }
    }

    setCargando(false);
  }

  function actualizarCampo(
    campo: keyof FormularioOrden,
    valor: string
  ) {
    setFormulario(
      (actual) => ({
        ...actual,
        [campo]: valor
      })
    );
  }

  function actualizarCampoDetalle(
    campo: keyof FormularioDetalle,
    valor: string
  ) {
    setFormularioDetalle(
      (actual) => ({
        ...actual,
        [campo]: valor
      })
    );
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
      obtenerPaciente(
        pacienteId
      );

    if (!paciente) {
      return "Paciente no encontrado";
    }

    return `${paciente.nombres} ${
      paciente.apellidos || ""
    }`.trim();
  }

  function obtenerReceta(
    recetaId: number | null
  ): Receta | undefined {
    if (!recetaId) {
      return undefined;
    }

    return recetas.find(
      (receta) =>
        receta.id === recetaId
    );
  }

  function obtenerProducto(
    productoId: number | null
  ): Producto | undefined {
    if (!productoId) {
      return undefined;
    }

    return productos.find(
      (producto) =>
        producto.id === productoId
    );
  }

  const pacientesFiltrados =
    useMemo(() => {
      const texto =
        busquedaPaciente
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

          const ficha =
            (
              paciente.ficha || ""
            ).toLowerCase();

          return (
            nombre.includes(
              texto
            ) ||
            rut.includes(
              texto
            ) ||
            ficha.includes(
              texto
            )
          );
        }
      );
    }, [
      pacientes,
      busquedaPaciente
    ]);

  const recetasDelPaciente =
    useMemo(() => {
      if (
        !formulario.paciente_id
      ) {
        return [];
      }

      return recetas.filter(
        (receta) =>
          receta.paciente_id ===
          Number(
            formulario.paciente_id
          )
      );
    }, [
      recetas,
      formulario.paciente_id
    ]);

  const productosFiltrados =
    useMemo(() => {
      const texto =
        busquedaProducto
          .trim()
          .toLowerCase();

      if (!texto) {
        return productos.slice(
          0,
          50
        );
      }

      return productos
        .filter(
          (producto) => {
            const codigo =
              (
                producto.codigo ||
                ""
              ).toLowerCase();

            const nombre =
              producto.nombre
                .toLowerCase();

            const tipo =
              (
                producto.tipo_producto ||
                ""
              ).toLowerCase();

            const marca =
              (
                producto.marca ||
                ""
              ).toLowerCase();

            const modelo =
              (
                producto.modelo ||
                ""
              ).toLowerCase();

            const color =
              (
                producto.color ||
                ""
              ).toLowerCase();

            return (
              codigo.includes(
                texto
              ) ||
              nombre.includes(
                texto
              ) ||
              tipo.includes(
                texto
              ) ||
              marca.includes(
                texto
              ) ||
              modelo.includes(
                texto
              ) ||
              color.includes(
                texto
              )
            );
          }
        )
        .slice(
          0,
          50
        );
    }, [
      productos,
      busquedaProducto
    ]);

  const ordenesFiltradas =
    useMemo(() => {
      const texto =
        busquedaOrden
          .trim()
          .toLowerCase();

      if (!texto) {
        return ordenes;
      }

      return ordenes.filter(
        (orden) => {
          const numero =
            (
              orden.numero_ot ||
              ""
            ).toLowerCase();

          const paciente =
            obtenerNombrePaciente(
              orden.paciente_id
            ).toLowerCase();

          const estado =
            (
              orden.estado ||
              ""
            ).toLowerCase();

          return (
            numero.includes(
              texto
            ) ||
            paciente.includes(
              texto
            ) ||
            estado.includes(
              texto
            )
          );
        }
      );
    }, [
      ordenes,
      busquedaOrden,
      pacientes
    ]);

  const totalDetalles =
    useMemo(() => {
      return detalles.reduce(
        (
          total,
          detalle
        ) =>
          total +
          (
            detalle.subtotal ||
            0
          ),
        0
      );
    }, [detalles]);

  function seleccionarPaciente(
    pacienteId: string
  ) {
    actualizarCampo(
      "paciente_id",
      pacienteId
    );

    actualizarCampo(
      "receta_id",
      ""
    );

    const paciente =
      pacientes.find(
        (item) =>
          item.id ===
          Number(pacienteId)
      );

    if (paciente) {
      setBusquedaPaciente(
        `${paciente.nombres} ${
          paciente.apellidos || ""
        }`.trim()
      );
    }
  }

  function seleccionarReceta(
    recetaId: string
  ) {
    actualizarCampo(
      "receta_id",
      recetaId
    );
  }

  function seleccionarProducto(
    productoId: string
  ) {
    actualizarCampoDetalle(
      "producto_id",
      productoId
    );

    const producto =
      productos.find(
        (item) =>
          item.id ===
          Number(productoId)
      );

    if (!producto) {
      return;
    }

    const descripcion =
      [
        producto.marca,
        producto.modelo,
        producto.nombre,
        producto.color
      ]
        .filter(Boolean)
        .join(" · ");

    actualizarCampoDetalle(
      "descripcion",
      descripcion
    );

    actualizarCampoDetalle(
      "precio_unitario",
      producto.precio_venta !== null &&
        producto.precio_venta !== undefined
        ? String(
            producto.precio_venta
          )
        : ""
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

  function agregarDetalle() {
    if (
      !formularioDetalle.descripcion.trim()
    ) {
      setErrorMensaje(
        "Debes indicar una descripción o seleccionar un producto."
      );
      return;
    }

    const cantidad =
      Number(
        formularioDetalle.cantidad
      );

    if (
      !Number.isFinite(cantidad) ||
      cantidad <= 0
    ) {
      setErrorMensaje(
        "La cantidad debe ser mayor que cero."
      );
      return;
    }

    const precio =
      formularioDetalle.precio_unitario.trim() ===
      ""
        ? 0
        : Number(
            formularioDetalle.precio_unitario
          );

    if (
      !Number.isFinite(precio) ||
      precio < 0
    ) {
      setErrorMensaje(
        "El precio unitario no es válido."
      );
      return;
    }

    const subtotal =
      cantidad * precio;

    const nuevoDetalle: DetalleOrden = {
      producto_id:
        formularioDetalle.producto_id
          ? Number(
              formularioDetalle.producto_id
            )
          : null,

      tipo_item:
        formularioDetalle.tipo_item,

      ojo:
        formularioDetalle.ojo ||
        null,

      descripcion:
        formularioDetalle.descripcion.trim(),

      cantidad,

      precio_unitario:
        precio,

      subtotal,

      observaciones:
        formularioDetalle.observaciones.trim() ||
        null
    };

    setDetalles(
      (actuales) => [
        ...actuales,
        nuevoDetalle
      ]
    );

    setFormularioDetalle(
      detalleInicial
    );

    setBusquedaProducto("");
    setErrorMensaje("");
  }

  function eliminarDetalle(
    indice: number
  ) {
    setDetalles(
      (actuales) =>
        actuales.filter(
          (_, posicion) =>
            posicion !== indice
        )
    );
  }

  function editarDetalle(
    indice: number
  ) {
    const detalle =
      detalles[indice];

    if (!detalle) {
      return;
    }

    setFormularioDetalle({
      tipo_item:
        detalle.tipo_item,

      ojo:
        detalle.ojo || "",

      producto_id:
        detalle.producto_id !==
        null
          ? String(
              detalle.producto_id
            )
          : "",

      descripcion:
        detalle.descripcion,

      cantidad:
        String(
          detalle.cantidad
        ),

      precio_unitario:
        String(
          detalle.precio_unitario
        ),

      observaciones:
        detalle.observaciones ||
        ""
    });

    const producto =
      obtenerProducto(
        detalle.producto_id
      );

    setBusquedaProducto(
      producto
        ? [
            producto.codigo,
            producto.marca,
            producto.modelo,
            producto.nombre
          ]
            .filter(Boolean)
            .join(" · ")
        : ""
    );

    eliminarDetalle(indice);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function limpiarFormulario() {
    setFormulario({
      ...formularioInicial,
      numero_ot:
        obtenerNumeroOT(
          ordenes[0] || null
        )
    });

    setFormularioDetalle(
      detalleInicial
    );

    setDetalles([]);
    setBusquedaPaciente("");
    setBusquedaProducto("");
    setOrdenEditando(null);

    setMensaje("");
    setErrorMensaje("");
  }

  async function cargarDetallesOrden(
    ordenId: number
  ) {
    const {
      data,
      error
    } = await supabase
      .from(
        "detalle_ordenes_trabajo"
      )
      .select("*")
      .eq(
        "orden_trabajo_id",
        ordenId
      )
      .order("id", {
        ascending: true
      });

    if (error) {
      console.error(
        "Error cargando detalles:",
        error
      );

      setErrorMensaje(
        "No se pudieron cargar los detalles de la orden: " +
          error.message
      );

      return;
    }

    setDetalles(
      data || []
    );
  }

  async function editarOrden(
    orden: OrdenTrabajo
  ) {
    setOrdenEditando(orden);

    const paciente =
      obtenerPaciente(
        orden.paciente_id
      );

    setFormulario({
      numero_ot:
        orden.numero_ot || "",

      paciente_id:
        orden.paciente_id !== null
          ? String(
              orden.paciente_id
            )
          : "",

      receta_id:
        orden.receta_id !== null
          ? String(
              orden.receta_id
            )
          : "",

      fecha_entrega:
        orden.fecha_entrega || "",

      estado:
        orden.estado ||
        "Ingresada",

      responsable:
        orden.responsable ||
        "",

      observaciones:
        orden.observaciones ||
        ""
    });

    setBusquedaPaciente(
      paciente
        ? `${paciente.nombres} ${
            paciente.apellidos || ""
          }`.trim()
        : ""
    );

    setFormularioDetalle(
      detalleInicial
    );

    setBusquedaProducto("");

    setMensaje("");
    setErrorMensaje("");

    await cargarDetallesOrden(
      orden.id
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function guardarOrden(
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

    if (!formulario.numero_ot.trim()) {
      setErrorMensaje(
        "La orden debe tener un número de OT."
      );
      return;
    }

    setGuardando(true);

    const datosOrden = {
      numero_ot:
        formulario.numero_ot.trim(),

      paciente_id:
        Number(
          formulario.paciente_id
        ),

      receta_id:
        formulario.receta_id
          ? Number(
              formulario.receta_id
            )
          : null,

      fecha_ingreso:
        ordenEditando?.fecha_ingreso ||
        new Date().toISOString(),

      fecha_entrega:
        formulario.fecha_entrega ||
        null,

      estado:
        formulario.estado ||
        "Ingresada",

      responsable:
        formulario.responsable.trim() ||
        null,

      observaciones:
        formulario.observaciones.trim() ||
        null
    };

    let ordenId: number | null =
      null;

    let errorOrden = null;

    if (ordenEditando) {
      const resultado =
        await supabase
          .from(
            "ordenes_trabajo"
          )
          .update(
            datosOrden
          )
          .eq(
            "id",
            ordenEditando.id
          )
          .select("id")
          .single();

      if (
        resultado.error ||
        !resultado.data
      ) {
        errorOrden =
          resultado.error ||
          {
            message:
              "No se pudo obtener el ID de la orden actualizada."
          };

      } else {
        ordenId =
          resultado.data.id;
      }
    } else {
      const resultado =
        await supabase
          .from(
            "ordenes_trabajo"
          )
          .insert(
            [datosOrden]
          )
          .select("id")
          .single();

      if (
        resultado.error ||
        !resultado.data
      ) {
        errorOrden =
          resultado.error ||
          {
            message:
              "No se pudo obtener el ID de la nueva orden."
          };

      } else {
        ordenId =
          resultado.data.id;
      }
    }

    if (
      errorOrden ||
      ordenId === null
    ) {
      console.error(
        "Error guardando orden:",
        errorOrden
      );

      setErrorMensaje(
        "No se pudo guardar la orden: " +
          (
            errorOrden?.message ||
            "Error desconocido"
          )
      );

      setGuardando(false);
      return;
    }

    /*
      En edición eliminamos
      los detalles anteriores
      para reemplazarlos por
      la versión actual.
    */
    if (ordenEditando) {
      const {
        error:
          errorEliminandoDetalles
      } = await supabase
        .from(
          "detalle_ordenes_trabajo"
        )
        .delete()
        .eq(
          "orden_trabajo_id",
          ordenId
        );

      if (
        errorEliminandoDetalles
      ) {
        console.error(
          "Error eliminando detalles anteriores:",
          errorEliminandoDetalles
        );

        setErrorMensaje(
          "La orden se actualizó, pero no se pudieron reemplazar sus detalles: " +
            errorEliminandoDetalles.message
        );

        setGuardando(false);
        return;
      }
    }

    /*
      Guardar los detalles.
    */
    if (detalles.length > 0) {
      const detallesParaGuardar =
        detalles.map(
          (detalle) => ({
            orden_trabajo_id:
              ordenId,

            producto_id:
              detalle.producto_id,

            tipo_item:
              detalle.tipo_item,

            ojo:
              detalle.ojo,

            descripcion:
              detalle.descripcion,

            cantidad:
              detalle.cantidad,

            precio_unitario:
              detalle.precio_unitario,

            subtotal:
              detalle.subtotal,

            observaciones:
              detalle.observaciones
          })
        );

      const {
        error: errorDetalles
      } = await supabase
        .from(
          "detalle_ordenes_trabajo"
        )
        .insert(
          detallesParaGuardar
        );

      if (errorDetalles) {
        console.error(
          "Error guardando detalles:",
          errorDetalles
        );

        setErrorMensaje(
          "La orden se guardó, pero hubo un problema con los detalles: " +
            errorDetalles.message
        );

        setGuardando(false);
        return;
      }
    }

    const mensajeExito =
      ordenEditando
        ? "✓ Orden actualizada correctamente."
        : "✓ Orden creada correctamente.";

    limpiarFormulario();

    setMensaje(
      mensajeExito
    );

    setGuardando(false);

    await cargarDatos();
  }

  async function eliminarOrden(
    orden: OrdenTrabajo
  ) {
    const nombrePaciente =
      obtenerNombrePaciente(
        orden.paciente_id
      );

    const confirmar =
      window.confirm(
        `¿Eliminar la orden ${
          orden.numero_ot ||
          ""
        } de ${nombrePaciente}?`
      );

    if (!confirmar) {
      return;
    }

    setMensaje("");
    setErrorMensaje("");

    const {
      error
    } = await supabase
      .from("ordenes_trabajo")
      .delete()
      .eq(
        "id",
        orden.id
      );

    if (error) {
      console.error(
        "Error eliminando orden:",
        error
      );

      setErrorMensaje(
        "No se pudo eliminar la orden: " +
          error.message
      );

      return;
    }

    if (
      ordenEditando &&
      ordenEditando.id ===
        orden.id
    ) {
      limpiarFormulario();
    }

    setMensaje(
      "✓ Orden eliminada correctamente."
    );

    await cargarDatos();
  }

  return (
    <MainLayout>

      <PageHeader
        titulo="Órdenes"
        subtitulo="Gestión y seguimiento de órdenes de trabajo ópticas"
      />

      <style>
        {`
          .ordenes-contenedor {
            display: flex;
            flex-direction: column;
            gap: 25px;
            padding-bottom: 40px;
          }

          .ordenes-card {
            background: #ffffff;
            border-radius: 18px;
            padding: 28px;
            box-sizing: border-box;
            box-shadow:
              0 7px 24px rgba(0, 0, 0, .07);
          }

          .ordenes-card h2 {
            margin: 0;
            color: #222222;
            font-size: 22px;
            font-weight: 700;
          }

          .ordenes-descripcion {
            margin: 7px 0 24px 0;
            color: #777777;
            font-size: 14px;
          }

          .bloque-orden {
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

          .grid-orden {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 18px;
          }

          .grid-orden-2 {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 18px;
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
            min-height: 100px;
            resize: vertical;
          }

          .paciente-confirmado {
            margin-top: 8px;
            color: #247a3d;
            font-size: 12px;
            font-weight: 600;
          }

          .receta-resumen {
            margin-top: 15px;
            padding: 15px;
            background: #ffffff;
            border: 1px solid #e7e7e7;
            border-radius: 12px;
          }

          .receta-resumen-titulo {
            margin-bottom: 10px;
            color: #333333;
            font-size: 13px;
            font-weight: 700;
          }

          .receta-resumen-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 10px;
          }

          .dato-resumen {
            color: #555555;
            font-size: 12px;
          }

          .dato-resumen strong {
            color: #333333;
          }

          .producto-busqueda {
            margin-bottom: 12px;
          }

          .producto-listado {
            max-height: 190px;
            overflow-y: auto;
            background: #ffffff;
            border: 1px solid #eeeeee;
            border-radius: 10px;
            margin-bottom: 15px;
          }

          .producto-opcion {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-bottom: 1px solid #eeeeee;
            cursor: pointer;
          }

          .producto-opcion:last-child {
            border-bottom: none;
          }

          .producto-opcion:hover {
            background: #fafafa;
          }

          .producto-info {
            min-width: 0;
          }

          .producto-nombre {
            color: #333333;
            font-size: 13px;
            font-weight: 700;
          }

          .producto-detalle {
            margin-top: 3px;
            color: #888888;
            font-size: 11px;
          }

          .producto-stock {
            color: #555555;
            font-size: 11px;
            white-space: nowrap;
          }

          .detalle-editor {
            display: grid;
            grid-template-columns:
              160px
              110px
              1fr
              120px
              150px;
            gap: 12px;
            align-items: end;
          }

          .botones-detalle {
            display: flex;
            justify-content: flex-end;
            margin-top: 15px;
          }

          .boton {
            border: none;
            border-radius: 10px;
            padding: 11px 17px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }

          .boton:hover {
            transform: translateY(-1px);
          }

          .boton:disabled {
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

          .boton-eliminar {
            background: #fff0f2;
            color: #b0001b;
          }

          .tabla-detalles {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          .tabla-detalles th {
            padding: 11px 9px;
            background: #f1f1f1;
            border-bottom: 1px solid #dddddd;
            color: #333333;
            font-size: 12px;
            text-align: left;
          }

          .tabla-detalles td {
            padding: 11px 9px;
            border-bottom: 1px solid #eeeeee;
            color: #555555;
            font-size: 13px;
            vertical-align: middle;
          }

          .total-orden {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 12px;
            margin-top: 18px;
            color: #333333;
            font-size: 17px;
            font-weight: 700;
          }

          .botones-formulario {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 25px;
            flex-wrap: wrap;
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

          .busqueda-tabla {
            margin-bottom: 20px;
          }

          .busqueda-tabla input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #dddddd;
            border-radius: 10px;
            padding: 12px 14px;
            color: #333333;
            font-size: 14px;
            outline: none;
          }

          .busqueda-tabla input:focus {
            border-color: #cc001f;
            box-shadow:
              0 0 0 3px rgba(204, 0, 31, .08);
          }

          .tabla-scroll {
            width: 100%;
            overflow-x: auto;
          }

          .tabla-ordenes {
            width: 100%;
            min-width: 1050px;
            border-collapse: collapse;
          }

          .tabla-ordenes th {
            padding: 12px 10px;
            background: #f4f4f4;
            border-bottom: 1px solid #dddddd;
            color: #333333;
            font-size: 12px;
            font-weight: 700;
            text-align: left;
            white-space: nowrap;
          }

          .tabla-ordenes td {
            padding: 12px 10px;
            border-bottom: 1px solid #eeeeee;
            color: #555555;
            font-size: 13px;
            vertical-align: middle;
          }

          .orden-numero {
            color: #333333;
            font-weight: 700;
          }

          .orden-secundario {
            margin-top: 3px;
            color: #888888;
            font-size: 11px;
          }

          .estado-orden {
            display: inline-block;
            padding: 5px 9px;
            border-radius: 999px;
            background: #eeeeee;
            color: #555555;
            font-size: 11px;
            font-weight: 700;
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

          .boton-editar-tabla {
            background: #eeeeee;
            color: #333333;
          }

          .boton-eliminar-tabla {
            background: #fff0f2;
            color: #b0001b;
          }

          .estado-vacio {
            padding: 35px 15px;
            color: #777777;
            text-align: center;
          }

          @media (max-width: 1200px) {
            .detalle-editor {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .receta-resumen-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 1000px) {
            .grid-orden {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 700px) {
            .ordenes-card {
              padding: 18px;
            }

            .grid-orden,
            .grid-orden-2,
            .receta-resumen-grid,
            .detalle-editor {
              grid-template-columns: 1fr;
            }

            .campo-full {
              grid-column: auto;
            }

            .total-orden {
              justify-content: flex-start;
            }
          }
        `}
      </style>

      <div className="ordenes-contenedor">

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

        <div className="ordenes-card">

          <h2>
            {ordenEditando
              ? "Editar orden de trabajo"
              : "Nueva orden de trabajo"}
          </h2>

          <p className="ordenes-descripcion">
            Crea la orden a partir del paciente
            y, cuando corresponda, de una receta existente.
          </p>

          <form
            onSubmit={guardarOrden}
          >

            <div className="bloque-orden">

              <h3 className="titulo-bloque">
                📋 Datos de la orden
              </h3>

              <div className="grid-orden">

                <div className="campo">

                  <label>
                    Nº de OT *
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.numero_ot
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "numero_ot",
                        event.target.value
                      )
                    }
                    placeholder="OT-000001"
                    required
                  />

                </div>

                <div className="campo">

                  <label>
                    Estado
                  </label>

                  <select
                    value={
                      formulario.estado
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "estado",
                        event.target.value
                      )
                    }
                  >

                    <option value="Ingresada">
                      Ingresada
                    </option>

                    <option value="En preparación">
                      En preparación
                    </option>

                    <option value="En laboratorio">
                      En laboratorio
                    </option>

                    <option value="Lista">
                      Lista
                    </option>

                    <option value="Entregada">
                      Entregada
                    </option>

                    <option value="Cancelada">
                      Cancelada
                    </option>

                  </select>

                </div>

                <div className="campo">

                  <label>
                    Fecha de entrega
                  </label>

                  <input
                    type="date"
                    value={
                      formulario.fecha_entrega
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "fecha_entrega",
                        event.target.value
                      )
                    }
                  />

                </div>

                <div className="campo">

                  <label>
                    Responsable
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.responsable
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "responsable",
                        event.target.value
                      )
                    }
                    placeholder="Responsable de la OT"
                  />

                </div>

              </div>

            </div>

            <div className="bloque-orden">

              <h3 className="titulo-bloque">
                👤 Paciente
              </h3>

              <div className="grid-orden-2">

                <div className="campo">

                  <label>
                    Buscar paciente
                  </label>

                  <input
                    type="text"
                    value={
                      busquedaPaciente
                    }
                    onChange={(event) =>
                      setBusquedaPaciente(
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
                          {
                            paciente.ficha
                              ? ` · Ficha ${paciente.ficha}`
                              : ""
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

              {formulario.paciente_id && (
                <div className="paciente-confirmado">
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

            <div className="bloque-orden">

              <h3 className="titulo-bloque">
                👓 Receta asociada
              </h3>

              <div className="grid-orden-2">

                <div className="campo">

                  <label>
                    Seleccionar receta
                  </label>

                  <select
                    value={
                      formulario.receta_id
                    }
                    onChange={(event) =>
                      seleccionarReceta(
                        event.target.value
                      )
                    }
                    disabled={
                      !formulario.paciente_id
                    }
                  >

                    <option value="">
                      {
                        formulario.paciente_id
                          ? "Sin receta asociada"
                          : "Primero selecciona un paciente"
                      }
                    </option>

                    {recetasDelPaciente.map(
                      (receta) => (
                        <option
                          key={
                            receta.id
                          }
                          value={
                            receta.id
                          }
                        >
                          {receta.numero_formula ||
                            `Receta #${receta.id}`}
                          {" · "}
                          {formatearFecha(
                            receta.fecha_receta
                          )}
                          {" · "}
                          {
                            receta.tipo_receta ||
                            "Sin tipo"
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

                {formulario.receta_id && (
                  <div className="receta-resumen">

                    <div className="receta-resumen-titulo">
                      Resumen de receta
                    </div>

                    {(() => {
                      const receta =
                        obtenerReceta(
                          Number(
                            formulario.receta_id
                          )
                        );

                      if (!receta) {
                        return (
                          <div className="dato-resumen">
                            Receta no encontrada
                          </div>
                        );
                      }

                      return (
                        <div className="receta-resumen-grid">

                          <div className="dato-resumen">
                            <strong>Fecha:</strong>{" "}
                            {
                              formatearFecha(
                                receta.fecha_receta
                              )
                            }
                          </div>

                          <div className="dato-resumen">
                            <strong>Tipo:</strong>{" "}
                            {
                              receta.tipo_receta ||
                              "-"
                            }
                          </div>

                          <div className="dato-resumen">
                            <strong>OD:</strong>{" "}
                            {
                              receta.esfera_od ??
                              "-"
                            }
                            {" / "}
                            {
                              receta.cilindro_od ??
                              "-"
                            }
                            {" / "}
                            {
                              receta.eje_od ??
                              "-"
                            }
                          </div>

                          <div className="dato-resumen">
                            <strong>OI:</strong>{" "}
                            {
                              receta.esfera_oi ??
                              "-"
                            }
                            {" / "}
                            {
                              receta.cilindro_oi ??
                              "-"
                            }
                            {" / "}
                            {
                              receta.eje_oi ??
                              "-"
                            }
                          </div>

                          <div className="dato-resumen">
                            <strong>DP:</strong>{" "}
                            {
                              receta.distancia_pupilar ||
                              "-"
                            }
                          </div>

                          <div className="dato-resumen">
                            <strong>Profesional:</strong>{" "}
                            {
                              receta.profesional ||
                              "-"
                            }
                          </div>

                        </div>
                      );
                    })()}

                  </div>
                )}

              </div>

            </div>

            <div className="bloque-orden">

              <h3 className="titulo-bloque">
                📦 Productos y componentes de la orden
              </h3>

              <div className="campo producto-busqueda">

                <label>
                  Buscar producto por código, marca, modelo o nombre
                </label>

                <input
                  type="text"
                  value={
                    busquedaProducto
                  }
                  onChange={(event) =>
                    setBusquedaProducto(
                      event.target.value
                    )
                  }
                  placeholder="Ej: Ray-Ban, RB5228, Essilor, cristal 1.56..."
                />

              </div>

              {productosFiltrados.length >
                0 && (
                <div className="producto-listado">

                  {productosFiltrados.map(
                    (producto) => (
                      <div
                        key={
                          producto.id
                        }
                        className="producto-opcion"
                        onClick={() =>
                          seleccionarProducto(
                            String(
                              producto.id
                            )
                          )
                        }
                      >

                        <div className="producto-info">

                          <div className="producto-nombre">
                            {
                              producto.nombre
                            }
                          </div>

                          <div className="producto-detalle">
                            {[
                              producto.codigo,
                              producto.tipo_producto,
                              producto.marca,
                              producto.modelo,
                              producto.color
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                " · "
                              )}
                          </div>

                        </div>

                        <div className="producto-stock">
                          Stock:{" "}
                          {
                            producto.stock ??
                            0
                          }
                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

              <div className="detalle-editor">

                <div className="campo">

                  <label>
                    Tipo de ítem
                  </label>

                  <select
                    value={
                      formularioDetalle.tipo_item
                    }
                    onChange={(event) =>
                      actualizarCampoDetalle(
                        "tipo_item",
                        event.target.value
                      )
                    }
                  >

                    <option value="ARMAZON">
                      Armazón
                    </option>

                    <option value="CRISTAL">
                      Cristal
                    </option>

                    <option value="TRATAMIENTO">
                      Tratamiento
                    </option>

                    <option value="ACCESORIO">
                      Accesorio
                    </option>

                    <option value="OTRO">
                      Otro
                    </option>

                  </select>

                </div>

                <div className="campo">

                  <label>
                    Ojo
                  </label>

                  <select
                    value={
                      formularioDetalle.ojo
                    }
                    onChange={(event) =>
                      actualizarCampoDetalle(
                        "ojo",
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      N/A
                    </option>

                    <option value="OD">
                      OD
                    </option>

                    <option value="OI">
                      OI
                    </option>

                    <option value="AMBOS">
                      Ambos
                    </option>

                  </select>

                </div>

                <div className="campo">

                  <label>
                    Descripción *
                  </label>

                  <input
                    type="text"
                    value={
                      formularioDetalle.descripcion
                    }
                    onChange={(event) =>
                      actualizarCampoDetalle(
                        "descripcion",
                        event.target.value
                      )
                    }
                    placeholder="Descripción del componente"
                  />

                </div>

                <div className="campo">

                  <label>
                    Cantidad
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      formularioDetalle.cantidad
                    }
                    onChange={(event) =>
                      actualizarCampoDetalle(
                        "cantidad",
                        event.target.value
                      )
                    }
                  />

                </div>

                <div className="campo">

                  <label>
                    Precio unitario
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      formularioDetalle.precio_unitario
                    }
                    onChange={(event) =>
                      actualizarCampoDetalle(
                        "precio_unitario",
                        event.target.value
                      )
                    }
                    placeholder="0"
                  />

                </div>

              </div>

              <div
                className="grid-orden-2"
                style={{
                  marginTop: "15px"
                }}
              >

                <div className="campo">

                  <label>
                    Observaciones del componente
                  </label>

                  <input
                    type="text"
                    value={
                      formularioDetalle.observaciones
                    }
                    onChange={(event) =>
                      actualizarCampoDetalle(
                        "observaciones",
                        event.target.value
                      )
                    }
                    placeholder="Información adicional"
                  />

                </div>

                <div className="botones-detalle">

                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={
                      agregarDetalle
                    }
                  >
                    + Agregar componente
                  </button>

                </div>

              </div>

              {detalles.length > 0 && (
                <>

                  <table className="tabla-detalles">

                    <thead>

                      <tr>
                        <th>
                          Tipo
                        </th>

                        <th>
                          Ojo
                        </th>

                        <th>
                          Producto
                        </th>

                        <th>
                          Cant.
                        </th>

                        <th>
                          Precio
                        </th>

                        <th>
                          Subtotal
                        </th>

                        <th>
                          Acciones
                        </th>
                      </tr>

                    </thead>

                    <tbody>

                      {detalles.map(
                        (
                          detalle,
                          indice
                        ) => {

                          const producto =
                            obtenerProducto(
                              detalle.producto_id
                            );

                          return (
                            <tr
                              key={
                                detalle.id ??
                                `detalle-${indice}`
                              }
                            >

                              <td>
                                {
                                  detalle.tipo_item
                                }
                              </td>

                              <td>
                                {
                                  detalle.ojo ||
                                  "-"
                                }
                              </td>

                              <td>

                                <div>
                                  {
                                    detalle.descripcion
                                  }
                                </div>

                                {producto?.codigo && (
                                  <div className="orden-secundario">
                                    SKU:{" "}
                                    {
                                      producto.codigo
                                    }
                                  </div>
                                )}

                              </td>

                              <td>
                                {
                                  detalle.cantidad
                                }
                              </td>

                              <td>
                                {formatearMoneda(
                                  detalle.precio_unitario
                                )}
                              </td>

                              <td>
                                {formatearMoneda(
                                  detalle.subtotal
                                )}
                              </td>

                              <td>

                                <div className="acciones-tabla">

                                  <button
                                    type="button"
                                    className="boton-tabla boton-editar-tabla"
                                    onClick={() =>
                                      editarDetalle(
                                        indice
                                      )
                                    }
                                  >
                                    Editar
                                  </button>

                                  <button
                                    type="button"
                                    className="boton-tabla boton-eliminar-tabla"
                                    onClick={() =>
                                      eliminarDetalle(
                                        indice
                                      )
                                    }
                                  >
                                    Quitar
                                  </button>

                                </div>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                  <div className="total-orden">
                    <span>
                      Total estimado:
                    </span>

                    <span>
                      {formatearMoneda(
                        totalDetalles
                      )}
                    </span>
                  </div>

                </>
              )}

            </div>

            <div className="bloque-orden">

              <h3 className="titulo-bloque">
                📝 Observaciones de la orden
              </h3>

              <div className="campo">

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
                  placeholder="Indicaciones especiales, observaciones del laboratorio, entrega, etc."
                />

              </div>

            </div>

            <div className="botones-formulario">

              {ordenEditando && (
                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={() =>
                    limpiarFormulario()
                  }
                  disabled={
                    guardando
                  }
                >
                  Cancelar edición
                </button>
              )}

              <button
                type="button"
                className="boton boton-secundario"
                onClick={() =>
                  limpiarFormulario()
                }
                disabled={
                  guardando
                }
              >
                Limpiar
              </button>

              <button
                type="submit"
                className="boton boton-primario"
                disabled={
                  guardando
                }
              >
                {guardando
                  ? "Guardando..."
                  : ordenEditando
                  ? "Actualizar orden"
                  : "Guardar orden"}
              </button>

            </div>

          </form>

        </div>

        <div className="ordenes-card">

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
              marginBottom: "8px"
            }}
          >

            <h2>
              Órdenes registradas
            </h2>

            <span
              style={{
                color: "#888888",
                fontSize: "13px"
              }}
            >
              {ordenesFiltradas.length}{" "}
              {
                ordenesFiltradas.length ===
                1
                  ? "orden"
                  : "órdenes"
              }
            </span>

          </div>

          <p className="ordenes-descripcion">
            Consulta, edita y administra las
            órdenes de trabajo.
          </p>

          <div className="busqueda-tabla">

            <input
              type="text"
              value={
                busquedaOrden
              }
              onChange={(event) =>
                setBusquedaOrden(
                  event.target.value
                )
              }
              placeholder="Buscar por número de OT, paciente o estado..."
            />

          </div>

          {cargando ? (
            <div className="estado-vacio">
              Cargando órdenes...
            </div>
          ) : ordenesFiltradas.length ===
            0 ? (
            <div className="estado-vacio">
              No hay órdenes registradas.
            </div>
          ) : (
            <div className="tabla-scroll">

              <table className="tabla-ordenes">

                <thead>

                  <tr>

                    <th>
                      Nº OT
                    </th>

                    <th>
                      Paciente
                    </th>

                    <th>
                      Receta
                    </th>

                    <th>
                      Ingreso
                    </th>

                    <th>
                      Entrega
                    </th>

                    <th>
                      Estado
                    </th>

                    <th>
                      Responsable
                    </th>

                    <th>
                      Venta
                    </th>

                    <th>
                      Acciones
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {ordenesFiltradas.map(
                    (orden) => {

                      const receta =
                        obtenerReceta(
                          orden.receta_id
                        );

                      return (
                        <tr
                          key={
                            orden.id
                          }
                        >

                          <td>

                            <div className="orden-numero">
                              {
                                orden.numero_ot ||
                                "-"
                              }
                            </div>

                          </td>

                          <td>

                            <div className="orden-numero">
                              {
                                obtenerNombrePaciente(
                                  orden.paciente_id
                                )
                              }
                            </div>

                            {obtenerPaciente(
                              orden.paciente_id
                            )?.rut && (
                              <div className="orden-secundario">
                                RUT:{" "}
                                {
                                  obtenerPaciente(
                                    orden.paciente_id
                                  )?.rut
                                }
                              </div>
                            )}

                          </td>

                          <td>
                            {
                              receta?.numero_formula ||
                              "-"
                            }
                          </td>

                          <td>
                            {
                              formatearFechaHora(
                                orden.fecha_ingreso
                              )
                            }
                          </td>

                          <td>
                            {
                              formatearFecha(
                                orden.fecha_entrega
                              )
                            }
                          </td>

                          <td>

                            <span className="estado-orden">
                              {
                                orden.estado ||
                                "-"
                              }
                            </span>

                          </td>

                          <td>
                            {
                              orden.responsable ||
                              "-"
                            }
                          </td>

                          <td>
                            {orden.venta_id
                              ? `Venta #${orden.venta_id}`
                              : "Pendiente"}
                          </td>

                          <td>

                            <div className="acciones-tabla">

                              <button
                                type="button"
                                className="boton-tabla boton-editar-tabla"
                                onClick={() =>
                                  editarOrden(
                                    orden
                                  )
                                }
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                className="boton-tabla boton-eliminar-tabla"
                                onClick={() =>
                                  eliminarOrden(
                                    orden
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

export default Ordenes;
