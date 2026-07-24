import React from "react";
import Sidebar from "../components/Sidebar";

interface Props {
  children: React.ReactNode;
}

function MainLayout({ children }: Props) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f5f7fb"
      }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido Principal */}
      <main
        style={{
          flex: 1,
          padding: "35px",
          overflowY: "auto",
          boxSizing: "border-box"
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
