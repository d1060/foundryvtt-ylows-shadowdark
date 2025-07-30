import ItemSD from "./ItemSD.mjs";
import MetalMagicSD from "../sheets/magic/MetalMagicSD.mjs";

export default class ActorSD extends Actor {

	_abilityModifier(abilityScore) {
		if (abilityScore < 1) return -5;
		if (abilityScore >= 1 && abilityScore <= 3) return -4;
		if (abilityScore >= 4 && abilityScore <= 5) return -3;
		if (abilityScore >= 6 && abilityScore <= 7) return -2;
		if (abilityScore >= 8 && abilityScore <= 9) return -1;
		if (abilityScore >= 10 && abilityScore <= 11) return 0;
		if (abilityScore >= 12 && abilityScore <= 13) return 1;
		if (abilityScore >= 14 && abilityScore <= 15) return 2;
		if (abilityScore >= 16 && abilityScore <= 17) return 3;
		if (abilityScore >= 18 && abilityScore <= 19) return 4;
		if (abilityScore >= 20 && abilityScore <= 21) return 5;
		if (abilityScore >= 22 && abilityScore <= 23) return 6;
		if (abilityScore >= 24 && abilityScore <= 25) return 7;
		if (abilityScore >= 26 && abilityScore <= 27) return 8;
		if (abilityScore >= 28 && abilityScore <= 29) return 9;
		if (abilityScore >= 30) return 10;
	}


	async _applyHpRollToMax(value) {
		const currentHpBase = this.system.attributes.hp.base;
		await this.update({"system.attributes.hp.base": currentHpBase + value,});
	}


	async _getItemFromUuid(uuid) {
		if (uuid !== "") {
			return await fromUuid(uuid);
		}
		else {
			return null;
		}
	}


	async _learnSpell(item) {
		const characterClass = await this.getClass();

		const spellcastingAttribute =
			characterClass?.system?.spellcasting?.ability ?? "int";

		const result = await this.rollAbility(
			spellcastingAttribute,
			{ target: CONFIG.SHADOWDARK.DEFAULTS.LEARN_SPELL_DC }
		);

		// Player cancelled the roll
		if (result === null) return;

		const success = result?.rolls?.main?.success?.value ?? false;

		const messageType = success
			? "SHADOWDARK.chat.spell_learn.success"
			: "SHADOWDARK.chat.spell_learn.failure";

		const message = game.i18n.format(
			messageType,
			{
				name: this.name,
				spellName: item.system.spellName,
			}
		);

		const cardData = {
			actor: this,
			item: item,
			message,
		};

		let template = "systems/shadowdark/templates/chat/spell-learn.hbs";

		const content = await foundry.applications.handlebars.renderTemplate(template, cardData);

		const title = game.i18n.localize("SHADOWDARK.chat.spell_learn.title");

		await ChatMessage.create({
			title,
			content,
			flags: { "core.canPopout": true },
			flavor: title,
			speaker: ChatMessage.getSpeaker({ actor: this, token: this.token }),
			type: CONST.CHAT_MESSAGE_STYLES.OTHER,
			user: game.user.id,
		});

		if (success) {
			const spell = {
				type: "Spell",
				img: item.system.spellImg,
				name: item.system.spellName,
				system: {
					class: item.system.class,
					description: item.system.description,
					duration: item.system.duration,
					range: item.system.range,
					tier: item.system.tier,
				},
			};

			this.createEmbeddedDocuments("Item", [spell]);
		}

		// original scroll always lost regardless of outcome
		await this.deleteEmbeddedDocuments(
			"Item",
			[item._id]
		);
	}

	async _npcRollHP(options={}) {
		const data = {
			rollType: "hp",
			actor: this,
			conBonus: this.system.abilities?.con?.mod ?? 0,
		};

		const parts = [`max(1, ${this.system.level?.value ?? 1}d8 + @conBonus)`];

		options.fastForward = true;
		options.chatMessage = true;

		options.title = game.i18n.localize("SHADOWDARK.dialog.hp_roll.title");
		options.flavor = options.title;
		options.speaker = ChatMessage.getSpeaker({ actor: this });
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-card.hbs";
		options.rollMode = CONST.DICE_ROLL_MODES.PRIVATE;

		if (this.system.level?.value)
		{
			const result = await CONFIG.DiceSD.RollDialog(parts, data, options);

			const newHp = Number(result.rolls.main.roll._total);
			await this.update({
				"system.attributes.hp.max": newHp,
				"system.attributes.hp.value": newHp,
			});
		}
		else
		{
			await this.update({
				"system.attributes.hp.max": 1,
				"system.attributes.hp.value": 1,
			});
		}
	}


	async _playerRollHP(options={}) {
		const characterClass = await this.getClass();

		if (!characterClass) {
			ui.notifications.error(
				game.i18n.format("SHADOWDARK.error.general.no_character_class"),
				{permanent: false}
			);
			return;
		}

		const data = {
			rollType: "hp",
			actor: this,
		};

		options.title = game.i18n.localize("SHADOWDARK.dialog.hp_roll.title");
		options.flavor = options.title;
		options.speaker = ChatMessage.getSpeaker({ actor: this });
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-hp.hbs";

		const parts = [characterClass.system.hitPoints];

		await CONFIG.DiceSD.RollDialog(parts, data, options);
	}


	_populatePlayerModifiers() {
		for (const ability of CONFIG.SHADOWDARK.ABILITY_KEYS) {
			this.system.abilities[ability].mod = this.abilityModifier(ability);
		}
	}


	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		// Some sensible token defaults for Actors
		const prototypeToken = {
			actorLink: false,
			sight: {
				enabled: false,
			},
		};

		if (data.type === "Player") {
			prototypeToken.sight.enabled = true;
			prototypeToken.actorLink = true;
		}

