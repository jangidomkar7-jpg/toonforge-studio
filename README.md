# ToonForge Studio — AI Cartoon Animation Maker

A GitHub Pages-ready starter website for making simple procedural 3D cartoon story videos from a written script.

## Features
- Split a Hindi or English story into scenes automatically.
- Procedural 3D cartoon characters and environments using Three.js.
- Scene list, storyboard, playback, and browser text-to-speech narration.
- Record the animated canvas and export a `.webm` video.
- Responsive layout for desktop and mobile.

## Important limitation
This is an **automatic 3D cartoon scene maker**, not a full generative AI text-to-video service. It creates simple 3D scenes from your script using browser code. It does not generate custom character art, lip-sync, cinematic camera shots, or AI-generated backgrounds. The browser's speech synthesis is device-dependent, and narration may not be included in the exported canvas recording.

A real AI video generation service generally needs a third-party API and a secure backend. Do not put secret API keys in `app.js` or any public GitHub repository. GitHub Pages hosts static websites and cannot safely keep private API keys.

## Run locally
Because this project uses JavaScript modules, serve the folder with a local web server (not by double-clicking `index.html`). For example, with Python installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages
1. Sign in to GitHub and create a **new public repository**, for example `toonforge-studio`.
2. Extract this ZIP on your device.
3. Upload `index.html`, `style.css`, `app.js`, and `README.md` to the repository's root (not inside an extra nested folder).
4. Open the repository **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Choose branch **main** and folder **/(root)**, then press **Save**.
7. Wait a minute or two. GitHub will show your published URL, usually:
   `https://YOUR-USERNAME.github.io/toonforge-studio/`

## Notes
- Three.js is loaded from jsDelivr CDN, so the first load needs an internet connection.
- Export uses `MediaRecorder` and `canvas.captureStream()`. Support depends on browser/device; recent desktop Chrome or Edge is recommended.
- Use original stories and assets that you have rights to use.
