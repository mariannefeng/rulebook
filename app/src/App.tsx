import { Routes, Route } from "react-router-dom";
import Search from "./pages/Search";
import Rulebook from "./pages/Rulebook";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Search />} />
      <Route path="/:gameId/pdf" element={<Rulebook />} />
    </Routes>
  );
}

export default App;
