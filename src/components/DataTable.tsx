interface DataTableProps {
  columns: string[];
  data: string[][];
}

function DataTable({ columns, data }: DataTableProps) {
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
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{
                    padding: "15px",
                    borderBottom: "1px solid #eee"
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
