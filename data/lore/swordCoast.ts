
import { LoreEntry } from "../../types";
import { LORE_SWORD_COAST_NORTH } from "./swordCoastNorth";
import { LORE_SWORD_COAST_SOUTH } from "./swordCoastSouth";

export const LORE_SWORD_COAST: LoreEntry[] = [
  ...LORE_SWORD_COAST_NORTH,
  ...LORE_SWORD_COAST_SOUTH
];
