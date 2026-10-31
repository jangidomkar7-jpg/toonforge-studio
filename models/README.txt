# ToonForge 3D Character Models

This package contains two original low-poly/stylized 3D character models in glTF Binary (.glb) format:

- golu.glb — orange-shirted, rounder comic character with green scarf
- chintu.glb — blue-shirted, slimmer clever friend with yellow belt

## Important
These are real 3D mesh models that can be loaded into a Three.js scene with GLTFLoader.
They are static models: they do not yet contain a skeletal armature, facial blendshapes, or animation clips.
To make them walk, run, talk, and gesture, the next step is to rig them in Blender and create animation clips, then load those clips with Three.js AnimationMixer.

## Suggested placement
The models are approximately 2.2 scene units tall and face toward +Z. Set their positions in your scene, e.g. Golu at x=-0.7 and Chintu at x=0.7.

## Loading in Three.js
Use GLTFLoader and load:
- `models/golu.glb`
- `models/chintu.glb`

Do not rename the files unless you also update the paths in app.js.
