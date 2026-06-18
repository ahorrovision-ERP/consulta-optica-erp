interface StatusBadgeProps {
  estado: string;
}

function StatusBadge({ estado }: StatusBadgeProps) {
  let color = "#16a34a";

  if (estado === "Pendiente") color = "#f59e0b";

  if (estado === "Cancelada") color = "#dc2626";

  return (
    <span
      style={{
        background: color,
        color: "white",
        padding: "6px 14px",
        borderRadius: "20px",
        fontSize: "14px"
      }}
    >
      {estado}
    </span>
  );
}

export default StatusBadge;
