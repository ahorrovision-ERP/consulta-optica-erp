type Props = {
  titulo: string;
  valor: string;
};

function StatCard({ titulo, valor }: Props) {
  return (
    <div className="card">
      <h3>{titulo}</h3>
      <h2>{valor}</h2>
    </div>
  );
}

export default StatCard;
