import { Button, Dropdown, Label } from "@heroui/react";
import SettingsContext from "../contexts/SettingsContext";
import { useContext, useEffect, useState } from "react";
import type { Selection } from "@heroui/react";
import BasePage from "../components/BasePage";

const apiUrl = import.meta.env.VITE_API_URL;

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

  const [languages, setLanguages] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${apiUrl}/games/languages`)
      .then((resp) => {
        if (!resp.ok) throw new Error("Failed to fetch languages");
        return resp.json();
      })
      .then((data) => {
        setLanguages(data.languages || []);
      })
      .catch((err) => {
        console.error("Error fetching languages:", err);
      });
  }, []);

  const selectTheme = (keys: Selection) => {
    const arr = Array.from(keys);
    const themeKey = arr.length > 0 ? String(arr[0]) : "";
    setTheme(themeKey);
  };

  const selectLanguage = (keys: Selection) => {
    const arr = Array.from(keys);
    const langKey = arr.length > 0 ? String(arr[0]) : "";
    setLanguage(langKey);
  };

  const selectButtonsPosition = (keys: Selection) => {
    const arr = Array.from(keys);
    const buttonsPositionKey = arr.length > 0 ? String(arr[0]) : "";
    setButtonsPosition(buttonsPositionKey);
  };

  return (
    <BasePage showBackButton={true}>
      <div className="w-3/4 md:w-1/2 mx-auto flex gap-4 flex-col mt-[25%]">
        <div className="flex justify-between items-center">
          <p className="text-lg">Theme</p>

          <div>
            <Dropdown>
              <Dropdown.Trigger>
                <Button aria-label="Menu" variant="secondary">
                  {theme}
                </Button>
              </Dropdown.Trigger>

              <Dropdown.Popover>
                <Dropdown.Menu
                  className="min-w-[256px]"
                  disallowEmptySelection
                  selectedKeys={new Set([theme])}
                  selectionMode="single"
                  onSelectionChange={selectTheme}
                >
                  <Dropdown.Section>
                    {themes.map((t) => (
                      <Dropdown.Item key={t} id={t} textValue={t}>
                        <Dropdown.ItemIndicator />
                        <Label>{t}</Label>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Section>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-lg">Language</p>
          <Dropdown>
            <Button aria-label="Menu" variant="secondary">
              {language}
            </Button>
            <Dropdown.Popover className="min-w-[256px]">
              <Dropdown.Menu
                disallowEmptySelection
                selectedKeys={new Set([language])}
                selectionMode="single"
                onSelectionChange={selectLanguage}
              >
                <Dropdown.Section>
                  {languages.map((lang) => (
                    <Dropdown.Item key={lang} id={lang} textValue={lang}>
                      <Dropdown.ItemIndicator />
                      <Label>{lang}</Label>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Section>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-lg">Button Position</p>
          <Dropdown>
            <Button aria-label="Menu" variant="secondary">
              {buttonsPosition}
            </Button>
            <Dropdown.Popover className="min-w-[256px]">
              <Dropdown.Menu
                disallowEmptySelection
                selectedKeys={new Set([buttonsPosition])}
                selectionMode="single"
                onSelectionChange={selectButtonsPosition}
              >
                <Dropdown.Section>
                  <Dropdown.Item key="left" id="left" textValue="left">
                    <Dropdown.ItemIndicator />
                    <Label>Left</Label>
                  </Dropdown.Item>
                  <Dropdown.Item key="right" id="right" textValue="right">
                    <Dropdown.ItemIndicator />
                    <Label>Right</Label>
                  </Dropdown.Item>
                </Dropdown.Section>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>
    </BasePage>
  );
}

export default Settings;
