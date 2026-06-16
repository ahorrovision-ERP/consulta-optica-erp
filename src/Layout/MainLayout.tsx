import Sidebar from "../components/Sidebar";

type Props = {
  children: React.ReactNode;
};

function MainLayout({ children }: Props) {
  return (
    <div className="container">

      <Sidebar />

      <main className="contenido">
        {children}
      </main>

    </div>
  );
}

export default MainLayout;
