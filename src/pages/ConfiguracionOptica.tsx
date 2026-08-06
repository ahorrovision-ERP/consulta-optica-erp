import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function ConfiguracionOptica() {

  const [nombreOptica, setNombreOptica] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");


  async function cargarConfiguracion() {

    setCargando(true);

    const { data, error } = await supabase
      .from("configuracion_optica")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {

      console.error(
        "Error cargando configuración:",
        error.message
      );

      setMensaje(
        "No se pudo cargar la configuración."
      );

      setCargando(false);

      return;
    }


    if (data) {

      setNombreOptica(
        data.nombre_optica || ""
      );

      setDireccion(
        data.direccion || ""
      );

      setTelefono(
        data.telefono || ""
      );

      setEmail(
        data.email || ""
      );

      setLogoUrl(
        data.logo_url || ""
      );
    }


    setCargando(false);
  }


  useEffect(() => {

    cargarConfiguracion();

  }, []);


  async function guardarConfiguracion(
    e: React.FormEvent
  ) {

    e.preventDefault();

    setGuardando(true);
    setMensaje("");


    const { data: configuracionExistente, error: errorBusqueda } =
      await supabase
        .from("configuracion_optica")
        .select("id")
        .limit(1)
        .maybeSingle();


    if (errorBusqueda) {

      console.error(
        "Error buscando configuración:",
        errorBusqueda.message
      );

      setMensaje(
        "No se pudo comprobar la configuración."
      );

      setGuardando(false);

      return;
    }


    let error;


    if (configuracionExistente) {

      const resultado = await supabase
        .from("configuracion_optica")
        .update({
          nombre_optica: nombreOptica,
          direccion,
          telefono,
          email,
          logo_url: logoUrl,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq(
          "id",
          configuracionExistente.id
        );

      error = resultado.error;

    } else {

      const resultado = await supabase
        .from("configuracion_optica")
        .insert([
          {
            nombre_optica: nombreOptica,
            direccion,
            telefono,
            email,
            logo_url: logoUrl
          }
        ]);

      error = resultado.error;
    }


    if (error) {

      console.error(
        "Error guardando configuración:",
        error.message
      );

      setMensaje(
        "No se pudo guardar la configuración: " +
        error.message
      );

      setGuardando(false);

      return;
    }


    setMensaje(
      "✓ Configuración guardada correctamente."
    );

    setGuardando(false);
  }


  if (cargando) {

    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#666"
        }}
      >
        Cargando configuración...
      </div>
    );
  }


  return (

    <div
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        padding: "35px",
        boxShadow: "0 8px 25px rgba(0,0,0,.08)",
        maxWidth: "900px",
        margin: "0 auto"
      }}
    >

      <div
        style={{
          marginBottom: "30px"
        }}
      >

        <h2
          style={{
            margin: 0,
            color: "#333"
          }}
        >
          ⚙️ Configuración de la Óptica
        </h2>

        <p
          style={{
            marginTop: "8px",
            color: "#666"
          }}
        >
          Configura los datos que aparecerán en las fichas,
          recetas y documentos impresos.
        </p>

      </div>


      <form
        onSubmit={guardarConfiguracion}
      >


        {/* NOMBRE */}

        <div
          style={{
            marginBottom: "20px"
          }}
        >

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#333"
            }}
          >
            🏪 Nombre de la Óptica
          </label>

          <input
            type="text"
            value={nombreOptica}
            onChange={(e) =>
              setNombreOptica(e.target.value)
            }
            placeholder="Ej: Ahorro Visión"
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              fontSize: "15px",
              outline: "none"
            }}
          />

        </div>


        {/* DIRECCIÓN */}

        <div
          style={{
            marginBottom: "20px"
          }}
        >

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#333"
            }}
          >
            📍 Dirección
          </label>

          <input
            type="text"
            value={direccion}
            onChange={(e) =>
              setDireccion(e.target.value)
            }
            placeholder="Dirección de la óptica"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              fontSize: "15px",
              outline: "none"
            }}
          />

        </div>


        {/* TELÉFONO */}

        <div
          style={{
            marginBottom: "20px"
          }}
        >

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#333"
            }}
          >
            ☎️ Teléfono
          </label>

          <input
            type="text"
            value={telefono}
            onChange={(e) =>
              setTelefono(e.target.value)
            }
            placeholder="Ej: +56 9 1234 5678"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              fontSize: "15px",
              outline: "none"
            }}
          />

        </div>


        {/* CORREO */}

        <div
          style={{
            marginBottom: "25px"
          }}
        >

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#333"
            }}
          >
            ✉️ Correo electrónico
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="correo@optica.cl"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              fontSize: "15px",
              outline: "none"
            }}
          />

        </div>


        {/* LOGO */}

        <div
          style={{
            borderTop: "1px solid #eee",
            paddingTop: "25px",
            marginTop: "10px"
          }}
        >

          <h3
            style={{
              marginTop: 0,
              color: "#333"
            }}
          >
            🖼️ Logo de la Óptica
          </h3>

          <p
            style={{
              color: "#666",
              fontSize: "14px",
              marginBottom: "15px"
            }}
          >
            El logo se podrá utilizar posteriormente en
            fichas clínicas, recetas y documentos impresos.
          </p>


          {logoUrl && (

            <div
              style={{
                marginBottom: "20px",
                padding: "20px",
                background: "#f8f9fb",
                borderRadius: "12px",
                textAlign: "center"
              }}
            >

              <img
                src={logoUrl}
                alt="Logo de la óptica"
                style={{
                  maxWidth: "180px",
                  maxHeight: "100px",
                  objectFit: "contain"
                }}
              />

            </div>

          )}


          <input
            type="text"
            value={logoUrl}
            onChange={(e) =>
              setLogoUrl(e.target.value)
            }
            placeholder="URL del logo"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              fontSize: "15px",
              outline: "none"
            }}
          />

          <p
            style={{
              color: "#888",
              fontSize: "12px",
              marginTop: "8px"
            }}
          >
            Por ahora puedes colocar aquí la URL del logo.
            Más adelante conectaremos directamente el
            selector de archivos con Supabase Storage.
          </p>

        </div>


        {/* MENSAJE */}

        {mensaje && (

          <div
            style={{
              marginTop: "25px",
              padding: "12px 15px",
              borderRadius: "10px",
              background: mensaje.startsWith("✓")
                ? "#eaf7ee"
                : "#fff1f1",
              color: mensaje.startsWith("✓")
                ? "#247a3d"
                : "#b00020",
              fontSize: "14px"
            }}
          >
            {mensaje}
          </div>

        )}


        {/* BOTÓN */}

        <div
          style={{
            marginTop: "30px",
            display: "flex",
            justifyContent: "flex-end"
          }}
        >

          <button
            type="submit"
            disabled={guardando}
            style={{
              background: "#cc001f",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "13px 25px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: guardando
                ? "not-allowed"
                : "pointer",
              opacity: guardando ? 0.7 : 1
            }}
          >
            {guardando
              ? "Guardando..."
              : "Guardar configuración"}
          </button>

        </div>

      </form>

    </div>
  );
}

export default ConfiguracionOptica;
