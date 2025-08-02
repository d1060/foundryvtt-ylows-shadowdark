// Namespace Configuration Values
const SHADOWDARK = {};

SHADOWDARK.ABILITIES_LONG = {
	str: "SHADOWDARK.ability_strength",
	int: "SHADOWDARK.ability_intelligence",
	wis: "SHADOWDARK.ability_wisdom",
	con: "SHADOWDARK.ability_constitution",
	cha: "SHADOWDARK.ability_charisma",
	dex: "SHADOWDARK.ability_dexterity",
};

SHADOWDARK.MAGIC_TYPES = {
	nanoMagic: "SHADOWDARK.seirizian_nano_magic",
	auraMagic: "SHADOWDARK.seirizian_aura_magic",
	metalMagic: "SHADOWDARK.seirizian_metal_magic",
	abyssalMagic: "SHADOWDARK.seirizian_abyssal_magic",
	mistMagic: "SHADOWDARK.seirizian_mist_magic",
};

SHADOWDARK.ABILITY_KEYS = [
	"str",
	"int",
	"dex",
	"wis",
	"con",
	"cha",
];

SHADOWDARK.ALIGNMENTS = {
	lawful: "SHADOWDARK.alignment.lawful",
	neutral: "SHADOWDARK.alignment.neutral",
	chaotic: "SHADOWDARK.alignment.chaotic",
};

SHADOWDARK.ARMOR_BONUS_ATTRIBUTES = {
	dex: "SHADOWDARK.ability_dex",
};

SHADOWDARK.CHECKS = {
	str : ['Break or Bend', 'Climb', 'Intimidate', 'Jump', 'Move Through', 'Swim'],
	dex : ['Acrobatics', 'Climb', 'Initiative', 'Move Through', 'Stealth', 'Thievery'],
	con : ['Endurance', 'Hold Your Breath', 'Physical Resistance'],
	int : ['Learning', 'Lore', 'Memory', 'Navigation', 'Forage', 'Stabilize'],
	wis : ['Mental Resistance', 'Morale', 'Perception', 'Tracking'],
	cha : ['Gather Information', 'Barter', 'Convince', 'Deceive'],
};

SHADOWDARK.DICE = {
	d2: "d2",
	d4: "d4",
	d6: "d6",
	d8: "d8",
	d10: "d10",
	d12: "d12",
	d20: "d20",
};

SHADOWDARK.DAMAGE_DICE = [
	"d2",
	"d4",
	"d6",
	"d8",
	"d10",
	"d12"
];

SHADOWDARK.BOON_TYPES = {
	blessing: "SHADOWDARK.boons.blessing",
	oath: "SHADOWDARK.boons.oath",
	secret: "SHADOWDARK.boons.secret",
};

SHADOWDARK.DEFAULTS = {
	BASE_ARMOR_CLASS: 10,
	GEAR_SLOTS: 10,
	GEMS_PER_SLOT: 10,
	FREE_COIN_CARRY: 100,
	LEARN_SPELL_DC: 15,
	LIGHT_TRACKER_UPDATE_INTERVAL_SECS: 30,
	ITEM_IMAGES: {
		"Ancestry": "icons/environment/people/group.webp",
		"Armor": "icons/equipment/chest/breastplate-banded-steel-gold.webp",
		"Background": "icons/environment/people/commoner.webp",
		"Basic": "icons/containers/bags/pouch-simple-brown.webp",
		"Boon": "icons/skills/social/diplomacy-writing-letter.webp",
		"Class Ability": "icons/tools/navigation/map-chart-tan.webp",
		"Class": "icons/sundries/documents/document-sealed-brown-red.webp",
		"Deity": "icons/magic/holy/yin-yang-balance-symbol.webp",
		"Effect": "icons/commodities/tech/cog-brass.webp",
		"Gem": "icons/commodities/gems/gem-faceted-navette-red.webp",
		"Language": "icons/tools/scribal/ink-quill-pink.webp",
		"NPC Attack": "icons/skills/melee/weapons-crossed-swords-yellow.webp",
		"NPC Feature": "icons/creatures/abilities/dragon-breath-purple.webp",
		"NPC Special Attack": "icons/magic/death/weapon-sword-skull-purple.webp",
		"NPC Spell": "icons/magic/symbols/runes-star-magenta.webp",
		"Patron": "icons/magic/unholy/silhouette-light-fire-blue.webp",
		"Potion": "icons/consumables/potions/bottle-corked-red.webp",
		"Property": "icons/sundries/documents/document-torn-diagram-tan.webp",
		"Magic Power": "icons/magic/symbols/rune-sigil-white-pink.webp",
		"Scroll": "icons/sundries/scrolls/scroll-runed-brown-purple.webp",
		"Spell": "icons/magic/symbols/runes-star-blue.webp",
		"Talent": "icons/sundries/books/book-worn-brown-grey.webp",
		"Wand": "icons/weapons/wands/wand-gem-violet.webp",
		"Weapon": "icons/weapons/swords/swords-short.webp",
	},
};

SHADOWDARK.LANGUAGE_RARITY = {
	common: "SHADOWDARK.language.rarity.common",
	rare: "SHADOWDARK.language.rarity.rare",
};

SHADOWDARK.LIGHT_SETTING_NAMES = {
	lantern: "SHADOWDARK.light_source.lantern",
	lightSpellDouble: "SHADOWDARK.light_source.light_spell.double_near",
	lightSpellNear: "SHADOWDARK.light_source.light_spell.near",
	torch: "SHADOWDARK.light_source.torch",
};

