
import { RuleSection } from "../types";
import { RULES_ABILITY_CHECKS } from "./rules/abilityChecks";
import { RULES_COMBAT } from "./rules/combat";
import { RULES_EQUIPMENT } from "./rules/equipmentRules";
import { RULES_EXPLORATION } from "./rules/exploration";
import { RULES_DM_TOOLS } from "./rules/dmTools";
import { RULES_SOCIAL } from "./rules/social";
import { RULES_MAGIC } from "./rules/magic";
import { RULES_ALCHEMY } from "./rules/alchemy";
import { RULES_IMPROVISATION } from "./rules/improvisation";
import { RULES_PREPARATION } from "./rules/preparation";
import { RULES_COMBAT_EVENTS } from "./rules/combatEvents";
import { RULES_MASS_COMBAT } from "./rules/massCombat";
import { RULES_LAZY_DM } from "./rules/lazyDm";
import { RULES_CRAFTING } from "./rules/crafting";

export const RULES_DATA: RuleSection[] = [
  ...RULES_LAZY_DM,
  ...RULES_ABILITY_CHECKS,
  ...RULES_COMBAT,
  ...RULES_COMBAT_EVENTS,
  ...RULES_MASS_COMBAT,
  ...RULES_EQUIPMENT,
  ...RULES_EXPLORATION,
  ...RULES_DM_TOOLS,
  ...RULES_SOCIAL,
  ...RULES_MAGIC,
  ...RULES_ALCHEMY,
  ...RULES_CRAFTING,
  ...RULES_IMPROVISATION,
  ...RULES_PREPARATION
];