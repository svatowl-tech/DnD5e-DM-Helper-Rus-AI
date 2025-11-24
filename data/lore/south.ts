
import { LoreEntry } from "../../types";
import { LORE_AMN } from "./amn";
import { LORE_TETHYR } from "./tethyr";
import { LORE_CHULT } from "./chult";
import { LORE_ERLKAZAR } from "./erlkazar";
import { LORE_MURANNDIN } from "./muranndin";
import { LORE_CALIMSHAN } from "./calimshan";
import { LORE_EASTERN_SHAAR } from "./easternShaar";
import { LORE_SHINING_LANDS } from "./shiningLands";
import { LORE_LUIREN } from "./luiren";
import { LORE_DAMBRATH } from "./dambrath";
import { LORE_HALRUAA } from "./halruaa";
import { LORE_ELFHARROW } from "./elfharrow";
import { LORE_SERPENTES } from "./serpentes";
import { LORE_TASHALAR } from "./tashalar";
import { LORE_THINDOL } from "./thindol";
import { LORE_SAMARACH } from "./samarach";

export const LORE_SOUTH: LoreEntry[] = [
  ...LORE_AMN,
  ...LORE_MURANNDIN,
  ...LORE_TETHYR,
  ...LORE_CALIMSHAN,
  ...LORE_CHULT,
  ...LORE_SAMARACH,
  ...LORE_SERPENTES,
  ...LORE_TASHALAR,
  ...LORE_THINDOL,
  ...LORE_ERLKAZAR,
  ...LORE_ELFHARROW,
  ...LORE_DAMBRATH,
  ...LORE_EASTERN_SHAAR,
  ...LORE_SHINING_LANDS,
  ...LORE_LUIREN,
  ...LORE_HALRUAA
];
