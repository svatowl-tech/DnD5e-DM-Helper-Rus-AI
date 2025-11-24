
import { RuleSection } from "../../types";

export const RULES_COMBAT: RuleSection[] = [
  {
    id: 'death_dying',
    title: 'Смерть и 0 Хитов',
    category: 'combat',
    content: 'Правила при падении до 0 хитов.',
    table: [
      { label: 'Потеря сознания', value: 'При 0 хитов. Падает ничком.' },
      { label: 'Спасбросок смерти', value: '10+ успех. 3 успеха = стабилен. 3 провала = смерть.' },
      { label: 'Крит провал/успех', value: '1 = 2 провала. 20 = 1 хит (встает).' },
      { label: 'Урон при 0 HP', value: 'Попадание = 1 провал. Крит = 2 провала.' },
      { label: 'Мгновенная смерть', value: 'Урон >= Максимум ХП.' }
    ]
  },
  {
    id: 'cover_rules',
    title: 'Укрытие (Cover)',
    category: 'combat',
    table: [
      { label: 'Половина (1/2)', value: '+2 к КД и спасброскам Ловкости.' },
      { label: 'Три четверти (3/4)', value: '+5 к КД и спасброскам Ловкости.' },
      { label: 'Полное', value: 'Нельзя атаковать или нацелиться заклинанием.' }
    ]
  },
  {
    id: 'creature_sizes',
    title: 'Размеры существ',
    category: 'combat',
    table: [
      { label: 'Крошечный (Tiny)', value: '2½ x 2½ фт' },
      { label: 'Маленький (Small)', value: '5 x 5 фт' },
      { label: 'Средний (Medium)', value: '5 x 5 фт' },
      { label: 'Большой (Large)', value: '10 x 10 фт' },
      { label: 'Огромный (Huge)', value: '15 x 15 фт' },
      { label: 'Громадный (Gargantuan)', value: '20 x 20 фт и более' }
    ]
  },
  {
    id: 'combat_actions',
    title: 'Действия в бою',
    category: 'combat',
    list: [
      'Атака (Attack)', 'Рывок (Dash)', 'Отход (Disengage)', 
      'Уклонение (Dodge)', 'Помощь (Help)', 'Засада (Hide)', 
      'Подготовка (Ready)', 'Поиск (Search)', 'Использование предмета'
    ]
  }
];
