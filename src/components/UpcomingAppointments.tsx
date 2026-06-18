function UpcomingAppointments() {
  return (
    <div
      style={{
        background: "#fff",
        padding: "30px",
        borderRadius: "20px",
        boxShadow: "0 5px 20px rgba(0,0,0,.08)"
      }}
    >
      <h2>Upcoming Appointments</h2>

      <table
        style={{
          width: "100%",
          marginTop: "25px"
        }}
      >
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Hora</th>
            <th>Tipo</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Robert Johnson</td>
            <td>10:30</td>
            <td>Eye Exam</td>
          </tr>

          <tr>
            <td>Laura Miller</td>
            <td>11:15</td>
            <td>Contact Fitting</td>
          </tr>

          <tr>
            <td>Kevin Smith</td>
            <td>12:00</td>
            <td>Follow-up</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default UpcomingAppointments;
