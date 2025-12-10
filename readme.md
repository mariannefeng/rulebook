### api

- find a game: /games?search=X GET
- get rules: /games/{game-name}/rules GET

## backend

- search for a game here: https://en.1jour-1jeu.com/rules
- fetch pdf

todo:

- use cloudflare R2 for pdf storage

done:

- implement backend in golang
- deploy the backend somewhere

## app (pwa)

- react + vite project
- use hero UI for visuals

todo:

- setting to configure theming color across the board
- loading
- support for different languages
- optional to download to phone to avoid server at all (offline support)

done:

- homepage: game search
- mobile friendly (should scale down accordingly)
- search for a game
- recently viewed games (local storage)
- click on a game to view rule pdf
- rule page filters live
- actually make it a pwa
- make icon
- make sure all the game titles always fit
- make sure all the cards same height
