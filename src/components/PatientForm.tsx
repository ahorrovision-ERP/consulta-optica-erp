function PatientForm() {
  return (
    <form>

      {/* Primera fila */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "25px",
          marginBottom: "25px"
        }}
      >
        <div>
          <label>Nombre completo</label>

          <input
            type="text"
            style={styles.input}
          />
        </div>

        <div>
          <label>RUT</label>

          <input
            type="text"
            style={styles.input}
          />
        </div>
      </div>

      {/* Segunda fila */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "25px",
          marginBottom: "25px"
        }}
      >
        <div>
          <label>Teléfono</label>

          <input
            type="text"
            style={styles.input}
          />
        </div>

        <div>
          <label>Email</label>

          <input
            type="email"
            style={styles.input}
          />
        </div>
      </div>

      {/* Tercera fila */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "25px",
          marginBottom: "25px"
        }}
      >
        <div>
          <label>Ciudad</label>

          <input
            type="text"
            style={styles.input}
          />
        </div>

        <div>
          <label>Dirección</label>

          <input
            type="text"
            style={styles.input}
          />
        </div>
      </div>

      {/* Observaciones */}
      <div
        style={{
          marginBottom: "35px"
        }}
      >
        <label>Observaciones</label>

        <textarea
          rows={5}
          style={styles.textarea}
        />
      </div>

      {/* Botones */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "15px"
        }}
      >
        <button
          type="button"
          className="btn-secondary"
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="btn-primary"
        >
          Guardar Paciente
        </button>
      </div>

    </form>
  );
}

const styles = {

  input: {
    width: "100%",
    padding: "14px 16px",
    marginTop: "8px",
    border: "1px solid #ddd",
    borderRadius: "12px",
    outline: "none",
    fontSize: "15px"
  },

  textarea: {
    width: "100%",
    padding: "15px",
    marginTop: "8px",
    border: "1px solid #ddd",
    borderRadius: "12px",
    resize: "vertical" as const,
    outline: "none",
    fontSize: "15px"
  }

};

export default PatientForm;
