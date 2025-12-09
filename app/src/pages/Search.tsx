import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { GameCards } from "../components/GameCards";

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
  const [search, setSearch] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [recents] = useState<Game[]>(() => {
    return getRecent();
  });

  const searchGame = () => {
    fetch(`${apiUrl}/games?search=${search}`)
      .then((response) => response.json())
      .then((data) => {
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
    <div className="flex flex-col gap-10 p-5">
      <div className="flex gap-5">
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
          cardClassName="bg-blue-200"
          games={recents}
          onCardClick={handleCardClick}
        />
      )}
      {games.length > 0 && (
        <GameCards label="Search" games={games} onCardClick={handleCardClick} />
      )}
    </div>
  );
}

export default Search;
