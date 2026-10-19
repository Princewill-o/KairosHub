# Supplied artwork

## Landing screenshots (October 2026)

`public/assets/previews/` contains actual browser captures of the library, Bible Quiz and Bible Memory Game using a fictional local “Explorer” profile. They illustrate the landing page and post-signup tutorial. The previous intro video is no longer mounted or played; its original assets remain available on disk.

This rebuild uses the user's three local packs, rather than the previous generated illustrations.

- `dist/assets/icons/`: selected, resized PNGs from `Free Cartoon Icon Pack (1)`. The source names are retained. No license text was included in the supplied folder; no additional rights are asserted here.
- `dist/assets/ui/`: selected purple, yellow, green, and white assets from `cartoon_ui_pack`. File names identify palette and original purpose. No license text was included in the supplied folder.
- `dist/assets/fantasy/`: selected assets from `Cute_Fantasy_Free`. Player, sheep, and chicken are first-frame crops of the supplied sprite sheets; the other PNGs are copied directly. Its supplied `read_me.txt` is retained as `LICENSE.txt`.

The Cute Fantasy Free license permits non-commercial projects and modification, and prohibits redistributing or reselling the asset pack. This is a non-commercial game prototype; do not sell or redistribute the pack as a standalone asset product. Obtain the appropriate commercial license before commercial use.

Environments are composed in HTML/CSS using the supplied sprites; the journey map is a purpose-built approximate SVG diagram. No remote imagery or newly generated artwork is required.

The 2D adventures reuse the supplied player, sheep, tree, grass, water, house, and scroll/icon art. `player-walk.png` is a local crop of the supplied player sprite sheet used for a small walking animation. The generated map geometry contains no additional imagery.

## Kairos Games opening screen

`public/assets/intro/poster.webp` is a web-optimized copy of the user-supplied `Gemini_Generated_Image_6gl2736gl2736gl2.jpeg`. `public/assets/intro/intro.mp4` is a streaming-optimized H.264/AAC copy of the supplied `make_the_bird_and_the_backgrou.mp4` (approximately 10 seconds). The original files in Downloads are unchanged.

The fullscreen overlay is isolated in `public/intro.css` and `public/intro.mjs`, mounted by `public/index.html`. Pressing the image starts the video with its audio; completion fades into the mounted site. Portrait screens preserve the complete artwork over a blurred fullscreen backdrop. Skip, keyboard activation, reduced-motion fades, and playback-error recovery are supported. `server/intro-media.mjs` handles media byte ranges for streaming and seeking.

## September 2026 arcade checkpoint

The user explicitly requested original sprites and then prohibited emoji icons. `public/assets/arcade/characters.png`, `walk.png`, `creatures.png`, and `world.webp` were generated with the built-in image-generation tool for this request. The walk atlas has genuine alpha, four frames per row, and four character rows; the runtime cycles frames while moving, with reduced-motion support. The creature atlas is a 4x4 illustrated asset sheet, composited with multiply in the browser because its supplied output is opaque white. It is not an emoji font. `artwork/world-source.png` retains the full original scenic image.

`public/assets/handmade/asset-N.png` are unchanged copies of the supplied `Game_ui_pack_handmade_bakudas/PNG - shaded/Asset Nshaded_@2x.png`. Renamed for reliable URL handling. No license was supplied in that folder; no extra rights are asserted. Existing asset licenses are retained.

Prompts: four original child explorers in a cel-shaded PS2-inspired storybook style; four consecutive walking poses for each explorer in a 4x4 atlas; a 4x4 sheet of lion, sheep, rabbit, fox, bear, owl, elephant, turtle, three fish, boot, frog, ice crystal, wolf and shrub; a colourful ark/meadow/lake/desert landscape. Full generation prompts are recorded in the task conversation. No generated image replaces the supplied opening movie.

## Guide characters and the hero scene (October 2026)

`public/bible/mascot.mjs` draws five original child characters (Kai, Ama, Leo, Mei and Theo), each with its own skin tone, hair style, outfit and details, as hand-written SVG paths: five poses (wave, cheer, think, encourage, read), a head-and-shoulders bust, a lamb companion and the library hero scene (hills, path, sun, clouds, olive tree). It was authored for this project at the user's request. It uses no supplied pack, emoji, icon font or generated bitmap, and it has no third-party licence restrictions. Colours and outline weight follow the tokens in `public/theme.css`.

## Dove logo (October 2026)

`public/assets/brand/dove.svg` and `dove-badge.svg` are vector traces of the dove-with-olive-branch line drawing the user supplied, keeping its exact shape and restyled in the site's cartoon look: white strokes, a plum outline and a hard offset shadow. `apple-touch-icon.png`, `icon-192.png` and `icon-512.png` are renders of the badge on a full violet square. They replace the Books icon as the site logo and app icon.

## Kairos World assets (20 October 2026)

`public/world3d`, `public/world`, `public/characters`, `public/campaign`, and `public/brand/kharis-mark.png` were copied from the user's local KairosLife project for this integration. Original Blender sources for the church, bus, mountains, toy residents and four Bible scenes are retained in `world-runtime/art-sources/`, alongside their generation scripts. The reference-based Kharis model and Kharis mark retain the original project's provenance; this integration asserts no new rights over church branding or user-supplied references. The preview on Together is a render of the imported church model.

Kenney kit license files supplied with the original assets are retained in `world-runtime/art-sources/licenses/`. World artwork is used within the game and is not distributed as a standalone asset pack. Existing KairosHub artwork and license files remain intact.
