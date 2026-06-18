interface PageHeaderProps {
  titulo: string;
  subtitulo?: string;
}

function PageHeader({ titulo, subtitulo }: PageHeaderProps) {
  return (
    <div
      style={{
        marginBottom: "30px"
      }}
    >
      <h1>{titulo}</h1>

      <p
        style={{
          color: "gray"
        }}
      >
        {subtitulo}
      </p>
    </div>
  );
}

export default PageHeader;
