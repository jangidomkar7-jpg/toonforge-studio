# ToonForge Studio — Auto 3D Cartoon Story Maker

A GitHub Pages-friendly browser prototype. Write a story, generate scenes, then play or record the storyboard.

## This upgrade
- Two original, procedural 3D cartoon friends: Golu (round, playful) and Chintu (clever, slim).
- Simple articulated arms, elbows, legs, head and mouth for visible character acting.
- Hindi story sentence splitting and keyword-based action selection: walk, run, jump, dance, laugh, surprise, eat, talk, wave and idle.
- Story-aware simple environments and props (forest/village, house/school/shop, treasure, magic stone, ball).
- Browser speech synthesis for narration when supported by the device.
- Scene-by-scene storyboard and WebM canvas recording.
- 16:9, 9:16 and square canvas ratios.

## Honest limitations
This is **not** a full AI text-to-video generator. It uses two built-in procedural 3D characters and a limited set of code-driven animations. Actions are selected from story keywords, so a sentence may not always be interpreted correctly. The characters do not have professional skeletal rigs, detailed facial animation or true dialogue lip-sync. Browser narration is device-dependent and may not be included in the canvas recording. Export is WebM, not guaranteed MP4.

For production-quality animation, add original rigged GLB characters and authored animation clips, or connect a video-generation service through a secure backend. Never put private API keys in this public GitHub repository. GitHub Pages is static hosting and cannot securely store secrets.

## Update the existing GitHub Pages site
1. Keep a backup of the current repository files.
2. Extract this ZIP.
3. Upload the four files from the ZIP's `toonforge-studio-main` folder to the root of your existing repository.
4. GitHub will show that files with the same names are being replaced. Commit the upload to the `main` branch.
5. Wait for GitHub Pages to redeploy, then refresh the site. If the old page remains, clear the browser cache or open the URL in a private tab.

## Files
- `index.html` — page layout
- `style.css` — responsive interface styling
- `app.js` — Three.js scene, character rigs, action selection, narration and WebM export
- `README.md` — setup and limitations

Three.js is loaded from jsDelivr, so an internet connection is required.
