import { useContext, type PropsWithChildren } from "react";
import SettingsModal from "./SettingsModal";
import SettingsContext from "../contexts/SettingsContext";

function BasePage({ children }: PropsWithChildren) {
  const { theme } = useContext(SettingsContext);

  return (
    <div className={`h-full theme-${theme}`}>
      {children}
      <SettingsModal />
    </div>
  );
}

export default BasePage;
