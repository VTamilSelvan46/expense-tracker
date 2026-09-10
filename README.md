# Expense Tracker

A React/Vite expense tracker that stores data in the browser's localStorage.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

1. Create a GitHub repository named `expense-tracker`.
2. Push this project to the repository.
3. Run:

```bash
npm install
npm run deploy
```

4. In GitHub: Settings → Pages → Deploy from a branch → select `gh-pages` / root.

The site URL will be:

`https://YOUR-USERNAME.github.io/expense-tracker/`

If your repository has a different name, change `base` in `vite.config.js` to `/<repository-name>/`.
