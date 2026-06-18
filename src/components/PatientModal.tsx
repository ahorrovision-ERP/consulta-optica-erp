interface PatientModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

function PatientModal({
  isOpen,
  title,
  children,
  onClose
}: PatientModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
      }}
    >
      <div
        style={{
          width: "800px",
          maxWidth: "95%",
          background: "white",
          borderRadius: "20px",
          padding: "30px",
          boxShadow: "0 10px 40px rgba(0,0,0,.2)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px"
          }}
        >
          <h2>{title}</h2>

          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "28px",
              cursor: "pointer"
            }}
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default PatientModal;
