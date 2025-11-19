import { Condition } from "./types";

export const CONDITIONS: Condition[] = [
  { id: 'blinded', name: 'Ослеплен (Blinded)', description: "Не видит. Атаки по нему с преимуществом. Его атаки с помехой." },
  { id: 'charmed', name: 'Очарован (Charmed)', description: "Не может атаковать очаровавшего. У очаровавшего преимущество на социальные взаимодействия." },
  { id: 'deafened', name: 'Оглушен (Deafened)', description: "Ничего не слышит. Проваливает проверки на слух." },
  { id: 'frightened', name: 'Испуган (Frightened)', description: "Помеха на проверки/атаки, пока видит источник страха. Не может подойти ближе." },
  { id: 'grappled', name: 'Схвачен (Grappled)', description: "Скорость 0." },
  { id: 'incapacitated', name: 'Недееспособен (Incapacitated)', description: "Нет действий и реакций." },
  { id: 'invisible', name: 'Невидим (Invisible)', description: "Атаки по нему с помехой. Его атаки с преимуществом." },
  { id: 'paralyzed', name: 'Парализован (Paralyzed)', description: "Недееспособен. Провал спасбросков Силы/Ловкости. Атаки в пределах 5 футов — криты." },
  { id: 'poisoned', name: 'Отравлен (Poisoned)', description: "Помеха на броски атаки и проверки характеристик." },
  { id: 'prone', name: 'Сбит с ног (Prone)', description: "Только ползком. Атаки в ближнем бою по цели — преимущество. Дальние — помеха." },
  { id: 'restrained', name: 'Опутан (Restrained)', description: "Скорость 0. Помеха на спасброски Ловкости. Атаки по цели с преимуществом." },
  { id: 'stunned', name: 'Ошеломлен (Stunned)', description: "Недееспособен. Провал спасбросков Силы/Ловкости. Атаки по цели с преимуществом." },
  { id: 'unconscious', name: 'Бессознателен (Unconscious)', description: "Недееспособен. Роняет предметы. Провал спасбросков Силы/Ловкости. Атаки в пределах 5 футов — криты." },
];

export const SAMPLE_COMBATANTS = [
  { id: 'c1', name: 'Торин', type: 'PLAYER', initiative: 18, hp: 45, maxHp: 45, ac: 18, conditions: [], notes: '' },
  { id: 'c2', name: 'Элара', type: 'PLAYER', initiative: 12, hp: 32, maxHp: 32, ac: 14, conditions: [], notes: '' },
  { id: 'm1', name: 'Гоблин Босс', type: 'MONSTER', initiative: 15, hp: 21, maxHp: 21, ac: 17, conditions: [], notes: 'Ржавый тесак' },
];