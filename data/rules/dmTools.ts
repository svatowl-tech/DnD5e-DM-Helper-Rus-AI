
import { RuleSection } from "../../types";

export const RULES_DM_TOOLS: RuleSection[] = [
  {
    id: 'character_leveling',
    title: 'Уровни Персонажа',
    category: 'dm',
    table: [
      { label: 'Ур 1', value: '0 XP (+2 БМ)' },
      { label: 'Ур 2', value: '300 XP (+2 БМ)' },
      { label: 'Ур 3', value: '900 XP (+2 БМ)' },
      { label: 'Ур 4', value: '2,700 XP (+2 БМ)' },
      { label: 'Ур 5', value: '6,500 XP (+3 БМ)' },
      { label: 'Ур 6', value: '14,000 XP (+3 БМ)' },
      { label: 'Ур 7', value: '23,000 XP (+3 БМ)' },
      { label: 'Ур 8', value: '34,000 XP (+3 БМ)' },
      { label: 'Ур 9', value: '48,000 XP (+4 БМ)' },
      { label: 'Ур 10', value: '64,000 XP (+4 БМ)' },
      { label: 'Ур 11', value: '85,000 XP (+4 БМ)' },
      { label: 'Ур 12', value: '100,000 XP (+4 БМ)' },
      { label: 'Ур 13', value: '120,000 XP (+5 БМ)' },
      { label: 'Ур 14', value: '140,000 XP (+5 БМ)' },
      { label: 'Ур 15', value: '165,000 XP (+5 БМ)' },
      { label: 'Ур 16', value: '195,000 XP (+5 БМ)' },
      { label: 'Ур 17', value: '225,000 XP (+6 БМ)' },
      { label: 'Ур 18', value: '265,000 XP (+6 БМ)' },
      { label: 'Ур 19', value: '305,000 XP (+6 БМ)' },
      { label: 'Ур 20', value: '355,000 XP (+6 БМ)' }
    ]
  },
  {
    id: 'difficulty_class',
    title: 'Сложность (DC)',
    category: 'dm',
    table: [
      { label: 'Примитивная', value: '5' },
      { label: 'Легкая', value: '10' },
      { label: 'Средняя', value: '15' },
      { label: 'Тяжелая', value: '20' },
      { label: 'Очень тяжелая', value: '25' },
      { label: 'Почти невозможная', value: '30' }
    ]
  }
];
