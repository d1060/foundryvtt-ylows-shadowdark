import BritannianMagicSD from "../sheets/magic/BritannianMagicSD.mjs";
import UtilitySD from "../utils/UtilitySD.mjs";

export default class ActiveEffectsSD {

	/**
	 * Creates a dialog that allows the user to pick from a list. Returns
	 * a slugified name to be used in effect values.
	 * @param {string} type - Type of input to ask about
	 * @param {Array<string>} options - The list of options to choose from
	 * @returns {string}
	 */
	static async askEffectInput(effectParameters) {
		// const effectParameters = [{key, type, options}, {key, type, options}];
		const parameters = Array.isArray(effectParameters)
			? effectParameters
			: [effectParameters];
		let allOptionsEmpty = true;
		for (const parameter of parameters) {
			parameter.label = await game.i18n.localize(
				`SHADOWDARK.dialog.effect.choice.${parameter.type}`
			);
			parameter.uuid = foundry.utils.randomID();
			
			let optionsLength = 0;
			if (Array.isArray(parameter.options)) optionsLength = parameter.options.length;   // arrays
  			if (parameter.options instanceof Map || parameter.options instanceof Set) optionsLength = parameter.options.size; // optional bonus
  			if (typeof parameter.options === 'object') optionsLength = Object.keys(parameter.options).length;

			if (optionsLength)
				allOptionsEmpty = false;
		}
		if (allOptionsEmpty)
			return [null, null];

		const content = await foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/effect-list-choice.hbs",
			{
				effectParameters: parameters,
			}
		);

		const data = {
			window: { title: await game.i18n.localize("SHADOWDARK.dialog.effect.choices.title") },
			content,
			classes: ["app", "shadowdark", "window-app", "dialog", "themed", "shadowdark-dialog", "effect-select", "theme-light"],
 			buttons: [
				{
					action: "submit",
					label: game.i18n.localize("SHADOWDARK.dialog.submit"),
					callback: html => {
						const selected = {};

						for (const parameter of parameters) {
							// const formValue = html[0].querySelector("input")?.value ?? "";
							const selector = parameter.type + "-selection-" + parameter.uuid;
							const element = html.currentTarget.querySelector("#" + selector);
							const formValue = (element && element.value) ? element.value : "";

							let slug = false;
							for (const [key, value] of Object.entries(parameter.options)) {
								if (formValue === value) {
									slug = key;
									break;
								}
							}

							selected[parameter.type] = [slug, formValue] ?? null;
						}

						return selected;
					},
				},
			],
			close: () => false,
		};

