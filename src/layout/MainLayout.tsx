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
        height: "100vh",
        minHeight: 0,
        width: "100%",
        overflow: "hidden",
        background: "#f5f7fb",
        alignItems: "flex-start"
      }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido Principal */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          height: "100vh",
          padding: "35px",
          overflowY: "auto",
          overflowX: "hidden",
          boxSizing: "border-box"
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
