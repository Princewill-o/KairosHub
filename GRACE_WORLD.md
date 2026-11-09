# Kairos World and Grace — 9 November 2026

The platform now opens directly into fullscreen Kairos World. Existing guest preview access remains enabled; normal account entry also uses the world shell. Old library/story links open their matching page inside Grace over the live world. No family credentials, database policies or session permissions were changed.

**Grace** is the in-game platform browser. Its navigation includes the sixteen-game library, four 3D Bible story worlds and twelve Scripture challenges, all ten PlayMessages stories, world atlas, Social House, Scripture, character studio and saved journey. It supports back, forward, home, refresh and close/Escape. A native dialog traps focus; opening it pauses world movement and closing it stops embedded games/videos and returns focus to the world. Routes are restricted to known Kairos apps. Messages check both origin and the sending frame; browser pages cannot provide arbitrary travel coordinates or external navigation URLs. Transport, garage, outreach and Scripture-challenge services also use the Grace browser frame.

Scripture offers KJV and NKJV only. KJV is read in Grace; NKJV opens the existing publisher reader because licensed in-app access is not configured. No different version is substituted.

The existing London Square, Kharis Forest/church, LTBS, Fellowship Quay and Orchard Retreat layouts are retained. Sixteen game pavilions with reachable doors were added to LTBS, plus PlayMessages Theatre, Grace Game Hall and Social House entrances. `public/grace-catalog.mjs` drives both physical buildings and the readable atlas. The atlas can travel to a destination or game entrance. Existing station travel remains available. Foreground pavilions fade to keep the player visible.

The Social House has three original scripted characters, conversations and links to same-screen Charades/Pictionary. It does not claim to provide live online chat or shared multiplayer presence.

## Original Blender assets

The supplied `IlluminatED-main.zip` was inspected as a reference for its articulated block-style silhouettes and separate clothing pieces. Its character meshes, brand, workplace content, backend, browser implementation and source code were not copied into this feature. Selected reference source remains in the ignored `.tools/reference-world` directory for analysis only.

`world-runtime/art-sources/scripts/build_grace_world.py` creates the original Kairos citizen and Grace pavilion in Blender. The editable source is `world-runtime/art-sources/kairos-grace-world.blend`; its artist render is `kairos-citizen-preview.png`. Exports are `public/world3d/kairos-citizen.glb` and `grace-pavilion.glb`. Existing church, road, station, forest, vehicle assets and their licences are preserved.

The new player and residents share the original citizen model. It has articulated head, torso, arms and legs, multiple hair meshes, modelled garments/cargo pockets, glasses, headwear, scarf and backpack. The renderer uses the chosen skin, hair and clothing colours. Walking, jumping, idle, greetings and seated/reading poses animate the model; decorative motion respects reduced-motion preferences. Small details are batched per material and articulated body part, reducing the tested dressed citizen from 59 visible draw meshes to fewer than 30 without changing its geometry. Grace's character studio shows the actual 3D model and applies appearance changes to the player immediately. World progress and appearance retain the existing per-player device storage.

## Verification

Run `npm test` and `npm run build`. `grace-world.test.mjs` checks safe routes, all sixteen physical doors plus retained story/challenge entrance reachability, the five-island layout, actual Blender model animation/appearance/batching and browser bridge/history behaviour. Completed browser checks covered default world entry, Grace navigation, Quiz Arena door → Bible Quiz → correct answer, live 3D customization, close/resume and responsive layouts. Browser control was disabled in Work settings before the final pass over social conversations and the most recent UI refinements; those refinements have build/automated verification, not a final visual check. The Scripture chapter request returned HTTP 200 with KJV verses. See `artwork/verification/grace-world-checks.md` for the precise verification limits.
