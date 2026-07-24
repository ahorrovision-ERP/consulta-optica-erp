interface PageHeaderProps {
  titulo: string;
  subtitulo?: string;
}

function PageHeader({
  titulo,
  subtitulo
}: PageHeaderProps) {

  return (

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "35px",
        paddingBottom: "18px",
        borderBottom: "1px solid #ececec"
      }}
    >

      <div>

        <h1
          style={{
            margin: 0,
            color: "#222",
            fontSize: "34px",
            fontWeight: 700,
            letterSpacing: ".3px"
          }}
        >
          {titulo}
        </h1>

        {subtitulo && (

          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              color: "#777",
              fontSize: "16px",
              fontWeight: 400
            }}
          >
            {subtitulo}
          </p>

        )}

      </div>

    </div>

  );

}

export default PageHeader;
