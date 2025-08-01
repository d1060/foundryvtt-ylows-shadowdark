export default class ItemSD extends Item {

	get isRollable() {
		return [
			"Potion",
			"Scroll",
			"Spell",
			"Wand",
			"Weapon",
		].includes(this.type);
	}


	get typeSlug() {
		return this.type.slugify();
	}


	get usesAmmunition() {
		return (game.settings.get("shadowdark", "autoConsumeAmmunition")
			&& this.isOwned
			&& this.actor.type === "Player"
			&& this.type === "Weapon"
			&& this.system.ammoClass !== ""
		);
	}

	/* Set the start time and initiative roll of newly created effect */
	/** @override */
	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		const updateData = {};

		const replaceImage = data.img === undefined || data.img === "icons/svg/item-bag.svg";
		const defaultImage = CONFIG.SHADOWDARK.DEFAULTS.ITEM_IMAGES[this.type];

		// Only change the image if it is the default Foundry item icon
		if (defaultImage && replaceImage) {
			updateData.img = defaultImage;
		}

		// Store the creation time & initiative on the effect
		if (data.type === "Effect") {
			const combatTime = (game.combat)
				? `${game.combat.round}.${game.combat.turn}`
				: null;

			updateData["system.start"] = {
				value: game.time.worldTime,
				combatTime,
			};
		}

		if (!foundry.utils.isEmpty(updateData)) {
			this.updateSource(updateData);
		}
	}


	availableAmmunition() {
		if (this.usesAmmunition) {
			return this.actor.ammunitionItems(this.system.ammoClass);
		}
	}


	async getChatData(htmlOptions={}) {
		const description = await this.getEnrichedDescription();

		const data = {
			actor: this.actor,
			description,
			item: this.toObject(),
			itemProperties: await this.propertyItems(),
		};

		if (this.actor.type === "Player") {
			data.isSpellCaster = await this.actor.isSpellCaster();
			data.canUseMagicItems = await this.actor.canUseMagicItems();
		}

		if (["Scroll", "Spell", "Wand"].includes(this.type)) {
			data.spellClasses = await this.getSpellClassesDisplay();
		}

		if (["Armor", "Weapon"].includes(this.type)) {
			data.baseItemName = await this.getBaseItemName();
		}

		return data;
	}


	async displayCard(options={}) {
		shadowdark.chat.renderItemCardMessage(this.actor, {
			template: this.getItemTemplate("systems/shadowdark/templates/chat/item"),
			templateData: await this.getChatData(),
		});
	}


	async getBaseItemName() {
		if (this.type === "Armor") {
			if (this.system.baseArmor === "") return "";

			for (const armor of await shadowdark.compendiums.baseArmor()) {
				if (armor.name.slugify() === this.system.baseArmor) {
					return armor.name;
				}
			}
		}
		else if (this.type === "Weapon") {
			if (this.system.baseWeapon === "") return "";

			for (const weapon of await shadowdark.compendiums.baseWeapons()) {
				if (weapon.name.slugify() === this.system.baseWeapon) {
					return weapon.name;
				}
			}
		}
	}

	async getDetailsContent() {
		const description = await this.getEnrichedDescription();

		const data = {
			description,
			item: this.toObject(),
			itemProperties: await this.propertyItems(),
		};

		if (["Scroll", "Spell", "Wand"].includes(this.type)) {
			data.spellClasses = await this.getSpellClassesDisplay();
		}

		if (["Armor", "Weapon"].includes(this.type)) {
			data.baseItemName = await this.getBaseItemName();
		}

		const templatePath = this.getItemTemplate(
			"systems/shadowdark/templates/_partials/details"
		);

		return await foundry.applications.handlebars.renderTemplate(templatePath, data);
	}


	async getEnrichedDescription() {
		return await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			this.system.description,
			{
				async: true,
			}
		);
	}

	async appendDescription(description) {
		this.system.description = this.system.description + description;
		this.update({"system.description": this.system.description});
	}


	getItemTemplate(basePath) {
		switch (this.type) {
			case "Armor":
				return `${basePath}/armor.hbs`;
			case "Effect":
				return `${basePath}/effect.hbs`;
			case "Scroll":
			case "Wand":
			case "Spell":
				return `${basePath}/spell.hbs`;
			case "Weapon":
				return `${basePath}/weapon.hbs`;
			default:
				return `${basePath}/default.hbs`;
		}
	}


	lightRemainingString() {
		if (this.type !== "Basic" && !this.system.light.isSource) return;

		if (this.system.light.remainingSecs < 60) {
			this.lightSourceTimeRemaining = game.i18n.localize(
				"SHADOWDARK.inventory.item.light_seconds_remaining"
			);
		}
		else {
			const timeRemaining = Math.ceil(
				this.system.light.remainingSecs / 60
			);

			this.lightSourceTimeRemaining = game.i18n.format(
				"SHADOWDARK.inventory.item.light_remaining",
				{ timeRemaining }
			);
		}
	}


	async reduceAmmunition(amount) {
		const newAmount = Math.max(0, this.system.quantity - amount);
		this.update({"system.quantity": newAmount});
	}


	setLightRemaining(remainingSeconds) {
		this.update({"system.light.remainingSecs": remainingSeconds});
	}


	/* -------------------------------------------- */
	/*  Roll Methods                                */
	/* -------------------------------------------- */

	async rollItem(parts, data, options={}) {
		options.dialogTemplate =  "systems/shadowdark/templates/dialog/roll-item-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/item-card.hbs";
		await CONFIG.DiceSD.RollDialog(parts, data, options);
	}


	async rollNpcAttack(parts, data, options={}) {
		options.dialogTemplate =  "systems/shadowdark/templates/dialog/roll-npc-attack-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/item-card.hbs";
		await CONFIG.DiceSD.RollDialog(parts, data, options);
	}


	async rollSpell(parts, data, options={}) {
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-spell-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/item-card.hbs";
		options.isSpell = true;
		const roll = await CONFIG.DiceSD.RollDialog(parts, data, options);

		if (roll) {
			if (this.type === "Scroll") {
				data.actor.deleteEmbeddedDocuments("Item", [this._id]);
			}
			else if (this.type === "Wand") {
				if (roll.rolls.main.critical === "failure") {
					data.actor.deleteEmbeddedDocuments("Item", [this._id]);
				}
			}
		}

		return roll;
	}


	async hasProperty(property) {
		property = property.slugify();

		const propertyItems = await this.propertyItems();
		const propertyItem = propertyItems.find(
			p => p.name.slugify() === property
		);

		return propertyItem ? true : false;
	}

	isActiveLight() {
		return this.isLight() && this.system.light.active;
	}

	isBasic() {
		return this.type === "Basic";
	}

	isGem() {
		return this.type === "Gem";
	}

	isScroll() {
		return this.type === "Scroll";
	}

	isWand() {
		return this.type === "Wand";
	}

	isLight() {
		return ["Basic", "Effect"].includes(this.type) && this.system.light.isSource;
	}

	isSpell() {
		return ["Scroll", "Spell", "Wand", "NPC Spell"].includes(this.type);
	}

	isPotion() {
		return this.type === "Potion";
	}

	isEffect() {
		return this.type === "Effect";
	}

	isTalent() {
		return this.type === "Talent";
	}

	isWeapon() {
		return this.type === "Weapon";
	}

	isRangedWeapon() {
		return this.type === "Weapon" && this.system.type === "ranged";
	}

	isMeleeWeapon() {
		return this.type === "Weapon" && this.system.type !== "ranged";
	}

	async isBasicWeapon() {
		return await this.hasProperty("basic-weapon");
	}

	async isFinesseWeapon() {
		return await this.hasProperty("finesse");
	}

	async isThrownWeapon() {
		return await this.hasProperty("thrown");
	}

	async isMagicItem() {
		return this.system.isPhysical && (this.system.magicItem || await this.isExoticMaterial());
	}

	async isExoticMaterial() {
		return await this.hasProperty("ancient-steel") || await this.hasProperty("crysteel") || await this.hasProperty("living-metal");
	}

	async isCrysteel() {
		return await this.hasProperty("crysteel");
	}

	isMagicDamage() {
		return false;
	}

	async isVersatile() {
		return await this.hasProperty("versatile");
	}

	async isExplosive() {
		return await this.hasProperty("explosive");
	}

	async isOneHanded() {
		return await this.hasProperty("one-handed");
	}

	isTwoHanded() {
		const damage = this.system.damage;
		return this.hasProperty("two-handed")
			|| (damage.oneHanded === "" && damage.twoHanded !== "");
	}

	isArmor() {
		return this.type === "Armor";
	}

	async isAShield() {
		if (!this.type === "Armor") return false;

		const isAShield = await this.hasProperty("shield");
		return isAShield;
	}

	async isNotAShield() {
		const isAShield = await this.isAShield();
		return !isAShield;
	}

	async propertiesDisplay() {
		let properties = [];

		if (this.type === "Armor" || this.type === "Weapon") {
			for (const property of await this.propertyItems()) {
				properties.push(property.name);
			}
		}

		return properties.join(", ");
	}

	npcAttackRangesDisplay() {
		let ranges = [];

		if (this.type === "NPC Attack" || this.type === "NPC Special Attack") {
			for (const key of this.system.ranges) {
				ranges.push(
					CONFIG.SHADOWDARK.RANGES[key]
				);
			}
		}

		return ranges.join(", ");
	}


	async propertyItems() {
		const propertyItems = [];

		for (const uuid of this.system.properties ?? []) {
			propertyItems.push(await fromUuid(uuid));
		}

		return propertyItems;
	}

	async addProperty(propertyUuid)
	{
		this.system.properties.push(propertyUuid);
		this.update({"system.properties": this.system.properties});
	}

	/**
	 * Returns the total duration depending on the type
	 * of effect that is configured.
	 * @return {number|Infinity}
	 */
	get totalDuration() {
		const { duration } = this.system;
		if (["unlimited", "focus", "permanent"].includes(duration.type)) {
			return Infinity;
		}
		else if (["instant"].includes(duration.type)) {
			return 0;
		}
		else {
			return duration.value
				* (CONFIG.SHADOWDARK.DURATION_UNITS[duration.type] ?? 0);
		}
	}


	/**
	 * Calculates the remaining duration, if the Effect is expired, and
	 * the progress of the effect (current vs total time).
	 * Returns false for non-Effect items
	 * @returns {false|{expired: boolean, remaining: Int, progress: Int}}
	 */
	get remainingDuration() {
		if (this.type !== "Effect") return false;

		// Handle rounds-effects
		if (this.system.duration.type === "rounds") {
			// If there is combat, check if it was added during combat, otherwise
			// consider it expired
			if (game.combat) {
				const startCombatTime = this.system.start.combatTime;
				if (!startCombatTime) return { expired: true, remaining: 0, progress: 100 };

				const round = startCombatTime.split(".")[0];
				const turn = startCombatTime.split(".")[1];

				// If it is a new round or the same turn the effect
				// was initiated, calculate duration
				if (
					round !== game.combat.round
					|| turn !== game.combat.turn
				) {
					const duration = parseInt(this.system.duration.value, 10);
					const remaining = parseInt(round, 10) + duration - game.combat.round;
					const progress = (100 - Math.floor(100 * remaining / duration));
					return {
						expired: remaining <= 0,
						remaining,
						progress,
					};
				}
				else {
					return false;
				}
			}
			// If added outside combat, expire the effect
			else {
				return { expired: true, remaining: 0, progress: 100 };
			}
		}

		// Handle timing effects
		const duration = this.totalDuration;

		if (duration === Infinity) {
			return { expired: false, remaining: Infinity, progress: 0 };
		}
		else if (!duration) {
			return { expired: true, remaining: 0, progress: 0 };
		}
		else {
			const start = this.system.start?.value ?? 0;
			const remaining = start + duration - game.time.worldTime;
			const progress = (100 - Math.floor(100 * remaining / duration));
			const result = { expired: remaining <= 0, remaining, progress };
			return result;
		}
	}

	async getSpellClassesDisplay() {
		const classes = [];

		for (const uuid of this.system.class ?? []) {
			const item = await fromUuid(uuid);
			classes.push(item.name);
		}

		classes.sort((a, b) => a.localeCompare(b));

		return classes.join(", ");
	}

	static async increasePower(power, steps) {
		var updated = false;
		if (power.system.duration_increase)
		{
			var increaseAtHowManyLevels = parseInt(power.system.duration_increase_step);
			if (increaseAtHowManyLevels <= steps)
			{
				if (steps % increaseAtHowManyLevels == 0)
				{
					var increases = Math.floor(steps / increaseAtHowManyLevels);
					
					switch (power.system.duration_increase)
					{
						case "once":
							if (power.system.duration.includes("-"))
							{
								var durationParts = tpoweris.system.duration.split("-");
								var howMany = parseInt(durationParts[0]);
								var durationLength = durationParts[1];
								howMany += increases;
								power.increasedDuration = howMany + "-" + durationLength;
								updated = true;
							}
							break;
						case "one-step":
							if (power.system.duration.includes("-"))
							{
								var durationParts = power.system.duration.split("-");
								var howMany = parseInt(durationParts[0]);
								var durationLength = durationParts[1];

								var indexOf = CONFIG.SHADOWDARK.SEIRIZIAN_DURATIONS_STEPS.indexOf(durationLength);

								if (indexOf >= 0)
								{
									var newIndex = indexOf += increases;
									if (newIndex >= CONFIG.SHADOWDARK.SEIRIZIAN_DURATIONS_STEPS.length)
										newIndex = CONFIG.SHADOWDARK.SEIRIZIAN_DURATIONS_STEPS.length - 1;
									var newDuration = CONFIG.SHADOWDARK.SEIRIZIAN_DURATIONS_STEPS[newIndex];
									power.increasedDuration = howMany + "-" + newDuration;
									updated = true;
								}
							}
							break;
					}
				}
			}
		}

		if (power.system.damage_increase)
		{
			var increaseAtHowManyLevels = parseInt(power.system.damage_increase_step);
			if (increaseAtHowManyLevels <= steps)
			{
				if (steps % increaseAtHowManyLevels == 0)
				{
					var increases = Math.floor(steps / increaseAtHowManyLevels);
					var damageParts = power.system.damage.split("d");
					var damageIncreaseParts = power.system.damage_increase.split("d");
					if (damageParts[0])
					{
						var newDamageDice = parseInt(damageParts[0]) + parseInt(damageIncreaseParts[0]) * increases;
						if (damageParts[1])
							power.increasedDamage = newDamageDice + 'd' + damageParts[1];
						else
							power.increasedDamage = newDamageDice;
						updated = true;
					}
				}
			}
		}

		if (updated) return power;
		return null;
	}
}
