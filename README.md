# EngeneSearch (Angular)

EngeneSearch is now an Angular 18 SPA that mirrors the previous Next.js experience. It includes the interactive dashboard, AI-assisted search, saved documents, and knowledge graph visualisation backed by D3.

## Getting started

```bash
npm install
npm start   # runs `ng serve` on http://localhost:4200
```

## Available scripts

- `npm start` – development server with live reload.
- `npm run build` – production build output in `dist/engenesearch`.
- `npm run watch` – rebuild on changes.
- `npm test` – executes Karma unit tests (none are included by default).

## Project structure

- `src/app/features` – feature modules (home, dashboard, search, saved, graph).
- `src/app/shared` – reusable components (sidebar, header, article cards, chat modal, search assist).
- `src/app/core` – services, models, and utilities (articles data, keyword and search services).
- `public/data` – static JSON datasets used by the app.

## Notes

- Tailwind utility classes are replicated via global styles; no separate configuration is required beyond the included `tailwind.config.js`.
- The knowledge graph depends on `d3` and renders saved articles; ensure you have saved items to explore the visualisation.

For additional Angular CLI commands see the [Angular CLI reference](https://angular.dev/tools/cli).
