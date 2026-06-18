function PatientForm() {
  return (
    <form>

      {/* FILA 1 */}
      <div className="form-row">

        <div className="form-group">
          <label>Nombre completo</label>
          <input type="text" />
        </div>

        <div className="form-group">
          <label>RUT</label>
          <input type="text" />
        </div>

      </div>


      {/* FILA 2 */}
      <div className="form-row">

        <div className="form-group">
          <label>Teléfono</label>
          <input type="text" />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" />
        </div>

      </div>


      {/* FILA 3 */}
      <div className="form-row">

        <div className="form-group">
          <label>Ciudad</label>
          <input type="text" />
        </div>

        <div className="form-group">
          <label>Dirección</label>
          <input type="text" />
        </div>

      </div>


      {/* OBSERVACIONES */}

      <div className="form-group">
        <label>Observaciones</label>

        <textarea rows={5}></textarea>
      </div>


      {/* BOTONES */}

      <div className="form-buttons">

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

export default PatientForm;
