function SearchBar() {
  return (
    <div className="card">
      <input
        type="text"
        placeholder="Buscar..."
        style={{
          width: "100%",
          padding: "15px",
          borderRadius: "12px",
          border: "1px solid #ddd",
          outline: "none"
        }}
      />
    </div>
  );
}

export default SearchBar;
