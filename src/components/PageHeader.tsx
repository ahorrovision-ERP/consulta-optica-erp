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
        marginBottom: "30px"
      }}
    >
      <h1
        style={{
          marginBottom: "10px"
        }}
      >
        {titulo}
      </h1>

      <p
        style={{
          color: "#777",
          fontSize: "18px"
        }}
      >
        {subtitulo}
      </p>
    </div>
  );
}

export default PageHeader;
