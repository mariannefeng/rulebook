import { useCallback, useContext, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router-dom";
import { useWindowWidth } from "@wojtekmaj/react-hooks";
import { Document, Page, pdfjs } from "react-pdf";
import { Button, InputGroup } from "@heroui/react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Icon } from "@iconify/react";
import BasePage from "../components/BasePage";
import SettingsContext from "../contexts/SettingsContext";
import { getRecentGames } from "../libs/localStorage";
import type { Game } from "../libs/types";
import type { DocumentCallback } from "react-pdf/dist/shared/types.js";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const apiUrl = import.meta.env.VITE_API_URL;

const documentOptions = {
  wasmUrl: "/wasm/",
};

function Rulebook() {
  const width = useWindowWidth() ?? 1;
  const [search, setSearch] = useState("");
  const { language } = useContext(SettingsContext);

  const { gameId } = useParams<{ gameId: string }>();
  const [numPages, setNumPages] = useState<number>();
  const [error, setError] = useState<string | null>(null);
  const [currSearchIdx, setCurrSearchIdx] = useState(0);
  const [loadComplete, setLoadComplete] = useState(false);
  const [highlightSearch, setHighlightSearch] = useState(false);

  const pdfUrl = `${apiUrl}/games/${gameId}/rules?language=${language}`;

  const gameName =
    getRecentGames().find((g: Game) => g.id === gameId)?.name ?? gameId;

  function onDocumentLoadSuccess({ numPages: nextNumPages }: DocumentCallback) {
    setLoadComplete(true);
    setError(null);
    setNumPages(nextNumPages);
  }

  function onDocumentLoadError(error: Error) {
    setLoadComplete(true);
    setError(`Failed to load PDF: ${error.message}`);
  }

  const textRenderer = useCallback(
    (textItem: { str: string }) => {
      if (!highlightSearch) {
        return textItem.str;
      }

      return textItem.str.replace(search, (value) => `<mark>${value}</mark>`);
    },
    [search, highlightSearch],
  );

  const searchText = () => {
    setHighlightSearch(true);

    const marks = document.querySelectorAll("mark");
    if (marks.length > 0) {
      marks.forEach((mark) => {
        mark.classList.remove("current-match");
      });

      marks[currSearchIdx].classList.add("current-match");

      marks[currSearchIdx].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      if (currSearchIdx === marks.length - 1) {
        setCurrSearchIdx(0);
      } else {
        setCurrSearchIdx(currSearchIdx + 1);
      }
    }
  };

  const resetSearch = () => {
    setSearch("");
    setHighlightSearch(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <BasePage showBackButton={true}>
      <Helmet>
        <title>{gameName}</title>
      </Helmet>
      {!error && loadComplete && (
        <div className="flex gap-5 sticky top-0 z-100 py-5 px-5">
          <InputGroup className="w-full">
            <InputGroup.Input
              className="w-full h-full"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Search for a keyword"
            />
            {search.length > 0 && (
              <InputGroup.Suffix className="pr-0">
                <Button
                  isIconOnly
                  aria-label="Search"
                  size="sm"
                  variant="ghost"
                  onPress={resetSearch}
                >
                  <Icon icon="gravity-ui:circle-letter-x" />
                </Button>
              </InputGroup.Suffix>
            )}
          </InputGroup>
          <Button onPress={searchText}>
            <Icon icon="gravity-ui:magnifier" />
            Search
          </Button>
        </div>
      )}

      <div>
        {error && <div className="text-red-500 text-center">{error}</div>}
        {!loadComplete && <div className="text-center">Loading...</div>}

        <Document
          file={pdfUrl}
          options={documentOptions}
          className="flex flex-col items-center gap-5"
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          error={
            <div className="text-red-500">
              Failed to load PDF. Please check if the file exists.
            </div>
          }
        >
          {Array.from(new Array(numPages), (_, index) => (
            <Page
              customTextRenderer={textRenderer}
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={Math.min(width * 0.9, 800)}
            />
          ))}
        </Document>
      </div>
    </BasePage>
  );
}

export default Rulebook;
