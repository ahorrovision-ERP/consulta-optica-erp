interface DataTableProps {
  columns: string[];
  data: any[][];
  onEditar?: (paciente: any) => void;
  onEliminar?: (paciente: any) => void;
  onReceta?: (paciente: any) => void;
}

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
        background: "#fff",
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
                  textAlign: "left",
                  padding: "16px",
                  borderBottom: "2px solid #ececec",
                  color: "#555",
                  fontWeight: 700,
                  fontSize: "15px"
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                transition: ".2s"
              }}
            >
              {row.map((cell, cellIndex) => {
                if (
                  cellIndex === row.length - 1 &&
                  typeof cell === "object"
                ) {
                  return (
                    <td
                      key={cellIndex}
                      style={{
                        padding: "14px",
                        borderBottom: "1px solid #eee"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "center"
                        }}
                      >
                        <button
                          title="Historia Clínica / Recetas"
                          onClick={() => onReceta?.(cell)}
                          style={iconButton}
                        >
                          📄
                        </button>

                        <button
                          title="Editar paciente"
                          onClick={() => onEditar?.(cell)}
                          style={iconButton}
                        >
                          ✏️
                        </button>

                        <button
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
                    {cell}
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

const iconButton: React.CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: "20px",
  transition: ".2s",
  padding: "6px"
};

export default DataTable;
