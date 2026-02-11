import { createContext, useState } from "react";
import type { Game } from "../libs/types";

type SearchState = {
  search: string;
  setSearch: (value: string) => void;
  games: Game[];
  setGames: (games: Game[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
};

const SearchContext = createContext<SearchState>({
  search: "",
  setSearch: () => {},
  games: [],
  setGames: () => {},
  loading: false,
  setLoading: () => {},
});

export const SearchProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [search, setSearch] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <SearchContext.Provider
      value={{ search, setSearch, games, setGames, loading, setLoading }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext;