		this.updateSource({prototypeToken});
	}


	_prepareNPCData() {}


	_preparePlayerData() {
		this._populatePlayerModifiers();
	}


	abilityModifier(ability) {
		if (this.type === "Player") {

			var magicModifier = 0;
			if (ability === "int" || ability === "wis" || ability === "cha")
			{
				if (this.system.magic?.disturbance)
					magicModifier = parseInt(this.system.magic.disturbance[ability] ?? '0');
			}
			if (ability === "str" || ability === "dex" || ability === "con")
			{
				if (this.system.magic?.corruption)
					magicModifier = parseInt(this.system.magic.corruption[ability] ?? '0');
			}
			
			return this._abilityModifier(
				this.system.abilities[ability].base
					+ this.system.abilities[ability].bonus
						+ magicModifier
			);
		}
		else {
			return this.system.abilities[ability].mod;
		}
	}


	baseAbilityModifier(ability) {
		if (this.type === "Player") {

			return this._abilityModifier(
				this.system.abilities[ability].base
					+ this.system.abilities[ability].bonus
			);
		}
		else {
			return this.system.abilities[ability].mod;
		}
	}


	async addAncestry(item) {
		await this.update({"system.ancestry": item.uuid});
	}


	async addBackground(item) {
		await this.update({"system.background": item.uuid});
	}

	async addClass(item) {
		await this.update({"system.class": item.uuid});
	}


	async addDeity(item) {
		await this.update({"system.deity": item.uuid});
	}


	async addLanguage(item) {
		let languageFound = false;
		for (const language of await this.languageItems()) {
			if (language.uuid === item.uuid) {
				languageFound = true;
				break;
			}
		}

		if (!languageFound) {
			const currentLanguages = this.system.languages;
			currentLanguages.push(item.uuid);
			await this.update({"system.languages": currentLanguages});
		}
	}


	async addPatron(item) {
		const myClass = await this.getClass();

		if (myClass && myClass.system.patron.required) {
			await this.update({"system.patron": item.uuid});
		}
		else {
			ui.notifications.error(
				game.i18n.localize("SHADOWDARK.error.patron.no_supported_class")
			);
		}
	}


	async addToHpBase(hp) {
		const currentHpBase = this.system.attributes.hp.base;
		await this.update({"system.attributes.hp.base": currentHpBase + hp,});
	}


	ammunitionItems(key) {
		return this.items.filter(i => {
			if (key) {
				return i.system.isAmmunition
					&& i.system.quantity > 0
					&& i.name.slugify() === key;
			}
			else {
				return i.system.isAmmunition && i.system.quantity > 0;
			}
		});
	}

	reduceQuantity(item, amount) {
		let foundItem = this.items.find(i => i.id === item.id)
		if (foundItem)
		{
			if (foundItem.system.quantity > 1)
			{
				foundItem.reduceAmmunition(amount);
			}
			else
			{
				this.deleteEmbeddedDocuments(
					"Item",
					[foundItem._id]
				);
			}
		}
	}

	/**
	 * Applies the given number to the Actor or Token's HP value.
	 * The multiplier is a convenience feature to apply healing
	 *  or true multiples of a damage value.
	 *  * 1 => damage as rolled
	 *  * 0.5 => half damage (resistance)
	 *  * -1 => healing
	 *
	 * @param {number} damageAmount
	 * @param {number} multiplier
	 */
	async applyDamage(damageAmount, multiplier) {
		const amountToApply = Math.floor(parseInt(damageAmount) * multiplier);
		let leftoverDamage = amountToApply;
		if (this.system.attributes.hp.temp)
		{
			const currentHpValue = parseInt(this.system.attributes.hp.temp);
			const actualDamage = amountToApply <= currentHpValue ? amountToApply : currentHpValue;
			leftoverDamage = leftoverDamage - actualDamage;

			// Ensures that we don't go above Max or below Zero
			const newHpValue = currentHpValue - actualDamage;
			this.system.attributes.hp.temp = newHpValue;
			await this.update({"system.attributes.hp.temp": newHpValue});
		}

		if (this.system.magic?.manifestedMetalCore)
		{
			const currentHpValue = this.system.magic.metalCore.hp.value;
			const actualDamage = amountToApply <= currentHpValue ? amountToApply : currentHpValue;
			leftoverDamage = leftoverDamage - actualDamage;

			// Ensures that we don't go above Max or below Zero
			const newHpValue = currentHpValue - actualDamage;
			this.system.magic.metalCore.hp.value = newHpValue;
			await this.update({"system.magic.metalCore.hp.value": newHpValue});

			if (newHpValue <= 0)
				MetalMagicSD._onManifestMetalCore(this, null, null);
		}

		if (leftoverDamage)
		{
			const maxHpValue = this.system.attributes.hp.max;
			const currentHpValue = this.system.attributes.hp.value;

			// Ensures that we don't go above Max or below Zero
			const newHpValue = Math.clamp(currentHpValue - leftoverDamage, 0, maxHpValue);

			this.system.attributes.hp.value = newHpValue;
			await this.update({"system.attributes.hp.value": newHpValue});
		}
	}

	async applyHealing(healingAmount) {
		const maxHpValue = this.system.attributes.hp.max;
		const currentHpValue = this.system.attributes.hp.value;
		const amountToApply = parseInt(healingAmount);

		// Ensures that we don't go above Max or below Zero
		const newHpValue = Math.clamp(currentHpValue + amountToApply, 0, maxHpValue);

		this.system.attributes.hp.value = newHpValue;
		await this.update({"system.attributes.hp.value": newHpValue});
	}

	attackBonus(attackType) {
		switch (attackType) {
			case "melee":
				return this.abilityModifier("str");
			case "ranged":
				return this.abilityModifier("dex");
			default:
				throw new Error(`Unknown attack type ${attackType}`);
		}
	}


	async buildNpcAttackDisplays(itemId) {
		const item = this.getEmbeddedDocument("Item", itemId);

		const attackOptions = {
			attackType: item.system.attackType,
			attackName: item.name,
			// numAttacks: item.system.attack.num,
			attackBonus: parseInt(item.system.bonuses.attackBonus, 10),
			baseDamage: item.system.damage.value,
			bonusDamage: parseInt(item.system.bonuses.damageBonus, 10),
			itemId,
			special: item.system.damage.special,
			ranges: item.system.ranges.map(s => game.i18n.localize(CONFIG.SHADOWDARK.RANGES[s])).join("/"),
			type: item.system.damage.type ? game.i18n.localize(CONFIG.SHADOWDARK.DAMAGE_TYPES[item.system.damage.type]) : game.i18n.localize('SHADOWDARK.damage_type.bludgeoning'),
		};

		attackOptions.numAttacks = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			item.system.attack.num,
			{
				async: true,
			}
		);

		return await foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/_partials/npc-attack.hbs",
			attackOptions
		);
	}

	async buildNpcSpecialDisplays(itemId) {
		const item = this.getEmbeddedDocument("Item", itemId);

		const description = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			jQuery(item.system.description).text(),
			{
				async: true,
			}
		);

		const attackOptions = {
			attackName: item.name,
			// numAttacks: item.system.attack.num,
			attackBonus: item.system.bonuses.attackBonus,
			itemId,
			ranges: item.system.ranges.map(s => game.i18n.localize(
				CONFIG.SHADOWDARK.RANGES[s])).join("/"),
			description,
		};

		attackOptions.numAttacks = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			item.system.attack.num,
			{
				async: true,
			}
		);

		return await foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/_partials/npc-special-attack.hbs",
			attackOptions
		);
	}


	async buildWeaponDisplay(options) {
		return await foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/_partials/weapon-attack.hbs",
			options
		);
	}


	async buildWeaponDisplays(itemId) {
		const item = this.getEmbeddedDocument("Item", itemId);

		const meleeAttack = this.attackBonus("melee");
		const rangedAttack = this.attackBonus("ranged");

		const baseAttackBonus = await item.isFinesseWeapon()
			? Math.max(meleeAttack, rangedAttack)
			: this.attackBonus(item.system.type);

		const weaponOptions = {
			weaponId: itemId,
			weaponName: item.name,
			handedness: "",
			attackBonus: 0,
			attackRange: "",
			baseDamage: "",
			bonusDamage: 0,
			attackOption: "",
			extraDamageDice: "",
			properties: await item.propertiesDisplay(),
			meleeAttackBonus: this.system.bonuses.meleeAttackBonus,
			rangedAttackBonus: this.system.bonuses.rangedAttackBonus,
		};

		await this.getExtraDamageDiceForWeapon(item, weaponOptions);

		const weaponDisplays = {melee: [], ranged: []};

		const weaponMasterBonus = this.calcWeaponMasterBonus(item);
		weaponOptions.bonusDamage = weaponMasterBonus;

		// Find out if the user has a modified damage die
		let oneHanded = item.system.damage.oneHanded ?? false;
		let twoHanded = item.system.damage.twoHanded ?? false;

		// Improve the base damage die if this weapon has the relevant property
		for (const property of this.system.bonuses.weaponDamageDieImprovementByProperty) {
			if (await item.hasProperty(property)) {
				oneHanded = shadowdark.utils.getNextDieInList(
					oneHanded,
					shadowdark.config.DAMAGE_DICE
				);

				twoHanded = shadowdark.utils.getNextDieInList(
					twoHanded,
					shadowdark.config.DAMAGE_DICE
				);
			}
		}

		if (this.system.bonuses.overdraw)
		{
			if (!Array.isArray(this.system.bonuses.overdraw))
				this.system.bonuses.overdraw = [this.system.bonuses.overdraw];

			for (const overdrawWeapon of this.system.bonuses.overdraw)
			{
				if (overdrawWeapon == item.name.slugify())
				{
					if (oneHanded) {
						oneHanded = shadowdark.utils.getNextDieInList(
							oneHanded,
							shadowdark.config.DAMAGE_DICE
						);
					}

					if (twoHanded) {
						twoHanded = shadowdark.utils.getNextDieInList(
							twoHanded,
							shadowdark.config.DAMAGE_DICE
						);
					}
				}
			}
		}
		
		if (this.system.bonuses.unarmedStrike && await item.hasProperty("unarmed"))
		{
			//shadowdark.log(`Improving Unarmed Attack damage die due to Unarmed Strike`);
			if (oneHanded) {
				oneHanded = shadowdark.utils.getNextDieInList(
					oneHanded,
					shadowdark.config.DAMAGE_DICE
				);
			}

			if (twoHanded) {
				twoHanded = shadowdark.utils.getNextDieInList(
					twoHanded,
					shadowdark.config.DAMAGE_DICE
				);
			}
			
			if (this.system.level.value >= 3)
			{
				if (oneHanded) {
					oneHanded = shadowdark.utils.getNextDieInList(
						oneHanded,
						shadowdark.config.DAMAGE_DICE
					);
				}

				if (twoHanded) {
					twoHanded = shadowdark.utils.getNextDieInList(
						twoHanded,
						shadowdark.config.DAMAGE_DICE
					);
				}
			}
			
			if (this.system.level.value >= 9)
			{
				if (oneHanded) {
					oneHanded = shadowdark.utils.getNextDieInList(
						oneHanded,
						shadowdark.config.DAMAGE_DICE
					);
				}

				if (twoHanded) {
					twoHanded = shadowdark.utils.getNextDieInList(
						twoHanded,
						shadowdark.config.DAMAGE_DICE
					);
				}
			}
		}

		if (this.system.bonuses.devastatingBlows && await item.hasProperty("unarmed"))
		{
			//shadowdark.log(`Improving Unarmed Attack damage die due to Devastating Blows: ${this.system.bonuses.devastatingBlows}`);
			for (let i = 0; i < this.system.bonuses.devastatingBlows; i++)
			{
				if (oneHanded) {
					oneHanded = shadowdark.utils.getNextDieInList(
						oneHanded,
						shadowdark.config.DAMAGE_DICE
					);
				}

				if (twoHanded) {
					twoHanded = shadowdark.utils.getNextDieInList(
						twoHanded,
						shadowdark.config.DAMAGE_DICE
					);
				}
			}
		}

		if (this.system.bonuses.weaponDamageDieD12.some(t =>
			[item.name.slugify(), item.system.baseWeapon.slugify()].includes(t)
		)) {
			oneHanded = oneHanded ? "d12" : false;
			twoHanded = twoHanded ? "d12" : false;
		}

		if (item.system.type === "melee") {
			weaponOptions.attackBonus =	baseAttackBonus
				+ parseInt(this.system.bonuses.meleeAttackBonus, 10)
				+ parseInt(item.system.bonuses.attackBonus, 10)
				+ weaponMasterBonus;

			weaponOptions.bonusDamage +=
				parseInt(this.system.bonuses.meleeDamageBonus, 10)
				+ parseInt(item.system.bonuses.damageBonus, 10);

			weaponOptions.attackRange = CONFIG.SHADOWDARK.RANGES_SHORT.close;

			if (oneHanded) {
				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[oneHanded];
				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.oneHanded_short");
				if (await item.hasProperty('supersharp')) weaponOptions.baseDamage += '+1';

				weaponDisplays.melee.push({
					display: await this.buildWeaponDisplay(weaponOptions),
					handedness: "1h",
					baseDamage: weaponOptions.baseDamage,
					itemId,
				});
			}
			if (twoHanded) {
				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[
					twoHanded
				];
				if (await item.hasProperty('supersharp')) weaponOptions.baseDamage += '+1';
				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.twoHanded_short");

				weaponDisplays.melee.push({
					display: await this.buildWeaponDisplay(weaponOptions),
					handedness: "2h",
					baseDamage: weaponOptions.baseDamage,
					itemId,
				});
			}
			
			if (this.system.bonuses.quickStrike)
			{
				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[oneHanded];
				var parts = weaponOptions.baseDamage.split("d");
				parts[0] = parseInt(parts[0]) + 1;
				weaponOptions.baseDamage = parts.join("d");
				if (await item.hasProperty('supersharp')) weaponOptions.baseDamage += '+1';
				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.oneHanded_short") + ", quick strike";
				var attackBonus = weaponOptions.attackBonus;
				weaponOptions.attackBonus -= 2;
				weaponOptions.attackOption = "quickStrike";

				weaponDisplays.melee.push({
					display: await this.buildWeaponDisplay(weaponOptions),
					handedness: "1h",
					attackOption: "quickStrike",
					baseDamage: weaponOptions.baseDamage,
					itemId,
				});
				
				if (item.system.damage.twoHanded) {
					weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[
						item.system.damage.twoHanded
					];
					var parts = weaponOptions.baseDamage.split("d");
					parts[0] = parseInt(parts[0]) + 1;
					weaponOptions.baseDamage = parts.join("d");
					if (await item.hasProperty('supersharp')) weaponOptions.baseDamage += '+1';
					weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.twoHanded_short") + ", quick strike";

					weaponDisplays.melee.push({
						display: await this.buildWeaponDisplay(weaponOptions),
						handedness: "2h",
						attackOption: "quickStrike",
						baseDamage: weaponOptions.baseDamage,
						itemId,
					});
				}
			
				weaponOptions.attackOption = "";
				weaponOptions.attackBonus = attackBonus;
			}
			
			if (this.system.bonuses.dualWeaponAttack && await this.isDualWielding())
			{
				var weapon1 = null;
				var weapon2 = null;
				const equippedWeaponItems = this.items.filter(
					item => item.type === "Weapon" && item.system.equipped
				);
				for (const item of equippedWeaponItems)
				{
					const isUnarmedAttack = await item.hasProperty('unarmed');
					if (item.system.damage && item.system.damage.oneHanded && item.system.damage.oneHanded !== "" && (!item.system.damage.twoHanded || item.system.damage.twoHanded === "") && !isUnarmedAttack)
					{
						if (!weapon1) weapon1 = item;
						else
						{
							weapon2 = item;
							break;
						}
					}
				}
				
				if (itemId === weapon2._id)
				{
					var weapon1Parts = weapon1.system.damage.oneHanded.split("d");
					var weapon2Parts = weapon2.system.damage.oneHanded.split("d");
					var dualWieldDamage = "";
					
					if (weapon1Parts[0] === "") weapon1Parts[0] = "1";
					if (weapon2Parts[0] === "") weapon2Parts[0] = "1";
					
					if (weapon1Parts[1] === weapon2Parts[1])
					{
						var numDice = parseInt(weapon1Parts[0]) + parseInt(weapon2Parts[0]);
						var diceType = weapon1Parts[1];
						dualWieldDamage = numDice + "d" + diceType;
					}
					else
					{
						dualWieldDamage = weapon1Parts.join("d") + "+" + weapon2Parts.join("d");
					}
					
					var weaponName = weaponOptions.weaponName;
					weaponOptions.weaponName = "Dual Wield";
					weaponOptions.baseDamage = dualWieldDamage;
					if (await weapon1.hasProperty('supersharp') && await weapon1.hasProperty('supersharp')) weaponOptions.baseDamage += '+2';
					else if (await weapon1.hasProperty('supersharp') || await weapon1.hasProperty('supersharp')) weaponOptions.baseDamage += '+1';

					weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.twoHanded_short");
					var attackBonus = weaponOptions.attackBonus;
					weaponOptions.attackOption = "dualWeaponAttack";

					weaponDisplays.melee.push({
						display: await this.buildWeaponDisplay(weaponOptions),
						handedness: "1h",
						attackOption: "dualWeaponAttack",
						baseDamage: dualWieldDamage,
						itemId,
					});
					
					weaponOptions.weaponName = weaponName;
					weaponOptions.attackOption = "";
					weaponOptions.attackBonus = attackBonus;
				}
			}

			// if thrown build range attack option
			if (await item.hasProperty("thrown")) {

				const thrownBaseBonus = Math.max(meleeAttack, rangedAttack);

				weaponOptions.attackBonus = thrownBaseBonus
					+ parseInt(this.system.bonuses.rangedAttackBonus, 10)
					+ parseInt(item.system.bonuses.attackBonus, 10)
					+ weaponMasterBonus;

				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[oneHanded];
				if (await item.hasProperty('supersharp')) weaponOptions.baseDamage += '+1';

				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.oneHanded_short");
				weaponOptions.attackRange = CONFIG.SHADOWDARK.RANGES_SHORT[
					item.system.range
				];
				weaponOptions.bonusDamage =
					weaponMasterBonus
					+ parseInt(this.system.bonuses.rangedDamageBonus, 10)
					+ parseInt(item.system.bonuses.damageBonus, 10);

				weaponDisplays.ranged.push({
					display: await this.buildWeaponDisplay(weaponOptions),
					handedness: "1h",
					baseDamage: weaponOptions.baseDamage,
					itemId,
				});
			}
		}
		else if (item.system.type === "ranged") {
			weaponOptions.attackBonus = baseAttackBonus
				+ parseInt(this.system.bonuses.rangedAttackBonus, 10)
				+ parseInt(item.system.bonuses.attackBonus, 10)
				+ weaponMasterBonus;

			weaponOptions.bonusDamage +=
				parseInt(this.system.bonuses.rangedDamageBonus, 10)
				+ parseInt(item.system.bonuses.damageBonus, 10);

			weaponOptions.attackRange = CONFIG.SHADOWDARK.RANGES_SHORT[
				item.system.range
			];

			if (oneHanded) {
				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[oneHanded];
				if (await item.hasProperty('supersharp')) weaponOptions.baseDamage += '+1';
				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.oneHanded_short");

				weaponDisplays.ranged.push({
					display: await this.buildWeaponDisplay(weaponOptions),
					handedness: "1h",
					baseDamage: weaponOptions.baseDamage,
					itemId,
				});
			}
			if (twoHanded) {
				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[twoHanded];
				if (await item.hasProperty('supersharp')) weaponOptions.baseDamage += '+1';
				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.twoHanded_short");

				weaponDisplays.ranged.push({
					display: await this.buildWeaponDisplay(weaponOptions),
					handedness: "2h",
					baseDamage: weaponOptions.baseDamage,
					itemId,
				});
			}
		}

		return weaponDisplays;
	}


	calcAbilityValues(ability) {
		var magicModifier = 0;
		if (ability === "int" || ability === "wis" || ability === "cha")
		{
			if (this.system.magic?.disturbance)
				magicModifier = parseInt(this.system.magic.disturbance[ability] ?? '0');
		}
		if (ability === "str" || ability === "dex" || ability === "con")
		{
			if (this.system.magic?.corruption)
				magicModifier = parseInt(this.system.magic.corruption[ability] ?? '0');
		}

		const total = this.system.abilities[ability].base
			+ this.system.abilities[ability].bonus
			+ magicModifier;

		const labelKey = `SHADOWDARK.ability_${ability}`;

		return {
			total,
			bonus: this.system.abilities[ability].bonus,
			base: this.system.abilities[ability].base,
			modifier: this.system.abilities[ability].mod,
			magicModifier: magicModifier,
			label: `${game.i18n.localize(labelKey)}`,
		};
	}


	/**
	 * Checks if the item (weapon) has any combination of settings
	 * or the actor has bonuses that would mean it should have weapon
	 * mastery bonuses applied to it.
	 * @param {Item} item - Item to calculate bonus for
	 * @returns {number} bonus
	 */
	calcWeaponMasterBonus(item) {
		let bonus = 0;

		if (
			item.system.weaponMastery
			|| this.system.bonuses.weaponMastery.includes(item.system.baseWeapon)
			|| this.system.bonuses.weaponMastery.includes(item.name.slugify())
		) {
			bonus += 1 + Math.floor(this.system.level.value / 2);
		}

		return bonus;
	}


	async canBackstab() {
		const backstab = this.items.find(i => {
			return i.type === "Talent"
				&& i.name === "Backstab";
		});

		return backstab ? true : false;
	}


	async canUseMagicItems() {
		const characterClass = await this.getClass();

		const spellcastingClass =
			characterClass?.system?.spellcasting?.ability ?? "";

		return characterClass && spellcastingClass !== ""
			? true
			: false;
	}


	async castSpell(itemId, options={}) {
		const item = this.items.get(itemId);

		if (!item) {
			ui.notifications.warn(
				"Item no longer exists",
				{ permanent: false }
			);
			return;
		}

		const abilityId = await this.getSpellcastingAbility(item);

		if (abilityId === "") {
			if (item.type === "Spell") {
				return ui.notifications.error(
					game.i18n.format("SHADOWDARK.error.spells.unable_to_cast_spell"),
					{permanent: false}
				);
			}
			return ui.notifications.error(
				game.i18n.format("SHADOWDARK.error.spells.unable_to_use_item"),
				{permanent: false}
			);
		}

		let rollType;
		if (item.type === "Spell") {
			rollType = item.name.slugify();
		}
		else {
			rollType = item.system.spellName.slugify();
		}

		const characterClass = await this.getClass();

		const data = {
			rollType,
			item: item,
			actor: this,
			abilityBonus: this.abilityModifier(abilityId),
			baseDifficulty: characterClass?.system?.spellcasting?.baseDifficulty ?? 10,
			talentBonus: this.system.bonuses.spellcastingCheckBonus,
		};

		const parts = [game.settings.get("shadowdark", "use2d10") ? "2d10" : "1d20", "@abilityBonus", "@talentBonus"];

		// TODO: push to parts & for set talentBonus as sum of talents affecting
		// spell rolls

		return item.rollSpell(parts, data, options);
	}


	async castNPCSpell(itemId, options={}) {
		const item = this.items.get(itemId);

		const abilityBonus = this.system.spellcastingBonus;

		const rollType = item.name.slugify();

		const data = {
			rollType,
			item: item,
			actor: this,
			abilityBonus: abilityBonus,
		};

		const parts = [game.settings.get("shadowdark", "use2d10") ? "2d10" : "1d20", "@abilityBonus"];

		options.isNPC = true;

		return item.rollSpell(parts, data, options);
	}


	async changeLightSettings(lightData) {
		const token = this.getCanvasToken();
		if (token) await token.document.update({light: lightData});

		// Update the prototype as well
		await Actor.updateDocuments([{
			"_id": this._id,
			"prototypeToken.light": lightData,
		}]);

		game.shadowdark.lightSourceTracker._updateLightSources();
	}


	async getActiveLightSources() {
		const items = this.items.filter(
			item => item.isActiveLight()
		).sort((a, b) => {
			const a_name = a.name.toLowerCase();
			const b_name = b.name.toLowerCase();
			if (a_name < b_name) {
				return -1;
			}
			if (a_name > b_name) {
				return 1;
			}
			return 0;
		});

		return items;
	}


	async getAncestry() {
		const uuid = this.system.ancestry ?? "";
		return await this._getItemFromUuid(uuid);
	}


	async getArmorClass() {
		const dexModifier = this.abilityModifier("dex");

		let baseArmorClass = shadowdark.defaults.BASE_ARMOR_CLASS;
		let armorClassTooltip = "Base: " + shadowdark.defaults.BASE_ARMOR_CLASS + "<br>";
		if (this.system.magic?.manifestedMetalCore)
		{
			baseArmorClass = 14;
			armorClassTooltip= "Base: 14<br>";
			if (this.system.bonuses.metalCoreAcBonus)
			{
				baseArmorClass += this.system.bonuses.metalCoreAcBonus;
				armorClassTooltip += "Metal Core Bonus: " + this.system.bonuses.metalCoreAcBonus + "<br>";
			}
		}

		if (this.system.bonuses?.dexBonusToAc) dexModifier += this.system.bonuses?.dexBonusToAc;
		
		baseArmorClass += dexModifier;
		if (dexModifier)
			armorClassTooltip += "DEX modifier: " + dexModifier + "<br>";

		for (const attribute of this.system.bonuses?.acBonusFromAttribute ?? []) {
			const attributeBonus = this.abilityModifier(attribute);
			baseArmorClass += attributeBonus > 0 ? attributeBonus : 0;
			if (attributeBonus)
				armorClassTooltip += attribute.toUpperCase() + " modifier: " + attributeBonus + "<br>";
		}

		let newArmorClass = baseArmorClass;
		let shieldBonus = 0;

		const acOverride = this.system.attributes.ac?.override ?? null;
		if (Number.isInteger(acOverride)) {
			// AC is being overridden by an effect so we just use that value
			// and ignore everything else
			newArmorClass = acOverride;
			armorClassTooltip = "AC override: " + acOverride;
		}
		else {
			let armorMasteryBonus = 0;

			const equippedArmorItems = this.items.filter(
				item => item.type === "Armor" && item.system.equipped
			);
			const equippedWeaponItems = this.items.filter(
				item => item.type === "Weapon" && item.system.equipped
			);
			const equippedArmor = [];
			const equippedShields = [];

			for (const item of equippedArmorItems) {
				if (await item.isAShield()) {
					equippedShields.push(item);
				}
				else {
					equippedArmor.push(item);
				}
			}

			if (equippedShields.length > 0) {
				const firstShield = equippedShields[0];
				shieldBonus = firstShield.system.ac.modifier;

				armorMasteryBonus = this.system.bonuses.armorMastery.filter(
					a => a === firstShield.name.slugify()
							|| a === firstShield.system.baseArmor
				).length;
			}

			if (equippedArmor.length > 0) {
				newArmorClass = 0;
				armorClassTooltip = "";

				let bestAttributeBonus = null;
				let bestAttributeForBonus = '';
				let baseArmorClassApplied = false;
				var isEquippingHeavyArmor = false;

				for (const armor of equippedArmor) {

					// Check if armor mastery should apply to the AC.  Multiple
					// mastery levels should stack
					//
					const masteryLevels = this.system.bonuses.armorMastery.filter(
						a => a === armor.name.slugify()
							|| a === armor.system.baseArmor
					);
					armorMasteryBonus += masteryLevels.length;

					if (armor.system.ac.base > 0)
					{
						baseArmorClassApplied = true;
						armorClassTooltip += "Base AC: " + armor.system.ac.base + "<br>";
					}

					newArmorClass += armor.system.ac.base;
					newArmorClass += armor.system.ac.modifier;
					if (armor.system.ac.modifier)
						armorClassTooltip += "Shield AC modifier: " + armor.system.ac.modifier + "<br>";

					let armorExpertise = (this.system.bonuses.armorExpertise != null && this.system.bonuses?.armorExpertise == armor.name.slugify()) ? 1 : 0;
					newArmorClass += armorExpertise;
					if (armorExpertise)
						armorClassTooltip += "Armor Expertise: " + armorExpertise + "<br>";
				
					const attribute = armor.system.ac.attribute;
					if (attribute) {
						const attributeBonus = this.abilityModifier(attribute);
						if (bestAttributeBonus === null) {
							bestAttributeBonus = attributeBonus;
							bestAttributeForBonus = attribute;
						}
						else {
							bestAttributeBonus =
								attributeBonus > bestAttributeBonus
									? attributeBonus
									: bestAttributeBonus;
							bestAttributeForBonus = attributeBonus > bestAttributeBonus
									? attribute
									: bestAttributeForBonus;
						}
					}
					else
					{
						isEquippingHeavyArmor = true;
					}
				}

				if (isEquippingHeavyArmor && this.system.bonuses.heavyArmorACBonus)
				{
					newArmorClass += this.system.bonuses.heavyArmorACBonus;
					if (this.system.bonuses.heavyArmorACBonus)
						armorClassTooltip += "Heavy Armor Bonus: " + this.system.bonuses.heavyArmorACBonus + "<br>";
				}

				if (!baseArmorClassApplied) {
					// None of the armor we're wearing has a base value, only
					// bonuses so we will use the default base class of
					// 10+DEX to allow for unarmored characters wearing Bracers
					// of defense (as an example)
					//
					newArmorClass += baseArmorClass;
					armorClassTooltip = baseArmorClass + "<br>" + armorClassTooltip;
				}

				newArmorClass += bestAttributeBonus;
				newArmorClass += armorMasteryBonus;
				newArmorClass += shieldBonus;

				if (bestAttributeBonus) armorClassTooltip += "Best Attribute (" + bestAttributeForBonus.toUpperCase() + ") Bonus:" + bestAttributeBonus + "<br>";
				if (armorMasteryBonus) armorClassTooltip += "Armor Mastery:" + armorMasteryBonus + "<br>";
				if (shieldBonus) armorClassTooltip += "Shield Bonus:" + shieldBonus + "<br>";
			}
			else if (shieldBonus <= 0) {
				newArmorClass += this.system.bonuses.unarmoredAcBonus ?? 0;
				if (this.system.bonuses.unarmoredAcBonus) armorClassTooltip += "Unarmored AC Bonus:" + this.system.bonuses.unarmoredAcBonus + "<br>";
			}
			else {
				newArmorClass += shieldBonus;
				if (shieldBonus) armorClassTooltip += "Shield Bonus:" + shieldBonus + "<br>";
			}
			
			if (this.system.bonuses.dualWeaponDefense && await this.isDualWielding())
			{
				newArmorClass += 1;
				armorClassTooltip += "Dual Weapon Defense: 1<br>";
			}

			// Add AC from bonus effects
			let effectACbonus = parseInt(this.system.bonuses.acBonus, 10);
			newArmorClass += effectACbonus;
			if (effectACbonus) armorClassTooltip += "Effects AC bonus: " + effectACbonus + "<br>";

			// Stone Skin Talent provides a bonus based on level
			if (this.system.bonuses.stoneSkinTalent > 0) {
				const currentLevel = this.system.level.value ?? 0;
				const stoneSkinBonus = 2 + Math.floor(currentLevel / 2);
				newArmorClass += stoneSkinBonus;
				if (stoneSkinBonus) armorClassTooltip += "Stone Skin bonus: " + stoneSkinBonus + "<br>";
			}
		}

		if (this.system.bonuses.bloodiedAC && this.system.attributes.hp.value <= this.system.attributes.hp.max / 2)
		{
			baseArmorClass += this.system.bonuses.bloodiedAC;
			armorClassTooltip += "Bloodied AC bonus: " + this.system.bonuses.bloodiedAC + "<br>";
		}

		await this.update({"system.attributes.ac.value": newArmorClass});

		if (armorClassTooltip.endsWith("<br>"))
    		armorClassTooltip = armorClassTooltip.slice(0, -4);

		return [this.system.attributes.ac.value, armorClassTooltip];
	}


	async getStealthSwimModifiers() {
		const equippedArmorItems = this.items.filter(
			item => item.type === "Armor" && item.system.equipped
		);

		let stealth = "";
		let swim = "";
		let noArmorWorn = true;

		for (const item of equippedArmorItems)
		{
			noArmorWorn = false;
			if (await item.hasProperty("Disadvantage/Stealth"))
				stealth = "disadvantage";
			if (await item.hasProperty("No Swim"))
				swim = "no";
			else if (await item.hasProperty("Disadvantage/Swim") && swim !== "no")
				swim = "disadvantage";
		}

		return [stealth, swim, noArmorWorn];
	}

	getCalculatedAbilities() {
		const abilities = {};

		for (const ability of CONFIG.SHADOWDARK.ABILITY_KEYS) {
			abilities[ability] = this.calcAbilityValues(ability);
		}
		
		return abilities;
	}
	
	async getCalculatedMove() {
		let strMod = Math.floor((this.calcAbilityValues("str").total - 10) / 2);
		let dexMod = Math.floor((this.calcAbilityValues("dex").total - 10) / 2);
		var move = 5 + Math.ceil(( strMod + dexMod ) / 2);
		
		if (this.system.bonuses.unarmored_move_bonus || this.system.bonuses.light_armor_move_bonus)
		{
			var isUnarmored = true;
			var isUnarmoredOrLightlyArmored = true;
			
			const equippedArmorItems = this.items.filter(
				item => item.type === "Armor" && item.system.equipped
			);
			
			for (const item of equippedArmorItems) {
				if (await item.isAShield()) { }
				else {
					isUnarmored = false;
					if (item.system.slots.slots_used >= 2)
						isUnarmoredOrLightlyArmored = false;
				}
			}
			
			if (this.system.bonuses.unarmored_move_bonus && isUnarmored)
				move += this.system.bonuses.unarmored_move_bonus;

			if (this.system.bonuses.light_armor_move_bonus && isUnarmoredOrLightlyArmored)
				move += this.system.bonuses.light_armor_move_bonus;
		}

		if (this.system.bonuses.move_bonus)
			move += this.system.bonuses.move_bonus;
		
		return move;
	}
	
	getTempHp() {
		return this.system.attributes.hp.temp;// - this.system.attributes.hp.lostTemp < 0 ? 0 : this.system.bonuses.tempHP - this.system.attributes.hp.lostTemp;
	}

	async setTempHp(event, options) {
		const newTempHp = parseInt(event.currentTarget.value);
		const prevTempHp = parseInt(event.currentTarget.dataset.previousValue);
		if (this.system.attributes.hp.temp)
		{
			this.system.attributes.hp.temp = newTempHp;
			await this.update({"system.attributes.hp.temp": this.system.attributes.hp.temp});

			if (newTempHp === 0)
				await this.removeTempHpEffects();
		}
	}

	async removeTempHpEffects() {
		let itemTempHPeffects = await this.items.filter(i => i.effects.find(e => e.changes.some(c => c.key === "system.bonuses.tempHP")));
		if (itemTempHPeffects) {
			for (let itemTempHPeffect of itemTempHPeffects)
			{
				if (itemTempHPeffect.effects.some(e => e.changes.some(c => c.key === "system.bonuses.tempHP")))
				{
					this.deleteEmbeddedDocuments(
						"Item",
						[itemTempHPeffect._id]
					);
				}
			}
		}
	}
	
	async applyTempHp(item)
	{
		var ret = false;
		let itemTempHPeffect = item.effects.find(e => e.changes.some(c => c.key === "system.bonuses.tempHP"))
		if (itemTempHPeffect) {
			let tempHPchange = itemTempHPeffect.changes.find(c => c.key === "system.bonuses.tempHP");
			let tempHPvalue = tempHPchange.value;
			if (!this.system.attributes.hp.temp || tempHPvalue > this.system.attributes.hp.temp) {
				this.system.attributes.hp.temp = tempHPvalue;
				await this.update({"system.attributes.hp.temp": this.system.attributes.hp.temp});
				if (tempHPvalue <= 0)
					await this.removeTempHpEffects();
				ret = true;
			}
		}
		return ret;
	}

	async applyBonusHp(item)
	{
		let itemBonusHPeffect = item.effects.find(e => e.changes.some(c => c.key === "system.bonuses.hpBonus"))
		if (!itemBonusHPeffect)
			return;

		let bonusHPchange = itemBonusHPeffect.changes.find(c => c.key === "system.bonuses.hpBonus");
		let bonusHPvalue = parseInt(bonusHPchange.value);

		this.system.attributes.hp.base += bonusHPvalue;
		this.system.attributes.hp.frac += bonusHPvalue;
		this.system.attributes.hp.value += bonusHPvalue;
		await this.update({
			"system.attributes.hp.base": this.system.attributes.hp.base,
			"system.attributes.hp.frac": this.system.attributes.hp.frac,
			"system.attributes.hp.value": this.system.attributes.hp.value,
		});
	}

	async removeBonusHp(value)
	{
		this.system.attributes.hp.base -= value;
		if (this.system.attributes.hp.base < 1) this.system.attributes.hp.base = 1;
		this.system.attributes.hp.frac -= value;
		if (this.system.attributes.hp.frac < 1) this.system.attributes.hp.frac = 1;
		this.system.attributes.hp.value -= value;
		if (this.system.attributes.hp.value < 1) this.system.attributes.hp.value = 1;
		await this.update({
			"system.attributes.hp.base": this.system.attributes.hp.base,
			"system.attributes.hp.frac": this.system.attributes.hp.frac,
			"system.attributes.hp.value": this.system.attributes.hp.value,
		});
	}
	
	updateHP(newHP) {
		var currHP = this.system.attributes.hp.value;
		var damage = currHP - newHP;

		var finalHp = newHP;
		if (damage > 0)
		{
			if (damage >= this.system.attributes.hp.temp)
			{
				var overflowDamage = damage - this.system.attributes.hp.temp;
				finalHp = this.system.attributes.hp.value - overflowDamage;
				this.system.attributes.hp.value = finalHp;

				this.system.bonuses.tempHP = 0;
				this.system.attributes.hp.temp = 0;
				this.removeTempHpEffects();
			}
			else
			{
				finalHp = currHP;
				this.system.attributes.hp.value = finalHp;
				this.system.bonuses.tempHP -= damage;
				this.system.attributes.hp.temp -= damage;
			}
		}
		return finalHp;
	}

	onDeleteDocuments(deleted) {
		for (let effect of deleted.effects)
		{
			this.onDeleteEffects(effect);
		}
		game.shadowdark.effectPanel.refresh();
	}

	onDeleteEffects(deleted) {
		for (let c of deleted.changes)
		{
			if (c.key === "system.bonuses.tempHP")
			{
				if (this.system.bonuses?.tempHP)
					this.system.bonuses.tempHP = 0;
				if (this.system.attributes?.hp?.temp)
					this.system.attributes.hp.temp = 0;
			}
			if (c.key === 'system.bonuses.hpBonus')
			{
				this.removeBonusHp(parseInt(c.value));
			}
		}
		game.shadowdark.effectPanel.refresh();
	}

	getCanvasToken() {
		const ownedTokens = canvas.tokens.ownedTokens;
		return ownedTokens.find(
			token => token.document.actorId === this._id
		);
	}


	async getClass() {
		const uuid = this.system.class ?? "";
		return await this._getItemFromUuid(uuid);
	}


	async getPatron() {
		const uuid = this.system.patron ?? "";
		return await this._getItemFromUuid(uuid);
	}


	async getDeity() {
		const uuid = this.system.deity ?? "";
		return await this._getItemFromUuid(uuid);
	}

	async advantages() {
		let advantages = this.system.bonuses.advantage ?? [];
		let background = await fromUuid(this.system.background);
		if (background && background.effects)
		{
			let effects = background.effects.filter(e => e.changes.some(c => c.key === "system.bonuses.advantage"));
			for (let effect of effects)
			{
				for (let change of effect.changes)
				{
					if (change.key === 'system.bonuses.advantage')
						advantages.push(change.value);
				}
			}
		}
		return advantages;
	}

	async disadvantages() {
		let disadvantages = this.system.bonuses.disadvantage ?? [];
		let background = await fromUuid(this.system.background);
		if (background && background.effects)
		{
			let effects = background.effects.filter(e => e.changes.some(c => c.key === "system.bonuses.disadvantage"));
			for (let effect of effects)
			{
				for (let change of effect.changes)
				{
					if (change.key === 'system.bonuses.disadvantage')
						disadvantages.push(change.value);
				}
			}
		}
		return disadvantages;
	}

	getRollData() {
		if (this.type === "Light") return;

		const rollData = super.getRollData();

		rollData.initiativeBonus = this.abilityModifier("dex");

		rollData.initiativeFormula = game.settings.get("shadowdark", "use2d10") ? "2d10" : "1d20";
		if (this.system.bonuses?.advantage?.includes("initiative")) {
			rollData.initiativeFormula = game.settings.get("shadowdark", "use2d10") ? "3d10kh2" : "2d20kh";
		}

		return rollData;
	}


	async getSpellcasterClasses() {
		const actorClass = await this.getClass();

		const playerSpellClasses = [];

		let spellClass = actorClass.system.spellcasting.class;
		if (spellClass === "") {
			playerSpellClasses.push(actorClass);
		}
		else if (spellClass !== "__not_spellcaster__") {
			playerSpellClasses.push(
				await this._getItemFromUuid(spellClass)
			);
		}

		const spellcasterClasses =
			await shadowdark.compendiums.spellcastingBaseClasses();

		// De-duplicate any bonus classes the Actor has
		const bonusClasses = [
			...new Set(
				this.system.bonuses.spellcastingClasses ?? []
			),
		];

		for (const bonusClass of bonusClasses) {
			playerSpellClasses.push(
				spellcasterClasses.find(c => c.name.slugify() === bonusClass)
			);
		}

		return playerSpellClasses.sort((a, b) => a.name.localeCompare(b.name));
	}


	async getSpellcastingAbility(item) {
		if (item.type !== "Spell") {
			// Always use our class spellcasting ability if we have one for
			// Wands and Scrolls, etc.  If you don't have a spellcasting
			// ability then you can't use these items
			const actorClass = await this.getClass();
			return actorClass?.system?.spellcasting?.ability ?? "";
		}

		const usableSpellcasterClasses = [];
		for (const classUuid of item?.system?.class ?? []) {
			const spellClass = await fromUuid(classUuid);
			const hasSpellcastingClass = await this.hasSpellcastingClass(spellClass.name);

			if (hasSpellcastingClass) usableSpellcasterClasses.push(spellClass);
		}

		let chosenAbility = "";
		let bestAbilityModifier = 0;
		if (usableSpellcasterClasses.length > 0) {
			// If the spell can be cast by this actor, choose the best ability
			// to use that is supported by the specific spell
			//
			for (const casterClass of usableSpellcasterClasses) {
				const ability = casterClass?.system?.spellcasting?.ability ?? "";

				if (chosenAbility === "") {
					chosenAbility = ability;
					bestAbilityModifier = this.abilityModifier(ability);
				}
				else {
					const modifier = this.abilityModifier(ability);
					if (modifier > bestAbilityModifier) {
						chosenAbility = ability;
						bestAbilityModifier = modifier;
					}
				}
			}

		}

		return chosenAbility;
	}


	async getTitle() {
		const characterClass = await this.getClass();

		if (characterClass && this.system.alignment !== "") {
			const titles = characterClass.system.titles ?? [];
			const level = this.system.level?.value ?? 0;

			for (const title of titles) {
				if (level >= title.from && level <= title.to) {
					return title[this.system.alignment];
				}
			}
		}
		else {
			return "";
		}
	}


	async hasActiveLightSources() {
		return this.getActiveLightSources.length > 0;
	}


	hasAdvantage(data) {
		if (data.advantage)
			return data.advantage;
		if (this.type === "Player") {
			return this.system.bonuses.advantage.includes(data.rollType);
		}
		return false;
	}


	async hasSpellcastingClass(className) {
		const myClasses = await this.getSpellcasterClasses();

		const foundClass = myClasses.find(
			c => c.name.toLowerCase() === className.toLowerCase()
		);

		return foundClass ? foundClass : undefined;
	}


	async hasNoActiveLightSources() {
		return this.getActiveLightSources.length <= 0;
	}


	async isClaimedByUser() {
		// Check that the Actor is claimed by a User
		return game.users.find(user => user.character?.id === this.id)
			? true
			: false;
	}


	async isSpellCaster() {
		const characterClass = await this.getClass();

		const spellcastingClass =
			characterClass?.system?.spellcasting?.class ?? "__not_spellcaster__";

		const isSpellcastingClass =
			characterClass && spellcastingClass !== "__not_spellcaster__";

		const hasBonusSpellcastingClasses =
			(this.system.bonuses.spellcastingClasses ?? []).length > 0;

		return isSpellcastingClass || hasBonusSpellcastingClasses
			? true
			: false;
	}


	async languageItems() {
		const languageItems = [];

		for (const uuid of this.system.languages ?? []) {
			languageItems.push(await fromUuid(uuid));
		}

		return languageItems.sort((a, b) => a.name.localeCompare(b.name));
	}


	async nanoMagicTalents() {
		const nanoMagicTalents = [];

		for (const uuid of this.system?.magic?.nanoMagicTalents ?? []) {
			if (uuid.type === "Talent")
				nanoMagicTalents.push(uuid);
			else
				nanoMagicTalents.push(await fromUuid(uuid));
		}

		return nanoMagicTalents.sort((a, b) => a.name.localeCompare(b.name));
	}

	
	async auraMagicPowers() {
		const auraMagicPowers = [];

		for (const power of this.system?.magic?.auraMagicPowers ?? []) {
			if (power)
				auraMagicPowers.push(power);
		}

		return auraMagicPowers.sort((a, b) => a.name.localeCompare(b.name));
	}

	async auraMagicTalents() {
		const auraMagicTalents = [];

		for (const uuid of this.system?.magic?.auraMagicTalents ?? []) {
			auraMagicTalents.push(await fromUuid(uuid));
		}

		return auraMagicTalents.sort((a, b) => a.name.localeCompare(b.name));
	}


	async metalMagicTalents() {
		const metalMagicTalents = [];

		for (const uuid of this.system?.magic?.metalMagicTalents ?? []) {
			metalMagicTalents.push(await fromUuid(uuid));
		}

		return metalMagicTalents.sort((a, b) => a.name.localeCompare(b.name));
	}
	
	async metalMagicPowers() {
		const metalMagicPowers = [];

		for (const power of this.system?.magic?.metalMagicPowers ?? []) {
			if (power)
				metalMagicPowers.push(power);
		}

		return metalMagicPowers.sort((a, b) => a.name.localeCompare(b.name));
	}
	
	async abyssalMagicPowers() {
		const abyssalMagicPowers = [];

		for (const power of this.system?.magic?.abyssalMagicPowers ?? []) {
			if (power)
				abyssalMagicPowers.push(power);
		}

		return abyssalMagicPowers.sort((a, b) => a.name.localeCompare(b.name));
	}
	
	async mistMagicPowers() {
		const mistMagicPowers = [];

		for (const power of this.system?.magic?.mistMagicPowers ?? []) {
			if (power)
				mistMagicPowers.push(power);
		}

		return mistMagicPowers.sort((a, b) => a.name.localeCompare(b.name));
	}
	
	async magicCoreLevel(type)
	{
		return this.system.level.value;
	}
	
	async auraCorePenalty()
	{
		const equippedArmorItems = this.items.filter(
			item => item.type === "Armor" && item.system.equipped
		);
		var auraCorePenalty = 0;
		
		for (const item of equippedArmorItems)
		{
			var thisPenalty = 0;
			if (await item.hasProperty("Metallic Shield"))
				thisPenalty = 1;
			else if (await item.hasProperty("Metallic Chainmail"))
				thisPenalty = 2;
			else if (await item.hasProperty("Metallic Platemail"))
				thisPenalty = 4;
			
			if (await item.hasProperty("Ancient Steel"))
				thisPenalty *= 2;
			else if (await item.hasProperty("Living Metal"))
				thisPenalty /= 2;
			else if (await item.hasProperty("Crysteel"))
				thisPenalty = 0;

			auraCorePenalty += thisPenalty;
		}
		return auraCorePenalty;
	}
	
	async getAuraMagicEffects()
	{
		var auraMagicEffects = [];

		var allAuraMagicPowers = await shadowdark.compendiums.auraMagicPowers();
		for (var i = 0; i <= this.system.magic.auralCore.value; i++)
		{
			for (var power of allAuraMagicPowers)			
			{
				if (parseInt(power.system.powerLevel) === i)
				{
					if (!(power.system?.duration)) power.system.duration = "instant";
					power.formattedDuration = game.i18n.localize( CONFIG.SHADOWDARK.SEIRIZIAN_DURATIONS[power.system.duration]);
					power.formattedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML( jQuery(power.system.description).text(), { async: true, } );
					power.increasedDuration = power.system.duration;
					power.increasedDamage = power.system.damage;
					power.increasedPowerLevel = power.system.powerLevel;
					auraMagicEffects.push(power);
				}
				else if (parseInt(power.system.powerLevel) < i && (power.system.duration_increase || power.system.damage_increase))
				{
					var updatedPower = (await fromUuid(power.uuid)).toObject();
					updatedPower._id += "_" + i;
					if (!(updatedPower.system?.duration)) updatedPower.system.duration = "instant";
					updatedPower.formattedDuration = game.i18n.localize( CONFIG.SHADOWDARK.SEIRIZIAN_DURATIONS[updatedPower.system.duration]);
					updatedPower.formattedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML( jQuery(power.system.description).text(), { async: true, } );
					updatedPower.increasedDuration = updatedPower.system.duration;
					updatedPower.increasedDamage = updatedPower.system.damage;
					updatedPower.increasedPowerLevel = i;
					updatedPower = await ItemSD.increasePower(updatedPower, i - parseInt(updatedPower.system.powerLevel));

					if (updatedPower)
					{
						if (updatedPower.formattedDuration.includes("-"))
						{
							var durationParts = updatedPower.increasedDuration.split("-");
							updatedPower.formattedDuration = game.i18n.localize("SHADOWDARK.duration_"+durationParts[0]) + " " + game.i18n.localize("SHADOWDARK.duration_"+durationParts[1] + (parseInt(durationParts[0]) > 1 ? "s" : ""));
						}

						auraMagicEffects.push(updatedPower);
					}
				}
			}
		}
		return auraMagicEffects;
	}

	async learnSpell(itemId) {
		const item = this.items.get(itemId);

		const correctSpellClass = item.system.class.includes(
			this.system.class
		);

		if (!correctSpellClass) {
			foundry.applications.handlebars.renderTemplate(
				"systems/shadowdark/templates/dialog/confirm-learn-spell.hbs",
				{
					name: item.name,
					correctSpellClass,
				}
			).then(html => {
				new Dialog({
					title: `${game.i18n.localize("SHADOWDARK.dialog.scroll.wrong_class_confirm")}`,
					content: html,
					buttons: {
						Yes: {
							icon: "<i class=\"fa fa-check\"></i>",
							label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
							callback: async () => {
								this._learnSpell(item);
							},
						},
						Cancel: {
							icon: "<i class=\"fa fa-times\"></i>",
							label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
						},
					},
					default: "Yes",
				}).render(true);
			});
		}
		else {
			await this._learnSpell(item);
		}
	}


	numGearSlots() {
		let gearSlots = shadowdark.defaults.GEAR_SLOTS;

		if (this.type === "Player") {
			const strength = this.system.abilities.str.base ?? 0
				+ this.system.abilities.str.bonus ?? 0
				+ this.system.abilities.str.magicModifier ?? 0;

			gearSlots = strength > gearSlots ? strength : gearSlots;

			// Hauler's get to add their Con modifer (if positive)
			const conModifier = this.abilityModifier("con");
			gearSlots += this.system.bonuses.hauler && conModifier > 0
				? conModifier
				: 0;

			if (this.system.bonuses.gear_slots)
			{
				gearSlots += this.system.bonuses.gear_slots;
			}

			// Add effects that modify gearslots
			gearSlots += parseInt(this.system.bonuses.gearSlots, 10);
		}

		return gearSlots;
	}


	async openSpellBook() {
		const playerSpellcasterClasses = await this.getSpellcasterClasses();

		const openChosenSpellbook = classUuid => {
			new shadowdark.apps.SpellBookSD(
				classUuid,
				this.id
			).render(true);
		};

		if (playerSpellcasterClasses.length <= 0) {
			return ui.notifications.error(
				game.i18n.localize("SHADOWDARK.item.errors.no_spellcasting_classes"),
				{ permanent: false }
			);
		}
		else if (playerSpellcasterClasses.length === 1) {
			return openChosenSpellbook(playerSpellcasterClasses[0].uuid);
		}
		else {
			return foundry.applications.handlebars.renderTemplate(
				"systems/shadowdark/templates/dialog/choose-spellbook.hbs",
				{classes: playerSpellcasterClasses}
			).then(html => {
				const dialog = new Dialog({
					title: game.i18n.localize("SHADOWDARK.dialog.spellbook.open_which_class.title"),
					content: html,
					buttons: {},
					render: html => {
						html.find("[data-action='open-class-spellbook']").click(
							event => {
								event.preventDefault();
								openChosenSpellbook(event.currentTarget.dataset.uuid);
								dialog.close();
							}
						);
					},
				}).render(true);
			});
		}
	}

	/** @inheritDoc */
	prepareData() {
		super.prepareData();

		if (this.type === "Player") {
			this._preparePlayerData();

			if (canvas.ready && game.user.character === this) {
				game.shadowdark.effectPanel.refresh();
			}
		}
		else if (this.type === "NPC") {
			this._prepareNPCData();
		}
	}

	/** @inheritDoc */
	prepareDerivedData() {
		// if (this.type === "Player") {
		// 	this.updateArmorClass();
		// }
	}
	
	async isDualWielding()
	{
		var numApplicableWeapons = 0;
		const equippedWeaponItems = this.items.filter(
			item => item.type === "Weapon" && item.system.equipped
		);
		for (const item of equippedWeaponItems)
		{
			const isUnarmedAttack = await item.hasProperty('unarmed');
			if (item.system.damage && item.system.damage.oneHanded && item.system.damage.oneHanded !== "" && (!item.system.damage.twoHanded || item.system.damage.twoHanded === "") && !isUnarmedAttack)
				numApplicableWeapons++;
		}
		if (numApplicableWeapons >= 2)
			return true;

		return false;
	}

	async rollAbility(sheet, abilityId, options={}) {
		const parts = [game.settings.get("shadowdark", "use2d10") ? "2d10" : "1d20", "@abilityBonus", "@itemBonus", "@talentBonus"];

		const abilityBonus = this.abilityModifier(abilityId);
		const ability = CONFIG.SHADOWDARK.ABILITIES_LONG[abilityId];
		var itemBonus = 0;
		if (this.system.bonuses.abilityCheckBonus && this.system.bonuses.abilityCheckBonus === abilityId)
			itemBonus += 1;
		if (this.system.bonuses.abilityCheckBoost && this.system.bonuses.abilityCheckBoost === abilityId)
			itemBonus += 2;

		const data = {
			rollType: "ability",
			abilityBonus,
			ability,
			itemBonus,
			actor: this,
			checkTypes: CONFIG.SHADOWDARK.CHECKS[abilityId],
		};

		options.abilityId = abilityId;
		options.speaker = ChatMessage.getSpeaker({ actor: this });
		options.sheet = sheet;
		options.actor = this;
		options.parts = parts;
		options.data = data;
		return await new shadowdark.dice.RollAbilitySD(options).render(true);
	}

	async rollAttack(itemId, options={}) {
		const item = this.items.get(itemId);

		if (game.settings.get("shadowdark", "enableTargeting")) {
			if (!options.targetToken && game.user.targets.size > 0) {
				const promises = [];
				for (const target of game.user.targets.values()) {
					promises.push(this.rollAttack(itemId, { ...options, targetToken: target }));
				}
				return await Promise.all(promises);
			}
			else if (options.targetToken) {
				options.target = options.targetToken.actor.system.attributes.ac.value;

				if (this.system.bonuses?.opponentACpenalty)
					options.target -= this.system.bonuses?.opponentACpenalty;
			}
		}

		const ammunition = item.availableAmmunition();

		let ammunitionItem = undefined;
		if (ammunition && Array.isArray(ammunition) && ammunition.length > 0) {
			ammunitionItem = ammunition[0];
		}

		const data = {
			actor: this,
			ammunitionItem,
			item: item,
			rollType: (item.isWeapon()) ? item.system.baseWeapon.slugify() : item.name.slugify(),
			usesAmmunition: item.usesAmmunition,
		};

		const bonuses = this.system.bonuses;

		// Summarize the bonuses for the attack roll
		const parts = [(game.settings.get("shadowdark", "use2d10") ? "2d10" : "1d20"), "@itemBonus", "@abilityBonus", "@talentBonus", "@targetLock"];
		data.damageParts = [];

		// Check damage multiplier
		const damageMultiplier = Math.max(
			parseInt(data.item.system.bonuses?.damageMultiplier, 10),
			parseInt(data.actor.system.bonuses?.damageMultiplier, 10),
			1);

		// Magic Item bonuses
		if (item.system.bonuses.attackBonus) {
			data.itemBonus = item.system.bonuses.attackBonus;
		}
		if (item.system.bonuses.damageBonus) {
			data.damageParts.push("@itemDamageBonus");
			data.itemDamageBonus = item.system.bonuses.damageBonus * damageMultiplier;
		}

		/* Attach Special Ability if part of the attack.
			Created in `data.itemSpecial` field.
			Can be used in the rendering template or further automation.
		*/
		if (item.system.damage?.special) {
			const itemSpecial = data.actor.items.find(
				e => e.name === item.system.damage.special
					&& e.type === "NPC Feature"
			);

			if (itemSpecial) {
				data.itemSpecial = itemSpecial;
			}
		}

		// Talent/Ability/Property modifiers
		if (this.type === "Player") {
			// Check to see if we have any extra dice that need to be added to
			// the damage rolls due to effects
			await this.getExtraDamageDiceForWeapon(item, data);

			data.canBackstab = await this.canBackstab();

			// Use set options for type of attack or assume item type
			data.attackType = options.attackType ?? item.system.type;

			if (data.attackType === "melee") {
				if (await item.isFinesseWeapon()) {
					data.abilityBonus = Math.max(
						this.abilityModifier("str"),
						this.abilityModifier("dex")
					);
				}
				else {
					data.abilityBonus = this.abilityModifier("str");
				}

				data.talentBonus = bonuses.meleeAttackBonus;
				data.meleeDamageBonus = bonuses.meleeDamageBonus * damageMultiplier;
				data.damageParts.push("@meleeDamageBonus");
				
				if (options.attackOption === "quickStrike")
				{
					options.quickStrike = 1;
					data.talentBonus -= 2;
				}
				
				if (options.attackOption === "dualWeaponAttack" && this.system.bonuses.dualWeaponAttack && await this.isDualWielding())
				{
					options.dualWeaponAttack = options.baseDamage;
				}
			}
			else {
				// if thrown item used as range, use highest modifier.
				if (await item.isThrownWeapon()) {
					data.abilityBonus = Math.max(
						this.abilityModifier("str"),
						this.abilityModifier("dex")
					);
				}
				else {
					data.abilityBonus = this.abilityModifier("dex");
				}

				data.talentBonus = bonuses.rangedAttackBonus;
				data.rangedDamageBonus = bonuses.rangedDamageBonus * damageMultiplier;
				data.damageParts.push("@rangedDamageBonus");
			}

			data.isVersatile = await item.isVersatile();
			// remember handedness
			if (data.isVersatile) {
				if (options.handedness) {
					item.system.currentHand = options.handedness ?? "1h";
				}

				if (!item.system.currentHand)
					item.system.currentHand = "1h";
					
				data.currentHand = item.system.currentHand;
			}

			// Check Weapon Mastery & add if applicable
			const weaponMasterBonus = this.calcWeaponMasterBonus(item);
			data.talentBonus += weaponMasterBonus;
			data.weaponMasteryBonus = weaponMasterBonus * damageMultiplier;
			if (data.weaponMasteryBonus) data.damageParts.push("@weaponMasteryBonus");
		}

		if (!options.title) {
			options.title = game.i18n.localize("SHADOWDARK.dialog.roll") + " " + item.name;
		}		

		if (data.usesAmmunition && !data.ammunitionItem) {
			return ui.notifications.warn(
				game.i18n.localize("SHADOWDARK.item.errors.no_available_ammunition"),
				{ permanent: false }
			);
		}

		await this.setRollDamage(data, options, damageMultiplier);

		return item.rollItem(parts, data, options);
	}

	async setRollDamage(data, options, damageMultiplier) {
		if (!data.item.system.damage.value) data.item.system.damage.value = options.baseDamage;

		let baseDamage = options.baseDamage;
		let dualWeapon = '';
		if (options.dualWeaponAttack) {
			let dualWeaponBonuses = options.dualWeaponAttack.split('+');
			let bestDamage = 0;
			let bestDamageIdx = 0;
			let idx = 0;
			for (const dualWeaponBonus of dualWeaponBonuses)
			{
				const dualWeaponBonusSplit = dualWeaponBonus.split('d');
				const dualWeaponBonusDice = parseInt(dualWeaponBonusSplit[0]);
				const dualWeaponBonusDieType = parseInt(dualWeaponBonusSplit[1]);

				const avgDamage = dualWeaponBonusDice * (dualWeaponBonusDieType + 1) / 2;
				if (bestDamage < avgDamage)
				{
					bestDamage = avgDamage;
					bestDamageIdx = idx;
				}

				idx++;
			}

			baseDamage = dualWeaponBonuses[bestDamageIdx];

			idx = 0;
			for (const dualWeaponBonus of dualWeaponBonuses)
			{
				if (idx != bestDamageIdx)
				{
					if (dualWeapon !== '')
						dualWeapon += ' +';
					dualWeapon += dualWeaponBonus;
				}
				idx++;
			}
		}

		const baseDamageSplit = baseDamage.split('d');
		let numDice = parseInt(baseDamageSplit[0]);
		const baseDamageDieType = parseInt(baseDamageSplit[1]);

		//Backstab Damage tooltip.
		if (data.canBackstab)
		{
			let numBackstabDice = 1 + Math.floor(this.system.level.value / 2);
			if (this.system.bonuses?.backstabDie) {
				numBackstabDice += parseInt(this.system.bonuses?.backstabDie, 10);
			}
			data.backstabDice = numBackstabDice + 'd' + baseDamageDieType;
		}

		let damageDie = data.item.system.damage.oneHanded;
		if (options.handedness === '2h')
			damageDie = data.item.system.damage.twoHanded;
		if (damageDie == null) damageDie = 'd' + baseDamageDieType;

		// Improve the base damage die if this weapon has the relevant property
		const weaponDamageDieImprovementByProperty = this.system.bonuses?.weaponDamageDieImprovementByProperty ?? [];

		for (const property of weaponDamageDieImprovementByProperty) {
			if (await data.item.hasProperty(property)) {
				damageDie = shadowdark.utils.getNextDieInList(
					damageDie,
					shadowdark.config.DAMAGE_DICE
				);
			}
		}

		if (this.system.bonuses?.overdraw)
		{
			if (!Array.isArray(this.system.bonuses.overdraw))
				this.system.bonuses.overdraw = [this.system.bonuses.overdraw];

			for (const overdrawWeapon of this.system.bonuses.overdraw)
			{
				if (overdrawWeapon == data.item.name.slugify())
				{
					damageDie = shadowdark.utils.getNextDieInList(
						damageDie,
						shadowdark.config.DAMAGE_DICE
					);
				}
			}
		}

		if (this.system.bonuses?.unarmedStrike && await data.item.hasProperty("unarmed"))
		{
			damageDie = shadowdark.utils.getNextDieInList(
				damageDie,
				shadowdark.config.DAMAGE_DICE
			);
			
			if (this.system.level.value >= 3)
			{
				damageDie = shadowdark.utils.getNextDieInList(
					damageDie,
					shadowdark.config.DAMAGE_DICE
				);
			}
			
			if (this.system.level.value >= 9)
			{
				damageDie = shadowdark.utils.getNextDieInList(
					damageDie,
					shadowdark.config.DAMAGE_DICE
				);
			}
		}

		if (this.system.bonuses?.devastatingBlows && await data.item.hasProperty("unarmed"))
		{
			for (let i = 0; i < this.system.bonuses?.devastatingBlows; i++)
			{
				damageDie = shadowdark.utils.getNextDieInList(
					damageDie,
					shadowdark.config.DAMAGE_DICE
				);
			}
		}

		if (data.quickStrike)
			numDice++;
		
		let damageRoll = (damageMultiplier > 1)
			? `${numDice}${damageDie} * ${damageMultiplier}`
			: `${numDice}${damageDie}`;

		if (dualWeapon !== '') {
			damageRoll += ' +' + dualWeapon;
		}

		if (await data.item.hasProperty('supersharp')) damageRoll += '+1';

		for (let part of data.damageParts)
		{
			switch (part)
			{
				case '@meleeDamageBonus':
					if (data.meleeDamageBonus)
						damageRoll += ' +' + data.meleeDamageBonus;
					break;
				case '@itemDamageBonus':
					if (data.itemDamageBonus)
						damageRoll += ' +' + data.itemDamageBonus;
					break;
				case '@rangedDamageBonus':
					if (data.rangedDamageBonus)
						damageRoll += ' +' + data.rangedDamageBonus;
					break;
				case '@weaponMasteryBonus':
					if (data.weaponMasteryBonus)
						damageRoll += ' +' + data.weaponMasteryBonus;
					break;
			}
		}

		if (this.system.bonuses?.extraFireDamage)
		{
			damageRoll += ' +' + this.system.bonuses.extraFireDamage;
			if (!data.item.system.damage?.type?.includes("fire"))
				data.item.system.damage.type += ", fire";
		}

		data.item.system.damage.value = damageRoll;
	}

	async rollMagic(magicCoreLevel, params={}, power=null) {
		params.dialogTemplate = "systems/shadowdark/templates/dialog/roll-magic-dialog.hbs";
		params.chatCardTemplate = "systems/shadowdark/templates/chat/magic-card.hbs";
		const parts = [(game.settings.get("shadowdark", "use2d10") ? "2d10" : "1d20"), "@itemBonus", "@abilityBonus", "@talentBonus"];

        if (params.powerLevel < magicCoreLevel && (power?.system.duration_increase || power?.system.damage_increase))
        {
            params.variableLevelEffects = true;
        }

		const data = {
			actor: this,
			spellName: params.spellName,
			rollType: params.magicType,
			powerLevel: params.powerLevel,
			talentBonus: magicCoreLevel,
			magicCoreLevel: magicCoreLevel,
			nanoPoints: params.nanoPoints,
			cost: params.cost,
			failureTolerance: params.failureTolerance,
			memoryProtection: params.memoryProtection,
			spellDC: params.spellDC,
			damage: params.damage,
			duration: params.duration,
			duration_amount: params.duration_amount,
			duration_desc: params.duration_desc,
			advantage: params.advantage,
			target: params.target,
			variableLevelEffects: params.variableLevelEffects,
			power: power,
			effectiveLevel: params.effectiveLevel,
			item: null,
		};
		
		if (data.variableLevelEffects && data.powerLevel < data.magicCoreLevel)
		{
			let selectOptions = 0;
			let damage_increase_step = power.system.damage_increase ? parseInt(power.system.damage_increase_step) : null;
			let duration_increase_step = power.system.duration_increase ? parseInt(power.system.duration_increase_step) : null;

			for (var i = parseInt(data.powerLevel); i <= parseInt(data.magicCoreLevel); i++)
			{
				if ((damage_increase_step && i % damage_increase_step == 0) || (duration_increase_step && i % duration_increase_step == 0))
				{
					selectOptions++;
					switch (i)
					{
						case 1:
							data.selectPower1 = true;
						break;
						case 2:
							data.selectPower2 = true;
						break;
						case 3:
							data.selectPower3 = true;
						break;
						case 4:
							data.selectPower4 = true;
						break;
						case 5:
							data.selectPower5 = true;
						break;
						case 6:
							data.selectPower6 = true;
						break;
						case 7:
							data.selectPower7 = true;
						break;
						case 8:
							data.selectPower8 = true;
						break;
						case 9:
							data.selectPower9 = true;
						break;
						case 10:
							data.selectPower10 = true;
						break;
					}
				}
			}

			if (selectOptions <= 1)
				data.variableLevelEffects = false;
		}

		if (params.magicType == "nano-magic")
			data.nanoMagic = true;
		if (params.magicType == "aura-magic")
			data.auraMagic = true;
		if (params.magicType == "metal-magic")
			data.metalMagic = true;
		if (params.magicType == "abyssal-magic")
			data.abyssalMagic = true;
		if (params.magicType == "mist-magic")
			data.mistMagic = true;
		
		if (!params.callback)
			params.callback = this._rollMagicCallback;
		
		if (power && power.system?.resistedBy && game.settings.get("shadowdark", "enableTargeting"))
		{
			if (!params.targetToken && game.user.targets.size > 0)
			{
				for (const target of game.user.targets.values())
				{
					var targetAbilityValue = 0;
					if (power.system.resistedBy === "ac")
					{
						targetAbilityValue = target.actor.system.attributes.ac.value;
						
						if (this.system.bonuses?.opponentACpenalty)
							targetAbilityValue -= this.system.bonuses?.opponentACpenalty;
					}
					else
					{
						if (target.actor.type === "NPC")
							targetAbilityValue = target.actor.system.abilities[power.system.resistedBy].mod * 2 + 10;
						else
							targetAbilityValue = target.actor.system.abilities[power.system.resistedBy].total;
					}

					if (!params.target || targetAbilityValue > params.target)
						params.target = targetAbilityValue;
					
					if (params.target < params.spellDC) params.target = params.spellDC;
				}
			}
			else if (params.targetToken)
			{
				params.target = 0;
				if (power.system.resistedBy === "ac")
				{
					params.target = params.targetToken.actor.system.attributes.ac.value;
					if (this.system.bonuses?.opponentACpenalty)
						params.target -= this.system.bonuses?.opponentACpenalty;
				}
				else
				{
					if (params.targetToken.actor.type === "NPC")
						params.target = params.targetToken.actor.system.abilities[power.system.resistedBy].mod * 2 + 10;
					else
						params.target = params.targetToken.actor.system.abilities[power.system.resistedBy].total;
				}
				
				if (params.target < params.spellDC) params.target = params.spellDC;
			}
		}
		
		if (!params.targetToken && game.user.targets.size > 0)
		{
			params.targetName = "";
			data.targetTokens = [];
			for (const target of game.user.targets.values())
			{
				if (params.targetName !== "")
					params.targetName += ", ";
				params.targetName += target.actor.name;
				data.targetTokens.push(target);
			}
		}
		else if (params.targetToken)
		{
			params.targetName = params.targetToken.actor.name;
			data.targetTokens = [params.targetToken];
		}

		data.target = params.target;
		params.actor = this;
		params.parts = parts;
		params.data = data;
		var rollMagic = await new shadowdark.dice.RollMagicSD(params);
		var result = await rollMagic.render(true);
		return result;
	}
	
	async _rollMagicCallback(result) {
		if (!result || !result?.rolls || !result?.rolls?.main)
			return;
		
		var actor = result.actor;
		var power = result.power;
		
		const resultMargin = result.rolls.main.roll._total - result.spellDC;
		
		if (resultMargin >= 0)
		{
		}
	}

	async getExtraDamageDiceForWeapon(item, data) {
		const extraDamageDiceBonuses = this.system.bonuses.weaponDamageExtraDieByProperty ?? [];

		for (const extraBonusDice of extraDamageDiceBonuses) {
			const [die, property] = extraBonusDice.split("|");

			if (await item.hasProperty(property)) {
				data.extraDamageDice = die;

				if (data.damageParts) {
					data.damageParts.push("@extraDamageDice");
				}
				break;
			}
		}

		// If the attack has extra damage die due to an effect, then also
		// check to see if that damage die should be improved from its
		// base type
		//
		if (data.extraDamageDice) {
			const extraDiceImprovements =
				this.system.bonuses.weaponDamageExtraDieImprovementByProperty ?? [];

			for (const property of extraDiceImprovements) {
				if (await item.hasProperty(property)) {
					data.extraDamageDice = shadowdark.utils.getNextDieInList(
						data.extraDamageDice,
						shadowdark.config.DAMAGE_DICE
					);
				}
			}
		}
	}


	async rollHP(options={}) {
		if (this.type === "Player") {
			this._playerRollHP(options);
		}
		else if (this.type === "NPC") {
			this._npcRollHP(options);
		}
	}


	async sellAllGems() {
		const items = this.items.filter(item => item.type === "Gem");
		return this.sellAllItems(items);
	}


	async sellAllItems(items) {
		const coins = this.system.coins;

		const soldItems = [];
		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			coins.gp += item.system.cost.gp;
			coins.sp += item.system.cost.sp;
			coins.cp += item.system.cost.cp;

			soldItems.push(item._id);
		}

		await this.deleteEmbeddedDocuments(
			"Item",
			soldItems
		);

		Actor.updateDocuments([{
			"_id": this._id,
			"system.coins": coins,
		}]);
	}


	async sellItemById(itemId) {
		const item = this.getEmbeddedDocument("Item", itemId);
		const coins = this.system.coins;

		coins.gp += parseInt(item.system.cost.gp);
		coins.sp += parseInt(item.system.cost.sp);
		coins.cp += parseInt(item.system.cost.cp);

		await this.deleteEmbeddedDocuments(
			"Item",
			[itemId]
		);

		Actor.updateDocuments([{
			"_id": this._id,
			"system.coins": coins,
		}]);
	}


	async toggleLight(active, itemId) {
		if (active) {
			await this.turnLightOn(itemId);
		}
		else {
			await this.turnLightOff();
		}
	}


	async turnLightOff() {
		const noLight = {
			dim: 0,
			bright: 0,
		};

		await this.changeLightSettings(noLight);
	}


	async turnLightOn(itemId) {
		const item = this.items.get(itemId);

		// Get the mappings
		const lightSources = await foundry.utils.fetchJsonWithTimeout(
			"systems/shadowdark/assets/mappings/map-light-sources.json"
		);

		const lightData = lightSources[
			item.system.light.template
		].light;

		await this.changeLightSettings(lightData);
	}


	async useAbility(itemId, options={}) {
		const item = this.items.get(itemId);

		if (item.type === "NPC Feature") return item.displayCard();

		// If the ability has limited uses, handle that first
		if (item.system.limitedUses) {
			if (item.system.uses.available <= 0) {
				return ui.notifications.error(
					game.i18n.format("SHADOWDARK.error.class_ability.no-uses-remaining"),
					{permanent: false}
				);
			}
			else {
				const newUsesAvailable = item.system.uses.available - 1;

				item.update({"system.uses.available": Math.max(0, newUsesAvailable),});
			}
		}

		const abilityDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			item.system.description,
			{
				secrets: this.isOwner,
				async: true,
				relativeTo: this,
			}
		);

		let success = true;
		let rolled = false;
		// does ability use on a roll check?
		if (item.system.ability) {
			rolled = true;
			options = foundry.utils.mergeObject({target: item.system.dc}, options);
			const result = await this.rollAbility(
				item.system.ability,
				options
			);

			success = result?.rolls?.main?.success?.value ?? false;

			if (!success && item.system.loseOnFailure) {
				item.update({"system.lost": true});
			}
		}

		return shadowdark.chat.renderUseAbilityMessage(this.actor, {
			flavor: game.i18n.localize("SHADOWDARK.chat.use_ability.title"),
			templateData: {
				abilityDescription,
				actor: this,
				item: item,
				rolled,
				success,
			},
		});
	}


	async usePotion(itemId) {
		const item = this.items.get(itemId);

		foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/confirm-use-potion.hbs",
			{name: item.name}
		).then(html => {
			new Dialog({
				title: "Confirm Use",
				content: html,
				buttons: {
					Yes: {
						icon: "<i class=\"fa fa-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
							const potionDescription = await item.getEnrichedDescription();

							const cardData = {
								actor: this,
								item: item,
								message: game.i18n.format(
									"SHADOWDARK.chat.potion_used",
									{
										name: this.name,
										potionName: item.name,
									}
								),
								potionDescription,
							};

							let template = "systems/shadowdark/templates/chat/potion-used.hbs";

							const content = await foundry.applications.handlebars.renderTemplate(template, cardData);

							await ChatMessage.create({
								content,
								rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
							});
							
							// If a potion has Effects, activate them before consuming the potion.
							if (item.effects.toObject().length > 0)
							{
								await this._createPotionEffects(item);
							}

							await this.deleteEmbeddedDocuments(
								"Item",
								[itemId]
							);
						},
					},
					Cancel: {
						icon: "<i class=\"fa fa-times\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
					},
				},
				default: "Yes",
			}).render(true);
		});
	}
	
	async _createPotionEffects(item) {
		var effectsObject = item.effects.toObject();

		var data = {
			name: item.name,
			img: item.img,
			type: "Effect",
			system: {
				duration: {
					type: "days",
					value: "1",
				},
				description: item.system?.description,
			},
			source: {
				title: item.system?.source?.title,
			},
			effects: effectsObject,
		}
		
		var effectItem = new shadowdark.documents.ItemSD(data);

		effectItem = await shadowdark.effects.createItemWithEffect(effectItem, this);
		await this.createEmbeddedDocuments("Item", [effectItem]);
		await this.applyTempHp(effectItem);
		game.shadowdark.effectPanel.refresh();
	}
	

	async yourLightExpired(itemId) {
		this.turnLightOff(itemId);

		const item = this.items.get(itemId);

		const cardData = {
			img: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
			actor: this,
			message: game.i18n.format(
				"SHADOWDARK.chat.light_source.expired",
				{
					name: this.name,
					lightSource: item.name,
				}
			),
		};

		let template = "systems/shadowdark/templates/chat/lightsource-toggle-gm.hbs";

		const content = await foundry.applications.handlebars.renderTemplate(template, cardData);

		await ChatMessage.create({
			content,
			rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
		});
	}


	async yourLightWentOut(itemId) {
		this.toggleLight(false, itemId);

		const item = this.items.get(itemId);

		const cardData = {
			img: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
			actor: this,
			message: game.i18n.format(
				"SHADOWDARK.chat.light_source.went_out",
				{
					name: this.name,
					lightSource: item.name,
				}
			),
		};

		let template = "systems/shadowdark/templates/chat/lightsource-toggle-gm.hbs";

		const content = await foundry.applications.handlebars.renderTemplate(template, cardData);

		await ChatMessage.create({
			content,
			rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
		});
	}

	async isWeapon() {
		return false;
	}

	async isSpell() {
		return false;
	}

	async armorProficiencies() {
		var proficiencies = [];
		const characterClass = await this.getClass();
		if (characterClass)
		{
			if (characterClass.system.allArmor) proficiencies.push('all');
			for (var armorUuid of characterClass.system.armor)
			{
				var armor = await fromUuid(armorUuid);
				proficiencies.push(armor.name.slugify());
			}
		}

		for (var item of this.items) {
			for (var effect of item.effects) {
				for (var change of effect.changes) {
					if (change.key === "system.bonuses.armorProficiency")
						proficiencies.push(change.value);
					else if (change.key === "system.bonuses.combatProficiency")
						proficiencies.push(change.value);
				}
			}
		}

		return proficiencies;
	}

	async weaponProficiencies() {
		var proficiencies = [];
		const characterClass = await this.getClass();
		if (characterClass)
		{
			if (characterClass.system.allWeapons) proficiencies.push('all');
			if (characterClass.system.allMeleeWeapons) proficiencies.push('allMelee');
			if (characterClass.system.allRangedWeapons) proficiencies.push('allRanged');
			for (var weaponUuid of characterClass.system.weapons)
			{
				var weapon = await fromUuid(weaponUuid);
				proficiencies.push(weapon.name.slugify());
			}
		}

		for (var item of this.items) {
			for (var effect of item.effects) {
				for (var change of effect.changes) {
					if (change.key === "system.bonuses.weaponProficiency")
						proficiencies.push(change.value);
					else if (change.key === "system.bonuses.combatProficiency")
						proficiencies.push(change.value);
					else if (change.key === "system.bonuses.2HweaponProficiency")
						proficiencies.push(change.value);
				}
			}
		}

		return proficiencies;
	}

	async isProficient(item) {
		if (await item.isBasicWeapon())
			return true;

		var proficiencyName = item.name.slugify();
		if (item.isWeapon() && item.system.baseWeapon && item.system.baseWeapon !== "")
			proficiencyName = item.system.baseWeapon.slugify();
		if (item.isArmor() && item.system.baseArmor && item.system.baseArmor !== "")
			proficiencyName = item.system.baseArmor.slugify();

		var weaponProficiencies = await this.weaponProficiencies();
		if (weaponProficiencies.includes(proficiencyName))
			return true;
		if (weaponProficiencies.includes('all') && item.isWeapon())
			return true;
		if (weaponProficiencies.includes('allRanged') && item.isRangedWeapon())
			return true;
		if (weaponProficiencies.includes('allMelee') && item.isMeleeWeapon())
			return true;

		var armorProficiencies = await this.armorProficiencies();
		if (armorProficiencies.includes(proficiencyName))
			return true;
		if (armorProficiencies.includes('all') && item.isArmor())
			return true;

		if (this.system?.magic?.manifestedMetalCore && (await item.hasProperty('unarmed') || proficiencyName === 'unarmed-attack'))
			return true;

		return false;
	}

	async isProficientWithAllEquippedArmor() {
		const equippedArmorItems = this.items.filter(
			item => item.type === "Armor" && item.system.equipped
		);
		
		for (var armor of equippedArmorItems)
		{
			if (!(await this.isProficient(armor)))
				return false;
		}
		return true;
	}

	async equippedSpellBook() {
		var equippedSpellbook =  this.items.find(
			item => item.type === "Basic" && item.system.equipped && item.system.spellbook
		);

		return equippedSpellbook;
	}
}
