
import { LoreEntry } from "../../types";

export const LORE_EAST: LoreEntry[] = [
  {
    id: "thay",
    name: "Тэй (Thay)",
    description: "Империя магов-рабовладельцев. Земля некромантии.",
    capital: "Эльтбаббар",
    ruler: "Сцзас Там (Лич)",
    locations: [
      {
        name: "Эльтбаббар",
        type: "Столица",
        description: "Город нежити и магии.",
        atmosphere: "Страх, величие, марширующие скелеты.",
        npcs: [{ name: "Сцзас Там", race: "Лич", description: "Правитель", personality: "Холодное зло" }],
        secrets: ["Город — гигантский магический круг."],
        monsters: ["Lich", "Red Wizard", "Undead Soldier"],
        loot: ["Некромантские книги"],
        quests: []
      }
    ]
  }
];
