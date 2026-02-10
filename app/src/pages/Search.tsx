import { useContext, useState } from "react";
import { Button, Input, Spinner } from "@heroui/react";
import { GameCards } from "../components/GameCards";
import BasePage from "../components/BasePage";
import SettingsContext from "../contexts/SettingsContext";
import { getRecentGames, setRecentGames } from "../libs/localStorage";
import type { Game } from "../libs/types";

const apiUrl = import.meta.env.VITE_API_URL;

function Search() {
  const { language } = useContext(SettingsContext);
  const [search, setSearch] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [recents] = useState<Game[]>(() => {
    return getRecentGames();
  });

  const searchGame = () => {
    setLoading(true);

    fetch(`${apiUrl}/games?search=${search}&language=${language}`)
      .then((response) => response.json())
      .then((data) => {
        setLoading(false);
        setGames(data.results || []);
      })
      .catch((error) => {
        console.log("errrrr", error);
      });
  };

  const handleCardClick = (game: Game) => {
    const recentGames = getRecentGames();

    const filteredGames = recentGames.filter((g: Game) => g.id !== game.id);

    filteredGames.unshift({
      id: game.id,
      name: game.name,
    });

    setRecentGames(filteredGames);
  };

  return (
    <BasePage>
      <div className="flex flex-col gap-10 p-5 items-center w-full">
        <div className="flex gap-5 w-full">
          <Input
            className="w-full"
            aria-label="Search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Search for a board game"
            onKeyDown={(event) => {
              if (event.key === "Enter" && search.length > 0) {
                searchGame();
              }
            }}
          />
          <Button onPress={searchGame}>Search</Button>
        </div>
        {recents.length > 0 && (
          <GameCards
            label="Recently viewed"
            cardClassName="bg-primary"
            titleClassName="text-white"
            games={recents}
            onCardClick={handleCardClick}
          />
        )}
        {loading && <Spinner size="xl" />}
        {games.length > 0 && (
          <GameCards
            label="Search"
            games={games}
            onCardClick={handleCardClick}
          />
        )}
      </div>
    </BasePage>
  );
}

export default Search;
