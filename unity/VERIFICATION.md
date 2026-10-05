# Unity checkpoint — 2026-09-23

Editor: **6000.0.52f1 (9e4086222921)** on Windows. Installed Web Build Support and Mac Build Support (Mono); Windows standalone support is included. No version migration was needed. Approximately 104 GB was free before setup; approximately 87 GB remained during export compilation. No upstream sample projects or LFS assets were downloaded.

## Passed

- C# compilation and **14/14 Unity EditMode tests**, including nine new Lost Sheep role tests. The real NUnit report is generated at `KairosAdventures/Logs/results.xml`.
- Actual WebGL build through `scripts/unity-build.mjs`, including loader/framework/data/wasm and manifest validation. Output: repository-root `unity-build/`.
- Real exported WebGL browser check: all five games load, keyboard actions are exercised, and pause freezes the rendered game before resume. Ark Park runs to its actual completion message, displays results and restarts. Screenshots were inspected, including supplied sprites and Lost Sheep rescue feedback. This is separate from the mock bridge check.
- Windows standalone build: `KairosAdventures/Builds/Windows/Kairos.exe`. A headless process reached runtime initialization; null-graphics shader warnings are expected in that check. This does not verify native rendering or LAN.
- macOS standalone build: `KairosAdventures/Builds/Kairos.app`. Built on Windows; not executed on macOS.
- **38/38 Node tests**, website build, Unity fallback/mock bridge browser tests, and all five browser arcade control/pause/two-player mount/mobile layout flows.

Node was supplied by the Codex runtime on this machine, so package-script bodies were run directly with its Node executable. The reproducible package commands are:

```sh
npm test
npm run build
npm run dev
npm run test:unity-web
npm run test:arcade
npm run unity:build
npm run test:unity-export
```

`npm test` includes `unity-build.test.mjs` and `unity-serving.test.mjs`. The real-export browser check requires the dev server and a successful local Unity export; it never mocks Unity. Startup focus loss can pause the game; the check resumes that state before exercising controls.

## New Lost Sheep behavior

Solo and two-player rounds retain cooperative rescue of eight roaming sheep. With 3–8 players, the host assigns one shepherd, one wolf and the remaining players as sheep, ordered by connection ID. The host owns roles, tagging, rescue, scores, hiding and completion; client input has no writable role or score field.

Sheep hold the action control in bushes to hide and reach the marked fold to become safe. The wolf tags visible nearby sheep, immobilizing them until the shepherd calls them free. Shepherd calls move nearby sheep toward the fold. All player sheep reaching home wins for the flock; the 180-second timeout wins for the wolf. Losing the last player of a required role cancels the round; restart reassigns roles. Cancelled rounds do not emit a completion bridge message. Hiding conceals drawing and blocks tags, but positions remain in authoritative snapshots; this is not an anti-cheat secrecy boundary.

## Still unverified or unfinished

- Native host/client gameplay across two real devices, eight-device sessions and browser WebSocket networking. **No LAN success is claimed.**
- Multiplayer role HUD/gameplay on connected devices. The role rules are tested in EditMode; real WebGL Lost Sheep testing used solo rescue.
- Manual Editor Play Mode, native graphical controls, macOS execution, real phones/emulators, full-round completion for the other four Unity games, and all character selections in the Unity player.
- Visual polish and accessibility of the prototype IMGUI UI, browser-account inventory merging, host migration, richer runner/fishing/survival content.

Unity binaries, imported Library/Temp data and logs remain local and ignored. Generated scene, asset metadata, project settings and package lock are retained for reproducible source setup. Existing artwork and third-party licenses are preserved.
