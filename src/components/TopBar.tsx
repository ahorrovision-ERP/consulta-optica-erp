function TopBar() {
  return (
    <header
      style={{
        height: "80px",
        background: "#ffffff",
        borderRadius: "20px",
        padding: "0 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 10px rgba(0,0,0,.05)",
        marginBottom: "30px"
      }}
    >
      {/* Buscador */}
      <div>
        <input
          type="text"
          placeholder="Buscar pacientes, órdenes, productos..."
          style={{
            width: "450px",
            padding: "14px 20px",
            borderRadius: "15px",
            border: "1px solid #ddd",
            background: "#f7f7f7",
            fontSize: "15px"
          }}
        />
      </div>

      {/* Usuario */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px"
        }}
      >
        <div style={{ fontSize: 24 }}>
          🔔
        </div>

        <div style={{ fontSize: 24 }}>
          🕒
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px"
          }}
        >
          <img
            src="/doctor.png"
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%"
            }}
          />

          <div>
            <div
              style={{
                fontWeight: 700
              }}
            >
              Administrador
            </div>

            <div
              style={{
                color: "#777",
                fontSize: 14
              }}
            >
              Óptica Ahorro Visión
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
