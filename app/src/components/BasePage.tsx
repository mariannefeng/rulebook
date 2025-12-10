import { Button, Dropdown, Label, Modal } from "@heroui/react";
import type { Selection } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState, type PropsWithChildren } from "react";

function BasePage({ children }: PropsWithChildren) {
  const [selected, setSelected] = useState<Selection>(new Set(["default"]));
  const [theme, setTheme] = useState("default");

  const selectTheme = (keys: Selection) => {
    setSelected(keys);

    const arr = Array.from(keys);
    const themeKey = arr.length > 0 ? String(arr[0]) : "";
    setTheme(themeKey);
  };

  return (
    <div className={`h-full theme-${theme}`}>
      {children}
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
                  <div>
                    <div className="flex justify-between items-center">
                      <p>Theme</p>

                      <div>
                        <Dropdown>
                          <Button aria-label="Menu" variant="secondary">
                            {selected}
                          </Button>
                          <Dropdown.Popover className="min-w-[256px]">
                            <Dropdown.Menu
                              disallowEmptySelection
                              selectedKeys={selected}
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
                    {/* <p>Language</p>
                    <p>Offline Rulebooks</p> */}
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button className="w-full" onPress={close}>
                    Continue
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal>
    </div>
  );
}

export default BasePage;
