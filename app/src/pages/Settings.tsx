import { Button, ButtonGroup, ColorSwatchPicker } from "@heroui/react";
import SettingsContext from "../contexts/SettingsContext";
import { useContext } from "react";
import BasePage from "../components/BasePage";

function Settings() {
  const {
    theme,
    language,
    setTheme,
    setLanguage,
    themes,
    buttonsPosition,
    setButtonsPosition,
  } = useContext(SettingsContext);

  return (
    <BasePage showBackButton={true}>
      <div className="w-3/4 md:w-1/2 mx-auto flex gap-10 flex-col mt-[5%]">
        <div className="flex justify-between items-center">
          <p className="text-xl">Language</p>

          <ButtonGroup variant="tertiary">
            <Button
              variant={language === "en" ? "primary" : "secondary"}
              onPress={() => setLanguage("en")}
            >
              <p>english</p>
            </Button>
            <Button
              variant={language === "fr" ? "primary" : "secondary"}
              onPress={() => setLanguage("fr")}
            >
              <p>french</p>
            </Button>
          </ButtonGroup>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-xl">Theme</p>

          <div>
            <ColorSwatchPicker value={themes.get(theme)}>
              {Array.from(themes.entries()).map(([name, color]) => (
                <ColorSwatchPicker.Item
                  key={name}
                  color={color}
                  onPress={() => setTheme(name)}
                >
                  <ColorSwatchPicker.Swatch />
                  <ColorSwatchPicker.Indicator />
                </ColorSwatchPicker.Item>
              ))}
            </ColorSwatchPicker>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-xl">Button Position</p>

          <ButtonGroup variant="tertiary">
            <Button
              variant={buttonsPosition === "left" ? "primary" : "secondary"}
              onPress={() => setButtonsPosition("left")}
            >
              <p>left</p>
            </Button>
            <Button
              variant={buttonsPosition === "right" ? "primary" : "secondary"}
              onPress={() => setButtonsPosition("right")}
            >
              <p>right</p>
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </BasePage>
  );
}

export default Settings;
