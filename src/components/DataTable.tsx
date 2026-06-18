interface DataTableProps {
  columns: string[];
  data: string[][];
}

function DataTable({ columns, data }: DataTableProps) {
  return (
    <div className="card">
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
                  borderBottom: "1px solid #ddd"
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
