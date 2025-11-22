
import { Condition } from "./types";

export const CONDITIONS: Condition[] = [
  { id: 'blinded', name: 'Ослеплен (Blinded)', description: "Авто-провал проверок зрения. Атаки по существу с преимуществом, атаки существа - с помехой." },
  { id: 'charmed', name: 'Очарован (Charmed)', description: "Не может причинить вред искусителю. Искуситель имеет преимущество в социальных проверках." },
  { id: 'deafened', name: 'Оглохший (Deafened)', description: "Ничего не слышит. Авто-провал проверок на слух." },
  { id: 'frightened', name: 'Испуган (Frightened)', description: "Помеха на проверки/атаки, пока видит источник страха. Не может добровольно приблизиться к источнику." },
  { id: 'grappled', name: 'Схвачен (Grappled)', description: "Скорость 0. Проходит, если схвативший недееспособен или если эффект отбрасывает существо." },
  { id: 'incapacitated', name: 'Недееспособен (Incapacitated)', description: "Существо не может совершать действия и реакции." },
  { id: 'invisible', name: 'Невидим (Invisible)', description: "Считается сильно заслонённым. Атаки по нему с помехой. Его атаки с преимуществом." },
  { id: 'paralyzed', name: 'Парализован (Paralyzed)', description: "Недееспособен, не двигается/говорит. Провал спасбросков STR/DEX. Атаки по нему с преимуществом (крит, если в 5 футах)." },
  { id: 'petrified', name: 'Окаменевший (Petrified)', description: "Вес x10. Иммунитет к яду/болезням. Сопротивление всему урону. Провал спасбросков STR/DEX." },
  { id: 'poisoned', name: 'Отравлен (Poisoned)', description: "Помеха на броски атаки и проверки характеристик." },
  { id: 'prone', name: 'Лежит ничком (Prone)', description: "Только ползком. Атаки в ближнем бою по цели — преимущество. Дальние — помеха. Встать стоит половину скорости." },
  { id: 'restrained', name: 'Опутан (Restrained)', description: "Скорость 0. Атаки по существу с преимуществом, его атаки с помехой. Помеха на спасброски DEX." },
  { id: 'stunned', name: 'Ошеломлен (Stunned)', description: "Недееспособен, не двигается. Провал спасбросков STR/DEX. Атаки по нему с преимуществом." },
  { id: 'unconscious', name: 'Бессознателен (Unconscious)', description: "Роняет предметы, падает ничком. Провал спасбросков STR/DEX. Атаки по нему с преимуществом (крит, если в 5 футах)." },
  { id: 'exhaustion', name: 'Истощение (Exhaustion)', description: "См. таблицу уровней истощения в правилах." },
];

export const SAMPLE_COMBATANTS = [
  { id: 'c1', name: 'Торин', type: 'PLAYER', initiative: 18, hp: 45, maxHp: 45, ac: 18, conditions: [], notes: '' },
  { id: 'c2', name: 'Элара', type: 'PLAYER', initiative: 12, hp: 32, maxHp: 32, ac: 14, conditions: [], notes: '' },
  { id: 'm1', name: 'Гоблин Босс', type: 'MONSTER', initiative: 15, hp: 21, maxHp: 21, ac: 17, conditions: [], notes: 'Ржавый тесак' },
];