SHADOWDARK.LIGHT_SOURCE_ITEM_IDS = [
	"PkQXG3AaHNMVwGTc", // Light Spell
	"rjNBToTJCYLLdVcT", // Light Spell (Double Time)
	"BBDG7QpHOFXG6sKe", // Light Spell (Double Range)
];

SHADOWDARK.NPC_ATTACK_TYPES = {
	physical: "SHADOWDARK.npc_attack.type.physical",
	special: "SHADOWDARK.npc_attack.type.special",
};

SHADOWDARK.NPC_MOVES = {
	none: "SHADOWDARK.npc_move.none",
	close: "SHADOWDARK.npc_move.close",
	near: "SHADOWDARK.npc_move.near",
	doubleNear: "SHADOWDARK.range.double_near",
	tripleNear: "SHADOWDARK.npc_move.triple_near",
	far: "SHADOWDARK.npc_move.far",
	special: "SHADOWDARK.npc_move.special",
};

SHADOWDARK.PROPERTY_TYPES = {
	armor: "SHADOWDARK.property.type.option.armor",
	weapon: "SHADOWDARK.property.type.option.weapon",
	magic_armor: "SHADOWDARK.property.type.option.magic_armor",
	magic_weapon: "SHADOWDARK.property.type.option.magic_weapon",
	magic_melee_weapon: "SHADOWDARK.property.type.option.magic_melee_weapon",
	magic_ranged_weapon: "SHADOWDARK.property.type.option.magic_ranged_weapon",
	magic_item: "SHADOWDARK.property.type.option.magic_item",
};

SHADOWDARK.RANGES = {
	close: "SHADOWDARK.range.close",
	near: "SHADOWDARK.range.near",
	far: "SHADOWDARK.range.far",
	nearLine: "SHADOWDARK.range.nearLine",
};

SHADOWDARK.RANGES_SHORT = {
	close: "SHADOWDARK.range.close_short",
	near: "SHADOWDARK.range.near_short",
	far: "SHADOWDARK.range.far_short",
	self: "SHADOWDARK.range.self_short",
};

SHADOWDARK.OFFICIAL_SOURCES = {
	"bard-and-ranger": "SHADOWDARK.source.bard-and-ranger",
	"core-rules": "SHADOWDARK.source.core-rules",
	"cursed-scroll-1": "SHADOWDARK.source.cursed-scroll-1",
	"cursed-scroll-2": "SHADOWDARK.source.cursed-scroll-2",
	"cursed-scroll-3": "SHADOWDARK.source.cursed-scroll-3",
	"cursed-scroll-4": "SHADOWDARK.source.cursed-scroll-4",
	"cursed-scroll-5": "SHADOWDARK.source.cursed-scroll-5",
	"cursed-scroll-6": "SHADOWDARK.source.cursed-scroll-6",
	"quickstart": "SHADOWDARK.source.quickstart",
};

SHADOWDARK.SPELL_DURATIONS = {
	focus: "SHADOWDARK.spell_duration.focus",
	instant: "SHADOWDARK.spell_duration.instant",
	rounds: "SHADOWDARK.spell_duration.rounds",
	turns: "SHADOWDARK.spell_duration.turns",
	days: "SHADOWDARK.spell_duration.days",
	realTime: "SHADOWDARK.spell_duration.real_time",
	permanent: "SHADOWDARK.spell_duration.permanent",
};

SHADOWDARK.EFFECT_ASK_INPUT = [
	"system.bonuses.weaponMastery",
	"system.bonuses.armorMastery",
	"system.bonuses.advantage",
	"system.bonuses.weaponDamageAdvantage",
	"system.bonuses.armorExpertise",
	"system.bonuses.armorSpecialist",
	"system.bonuses.armorConditioning",
	"system.bonuses.overdraw",
	"system.bonuses.combatProficiency",
	"system.bonuses.weaponProficiency",
	"system.bonuses.2HweaponProficiency",
	"system.bonuses.armorProficiency",
	"system.bonuses.abilityCheckBonus",
	"system.bonuses.abilityCheckBoost",
];

SHADOWDARK.EFFECT_CATEGORIES = {
	effect: "SHADOWDARK.item.effect.category.effect",
	condition: "SHADOWDARK.item.effect.category.condition",
};

SHADOWDARK.EFFECT_DURATIONS = {
	instant: "SHADOWDARK.spell_duration.instant",
	rounds: "SHADOWDARK.spell_duration.rounds",
	turns: "SHADOWDARK.effect_duration.turns",
	seconds: "SHADOWDARK.effect_duration.seconds",
	minutes: "SHADOWDARK.effect_duration.minutes",
	hours: "SHADOWDARK.effect_duration.hours",
	days: "SHADOWDARK.spell_duration.days",
	focus: "SHADOWDARK.spell_duration.focus",
	permanent: "SHADOWDARK.spell_duration.permanent",
	unlimited: "SHADOWDARK.effect_duration.unlimited",
};

