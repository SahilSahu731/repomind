# RepoMind browser extension

The RepoMind Chrome extension adds a read-only repository control to public GitHub repositories and opens the RepoMind report in Chrome's side panel.

## Build and load it

Requirements: Node.js 22.6+ and Chrome 116+.

```bash
cd extension
npm install
npm run build
```

Then open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `extension/dist`.

After rebuilding, use the reload button on the RepoMind card in `chrome://extensions`, then refresh the GitHub tab.

## Local development

Run the website from the repository root:

```bash
npm run dev
```

In a second terminal, build the extension in watch mode:

```bash
npm run extension:dev
```

Development builds target `http://localhost:3000` by default. To use another origin, create `extension/.env.development.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:4000
```

Load `extension/dist-dev` in Chrome for local testing. Development and
production builds use separate folders, so a local API target cannot
accidentally be shipped in the release package. If you prefer a one-time build,
run `npm run extension:build:dev` from the repository root.

Chrome will display this build as **RepoMind — Local Development**. If the card
only says **RepoMind — GitHub Repository Intelligence**, you loaded the
production `extension/dist` folder and it will call the deployed API instead of
localhost.

The local Next.js server accepts unpacked Chrome extension origins. For production, copy the ID shown in `chrome://extensions` and add its exact origin to the deployed website environment:

```dotenv
EXTENSION_ALLOWED_ORIGINS=chrome-extension://your32characterextensionid
EXTENSION_TOKEN_SECRET=generate-a-separate-secret-with-openssl-rand-base64-48
```

Deploy the website after setting those values. The extension's production sign-in and analysis APIs must be deployed before a production build can work.

## Verify and package

```bash
npm run verify
npm run package
```

`verify` runs strict TypeScript checks, repository URL tests, and validates the generated Manifest V3 package. `package` creates `extension/repomind-extension.zip` for a release upload.

## Manual smoke test

1. Load `extension/dist-dev` for localhost testing, or `extension/dist` after the website API has been deployed.
2. Open a public repository such as `https://github.com/facebook/react`.
3. Confirm **Analyze with RepoMind** appears and opens the side panel.
4. Sign in and confirm the panel returns to the detected repository.
5. Start an analysis and confirm progress resumes after closing and reopening the panel.
6. Check Overview, Architecture, Connections, Files, Onboarding, Ask, and Compare.
7. Navigate between repositories and branches without reloading; the panel and GitHub control must follow the active tab.
8. Inspect the extension service worker from `chrome://extensions` and confirm there are no errors.

The extension only requests GitHub page access, its configured RepoMind API origin, side-panel access, identity, alarms, and local storage. It does not request write access to GitHub.
