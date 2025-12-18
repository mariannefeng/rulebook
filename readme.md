### api

- find a game: /games?search=X GET
- get rules: /games/{game-name}/rules GET

## backend

todo:

- add health check endpoint
- incorporate swagger into build process
- setup cron or something to keep server continuously alive?

done:

- make available at api.rule-book.org
- add swagger
- use cloudflare R2 for pdf storage
- support for different languages (en + fr, GET languages)
- implement backend in golang
- deploy the backend somewhere

general gist:

- search for a game here: https://en.1jour-1jeu.com/rules
- fetch pdf and serve

## app (pwa)

todo:

- trasparent gray background for images on PDFs
- disable posthog recording when running locally
- add button to save page as app to desktop
- fix settings dropdown weird flicker on desktop
- tap to clear input not working on mobile
- allow zoom on pdf screen
- keyboard shortcut

done:

- buy a domain
- add ability to move action buttons to the left or right
- add back button
- hide pdf search until pdf loads
- add 3 other colors
- add posthog
- setting to configure theming color across the board
- add language to settings
- cache pdf
- save settings to local storage
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
