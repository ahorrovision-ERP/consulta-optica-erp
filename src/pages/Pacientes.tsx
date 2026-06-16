import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Pacientes() {

  const [pacientes, setPacientes] = useState<any[]>([]);

  useEffect(() => {
    cargarPacientes();
  }, []);

  async function cargarPacientes() {

    const { data, error } = await supabase
      .from("pacientes")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    setPacientes(data);
  }

  return (
    <div>

      <h1>Pacientes</h1>

      <table border={1}>
        <thead>
          <tr>
            <th>Ficha</th>
            <th>Rut</th>
            <th>Nombres</th>
            <th>Apellidos</th>
          </tr>
        </thead>

        <tbody>
          {pacientes.map((p) => (
            <tr key={p.id}>
              <td>{p.ficha}</td>
              <td>{p.rut}</td>
              <td>{p.nombres}</td>
              <td>{p.apellidos}</td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}
