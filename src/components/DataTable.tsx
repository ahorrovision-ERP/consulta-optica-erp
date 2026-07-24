import React from "react";

interface DataTableProps {
  columns: string[];
  data: unknown[][];
  onEditar?: (registro: any) => void;
  onEliminar?: (registro: any) => void;
  onReceta?: (registro: any) => void;
}

const iconButton: React.CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: "20px",
  padding: "8px",
  borderRadius: "8px",
  transition: "all .2s ease"
};

function DataTable({
  columns,
  data,
  onEditar,
  onEliminar,
  onReceta
}: DataTableProps) {

  return (

    <div
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        padding: "25px",
        boxShadow: "0 8px 25px rgba(0,0,0,.08)",
        overflowX: "auto",
        width: "100%",
        boxSizing: "border-box"
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

            {columns.map((column) => (

              <th
                key={column}
                style={{
                  textAlign:
                    column === "Acciones"
                      ? "center"
                      : "left",
                  padding: "16px",
                  borderBottom: "2px solid #ececec",
                  color: "#555",
                  fontWeight: 700,
                  fontSize: "15px",
                  whiteSpace: "nowrap"
                }}
              >
                {column}
              </th>

            ))}

          </tr>

        </thead>

        <tbody>

          {data.length === 0 && (

            <tr>

              <td
                colSpan={columns.length}
                style={{
                  padding: "35px",
                  textAlign: "center",
                  color: "#999",
                  fontStyle: "italic"
                }}
              >
                No hay registros para mostrar.
              </td>

            </tr>

          )}

          {data.map((row, rowIndex) => (

            <tr
              key={rowIndex}
              style={{
                transition: ".2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fafafa";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >

              {row.map((cell, cellIndex) => {

                if (
                  cellIndex === row.length - 1 &&
                  typeof cell === "object" &&
                  cell !== null
                ) {

                  return (

                    <td
                      key={cellIndex}
                      style={{
                        padding: "14px",
                        borderBottom: "1px solid #eee",
                        textAlign: "center"
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "10px"
                        }}
                      >

                        <button
                          type="button"
                          aria-label="Historia Clínica"
                          title="Historia Clínica / Recetas"
                          onClick={() => onReceta?.(cell)}
                          style={iconButton}
                        >
                          📄
                        </button>

                        <button
                          type="button"
                          aria-label="Editar"
                          title="Editar paciente"
                          onClick={() => onEditar?.(cell)}
                          style={iconButton}
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          aria-label="Eliminar"
                          title="Eliminar paciente"
                          onClick={() => onEliminar?.(cell)}
                          style={iconButton}
                        >
                          🗑️
                        </button>

                      </div>

                    </td>

                  );

                }

                return (

                  <td
                    key={cellIndex}
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid #eee",
                      color: "#444",
                      fontSize: "15px"
                    }}
                  >
                    {String(cell)}
                  </td>

                );

              })}

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}

export default DataTable;
