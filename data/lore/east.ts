
import { LoreEntry } from "../../types";
import { LORE_ENDLESS_WASTES } from "./endlessWastes";
import { LORE_MULHORAND } from "./mulhorand";
import { LORE_OKOTH } from "./okoth";
import { LORE_TYMANTHER } from "./tymanther";
import { LORE_UNTHER } from "./unther";
import { LORE_CHESSENTA } from "./chessenta";
import { LORE_AKANUL } from "./akanul";
import { LORE_SESPECH } from "./sespech";
import { LORE_TURMISH } from "./turmish";
import { LORE_PLAINS_OF_PURPLE_DUST } from "./plainsOfPurpleDust";

export const LORE_EAST: LoreEntry[] = [
  ...LORE_MULHORAND,
  ...LORE_UNTHER,
  ...LORE_CHESSENTA,
  ...LORE_AKANUL,
  ...LORE_SESPECH,
  ...LORE_TURMISH,
  ...LORE_OKOTH,
  ...LORE_TYMANTHER,
  ...LORE_PLAINS_OF_PURPLE_DUST,
  ...LORE_ENDLESS_WASTES,
  {
    id: "thay",
    name: "Тэй (Thay)",
    description: "Магократия Красных Волшебников на востоке. Плато, возвышающееся над окружающими землями. Страна рабства, некромантии и жестокой магии. Климат искусственно изменен магией.",
    capital: "Эльтбаббар",
    ruler: "Сцзас Там (Зулкир Некромантии)",
    population: "Люди (Тэйцы), Рабы (все расы), Нежить",
    locations: [
      {
        name: "Эльтбаббар (Eltabbar)",
        type: "Столица",
        description: "Резиденция Зулкиров. Огромный город с магическими башнями и рабскими кварталами.",
        atmosphere: "Запах озона и крови, патрули нежити, величие и страх.",
        npcs: [
            { name: "Сцзас Там", race: "Лич", description: "Правитель", personality: "Холодный стратег" }
        ],
        secrets: ["Под городом есть портал в Девять Преисподних.", "Тайный культ Ильматера."],
        monsters: ["Red Wizard", "Lich", "Skeleton"],
        loot: ["Магические предметы", "Рабские контракты"],
        quests: []
      },
      {
        name: "Таймаунт (Thaymount)",
        type: "Вулканическое плато",
        description: "Вулканический массив в центре региона. Главный центр магической силы и крепостей Зулкиров.",
        atmosphere: "Пепел, лава, черные башни, невыносимый жар.",
        npcs: [],
        secrets: ["Обитают красные драконы.", "Здесь создают ужасных магических гибридов."],
        monsters: ["Red Dragon", "Fire Elemental", "Chimera"],
        loot: ["Обсидиан", "Огненные камни"],
        quests: []
      },
      {
        name: "Уступ Сурага (Surague Escarpment)",
        type: "Скала",
        description: "Крутой обрыв на границе с Агларондом, высотой в сотни футов. Естественная и магическая защита Тэя.",
        atmosphere: "Ветра, патрули на вивернах, магические ловушки.",
        npcs: [],
        secrets: ["Пещеры в скале ведут в Подземье.", "Гарпии гнездятся на уступах."],
        monsters: ["Harpy", "Wyvern", "Gargoyle"],
        loot: [],
        quests: []
      },
      {
        name: "Марши Амбера (Umber Marshes)",
        type: "Болото",
        description: "Болотистая местность на северо-западе. Первая линия обороны Агларонда, но частично контролируется Тэем.",
        atmosphere: "Ядовитые испарения, нежить в воде, болезни.",
        npcs: [],
        secrets: ["Некроманты поднимают здесь армии мертвецов.", "Обитают стриги."],
        monsters: ["Zombie", "Ghoul", "Hag"],
        loot: ["Яды"],
        quests: []
      },
      {
        name: "Река Тэй (River Thay)",
        type: "Река",
        description: "Главная река, берущая начало в Таймаунте. Воды насыщены магией.",
        atmosphere: "Странное свечение воды, мутации флоры на берегах.",
        npcs: [],
        secrets: ["Вода усиливает магию огня.", "Используется для транспортировки рабов."],
        monsters: ["Water Weird", "Mutant Beast"],
        loot: ["Магическая вода"],
        quests: []
      },
      {
        name: "Озеро Тайламбар (Lake Thaylambar)",
        type: "Озеро",
        description: "Крупнейшее озеро в центре. Воды алые от отражения красных скал Таймаунта.",
        atmosphere: "Кроваво-красная вода, тишина, магические эксперименты на берегах.",
        npcs: [],
        secrets: ["В озере живут водные чудовища.", "На дне есть лаборатория."],
        monsters: ["Aboleth", "Chuul"],
        loot: [],
        quests: []
      }
    ]
  }
];
