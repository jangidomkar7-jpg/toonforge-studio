# ToonForge Studio — GLB character edition

Upload the four website files to the repository root and upload the two model files into `models/`:

- `models/golu.glb`
- `models/chintu.glb`

The app loads both original GLB meshes with Three.js GLTFLoader and reuses them in each generated story scene. The supplied models are static meshes, not skeletal-rigged characters; the current preview applies whole-character movement (bob, sway, turn and jump). For articulated walking, hand gestures, facial acting and lip sync, rig the models and add animation clips in Blender, then connect those clips with Three.js AnimationMixer.

This is a browser-side prototype, not an AI text-to-video service. Export records a WebM video.
