
import { EquipmentItem } from "../../types";

export const EQUIPMENT_WEAPONS: EquipmentItem[] = [
  // Простое рукопашное
  { index: "club", name: "Дубинка", category: "Простое рукопашное", cost: "1 см", weight: 2, damage: "1к4", damageType: "дробящий", properties: ["Лёгкое"] },
  { index: "dagger", name: "Кинжал", category: "Простое рукопашное", cost: "2 зм", weight: 1, damage: "1к4", damageType: "колющий", range: "20/60", properties: ["Лёгкое", "Фехтовальное", "Метательное"] },
  { index: "greatclub", name: "Палица", category: "Простое рукопашное", cost: "2 см", weight: 10, damage: "1к8", damageType: "дробящий", properties: ["Двуручное"] },
  { index: "handaxe", name: "Ручной топор", category: "Простое рукопашное", cost: "5 зм", weight: 2, damage: "1к6", damageType: "рубящий", range: "20/60", properties: ["Лёгкое", "Метательное"] },
  { index: "javelin", name: "Метательное копьё", category: "Простое рукопашное", cost: "5 см", weight: 2, damage: "1к6", damageType: "колющий", range: "30/120", properties: ["Метательное"] },
  { index: "light-hammer", name: "Лёгкий молот", category: "Простое рукопашное", cost: "2 зм", weight: 2, damage: "1к4", damageType: "дробящий", range: "20/60", properties: ["Лёгкое", "Метательное"] },
  { index: "mace", name: "Булава", category: "Простое рукопашное", cost: "5 зм", weight: 4, damage: "1к6", damageType: "дробящий", properties: [] },
  { index: "quarterstaff", name: "Боевой посох", category: "Простое рукопашное", cost: "2 см", weight: 4, damage: "1к6", damageType: "дробящий", properties: ["Универсальное (1к8)"] },
  { index: "sickle", name: "Серп", category: "Простое рукопашное", cost: "1 зм", weight: 2, damage: "1к4", damageType: "рубящий", properties: ["Лёгкое"] },
  { index: "spear", name: "Копьё", category: "Простое рукопашное", cost: "1 зм", weight: 3, damage: "1к6", damageType: "колющий", range: "20/60", properties: ["Метательное", "Универсальное (1к8)"] },
  { index: "unarmed", name: "Без оружия", category: "Простое рукопашное", cost: "—", weight: 0, damage: "1", damageType: "дробящий", properties: [] },

  // Простое дальнобойное
  { index: "light-crossbow", name: "Арбалет, лёгкий", category: "Простое дальнобойное", cost: "25 зм", weight: 5, damage: "1к8", damageType: "колющий", range: "80/320", properties: ["Боеприпас", "Двуручное", "Перезарядка"] },
  { index: "dart", name: "Дротик", category: "Простое дальнобойное", cost: "5 мм", weight: 0.25, damage: "1к4", damageType: "колющий", range: "20/60", properties: ["Метательное", "Фехтовальное"] },
  { index: "shortbow", name: "Короткий лук", category: "Простое дальнобойное", cost: "25 зм", weight: 2, damage: "1к6", damageType: "колющий", range: "80/320", properties: ["Боеприпас", "Двуручное"] },
  { index: "sling", name: "Праща", category: "Простое дальнобойное", cost: "1 см", weight: 0, damage: "1к4", damageType: "дробящий", range: "30/120", properties: ["Боеприпас"] },

  // Воинское рукопашное
  { index: "battleaxe", name: "Боевой топор", category: "Воинское рукопашное", cost: "10 зм", weight: 4, damage: "1к8", damageType: "рубящий", properties: ["Универсальное (1к10)"] },
  { index: "flail", name: "Цеп", category: "Воинское рукопашное", cost: "10 зм", weight: 2, damage: "1к8", damageType: "дробящий", properties: [] },
  { index: "glaive", name: "Глефа", category: "Воинское рукопашное", cost: "20 зм", weight: 6, damage: "1к10", damageType: "рубящий", properties: ["Двуручное", "Досягаемость", "Тяжёлое"] },
  { index: "greataxe", name: "Секира", category: "Воинское рукопашное", cost: "30 зм", weight: 7, damage: "1к12", damageType: "рубящий", properties: ["Двуручное", "Тяжёлое"] },
  { index: "greatsword", name: "Двуручный меч", category: "Воинское рукопашное", cost: "50 зм", weight: 6, damage: "2к6", damageType: "рубящий", properties: ["Двуручное", "Тяжёлое"] },
  { index: "halberd", name: "Алебарда", category: "Воинское рукопашное", cost: "20 зм", weight: 6, damage: "1к10", damageType: "рубящий", properties: ["Двуручное", "Досягаемость", "Тяжёлое"] },
  { index: "lance", name: "Длинное копьё", category: "Воинское рукопашное", cost: "10 зм", weight: 6, damage: "1к12", damageType: "колющий", properties: ["Досягаемость", "Особое"] },
  { index: "longsword", name: "Длинный меч", category: "Воинское рукопашное", cost: "15 зм", weight: 3, damage: "1к8", damageType: "рубящий", properties: ["Универсальное (1к10)"] },
  { index: "maul", name: "Молот", category: "Воинское рукопашное", cost: "10 зм", weight: 10, damage: "2к6", damageType: "дробящий", properties: ["Двуручное", "Тяжёлое"] },
  { index: "morningstar", name: "Моргенштерн", category: "Воинское рукопашное", cost: "15 зм", weight: 4, damage: "1к8", damageType: "колющий", properties: [] },
  { index: "pike", name: "Пика", category: "Воинское рукопашное", cost: "5 зм", weight: 18, damage: "1к10", damageType: "колющий", properties: ["Двуручное", "Досягаемость", "Тяжёлое"] },
  { index: "rapier", name: "Рапира", category: "Воинское рукопашное", cost: "25 зм", weight: 2, damage: "1к8", damageType: "колющий", properties: ["Фехтовальное"] },
  { index: "scimitar", name: "Скимитар", category: "Воинское рукопашное", cost: "25 зм", weight: 3, damage: "1к6", damageType: "рубящий", properties: ["Лёгкое", "Фехтовальное"] },
  { index: "shortsword", name: "Короткий меч", category: "Воинское рукопашное", cost: "10 зм", weight: 2, damage: "1к6", damageType: "колющий", properties: ["Лёгкое", "Фехтовальное"] },
  { index: "trident", name: "Трезубец", category: "Воинское рукопашное", cost: "5 зм", weight: 4, damage: "1к6", damageType: "колющий", range: "20/60", properties: ["Метательное", "Универсальное (1к8)"] },
  { index: "war-pick", name: "Боевая кирка", category: "Воинское рукопашное", cost: "5 зм", weight: 2, damage: "1к8", damageType: "колющий", properties: [] },
  { index: "warhammer", name: "Боевой молот", category: "Воинское рукопашное", cost: "15 зм", weight: 2, damage: "1к8", damageType: "дробящий", properties: ["Универсальное (1к10)"] },
  { index: "whip", name: "Кнут", category: "Воинское рукопашное", cost: "2 зм", weight: 3, damage: "1к4", damageType: "рубящий", properties: ["Досягаемость", "Фехтовальное"] },

  // Воинское дальнобойное
  { index: "blowgun", name: "Духовая трубка", category: "Воинское дальнобойное", cost: "10 зм", weight: 1, damage: "1", damageType: "колющий", range: "25/100", properties: ["Боеприпас", "Перезарядка"] },
  { index: "hand-crossbow", name: "Арбалет, ручной", category: "Воинское дальнобойное", cost: "75 зм", weight: 3, damage: "1к6", damageType: "колющий", range: "30/120", properties: ["Боеприпас", "Лёгкое", "Перезарядка"] },
  { index: "heavy-crossbow", name: "Арбалет, тяжёлый", category: "Воинское дальнобойное", cost: "50 зм", weight: 18, damage: "1к10", damageType: "колющий", range: "100/400", properties: ["Боеприпас", "Тяжёлое", "Перезарядка", "Двуручное"] },
  { index: "longbow", name: "Длинный лук", category: "Воинское дальнобойное", cost: "50 зм", weight: 2, damage: "1к10", damageType: "колющий", range: "150/600", properties: ["Боеприпас", "Тяжёлое", "Двуручное"] },
  { index: "net", name: "Сеть", category: "Воинское дальнобойное", cost: "1 зм", weight: 3, damage: "—", damageType: "—", range: "5/15", properties: ["Особое", "Метательное"] }
];
