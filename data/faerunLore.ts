
import { LoreEntry } from "../../types";
// New split files
import { LORE_ICEWIND_DALE } from "./lore/icewindDale";
import { LORE_SAVAGE_FRONTIER } from "./lore/savageFrontier";
import { LORE_SILVER_MARCHES } from "./lore/silverMarches";
import { LORE_HIGH_FOREST } from "./lore/highForest";
import { LORE_COLD_RUN } from "./lore/coldRun";
import { LORE_HARTSVALE } from "./lore/hartsvale";
import { LORE_HIGH_ICE } from "./lore/highIce";
import { LORE_NAKVALIGACH } from "./lore/nakvaligach";
import { LORE_ANGALPUK } from "./lore/angalpuk";
import { LORE_LANTAN } from "./lore/lantan";
import { LORE_THAR } from "./lore/thar";
import { LORE_ALARON } from "./lore/alaron";
import { LORE_GWYNNETH } from "./lore/gwynneth";

import { LORE_SWORD_COAST } from "./lore/swordCoast";
import { LORE_HEARTLANDS } from "./lore/heartlands";
import { LORE_EAST } from "./lore/east";
import { LORE_SOUTH } from "./lore/south";
import { LORE_UNDERDARK } from "./lore/underdark";
import { LORE_SEA_OF_FALLEN_STARS } from "./lore/seaOfFallenStars";
import { LORE_ANAUROCH } from "./lore/anauroch";
import { LORE_SEMBIA } from "./lore/sembia";
import { LORE_DALELANDS } from "./lore/dalelands";
import { LORE_CORMANTHOR } from "./lore/cormanthor";
import { LORE_MOONSEA } from "./lore/moonsea";
import { LORE_VAASA } from "./lore/vaasa";
import { LORE_VAST } from "./lore/vast";
import { LORE_IMPILTUR } from "./lore/impiltur";
import { LORE_THE_GREAT_DALE } from "./lore/theGreatDale";
import { LORE_NARFELL } from "./lore/narfell";
import { LORE_THESK } from "./lore/thesk";
import { LORE_DAMARA } from "./lore/damara";
import { LORE_SEA_OF_SWORDS } from "./lore/seaOfSwords";
import { LORE_VESPERIN } from "./lore/vesperin";
import { LORE_FLOODED_FOREST } from "./lore/floodedForest";
import { LORE_GRAY_FOREST } from "./lore/grayForest";
import { LORE_EVERESKA } from "./lore/evereska";
import { LORE_NAJARA } from "./lore/najara";
import { LORE_ELTURGARD } from "./lore/elturgard";
import { LORE_AGLAROND } from "./lore/aglarond";
import { LORE_MURGHOM } from "./lore/murghom";
import { LORE_WILD_LANDS } from "./lore/wildLands";

// Combine all regions into one export
export const FAERUN_LORE: LoreEntry[] = [
    ...LORE_SWORD_COAST,
    ...LORE_SEA_OF_SWORDS,
    // Replaced LORE_NORTH with specific files
    ...LORE_ICEWIND_DALE,
    ...LORE_COLD_RUN,
    ...LORE_SAVAGE_FRONTIER,
    ...LORE_SILVER_MARCHES,
    ...LORE_HIGH_FOREST,
    ...LORE_HARTSVALE,
    ...LORE_HIGH_ICE,
    ...LORE_NAKVALIGACH,
    ...LORE_ANGALPUK,
    ...LORE_LANTAN,
    ...LORE_THAR,
    ...LORE_ALARON,
    ...LORE_GWYNNETH,
    // ---------------------------
    ...LORE_MOONSEA,
    ...LORE_EVERESKA,
    ...LORE_FLOODED_FOREST,
    ...LORE_GRAY_FOREST,
    ...LORE_NAJARA,
    ...LORE_ELTURGARD,
    ...LORE_VAASA,
    ...LORE_DAMARA,
    ...LORE_VAST,
    ...LORE_AGLAROND,
    ...LORE_VESPERIN,
    ...LORE_IMPILTUR,
    ...LORE_THE_GREAT_DALE,
    ...LORE_NARFELL,
    ...LORE_THESK,
    ...LORE_MURGHOM,
    ...LORE_HEARTLANDS,
    ...LORE_SEMBIA,
    ...LORE_DALELANDS,
    ...LORE_CORMANTHOR,
    ...LORE_SOUTH,
    ...LORE_EAST,
    ...LORE_UNDERDARK,
    ...LORE_SEA_OF_FALLEN_STARS,
    ...LORE_ANAUROCH,
    ...LORE_WILD_LANDS
];
