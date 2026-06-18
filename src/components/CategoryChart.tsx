function CategoryChart() {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 5px 20px rgba(0,0,0,.08)"
      }}
    >
      <h2>Top Categories</h2>

      <div
        style={{
          width: "180px",
          height: "180px",
          borderRadius: "50%",
          border: "18px solid var(--primary-color)",
          margin: "30px auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "36px",
          fontWeight: "bold"
        }}
      >
        64%
      </div>

      <div style={{ lineHeight: "35px" }}>
        <div>🔴 Designer Frames - 42%</div>
        <div>⚫ Progressive Lenses - 28%</div>
        <div>⚪ Contact Lenses - 15%</div>
      </div>
    </div>
  );
}

export default CategoryChart;
