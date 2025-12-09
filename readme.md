### api

- find a game: /games?search=X GET
- get rules: /games/{game-name}/rules GET

## backend

- search for a game here: https://en.1jour-1jeu.com/rules
- fetch pdf
- pass pdf to something and parse into searchable text (https://pymupdf.readthedocs.io/en/latest/installation.html)
- store parsed results somewhere (private github page?)

todo:

- implement backend in golang
- use cloudflare R2 for pdf storage
- deploy the backend somewhere

## app (pwa)

- react + vite project
- use hero UI for visuals

todo:

- actually make it a pwa
- make icon
- make sure all the game titles always fit
- make sure all the cards game height
- setting to configure theming color across the board
- mobile friendly (should scale down accordingly)
- support for different languages

done:

- homepage: game search
- search for a game
- recently viewed games (local storage)
- click on a game to view rule pdf
- rule page filters live
