// Run from the repository root after installing API Anything in .tools/api-anything:
// API_ANYTHING_LOCAL_ONLY=1 node .tools/api-anything/node_modules/tsx/dist/cli.mjs scripts/research-playmessages.mts
// Read-only public metadata. Never incurs vidIQ credits. Captions are separately permissioned files.
import { Agent, setGlobalDispatcher } from "../node_modules/undici/index.js";
import { call } from "../.tools/api-anything/src/index.ts";
import fs from "node:fs/promises";
setGlobalDispatcher(new Agent({ maxHeaderSize: 131072 }));
const ids = [
  "WjWDkhQvZtM",
  "IHoQutb7FHg",
  "cyKzgs5EPeg",
  "IW6HGtwJliU",
  "hjhIW911Z44",
  "Ql6DuJReaC4",
  "IRl718MrEOg",
  "06xvxw5ePKs",
  "eEQyhPZPpxU",
  "I4cQ6D2ERuo",
];
const sources = [];
for (const id of ids) {
  const r = await call("youtube", "getVideo", { videoId: id }, { maxTier: 1 });
  if (!r.ok)
    throw Error(`Metadata unavailable for ${id}: ${JSON.stringify(r)}`);
  if (r.data.channelId !== "UC4l8WmdF9ivMDQHHVOdYKqQ")
    throw Error("Unexpected source channel");
  sources.push({ id, ...r.data });
  console.log(id, r.data.title);
}
await fs.writeFile(
  "public/playmessages/sources.json",
  JSON.stringify(
    {
      retrieved: "2026-11-08",
      tool: "goodnight000/api-anything",
      channel: "https://www.youtube.com/@davidantwi",
      sources,
    },
    null,
    2,
  ) + "\n",
);
