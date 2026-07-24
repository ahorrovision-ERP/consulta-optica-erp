import { useEffect } from "react";

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

  useEffect(() => {

    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {

      if (e.key === "Escape") {
        onClose();
      }

    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {

      document.body.style.overflow = "auto";

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (

    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        animation: "fadeIn .2s ease"
      }}
    >

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "850px",
          maxWidth: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "22px",
          padding: "30px",
          boxShadow: "0 20px 60px rgba(0,0,0,.25)",
          animation: "scaleIn .2s ease"
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
            paddingBottom: "15px",
            borderBottom: "1px solid #ececec"
          }}
        >

          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              color: "#333"
            }}
          >
            {title}
          </h2>

          <button
            onClick={onClose}
            title="Cerrar"
            style={{
              width: "40px",
              height: "40px",
              border: "none",
              borderRadius: "50%",
              background: "#f5f5f5",
              cursor: "pointer",
              fontSize: "24px",
              color: "#666",
              transition: ".2s"
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
