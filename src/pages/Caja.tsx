import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

import MainLayout from "../layout/MainLayout";
import PageHeader from "../components/PageHeader";

interface CajaDiaria {
  id: number;
  fecha: string;
  apertura: number;
  ingresos: number;
  egresos: number;
  cierre: number;
  observaciones: string | null;
}

interface Abono {
  id: number;
  venta_id: number;
  fecha: string;
  monto: number;
  metodo_pago: string | null;
  observacion: string | null;
}

interface Venta {
  id: number;
  numero_venta: string;
  fecha: string;
  total: number;
  estado: string;
  paciente: {
    nombres: string;
    apellidos: string | null;
  } | null;
}

function Caja() {
  const obtenerFechaHoy = () => {
    const ahora = new Date();

    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
  };

  const [fecha, setFecha] = useState(obtenerFechaHoy());

  const [caja, setCaja] = useState<CajaDiaria | null>(null);
  const [abonos, setAbonos] = useState<Abono[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [aperturaInput, setAperturaInput] = useState("");
  const [egresoInput, setEgresoInput] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [errorMensaje, setErrorMensaje] = useState("");

  useEffect(() => {
    cargarCaja();
  }, [fecha]);

  async function cargarCaja() {
    setCargando(true);
    setMensaje("");
    setErrorMensaje("");

    try {
      const fechaSiguiente = obtenerDiaSiguiente(fecha);

      const [
        { data: cajaData, error: cajaError },
        { data: abonosData, error: abonosError },
        { data: ventasData, error: ventasError }
      ] = await Promise.all([
        supabase
          .from("caja_diaria")
          .select("*")
          .eq("fecha", fecha)
          .maybeSingle(),

        supabase
          .from("abonos")
          .select(
            "id, venta_id, fecha, monto, metodo_pago, observacion"
          )
          .gte("fecha", `${fecha}T00:00:00`)
          .lt("fecha", `${fechaSiguiente}T00:00:00`)
          .order("fecha", { ascending: false }),

        supabase
          .from("ventas")
          .select(
            `
              id,
              numero_venta,
              fecha,
              total,
              estado,
              paciente:pacientes (
                nombres,
                apellidos
              )
            `
          )
          .gte("fecha", `${fecha}T00:00:00`)
          .lt("fecha", `${fechaSiguiente}T00:00:00`)
          .order("fecha", { ascending: false })
      ]);

      if (cajaError) {
        throw cajaError;
      }

      if (abonosError) {
        throw abonosError;
      }

      if (ventasError) {
        throw ventasError;
      }

      setCaja(cajaData || null);
      setAbonos((abonosData || []) as Abono[]);
      setVentas((ventasData || []) as Venta[]);

      setAperturaInput(
        cajaData
          ? String(cajaData.apertura ?? 0)
          : ""
      );
    } catch (error: any) {
      console.error(error);

      setErrorMensaje(
        error?.message || "No fue posible cargar la caja."
      );
    } finally {
      setCargando(false);
    }
  }

  function obtenerDiaSiguiente(fechaBase: string) {
    const fechaObj = new Date(`${fechaBase}T12:00:00`);
    fechaObj.setDate(fechaObj.getDate() + 1);

    const anio = fechaObj.getFullYear();
    const mes = String(fechaObj.getMonth() + 1).padStart(2, "0");
    const dia = String(fechaObj.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
  }

  function formatearMonto(valor: number) {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0
    }).format(valor || 0);
  }

  function formatearFecha(valor: string) {
    if (!valor) return "";

    const fechaObj = new Date(
      valor.includes("T")
        ? valor
        : `${valor}T12:00:00`
    );

    return fechaObj.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  function formatearHora(valor: string) {
    if (!valor) return "";

    const fechaObj = new Date(
      valor.includes("T")
        ? valor
        : `${valor}T12:00:00`
    );

    return fechaObj.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  async function guardarApertura() {
    const apertura = Number(aperturaInput);

    if (!Number.isFinite(apertura) || apertura < 0) {
      alert("Ingresa un monto de apertura válido.");
      return;
    }

    setGuardando(true);
    setMensaje("");
    setErrorMensaje("");

    try {
      if (caja) {
        const { data, error } = await supabase
          .from("caja_diaria")
          .update({
            apertura,
            cierre:
              apertura +
              Number(caja.ingresos || 0) -
              Number(caja.egresos || 0)
          })
          .eq("id", caja.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setCaja(data as CajaDiaria);

        setMensaje("Apertura actualizada correctamente.");
      } else {
        const { data, error } = await supabase
          .from("caja_diaria")
          .insert({
            fecha,
            apertura,
            ingresos: 0,
            egresos: 0,
            cierre: apertura,
            observaciones: "Caja creada desde el módulo Caja"
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        setCaja(data as CajaDiaria);

        setMensaje("Caja abierta correctamente.");
      }
    } catch (error: any) {
      console.error(error);

      setErrorMensaje(
        error?.message || "No fue posible guardar la apertura."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function registrarEgreso() {
    const monto = Number(egresoInput);

    if (!Number.isFinite(monto) || monto <= 0) {
      alert("Ingresa un monto de egreso válido.");
      return;
    }

    if (!caja) {
      alert("Primero debes abrir la caja del día.");
      return;
    }

    const confirmar = window.confirm(
      `¿Registrar un egreso de ${formatearMonto(monto)}?`
    );

    if (!confirmar) {
      return;
    }

    setGuardando(true);
    setMensaje("");
    setErrorMensaje("");

    try {
      const nuevosEgresos =
        Number(caja.egresos || 0) + monto;

      const nuevoCierre =
        Number(caja.apertura || 0) +
        Number(caja.ingresos || 0) -
        nuevosEgresos;

      const observacionAnterior =
        caja.observaciones || "";

      const nuevaObservacion =
        observacionAnterior
          ? `${observacionAnterior} | Egreso manual: ${formatearMonto(monto)}`
          : `Egreso manual: ${formatearMonto(monto)}`;

      const { data, error } = await supabase
        .from("caja_diaria")
        .update({
          egresos: nuevosEgresos,
          cierre: nuevoCierre,
          observaciones: nuevaObservacion
        })
        .eq("id", caja.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCaja(data as CajaDiaria);
      setEgresoInput("");

      setMensaje("Egreso registrado correctamente.");
    } catch (error: any) {
      console.error(error);

      setErrorMensaje(
        error?.message || "No fue posible registrar el egreso."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function actualizarCierre() {
    if (!caja) {
      alert("No existe una caja abierta para esta fecha.");
      return;
    }

    const nuevoCierre =
      Number(caja.apertura || 0) +
      Number(caja.ingresos || 0) -
      Number(caja.egresos || 0);

    setGuardando(true);
    setMensaje("");
    setErrorMensaje("");

    try {
      const { data, error } = await supabase
        .from("caja_diaria")
        .update({
          cierre: nuevoCierre
        })
        .eq("id", caja.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCaja(data as CajaDiaria);

      setMensaje("Cierre actualizado correctamente.");
    } catch (error: any) {
      console.error(error);

      setErrorMensaje(
        error?.message || "No fue posible actualizar el cierre."
      );
    } finally {
      setGuardando(false);
    }
  }

  const totalAbonos = useMemo(() => {
    return abonos.reduce(
      (total, abono) =>
        total + Number(abono.monto || 0),
      0
    );
  }, [abonos]);

  const resumenMetodosPago = useMemo(() => {
    const resumen: Record<string, number> = {};

    abonos.forEach((abono) => {
      const metodo =
        abono.metodo_pago?.trim() || "Sin especificar";

      if (!resumen[metodo]) {
        resumen[metodo] = 0;
      }

      resumen[metodo] += Number(abono.monto || 0);
    });

    return Object.entries(resumen).sort(
      (a, b) => b[1] - a[1]
    );
  }, [abonos]);

  const totalIngresosCaja =
    Number(caja?.ingresos || 0);

  const totalEgresosCaja =
    Number(caja?.egresos || 0);

  const totalApertura =
    Number(caja?.apertura || 0);

  const totalCierre =
    totalApertura +
    totalIngresosCaja -
    totalEgresosCaja;

  const ventasPagadas = ventas.filter(
    (venta) =>
      venta.estado === "Pagada" ||
      venta.estado === "Entregada"
  );

  return (
    <MainLayout>
      <PageHeader
        titulo="Caja"
        subtitulo="Control diario de ingresos, egresos y movimientos de caja"
      />

      {/* SELECTOR DE FECHA */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e8e8e8",
          borderRadius: "18px",
          padding: "20px 24px",
          marginBottom: "25px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap"
        }}
      >
        <div>
          <div
            style={{
              fontSize: "13px",
              color: "#888",
              marginBottom: "5px",
              fontWeight: 600
            }}
          >
            FECHA DE CAJA
          </div>

          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#222"
            }}
          >
            {formatearFecha(fecha)}
          </div>
        </div>

        <input
          type="date"
          value={fecha}
          onChange={(e) =>
            setFecha(e.target.value)
          }
          style={{
            border: "1px solid #dcdcdc",
            borderRadius: "10px",
            padding: "11px 14px",
            fontSize: "15px",
            outline: "none"
          }}
        />
      </div>

      {mensaje && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            background: "#edf9f0",
            border: "1px solid #c9ebd2",
            borderRadius: "12px",
            color: "#25713a",
            fontWeight: 600
          }}
        >
          {mensaje}
        </div>
      )}

      {errorMensaje && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            background: "#fff1f1",
            border: "1px solid #f0c7c7",
            borderRadius: "12px",
            color: "#a12020",
            fontWeight: 600
          }}
        >
          {errorMensaje}
        </div>
      )}

      {cargando ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "50px",
            textAlign: "center",
            color: "#777"
          }}
        >
          Cargando caja...
        </div>
      ) : (
        <>
          {/* TARJETAS PRINCIPALES */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
              marginBottom: "25px"
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e8e8e8",
                borderRadius: "18px",
                padding: "22px"
              }}
            >
              <div
                style={{
                  color: "#888",
                  fontSize: "14px",
                  marginBottom: "8px"
                }}
              >
                Apertura
              </div>

              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#222"
                }}
              >
                {formatearMonto(totalApertura)}
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e8e8e8",
                borderRadius: "18px",
                padding: "22px"
              }}
            >
              <div
                style={{
                  color: "#888",
                  fontSize: "14px",
                  marginBottom: "8px"
                }}
              >
                Ingresos
              </div>

              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#16823a"
                }}
              >
                {formatearMonto(totalIngresosCaja)}
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e8e8e8",
                borderRadius: "18px",
                padding: "22px"
              }}
            >
              <div
                style={{
                  color: "#888",
                  fontSize: "14px",
                  marginBottom: "8px"
                }}
              >
                Egresos
              </div>

              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#c62828"
                }}
              >
                {formatearMonto(totalEgresosCaja)}
              </div>
            </div>

            <div
              style={{
                background: "#222",
                borderRadius: "18px",
                padding: "22px"
              }}
            >
              <div
                style={{
                  color: "#cfcfcf",
                  fontSize: "14px",
                  marginBottom: "8px"
                }}
              >
                Cierre esperado
              </div>

              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#ffffff"
                }}
              >
                {formatearMonto(totalCierre)}
              </div>
            </div>
          </div>

          {/* APERTURA / EGRESO */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
              marginBottom: "25px"
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e8e8e8",
                borderRadius: "18px",
                padding: "25px"
              }}
            >
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: "20px",
                  color: "#222"
                }}
              >
                Apertura de caja
              </h2>

              <p
                style={{
                  margin: "0 0 18px",
                  color: "#777",
                  fontSize: "14px"
                }}
              >
                Ingresa o actualiza el monto inicial de la caja.
              </p>

              <input
                type="number"
                min="0"
                value={aperturaInput}
                onChange={(e) =>
                  setAperturaInput(e.target.value)
                }
                placeholder="Monto de apertura"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px",
                  border: "1px solid #dcdcdc",
                  borderRadius: "10px",
                  marginBottom: "12px",
                  fontSize: "15px"
                }}
              />

              <button
                onClick={guardarApertura}
                disabled={guardando}
                style={{
                  width: "100%",
                  padding: "13px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#cc001f",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: guardando ? 0.6 : 1
                }}
              >
                {caja
                  ? "Actualizar apertura"
                  : "Abrir caja"}
              </button>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e8e8e8",
                borderRadius: "18px",
                padding: "25px"
              }}
            >
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: "20px",
                  color: "#222"
                }}
              >
                Registrar egreso
              </h2>

              <p
                style={{
                  margin: "0 0 18px",
                  color: "#777",
                  fontSize: "14px"
                }}
              >
                Registra una salida manual de dinero de la caja.
              </p>

              <input
                type="number"
                min="0"
                value={egresoInput}
                onChange={(e) =>
                  setEgresoInput(e.target.value)
                }
                placeholder="Monto del egreso"
                disabled={!caja || guardando}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px",
                  border: "1px solid #dcdcdc",
                  borderRadius: "10px",
                  marginBottom: "12px",
                  fontSize: "15px"
                }}
              />

              <button
                onClick={registrarEgreso}
                disabled={!caja || guardando}
                style={{
                  width: "100%",
                  padding: "13px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#555",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor:
                    !caja || guardando
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    !caja || guardando
                      ? 0.5
                      : 1
                }}
              >
                Registrar egreso
              </button>
            </div>
          </div>

          {/* RESUMEN DE PAGOS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
              marginBottom: "25px"
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e8e8e8",
                borderRadius: "18px",
                padding: "25px"
              }}
            >
              <h2
                style={{
                  margin: "0 0 20px",
                  fontSize: "20px",
                  color: "#222"
                }}
              >
                Resumen por medio de pago
              </h2>

              {resumenMetodosPago.length === 0 ? (
                <div
                  style={{
                    color: "#888",
                    padding: "20px 0"
                  }}
                >
                  No hay abonos registrados para esta fecha.
                </div>
              ) : (
                <div>
                  {resumenMetodosPago.map(
                    ([metodo, monto]) => (
                      <div
                        key={metodo}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px 0",
                          borderBottom:
                            "1px solid #eeeeee"
                        }}
                      >
                        <span
                          style={{
                            color: "#555",
                            fontWeight: 600
                          }}
                        >
                          {metodo}
                        </span>

                        <span
                          style={{
                            color: "#222",
                            fontWeight: 700
                          }}
                        >
                          {formatearMonto(monto)}
                        </span>
                      </div>
                    )
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: "18px",
                      fontWeight: 700
                    }}
                  >
                    <span>Total abonos del día</span>

                    <span>
                      {formatearMonto(totalAbonos)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e8e8e8",
                borderRadius: "18px",
                padding: "25px"
              }}
            >
              <h2
                style={{
                  margin: "0 0 20px",
                  fontSize: "20px",
                  color: "#222"
                }}
              >
                Estado de caja
              </h2>

              {!caja ? (
                <div
                  style={{
                    padding: "25px",
                    borderRadius: "12px",
                    background: "#fff8e8",
                    color: "#8a6500"
                  }}
                >
                  No existe una caja registrada para esta fecha.
                  Ingresa una apertura para comenzar.
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: "14px",
                      marginBottom: "20px"
                    }}
                  >
                    <div
                      style={{
                        background: "#f7f7f7",
                        borderRadius: "12px",
                        padding: "15px"
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#888",
                          marginBottom: "5px"
                        }}
                      >
                        INICIO
                      </div>

                      <strong>
                        {formatearMonto(
                          totalApertura
                        )}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#f7f7f7",
                        borderRadius: "12px",
                        padding: "15px"
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#888",
                          marginBottom: "5px"
                        }}
                      >
                        CIERRE
                      </div>

                      <strong>
                        {formatearMonto(
                          Number(
                            caja.cierre || 0
                          )
                        )}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={actualizarCierre}
                    disabled={guardando}
                    style={{
                      width: "100%",
                      padding: "13px",
                      border: "1px solid #d5d5d5",
                      borderRadius: "10px",
                      background: "#ffffff",
                      color: "#222",
                      fontSize: "15px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Actualizar cierre
                  </button>
                </>
              )}
            </div>
          </div>

          {/* VENTAS DEL DÍA */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e8e8e8",
              borderRadius: "18px",
              padding: "25px",
              marginBottom: "25px"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                flexWrap: "wrap",
                marginBottom: "20px"
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    color: "#222"
                  }}
                >
                  Ventas del día
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#888",
                    fontSize: "14px"
                  }}
                >
                  {ventasPagadas.length} venta(s) pagada(s)
                  o entregada(s)
                </p>
              </div>

              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#cc001f"
                }}
              >
                {formatearMonto(totalIngresosCaja)}
              </div>
            </div>

            {ventas.length === 0 ? (
              <div
                style={{
                  padding: "25px",
                  textAlign: "center",
                  color: "#888",
                  background: "#fafafa",
                  borderRadius: "12px"
                }}
              >
                No hay ventas registradas para esta fecha.
              </div>
            ) : (
              <div
                style={{
                  overflowX: "auto"
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse"
                  }}
                >
                  <thead>
                    <tr>
                      <th style={thStyle}>
                        Venta
                      </th>

                      <th style={thStyle}>
                        Paciente
                      </th>

                      <th style={thStyle}>
                        Hora
                      </th>

                      <th style={thStyle}>
                        Estado
                      </th>

                      <th
                        style={{
                          ...thStyle,
                          textAlign: "right"
                        }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {ventas.map((venta) => (
                      <tr key={venta.id}>
                        <td style={tdStyle}>
                          <strong>
                            {venta.numero_venta}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          {venta.paciente
                            ? `${venta.paciente.nombres} ${
                                venta.paciente.apellidos || ""
                              }`
                            : "Sin paciente"}
                        </td>

                        <td style={tdStyle}>
                          {formatearHora(
                            venta.fecha
                          )}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              display:
                                "inline-block",
                              padding:
                                "5px 10px",
                              borderRadius:
                                "20px",
                              fontSize:
                                "12px",
                              fontWeight: 700,
                              background:
                                venta.estado ===
                                "Pagada" ||
                                venta.estado ===
                                "Entregada"
                                  ? "#edf9f0"
                                  : "#f5f5f5",
                              color:
                                venta.estado ===
                                "Pagada" ||
                                venta.estado ===
                                "Entregada"
                                  ? "#25713a"
                                  : "#666"
                            }}
                          >
                            {venta.estado}
                          </span>
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            textAlign:
                              "right",
                            fontWeight: 700
                          }}
                        >
                          {formatearMonto(
                            Number(
                              venta.total ||
                                0
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* MOVIMIENTOS / ABONOS */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e8e8e8",
              borderRadius: "18px",
              padding: "25px",
              marginBottom: "30px"
            }}
          >
            <h2
              style={{
                margin: "0 0 20px",
                fontSize: "20px",
                color: "#222"
              }}
            >
              Movimientos de ingresos
            </h2>

            {abonos.length === 0 ? (
              <div
                style={{
                  padding: "25px",
                  textAlign: "center",
                  color: "#888",
                  background: "#fafafa",
                  borderRadius: "12px"
                }}
              >
                No hay ingresos registrados para esta fecha.
              </div>
            ) : (
              <div
                style={{
                  overflowX: "auto"
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse"
                  }}
                >
                  <thead>
                    <tr>
                      <th style={thStyle}>
                        Hora
                      </th>

                      <th style={thStyle}>
                        Venta
                      </th>

                      <th style={thStyle}>
                        Medio de pago
                      </th>

                      <th style={thStyle}>
                        Observación
                      </th>

                      <th
                        style={{
                          ...thStyle,
                          textAlign: "right"
                        }}
                      >
                        Monto
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {abonos.map((abono) => {
                      const ventaRelacionada =
                        ventas.find(
                          (venta) =>
                            venta.id ===
                            abono.venta_id
                        );

                      return (
                        <tr
                          key={
                            abono.id
                          }
                        >
                          <td
                            style={
                              tdStyle
                            }
                          >
                            {formatearHora(
                              abono.fecha
                            )}
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            {ventaRelacionada
                              ?.numero_venta ||
                              `Venta #${abono.venta_id}`}
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            {abono.metodo_pago ||
                              "Sin especificar"}
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            {abono.observacion ||
                              "-"}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              textAlign:
                                "right",
                              color:
                                "#16823a",
                              fontWeight: 700
                            }}
                          >
                            {formatearMonto(
                              Number(
                                abono.monto ||
                                  0
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </MainLayout>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "13px 10px",
  borderBottom: "2px solid #eeeeee",
  color: "#777",
  fontSize: "13px",
  fontWeight: 700
};

const tdStyle: React.CSSProperties = {
  padding: "14px 10px",
  borderBottom: "1px solid #eeeeee",
  color: "#444",
  fontSize: "14px"
};

export default Caja;
