import ItemSD from "./ItemSD.mjs";
import MetalMagicSD from "../sheets/magic/MetalMagicSD.mjs";
import MistMagicSD from "../sheets/magic/MistMagicSD.mjs";
import UtilitySD from "../utils/UtilitySD.mjs";
import EvolutionGridSD from "../apps/EvolutionGridSD.mjs";
import CompendiumsSD from "./CompendiumsSD.mjs";

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

	get level() {
		let level = this.system.level?.value ?? 0;
		if (this.type === "Player" && game.settings.get("shadowdark", "evolutionGrid"))
			level = this.system.level?.grid ?? 0;
		return level;
	}

	get nanoPoints() {
		var nanoPoints = this.level;
		for (const uuid of this.system?.magic?.nanoMagicTalents ?? []) {
			const nanoTalent = fromUuidSync(uuid);
			if (nanoTalent.system.bonuses.nanoTolerance)
				nanoPoints += Math.floor(this.level / 2) * parseInt(nanoTalent.system.bonuses.nanoTolerance);

		}
		return nanoPoints;
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
		if (!this.system || !this.system.attributes || !this.system.attributes.hp)
			return;
		if ((this.system.attributes.hp.max > 1 && this.system.attributes.hp.value > 1 && this.system.attributes.hp.max === this.system.attributes.hp.value) || (this.system.shapeshiftedBy))
			return;
			
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
			ability = ability.length > 3 ? ability.slice(0, 3) : ability;
			return this.calcAbilityValues(ability).modifier;
		}
		else {
			if (!this.system || !this.system.abilities || !this.system.abilities[ability])
				return 0;

			return this.system.abilities[ability].mod ?? 0;
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
			if (foundItem.system.quantity > amount)
			{
				foundItem.reduceAmmunition(amount);
				return true;
			}
			else
			{
				this.deleteEmbeddedDocuments(
					"Item",
					[foundItem._id]
				);
				return false;
			}
		}
	}

	async applyDamagePercentage(percentage) {
		const p = percentage / 100;
		const maxHp = this.system.attributes.hp.max;
		let damage = Math.floor(p * maxHp);
		if (percentage == 99 && damage == maxHp)
			damage = maxHp - 1;
		else if (percentage > 0 && damage <= 0)
			damage = 1;

		await this.applyDamage(damage, 1);
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
		if (this.system.attributes.hp.temp && damageAmount > 0)
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
			let actualDamage = amountToApply <= currentHpValue ? amountToApply : currentHpValue;

			if ((await this.metalMagicTalentChanges()).some(c => c.key === 'system.bonuses.bioMetallicIntegration'))
			{
				let physicalHP = this.system.attributes.hp.value;
				actualDamage = Math.ceil(amountToApply * (currentHpValue / (currentHpValue + physicalHP)));
				if (actualDamage > currentHpValue)  actualDamage = currentHpValue;
			}

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

			//shadowdark.debug(`applyDamage final HP: ${newHpValue}`);
			this.system.attributes.hp.value = newHpValue;
			await this.update({"system.attributes.hp.value": newHpValue});
		}
	}

	async applyWound(damage, hitLocation, damageType) {
		let damageLevel = Math.ceil(damage / 3);
		if (damageLevel > 5) damageLevel = 5;
		const damageDescRand = Math.floor(Math.random() * 3) + 1;
		const desctype = ['slashing', 'piercing'].includes(damageType) ? 'cut' : 'smash';
		const damageDesc = game.i18n.localize(`SHADOWDARK.wounds.${damageLevel}_${desctype}_${damageDescRand}`);

		let parts = [];
		if (!hitLocation) {
			const bodySetup = await CompendiumsSD.defaultBodySetup(true);
			if (!bodySetup) return;
			for (let part of bodySetup.system.bodyParts ?? []) {
				for (let subPart of part.subParts) {
					parts.push({part: part.name, subPart: subPart, effect: part.effect})
				}
			}
		} else {
			for (let subPart of hitLocation.subParts) {
				parts.push({part: hitLocation.name, subPart: subPart, effect: hitLocation.effect})
			}
		}

		if (!parts.length) return;

		const partIndex = Math.floor(Math.random() * parts.length);
		const partDesc = parts[partIndex];
		let effect = partDesc.effect;
		if (effect == 'none' && partDesc.part.slugify() == 'chest') {
			effect = 'physicalSkillPenalty';
		}

		const wound = {
			damageDesc,
			partDesc: partDesc.subPart,
			partName: partDesc.part,
			desctype, 
			level: damageLevel,
			location: hitLocation?.name,
			effect,
			descIndex: damageDescRand,
			partIndex
		}

		wound.tooltip = this.createWoundTooltip(wound);

		if (!hitLocation) {
			hitLocation = {
				name: partDesc.part,
				effect,
			};
		}

		if (!this.system.wounds) this.system.wounds = [];
		this.system.wounds.push(wound);
		await this.update({"system.wounds": this.system.wounds});
		return [wound, hitLocation];
	}

	createWoundTooltip(wound) {
		let abilityId = this.getAbilityIdFromWoundPart(wound.partName);

		let tooltip = game.i18n.localize('SHADOWDARK.wounds.makeScar');
		tooltip += "<br>" + game.i18n.format('SHADOWDARK.wounds.makeScarThreshold', { ratio: CONFIG.SHADOWDARK.SCAR_EFFECT_RATIO });
		tooltip += "<br>" + game.i18n.format('SHADOWDARK.wounds.makeScarLuck', { ratio: CONFIG.SHADOWDARK.SCAR_EFFECT_RATIO });
		tooltip += "<br>" + game.i18n.format("SHADOWDARK.wounds.makeScarAbility", { ratio: CONFIG.SHADOWDARK.SCAR_EFFECT_RATIO, ability: game.i18n.localize('SHADOWDARK.ability_' + abilityId) });
		return tooltip;
	}

	async updateWoundCondition(wound) {
		if (wound == null || wound.effect == null || wound.effect == 'none') return;

		const items = await this.getEmbeddedCollection("Item");
		const existingCondition = items.contents.find(i => i.system.category == 'condition' && i.system.hitLocationEffect == wound.effect);
		if (!existingCondition) return;

		const hitLocationConditionObj = await CompendiumsSD.hitLocationCondition(wound.effect);
		if (!hitLocationConditionObj) return;

		const hitLocationCondition = await fromUuid(hitLocationConditionObj.uuid);
		if (!hitLocationCondition) return;

		let maxWoundLevel = 0;
		const allWoundsWithThisEffect = this.system.wounds.filter(w => w.effect === wound.effect);
		for (let thisWound of allWoundsWithThisEffect) {
			if (thisWound.level > maxWoundLevel) maxWoundLevel = thisWound.level;
		}

		if (maxWoundLevel == 0) {
			await this.deleteEmbeddedDocuments("Item", [existingCondition.id]);
			return;
		}

		for (let effect of existingCondition.effects) {
			const originalEffect = hitLocationCondition?.effects.contents.find(e => e.id == effect.id);
			for (let change of effect.changes) {
				const activeEffects = await existingCondition.getEmbeddedCollection("ActiveEffect");
				const activeEffect = activeEffects.contents.find(e => e.changes.some(c => c.key == change.key));
				if (activeEffect) {
					const activeEffectChange = activeEffect.changes.find(c => c.key == change.key);
					const currentLevel = parseFloat(activeEffectChange.value);
					const originalChange = originalEffect?.changes.find(c => c.key == activeEffectChange.key);
					activeEffectChange.value = maxWoundLevel * parseFloat(originalChange.value);

					if (activeEffectChange.value != currentLevel) {
						await existingCondition.updateEmbeddedDocuments("ActiveEffect", [
							{
								"_id": activeEffect.id,
								"changes": activeEffect.changes,
							},
						]);
					}
				}
			}
		}
	}

	async createScarFromWound(wound) {
		if (wound == null) return;

		const scarIndex = Math.floor(Math.random() * 20);
		let scarDesc = game.i18n.localize(`SHADOWDARK.wounds.scar_${scarIndex}`);
		scarDesc += " " + wound.partName.slugify();

		const abilityId = this.getAbilityIdFromWoundPart(wound.partName);
		
		const scar = {
			scarDesc,
			abilityId,
			level: wound.level,
			partName: wound.partName,
			subPart: wound.partDesc,
		}

		this.system.scars.push(scar);
		this.update({"system.scars": this.system.scars});
	}

	getAbilityIdFromWoundPart(part) {
		switch (part.slugify()) {
			case 'head':
				return 'cha';
			case 'arms':
				return 'str';
			case 'legs':
				return 'dex';
			case 'chest':
				return 'con';
			case 'neck':
				return 'wis';
			case 'eyes':
				return 'wis';
			case 'vitals':
				return 'con';
			default:
				return 'wis';
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

	async applyHPpercentage(percentage) {
		let newHpValue = this.system.attributes.hp.max;
		newHpValue = Math.ceil(newHpValue * percentage);
		if (newHpValue <= 0) newHpValue = 1;
		this.system.attributes.hp.value = newHpValue;
		await this.update({"system.attributes.hp.value": newHpValue});
	}

	async onActionPerformed(item, exists) {
		if (this.isBurning()) this.burnOut();
		if (this.isFrozen()) this.thawFrost(); 
		if (!game.settings.get("shadowdark", "wounds")) {
			const easedEffects = await this.easeHitLocationEffects();
			let autoEase = ['system.penalties.dizzy', 'system.penalties.stunned', 'system.penalties.blindness'];
			autoEase = autoEase.filter(item => !easedEffects.includes(item));
			if (autoEase.length)
				this.easeEffects(autoEase);
		}
		if (item && exists) {
			if (exists && await item.isExpendable()) {
				this.deleteEmbeddedDocuments("Item", [item.id]);
			}
		}
	}

	async applyHitLocationEffect(hitLocation, wound) {
		if (hitLocation == null) return;
		if (wound != null && hitLocation.effect == 'none' && hitLocation.name.slugify() == 'chest') {
			hitLocation.effect = 'physicalSkillPenalty';
		}
		if (hitLocation.effect == null || hitLocation.effect == 'none') return;

		const items = await this.getEmbeddedCollection("Item");
		const existingCondition = items.contents.find(i => i.system.category == 'condition' && i.system.hitLocationEffect == hitLocation.effect);

		const hitLocationConditionObj = await CompendiumsSD.hitLocationCondition(hitLocation.effect);
		if (!hitLocationConditionObj) return;

		const hitLocationCondition = await fromUuid(hitLocationConditionObj.uuid);
		if (!hitLocationCondition) return;

		if (existingCondition)
		{
			for (let effect of existingCondition.effects) {
				const originalEffect = hitLocationCondition?.effects.contents.find(e => e.id == effect.id);
				for (let change of effect.changes) {
					const activeEffects = await existingCondition.getEmbeddedCollection("ActiveEffect");
					const activeEffect = activeEffects.contents.find(e => e.changes.some(c => c.key == change.key));
					if (activeEffect) {
						const activeEffectChange = activeEffect.changes.find(c => c.key == change.key);
						const currentLevel = parseFloat(activeEffectChange.value);
						if (wound == null)
							activeEffectChange.value = parseFloat(activeEffectChange.value) - 1;
						else {
							const originalChange = originalEffect?.changes.find(c => c.key == activeEffectChange.key);
							activeEffectChange.value = wound.level * parseFloat(originalChange.value);
						}

						if (currentLevel != activeEffectChange.value && 
							((currentLevel > 0 && activeEffectChange.value > currentLevel) || 
							 (currentLevel < 0 && activeEffectChange.value < currentLevel))) {
							await existingCondition.updateEmbeddedDocuments("ActiveEffect", [
								{
									"_id": activeEffect.id,
									"changes": activeEffect.changes,
								},
							]);
						}
					}
				}
			}
			return;
		}

		let newCondition;
		[newCondition] = await this.createEmbeddedDocuments(
			"Item",
			[hitLocationCondition]
		);

		if (newCondition && wound != null && wound.level > 1) {
			for (let effect of newCondition.effects) {
				let altered = false;
				for (let change of effect.changes) {
					if (change.key === 'system.penalties.' + hitLocation.effect) {
						change.value = wound.level * parseFloat(change.value);
						altered = true;
					}
				}

				if (altered) {
					newCondition.updateEmbeddedDocuments("ActiveEffect",  [{
							"_id": effect.id,
							"changes": effect.changes,
						},
					]);
				}
			}
		}
	}

	async easeHitLocationEffects() {
		const items = await this.getEmbeddedCollection("Item");
		const existingConditions = items.contents.filter(i => i.system.category == 'condition' && i.system.hitLocationEffect);
		if (!existingConditions || !existingConditions.length) return [];

		let hasBled = 0;
		const easedEffects = [];
		for (let existingCondition of existingConditions) {
			const effects = await existingCondition.getEmbeddedCollection("ActiveEffect");
			let areAllChangeValues0 = true;
			const updateData = [];
			for (let effect of effects) {
				for (let change of effect.changes) {
					change.value = parseInt(change.value) + 1;
					if (change.key == 'system.penalties.bleeding')
						hasBled++;
					if (change.value < 0) areAllChangeValues0 = false;
					else if (change.value > 0) change.value = 0;
					easedEffects.push(change.key);
				}

				updateData.push({
					"_id": effect.id,
					"changes": effect.changes,
				});
			}

			if (areAllChangeValues0) {
				await this.deleteEmbeddedDocuments("Item", [existingCondition.id]);
			} else {
				await existingCondition.updateEmbeddedDocuments("ActiveEffect", updateData);
			}
		}

		if (hasBled) {
			const cardData = {
				img: "icons/skills/wounds/bleeding-black-silver.png",
				actor: this,
				message: game.i18n.format(
					"SHADOWDARK.chat.bleeding",
					{
						name: this.name,
						amount: hasBled,
					}
				),
			};

			let template = "systems/shadowdark/templates/chat/bleeding.hbs";

			const content = await foundry.applications.handlebars.renderTemplate(template, cardData);

			await ChatMessage.create({
				content,
				rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
			});

			this.applyDamage(hasBled, 1);
		}
		return easedEffects;
	}

	async easeEffects(effectKeys) {
		const effects = await this.getEmbeddedCollection("ActiveEffect");
		let areAllChangeValues0 = true;
		const updateData = [];
		const removeIds = [];
		for (let effect of effects) {
			let areAllChangeValues0 = true;
			let noEffectIncluded = true;
			for (let change of effect.changes) {
				if (effectKeys.includes(change.key))
				{
					change.value = parseInt(change.value);
					if (change.value > 0)
					{
						change.value--;
						if (change.value > 0)
							areAllChangeValues0 = false;
					}
					else if (change.value < 0)
					{
						change.value++;
						if (change.value < 0)
							areAllChangeValues0 = false;
					}
					noEffectIncluded = false;
				}
			}

			if (noEffectIncluded) continue;

			if (areAllChangeValues0) {
				removeIds.push(effect.id);
			} else {
				updateData.push({
					"_id": effect.id,
					"changes": effect.changes,
				});
			}
		}

		if (removeIds.length) {
			await this.deleteEmbeddedDocuments("ActiveEffect", removeIds);
		}
		if (updateData.length) {
			await this.updateEmbeddedDocuments("ActiveEffect", updateData);
		}
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
			baseDamageType: (item.system?.damage?.type ? UtilitySD.capitalize(item.system.damage.type) : null),
			bonusDamage: 0,
			attackOption: "",
			extraDamageDice: "",
			extrDamage: item.system.extraDamage ?? [],
			properties: await item.propertiesDisplay(item.system?.damage?.type),
			meleeAttackBonus: this.system.bonuses.meleeAttackBonus,
			rangedAttackBonus: this.system.bonuses.rangedAttackBonus,
		};

		await this.getExtraDamageDiceForWeapon(item, weaponOptions);

		const weaponDisplays = {melee: [], ranged: []};

		const weaponMasterBonus = this.calcWeaponMasterBonus(item);
		weaponOptions.bonusDamage = weaponMasterBonus;

		// Find out if the user has a modified damage die
		let oneHanded = item.system.damage?.oneHanded ?? false;
		let twoHanded = item.system.damage?.twoHanded ?? false;

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
			
			if (this.level >= 3)
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
			
			if (this.level >= 9)
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

		if (this.system.bonuses.bladeLore && item.system.creator && item.system.creator == this.uuid)
		{
			weaponOptions.attackBonus++;
			weaponOptions.bonusDamage++;
		}

		if (item.system.customWeaponTarget && item.system.customWeaponTarget == this.uuid)
		{
			weaponOptions.attackBonus++;
			if (this.system.bonuses.smithingTranscendent)
				weaponOptions.attackBonus++;
		}

		if (item.system.type === "melee") {
			weaponOptions.attackBonus += baseAttackBonus
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
				if (await item.hasProperty('ancient-steel')) weaponOptions.bonusDamage++;
				if (await item.hasProperty('supersharp')) weaponOptions.bonusDamage++;
				if (await item.hasProperty('ultrasharp')) weaponOptions.bonusDamage += 2;

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
				
				if (item.system.damage?.twoHanded) {
					weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[
						item.system.damage?.twoHanded
					];
					var parts = weaponOptions.baseDamage.split("d");
					parts[0] = parseInt(parts[0]) + 1;
					weaponOptions.baseDamage = parts.join("d");

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

			// if thrown build range attack option
			if (await item.hasProperty("thrown")) {

				const thrownBaseBonus = Math.max(meleeAttack, rangedAttack);

				weaponOptions.attackBonus = thrownBaseBonus
					+ parseInt(this.system.bonuses.rangedAttackBonus, 10)
					+ parseInt(item.system.bonuses.attackBonus, 10)
					+ weaponMasterBonus;

				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[oneHanded];

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
					if (item.system.damage && item.system.damage?.oneHanded && item.system.damage?.oneHanded !== "" && (!item.system.damage?.twoHanded || item.system.damage?.twoHanded === "") && !isUnarmedAttack)
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
					var weapon1Parts = weapon1.system.damage?.oneHanded.split("d");
					var weapon2Parts = weapon2.system.damage?.oneHanded.split("d");
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

					if (await weapon2.hasProperty('ancient-steel')) weaponOptions.bonusDamage++;
					if (await weapon2.hasProperty('supersharp')) weaponOptions.bonusDamage++;
					if (await weapon2.hasProperty('ultrasharp')) weaponOptions.bonusDamage += 2;

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
				if (await item.hasProperty('ancient-steel')) weaponOptions.bonusDamage++;
				if (await item.hasProperty('supersharp')) weaponOptions.bonusDamage++;
				if (await item.hasProperty('ultrasharp')) weaponOptions.bonusDamage += 2;
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
				if (await item.hasProperty('ancient-steel')) weaponOptions.bonusDamage++;
				if (await item.hasProperty('supersharp')) weaponOptions.bonusDamage++;
				if (await item.hasProperty('ultrasharp')) weaponOptions.bonusDamage += 2;
				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.twoHanded_short");

				weaponDisplays.ranged.push({
					display: await this.buildWeaponDisplay(weaponOptions),
					handedness: "2h",
					baseDamage: weaponOptions.baseDamage,
					itemId,
				});
			}
			if (!oneHanded && !twoHanded) {
				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.oneHanded_short");
				weaponDisplays.ranged.push({
					display: await this.buildWeaponDisplay(weaponOptions),
					handedness: "1h",
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

		let total = this.system.abilities[ability].base
			+ this.system.abilities[ability].bonus
			+ magicModifier;


		if (total < 20 && this.system.bonuses[ability] && this.system.bonuses[ability].naturalBonus) {
			total += this.system.bonuses[ability].naturalBonus;
			if (total > 20) total = 20;
		}

		const labelKey = `SHADOWDARK.ability_${ability}`;

		return {
			total,
			bonus: this.system.abilities[ability].bonus,
			base: this.system.abilities[ability].base,
			modifier: this._abilityModifier(total),
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
			bonus += 1 + Math.floor(this.level / 2);
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

		let spellPenalty = 0;
		if (this.system.penalties?.dizzy)
			spellPenalty += -2;

		const data = {
			rollType,
			item: item,
			actor: this,
			abilityBonus: this.abilityModifier(abilityId),
			baseDifficulty: characterClass?.system?.spellcasting?.baseDifficulty ?? 10,
			talentBonus: this.system.bonuses.spellcastingCheckBonus,
			injuryPenalty: this.system.penalties?.toHit,
			spellPenalty
		};

		const parts = [game.settings.get("shadowdark", "use2d10") ? "2d10" : "1d20", "@abilityBonus", "@talentBonus", "@hitLocationBonus", "@injuryPenalty", "@spellPenalty"];

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

		game.shadowdark.lightSourceTracker._makeDirty();
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

	async getArmorClass(bodyPart) {
		if (this.type === "NPC")
		{
			let acValue = this.system.attributes.ac.value;

			if (this.system.bonuses?.bloodiedAC && this.system.attributes.hp.value <= this.system.attributes.hp.max / 2) {
				if (acValue < acValue + this.system.bonuses.bloodiedAC)
					acValue = acValue + this.system.bonuses.bloodiedAC;
			}
			
			return [acValue, '', this.system.bonuses?.metallic ?? false, this.system.attributes.ac.value];
		}

		let dexModifier = this.abilityModifier("dex");
		let isWearingMetallicArmor = false;
		let metallicArmorValue = 0;

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

		if (this.system.bonuses?.dexBonusToAc)
			dexModifier += this.system.bonuses.dexBonusToAc;
		
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
		shadowdark.logTimestamp(`ActorSD getArmorClass Initial Checks.`);

		const acOverride = this.system.attributes.ac?.override ?? null;
		if (Number.isInteger(acOverride)) {
			// AC is being overridden by an effect so we just use that value
			// and ignore everything else
			newArmorClass = acOverride;
			armorClassTooltip = "AC override: " + acOverride;
		}
		else {
			let armorMasteryBonus = 0;

			const equippedArmor = [];
			const equippedShields = [];

			for (let item of this.items)
			{
				if (!item.system.equipped) continue;

				if (item.type === "Armor")
				{
					if (await item.isAShield()) {
						equippedShields.push(item);
					}
					else {
						if (bodyPart == null || item.system.coverage == null || item.system.coverage?.length == 0 || item.system.coverage.includes(bodyPart)) {
							equippedArmor.push(item);
						}
					}
				}
			}
			shadowdark.logTimestamp(`ActorSD getArmorClass Split Weapon, Armor and Shields.`);

			if (equippedShields.length > 0) {
				const firstShield = equippedShields[0];
				shieldBonus = firstShield.system.ac.modifier;

				armorMasteryBonus = this.system.bonuses.armorMastery.filter(
					a => a === firstShield.name.slugify()
							|| a === firstShield.system.baseArmor
				).length;

				if (await firstShield.isMetallicArmor())
				{
					isWearingMetallicArmor = true;
					metallicArmorValue += shieldBonus;
				}
			}
			shadowdark.logTimestamp(`ActorSD getArmorClass Shield Checks.`);

			if (equippedArmor.length > 0) {
				newArmorClass = 0;
				armorClassTooltip = "";

				let bestAttributeBonus = null;
				let bestAttributeForBonus = '';
				let baseArmorClassApplied = false;
				this.isEquippingHeavyArmor = false;
				this.isEquippingRigidArmor = false;
				this.isEquippingMetallicArmor = false;

				let bestArmorClass = -1;
				let bestArmorClassTooltip = '';
				for (const armor of equippedArmor) {
					const [armorAC, armorTooltip, armorMastery, baseACApplied] = await this.getArmorAC(armor);
					let fullAC = armorAC + armorMastery;
					if (fullAC > bestArmorClass) {
						bestArmorClass = armorAC;
						bestArmorClassTooltip = armorTooltip;
						armorMasteryBonus = armorMastery;
						baseArmorClassApplied = baseACApplied;
					}
				}

				newArmorClass += bestArmorClass;
				armorClassTooltip += bestArmorClassTooltip;

				if (this.isEquippingHeavyArmor && this.system.bonuses.heavyArmorACBonus)
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

				newArmorClass += armorMasteryBonus;
				newArmorClass += shieldBonus;

				if (this.isEquippingMetallicArmor)
				{
					isWearingMetallicArmor = true;
					if (newArmorClass > baseArmorClass)
						metallicArmorValue += (newArmorClass - baseArmorClass);
				}

				if (armorMasteryBonus) armorClassTooltip += "Armor Mastery:" + armorMasteryBonus + "<br>";
				if (shieldBonus) armorClassTooltip += "Shield Bonus:" + shieldBonus + "<br>";
				shadowdark.logTimestamp(`ActorSD getArmorClass Other Bonuses.`);
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
			shadowdark.logTimestamp(`ActorSD getArmorClass Dual Wield.`);

			// Add AC from bonus effects
			if (this.system.bonuses.acBonus)
			{
				let effectACbonus = parseInt(this.system.bonuses.acBonus, 10);
				newArmorClass += effectACbonus;
				if (effectACbonus) armorClassTooltip += "Effects AC bonus: " + effectACbonus + "<br>";
			}

			// Stone Skin Talent provides a bonus based on level
			if (this.system.bonuses.stoneSkinTalent > 0) {
				const currentLevel = this.level ?? 0;
				const stoneSkinBonus = 2 + Math.floor(currentLevel / 2);
				newArmorClass += stoneSkinBonus;
				if (stoneSkinBonus) armorClassTooltip += "Stone Skin bonus: " + stoneSkinBonus + "<br>";
			}
			shadowdark.logTimestamp(`ActorSD getArmorClass Effects Bonuses.`);
		}

		if (this.system.bonuses.bloodiedAC && this.system.attributes.hp.value <= this.system.attributes.hp.max / 2)
		{
			baseArmorClass += this.system.bonuses.bloodiedAC;
			armorClassTooltip += "Bloodied AC bonus: " + this.system.bonuses.bloodiedAC + "<br>";
		}

		if (this.system.penalties?.dizzy)
		{
			newArmorClass -= 2;
			armorClassTooltip += "You are dizzy: -2<br>";
		}
		shadowdark.logTimestamp(`ActorSD getArmorClass Conditions.`);

		this.update({"system.attributes.ac.value": newArmorClass});

		if (armorClassTooltip.endsWith("<br>"))
    		armorClassTooltip = armorClassTooltip.slice(0, -4);

		shadowdark.logTimestamp(`ActorSD getArmorClass End.`);
		return [newArmorClass, armorClassTooltip, isWearingMetallicArmor, metallicArmorValue];
	}

	async getArmorAC(armor) {
		// Check if armor mastery should apply to the AC.  Multiple
		// mastery levels should stack
		//
		const masteryLevels = this.system.bonuses.armorMastery.filter(
			a => a === armor.name.slugify()
				|| a === armor.system.baseArmor
		);
		let armorMasteryBonus = masteryLevels.length;
		let baseArmorClassApplied = false;

		let armorClassTooltip = '';
		if (armor.system.ac.base > 0)
		{
			baseArmorClassApplied = true;
			armorClassTooltip += "Base AC: " + armor.system.ac.base + " (" + armor.name + ")<br>";
		}

		let armorClass = armor.system.ac.base;
		armorClass += armor.system.ac.modifier;
		if (armor.system.ac.modifier)
			armorClassTooltip += "Shield AC modifier: " + armor.system.ac.modifier + "<br>";

		let armorExpertise = (this.system.bonuses.armorExpertise != null && this.system.bonuses?.armorExpertise == armor.name.slugify()) ? 1 : 0;
		armorClass += armorExpertise;
		if (armorExpertise)
			armorClassTooltip += "Armor Expertise: " + armorExpertise + "<br>";
	
		const attribute = armor.system.ac.attribute;
		if (attribute) {
			const attributeBonus = this.abilityModifier(attribute);

			if (attributeBonus) {
				armorClass += attributeBonus;
				armorClassTooltip += UtilitySD.capitalize(attribute) + " Ac Modifier: " + attributeBonus + "<br>";
			}

			if (attribute == 'dex' && this.system.bonuses?.dexBonusToAc) {
				armorClass += this.system.bonuses.dexBonusToAc;
				armorClassTooltip += "Dex Ac Modifier Bonus: " + this.system.bonuses.dexBonusToAc + "<br>";
			}
		}
		else
		{
			this.isEquippingHeavyArmor = true;
		}

		if (armor.system.customArmorTarget && armor.system.customArmorTarget == this.uuid)
		{
			armorClass += 1;
			armorClassTooltip += "Custom Armor Bonus: 1<br>";
			if (this.system.bonuses.smithingTranscendent)
			{
				armorClass += 1;
				armorClassTooltip += "Transcendent Smithing: 1<br>";
			}
		}

		if (this.system.bonuses.armorPositioning && armor.system.creator && armor.system.creator == this.uuid)
		{
			armorClass += 1;
			armorClassTooltip += "Armor Positioning: 1<br>";
		}

		if (await armor.isMetallicArmor()) this.isEquippingMetallicArmor = true;
		if (await armor.isRigidArmor()) this.isEquippingRigidArmor = true;
		shadowdark.logTimestamp(`ActorSD getArmorClass Checked Armor ${armor.name}.`);
		return [armorClass, armorClassTooltip, armorMasteryBonus, baseArmorClassApplied];
	}

	getDamageReduction(hitLocation) {
		if (this.type === 'NPC') {
			return this.system.attributes.dr?.base ?? 0;
		}

		const equippedArmorItems = this.items.filter(
			item => item.type === "Armor" && item.system.equipped
		);
		let dr = 0;
		for (let armor of equippedArmorItems) {
			if (hitLocation == null || armor.system.coverage == null || armor.system.coverage?.length == 0 || armor.system.coverage.includes(hitLocation.name)) {
				dr += armor.system.dr?.base ?? 0;
			}
		}
		return dr;
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

	async setMetalCoreHp(event, options) {
		const newMetalCoreHp = parseInt(event.currentTarget.value);
		const prevMetalCoreHp = parseInt(event.currentTarget.dataset.previousValue);
		if (this.system.magic.metalCore.hp)
		{
			this.system.magic.metalCore.hp.value = newMetalCoreHp;
			await this.update({"system.magic.metalCore.hp.value": this.system.magic.metalCore.hp.value});

			if (newMetalCoreHp <= 0)
				MetalMagicSD._onManifestMetalCore(this, null, null);
		}
	}

	async removeTempHpEffects() {
		let itemTempHPeffects = await this.items.filter(i => i.effects.find(e => e.changes.some(c => c.key === "system.bonuses.tempHP")));
		if (itemTempHPeffects) {
			for (let itemTempHPeffect of itemTempHPeffects)
			{
				if (itemTempHPeffect.effects.some(e => e.changes.some(c => c.key === "system.bonuses.tempHP")))
				{
					await this.deleteEmbeddedDocuments(
						"Item",
						[itemTempHPeffect._id]
					);
				}
			}
		}

		let activeEffects = await this.getEmbeddedCollection("ActiveEffect");
		for (let activeEffect of activeEffects) {
			if (activeEffect.changes.some(c => c.key === "system.bonuses.tempHP"))
			{
				await this.deleteEmbeddedDocuments(
					"ActiveEffect",
					[activeEffect._id]
				);
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
				if (tempHPvalue > 0)
					await this.update({"system.attributes.hp.temp": this.system.attributes.hp.temp});
				if (tempHPvalue <= 0)
					await this.removeTempHpEffects();
				ret = true;
			}
		}
		return ret;
	}

	async recalculateHp() {
		let maxHp = 1;
		let hpTooltip = '1 Base.';

		//const hp = this.system.attributes.hp;
		let hpFrac = this.system.attributes.hp.frac;
		let hpBase = this.system.attributes.hp.base;
		let hpMax = this.system.attributes.hp.bax;

		//shadowdark.debug(`recalculateHp Bonus HP: ${hp.bonus}`);
		let conMod = (this.system.abilities['con'].mod > 0 ? this.system.abilities['con'].mod : 0);
		let strMod = (this.system.abilities['str'].mod > 0 ? this.system.abilities['str'].mod : 0);
		if (conMod != 0)
		{
			maxHp += conMod;
			hpTooltip += '<br>' + (conMod > 0 ? '+' : '') + conMod + ' from CON';
		}
		if (this.system.bonuses.hardy)
		{
			maxHp += strMod;
			hpTooltip += '<br>' + (strMod > 0 ? '+' : '') + strMod + ' from Hardy';
		}

		if (this.type === "Player") {
			if (this.level > 0 && hpBase != 0 && !this.system.attributes.hp.rolls)
				this.system.attributes.hp.rolls = [];

			if (this.level > 0 && hpBase != 0 && this.system.attributes.hp.rolls.length == 0)
				this.distributeHpRolls();
		}

		const hpRollMode = game.settings.get("shadowdark", "useFixedHP");
		switch (hpRollMode) {
			case 4:  // Fixed at 10 + CON Mod.
				maxHp = 10 + (this.system.abilities['con'].mod > 0 ? this.system.abilities['con'].mod : 0);
				hpTooltip = maxHp + ' Base';
				break;
			case 5: // Fixed at 10 + CON Mod + STR Mod.
				maxHp = 10 + (this.system.abilities['con'].mod > 0 ? this.system.abilities['con'].mod : 0) + (this.system.abilities['str'].mod > 0 ? this.system.abilities['str'].mod : 0);
				hpTooltip = maxHp + ' Base';
				break;
			case 6: // Fixed at CON.
				maxHp = calcAbilityValues('con').total;
				hpTooltip = maxHp + ' Base';
				break;
			case 7: // Fixed at CON + STR Mod.
				maxHp = calcAbilityValues('con').total + (this.system.abilities['str'].mod > 0 ? this.system.abilities['str'].mod : 0);
				hpTooltip = maxHp + ' Base';
				break;
		}

		let bonusHpFromItems = 0;
		for (const item of this.items) {
			for (const effect of item.effects ?? []) {
				for (const change of effect.changes ?? []) {
					if (change.key == 'system.attributes.hp.bonus') {
						bonusHpFromItems += parseFloat(change.value);
					}
					if (change.key == 'system.bonuses.rollHP') {
						maxHp += parseFloat(change.value);
						hpTooltip += '<br>' + (change.value > 0 ? '+' : '') + change.value + ' from ' + item.name;
					}
					if (change.key == 'system.bonuses.hpBonus') {
						maxHp += parseFloat(change.value);
						hpTooltip += '<br>' + (change.value > 0 ? '+' : '') + change.value + ' from ' + item.name;
					}
				}
			}
		}

		//let extraBonusHp = this.system.attributes.hp.bonus - bonusHpFromItems;
		//if (extraBonusHp) {
			//maxHp += parseFloat(extraBonusHp);
			//hpTooltip += '<br>' + (extraBonusHp > 0 ? '+' : '') + extraBonusHp + ' from extra Bonus HP';
			//if (extraBonusHp != 0) {
				
			//}
		//}

		hpFrac = maxHp;
		hpBase = Math.floor(hpFrac);

		if (bonusHpFromItems) {
			maxHp += bonusHpFromItems;
			hpTooltip += '<br>' + (bonusHpFromItems > 0 ? '+' : '') + bonusHpFromItems + ' from bonus HP';
		}

		let hpPenalty = this.system.penalties?.maxHp ?? 0;
		if (hpPenalty != 0)
		{
			hpTooltip += '<br>' + (hpPenalty > 0 ? '+' : '') + hpPenalty + ' from HP Penalty';
		}

		hpMax = hpBase + bonusHpFromItems + hpPenalty;

		//shadowdark.debug(`recalculateHp Frac: ${hpFrac}, Base: ${hpBase}, Bonus: ${bonusHpFromItems}, Max: ${hpMax}`);

		if (bonusHpFromItems != this.system.attributes.hp.bonus) await this.update({ "system.attributes.hp.bonus": bonusHpFromItems });
		if (hpFrac != this.system.attributes.hp.frac) await this.update({ "system.attributes.hp.frac": hpFrac });
		if (hpBase != this.system.attributes.hp.base) await this.update({ "system.attributes.hp.base": hpBase });
		if (hpMax  != this.system.attributes.hp.max)  await this.update({ "system.attributes.hp.max":  hpMax });

		return [hpMax, hpTooltip];
	}

	distributeHpRolls() {
		let rolls = [];
		let frac = this.system.attributes.hp.frac;
		let sum = 0;
		for (let i = 0; i < this.level; i++) {
			let roll = Math.round((frac - sum) / (this.level - i));
			rolls.push(roll);
			sum += roll;
		}
		this.system.attributes.hp.rolls = rolls;
		this.update({
			"system.attributes.hp.rolls": this.system.attributes.hp.rolls
		});
	}

	async applyBonusHp(item)
	{
		let itemBonusHPeffect = item.effects.find(e => e.changes.some(c => c.key === "system.bonuses.hpBonus"))
		if (!itemBonusHPeffect)
			return;

		let bonusHPchange = itemBonusHPeffect.changes.find(c => c.key === "system.bonuses.hpBonus");
		let bonusHPvalue = parseInt(bonusHPchange.value);

		//shadowdark.debug(`applyBonusHp bonusHPvalue=${bonusHPvalue}`);
		this.system.attributes.hp.bonus += bonusHPvalue;

		await this.update({
			"system.attributes.hp.bonus": this.system.attributes.hp.bonus
		});
	}

	async removeBonusHp(value)
	{
		//shadowdark.debug(`applyBonusHp removeBonusHp=${value}`);
		this.system.attributes.hp.bonus -= value;
		if (this.system.attributes.hp.bonus < 0) this.system.attributes.hp.bonus = 0;
		await this.update({
			"system.attributes.hp.bonus": this.system.attributes.hp.bonus
		});
	}
	
	async updateHP(newHP) {
		var currHP = this.system.attributes.hp;
		var damage = currHP.value - newHP;

		var finalHp = newHP;
		if (damage > 0)
		{
			if (damage >= currHP.temp)
			{
				var overflowDamage = damage - currHP.temp;
				finalHp = currHP.value - overflowDamage;
				//shadowdark.debug(`updateHP final HP: ${finalHp}`);
				currHP.value = finalHp;

				this.system.bonuses.tempHP = 0;
				currHP.temp = 0;
				this.removeTempHpEffects();
			}
			else
			{
				finalHp = currHP.value;
				//shadowdark.debug(`updateHP 2 final HP: ${finalHp}`);
				currHP.value = finalHp;
				this.system.bonuses.tempHP -= damage;
				currHP.temp -= damage;
			}
		}
		else if (damage < 0)
			currHP.value = finalHp;

		if (currHP.value < 0) currHP.value = 0;
		if (currHP.value > currHP.max) currHP.value = currHP.max;

		await this.update({
			"system.attributes.hp.value": currHP.value,
		});

		return currHP;
	}

	onDeleteDocuments(deleted) {
		for (let effect of deleted.effects ?? [])
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
		let disadvantages = this.system.bonuses?.disadvantage ?? [];
		let disadvantagePenalties = this.system.penalties?.disadvantage ?? [];
		if (Array.isArray(disadvantagePenalties))
			disadvantages.push(...disadvantagePenalties);
		else
			disadvantages.push(disadvantagePenalties);

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
			const l = fromUuidSync(uuid);
			if (l)
			{
				if (!l.system.description)
					l.system.description = '';

				languageItems.push(l);
			}
		}

		return languageItems.sort((a, b) => a.name.localeCompare(b.name));
	}


	async nanoMagicTalents() {
		const nanoMagicTalents = [];

		for (const uuid of this.system?.magic?.nanoMagicTalents ?? []) {
			if (uuid.type === "Talent")
				nanoMagicTalents.push(uuid);
			else
				nanoMagicTalents.push(fromUuidSync(uuid));
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
			let talent = fromUuidSync(uuid);
			if (talent) auraMagicTalents.push(talent);
		}

		return auraMagicTalents.sort((a, b) => a.name.localeCompare(b.name));
	}


	async metalMagicTalents() {
		const metalMagicTalents = [];

		for (const uuid of this.system?.magic?.metalMagicTalents ?? []) {
			metalMagicTalents.push(fromUuidSync(uuid));
		}

		return metalMagicTalents.sort((a, b) => a.name.localeCompare(b.name));
	}

	async metalMagicTalentChanges() {
		const metalMagicTalents = [];

		for (const uuid of this.system?.magic?.metalMagicTalents ?? []) {
			metalMagicTalents.push(fromUuidSync(uuid));
		}

		let changes = [];
		for (let talent of metalMagicTalents) {
			for (let effect of talent.effects) {
				for (let change of effect.changes) {
					changes.push({key: change.key, value: change.value});
				}
			}
		}
		return changes;
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
		return this.level;
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
	
	async getAuraMagicEffects() {
		var auraMagicEffects = [];

		var allAuraMagicPowers = await shadowdark.compendiums.auraMagicPowers();
		shadowdark.logTimestamp(`ActorSD getAuraMagicEffects Got All Powers.`);
		for (var i = 0; i <= this.system.magic.auralCore.value; i++)
		{
			for (var power of allAuraMagicPowers)			
			{
				let powerLevel = parseInt(power.system.powerLevel);
				if (powerLevel === i)
				{
					if (!(power.system?.duration)) power.system.duration = "instant";
					power.formattedDuration = game.i18n.localize( CONFIG.SHADOWDARK.SEIRIZIAN_DURATIONS[power.system.duration]);
					power.formattedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML( jQuery(UtilitySD.adjustDescriptionForLevel(power.system.description, 1)).text(), { async: true, } );
					power.increasedDuration = power.system.duration;
					power.increasedDamage = power.system.damage;
					power.increasedPowerLevel = power.system.powerLevel;
					auraMagicEffects.push(power);
				}
				else if (powerLevel < i)
				{
					var updatedPower = structuredClone(fromUuidSync(power.uuid));
					updatedPower._id += "_" + i;
					updatedPower.uuid = power.uuid;
					updatedPower.effectiveLevel = i;
					if (!(updatedPower.system?.duration)) updatedPower.system.duration = "instant";
					updatedPower.formattedDuration = game.i18n.localize( CONFIG.SHADOWDARK.SEIRIZIAN_DURATIONS[updatedPower.system.duration]);
					let evaluatedOriginalDescription = UtilitySD.adjustDescriptionForLevel(power.system.description, i - powerLevel);
					let evaluatedDescription = UtilitySD.adjustDescriptionForLevel(power.system.description, 1 + i - powerLevel);
					updatedPower.formattedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML( jQuery(evaluatedDescription).text(), { async: true, } );
					updatedPower.increasedDuration = updatedPower.system.duration;
					updatedPower.increasedDamage = updatedPower.system.damage;
					updatedPower.increasedPowerLevel = i;
					let newUpdatedPower = await ItemSD.increasePower(updatedPower, i - parseInt(updatedPower.system.powerLevel));
					if (newUpdatedPower)
						updatedPower = newUpdatedPower;

					if (newUpdatedPower || evaluatedDescription != evaluatedOriginalDescription)
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
			shadowdark.logTimestamp(`ActorSD getAuraMagicEffects Processed Powers level ${i}.`);
		}
		shadowdark.logTimestamp(`ActorSD getAuraMagicEffects End.`);
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
		let gearSlotsTooltip = game.i18n.localize("SHADOWDARK.inventory.default_gear_slots") + " " + shadowdark.defaults.GEAR_SLOTS;

		if (this.type === "Player") {
			const strength = this.calcAbilityValues('str').total;

			gearSlots = strength > gearSlots ? strength : gearSlots;
			gearSlotsTooltip = game.i18n.localize("SHADOWDARK.inventory.str_gear_slots") + " " + gearSlots;

			// Hauler's get to add their Con modifer (if positive)
			if (this.system.bonuses.hauler)
			{
				const conModifier = this.abilityModifier("con");
				gearSlots += conModifier > 0
					? conModifier
					: 0;
				if (conModifier > 0)
					gearSlotsTooltip += "<br>" + game.i18n.localize("SHADOWDARK.inventory.hauler") + " " + conModifier;
			}

			if (this.system.bonuses.gear_slots)
			{
				gearSlots += this.system.bonuses.gear_slots;
				gearSlotsTooltip += "<br>" + game.i18n.localize("SHADOWDARK.inventory.talent_gear_slots") + " " + this.system.bonuses.gear_slots;
			}

			// Add effects that modify gearslots
			if (this.system.bonuses.gearSlots)
			{
				gearSlots += parseInt(this.system.bonuses.gearSlots, 10);
				gearSlotsTooltip += "<br>" + game.i18n.localize("SHADOWDARK.inventory.talent_gear_slots") + " " + this.system.bonuses.gearSlots;
			}
		}

		return [gearSlots, gearSlotsTooltip];
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
		const parts = [game.settings.get("shadowdark", "use2d10") ? "2d10" : "1d20", "@abilityBonus", "@itemBonus", "@talentBonus", "@spellPenalty", "@woundPenalty", "@scarPenalty"];

		let target = null;
		if (typeof abilityId === 'object' && abilityId.stat) {
			target = abilityId.target;
			abilityId = abilityId.stat;
		}

		let abilityBonus = this.abilityModifier(abilityId);
		if (this.system.bonuses?.transcendentKnowledge && ['wis', 'cha'].includes(abilityId))
		{
			const intBonus = this.abilityModifier('int');
			if (intBonus > abilityBonus)
				abilityBonus = intBonus;
		}
		const ability = CONFIG.SHADOWDARK.ABILITIES_LONG[abilityId];
		var itemBonus = 0;
		if (this.system.bonuses.abilityCheckBonus && this.system.bonuses.abilityCheckBonus === abilityId)
			itemBonus += 1;
		if (this.system.bonuses.abilityCheckBoost && this.system.bonuses.abilityCheckBoost === abilityId)
			itemBonus += 2;

		let spellPenalty = 0;
		if (this.system.penalties?.dizzy)
			spellPenalty += -2;

		let scarPenalty;
		if (this.system.scars?.length)
		{
			const applicableScars = this.system.scars?.filter(s => s.abilityId === abilityId);
			scarPenalty = -Math.floor(applicableScars?.length * CONFIG.SHADOWDARK.SCAR_EFFECT_RATIO);
		}

		const data = {
			rollType: "ability",
			abilityBonus,
			ability,
			itemBonus,
			target,
			actor: this,
			checkTypes: CONFIG.SHADOWDARK.CHECKS[abilityId],
			spellPenalty,
			scarPenalty
		};

		if (this.system?.penalties?.physicalSkillPenalty && ['str', 'dex', 'con'].includes(abilityId)) {
			data.woundPenalty = this.system.penalties.physicalSkillPenalty;
		}

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
		if (!item.system.extraDamage) item.system.extraDamage = [];

		if (game.settings.get("shadowdark", "enableTargeting")) {
			var tokens = CONFIG.DiceSD.selectedTokens();
			options.target = '';
			for (var token of tokens)
			{
				let [actorAc, acTooltip, isMetallic, metallicPart] = await token.actor?.getArmorClass(options.hitLocationName) ?? [0, '', false, 0];

				if (token.actor.system.bonuses?.shieldWall) {
					actorAc += await this.shieldWallBonus(token.actor);
				}
				
				if (this.system.bonuses?.opponentACpenalty)
					actorAc -= this.system.bonuses?.opponentACpenalty;

				if (this.system.bonuses.weakPointSpecialist) {
					if (token.actor.system?.bonuses?.rigid ||
						token.actor.system?.bonuses?.metallic ||
						token.actor.system?.bonuses?.armored ||
						isMetallic )
					{
						actorAc--;
						if (this.system.bonuses.smithingTranscendent)
							actorAc--;
					}
				}

				if (options.target) options.target += ", ";
				options.target += actorAc;
			}
			options.targetTokens = tokens;
		}

		const ammunition = item.availableAmmunition();

		let ammunitionItem = undefined;
		if (ammunition && Array.isArray(ammunition) && ammunition.length > 0) {
			ammunitionItem = ammunition[0];
		}

		let spellPenalty = 0;
		if (this.system.penalties?.dizzy)
			spellPenalty += -2;

		const data = {
			actor: this,
			ammunitionItem,
			item: item,
			rollType: (item.isWeapon()) ? item.system.baseWeapon.slugify() : item.name.slugify(),
			usesAmmunition: item.usesAmmunition,
			spellPenalty,
			itemBonus: 0,
			itemDamageBonus: 0
		};

		if (item.system.customWeaponTarget && item.system.customWeaponTarget == this.uuid)
		{
			data.itemBonus += 1;
			if (this.system.bonuses.smithingTranscendent)
				data.itemBonus += 1;
		}

		const bonuses = this.system.bonuses;
		const penalties = this.system.penalties;

		// Summarize the bonuses for the attack roll
		const parts = [(game.settings.get("shadowdark", "use2d10") ? "2d10" : "1d20"), "@itemBonus", "@abilityBonus", "@talentBonus", "@targetLock", "@hitLocationBonus", "@injuryPenalty", "@spellPenalty"];
		data.damageParts = ["@itemDamageBonus"];

		// Check damage multiplier
		const damageMultiplier = Math.max(
			parseInt(data.item.system.bonuses?.damageMultiplier, 10),
			parseInt(data.actor.system.bonuses?.damageMultiplier, 10),
			1);

		// Magic Item bonuses
		if (item.system.bonuses.attackBonus) {
			data.itemBonus += item.system.bonuses.attackBonus;
		}

		if (item.system.bonuses.damageBonus)
			data.itemDamageBonus = item.system.bonuses.damageBonus * damageMultiplier;

		if (this.system.bonuses.bladeLore && item.system.creator && item.system.creator == this.uuid)
		{
			data.itemBonus += 1;
			data.itemDamageBonus++;
		}

		if (await item.hasProperty('ancient-steel'))
			data.itemDamageBonus++;

		if (await item.hasProperty('supersharp'))
			data.itemDamageBonus++;

		if (await item.hasProperty('ultrasharp'))
			data.itemDamageBonus += 2;

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

				data.injuryPenalty = penalties?.toHit;
				data.spellPenalty = penalties?.dizzy ? -2 : 0;
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

				data.injuryPenalty = penalties?.toHit;
				data.spellPenalty = penalties?.dizzy ? -2 : 0;
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
		if (!options.baseDamage || options.baseDamage == '') {
			if (data.item.system.damage.numDice && (data.item.system.damage.oneHanded || data.item.system.damage.twoHanded))
			{
				if (data.item.system.damage.twoHanded)
				{
					options.baseDamage = data.item.system.damage.numDice + data.item.system.damage.twoHanded;
					options.handedness = '2h';
				}
				else if (data.item.system.damage.oneHanded)
				{
					options.baseDamage = data.item.system.damage.numDice + data.item.system.damage.oneHanded;
					options.handedness = '1h';
				}
			}
			else
			{
				data.item.system.damage.value = null;
				return;
			}
		}

		data.item.system.damage.value = options.baseDamage;

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
			let numBackstabDice = 1 + Math.floor(this.level / 2);
			if (this.system.bonuses?.backstabDie) {
				numBackstabDice += parseInt(this.system.bonuses?.backstabDie, 10);
			}
			data.backstabDice = numBackstabDice + 'd' + baseDamageDieType;
		}

		let damageDie = data.item.system.damage.oneHanded;
		if (options.handedness === '2h')
			damageDie = data.item.system.damage.twoHanded;
		if (damageDie == null) damageDie = 'd' + baseDamageDieType;
		let damageDieParts = damageDie.split('d');
		if (damageDieParts.length > 1)
			damageDie = 'd' + damageDieParts[1];

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
			
			if (this.level >= 3)
			{
				damageDie = shadowdark.utils.getNextDieInList(
					damageDie,
					shadowdark.config.DAMAGE_DICE
				);
			}
			
			if (this.level >= 9)
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
			//if (!data.item.system.damage?.type?.includes("fire"))
			//	data.item.system.damage.type += ", fire";
		}

		data.item.system.damage.value = damageRoll;
	}

	async rollMagic(magicCoreLevel, params={}, power=null) {
		params.dialogTemplate = "systems/shadowdark/templates/dialog/roll-magic-dialog.hbs";
		params.chatCardTemplate = "systems/shadowdark/templates/chat/magic-card.hbs";
		const parts = [(game.settings.get("shadowdark", "use2d10") ? "2d10" : "1d20"), "@itemBonus", "@abilityBonus", "@talentBonus", "@hitLocationBonus", "@spellPenalty"];

        if (params.powerLevel < magicCoreLevel && (power?.system.duration_increase || power?.system.damage_increase))
        {
            params.variableLevelEffects = true;
        }

		let spellPenalty = 0;
		if (this.system.penalties?.dizzy)
			spellPenalty += -2;

		const data = {
			actor: this,
			spellName: params.spellName,
			rollType: params.magicType,
			powerLevel: params.powerLevel,
			talentBonus: magicCoreLevel,
			injuryPenalty: this.system.penalties?.toHit,
			spellPenalty: (this.system.penalties?.dizzy ? -2 : 0),
			magicCoreLevel: magicCoreLevel,
			nanoPoints: params.nanoPoints,
			cost: params.cost,
			failureTolerance: params.failureTolerance,
			memoryProtection: params.memoryProtection,
			spellDC: params.spellDC,
			isHealing: params.isHealing,
			damage: params.damage,
			duration: params.duration,
			duration_amount: params.duration_amount,
			duration_desc: params.duration_desc,
			advantage: params.advantage,
			advantageTooltip : params.advantageTooltip,
			target: params.target,
			variableLevelEffects: params.variableLevelEffects,
			description: params.description,
			power: power,
            resistedBy: params.resistedBy ? params.resistedBy.toUpperCase() : null,
            resistanceDC: params.resistanceDC,
			effectiveLevel: params.effectiveLevel,
			item: null,
			spellPenalty,
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
			if (!data.resistedBy)
				data.resistedBy = power.system?.resistedBy;
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
		const lightSources = await foundry.utils.fetchJsonWithTimeout("systems/shadowdark/assets/mappings/map-light-sources.json");
		const lightData = lightSources[item.system.light.template].light;
		if (item.system.light.intensity) {
			lightData.dim = Math.round(50 * item.system.light.intensity * canvas.scene.grid.distance) / 50;
			lightData.bright = lightData.dim / 2;
		}

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

	async craftablePotions() {
		return this.items.filter(i => i.type == 'Talent' && i.system.craftablePotion);
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
							var effects = await item.getEmbeddedCollection("ActiveEffect");
							if (effects.contents.length)
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
		// const message = item.type != 'Player' 
		// 	? game.i18n.format(
		// 		"SHADOWDARK.chat.light_source.dropped_expired", { name: this.name }
		// 	)
		// 	: game.i18n.format(
		// 		"SHADOWDARK.chat.light_source.expired",
		// 		{
		// 			name: this.name,
		// 			lightSource: item.name,
		// 		}
		// 	);
		const message = game.i18n.format(
				"SHADOWDARK.chat.light_source.expired",
				{
					name: this.name,
					lightSource: item.name,
				}
			);

		const cardData = {
			img: item.img,
			actor: this,
			message,
		};

		let template = "systems/shadowdark/templates/chat/lightsource-toggle-gm.hbs";

		const content = await foundry.applications.handlebars.renderTemplate(template, cardData);

		await ChatMessage.create({
			content,
			rollMode: CONST.DICE_ROLL_MODES.SELF,
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
			rollMode: CONST.DICE_ROLL_MODES.SELF,
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
				var armor = await fromUuidSync(armorUuid);
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
				var weapon = await fromUuidSync(weaponUuid);
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
		if (await item.isBasicArmor())
			return true;

		if (item.system.customWeaponTarget && item.system.customWeaponTarget == this.uuid)
			return true;
		if (item.system.customArmorTarget && item.system.customArmorTarget == this.uuid)
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

	isBurning() {
		return this.system?.penalties?.burning;
	}

	async burnOut() {
		var rollResult = await shadowdark.dice.DiceSD._roll(['1d4'], {});
		await game.dice3d.showForRoll(rollResult.roll, game.user, true, false, false);
		await this.applyDamage(rollResult.roll.total, 1);

		var effects = await this.getEmbeddedCollection("ActiveEffect");
		if (effects.contents.length)
		{
			let effect = effects.contents.find(e => e.changes.find(c => c.key === 'system.penalties.burning'));
			if (effect) {
				this.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
			}
		}
	}

	isFrozen() {
		return this.system?.penalties?.frozen;
	}

	async thawFrost() {

	}

	async isWearingSealedArmor() {
		const equippedArmorItems = this.items.filter(
			item => item.type === "Armor" && item.system.equipped
		);
		const equippedArmor = [];
		for (const item of equippedArmorItems) {
			if (!await item.isAShield()) {
				equippedArmor.push(item);
			}
		}
		for (let armor of equippedArmor)
		{
			if (await armor.hasProperty('sealed'))
				return true;
		}
		return false;
	}

	async makeTaintCheck() {
		if (this.system?.bonuses?.mistdarkCreature) return;
		if (this.system?.bonuses?.helvarion) return;
		if (await this.isWearingSealedArmor()) return;
		if ((this.system?.magic?.metalMagicPowers ?? []).some(p => p.name.slugify() == 'biological-resistance') && this.system?.magic?.manifestedMetalCore)
			return;

		let diceRoll = game.settings.get("shadowdark", "use2d10") ? "2d10" : "1d20";
		if (this.system.bonuses.advantage == 'physical-resistance' || this.system.bonuses.con?.advantage) {
			diceRoll = game.settings.get("shadowdark", "use2d10") ? "3d10kh2" : "2d20kh1";
		}

		var rollParts = [diceRoll, this.system.abilities['con'].mod.toString()];
		var rollResult = await shadowdark.dice.DiceSD._roll(rollParts, {target: 12});

		if (rollResult.roll.total < 12)
		{
			var damageResult = await shadowdark.dice.DiceSD._roll(['1d4'], {});
			await shadowdark.dice.DiceSD._renderRoll(
				{actor: this,
					rolls: { main: rollResult, damage: damageResult } },
				0,
				{title: "Failed a Taint Check.",
					chatCardTemplate: "systems/shadowdark/templates/chat/roll-card.hbs",
					target: 12,
					speaker: ChatMessage.getSpeaker({actor: this}),
				});

			var actorToken = canvas.scene.tokens.find(t => t.actor?.id === this.id);
			if (actorToken)
			{
				await shadowdark.dice.DiceSD.applyDamageToToken(actorToken, damageResult.roll.total, 'corrosion');
				await MistMagicSD.applyMistTaintToActor(this);
			}
		}
		else
		{
			await shadowdark.dice.DiceSD._renderRoll(
				{actor: this,
					rolls: { main: rollResult } },
					0, 
					{title: "Resisted a Taint Check.",
					chatCardTemplate: "systems/shadowdark/templates/chat/roll-card.hbs",
					target: 12,
					speaker: ChatMessage.getSpeaker({actor: this}),
					});
		}
	}

	async onDefeat() {
		if (this.system.bonuses?.mistdarkCreature) {
			let actorToken = canvas.scene.tokens.find(t => t.actor?.id === this.id);
			if (actorToken)
			{
				let tokens = UtilitySD.getAllNearTokens(actorToken, 0.5);
				for (let token of tokens) {
					await token.actor?.makeTaintCheck();
				}
			}
		}
	}

	async transferItem(item, to) {
		if (to) {
			if (game.user.isGM) {
				to.createItemOnActor(item);
			} else {
				const structuredItemClone = structuredClone(item);
				shadowdark.log(`emiting createItemOnActor for ${item.actor.name} ${item.name}`);
				game.socket.emit(
					"system.shadowdark",
					{
						type: "createItemOnActor",
						data: {
							item: structuredItemClone,
							itemUuid: item.uuid,
							originalItemOwnerId: item.actor.uuid,
							newOwnerId: to.uuid,
						},
					}
				);
			}
		}

		item.actor.deleteEmbeddedDocuments(
				"Item",
				[item.id]
			);
	}

	async createItemOnActor(item) {
		if (typeof item == 'object' && !(item instanceof ItemSD)) {
			item = await fromUuid(item.uuid);
		}

		var effects = await item.getEmbeddedCollection("ActiveEffect");
		if (!item.isPotion() && effects.contents.length > 0) {
			var alreadyHasAtempHPeffect = this.items.some(i => i.effects.some(e => e.changes.some(c => c.key === "system.bonuses.tempHP")));
			if (alreadyHasAtempHPeffect) {
				if (await this.applyTempHp(item)) {
					this.render();
					return;
				}
			}

			let itemObj = await shadowdark.effects.createItemWithEffect(item, this);
			if (itemObj)
			{
				itemObj.system.level = this?.system?.level?.value;

				let [newItem] = await this.createEmbeddedDocuments(item.documentName, [itemObj]);
				//const newItem = this.getEmbeddedDocument(item.documentName, item.id);

				if (itemObj.effects.some(e => e.changes.some(c => c.key === "system.light.template"))) {
					this._toggleLightSource(newItem);
				}

				await this.applyTempHp(item);
				await this.applyBonusHp(item);
			}
		}
		else
		{
			await this.sheet._onDropItem({}, item);
		}
	}

	statPoints() {
		let points = 0;
        const attrKeys = ['str', 'int', 'dex', 'wis', 'con', 'cha'];
        for (const ability of attrKeys) {
			const mod = this.system.abilities[ability].mod;
			switch (mod) {
				case -5:
					points -= 12;
					break;
				case -4:
					points -= 7;
					break;
				case -3:
					points -= 4;
					break;
				case -2:
					points -= 2;
					break;
				case -1:
					points -= 1;
					break;
				case 0:
					break;
				case 1:
					points += 1;
					break;
				case 2:
					points += 2;
					break;
				case 3:
					points += 4;
					break;
				case 4:
					points += 7;
					break;
				case 5:
					points += 12;
					break;
				default:
					points += 17;
					break;
			}
        }
		return points;
	}

	removeItem(item) {
		this.deleteEmbeddedDocuments(
				"Item",
				[item.id]
			);
	}

	async applySmithingPerksToCreatedItem(item)
	{
		const updateData = {
			"_id": item.id,
			"system.creator": this.uuid,
			"system.creatorName": this.name,
		}

		if (item.type == 'Armor') {
			if (this.system.bonuses.smithingSuperiorMaterials) {
				if (item.system.slots?.slots_used > 1) {
					item.system.slots.slots_used--;
					if (this.system.bonuses.smithingTranscendent && item.system.slots.slots_used > 1)
						item.system.slots.slots_used--;

					updateData['system.slots.slots_used'] = item.system.slots.slots_used;
				}
			}
			if (this.system.bonuses.smithingCustomArmor) {
				const chosenTarget = await UtilitySD.actorChoiceDialog({addSomeoneElse: true, title: 'SHADOWDARK.dialog.item.custom_item.title', label: 'SHADOWDARK.dialog.item.custom.label'});
				if (chosenTarget) {
					updateData['name'] = chosenTarget.name + '\'s ' + item.name;
					updateData['system.customArmorTarget'] = chosenTarget.uuid;
					updateData['system.customArmorTargetName'] = chosenTarget.name;
				}
			}
		} else if (item.type == 'Weapon') {
			if (this.system.bonuses.smithingImpactSpecialist) {
				let oneHanded, twoHanded;
				if (item.system.damage?.oneHanded) {
					oneHanded = item.system.damage.oneHanded;
					oneHanded = shadowdark.utils.getNextDieInList(
						oneHanded,
						shadowdark.config.DAMAGE_DICE
					);
					updateData['system.damage.oneHanded'] = oneHanded;
				}
				if (item.system.damage?.twoHanded) {
					twoHanded = item.system.damage.twoHanded;
					twoHanded = shadowdark.utils.getNextDieInList(
						twoHanded,
						shadowdark.config.DAMAGE_DICE
					);
					updateData['system.damage.twoHanded'] = twoHanded;
				}

				if (this.system.bonuses.smithingTranscendent) {
					if (item.system.damage?.oneHanded) {
						oneHanded = shadowdark.utils.getNextDieInList(
							oneHanded,
							shadowdark.config.DAMAGE_DICE
						);
						updateData['system.damage.oneHanded'] = oneHanded;
					}
					if (item.system.damage?.twoHanded) {
						twoHanded = shadowdark.utils.getNextDieInList(
							twoHanded,
							shadowdark.config.DAMAGE_DICE
						);
						updateData['system.damage.twoHanded'] = twoHanded;
					}
				}
			}
			if (this.system.bonuses.smithingExpertSharpener) {
				const properties = await shadowdark.compendiums.weaponProperties();
				const supersharp = properties.find(p => p.name.slugify() == 'supersharp');
				const ultrasharp = properties.find(p => p.name.slugify() == 'ultrasharp');
				if (this.system.bonuses.smithingTranscendent && ultrasharp) {
					item.addProperty(ultrasharp.uuid);
				} else if (supersharp) {
					item.addProperty(supersharp.uuid);
				} else {

				}
			}
			if (this.system.bonuses.smithingCustomWeapon) {
				const chosenTarget = await UtilitySD.actorChoiceDialog({addSomeoneElse: true, title: 'SHADOWDARK.dialog.item.custom_item.title', label: 'SHADOWDARK.dialog.item.custom.label'});
				if (chosenTarget) {
					updateData['name'] = chosenTarget.name + '\'s ' + item.name;
					updateData['system.customWeaponTarget'] = chosenTarget.uuid;
					updateData['system.customWeaponTargetName'] = chosenTarget.name;
				}
			}
		}

		this.updateEmbeddedDocuments("Item", [updateData]);

		if (this.system.bonuses.smithingMasterCrafter) {
			const itemType = await item.isAShield() ? "Shield" : (
				item.isArmor() ? "Armor" : (
					item.isRangedWeapon() ? "Ranged" : ( 
						item.isMeleeWeapon() ? "Melee" : "Other"
					)
				)
			);

			const applicableTechniques = await shadowdark.compendiums.craftableTechniques(itemType);
			if (!applicableTechniques || !applicableTechniques.length) return;

			const technique = await UtilitySD.choiceDialog({
				choices: applicableTechniques,
				title: 'SHADOWDARK.dialog.item.choose_technique.title',
				label: 'SHADOWDARK.dialog.item.choose_technique.label'
			});

			if (technique) {
				await this.updateEmbeddedDocuments("Item", [{
					"_id": item.id,
					"system.magicItem": true,
				}]);

				const changes = [];
				for (const effect of technique.effects) {
					for (const change of effect.changes) {
						changes.push({key: change.key, 
								mode: change.mode,
								value: change.value
						});
					}
				}

				const itemEffectData =  {
					name: technique.name,
					label: technique.name,
					img: technique.img,
					changes,
					disabled: true,
					transfer: true,
					sourceName: 'Master Crafter',
					system: { origin: 'Master Crafter' },
					description: technique.system.description,
				};

				await item.createEmbeddedDocuments("ActiveEffect", [itemEffectData]);
			}
		}
	}
}
