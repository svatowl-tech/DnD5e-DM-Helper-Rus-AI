
import { Condition } from "./types";

export const CONDITIONS: Condition[] = [
  { id: 'blinded', name: 'Ослеплен (Blinded)', description: "Не видит. Автопровал проверок зрения. Атаки по нему с преимуществом, его атаки с помехой." },
  { id: 'charmed', name: 'Очарован (Charmed)', description: "Не может атаковать искусителя. Искуситель имеет преимущество в социальных взаимодействиях." },
  { id: 'deafened', name: 'Оглохший (Deafened)', description: "Не слышит. Автопровал проверок слуха." },
  { id: 'frightened', name: 'Испуган (Frightened)', description: "Помеха на проверки/атаки, пока видит источник. Не может добровольно приблизиться." },
  { id: 'grappled', name: 'Схвачен (Grappled)', description: "Скорость 0. Заканчивается, если схвативший недееспособен или существо отброшено." },
  { id: 'incapacitated', name: 'Недееспособен (Incapacitated)', description: "Не может совершать действия и реакции." },
  { id: 'invisible', name: 'Невидим (Invisible)', description: "Сильно укрыт. Атаки по нему с помехой, его атаки с преимуществом." },
  { id: 'paralyzed', name: 'Парализован (Paralyzed)', description: "Недееспособен, не двигается. Провал СИЛ/ЛОВ. Атаки по нему с преимуществом (Крит в 5фт)." },
  { id: 'petrified', name: 'Окаменевший (Petrified)', description: "Вес x10. Сопротивление всему урону. Иммунитет к яду/болезням. Провал СИЛ/ЛОВ." },
  { id: 'poisoned', name: 'Отравлен (Poisoned)', description: "Помеха на броски атаки и проверки характеристик." },
  { id: 'prone', name: 'Сбит с ног (Prone)', description: "Только ползком. Атаки вблизи по цели — преимущество, издали — помеха. Его атаки с помехой." },
  { id: 'restrained', name: 'Опутан (Restrained)', description: "Скорость 0. Атаки по нему с преимуществом, его атаки с помехой. Провал ЛОВ." },
  { id: 'stunned', name: 'Ошеломлен (Stunned)', description: "Недееспособен, не двигается. Провал СИЛ/ЛОВ. Атаки по нему с преимуществом." },
  { id: 'unconscious', name: 'Бессознателен (Unconscious)', description: "Недееспособен, падает, роняет вещи. Провал СИЛ/ЛОВ. Атаки по нему с преимуществом (Крит в 5фт)." },
  { id: 'exhaustion', name: 'Истощение (Exhaustion)', description: "Ур 1: Помеха проверкам. Ур 2: Скор/2. Ур 3: Помеха атакам. Ур 4: ХП/2. Ур 5: Скор 0. Ур 6: Смерть." },
];

export const SAMPLE_COMBATANTS = [
  { id: 'c1', name: 'Торин', type: 'PLAYER', initiative: 18, hp: 45, maxHp: 45, ac: 18, conditions: [], notes: '' },
  { id: 'c2', name: 'Элара', type: 'PLAYER', initiative: 12, hp: 32, maxHp: 32, ac: 14, conditions: [], notes: '' },
  { id: 'm1', name: 'Гоблин Босс', type: 'MONSTER', initiative: 15, hp: 21, maxHp: 21, ac: 17, conditions: [], notes: 'Ржавый тесак' },
];