SHADOWDARK.EFFECT_TRANSLATIONS = {
	"system.abilities.cha.base": "SHADOWDARK.ability_cha",
	"system.abilities.cha.bonus": "SHADOWDARK.ability_cha",
	"system.abilities.con.base": "SHADOWDARK.ability_con",
	"system.abilities.con.bonus": "SHADOWDARK.ability_con",
	"system.abilities.dex.base": "SHADOWDARK.ability_dex",
	"system.abilities.dex.bonus": "SHADOWDARK.ability_dex",
	"system.abilities.int.base": "SHADOWDARK.ability_int",
	"system.abilities.int.bonus": "SHADOWDARK.ability_int",
	"system.abilities.str.base": "SHADOWDARK.ability_str",
	"system.abilities.str.bonus": "SHADOWDARK.ability_str",
	"system.abilities.wis.base": "SHADOWDARK.ability_wis",
	"system.abilities.wis.bonus": "SHADOWDARK.ability_wis",
	"system.bonuses.acBonus": "SHADOWDARK.talent.type.armor_bonus",
	"system.bonuses.advantage": "SHADOWDARK.talent.type.advantage.title",
	"system.bonuses.armorMastery": "SHADOWDARK.item.effect.predefined_effect.armorMastery",
	"system.bonuses.attackBonus": "SHADOWDARK.item.magic_item.type.attackBonus",
	"system.bonuses.backstabDie": "SHADOWDARK.talent.type.backstab_die",
	"system.bonuses.critical.failureThreshold": "SHADOWDARK.item.magic_item.type.criticalFailureThreshold",
	"system.bonuses.critical.multiplier": "SHADOWDARK.item.magic_item.type.critMultiplier",
	"system.bonuses.critical.successThreshold": "SHADOWDARK.item.magic_item.type.criticalSuccessThreshold",
	"system.bonuses.damageBonus": "SHADOWDARK.item.magic_item.type.damageBonus",
	"system.bonuses.gearSlots": "SHADOWDARK.inventory.slots",
	"system.bonuses.meleeAttackBonus": "SHADOWDARK.talent.type.melee_attack_bonus",
	"system.bonuses.meleeDamageBonus": "SHADOWDARK.talent.type.melee_damage_bonus",
	"system.bonuses.rangedAttackBonus": "SHADOWDARK.talent.type.ranged_attack_bonus",
	"system.bonuses.rangedDamageBonus": "SHADOWDARK.talent.type.ranged_damage_bonus",
	"system.bonuses.stoneSkinTalent": "SHADOWDARK.talent.type.stoneSkinTalent",
	"system.bonuses.spellcastingCheckBonus": "SHADOWDARK.talent.type.spell_bonus",
	"system.bonuses.spellcastingClasses": "SHADOWDARK.talent.type.bonus_caster_classes",
	"system.bonuses.weaponMastery": "SHADOWDARK.talent.type.weapon_mastery",
};

SHADOWDARK.JOURNAL_UUIDS = {
	RELEASE_NOTES: "Compendium.shadowdark.documentation.JournalEntry.UJ60Lf9ecijEOO6I",
};

