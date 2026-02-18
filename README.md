# WatchThis! — Browser Extension

**Recommend YouTube videos directly to your friends' feeds.**

WatchThis! is a browser extension for Chrome and Firefox that lets you send YouTube video recommendations to friends without leaving the page. Recommendations appear directly in your friends' YouTube homepage feed.

Check out the official Website and YouTube Video.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)

## Features

- Send YouTube video recommendations to friends with one click
- Recommendations appear as cards in your friends' YouTube homepage
- Friend request system with accept/reject flow
- Google OAuth and email/password sign-in
- Works on Chrome (MV3) and Firefox (MV2)

Install the extension from:

- [Chrome Web Store](https://chromewebstore.google.com/detail/watchthis/hbpkmdcgckbogdkkepcnmgankbbjjlha)
- [Firefox Add-ons](https://addons.mozilla.org/de/firefox/addon/watchthis/)

Sign up inside the extension popup, add your friends and start recommending videos.

## Self-Hosting

You can run your own backend. See [pocketbase/README.md](./pocketbase/README.md) for
a step-by-step guide on setting up your own PocketBase instance with the correct schema and security rules.

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/watch-this-extension.git
cd watch-this-extension

# 2. Install dependencies
npm install

# 3. Configure your backend URL
cp .env.example .env
# Edit .env and set VITE_POCKETBASE_URL to your PocketBase instance

# 4. Build the extension
npm run build          # Chrome
npm run build:firefox  # Firefox

# 5. Load the unpacked extension
# Chrome: go to chrome://extensions → Load unpacked → select .output/chrome-mv3/
# Firefox: go to about:debugging → Load Temporary Add-on → select .output/firefox-mv2/manifest.json
```

## Development

```bash
npm run dev          # Chrome with hot reload
npm run dev:firefox  # Firefox with hot reload
npm run compile      # TypeScript type check (no output)
```

### Project Structure

```
entrypoints/
  background.ts        # Service worker — message router
  content/
    homepage.ts        # Injects recommendation feed into YouTube homepage
    video.ts           # Injects "WatchThis!" button on video pages
  popup/               # React popup UI
  auth/                # OAuth callback page
lib/
  pocketbase.ts        # PocketBase client singleton
  auth.ts              # Auth state management
  friends.ts           # Friend request logic
  recommendations.ts   # Recommendation CRUD
  youtube.ts           # YouTube URL helpers
types/
  index.ts             # Shared TypeScript types
pocketbase/
  schema.json          # PocketBase collection schema (import to self-host)
  README.md            # Self-hosting guide
```

### Tech Stack

| Layer     | Technology                           |
| --------- | ------------------------------------ |
| Framework | [WXT](https://wxt.dev/) (Vite-based) |
| UI        | React 19 + Tailwind CSS v4           |
| Backend   | [PocketBase](https://pocketbase.io/) |
| Language  | TypeScript (strict mode)             |

## Build Requirements

| Tool    | Version |
| ------- | ------- |
| Node.js | 22 LTS  |
| npm     | 10+     |

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

## License

[GPL-3.0](./LICENSE) with Additional Terms — Copyright © 2026 Lukas Weihrauch

> The name **"WatchThis!"** is a trademark of Lukas Weihrauch. Derivative works must be renamed and may not use this name.

## Support

If you find WatchThis! useful and would like to support me, you can buy me a coffee on Ko-fi:

https://ko-fi.com/lukasweihrauch

Thank you — your support helps fund hosting, development, and improvements.
