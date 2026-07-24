import { ChangeEvent } from "react";

interface SearchBarProps {
  value: string;
  onChange: (texto: string) => void;
  placeholder?: string;
}

function SearchBar({
  value,
  onChange,
  placeholder = "Buscar..."
}: SearchBarProps) {
  function handleChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    onChange(e.target.value);
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%"
      }}
    >
      {/* Icono */}
      <span
        style={{
          position: "absolute",
          left: "15px",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "18px",
          color: "#888",
          pointerEvents: "none"
        }}
      >
        🔍
      </span>

      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: "100%",
          padding: "14px 18px 14px 45px",
          borderRadius: "14px",
          border: "1px solid #d8d8d8",
          outline: "none",
          fontSize: "15px",
          background: "#fff",
          color: "#333",
          transition: "all .25s ease",
          boxSizing: "border-box"
        }}
      />
    </div>
  );
}

export default SearchBar;
