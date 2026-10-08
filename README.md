# Notion table snapshot

Every 6 hours, a GitHub Action opens the public Workout Planner Notion page in headless Chrome, screenshots just the table, and publishes it to GitHub Pages:

- Image: `https://<your-username>.github.io/notion-table-snapshot/table.png`
- Preview page: `https://<your-username>.github.io/notion-table-snapshot/`
- Last update time: `https://<your-username>.github.io/notion-table-snapshot/updated.txt`

## Setup (one time)

1. **Create the repo.** On github.com, click **New repository**, name it `notion-table-snapshot`, and make it **Public**. GitHub Pages is free for public repos. The image will be publicly reachable, but so is the Notion page already.
2. **Upload the files.** Click **uploading an existing file** and drag in `snapshot.mjs`, `package.json`, `README.md`, and the `.github` folder, keeping `.github/workflows/snapshot.yml` at that path. Then commit. Alternatively, from a terminal:
   ```bash
   cd notion-table-snapshot
   git init && git add . && git commit -m "Notion table snapshot"
   git branch -M main
   git remote add origin https://github.com/<your-username>/notion-table-snapshot.git
   git push -u origin main
   ```
3. **Turn on Pages.** Go to **Settings → Pages → Build and deployment → Source** and pick **GitHub Actions**.
4. **Run it once.** Go to **Actions → Notion table snapshot → Run workflow**. After about 2 minutes, open the image URL above to check it.

## Put it on your phone

Use any widget app that shows an image from a URL and refreshes on a timer, such as KWGT:

1. Add a KWGT widget to your home screen and tap it to edit.
2. Add an **Image** item. For its bitmap, use a formula pointing to the image URL:
   `https://<your-username>.github.io/notion-table-snapshot/table.png`
3. Set the widget's refresh interval to every few hours. KWGT caches downloaded images, so set the image cache or refresh time low enough that it picks up new versions.
4. Optional: set the widget's touch action to open the Notion page URL.

On One UI, set the widget app's battery mode to **Unrestricted** (Settings → Apps → KWGT → Battery) so it can refresh in the background.

## Tweaks

- **Schedule:** edit `cron` in `.github/workflows/snapshot.yml`. Times are in UTC. GitHub may delay scheduled runs by a few minutes, and it pauses schedules in repos with no activity for 60 days. If that happens, re-enable the schedule from the Actions tab.
- **Dark mode:** change `colorScheme: 'light'` to `'dark'` in `snapshot.mjs`.
- **Wrong table, or none found:** the script grabs the first table on the page. To target a different element, add `TABLE_SELECTOR: '<css selector>'` under `env:` in the workflow.
- **Image too small or large:** adjust `viewport.width` or `deviceScaleFactor` in `snapshot.mjs`.
