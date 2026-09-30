import { useMemo, useState, type CSSProperties } from "react";

interface DataTableProps {
  columns: string[];
  data: any[][];
  onEditar?: (registro: any) => void;
  onEliminar?: (registro: any) => void;
}

const PAGE_SIZES = [25, 50, 100];

function DataTable({
  columns,
  data,
  onEditar,
  onEliminar
}: DataTableProps) {
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(50);

  const totalPaginas = Math.max(
    1,
    Math.ceil(data.length / porPagina)
  );

  const paginaActual = Math.min(
    pagina,
    totalPaginas
  );

  const inicio =
    (paginaActual - 1) * porPagina;

  const fin = inicio + porPagina;

  const filasVisibles = useMemo(
    () => data.slice(inicio, fin),
    [data, inicio, fin]
  );

  function cambiarPagina(nuevaPagina: number) {
    const segura = Math.max(
      1,
      Math.min(nuevaPagina, totalPaginas)
    );

    setPagina(segura);
  }

  function cambiarPorPagina(valor: number) {
    setPorPagina(valor);
    setPagina(1);
  }

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        boxShadow: "0 7px 24px rgba(0,0,0,.07)",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          padding: "18px 20px",
          borderBottom: "1px solid #eeeeee",
          flexWrap: "wrap"
        }}
      >
        <div
          style={{
            color: "#666",
            fontSize: "13px"
          }}
        >
          Mostrando{" "}
          <strong>
            {data.length === 0 ? 0 : inicio + 1}
          </strong>{" "}-{" "}
          <strong>
            {Math.min(fin, data.length)}
          </strong>{" "}de{" "}
          <strong>
            {data.length.toLocaleString("es-CL")}
          </strong>{" "}registros
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span
            style={{
              color: "#777",
              fontSize: "12px"
            }}
          >
            Por página
          </span>

          <select
            value={porPagina}
            onChange={(event) =>
              cambiarPorPagina(
                Number(event.target.value)
              )
            }
            style={{
              border: "1px solid #dddddd",
              borderRadius: "8px",
              padding: "7px 9px",
              background: "#ffffff"
            }}
          >
            {PAGE_SIZES.map((cantidad) => (
              <option
                key={cantidad}
                value={cantidad}
              >
                {cantidad}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          maxHeight: "560px",
          overflowX: "auto",
          overflowY: "auto"
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: "760px",
            borderCollapse: "collapse"
          }}
        >
          <thead>
            <tr>
              {columns.map((columna) => (
                <th
                  key={columna}
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    background: "#555555",
                    color: "#ffffff",
                    padding: "13px 12px",
                    textAlign: "left",
                    fontSize: "12px",
                    whiteSpace: "nowrap"
                  }}
                >
                  {columna}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filasVisibles.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: "45px 20px",
                    textAlign: "center",
                    color: "#888"
                  }}
                >
                  No hay registros para mostrar.
                </td>
              </tr>
            ) : (
              filasVisibles.map(
                (fila, indiceFila) => {
                  const registro =
                    fila[fila.length - 1];

                  return (
                    <tr
                      key={`${String(
                        registro?.id ?? "fila"
                      )}-${inicio + indiceFila}`}
                      style={{
                        background:
                          indiceFila % 2 === 0
                            ? "#ffffff"
                            : "#fafafa"
                      }}
                    >
                      {columns.map(
                        (columna, indiceColumna) => {
                          const esAcciones =
                            columna
                              .toLowerCase()
                              .includes("accion");

                          if (esAcciones) {
                            return (
                              <td
                                key={columna}
                                style={{
                                  padding: "11px 12px",
                                  borderBottom:
                                    "1px solid #eeeeee",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "7px"
                                  }}
                                >
                                  {onEditar && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onEditar(
                                          registro
                                        )
                                      }
                                      style={{
                                        border: "none",
                                        borderRadius: "8px",
                                        padding: "7px 9px",
                                        background: "#eeeeee",
                                        color: "#333333",
                                        cursor: "pointer",
                                        fontWeight: 700
                                      }}
                                    >
                                      Editar
                                    </button>
                                  )}

                                  {onEliminar && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onEliminar(
                                          registro
                                        )
                                      }
                                      style={{
                                        border: "none",
                                        borderRadius: "8px",
                                        padding: "7px 9px",
                                        background: "#fff0f1",
                                        color: "#b00020",
                                        cursor: "pointer",
                                        fontWeight: 700
                                      }}
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={columna}
                              style={{
                                padding: "11px 12px",
                                borderBottom:
                                  "1px solid #eeeeee",
                                color: "#555",
                                fontSize: "13px",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {fila[indiceColumna]}
                            </td>
                          );
                        }
                      )}
                    </tr>
                  );
                }
              )
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          padding: "15px 20px",
          borderTop: "1px solid #eeeeee",
          flexWrap: "wrap"
        }}
      >
        <button
          type="button"
          onClick={() =>
            cambiarPagina(
              paginaActual - 1
            )
          }
          disabled={paginaActual <= 1}
          style={botonPaginacion(
            paginaActual <= 1
          )}
        >
          ← Anterior
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
            justifyContent: "center"
          }}
        >
          {crearNumerosPagina(
            paginaActual,
            totalPaginas
          ).map((paginaNumero, indice) =>
            paginaNumero === "..." ? (
              <span
                key={`puntos-${indice}`}
                style={{
                  padding: "7px 4px",
                  color: "#888"
                }}
              >
                ...
              </span>
            ) : (
              <button
                key={paginaNumero}
                type="button"
                onClick={() =>
                  cambiarPagina(
                    Number(paginaNumero)
                  )
                }
                style={{
                  border: "1px solid #dddddd",
                  borderRadius: "8px",
                  minWidth: "34px",
                  padding: "7px 8px",
                  background:
                    paginaActual ===
                    Number(paginaNumero)
                      ? "#cc001f"
                      : "#ffffff",
                  color:
                    paginaActual ===
                    Number(paginaNumero)
                      ? "#ffffff"
                      : "#444",
                  cursor: "pointer",
                  fontWeight: 700
                }}
              >
                {paginaNumero}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            cambiarPagina(
              paginaActual + 1
            )
          }
          disabled={paginaActual >= totalPaginas}
          style={botonPaginacion(
            paginaActual >= totalPaginas
          )}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

function crearNumerosPagina(
  paginaActual: number,
  totalPaginas: number
): Array<number | "..."> {
  if (totalPaginas <= 7) {
    return Array.from(
      { length: totalPaginas },
      (_, indice) => indice + 1
    );
  }

  const paginas: Array<
    number | "..."
  > = [1];

  if (paginaActual > 4) {
    paginas.push("...");
  }

  const inicio = Math.max(
    2,
    paginaActual - 1
  );

  const fin = Math.min(
    totalPaginas - 1,
    paginaActual + 1
  );

  for (let i = inicio; i <= fin; i += 1) {
    if (!paginas.includes(i)) {
      paginas.push(i);
    }
  }

  if (paginaActual < totalPaginas - 3) {
    paginas.push("...");
  }

  paginas.push(totalPaginas);

  return paginas;
}

function botonPaginacion(
  deshabilitado: boolean
): CSSProperties {
  return {
    border: "1px solid #dddddd",
    borderRadius: "9px",
    padding: "8px 12px",
    background: "#ffffff",
    color: "#444",
    fontWeight: 700,
    cursor: deshabilitado
      ? "not-allowed"
      : "pointer",
    opacity: deshabilitado ? 0.45 : 1
  };
}

export default DataTable;
