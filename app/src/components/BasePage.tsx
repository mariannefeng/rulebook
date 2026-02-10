import { useContext, type PropsWithChildren } from "react";
import SettingsContext from "../contexts/SettingsContext";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import SettingsModal from "./SettingsModal";

function BasePage({
  children,
  showBackButton = false,
}: PropsWithChildren & { showBackButton?: boolean }) {
  const navigate = useNavigate();
  const { theme, buttonsPosition } = useContext(SettingsContext);

  return (
    <div className={`h-full theme-${theme}`}>
      {children}
      <SettingsModal />
      {showBackButton && (
        <Button
          isIconOnly
          className={`fixed bottom-28 ${
            buttonsPosition === "left" ? "left-12" : "right-12"
          } z-40`}
          onPress={() => navigate(-1)}
        >
          <Icon icon="gravity-ui:arrow-left" />
        </Button>
      )}
    </div>
  );
}

export default BasePage;
