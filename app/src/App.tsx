import { Routes, Route } from "react-router-dom";
import Search from "./pages/Search";
import Rulebook from "./pages/Rulebook";
import Settings from "./pages/Settings";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Search />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/:gameId/pdf" element={<Rulebook />} />
    </Routes>
  );
}

export default App;
