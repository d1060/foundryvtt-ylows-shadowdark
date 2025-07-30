import UtilitySD from "../utils/UtilitySD.mjs";
import ActorSheetSD from "./ActorSheetSD.mjs";
import BritannianMagicSD from "./magic/BritannianMagicSD.mjs";

export default class NpcSheetSD extends ActorSheetSD {

	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["shadowdark", "sheet", "npc", 'themed', 'theme-light'],
		scrollY: ["section.SD-content-body"],
		position: {
    		width: 600,
    		height: "auto"
  		},
		window: {
			resizable: true,
			controls: [],
  		},
		form: {
			handler: this.#onSubmit,
		    submitOnChange: true,
    		closeOnSubmit: false
  		},
		actions: {
			deleteChoice: this.#deleteChoiceItem,
			itemUseAbility: this.#onUseAbility,
			castNpcSpell: this.#onCastSpell,
		},
  	}

	/** @inheritdoc */
	static TABS = {
		sheet: {
    		tabs: []
		}
	}

	/** @inheritdoc */
	static PARTS = {
		tabs: { template: 'systems/shadowdark/templates/actors/npc.hbs' },
		abilities: { template: "systems/shadowdark/templates/actors/npc/abilities.hbs" },
		spells: { template: "systems/shadowdark/templates/actors/npc/spells.hbs" },
		description: { template: "systems/shadowdark/templates/actors/npc/description.hbs" },
		effects: { template: "systems/shadowdark/templates/actors/_partials/effects.hbs" },
	}

	/** @inheritdoc */
	_getTabsConfig(group) {
		const tabs = foundry.utils.deepClone(super._getTabsConfig(group));

		tabs.tabs.push({ id: 'abilities', group: 'sheet', label: 'SHADOWDARK.sheet.npc.tab.abilities', cssClass: "navigation-tab active" });
		if (game.settings.get("shadowdark", "use_coreSpellcasting"))
			tabs.tabs.push({ id: 'spells', group: 'sheet', label: 'SHADOWDARK.sheet.npc.tab.spells', cssClass: "navigation-tab" });
		tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.npc.tab.description', cssClass: "navigation-tab" });
		tabs.tabs.push({ id: 'effects', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.effects', cssClass: "navigation-tab" });
		tabs.initial = 'abilities';
		return tabs;
	}
	
	// static PARTS = {
	// 	form: { template: "systems/shadowdark/templates/actors/npc.hbs" }
	// }

	async _onRollItem(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.items.get(itemId);

		if (item.type === "NPC Attack" && item.system.attackType === "special") {
			return;
		}

		const data = {
			item: item,
			actor: this.actor,
		};

		// Summarize the bonuses for the attack roll
		const parts = [game.settings.get("shadowdark", "use2d10") ? "2d10" : "1d20", "@attackBonus"];
		data.attackBonus = item.system.bonuses.attackBonus;

		data.damageParts = ["@damageBonus"];
		data.damageBonus = item.system.bonuses.damageBonus;

		return item.rollNpcAttack(parts, data);
	}

	/** @inheritdoc */
	changeTab(tab, group, options) {
		for (const tabKey of Object.keys(this.tabs))
		{
		 	if (this.tabs[tabKey].id === tab)
		 		this.tabs[tabKey].cssClass = "navigation-tab active"
			else
				this.tabs[tabKey].cssClass = "navigation-tab"
		}
		
		this.render(true);
	}

	/** @override */
	async _preparePartContext(partId, context, options) {

		context.showSpells = game.settings.get("shadowdark", "use_coreSpellcasting");
		context.showSeirizianMagic = game.settings.get("shadowdark", "use_seiriziaSpellcasting");
		context.showBritannianMagic = game.settings.get("shadowdark", "use_britannianRuneMagic");

		switch (partId)
		{
			case "tabs":
				if (!this.tabs)
				{
					const tabsArray = this._getTabsConfig('sheet').tabs;
					this.tabs = tabsArray.reduce((acc, tab) => {
						acc[tab.id] = tab;
						return acc;
					}, {});
				}
				context.tabs = this.tabs;
				break;
			case 'abilities':
				if (context.showBritannianMagic)
				{
					context.characterRunes = [];
					context.availableRunes = [];
					if (!this.actor.system.characterRunes) this.actor.system.characterRunes = [];

					for (let britannianRune of BritannianMagicSD.runes)
					{
						if (this.actor.system.characterRunes.some(r => r === britannianRune.uuid))
							context.characterRunes.push(britannianRune);
						else
							context.availableRunes.push(britannianRune);
					}

					context.characterRunesChoicesKey = 'characterRunes';
				}
				break;
		}

		const portrait = PIXI.Texture.from(this.actor.img);
		const { width, height } = portrait.baseTexture;
		const imageAspect = width / height;
		context.imgHeight = 110;
		context.imgWidth = 110 * imageAspect;

		// Ability Scores
		for (const [key, ability] of Object.entries(context.system.abilities)) {
			const labelKey = `SHADOWDARK.ability_${key}`;
			ability.label = `${game.i18n.localize(labelKey)}`;
		}
		
		await this._prepareItems(context);

		return context;
	}

	async _prepareItems(context) {
		const attacks = [];
		const specials = [];
		const spells = [];
		const features = [];

		const effects = {
			effect: {
				label: game.i18n.localize("SHADOWDARK.item.effect.category.effect"),
				items: [],
			},
			condition: {
				label: game.i18n.localize("SHADOWDARK.item.effect.category.condition"),
				items: [],
			},
		};

		for (const i of this._sortAllItems(context)) {
			// Push Attacks
			if (i.type === "NPC Attack") {
				const display = await this.actor.buildNpcAttackDisplays(i._id);
				attacks.push({itemId: i._id, display});
			}

			// Push Specials
			else if (i.type === "NPC Special Attack") {
				const display = await this.actor.buildNpcSpecialDisplays(i._id);
				specials.push({itemId: i._id, display});
			}

			// Push Features
			else if (i.type === "NPC Feature") {
				const description = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
					jQuery(i.system.description).text(),
					{
						async: true,
					}
				);

				features.push({
					itemId: i._id,
					name: i.name,
					description,
				});
			}

			// Push Spells
			else if (i.type === "NPC Spell") {
				i.description = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
					jQuery(i.system.description).text(),
					{
						async: true,
					}
				);
				spells.push(i);
			}

			// Push Effects
			else if (i.type === "Effect") {
				const category = i.system.category;
				effects[category].items.push(i);
			}
		}

		context.attacks = attacks;
		context.specials = specials;
		context.spells = spells;
		context.features = features;
		context.effects = effects;
	}

	static async #onSubmit(event, form, formData) {
		if (UtilitySD.isNestedPropertyArray(this.actor, event.target.name))
		{
			let uuid = UtilitySD.getSelectedUuid(form, event.target);

			if (uuid)
			{
				UtilitySD.setNestedProperty(this.actor, event.target.name, uuid);
				await this.actor.update({[event.target.name]: UtilitySD.getNestedProperty(this.actor, event.target.name)});
			}
		}
		else if (event.target?.name === 'predefinedEffects')
			shadowdark.effects.fromPreDefined(this.actor, event.target.value);
		else if (event.target.type === 'checkbox')
			this.actor.update({[event.target.name]: event.target.checked});
		else if (event.target.type === 'number')
			this.actor.update({[event.target.name]: parseInt(event.target.value)});
		else
			this.actor.update({[event.target.name]: event.target.value});
	}

	async _onRender(context, options) {
		const proseMirror = this.element.querySelector('prose-mirror.editor.prosemirror');
		const proseMirrorContent = this.element.querySelector('prose-mirror.editor.prosemirror > div.editor-content');
		if (proseMirrorContent != null)
		{
			const fieldName = proseMirror.getAttribute("name");
			proseMirrorContent.addEventListener("focusout", (event) => {
				this._onSetDescription(event, fieldName);
			});
		}
	}

	async _onSetDescription(event, fieldName) {
		const newDesc = event.currentTarget.innerHTML;
		UtilitySD.setNestedProperty(this.actor, fieldName, newDesc);
		await this.actor.update({fieldName: newDesc});
	}

	static async #onUseAbility(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		this.actor.useAbility(itemId);
	}

	static async #onCastSpell(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;

		if (event.shiftKey) {
			this.actor.castNPCSpell(itemId, {...{ isFocusRoll: true }, fastForward: true});
		}
		else {
			this.actor.castNPCSpell(itemId, { isFocusRoll: true });
		}
	}

	async _onDropItem(event, data) {
		// get uuid of dropped item
		const droppedItem = await fromUuid(data.uuid);

		// if it's an PC spell, convert to NPC spell, else return as normal
		if (droppedItem.type === "Spell") {
			const newNpcSpell = {
				name: droppedItem.name,
				type: "NPC Spell",
				system: {
					description: droppedItem.system.description,
					duration: {
						type: droppedItem.system.duration.type,
						value: droppedItem.system.duration.value,
					},
					range: droppedItem.system.range,
					dc: droppedItem.system.tier + 10,
				},
			};
			// add new spell to NPC
			this.actor.createEmbeddedDocuments("Item", [newNpcSpell]);
		}
		else {
			super._onDropItem(event, data);
		}
	}

	/** @inheritdoc */
	async _onChangeInput(event) {

		const choicesKey = $(event.currentTarget).data("choices-key");
		const isItem = $(event.currentTarget).data("is-item") === "true";
		if (event.target.list && choicesKey) {
			await this._onChangeChoiceList(event, choicesKey, isItem);
			return;
		}

		await super._onChangeInput(event);
	}

	async _onChangeChoiceList(event, choicesKey, isItem) {
		shadowdark.debug(`NpcSheetSD _onChangeChoiceList`);
		const options = event.target.list.options;
		const value = event.target.value;

		event.preventDefault();
		event.stopPropagation();

		let uuid = null;
		for (const option of options) {
			if (option.value === value) {
				uuid = option.getAttribute("data-uuid");
				break;
			}
		}

		if (uuid === null) return;

		shadowdark.debug(`NpcSheetSD _onChangeChoiceList choicesKey=${choicesKey}`);

		// handles cases where choicesKey is nested property.
		let currentChoices = choicesKey
			.split(".")
			.reduce((obj, path) => obj ? obj[path]: [], this.actor.system);

		shadowdark.debug(`NpcSheetSD _onChangeChoiceList currentChoices=${currentChoices}`);

		if (currentChoices.includes(uuid)) return; // No duplicates

		currentChoices.push(uuid);

		const choiceItems = [];
		for (const itemUuid of currentChoices) {
			if (isItem) {
				choiceItems.push(await fromUuid(itemUuid));
			}
			else {
				choiceItems.push(itemUuid);
			}
		}

		if (isItem) {
			choiceItems.sort((a, b) => a.name.localeCompare(b.name));
		}
		else {
			choiceItems.sort((a, b) => a.localeCompare(b));
		}

		const sortedChoiceUuids = isItem
			? choiceItems.map(item => item.uuid)
			: choiceItems;

		return this.actor.update({['system.'+choicesKey]: sortedChoiceUuids});
	}

	/**
	 * Deletes an Item/Skill choice from this item, using the data stored
	 * on the target element
	 *
	 * @param {event} Event The triggered event
	 */
	static async #deleteChoiceItem(event, target) {
		if (!this.isEditable) return;

		event.preventDefault();
		event.stopPropagation();

		const deleteUuid = target.dataset.uuid;
		const choicesKey = target.dataset.choicesKey;

		// handles cases where choicesKey is nested property.
		const currentChoices = choicesKey
			.split(".")
			.reduce((obj, path) => obj ? obj[path]: [], this.actor.system);

		const newChoices = [];
		for (const itemUuid of currentChoices) {
			if (itemUuid === deleteUuid) continue;
			newChoices.push(itemUuid);
		}

		const dataKey = `system.${choicesKey}`;
		await this.actor.update({[dataKey]: newChoices});
	}
}
