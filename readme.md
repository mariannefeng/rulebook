### api

- find a game: /games?search=X GET
- get rules: /games/{game-name}/rules GET

## backend

todo:

- add swagger
- setup cron to continuously keep render server alive

done:

- use cloudflare R2 for pdf storage
- support for different languages (en + fr, GET languages)
- implement backend in golang
- deploy the backend somewhere

general gist:

- search for a game here: https://en.1jour-1jeu.com/rules
- fetch pdf and serve

## app (pwa)

todo:

- save settings to local storage
- optional to download to phone to avoid server at all (offline support)
- add 3 other colors
- add language to settings
- keyboard shortcut

done:

- setting to configure theming color across the board
- loading
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

general gist:

- react + vite project
- use hero UI for visuals
