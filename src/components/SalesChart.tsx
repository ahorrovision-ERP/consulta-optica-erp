function SalesChart() {
  const ventas = [
    { mes: "ENE", valor: 40 },
    { mes: "FEB", valor: 60 },
    { mes: "MAR", valor: 50 },
    { mes: "ABR", valor: 80 },
    { mes: "MAY", valor: 70 },
    { mes: "JUN", valor: 95 },
    { mes: "JUL", valor: 55 }
  ];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
        marginTop: "30px"
      }}
    >
      <h2
        style={{
          marginBottom: "30px"
        }}
      >
        Monthly Sales Performance
      </h2>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-around",
          height: "300px"
        }}
      >
        {ventas.map((item) => (
          <div
            key={item.mes}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
          >
            <div
              style={{
                width: "40px",
                height: `${item.valor * 2}px`,
                background: "var(--primary-color)",
                borderRadius: "10px 10px 0 0",
                opacity: 0.8
              }}
            />

            <span
              style={{
                marginTop: "10px",
                color: "#666",
                fontWeight: 600
              }}
            >
              {item.mes}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SalesChart;
