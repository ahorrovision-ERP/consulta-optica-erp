import Sidebar from "../components/Sidebar";

type Props = {
  children: React.ReactNode;
};

function MainLayout({ children }: Props) {
  return (
    <div className="container">
      <img
  src="/logo.png"
  style={{
    width: "180px",
    display: "block",
    margin: "20px auto"
  }}
/>

      <Sidebar />

      <main className="contenido">
        {children}
      </main>

    </div>
  );
}

export default MainLayout;
