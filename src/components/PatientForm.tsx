function PatientForm() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px"
      }}
    >
      <div>
        <label>Nombre completo</label>

        <input
          type="text"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            marginTop: "8px"
          }}
        />
      </div>

      <div>
        <label>RUT</label>

        <input
          type="text"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            marginTop: "8px"
          }}
        />
      </div>

      <div>
        <label>Teléfono</label>

        <input
          type="text"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            marginTop: "8px"
          }}
        />
      </div>

      <div>
        <label>Email</label>

        <input
          type="email"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            marginTop: "8px"
          }}
        />
      </div>

      <div>
        <label>Ciudad</label>

        <input
          type="text"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            marginTop: "8px"
          }}
        />
      </div>

      <div>
        <label>Dirección</label>

        <input
          type="text"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            marginTop: "8px"
          }}
        />
      </div>

      <div
        style={{
          gridColumn: "1 / span 2"
        }}
      >
        <label>Observaciones</label>

        <textarea
          rows={4}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            marginTop: "8px"
          }}
        />
      </div>

      <div
        style={{
          gridColumn: "1 / span 2",
          display: "flex",
          justifyContent: "flex-end",
          gap: "15px"
        }}
      >
        <button
          style={{
            padding: "12px 25px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer"
          }}
        >
          Cancelar
        </button>

        <button
          style={{
            padding: "12px 25px",
            borderRadius: "12px",
            border: "none",
            background: "#cc001f",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Guardar Paciente
        </button>
      </div>
    </div>
  );
}

export default PatientForm;
