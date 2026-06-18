function ActionButtons() {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px"
      }}
    >
      <button
        style={{
          background: "#2563eb",
          color: "white",
          border: "none",
          padding: "8px 14px",
          borderRadius: "10px",
          cursor: "pointer"
        }}
      >
        Editar
      </button>

      <button
        style={{
          background: "#dc2626",
          color: "white",
          border: "none",
          padding: "8px 14px",
          borderRadius: "10px",
          cursor: "pointer"
        }}
      >
        Eliminar
      </button>
    </div>
  );
}

export default ActionButtons;
