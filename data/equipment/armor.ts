
import { EquipmentItem } from "../../types";

export const EQUIPMENT_ARMOR: EquipmentItem[] = [
  // Легкий
  { index: "padded", name: "Стёганный", category: "Легкий доспех", cost: "5 зм", weight: 8, ac: 11, dexBonus: true, stealthDisadvantage: true, description: "КД 11 + Мод. Лвк" },
  { index: "leather", name: "Кожаный", category: "Легкий доспех", cost: "10 зм", weight: 10, ac: 11, dexBonus: true, description: "КД 11 + Мод. Лвк" },
  { index: "studded-leather", name: "Проклёпанная кожа", category: "Легкий доспех", cost: "45 зм", weight: 13, ac: 12, dexBonus: true, description: "КД 12 + Мод. Лвк" },
  
  // Средний
  { index: "hide", name: "Шкурный", category: "Средний доспех", cost: "10 зм", weight: 12, ac: 12, dexBonus: true, maxDexBonus: 2, description: "КД 12 + Мод. Лвк (макс. 2)" },
  { index: "chain-shirt", name: "Кольчужная рубаха", category: "Средний доспех", cost: "50 зм", weight: 20, ac: 13, dexBonus: true, maxDexBonus: 2, description: "КД 13 + Мод. Лвк (макс. 2)" },
  { index: "scale-mail", name: "Чешуйчатый", category: "Средний доспех", cost: "50 зм", weight: 45, ac: 14, dexBonus: true, maxDexBonus: 2, stealthDisadvantage: true, description: "КД 14 + Мод. Лвк (макс. 2)" },
  { index: "breastplate", name: "Кираса", category: "Средний доспех", cost: "400 зм", weight: 20, ac: 14, dexBonus: true, maxDexBonus: 2, description: "КД 14 + Мод. Лвк (макс. 2)" },
  { index: "half-plate", name: "Полулаты", category: "Средний доспех", cost: "750 зм", weight: 40, ac: 15, dexBonus: true, maxDexBonus: 2, stealthDisadvantage: true, description: "КД 15 + Мод. Лвк (макс. 2)" },
  
  // Тяжелый
  { index: "ring-mail", name: "Колечный", category: "Тяжелый доспех", cost: "30 зм", weight: 40, ac: 14, dexBonus: false, stealthDisadvantage: true, description: "КД 14" },
  { index: "chain-mail", name: "Кольчуга", category: "Тяжелый доспех", cost: "75 зм", weight: 55, ac: 16, dexBonus: false, strReq: 13, stealthDisadvantage: true, description: "КД 16 (Сила 13)" },
  { index: "splint", name: "Наборный", category: "Тяжелый доспех", cost: "200 зм", weight: 60, ac: 17, dexBonus: false, strReq: 15, stealthDisadvantage: true, description: "КД 17 (Сила 15)" },
  { index: "plate", name: "Латы", category: "Тяжелый доспех", cost: "1500 зм", weight: 65, ac: 18, dexBonus: false, strReq: 15, stealthDisadvantage: true, description: "КД 18 (Сила 15)" },
  
  // Щит
  { index: "shield", name: "Щит", category: "Щит", cost: "10 зм", weight: 6, ac: 2, dexBonus: false, description: "+2 к КД" }
];
