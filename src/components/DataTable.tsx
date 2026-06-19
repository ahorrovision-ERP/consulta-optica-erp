interface DataTableProps {
  columns: string[];
  data: any[][];
  onEditar?: (paciente: any) => void;
  onEliminar?: (paciente: any) => void;
}

function DataTable({
  columns,
  data,
  onEditar,
  onEliminar
}: DataTableProps) {

  return (
    <div
      style={{
        background: "white",
        borderRadius: "25px",
        padding: "30px",
        boxShadow: "0 5px 20px rgba(0,0,0,.1)",
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

            {columns.map((column, index) => (

              <th
                key={index}
                style={{
                  textAlign: "left",
                  padding: "15px",
                  borderBottom: "1px solid #ddd",
                  fontWeight: "bold"
                }}
              >
                {column}
              </th>

            ))}

          </tr>

        </thead>


        <tbody>

          {data.map((row, rowIndex) => (

            <tr key={rowIndex}>

              {row.map((cell, cellIndex) => {

                if (
                  cellIndex === row.length - 1 &&
                  typeof cell === "object"
                ) {

                  return (

                    <td
                      key={cellIndex}
                      style={{
                        padding: "15px",
                        borderBottom: "1px solid #eee"
                      }}
                    >

                      <button
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: "20px"
                        }}
                      >
                        📄
                      </button>


                      <button
                        onClick={() => onEditar?.(cell)}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: "20px"
                        }}
                      >
                        ✏️
                      </button>


                      <button
                        onClick={() => onEliminar?.(cell)}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: "20px"
                        }}
                      >
                        🗑️
                      </button>

                    </td>

                  );

                }


                return (

                  <td
                    key={cellIndex}
                    style={{
                      padding: "15px",
                      borderBottom: "1px solid #eee"
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

export default DataTable;
