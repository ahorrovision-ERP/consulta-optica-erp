function SearchBar() {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "25px",
        padding: "25px",
        boxShadow: "0 5px 20px rgba(0,0,0,.1)"
      }}
    >
      <input
        type="text"
        placeholder="Buscar paciente por nombre, teléfono o ID..."
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "14px",
          border: "1px solid #ddd",
          fontSize: "16px",
          outline: "none",
          boxSizing: "border-box"
        }}
      />
    </div>
  );
}

export default SearchBar;
