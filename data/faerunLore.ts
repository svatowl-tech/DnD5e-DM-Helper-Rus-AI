
import { LoreEntry } from "../types";
import { LORE_NORTH } from "./lore/north";
import { LORE_SWORD_COAST } from "./lore/swordCoast";
import { LORE_HEARTLANDS } from "./lore/heartlands";
import { LORE_EAST } from "./lore/east";
import { LORE_SOUTH } from "./lore/south";
import { LORE_UNDERDARK } from "./lore/underdark";
import { LORE_SEA_OF_FALLEN_STARS } from "./lore/seaOfFallenStars";
import { LORE_ANAUROCH } from "./lore/anauroch";

// Combine all regions into one export
export const FAERUN_LORE: LoreEntry[] = [
    ...LORE_SWORD_COAST,
    ...LORE_NORTH,
    ...LORE_HEARTLANDS,
    ...LORE_SOUTH,
    ...LORE_EAST,
    ...LORE_UNDERDARK,
    ...LORE_SEA_OF_FALLEN_STARS,
    ...LORE_ANAUROCH
];
