import { useEffect, useState } from "react";

import MainLayout from "../layout/MainLayout";
import TopBar from "../components/TopBar";
import StatCard from "../components/StatCard";
import SalesChart from "../components/SalesChart";
import CategoryChart from "../components/CategoryChart";
import RecentActivities from "../components/RecentActivities";
import UpcomingAppointments from "../components/UpcomingAppointments";

import { supabase } from "../lib/supabase";

function Dashboard() {
  const [totalPacientes, setTotalPacientes] = useState("0");
  const [ventasHoy, setVentasHoy] = useState("$0");
  const [ordenesPendientes, setOrdenesPendientes] = useState("0");
  const [ingresosMensuales, setIngresosMensuales] = useState("$0");

  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarResumen();
  }, []);

  function obtenerFechaHoy() {
    const ahora = new Date();

    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
  }

  function obtenerManana() {
    const ahora = new Date();

    ahora.setDate(ahora.getDate() + 1);

    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
  }

  function obtenerPrimerDiaMes() {
    const ahora = new Date();

    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");

    return `${anio}-${mes}-01`;
  }

  function formatearMoneda(valor: number) {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0
    }).format(valor || 0);
  }

  async function cargarResumen() {
    setCargando(true);

    try {
      const hoy = obtenerFechaHoy();
      const manana = obtenerManana();
      const primerDiaMes = obtenerPrimerDiaMes();

      const [
        pacientesResult,
        ventasHoyResult,
        ordenesResult,
        cajaMesResult
      ] = await Promise.all([
        supabase
          .from("pacientes")
          .select("*", {
            count: "exact",
            head: true
          }),

        supabase
          .from("ventas")
          .select("total, estado")
          .gte("fecha", `${hoy}T00:00:00`)
          .lt("fecha", `${manana}T00:00:00`),

        supabase
          .from("ordenes_trabajo")
          .select("estado"),

        supabase
          .from("caja_diaria")
          .select("ingresos")
          .gte("fecha", primerDiaMes)
          .lte("fecha", hoy)
      ]);

      /* TOTAL PACIENTES */
      if (!pacientesResult.error) {
        setTotalPacientes(
          String(pacientesResult.count || 0)
        );
      }

      /* VENTAS DE HOY */
      if (!ventasHoyResult.error) {
        const totalVentas = (
          ventasHoyResult.data || []
        ).reduce((total, venta) => {
          if (venta.estado === "Anulada") {
            return total;
          }

          return total + Number(venta.total || 0);
        }, 0);

        setVentasHoy(
          formatearMoneda(totalVentas)
        );
      }

      /* ÓRDENES PENDIENTES */
      if (!ordenesResult.error) {
        const pendientes = (
          ordenesResult.data || []
        ).filter((orden) => {
          const estado = (
            orden.estado || ""
          )
            .toLowerCase()
            .trim();

          return (
            estado !== "entregada" &&
            estado !== "anulada"
          );
        }).length;

        setOrdenesPendientes(
          String(pendientes)
        );
      }

      /* INGRESOS MENSUALES */
      if (!cajaMesResult.error) {
        const totalIngresos = (
          cajaMesResult.data || []
        ).reduce((total, caja) => {
          return (
            total +
            Number(caja.ingresos || 0)
          );
        }, 0);

        setIngresosMensuales(
          formatearMoneda(totalIngresos)
        );
      }
    } catch (error) {
      console.error(
        "Error cargando resumen del Dashboard:",
        error
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <MainLayout>
      <TopBar />

      <h1>Dashboard Overview</h1>

      <div className="cards">
        <StatCard
          titulo="Total Pacientes"
          valor={
            cargando
              ? "..."
              : totalPacientes
          }
        />

        <StatCard
          titulo="Ventas Hoy"
          valor={
            cargando
              ? "..."
              : ventasHoy
          }
        />

        <StatCard
          titulo="Órdenes Pendientes"
          valor={
            cargando
              ? "..."
              : ordenesPendientes
          }
        />

        <StatCard
          titulo="Ingresos Mensuales"
          valor={
            cargando
              ? "..."
              : ingresosMensuales
          }
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
