import MainLayout from "../layout/MainLayout";
import TopBar from "../components/TopBar";
import StatCard from "../components/StatCard";
import SalesChart from "../components/SalesChart";
import CategoryChart from "../components/CategoryChart";
import RecentActivities from "../components/RecentActivities";
import UpcomingAppointments from "../components/UpcomingAppointments";

function Dashboard() {
  return (
    <MainLayout>
      <TopBar />

      <h1>Dashboard Overview</h1>

      <div className="cards">
        <StatCard
          titulo="Total Pacientes"
          valor="1,284"
        />

        <StatCard
          titulo="Ventas Hoy"
          valor="$2,450"
        />

        <StatCard
          titulo="Órdenes Pendientes"
          valor="42"
        />

        <StatCard
          titulo="Ingresos Mensuales"
          valor="$54,200"
        />
      </div>

      <SalesChart />
      <div
  style={{
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "30px",
    marginTop: "30px"
  }}
>
  <RecentActivities />
  <CategoryChart />
</div>

<div
  style={{
    marginTop: "30px"
  }}
>
  <UpcomingAppointments />
</div>
    </MainLayout>
  );
}

export default Dashboard;
