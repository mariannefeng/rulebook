import { Button, Dropdown, Label } from "@heroui/react";

import { Modal } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useContext, useEffect, useState } from "react";
import type { Selection } from "@heroui/react";
import SettingsContext from "../contexts/SettingsContext";

const apiUrl = import.meta.env.VITE_API_URL;

function SettingsModal() {
  const { theme, language, setTheme, setLanguage } =
    useContext(SettingsContext);

  const [languages, setLanguages] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${apiUrl}/games/languages`)
      .then((resp) => {
        if (!resp.ok) throw new Error("Failed to fetch languages");
        return resp.json();
      })
      .then((data) => {
        setLanguages(data);
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

  return (
    <Modal>
      <Button isIconOnly className="fixed bottom-12 right-12 z-40">
        <Icon icon="gravity-ui:gear" />
      </Button>
      <Modal.Container className={`theme-${theme} md:w-1/2`}>
        <Modal.Dialog className="sm:max-w-[360px]">
          {({ close }) => (
            <>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Settings</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="grid gap-4">
                  <div className="flex justify-between items-center">
                    <p>Theme</p>

                    <div>
                      <Dropdown>
                        <Button aria-label="Menu" variant="secondary">
                          {theme}
                        </Button>
                        <Dropdown.Popover className="min-w-[256px]">
                          <Dropdown.Menu
                            disallowEmptySelection
                            selectedKeys={new Set([theme])}
                            selectionMode="single"
                            onSelectionChange={selectTheme}
                          >
                            <Dropdown.Section>
                              <Dropdown.Item id="default" textValue="default">
                                <Dropdown.ItemIndicator />
                                <Label>default</Label>
                              </Dropdown.Item>
                              <Dropdown.Item id="muted" textValue="muted">
                                <Dropdown.ItemIndicator />
                                <Label>muted</Label>
                              </Dropdown.Item>
                            </Dropdown.Section>
                          </Dropdown.Menu>
                        </Dropdown.Popover>
                      </Dropdown>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p>Language</p>
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
                              <Dropdown.Item id={lang} textValue={lang}>
                                <Dropdown.ItemIndicator />
                                <Label>{lang}</Label>
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Section>
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button className="w-full" onPress={close}>
                  Exit
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
}

export default SettingsModal;
