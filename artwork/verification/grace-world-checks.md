# Grace World verification — 9 November 2026

## Completed browser checks

- The root URL opened directly into the live London Square world, with no landing page or login prompt in the existing public-preview mode.
- The world filled the 977×884 desktop viewport. At 390×844, both the world frame and open Grace dialog measured exactly 390×844, with no document horizontal overflow.
- Grace home opened over the live world with its own app menu, address, navigation controls and readable status text. Closing it restored world focus.
- The Character app displayed the actual Blender citizen in WebGL. Changing Braids to Cropped updated the preview and recorded the saved appearance; closing returned to the same world.
- World atlas displayed the five retained islands and all sixteen game destinations on LTBS. Selecting Quiz Arena → Visit building travelled to its actual door on LTBS. Its entrance prompt opened `grace://games/quiz`.
- Bible Quiz → Play displayed a real question. Answering Moses to the basket-among-reeds question showed “Correct! Exodus 2:1–10” and enabled Next question.
- Walking south moved the explorer and the camera. The Space action was exercised; the direct model test additionally verifies the jumping pose.
- Browser console logs were empty during the world, customization and building-entry checks.
- The Scripture app showed KJV/NKJV options and loaded the full book catalogue. Read chapter issued `/api/scripture/JHN/3?version=KJV`; server logs and a follow-up HTTP check confirmed 200 and the John 3 KJV verse content.

## Automated checks

- `node --test *.test.mjs`: 121 passed, 0 failed before final packaging.
- Actual Blender GLBs contain articulated Head, ArmL/ArmR and LegL/LegR nodes, plus separately modelled hair and jacket parts. The real loaded model changes visible hairstyles/outfits and responds to walk, wave and jump animation updates.
- The dressed citizen uses no more than 30 visible draw meshes after batching (59 before), with independently animated joints and unmodified cached source geometry.
- Every game door is reachable on the collision grid. Retained story/challenge entrances are reachable. The city includes a Social House entrance and the five-island layout is unchanged.
- Grace routes reject external URLs and recursive world pages. Frame messages reject the wrong origin or sender. History back/forward, travel actions, pause and return-to-world focus are tested.
- Existing family/backend checks still pass; this change does not alter credentials, sessions or database access.
- Final `node scripts/build.mjs` succeeded with 179 lightweight Worker assets. HTTP checks returned 200 for all 36 checked entry, module, chunk, stylesheet and model assets. The Scripture request returned KJV John 3 with 36 verses. Exact results are in `grace-world-http.json`.

## Visual verification limit

Browser control became disabled in Work settings during the Scripture check. A final browser pass over the Social House conversations, the latest horizontal phone app navigation, newly framed native services and the final mesh batching could not be performed. These have source/build/automated checks. The Blender artist render is `world-runtime/art-sources/kairos-citizen-preview.png`; it is a model render, not a screenshot of the UI. No new final UI screenshots are claimed.

Social conversations are local scripted interactions; live multiplayer/chat is not implemented. NKJV licensed in-app text remains unavailable and links to its publisher reader.
