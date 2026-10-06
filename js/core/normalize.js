/** Normalizace textu pro porovnání: malá písmena, oříznuté okraje, sloučené mezery. */
export function normalize(text) {
  return String(text ?? '').toLowerCase().trim().replace(/\s+/g, ' ');
}
