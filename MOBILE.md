# Mobile web checkpoint

Kairos runs as a browser app. The interface uses Apple system fonts, four bottom tabs on phones/tablets, safe-area padding, large touch targets, a responsive game canvas and a true-black dark palette. It is not a React Native binary. On iPhone, Safari's Share > Add to Home Screen opens it as a standalone web app when served from a suitable hosted URL. Browser zoom remains enabled.

Unity routes now redirect to browser games. The Unity launcher/style files have moved into `unity/legacy-web/`; Unity exports are no longer served by `npm run dev`. Archived source is retained for future work.

Touch directions track each pointer independently and release on cancellation/lost capture. Losing focus clears movement. Local HTTP Wi-Fi play uses `crypto.getRandomValues` when `randomUUID` is unavailable. Changing the theme preserves the active match and connection. The intro still requires a user gesture for audio/video and provides a skip button.

## Check the app

Run `npm run dev`, then `npm run test:mobile` for WebKit/iPhone emulation. Run `MOBILE_BROWSER=chrome npm run test:mobile` for Chrome touch emulation. The test accepts optional `PLAYWRIGHT_MODULE` and `WEBKIT_EXECUTABLE` paths when the host OS needs an older compatible WebKit distribution. Run `npm test`, `npm run test:arcade` and `node tests/arcade-completion.mjs` for additional regression checks.

WebKit automation is not a substitute for a physical iPhone. Before claiming device certification, check portrait/landscape rotation, Safari toolbar expansion, Home Screen launch, the software keyboard, simultaneous movement/action, audio activation and suspend/resume on an actual iPhone/iPad. Test LAN using the laptop's network address, not `localhost` on the phone. Hosted account/multiplayer services must also be deployed for remote access.

Safe-area layout follows [WebKit's iPhone guidance](https://webkit.org/blog/7929/designing-websites-for-iphone-x/).
