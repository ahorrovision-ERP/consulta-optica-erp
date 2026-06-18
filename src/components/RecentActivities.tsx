function RecentActivities() {
  return (
    <div
      style={{
        background: "#fff",
        padding: "30px",
        borderRadius: "20px",
        boxShadow: "0 5px 20px rgba(0,0,0,.08)"
      }}
    >
      <h2>Recent Activities</h2>

      <div style={{ marginTop: "25px", lineHeight: "40px" }}>
        <div>✅ Venta completada - Ray Ban Aviator ($240)</div>

        <div>📝 Nueva receta agregada - Elena G.</div>

        <div>🚚 Orden retrasada - Zeiss #9921</div>

        <div>👤 Nuevo paciente registrado - Julian Moretti</div>
      </div>
    </div>
  );
}

export default RecentActivities;
