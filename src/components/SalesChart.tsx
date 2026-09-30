import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

interface Venta {
  fecha: string | null;
  total: number | null;
  estado: string | null;
}

interface VentaMensual {
  mes: string;
  valor: number;
}

function SalesChart() {
  const [ventas, setVentas] = useState<VentaMensual[]>([]);
  const [cargando, setCargando] = useState(true);

  const anioActual = new Date().getFullYear();

  useEffect(() => {
    cargarVentas();
  }, []);

  async function cargarVentas() {
    setCargando(true);

    try {
      const inicioAnio = `${anioActual}-01-01T00:00:00`;

      const inicioProximoAnio =
        `${anioActual + 1}-01-01T00:00:00`;

      const { data, error } = await supabase
        .from("ventas")
        .select("fecha, total, estado")
        .gte("fecha", inicioAnio)
        .lt("fecha", inicioProximoAnio)
        .order("fecha", { ascending: true });

      if (error) {
        console.error(
          "Error cargando ventas del gráfico:",
          error
        );

        setVentas([]);
        return;
      }

      const ventasReales = (data || []) as Venta[];

      const ahora = new Date();
      const mesActual = ahora.getMonth();

      const meses: VentaMensual[] = [];

      const nombresMeses = [
        "ENE",
        "FEB",
        "MAR",
        "ABR",
        "MAY",
        "JUN",
        "JUL",
        "AGO",
        "SEP",
        "OCT",
        "NOV",
        "DIC"
      ];

      for (let mes = 0; mes <= mesActual; mes++) {
        const ventasDelMes = ventasReales.filter(
          (venta) => {
            if (!venta.fecha) {
              return false;
            }

            const fechaVenta = new Date(
              venta.fecha
            );

            return (
              fechaVenta.getFullYear() === anioActual &&
              fechaVenta.getMonth() === mes &&
              venta.estado !== "Anulada"
            );
          }
        );

        const totalMes = ventasDelMes.reduce(
          (total, venta) =>
            total + Number(venta.total || 0),
          0
        );

        meses.push({
          mes: nombresMeses[mes],
          valor: totalMes
        });
      }

      setVentas(meses);
    } catch (error) {
      console.error(
        "Error cargando SalesChart:",
        error
      );

      setVentas([]);
    } finally {
      setCargando(false);
    }
  }

  const maximo = useMemo(() => {
    const valores = ventas.map(
      (item) => item.valor
    );

    return Math.max(...valores, 1);
  }, [ventas]);

  function formatearMoneda(valor: number) {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0
    }).format(valor || 0);
  }

  function alturaBarra(valor: number) {
    if (valor === 0) {
      return 4;
    }

    const altura =
      (valor / maximo) * 230;

    return Math.max(8, altura);
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "30px",
        boxShadow:
          "0 5px 20px rgba(0,0,0,0.08)",
        marginTop: "30px"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          gap: "20px"
        }}
      >
        <div>
          <h2
            style={{
              margin: 0
            }}
          >
            Monthly Sales Performance
          </h2>

          <p
            style={{
              marginTop: "6px",
              marginBottom: 0,
              color: "#888",
              fontSize: "14px"
            }}
          >
            Ventas reales del año {anioActual}
          </p>
        </div>

        {!cargando && (
          <div
            style={{
              fontSize: "14px",
              color: "#777"
            }}
          >
            Excluye ventas anuladas
          </div>
        )}
      </div>

      {cargando ? (
        <div
          style={{
            height: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#888",
            fontSize: "15px"
          }}
        >
          Cargando ventas...
        </div>
      ) : ventas.length === 0 ? (
        <div
          style={{
            height: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#888",
            background: "#fafafa",
            borderRadius: "12px"
          }}
        >
          No hay ventas registradas para este año.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-around",
            height: "340px",
            gap: "10px",
            overflowX: "auto",
            paddingTop: "10px"
          }}
        >
          {ventas.map((item) => {
            const altura = alturaBarra(
              item.valor
            );

            return (
              <div
                key={item.mes}
                style={{
                  flex: 1,
                  minWidth: "55px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  alignItems: "center"
                }}
              >
                <div
                  style={{
                    height: "32px",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    marginBottom: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#555",
                    whiteSpace: "nowrap"
                  }}
                >
                  {item.valor > 0
                    ? formatearMoneda(
                        item.valor
                      )
                    : ""}
                </div>

                <div
                  title={`${item.mes}: ${formatearMoneda(
                    item.valor
                  )}`}
                  style={{
                    width: "40px",
                    height: `${altura}px`,
                    background:
                      "var(--primary-color)",
                    borderRadius:
                      "10px 10px 0 0",
                    opacity:
                      item.valor > 0
                        ? 0.8
                        : 0.25,
                    transition:
                      "height 0.3s ease",
                    minHeight: "4px"
                  }}
                />

                <span
                  style={{
                    marginTop: "10px",
                    color: "#666",
                    fontWeight: 600,
                    fontSize: "13px"
                  }}
                >
                  {item.mes}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!cargando && ventas.length > 0 && (
        <div
          style={{
            marginTop: "20px",
            paddingTop: "15px",
            borderTop:
              "1px solid #eeeeee",
            display: "flex",
            justifyContent:
              "flex-end",
            color: "#777",
            fontSize: "13px"
          }}
        >
          Total acumulado:{" "}
          <strong
            style={{
              marginLeft: "5px",
              color: "#222"
            }}
          >
            {formatearMoneda(
              ventas.reduce(
                (total, item) =>
                  total + item.valor,
                0
              )
            )}
          </strong>
        </div>
      )}
    </div>
  );
}

export default SalesChart;
