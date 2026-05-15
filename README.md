# cupid music player (Android & Desktop)

A pixel-art music player built with Electron (Desktop) and Capacitor (Android), using Vite and React.

## Features

- **Multi-platform**: Runs on Windows, Mac, Linux, and Android (APK).
- **YouTube Streaming**: Search and play any track directly via YouTube.
- **Backend Proxy**: Uses a Node.js backend to extract high-quality audio streams for mobile support.
- **Pixel-art UI**: Animated record player, spinning vinyl, and needle.
- **Record swap animation**: Song changes trigger a vinyl color alternation.
- **Interactive progress bar**: Draggable star indicator.
- **Theming**: Pink and blue theme switching.
- **Spotify & Apple Music integration**: Browse your playlists and play tracks.
- **Local MP3 playback**: Reads ID3 tags automatically.

## Getting Started

### Prerequisites
- Node.js installed.
- `yt-dlp` installed (for the backend server).

### Installation
```bash
npm install
```

### Desktop Version
```bash
npm run dev
```

### Android Version (APK)
1. Install Android Studio and SDK.
2. Build the project:
```bash
npm run build
npx cap copy
npx cap open android
```

### Backend Server (Streaming Proxy)
Required for the Android app to stream music from YouTube.
```bash
cd server
npm install
node index.js
```

## Adding Local Audio Files

1. Create an `audio/` folder in the project root.
2. Drop your `.mp3` files into the `audio/` folder.
3. Restart the app.

## Tech Stack

- **Electron** — Desktop app shell.
- **Capacitor** — Android app shell.
- **Vite & React** — Frontend.
- **Node.js & Express** — Backend Streaming Proxy.
- **yt-dlp** — YouTube audio extraction.
- **Spotify & Apple Music APIs** — Playlist integration.