SHADOWDARK.PREDEFINED_EFFECTS = {
	abilityImprovementCha: {
		defaultValue: 1,
		effectKey: "system.abilities.cha.bonus",
		img: "icons/skills/melee/hand-grip-staff-yellow-brown.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.abilityImprovementCha",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	abilityImprovementCon: {
		defaultValue: 1,
		effectKey: "system.abilities.con.bonus",
		img: "icons/skills/melee/hand-grip-staff-yellow-brown.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.abilityImprovementCon",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	abilityImprovementDex: {
		defaultValue: 1,
		effectKey: "system.abilities.dex.bonus",
		img: "icons/skills/melee/hand-grip-staff-yellow-brown.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.abilityImprovementDex",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	abilityImprovementInt: {
		defaultValue: 1,
		effectKey: "system.abilities.int.bonus",
		img: "icons/skills/melee/hand-grip-staff-yellow-brown.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.abilityImprovementInt",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	abilityImprovementStr: {
		defaultValue: 1,
		effectKey: "system.abilities.str.bonus",
		img: "icons/skills/melee/hand-grip-staff-yellow-brown.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.abilityImprovementStr",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	abilityImprovementWis: {
		defaultValue: 1,
		effectKey: "system.abilities.wis.bonus",
		img: "icons/skills/melee/hand-grip-staff-yellow-brown.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.abilityImprovementWis",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	abilityAdvantageCha: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.cha.advantage",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.chaAdvantage",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	abilityAdvantageCon: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.con.advantage",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.conAdvantage",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	abilityAdvantageDex: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.dex.advantage",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.dexAdvantage",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	abilityAdvantageInt: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.int.advantage",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.intAdvantage",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	abilityAdvantageStr: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.str.advantage",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.strAdvantage",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	abilityAdvantageWis: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.wis.advantage",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.wisAdvantage",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	acBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.acBonus",
		img: "icons/skills/melee/shield-block-gray-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.acBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	hpBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.hpBonus",
		img: "icons/magic/life/cross-worn-green.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.hpBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	stealthCheckAdvantage: {
		defaultValue: "1",
		effectKey: "system.bonuses.stealthCheckAdvantage",
		img: "icons/skills/melee/shield-block-gray-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.stealthCheckAdvantage",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	abilityCheckBonus: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.abilityCheckBonus",
		img: "icons/skills/melee/shield-block-gray-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.abilityCheckBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	abilityCheckBoost: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.abilityCheckBoost",
		img: "icons/skills/melee/shield-block-gray-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.abilityCheckBoost",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	acBonusFromAttribute: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.acBonusFromAttribute",
		img: "icons/skills/melee/shield-block-gray-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.acBonusFromAttribute",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	additionalGearSlots: {
		defaultValue: 1,
		effectKey: "system.bonuses.gearSlots",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.additionalGearSlots",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	armorMastery: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.armorMastery",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.armorMastery",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	armorExpertise: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.armorExpertise",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.armorExpertise",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	increasedCriticalRange: {
		defaultValue: "1",
		effectKey: "system.bonuses.increasedCriticalRange",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.increasedCriticalRange",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	combatProficiency: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.combatProficiency",
		img: "icons/skills/melee/sword-shield-stylized-white.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.combatProficiency",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	jackOfAllTrades: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.jackOfAllTrades",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.jackOfAllTrades",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	unarmoredMoveBonus: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.unarmored_move_bonus",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.unarmoredMoveBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	moveBonus: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.move_bonus",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.moveBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	devastatingBlows: {
		defaultValue: "1",
		effectKey: "system.bonuses.devastatingBlows",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.devastatingBlows",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	unarmedDamageBonus: {
		defaultValue: "1",
		effectKey: "system.bonuses.unarmedDamageBonus",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.unarmedDamageBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	unarmedStrike: {
		defaultValue: "1",
		effectKey: "system.bonuses.unarmedStrike",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.unarmedStrike",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	weaponProficiency: {
		defaultValue: "1",
		effectKey: "system.bonuses.weaponProficiency",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponProficiency",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	overdraw: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.overdraw",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.overdraw",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	weaponDamageAdvantage: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.weaponDamageAdvantage",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponDamageAdvantage",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	weaponAttackAdvantage: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.weaponAttackAdvantage",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponAttackAdvantage",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	constitutionAdvantage: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.constitutionAdvantage",
		img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.constitutionAdvantage",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	backstabDie: {
		defaultValue: 1,
		effectKey: "system.bonuses.backstabDie",
		img: "icons/skills/melee/strike-dagger-white-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.backstabDie",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	criticalFailureThreshold: {
		defaultValue: 3,
		effectKey: "system.bonuses.critical.failureThreshold",
		img: "icons/magic/life/cross-area-circle-green-white.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.criticalFailureThreshold",
		mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
	},
	criticalSuccessThreshold: {
		defaultValue: 18,
		effectKey: "system.bonuses.critical.successThreshold",
		img: "icons/magic/fire/flame-burning-fist-strike.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.criticalSuccessThreshold",
		mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
	},
	critMultiplier: {
		defaultValue: 4,
		effectKey: "system.bonuses.critical.multiplier",
		img: "icons/skills/melee/hand-grip-staff-yellow-brown.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.critMultiplier",
		mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
		transfer: false,
	},
	damageMultiplier: {
		defaultValue: 2,
		effectKey: "system.bonuses.damageMultiplier",
		img: "icons/skills/melee/strike-hammer-destructive-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.damageMultiplier",
		mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
	},
	hpAdvantage: {
		defaultValue: "hp",
		effectKey: "system.bonuses.advantage",
		img: "icons/magic/life/cross-area-circle-green-white.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.hpAdvantage",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	initAdvantage: {
		defaultValue: "initiative",
		effectKey: "system.bonuses.advantage",
		img: "icons/skills/movement/feet-winged-boots-glowing-yellow.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.initAdvantage",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	lightSource: {
		defaultValue: "REPLACEME",
		effectKey: "system.light.template",
		img: "icons/magic/light/torch-fire-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.lightSource",
		mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
	},
	meleeAttackBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.meleeAttackBonus",
		img: "icons/skills/melee/strike-polearm-glowing-white.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.meleeAttackBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	meleeDamageBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.meleeDamageBonus",
		img: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.meleeDamageBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	permanentAbilityCha: {
		defaultValue: 18,
		effectKey: "system.abilities.cha.base",
		img: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.permanentAbilityCha",
		mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
	},
	permanentAbilityCon: {
		defaultValue: 18,
		effectKey: "system.abilities.con.base",
		img: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.permanentAbilityCon",
		mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
	},
	permanentAbilityDex: {
		defaultValue: 18,
		effectKey: "system.abilities.dex.base",
		img: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.permanentAbilityDex",
		mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
	},
	permanentAbilityInt: {
		defaultValue: 18,
		effectKey: "system.abilities.int.base",
		img: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.permanentAbilityInt",
		mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
	},
	permanentAbilityStr: {
		defaultValue: 18,
		effectKey: "system.abilities.str.base",
		img: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.permanentAbilityStr",
		mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
	},
	permanentAbilityWis: {
		defaultValue: 18,
		effectKey: "system.abilities.wis.base",
		img: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.permanentAbilityWis",
		mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
	},
	rangedAttackBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.rangedAttackBonus",
		img: "icons/weapons/ammunition/arrow-head-war-flight.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.rangedAttackBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	rangedDamageBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.rangedDamageBonus",
		img: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.rangedDamageBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	spellAdvantage: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.advantage",
		img: "icons/magic/air/air-smoke-casting.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.spellAdvantage",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	spellCastingBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.spellcastingCheckBonus",
		img: "icons/magic/fire/flame-burning-fist-strike.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.spellCastingBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	spellcastingClasses: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.spellcastingClasses",
		img: "icons/sundries/documents/document-sealed-brown-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.spellcastingClasses",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	stoneSkinTalent: {
		defaultValue: 1,
		effectKey: "system.bonuses.stoneSkinTalent",
		icon: "icons/magic/earth/strike-fist-stone-gray.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.stoneSkinTalent",
		mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
	},
	tempHP: {
		defaultValue: 7,
		effectKey: "system.bonuses.tempHP",
		icon: "icons/magic/earth/strike-fist-stone-gray.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.tempHP",
		mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
	},
	unarmoredAcBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.unarmoredAcBonus",
		img: "icons/skills/melee/shield-block-gray-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.unarmoredAcBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	weaponAttackBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.attackBonus",
		img: "icons/skills/melee/strike-polearm-glowing-white.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponAttackBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
		restriction: "Weapon",
		transfer: false,
	},
	weaponDamageBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.damageBonus",
		img: "icons/weapons/ammunition/arrow-head-war-flight.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponDamageBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
		restriction: "Weapon",
		transfer: false,
	},
	weaponDamageDieD12: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.weaponDamageDieD12",
		img: "icons/skills/ranged/arrows-flying-salvo-blue-light.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponDamageDieD12",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	weaponDamageDieImprovementByProperty: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.weaponDamageDieImprovementByProperty",
		img: "icons/skills/ranged/arrows-flying-salvo-blue-light.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponDamageDieImprovementByProperty",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	weaponDamageExtraDieByProperty: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.weaponDamageExtraDieByProperty",
		img: "icons/skills/ranged/arrows-flying-salvo-blue-light.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponDamageExtraDieByProperty",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	weaponDamageExtraDieImprovementByProperty: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.weaponDamageExtraDieImprovementByProperty",
		img: "icons/skills/ranged/arrows-flying-salvo-blue-light.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponDamageExtraDieImprovementByProperty",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	weaponDamageMultiplier: {
		defaultValue: 2,
		effectKey: "system.bonuses.damageMultiplier",
		img: "icons/skills/melee/strike-hammer-destructive-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.damageMultiplier",
		mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
		transfer: false,
	},
	weaponMastery: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.weaponMastery",
		img: "icons/skills/melee/weapons-crossed-swords-white-blue.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponMastery",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	wordsOfPowerAtStart: {
		defaultValue: "0",
		effectKey: "system.bonuses.words_of_power_starting",
		img: "icons/magic/symbols/runes-carved-stone-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.wordsOfPowerAtStart",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	wordsOfPowerPerLevel: {
		defaultValue: "0",
		effectKey: "system.bonuses.words_of_power_per_level",
		img: "icons/magic/symbols/runes-carved-stone-purple.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.wordsOfPowerPerLevel",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	wordsOfPowerBonus: {
		defaultValue: "0",
		effectKey: "system.bonuses.words_of_power",
		img: "icons/magic/symbols/runes-carved-stone-purple.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.wordsOfPowerBonus",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	wordsOfPowerAbilityMod: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.words_of_power_ability_modifier",
		img: "icons/magic/symbols/runes-carved-stone-green.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.wordsOfPowerAbilityMod",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	wordsOfPowerKnown: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.words_of_power_known",
		img: "icons/magic/symbols/runes-carved-stone-yellow.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.wordsOfPowerKnown",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	resistance: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.resistance",
		img: "icons/magic/fire/flame-burning-fist-strike.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.resistance",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	immunity: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.immunity",
		img: "icons/magic/fire/flame-burning-fist-strike.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.immunity",
		mode: CONST.ACTIVE_EFFECT_MODES.ADD,
	},
	//DONE:
	//system.bonuses.livingMetalResistance -> Resistance to all physical damage. Full damage from energy attacks.
	//system.bonuses.ancientSteelResistance -> Resistance to all bludgeoning, slashing and piercing, except by exotic materials.
	//system.bonuses.crysteelResistance -> Resistance to all magical damage.
	//system.bonuses.impervious -> Resistance to all damage except magical damage.
	//system.bonuses.antiGuardian -> Take half damage from normal, non-magical, weapons. Double damage from electric sources.
	//system.bonuses.misty -> Except on a critical hit, any attack that's not energy-based or area only damages them for 1 hit point.
	//system.bonuses.incorporeal -> Can only be damaged by magical sources.
	//system.bonuses.helvarionWeakness -> Against the helvarion, crysteel armor offers +3 AC (to its listed protection) and crysteel weapons deal +3 damage.
	//system.bonuses.displacementField -> attacks on them are made at disadvantage.
	//system.bonuses.advantageOnAllAttacks -> Choose one opponent. Attacks against it are made with advantage.
	//system.bonuses.regeneration -> Whenever it deals damage, recover 1 hp.
	//system.bonuses.savageStrike -> Rolls damage twice and take the best result.
	//system.bonuses.bloodiedAC -> AC goes up after half hitpoints are taken.
	//system.bonuses.targetLock -> Choose one opponent. Gains +2 to attack against this opponent.
	//system.bonuses.extraFireDamage -> Deals Extra Fire Damage with all attacks.
	//system.bonuses.rangedAttackAC -> +2 AC against ranged attacks.
	//system.bonuses.packTactics -> +1 to attack for each other snigglet attacking the same opponent.
	//system.bonuses.automaticDamageOnCloseAttack -> Anyone attacking in melee close range takes 1 point of damage.
	//system.bonuses.poisonPenalty -> Penalty to all rolls.
	//system.bonuses.automaticPoisonOnCloseAttack -> Penalty on physical actions after strike, if misses a DC 15 CON
	//system.bonuses.helvarion -> Enemies in close range must make a taint check: [[check 12 con]] or take [[/r 1d4]] corrosive damage, on a successful attack.
	//system.bonuses.opponentACpenalty
	//system.bonuses.dexBonusToAc
	//system.bonuses.advantage(perception)
	//system.bonuses.advantage(resistance)
	//system.bonuses.unarmoredStealthBonus
	//system.bonuses.homogeneous Slashing, piercing or bludgeoning attacks only deal 1 point of damage, unless they are magical.
	//system.bonuses.shieldWall  +1 to AC when close to another ally with this feature.

	//TODO:
	//system.bonuses.injector On hit, injects a random drug on the target. Roll DC 12 CON. On a failure, roll 1d6:
    //    1: -1 to attack the next round.
    //    2: -1 to damage the next round.
    //    3: Half move the next round.
    //    4: loses the action next round.
    //    5: double move the next round.
    //    6: +1 to attack the next round.
	//system.bonuses.neuralyticFlash -> Everyone in 6 hexes rolls CON vs 12. On a failure, they cannot move for 1d4 turns.
	//system.bonuses.subsonicScream -> Every biological opponent in 12 hexes get -2 to all actions. -1 if within 24 hexes.
	//system.bonuses.impactPunch -> On hit, medium-sized biological opponents are thrown 6 hexes away. Ribs may crack.
	//system.bonuses.selfDestruct -> When downed, explode with 2d6 over a 2-hex radius.
	//system.bonuses.blindingFlash -> Everyone in 6 hexes rolls CON vs 14. On a failure, they are blinded for 1d4 turns.
	//system.bonuses.corrosiveGas -> Everyone in close range always takes [[/r 1d4]] per turn.
	//system.bonuses.mistdarkCreature -> When downed, they burst in a puff of mistdark. Everyone in a 1-hex radius must make a taint check: [[check 12 con]] or take [[/r 1d4]] corrosive damage.

	// New abilities:
	// Gain more HP at each heal.

	// system.bonuses.nanoAutoDebugging
	// system.bonuses.nanoProgramsFailureTolerance
	// system.bonuses.knownNanoPrograms
	// system.bonuses.nanoTolerance
	// system.bonuses.productionReady
	// system.bonuses.programOptimizationCount
	// system.bonuses.nanoPrtotectedMemory
	// system.bonuses.solarNanobots
	// system.bonuses.elementalArmor
	// system.bonuses.extraElementalDamage

	// Rune Magic Secondary Effects:
	// system.penalties.burning
	// system.penalties.frozen
	// system.penalties.shrunk
	// system.bonuses.electric
	// system.penalties.transformed_into_small_animal
	// system.bonuses.summon
	// system.penalties.frightened
	// system.penalties.panic
	// system.penalties.sickness
	// system.penalties.enfeebled
	// system.penalties.abilityPenalty
	// system.penalties.elementalFlesh
	// system.penalties.slowTime
	// system.penalties.paralyze
	// system.penalties.blindness
	// system.bonuses.chameleon
	// system.bonuses.mirrorImage
	// system.bonuses.magicResistance
	// system.bonuses.magicImmunity
	// system.bonuses.elementalProtection
	// system.bonuses.deflectMissile
	// system.bonuses.accelerateTime
	// system.penalties.loseRune
	// system.bonuses.abilityBonus
	// system.bonuses.bladedWeaponDamage
	// system.bonuses.noArmorStealthPenalty
};

SHADOWDARK.VARIABLE_DURATIONS = [
	"days",
	"hours",
	"minutes",
	"realTime",
	"rounds",
	"seconds",
	"turns",
];

SHADOWDARK.DURATION_UNITS = {
	seconds: 1,
	rounds: 6,
	minutes: 60,
	turns: 600,
	hours: 3600,
	days: 86400,
};

SHADOWDARK.SPELL_RANGES = {
	self: "SHADOWDARK.range.self",
	touch: "SHADOWDARK.range.touch",
	close: "SHADOWDARK.range.close",
	near: "SHADOWDARK.range.near",
	doubleNear: "SHADOWDARK.range.double_near",
	far: "SHADOWDARK.range.far",
	oneMile: "SHADOWDARK.range.oneMile",
	samePlane: "SHADOWDARK.range.samePlane",
	unlimited: "SHADOWDARK.range.unlimited",
};

SHADOWDARK.DAMAGE_TYPES = {
	bludgeoning: "SHADOWDARK.damage_type.bludgeoning",
	slashing: "SHADOWDARK.damage_type.slashing",
	piercing: "SHADOWDARK.damage_type.piercing",
	fire: "SHADOWDARK.damage_type.fire",
	cold: "SHADOWDARK.damage_type.cold",
	electricity: "SHADOWDARK.damage_type.electricity",
	acid: "SHADOWDARK.damage_type.acid",
	poison: "SHADOWDARK.damage_type.poison",
	corrosion: "SHADOWDARK.damage_type.corrosion",
};

SHADOWDARK.TALENT_CLASSES = {
	ancestry: "SHADOWDARK.talent.class.ancestry",
	class: "SHADOWDARK.talent.class.class",
	level: "SHADOWDARK.talent.class.level",
	technique: "SHADOWDARK.talent.class.technique",
	patronBoon: "SHADOWDARK.talent.class.patronBoon",
	nanoMagic: "SHADOWDARK.talent.class.nanoMagic",
	auraMagic: "SHADOWDARK.talent.class.auraMagic",
	metalMagic: "SHADOWDARK.talent.class.metalMagic",
	abyssalMagic: "SHADOWDARK.talent.class.abyssalMagic",
	mistMagic: "SHADOWDARK.talent.class.mistMagic",
};

SHADOWDARK.WEAPON_BASE_DAMAGE = {
	d2: "1d2", // Avg 1.5
	d4: "1d4", // Avg 2.5
	d6: "1d6", // Avg 3.5
	d8: "1d8", // Avg 4.5
	d10: "1d10", // Avg 5.5
	d12: "1d12", // Avg 6.5
	"2d6": "2d6", // Avg 7
	"2d8": "2d8", // Avg 9
	"2d10": "2d10", // Avg 11
	"2d12": "2d12", // Avg 13
};

SHADOWDARK.WEAPON_BASE_DAMAGE_DIE_ONLY = {
	d2: "d2",
	d4: "d4",
	d6: "d6",
	d8: "d8",
	d10: "d10",
	d12: "d12",
};

SHADOWDARK.WEAPON_TYPES = {
	melee: "SHADOWDARK.weapon.type.melee",
	ranged: "SHADOWDARK.weapon.type.ranged",
};

SHADOWDARK.SEIRIZIAN_DURATIONS = {
	"instant": 'SHADOWDARK.item.talent_duration_instant',
	"1-turn": 'SHADOWDARK.item.talent_duration_one_turn',
	"2-turns": "SHADOWDARK.nano_duration_two",
	"3-turns": "SHADOWDARK.nano_duration_three",
	"1-minute": 'SHADOWDARK.item.talent_duration_one_minute',
	"30-minutes": "SHADOWDARK.nano_duration_thirty",
	"sustained": 'SHADOWDARK.item.talent_duration_sustained',
	"1-hour": 'SHADOWDARK.item.talent_duration_one_hour',
	"1-day": 'SHADOWDARK.item.talent_duration_one_day',
	"permanent": 'SHADOWDARK.item.talent_duration_permanent'
};

SHADOWDARK.SEIRIZIAN_DURATIONS_STEPS = [
	"turn",
	"minute",
	"hour",
	"day",
];

SHADOWDARK.NANO_MAGIC_TYPES = {
	"internal" : "SHADOWDARK.nano_internal",
	"external" : "SHADOWDARK.nano_external",
};

SHADOWDARK.NANO_MAGIC_DURATIONS = {
	"1-turn" : "SHADOWDARK.nano_duration_one",
	"3-turns" : "SHADOWDARK.nano_duration_three",
	"1-minute" :  "SHADOWDARK.nano_duration_minute",
	"30-minutes" : "SHADOWDARK.nano_duration_thirty",
	"1-day" : "SHADOWDARK.nano_duration_day",
};

SHADOWDARK.NANO_MAGIC_INTERNAL_DRAWBACKS = {
	"noDrawback" : "SHADOWDARK.nano_noDrawback",
	"hpReduction" : "SHADOWDARK.nano_hpReduction",
	"meleeAttackDisadvantage" : "SHADOWDARK.nano_meleeAttackDisadvantage",
	"meleeDamageDisadvantage" : "SHADOWDARK.nano_meleeDamageDisadvantage",
	"rangedAttackDisadvantage" : "SHADOWDARK.nano_rangedAttackDisadvantage",
	"rangedDamageDisadvantage" : "SHADOWDARK.nano_rangedDamageDisadvantage",
	"wisDisadvantage" : "SHADOWDARK.nano_wisDisadvantage",
	"dexDisadvantage" : "SHADOWDARK.nano_dexDisadvantage",
	"strDisadvantage" : "SHADOWDARK.nano_strDisadvantage",
	"conDisadvantage" : "SHADOWDARK.nano_conDisadvantage",
	"intDisadvantage" : "SHADOWDARK.nano_intDisadvantage",
	"chaDisadvantage" : "SHADOWDARK.nano_chaDisadvantage",
	"achingJoints" : "SHADOWDARK.nano_achingJoints",
	"chronicPain" : "SHADOWDARK.nano_chronicPain",
	"hallucinations" : "SHADOWDARK.nano_hallucinations",
	"shiveringFever" : "SHADOWDARK.nano_shiveringFever",
	"dizziness" : "SHADOWDARK.nano_dizziness",
	"blinded" : "SHADOWDARK.nano_blinded",
	"oncePerWeek" : "SHADOWDARK.nano_oncePerWeek",
};

SHADOWDARK.NANO_MAGIC_EXTERNAL_DRAWBACKS = {
	"noDrawback" : "SHADOWDARK.nano_noDrawback",
	"dizzyOneTurn" : "SHADOWDARK.nano_dizzyOneTurn",
	"dizzyThreeTurns" : "SHADOWDARK.nano_dizzyThreeTurns",
	"dizzyOneMinute" : "SHADOWDARK.nano_dizzyOneMinute",
	"blindedOneTurn" : "SHADOWDARK.nano_blindedOneTurn",
	"blindedThreeTurns" : "SHADOWDARK.nano_blindedThreeTurns",
	"blindedOneMinute" : "SHADOWDARK.nano_blindedOneMinute",
	"stunnedOneTurn" : "SHADOWDARK.nano_stunnedOneTurn",
	"stunnedThreeTurns" : "SHADOWDARK.nano_stunnedThreeTurns",
	"stunnedOneMinute" : "SHADOWDARK.nano_stunnedOneMinute",
	"programLost" : "SHADOWDARK.nano_programLost",
	"damageOne" : "SHADOWDARK.nano_damageOne",
	"damageTwo" : "SHADOWDARK.nano_damageTwo",
	"damageFour" : "SHADOWDARK.nano_damageFour",
};

SHADOWDARK.NANO_MAGIC_INTERNAL_EFFECTS = {
	"adaptiveTrackingSystem": "SHADOWDARK.nano_effect_internal.adaptiveTrackingSystem",
	"artificialBloodFiltering": "SHADOWDARK.nano_effect_internal.artificialBloodFiltering",
	"augmentedSensorialGain": "SHADOWDARK.nano_effect_internal.augmentedSensorialGain",
	"bloodFiltering": "SHADOWDARK.nano_effect_internal.bloodFiltering",
	"cardiacSupport": "SHADOWDARK.nano_effect_internal.cardiacSupport",
	"chameleonSkin": "SHADOWDARK.nano_effect_internal.chameleonSkin",
	"electromagneticMesh": "SHADOWDARK.nano_effect_internal.electromagneticMesh",
	"electromagneticSubdermalMesh": "SHADOWDARK.nano_effect_internal.electromagneticSubdermalMesh",
	"gammaFiltering": "SHADOWDARK.nano_effect_internal.gammaFiltering",
	"heuristicNoseFilter": "SHADOWDARK.nano_effect_internal.heuristicNoseFilter",
	"hyperspectralVibrationAnalyzer": "SHADOWDARK.nano_effect_internal.hyperspectralVibrationAnalyzer",
	"immuneSystemBoost": "SHADOWDARK.nano_effect_internal.immuneSystemBoost",
	"improvedOpticalProcessing": "SHADOWDARK.nano_effect_internal.improvedOpticalProcessing",
	"internalHeating": "SHADOWDARK.nano_effect_internal.internalHeating",
	"legMuscleAugment": "SHADOWDARK.nano_effect_internal.legMuscleAugment",
	"microExpressionsReadout": "SHADOWDARK.nano_effect_internal.microExpressionsReadout",
	"moralNeuralNetwork": "SHADOWDARK.nano_effect_internal.moralNeuralNetwork",
	"muscleOvercharge": "SHADOWDARK.nano_effect_internal.muscleOvercharge",
	"muscleOxygenation": "SHADOWDARK.nano_effect_internal.muscleOxygenation",
	"muscleReinforcement": "SHADOWDARK.nano_effect_internal.muscleReinforcement",
	"nanoSight": "SHADOWDARK.nano_effect_internal.nanoSight",
	"neuralNetPrediction": "SHADOWDARK.nano_effect_internal.neuralNetPrediction",
	"organReinforcement": "SHADOWDARK.nano_effect_internal.organReinforcement",
	"quantumEffectNanoGrapplers": "SHADOWDARK.nano_effect_internal.quantumEffectNanoGrapplers",
	"radioInterface": "SHADOWDARK.nano_effect_internal.radioInterface",
	"reflexBypass": "SHADOWDARK.nano_effect_internal.reflexBypass",
	"secondaryMemorySearch": "SHADOWDARK.nano_effect_internal.secondaryMemorySearch",
	"secondaryReflexArcs": "SHADOWDARK.nano_effect_internal.secondaryReflexArcs",
	"skinDeOxygenation": "SHADOWDARK.nano_effect_internal.skinDeOxygenation",
	"skinFiltering": "SHADOWDARK.nano_effect_internal.skinFiltering",
	"speedBoost": "SHADOWDARK.nano_effect_internal.speedBoost",
	"suppressWeariness": "SHADOWDARK.nano_effect_internal.suppressWeariness",
	"tendonReinforcement": "SHADOWDARK.nano_effect_internal.tendonReinforcement",
	"threatPrediction": "SHADOWDARK.nano_effect_internal.threatPrediction",
	"trackingInterface": "SHADOWDARK.nano_effect_internal.trackingInterface",
};

SHADOWDARK.NANO_MAGIC_EXTERNAL_EFFECTS = {
	"antiAttrictionCoating": "SHADOWDARK.nano_effect_external.antiAttrictionCoating",
	"antiNanoCloud": "SHADOWDARK.nano_effect_external.antiNanoCloud",
	"attrictionCoating": "SHADOWDARK.nano_effect_external.attrictionCoating",
	"burningCloud": "SHADOWDARK.nano_effect_external.burningCloud",
	"corrosiveCloud": "SHADOWDARK.nano_effect_external.corrosiveCloud",
	"darkFogEngine": "SHADOWDARK.nano_effect_external.darkFogEngine",
	"dustGatherer": "SHADOWDARK.nano_effect_external.dustGatherer",
	"etherealSpeakers": "SHADOWDARK.nano_effect_external.etherealSpeakers",
	"flameBurst": "SHADOWDARK.nano_effect_external.flameBurst",
	"hyperStaticCloud": "SHADOWDARK.nano_effect_external.hyperStaticCloud",
	"imageProjection": "SHADOWDARK.nano_effect_external.imageProjection",
	"nanoBoom": "SHADOWDARK.nano_effect_external.nanoBoom",
	"nanoBuffer": "SHADOWDARK.nano_effect_external.nanoBuffer",
	"nullNanoCloud": "SHADOWDARK.nano_effect_external.nullNanoCloud",
	"radioCloud": "SHADOWDARK.nano_effect_external.radioCloud",
	"remoteSensing": "SHADOWDARK.nano_effect_external.remoteSensing",
	"staticCloud": "SHADOWDARK.nano_effect_external.staticCloud",
	"stingingCloud": "SHADOWDARK.nano_effect_external.stingingCloud",
	"stunningBurst": "SHADOWDARK.nano_effect_external.stunningBurst",
	"substanceProjection": "SHADOWDARK.nano_effect_external.substanceProjection",
	"targetAnalyzer": "SHADOWDARK.nano_effect_external.targetAnalyzer",
};

export default SHADOWDARK;