		const result = await foundry.applications.api.DialogV2.wait(data);
		return result;
	}


	/**
	 * Contains logic that handles any complex effects, where the user
	 * needs to provide input to determine the effect.
	 * @param {Item} item - The item being created
	 */
	static async createItemWithEffect(item, actor) {
		let itemObj = item.toObject();
		await Promise.all(itemObj.effects?.map(async e => {
			// If the item contains effects that require user input,
			// ask and modify talent before creating
			if (
				e.changes?.some(c =>
					CONFIG.SHADOWDARK.EFFECT_ASK_INPUT.includes(c.key)
				)
			) {
				// Spell Advantage requires special handling as it uses the `advantage` bons
				if (e.changes.some(c => c.key === "system.bonuses.advantage")) {
					// If there is no value with REPLACME, it is another type of advantage talent
					if (e.changes.some(c => c.value === "REPLACEME")) {
						const key = "spellAdvantage";
						itemObj = await this.modifyEffectChangesWithInput(item, e, actor, key);
					}
				}
				else {
					itemObj = await this.modifyEffectChangesWithInput(item, e, actor);
				}
			}
		}));

		// If any effects was created without a value, we don't create the item
		if (itemObj.effects.some(e => e.changes.some(c => !c.value))) {
			ui.notifications.warn(game.i18n.localize("SHADOWDARK.item.effect.warning.add_effect_without_value"));
			return null;
		}

		// Activate lightsource tracking
		if (itemObj.effects.some(e => e.changes.some(c => c.key === "system.light.template"))) {
			const duration = itemObj.totalDuration;
			itemObj.system.light.isSource = true;
			itemObj.system.light.longevitySecs = duration;
			itemObj.system.light.remainingSecs = duration;
			itemObj.system.light.longevityMins = duration / 60;
		}

		// A Talent to Roll Max HP
		if (itemObj.effects.some(e => e.changes.some(c => c.key === "system.bonuses.rollHP"))) {
			const effect = itemObj.effects.find(e => e.changes.some(c => c.key === "system.bonuses.rollHP"));
			const change = effect.changes.find(c => c.key === "system.bonuses.rollHP");
			const diceToRoll = parseInt(change.value);
			let hpValue = 0;

			const hpData = {
				rollType: "hp",
				actor
			};
			let advantage = 0;
			if (actor?.hasAdvantage(hpData)) advantage = 1;

			const hpRollMode = game.settings.get("shadowdark", "useFixedHP");
			switch (hpRollMode)
			{
				case 0: // Roll Normally.
					let options = {};
					options.title = game.i18n.localize("SHADOWDARK.dialog.hp_roll.title");

					options.flavor = options.title;
					options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-hp.hbs";
					options.fastForward = true;

					let parts = ['1d' + diceToRoll];

					const result = await CONFIG.DiceSD.Roll(parts, hpData, false, advantage, options);

					hpValue = result.rolls.main.roll.total;
					ui.sidebar.changeTab("chat", "primary");
				break;
				case 1: // Full HP
					if (advantage) hpValue += diceToRoll * 0.5;
					else hpValue += diceToRoll;
				break;
				case 2: // 75% HP
					if (advantage) hpValue += diceToRoll;
					else hpValue += (diceToRoll + 1) * 0.75;
				break;
				case 3: // Half HP
					if (advantage) hpValue += (diceToRoll + 1) * 0.75;
					else hpValue += (diceToRoll + 1) * 0.5;
				break;
			}

			change.value = hpValue;
		}

		return itemObj;
	}

	static async copyEffectValues(itemSource, itemDestination) {
		// Change new item name and effects based on user choice.
		var changed = false;
		itemDestination.name = itemSource.name;
		for (var effect of itemDestination.effects)
		{
			for (var change of effect.changes)
			{
				for (var itemSourceEffect of itemSource.effects)
				{
					for (var itemSourceChange of itemSourceEffect.changes)
					{
						if (itemSourceChange.key === change.key)
						{
							change.value = itemSourceChange.value;
							changed = true;
						}
					}
				}
			}
		}
		return changed;
	}


	/**
	 * Creates effects based on predefined effect choices and the supplied
	 * predefined effect mappings.
	 * @param {string} key - Name of the predefined effect
	 * @param {Object} data - The item data of the item to be created
	 * @returns {ActiveEffect}
	 */
	static async createPredefinedEffect(actor, key) {
		const data = CONFIG.SHADOWDARK.PREDEFINED_EFFECTS[key];

		if (!data) return shadowdark.error(`No effect found (${key})`);

		let defaultValue = "REPLACEME";
		[defaultValue] = await shadowdark.effects.handlePredefinedEffect(
			key, data.defaultValue, actor, data.name
		);

		if (defaultValue === "REPLACEME") {
			return shadowdark.warn("Can't create effect without selecting a value.");
		}

		data.defaultValue = defaultValue;

		const effectMode = foundry.utils.getProperty(
			CONST.ACTIVE_EFFECT_MODES,
			data.mode.split(".")[2]);

		const value = (isNaN(parseInt(data.defaultValue, 10)))
			? data.defaultValue
			: parseInt(data.defaultValue, 10);

		const effectData = [
			{
				name: game.i18n.localize(`SHADOWDARK.item.effect.predefined_effect.${key}`),
				label: game.i18n.localize(`SHADOWDARK.item.effect.predefined_effect.${key}`),
				img: data.img,
				changes: [{
					key: data.effectKey,
					value,
					mode: effectMode,
				}],
				disabled: false,
				origin: actor.uuid,
				transfer: (Object.keys(data).includes("transfer"))
					? data.transfer
					: true,
			},
		];

		// Create the effect
		const [newActiveEffect] = await actor.createEmbeddedDocuments(
			"ActiveEffect",
			effectData
		);

		if (actor.documentName === "Actor") {
			newActiveEffect.sheet.render(true);
		}
	}


	/**
	 * Returns an object containing the effect key, and the
	 * translated name into the current language.
	 * @returns {Object}
	 */
	static async getPredefinedEffectsList() {
		const effects = {};

		for (const key in CONFIG.SHADOWDARK.PREDEFINED_EFFECTS) {
			const effect = CONFIG.SHADOWDARK.PREDEFINED_EFFECTS[key];

			effects[key] = {
				key,
				name: effect.name,
			};
		}

		return effects;
	}


	/**
	 * Handles special cases for predefined effect mappings
	 *
	 * @param {string} key - effectKey from mapping
	 * @param {Object} value - data value from mapping
	 * @param {Object} name - name value from mapping
	 * @returns {Object}
	 */
	static async handlePredefinedEffect(key, value, actor, name=null) {
		//if (actor != null)
		//	shadowdark.log(`handlePredefinedEffect actor is: ${actor.name}`);
		
		if (key === "acBonusFromAttribute") {
			const type = "attribute";

			const options = shadowdark.config.ABILITIES_LONG;

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "armorMastery") {
			const type = "armor";

			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.baseArmor()
			);

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "lightSource") {
			const type = "lightsource";

			// TODO Need to move to light source objects to allow customisation
			//
			const lightSourceList = await foundry.utils.fetchJsonWithTimeout("systems/shadowdark/assets/mappings/map-light-sources.json");

			const options = {};
			Object.keys(lightSourceList).map(i => {
				return options[i] = game.i18n.localize(lightSourceList[i].lang);
			});

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "spellAdvantage") {
			const type = "spell";

			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.spells()
			);

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "spellcastingClasses") {
			const type = "class";

			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.spellcastingBaseClasses()
			);

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (
			[
				"weaponDamageDieImprovementByProperty",
				"weaponDamageExtraDieImprovementByProperty",
			].includes(key)
		) {
			const type = "weapon_property";

			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.weaponProperties()
			);

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "weaponDamageExtraDieByProperty") {
			const parameters = [
				{
					key: key,
					type: "damage_die",
					options: shadowdark.config.DICE,
				},
				{
					key: key,
					type: "weapon_property",
					options: await shadowdark.utils.getSlugifiedItemList(
						await shadowdark.compendiums.weaponProperties()
					),
				},
			];

			const chosen = await this.askEffectInput(parameters);


			if (chosen.damage_die && chosen.weapon_property) {
				return [`${chosen.damage_die[0]}|${chosen.weapon_property[0]}`];
			}
			else {
				return [value];
			}
		}
		else if (["weaponMastery", "weaponDamageDieD12", "weaponDamageAdvantage"].includes(key)) {
			const type = "weapon";

			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.baseWeapons()
			);

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (["armorExpertise", "armorSpecialist", "armorConditioning"].includes(key)) {
			const type = "armor";

			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.baseArmor()
			);

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "overdraw") {
			const type = "rangedWeapon";

			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.rangedWeapons()
			);

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "combatProficiency") {
			const type = "proficiency";
			const armorOptions = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.baseArmor()
			);

			const existingArmorProficiencies = (await actor?.armorProficiencies()) ?? [];
			for (const key of Object.keys(armorOptions))
			{
				for (var proficiency of existingArmorProficiencies)
				{
					if (key === proficiency || proficiency === 'all')
					{
						delete armorOptions[key];
						break;
					}
				}
			}

			const weaponOptions = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.baseWeapons()
			);

			const rangedWeaponOptions = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.rangedWeapons()
			);

			const existingWeaponProficiencies = (await actor?.weaponProficiencies()) ?? [];
			for (const key of Object.keys(weaponOptions))
			{
				var isRanged = rangedWeaponOptions[key] ? true : false;

				for (var proficiency of existingWeaponProficiencies)
				{
					if (key === proficiency || proficiency === 'all' || (isRanged && proficiency === 'allRanged') || (!isRanged && proficiency === 'allMelee'))
					{
						delete weaponOptions[key];
						break;
					}
				}
			}

			const options = { ...armorOptions, ...weaponOptions };

			if (Object.keys(options).length === 0) return [];
			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "armorProficiency") {
			const type = "proficiency";
			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.baseArmor()
			);
			
			const existingProficiencies = (await actor?.armorProficiencies()) ?? [];
			for (const key of Object.keys(options))
			{
				for (var proficiency of existingProficiencies)
				{
					if (key === proficiency || proficiency === 'all')
					{
						delete options[key];
						break;
					}
				}
			}

			if (Object.keys(options).length === 0) return [];
			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "2Hweapon") {
			const type = "proficiency";
			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.base2HWeapons()
			);

			const rangedWeaponOptions = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.rangedWeapons()
			);

			const existingWeaponProficiencies = (await actor?.weaponProficiencies()) ?? [];
			for (const key of Object.keys(options))
			{
				var isRanged = rangedWeaponOptions[key] ? true : false;
				if (isRanged)
						delete options[key];
			}

			if (Object.keys(options).length === 0) return [];
			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "2HweaponProficiency") {
			const type = "proficiency";
			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.base2HWeapons()
			);

			const rangedWeaponOptions = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.rangedWeapons()
			);

			const existingWeaponProficiencies = (await actor?.weaponProficiencies()) ?? [];
			for (const key of Object.keys(options))
			{
				var isRanged = rangedWeaponOptions[key] ? true : false;

				for (var proficiency of existingWeaponProficiencies)
				{
					if (key === proficiency || proficiency === 'all' || (isRanged && proficiency === 'allRanged') || (!isRanged && proficiency === 'allMelee'))
					{
						delete options[key];
						break;
					}
				}
			}

			if (Object.keys(options).length === 0) return [];
			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "weaponProficiency") {
			const type = "proficiency";
			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.baseWeapons()
			);

			const rangedWeaponOptions = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.rangedWeapons()
			);

			const existingWeaponProficiencies = (await actor?.weaponProficiencies()) ?? [];
			for (const key of Object.keys(options))
			{
				var isRanged = rangedWeaponOptions[key] ? true : false;

				for (var proficiency of existingWeaponProficiencies)
				{
					if (key === proficiency || proficiency === 'all' || (isRanged && proficiency === 'allRanged') || (!isRanged && proficiency === 'allMelee'))
					{
						delete options[key];
						break;
					}
				}
			}

			if (Object.keys(options).length === 0) return [];
			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (["abilityCheckBonus", "abilityCheckBoost"].includes(key)) {
			const type = "attribute";

			const options = shadowdark.config.ABILITIES_LONG;

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "runeMastery") {
			const type = "rune";
			const options = BritannianMagicSD.runes.map(r => UtilitySD.capitalize(r.name));
			const chosen = await this.askEffectInput({name, type, options});
			const chosenRune = chosen[type][1];
			return [chosenRune.slugify(), chosenRune] ?? [value];
		}
		else if (key === "empoweredRunecasting") {
			const type = "rune";
			const options = [];
			for (let rune of BritannianMagicSD.runes)
			{
				if (rune.name === 'in' || rune.name === 'vas' || rune.name === 'kal')
					continue;
				if (!actor.system.britannian_magic || !actor.system.britannian_magic.runes)
					continue;
				if (actor.system.britannian_magic.runes.some(r => r.name === rune.name && r.learned))
					options.push(UtilitySD.capitalize(rune.name));
			}

			const chosen = await this.askEffectInput({name, type, options});
			const chosenRune = chosen[type][1];
			return [chosenRune.slugify(), chosenRune] ?? [value];
		}
		else if (key === "runeSpecialist") {
			const type = "rune";
			const options = [];
			for (let rune of BritannianMagicSD.runes)
			{
				if (!actor.system.britannian_magic || !actor.system.britannian_magic.runes)
					continue;
				if (actor.system.britannian_magic.runes.some(r => r.name === rune.name && r.learned))
					options.push(UtilitySD.capitalize(rune.name));
			}

			const chosen = await this.askEffectInput({name, type, options});
			const chosenRune = chosen[type][1];
			return [chosenRune.slugify(), chosenRune] ?? [value];
		}
		else if (key === "spellPenetration") {
			const type = "resistanceType";
			const options = {};
			if (!actor.system.bonuses.spellPenetration) actor.system.bonuses.spellPenetration = [];
			else if (!Array.isArray(actor.system.bonuses.spellPenetration)) actor.system.bonuses.spellPenetration = [actor.system.bonuses.spellPenetration];

			if (!actor.system.bonuses.spellPenetration.some(b => b === 'CON'))
				options['con'] = 'CON';
			if (!actor.system.bonuses.spellPenetration.some(b => b === 'WIS'))
				options['wis'] = 'WIS';
			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "potionSpecialist") {
			let craftablePotions = await actor.craftablePotions();
			craftablePotions = craftablePotions.filter(p => p.name.slugify().includes('potion'))
			if (!craftablePotions) return null;

			const type = "potion";

			const options = await shadowdark.utils.getSlugifiedItemList(craftablePotions);
			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "poisonSpecialist") {
			let craftablePoisons = await actor.craftablePotions();
			craftablePoisons = craftablePoisons.filter(p => p.name.slugify().includes('poison'));
			if (!craftablePoisons) return null;
			const type = "poison";

			const options = await shadowdark.utils.getSlugifiedItemList(craftablePoisons);
			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}

		return [value];
	}


	/**
	 * Asks the user for input if necessary for an effect that requires said input.
	 * @param {Item} item - Item that has the effects
	 * @param {*} effect - The effect being analyzed
	 * @param {*} key - Optional key if it isn't a unique system.bonuses.key
	 * @returns {Object} - Object updated with the changes
	 */
	static async modifyEffectChangesWithInput(item, effect, actor, key = false) {
		// Create an object out of the item to modify before creating
		const itemObject = item.toObject();
		let name = itemObject.name;

		var changes = await Promise.all(
			effect.changes.map(async c => {
				if (CONFIG.SHADOWDARK.EFFECT_ASK_INPUT.includes(c.key) && c.value === 'REPLACEME') {
					const effectKey = (key) ? key : c.key.split(".")[2];

					// Ask for user input
					let linkedName;
					[c.value, linkedName] = await this.handlePredefinedEffect(
						effectKey,
						null,
						actor,
						name
					);
					
					if (c.value) {
						name += ` (${linkedName})`;
					}

					//shadowdark.debug(`ActiveEffectsSD modifyEffectChangesWithInput Asked for user Input and got: '${c.value}', '${linkedName}'.`);
				}
				return c;
			})
		);
		
		// Modify the Effect object
		itemObject.effects.map(e => {
			if (e._id === effect._id) {
				//shadowdark.debug(`ActiveEffectsSD modifyEffectChangesWithInput Modifying effect Changes to: '${changes}', itemObject.name='${name}'.`);
				e.changes = changes;
				itemObject.name = name;
			}
			return e;
		});
		return itemObject;
	}

	static async fromPreDefined(owner, effectName) {
		let predefinedEffect = CONFIG.SHADOWDARK.PREDEFINED_EFFECTS[effectName];
		if (predefinedEffect == null)
			return;

		const docs = await owner.createEmbeddedDocuments("ActiveEffect", [{
			disabled: false,
			active: true,
			img: predefinedEffect.img ?? "icons/commodities/tech/cog-steel-grey.webp",
			name: predefinedEffect.name != null ? game.i18n.localize(predefinedEffect.name) : "New Effect",
			origin: owner.uuid,
			changes: [{
					key: predefinedEffect.effectKey,
					value: predefinedEffect.defaultValue ?? null,
					mode: predefinedEffect.mode ?? CONST.ACTIVE_EFFECT_MODES.ADD,
				}],
		}]);

		if (docs && docs[0]) docs[0].sheet.render(true);
	}

	static copiedEffect = null;
	/**
	* Manage Active Effect instances through the Actor Sheet via effect control buttons.
	* @param {MouseEvent} event      The left-click event on the effect control
	* @param {Actor|Item} owner      The owning entity which manages this effect
	*/
	static async onManageActiveEffect(event, owner, target) {
		event.preventDefault();

		let a;
		if (target)
			a = target;
		else
			a = event.currentTarget;

		const li = a.closest("li");
		const effectId = li.dataset.effectId;

		let effect = null;
		let itemName = null;
		let itemImage = null;

		if (owner.documentName === "Actor") {
			effect = effectId
				? owner.allApplicableEffects().find(effect => effect.id === effectId)
				: null;
		}
		else if (owner.documentName === "Item") {
			effect = effectId
				? owner.effects.find(effect => effect.id === effectId)
				: null;
			itemName = owner.name;
			itemImage = owner.img;
		}

		let action = a.dataset.option;

		switch (action) {
			case "create":
				const docs = await owner.createEmbeddedDocuments("ActiveEffect", [{
					disabled: li.dataset.effectType === "inactive",
					active: ActiveEffectsSD.copiedEffect?.active ?? true,
					img: ActiveEffectsSD.copiedEffect?.img ?? (itemImage ?? "icons/commodities/tech/cog-steel-grey.webp"),
					name: ActiveEffectsSD.copiedEffect?.name ?? (itemName ?? "New Effect"),
					description: ActiveEffectsSD.copiedEffect?.description ?? "",
					origin: owner.uuid,
					duration: ActiveEffectsSD.copiedEffect?.duration ?? {startTime: 6225, seconds: null, combat: null, rounds: null, turns: null, startRound: 0, startTurn: 0, type: "none", duration: null, },
					changes: ActiveEffectsSD.copiedEffect?.changes ?? [],
					flags: ActiveEffectsSD.copiedEffect?.flags ?? null,
					tint: ActiveEffectsSD.copiedEffect?.tint ?? '#ffffff',
					modifiesActor: ActiveEffectsSD.copiedEffect?.modifiesActor ?? true,
					isSuppressed: ActiveEffectsSD.copiedEffect?.isSuppressed ?? false,
					isTemporary: ActiveEffectsSD.copiedEffect?.isTemporary ?? false,
				}]);

				if (docs && docs[0]) await docs[0].sheet.render(true);
				break;
			case "edit":
				return effect.sheet.render(true);
			case "copy":
				ActiveEffectsSD.copiedEffect = effect;
			    ui.notifications.info(game.i18n.format("SHADOWDARK.ui.EffectCopiedClipboard", {effectName: effect.name}));
				break;
			case "delete":
				return foundry.applications.handlebars.renderTemplate(
					"systems/shadowdark/templates/dialog/are-you-sure.hbs"
				).then(html => {
					foundry.applications.api.DialogV2.wait({
						classes: ["app", "shadowdark", "shadowdark-dialog", "window-app", 'themed', 'theme-light'],
						window: {
							resizable: false,
							title: `${game.i18n.localize("SHADOWDARK.sheet.general.active_effects.delete_effect.tooltip")}`,
						},
						content: html,
						buttons: [
							{
								action: 'Yes',
								icon: "<i class=\"fa fa-check\"></i>",
								label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
								callback: async () => {
									let hasDeletetActor = await BritannianMagicSD.checkCancelSummonOrShapeshiftActor(effect.parent);
									if (!hasDeletetActor) await effect.delete();
								},
							},
							{
								action: 'Cancel',
								icon: "<i class=\"fa fa-times\"></i>",
								label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
							},
						],
						default: "Yes",
					});

					// new Dialog({
					// 	title: `${game.i18n.localize("SHADOWDARK.sheet.general.active_effects.delete_effect.tooltip")}`,
					// 	content: html,
					// 	buttons: {
					// 		Yes: {
					// 			icon: '<i class="fa fa-check"></i>',
					// 			label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
					// 			callback: async () => {
					// 				effect.delete();
					// 				owner.sheet?.render(true);
					// 			},
					// 		},
					// 		Cancel: {
					// 			icon: '<i class="fa fa-times"></i>',
					// 			label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
					// 		},
					// 	},
					// 	default: "Yes",
					// }).render(true);
				});
			case "toggle":
				return effect.update({disabled: !effect.disabled});
		}
	}

	/**
	* Prepare the data structure for Active Effects which are currently applied
	* to an Actor or Item.
	*
	* @param {ActiveEffect[]} effects    The array of Active Effect instances
	*                                    to prepare sheet data for
	* @return {object}                   Data for rendering
	*/
	static prepareActiveEffectCategories(effects) {
		const categories = {
			active: {
				type: "active",
				effects: [],
			},
			inactive: {
				type: "inactive",
				effects: [],
			},
		};

		for (const effect of effects) {
			let shortenedDurationLabel = effect.duration.remaining == null ? effect.duration.label : effect.duration.remaining + " " + game.i18n.localize(`SHADOWDARK.effect_duration.seconds`);
			if (effect.duration.remaining > 31536000) shortenedDurationLabel = 'None';
			else if (effect.duration.remaining > 86400) shortenedDurationLabel = Math.floor(effect.duration.remaining / 86400) + " " + game.i18n.localize(`SHADOWDARK.effect_duration.days`);
			else if (effect.duration.remaining > 3600) shortenedDurationLabel = Math.floor(effect.duration.remaining / 3600) + " " + game.i18n.localize(`SHADOWDARK.effect_duration.hours`);
			else if (effect.duration.remaining > 60) shortenedDurationLabel = Math.floor(effect.duration.remaining / 60) + " " + game.i18n.localize(`SHADOWDARK.effect_duration.minutes`);

			const decoratedEffect = {
				disabled: effect.disabled,
				durationLabel: shortenedDurationLabel,
				id: effect.id,
				img: effect.img,
				name: effect.name,
				casterName: effect.system.casterName,
				sourceName: (effect.system.origin && typeof effect.system.origin === "string") ? effect.system.origin : (effect.parent?.name ?? "Unknown"),
			};

			if (effect.parent && effect.parent.type == 'Talent') continue;

			if (effect.disabled) {
				categories.inactive.effects.push(decoratedEffect);
			}
			else {
				categories.active.effects.push(decoratedEffect);
			}
		}

		categories.active.effects.sort(
			(a, b) => a.name.localeCompare(b.name)
		).sort(
			(a, b) => a.sourceName.localeCompare(b.sourceName)
		);

		categories.inactive.effects.sort(
			(a, b) => a.name.localeCompare(b.name)
		).sort(
			(a, b) => a.sourceName.localeCompare(b.sourceName)
		);

		return categories;
	}
}
