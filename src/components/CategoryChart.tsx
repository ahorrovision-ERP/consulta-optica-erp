import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

interface Categoria {
  id: number;
  [key: string]: unknown;
}

interface Venta {
  id: number;
  estado: string | null;
}

interface DetalleVenta {
  venta_id: number;
  producto_id: number | null;
  subtotal: number | null;
}

interface Producto {
  id: number;
  categoria_id: number | null;
}

interface CategoriaVenta {
  nombre: string;
  valor: number;
}

const COLORES = [
  "var(--primary-color)",
  "#555555",
  "#999999",
  "#cccccc",
  "#e5e5e5"
];

function numero(valor: number | null | undefined): number {
  const resultado = Number(valor || 0);
  return Number.isFinite(resultado) ? resultado : 0;
}

function moneda(valor: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(valor || 0);
}

function textoCategoria(categoria: Categoria | undefined): string {
  if (!categoria) {
    return "Sin categoría";
  }

  const posibles = [
    "nombre",
    "descripcion",
    "name",
    "titulo"
  ];

  for (const campo of posibles) {
    const valor = categoria[campo];

    if (
      typeof valor === "string" &&
      valor.trim()
    ) {
      return valor.trim();
    }
  }

  return `Categoría ${categoria.id}`;
}

function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function CategoryChart() {
  const [categoriasVentas, setCategoriasVentas] =
    useState<CategoriaVenta[]>([]);

  const [cargando, setCargando] = useState(true);

  const anioActual = new Date().getFullYear();

  useEffect(() => {
    cargarCategorias();
  }, []);

  async function cargarCategorias() {
    setCargando(true);

    try {
      const inicioAnio = `${anioActual}-01-01T00:00:00`;
      const inicioProximoAnio =
        `${anioActual + 1}-01-01T00:00:00`;

      const [
        ventasResult,
        detallesResult,
        productosResult,
        categoriasResult
      ] = await Promise.all([
        supabase
          .from("ventas")
          .select("id, estado")
          .gte("fecha", inicioAnio)
          .lt("fecha", inicioProximoAnio),

        supabase
          .from("detalle_ventas")
          .select("venta_id, producto_id, subtotal"),

        supabase
          .from("productos")
          .select("id, categoria_id"),

        supabase
          .from("categorias")
          .select("*")
      ]);

      if (ventasResult.error) {
        throw ventasResult.error;
      }

      if (detallesResult.error) {
        throw detallesResult.error;
      }

      if (productosResult.error) {
        throw productosResult.error;
      }

      if (categoriasResult.error) {
        throw categoriasResult.error;
      }

      const ventasValidas = (
        (ventasResult.data || []) as Venta[]
      ).filter(
        (venta) => venta.estado !== "Anulada"
      );

      const idsVentasValidas = new Set(
        ventasValidas.map((venta) => venta.id)
      );

      const detalles =
        (detallesResult.data || []) as DetalleVenta[];

      const productos =
        (productosResult.data || []) as Producto[];

      const categorias =
        (categoriasResult.data || []) as Categoria[];

      const categoriaPorProducto = new Map<
        number,
        number | null
      >();

      productos.forEach((producto) => {
        categoriaPorProducto.set(
          producto.id,
          producto.categoria_id
        );
      });

      const categoriaPorId = new Map<
        number,
        Categoria
      >();

      categorias.forEach((categoria) => {
        categoriaPorId.set(
          categoria.id,
          categoria
        );
      });

      const acumulado = new Map<
        string,
        number
      >();

      detalles.forEach((detalle) => {
        if (!idsVentasValidas.has(detalle.venta_id)) {
          return;
        }

        const categoriaId =
          detalle.producto_id !== null
            ? categoriaPorProducto.get(
                detalle.producto_id
              )
            : null;

        const nombre = textoCategoria(
          categoriaId !== null &&
          categoriaId !== undefined
            ? categoriaPorId.get(categoriaId)
            : undefined
        );

        const clave = normalizarTexto(nombre);
        const actual = acumulado.get(clave) || 0;

        acumulado.set(
          clave,
          actual + numero(detalle.subtotal)
        );
      });

      const resultado: CategoriaVenta[] = [];

      acumulado.forEach((valor, clave) => {
        const nombreOriginal = Array.from(
          acumulado.keys()
        ).find((item) => item === clave);

        const nombre = categorias.find(
          (categoria) =>
            normalizarTexto(
              textoCategoria(categoria)
            ) === clave
        );

        resultado.push({
          nombre: nombre
            ? textoCategoria(nombre)
            : clave === "sin categoria"
              ? "Sin categoría"
              : nombreOriginal || "Sin categoría",
          valor
        });
      });

      resultado.sort(
        (a, b) => b.valor - a.valor
      );

      setCategoriasVentas(resultado.slice(0, 5));
    } catch (error) {
      console.error(
        "Error cargando categorías del Dashboard:",
        error
      );

      setCategoriasVentas([]);
    } finally {
      setCargando(false);
    }
  }

  const total = useMemo(() => {
    return categoriasVentas.reduce(
      (suma, categoria) =>
        suma + categoria.valor,
      0
    );
  }, [categoriasVentas]);

  const principal =
    categoriasVentas[0] || null;

  const porcentajePrincipal =
    total > 0 && principal
      ? Math.round(
          (principal.valor / total) * 100
        )
      : 0;

  const gradiente = useMemo(() => {
    if (total <= 0) {
      return "#eeeeee";
    }

    let inicio = 0;

    const segmentos = categoriasVentas.map(
      (categoria, indice) => {
        const porcentaje =
          (categoria.valor / total) * 100;

        const fin = inicio + porcentaje;

        const segmento = `${COLORES[indice % COLORES.length]} ${inicio}% ${fin}%`;

        inicio = fin;

        return segmento;
      }
    );

    return `conic-gradient(${segmentos.join(", ")})`;
  }, [categoriasVentas, total]);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "30px",
        boxShadow:
          "0 5px 20px rgba(0,0,0,.08)"
      }}
    >
      <h2
        style={{
          margin: 0
        }}
      >
        Top Categories
      </h2>

      <p
        style={{
          marginTop: "6px",
          color: "#888",
          fontSize: "13px"
        }}
      >
        Ventas por categoría · {anioActual}
      </p>

      {cargando ? (
        <div
          style={{
            height: "240px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#888"
          }}
        >
          Cargando categorías...
        </div>
      ) : categoriasVentas.length === 0 ? (
        <div
          style={{
            height: "240px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "#888",
            background: "#fafafa",
            borderRadius: "12px",
            marginTop: "25px"
          }}
        >
          Todavía no hay ventas con productos categorizados.
        </div>
      ) : (
        <>
          <div
            style={{
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: gradiente,
              margin: "30px auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <div
              style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center"
              }}
            >
              <span
                style={{
                  fontSize: "30px",
                  fontWeight: "bold",
                  color: "#222"
                }}
              >
                {porcentajePrincipal}%
              </span>

              <span
                style={{
                  marginTop: "3px",
                  color: "#777",
                  fontSize: "11px"
                }}
              >
                principal
              </span>
            </div>
          </div>

          <div
            style={{
              lineHeight: "1.5"
            }}
          >
            {categoriasVentas.map(
              (categoria, indice) => {
                const porcentaje =
                  total > 0
                    ? Math.round(
                        (categoria.valor /
                          total) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={categoria.nombre}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "11px",
                      fontSize: "13px",
                      color: "#555"
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background:
                          COLORES[
                            indice %
                              COLORES.length
                          ],
                        flexShrink: 0
                      }}
                    />

                    <span
                      style={{
                        flex: 1
                      }}
                    >
                      {categoria.nombre}
                    </span>

                    <strong
                      style={{
                        color: "#222"
                      }}
                    >
                      {porcentaje}%
                    </strong>
                  </div>
                );
              }
            )}
          </div>

          <div
            style={{
              marginTop: "18px",
              paddingTop: "15px",
              borderTop:
                "1px solid #eeeeee",
              textAlign: "right",
              color: "#777",
              fontSize: "12px"
            }}
          >
            Total ventas categorizadas: {" "}
            <strong
              style={{
                color: "#222"
              }}
            >
              {moneda(total)}
            </strong>
          </div>
        </>
      )}
    </div>
  );
}

export default CategoryChart;
