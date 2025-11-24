
import { EquipmentItem } from "../types";
import { EQUIPMENT_WEAPONS } from "./equipment/weapons";
import { EQUIPMENT_ARMOR } from "./equipment/armor";
import { EQUIPMENT_GEAR } from "./equipment/gear";

export type { EquipmentItem };

export const EQUIPMENT_DB: EquipmentItem[] = [
  ...EQUIPMENT_WEAPONS,
  ...EQUIPMENT_ARMOR,
  ...EQUIPMENT_GEAR
];
