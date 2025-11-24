
import { LoreEntry } from "../../types";

export const LORE_AGLAROND: LoreEntry[] = [
  {
    id: "aglarond",
    name: "Агларонд (Aglarond)",
    description: "Магократия на полуострове, защищающая запад от Тхая. Земля полуэльфов и древних лесов. Правит Совет Симбархов.",
    capital: "Велталар",
    ruler: "Совет Симбархов",
    population: "Люди, Полуэльфы, Эльфы",
    locations: [
      {
        name: "Велталар (Veltalar)",
        type: "Столица",
        description: "Крупный порт и магический центр.",
        atmosphere: "Магические огни, морской бриз, эльфийская архитектура.",
        npcs: [
          { name: "Высший Симбарх", race: "Человек", description: "Глава Совета", personality: "Властный" }
        ],
        secrets: ["Шпионы Тхая везде.", "Подполье хочет вернуть монархию."],
        monsters: ["Spy", "Mage"],
        loot: ["Свитки"],
        quests: []
      },
      {
        name: "Стражная Стена (The Watchwall)",
        type: "Укрепление",
        description: "Магическая стена из черного камня длиной 20 миль. Защита от Тхая.",
        atmosphere: "Магический гул, гаргульи, напряжение.",
        npcs: [],
        secrets: ["Магия стены слабеет.", "Некроманты делают подкопы."],
        monsters: ["Gargoyle", "Undead"],
        loot: ["Боевые жезлы"],
        quests: []
      },
      {
        name: "Юирвуд (Yuirwood)",
        type: "Лес",
        description: "Древний лес на юге, дом полуэльфов. Полон магии и менгиров.",
        atmosphere: "Сумерки, светящиеся мхи, древняя магия.",
        npcs: [
          { name: "Хранитель Круга", race: "Друид", description: "Страж", personality: "Загадочный" }
        ],
        secrets: ["Менгиры — это порталы.", "Лес отпугивает армию Тхая."],
        monsters: ["Treant", "Dryad"],
        loot: ["Звездный металл"],
        quests: []
      },
      {
        name: "Марши Амбера (Umber Marshes)",
        type: "Болото",
        description: "Болота на границе с Тхаем. Главная линия обороны.",
        atmosphere: "Гниль, туман, монстры.",
        npcs: [],
        secrets: ["Обитают болотные ведьмы.", "Скрытые тропы контрабандистов."],
        monsters: ["Hag", "Troll", "Lizardfolk"],
        loot: ["Яды"],
        quests: []
      },
      {
        name: "Горы Драконьей Челюсти (Dragonjaw Mountains)",
        type: "Горы",
        description: "Горы на северо-западе полуострова. Частично дикие.",
        atmosphere: "Ветер, скалы, гнезда виверн.",
        npcs: [],
        secrets: ["Здесь есть заброшенные крепости.", "Обитают медные драконы."],
        monsters: ["Wyvern", "Copper Dragon"],
        loot: ["Медь"],
        quests: []
      }
    ]
  }
];
