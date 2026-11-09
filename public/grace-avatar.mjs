import { normalizeAvatar } from "./avatar.mjs";
export function worldAppearance(raw) {
  const a = normalizeAvatar(raw);
  return {
    hair:
      "hair-" +
      ({ crop: "buzz", swoop: "short", puffs: "buns" }[a.hair] || a.hair),
    top:
      "top-" +
      ({ jacket: "denim", tunic: "knit", tshirt: "tee", overalls: "apron" }[
        a.outfit
      ] || a.outfit),
    bottom:
      "bottom-" +
      ({ jeans: "jeans", cargo: "cargo", chinos: "smart", shorts: "shorts" }[
        a.trousers
      ] || "jeans"),
    graceAppearance: a,
  };
}
