function SearchBar() {
  return (

    <input
      type="text"
      placeholder="Buscar paciente por nombre, teléfono o ID..."
      style={{
        width: "100%",
        padding: "15px",
        borderRadius: "15px",
        border: "1px solid #ddd",
        outline: "none",
        fontSize: "15px"
      }}
    />

  );
}

export default SearchBar;
