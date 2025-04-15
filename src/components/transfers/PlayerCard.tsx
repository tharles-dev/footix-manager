interface PlayerCardProps {
  player: {
    name: string;
    overall: number;
    position: string;
    nationality: string;
    club?: {
      name: string;
      user?: {
        name: string;
      };
    };
    salario_atual: number;
    valor_mercado: number;
    valor_clausula?: number;
  };
  onActionClick: () => void;
}

export function PlayerCard({ player, onActionClick }: PlayerCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold px-2 py-1 bg-gray-100 rounded">
              {player.overall}
            </span>
            <span className="text-sm font-semibold px-2 py-1 bg-gray-100 rounded">
              {player.position}
            </span>
            <span className="text-sm text-gray-600">{player.nationality}</span>
          </div>

          <h3 className="font-semibold text-lg mb-1">{player.name}</h3>

          {player.club ? (
            <p className="text-sm text-gray-600 mb-2">
              {player.club.name} ({player.club.user?.name || "Sem dono"})
            </p>
          ) : (
            <p className="text-sm text-green-600 font-medium mb-2">
              Jogador Livre
            </p>
          )}
        </div>

        <button
          onClick={onActionClick}
          className="text-primary-600 p-2 hover:bg-gray-50 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
            />
          </svg>
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Salário</p>
            <p className="font-medium">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(player.salario_atual)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Valor de Mercado</p>
            <p className="font-medium">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(player.valor_mercado)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
