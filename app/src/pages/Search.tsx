import { useContext, useState } from "react";
import { Button, Input, Spinner } from "@heroui/react";
import { GameCards } from "../components/GameCards";
import BasePage from "../components/BasePage";
import SettingsContext from "../contexts/SettingsContext";

const apiUrl = import.meta.env.VITE_API_URL;
const STORAGE_KEY = "rulebook";

export type Game = {
  id: string;
  name: string;
};

const getRecent = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  const recentGames = data ? JSON.parse(data) : [];
  return recentGames;
};

function Search() {
  const { language } = useContext(SettingsContext);
  const [search, setSearch] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [recents] = useState<Game[]>(() => {
    return getRecent();
  });

  const searchGame = () => {
    setLoading(true);

    fetch(`${apiUrl}/games?search=${search}&language=${language}`)
      .then((response) => response.json())
      .then((data) => {
        setLoading(false);
        console.log("data response", data);
        setGames(data);
      })
      .catch((error) => {
        console.log("errrrr", error);
      });
  };

  const handleCardClick = (game: Game) => {
    const recentGames = getRecent();

    const filteredGames = recentGames.filter((g: Game) => g.id !== game.id);

    filteredGames.unshift({
      id: game.id,
      name: game.name,
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredGames));
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
