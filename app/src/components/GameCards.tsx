import { Card } from "@heroui/react";
import type { Game } from "../pages/Search";
import { useNavigate } from "react-router-dom";

export function GameCards({
  label,
  games,
  onCardClick,
  cardClassName,
}: {
  label: string;
  games: Game[];
  onCardClick: (game: Game) => void;
  cardClassName?: string;
}) {
  const navigate = useNavigate();

  const handleCardClick = (game: { id: string; name: string }) => {
    onCardClick(game);

    navigate(`/${game.id}/pdf`);
  };

  return (
    <div>
      <h2 className="pb-4">{label}</h2>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {games.map((game) => {
          return (
            <div
              className="h-auto"
              key={game.id}
              onClick={() => handleCardClick(game)}
            >
              <Card
                variant="tertiary"
                className={`cursor-pointer h-full flex justify-center ${cardClassName}`}
              >
                <Card.Header>
                  <Card.Title className="text-lg">{game.name}</Card.Title>
                </Card.Header>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
