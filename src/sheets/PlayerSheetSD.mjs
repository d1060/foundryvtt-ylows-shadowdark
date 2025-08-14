import ActorSheetSD from "./ActorSheetSD.mjs";
import NanoMagicSD from "./magic/NanoMagicSD.mjs";
import AuraMagicSD from "./magic/AuraMagicSD.mjs";
import MetalMagicSD from "./magic/MetalMagicSD.mjs";
import MistMagicSD from "./magic/MistMagicSD.mjs";
import AbyssalMagicSD from "./magic/AbyssalMagicSD.mjs";
import BritannianMagicSD from "./magic/BritannianMagicSD.mjs";
import UtilitySD from "../utils/UtilitySD.mjs";

export default class PlayerSheetSD extends ActorSheetSD {

	constructor(object) {
		super(object);

		this.editingHp = false;
		this.editingStats = false;
		this.gemBag = new shadowdark.apps.GemBagSD({actor: this.actor});
	}

	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["shadowdark", "sheet", "player", 'themed', 'theme-light'],
		scrollY: ["section.SD-content-body"],
		position: {
    		width: 706,
    		height: 680
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
			abilityDecrement: this.#onAbilityUsesDecrement,
			abilityIncrement: this.#onAbilityUsesIncrement,
			castSpell: this.#onCastSpell,
			createBoon: this.#onCreateBoon,
			createItem: this.#onCreateItem,
			createTreasure: this.#onCreateTreasure,
			itemDecrement: this.#onItemQuantityDecrement,
			itemIncrement: this.#onItemQuantityIncrement,
			learnSpell: this.#onLearnSpell,
			levelUp: this.#onlevelUp,
			openSpellbook: this.#onOpenSpellBook,
			openGemBag: this.#onOpenGemBag,
			sellTreasure: this.#onSellTreasure,
			sellItem: this.#onSellItem,
			toggleEditHp: this.#onToggleEditHp,
			toggleEditStats: this.#onToggleEditStats,
			toggleEquipped: this.#onToggleEquipped,
			toggleLight: this.#onToggleLightSource,
			toggleStashed: this.#onToggleStashed,
			useAbility: this.#onUseAbility,
			usePotion: this.#onUsePotion,
			rechargeMagicItem: this.#onRechargeMagicItem,
			spendMagicalCharge: this.#onSpendMagicCharge,
			focusSpell: this.#onFocusSpell,
			abyssalPowerRoll: this.#onAbyssalPowerRoll,
			mistPowerRoll: this.#onMistPowerRoll,
			itemChatClick: this.#onItemChatClick,

			nanoProgramRoll: this.#onRollNanoMagic,
			resetCoreDump: this.#onResetCoreDump,
			optimizeProgram: this.#onOptimizeProgram,
			productionReady: this.#onProductionReadyProgram,
			createProgram: this.#onCreateNanoProgram,
			editProgram: this.#onEditNanoProgram,
			deleteProgram: this.#onDeleteNanoProgram,
			cancelProgram: this.#onCancelNanoProgram,
			resetProgram: this.#onResetNanoProgram,
			auraEffectRoll: this.#onRollAuraMagic,
			resetAuralCore: this.#onResetAuralCore,
			redundantPatternways: this.#onRedundantPatternways,
			selectMetalPower: this.#onSelectMetalPower,
			removeMetalPower: this.#onRemoveMetalPower,
			increaseMetalPowerAmount: this.#onIncreaseMetalPower,
			decreaseMetalPowerAmount: this.#onDecreaseMetalPower,
			pickMetalAltToken: this.#onPickMetalAltToken,
			manifestMetalCore: this.#onManifestMetalCore,
			mistUpdateCorruption: this.#onChangeMistCorruption,
			selectAbyssalPower: this.#onSelectAbyssalPower,
			removeAbyssalPower: this.#onRemoveAbyssalPower,
			recoverAbyssalPower: this.#onRecoverAbyssalPower,
			clearAbyssalPowers: this.#onClearAbyssalPowers,

			learnRune: this.#onLearnRune,
			selectRune: this.#onSelectRune,
			increaseRune: this.#onIncreaseRune,
			britannianSpellbookLeftFlip: this.#onFlipSpellBookLeft,
			britannianSpellbookRightFlip: this.#onFlipSpellBookRight,
			castBritannianMagic: this.#onCastBritannianMagic,
			writeBritannianMagic: this.#onWriteBritannianMagic,
			castBritannianSpell: this.#onCastBritannianSpell,
			castWrittenSpell: this.#onCastWrittenSpell,
			editWrittenSpell: this.#onEditWrittenSpell,
			eraseWrittenSpell: this.#onEraseWrittenSpell,
			recoverRune: this.#onRecoverRune,
			recoverWrittenSpell: this.#onRecoverWrittenSpell,
			cancelActiveBritannianSpell: this.#onCancelActiveBritannianSpell
		},
  	}

	/** @inheritdoc */
	static TABS = {
		sheet: {
    		tabs: {
				details : { id: 'details', group: 'sheet', label: 'SHADOWDARK.sheet.player.tab.details', cssClass: "navigation-tab" },
				abilities : { id: 'abilities', group: 'sheet', label: 'SHADOWDARK.sheet.player.tab.abilities', cssClass: "navigation-tab active" },
				spells : { id: 'spells', group: 'sheet', label: 'SHADOWDARK.sheet.player.tab.spells', cssClass: "navigation-tab" },
				inventory : { id: 'inventory', group: 'sheet', label: 'SHADOWDARK.sheet.player.tab.inventory', cssClass: "navigation-tab" },
				talents : { id: 'talents', group: 'sheet', label: 'SHADOWDARK.sheet.player.tab.talents', cssClass: "navigation-tab" },
				notes : { id: 'notes', group: 'sheet', label: 'SHADOWDARK.sheet.player.tab.notes', cssClass: "navigation-tab" },
				effects : { id: 'effects', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.effects', cssClass: "navigation-tab" },
			},
			initial: 'abilities'
		}
	}

	/** @inheritdoc */
	static PARTS = {
		tabs: { template: 'systems/shadowdark/templates/actors/player.hbs' },
		details: { template: "systems/shadowdark/templates/actors/player/details.hbs" },
		abilities: { template: "systems/shadowdark/templates/actors/player/abilities.hbs" },
		spells: { template: "systems/shadowdark/templates/actors/player/spells.hbs" },
		inventory: { template: "systems/shadowdark/templates/actors/player/talents.hbs" },
		talents: { template: "systems/shadowdark/templates/actors/player/inventory.hbs" },
		notes: { template: "systems/shadowdark/templates/actors/player/notes.hbs" },
		effects: { template: "systems/shadowdark/templates/actors/_partials/effects.hbs" },
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

	async getBackgroundSelectors() {
		const system = this.actor.system;

		const data = {
			ancestry: {
				name: "ancestry",
				label: game.i18n.localize("TYPES.Item.Ancestry"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.ancestry.tooltip"),
				item: await fromUuid(system.ancestry) ?? null,
			},
			background: {
				name: "background",
				label: game.i18n.localize("TYPES.Item.Background"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.background.tooltip"),
				item: await fromUuid(system.background) ?? null,
			},
			class: {
				name: "class",
				label: game.i18n.localize("TYPES.Item.Class"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.class.tooltip"),
				item: await fromUuid(system.class) ?? null,
			},
			deity: {
				name: "deity",
				label: game.i18n.localize("TYPES.Item.Deity"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.deity.tooltip"),
				item: await fromUuid(system.deity) ?? null,
			},
			patron: {
				name: "patron",
				label: game.i18n.localize("TYPES.Item.Patron"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.patron.tooltip"),
				item: await fromUuid(system.patron) ?? null,
			},
		};

		return data;
	}

	async _onFirstRender(context, options) {
		if (game.settings.get("shadowdark", "use_britannianRuneMagic"))
		{
			options.position.width = 794;
			options.position.height = 712;
		}

		super._onFirstRender(context, options);
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		await AbyssalMagicSD.addEventListeners(this);
		await BritannianMagicSD.addEventListeners(this);

		if (this.actor.system.showLevelUp) {
			this.actor.update({"system.showLevelUp": false});
			new shadowdark.apps.LevelUpSD(this.actor.id).render(true);
		}

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

	/** @override */
	async _preparePartContext(partId, context, options) {

		switch (partId)
		{
			case "tabs":
				if (!this.tabs)
					this.tabs = structuredClone(PlayerSheetSD.TABS.sheet.tabs);
				context.tabs = this.tabs;
				const portrait = PIXI.Texture.from(this.actor.img);
				const { width, height } = portrait.baseTexture;
				const imageAspect = width / height;
				context.imgHeight = 110;
				context.imgWidth = 110 * imageAspect;
				break;
			case "details":
				context.showBritannianMagic = game.settings.get("shadowdark", "use_britannianRuneMagic");
				context.xpNextLevel = context.system.level.value * 10;
				context.levelUp = (context.system.level.xp >= context.xpNextLevel);
				context.knownLanguages = await this.actor.languageItems();
				context.backgroundSelectors = await this.getBackgroundSelectors();
				context.characterClass = await this.actor.getClass();
				context.classHasPatron = context.characterClass?.system?.patron?.required ?? false;
				context.classTitle = await this.actor.getTitle();
				context.characterPatron = await this.actor.getPatron();
				break;
			case "abilities":
				[context.system.attributes.ac.value, context.system.attributes.ac.tooltip] = await this.actor.getArmorClass();
				context.hasTempHP = this.actor.system.attributes.hp.temp && this.actor.system.attributes.hp.temp > 0;
				context.actor.system.attributes.hp.temp = this.actor.system.attributes.hp.temp;
				context.maxHp = this.actor.system.attributes.hp.base
					+ this.actor.system.attributes.hp.bonus;
				context.abilities = this.actor.getCalculatedAbilities();
				this.actor.system.move = await this.actor.getCalculatedMove();
				context.move = this.actor.system.move;

				context.abilitiesOverrides = Object.keys(
					foundry.utils.flattenObject(
						this.actor.overrides?.system?.abilities || {}
					)
				);

				context.attributeOverrides = Object.keys(
					foundry.utils.flattenObject(
						this.actor.overrides?.system?.attributes || {}
					)
				);
				
				context.editingHp = this.editingHp;
				context.editingStats = this.editingStats;
				break;
			case "spells":
				context.isSpellCaster = await this.actor.isSpellCaster();
				context.canUseMagicItems = await this.actor.canUseMagicItems();
				if (!game.settings.get("shadowdark", "use_coreSpellcasting"))
				{
					context.isSpellCaster = false;
					context.canUseMagicItems = false;
				}
				context.showSpellsTab = context.isSpellCaster || context.canUseMagicItems;
				context.showSeirizianMagic = game.settings.get("shadowdark", "use_seiriziaSpellcasting");
				context.showBritannianMagic = game.settings.get("shadowdark", "use_britannianRuneMagic");
				if (context.showBritannianMagic)
					await BritannianMagicSD.prepareBritannianMagic(context, this.actor);

				//Checks which magic type to show.
				await this._prepareMagic(context);
				await NanoMagicSD._prepareNanoMagic(this.actor, context);
				await AuraMagicSD._prepareAuraMagic(this.actor, context);
				await MetalMagicSD._prepareMetalMagic(this.actor, context);
				await AbyssalMagicSD._prepareAbyssalMagic(this.actor, context);
				await MistMagicSD._prepareMistMagic(this.actor, context);
				break;
			case "inventory":
				context.gearSlots = this.actor.numGearSlots();
				this.gemBag.render(false);
				break;
			case "talents":
				break;
			case "notes":
				break;
			case "effects":
				context.showBritannianMagic = game.settings.get("shadowdark", "use_britannianRuneMagic");
				if (context.showBritannianMagic)
					await BritannianMagicSD.prepareBritannianMagicActiveSpells(context, this.actor);
				break;
		}

		// Get the inventory ready
		await this._prepareItems(context);

		context.usePulpMode = game.settings.get("shadowdark", "usePulpMode");

		return context;
	}

	async _prepareMagic(context) {
		context.showNanoMagic = false;
		context.showAuraMagic = false;
		context.showMetalMagic = false;
		context.showAbyssalMagic = false;
		context.showMistMagic = false;

		if (!this.actor.system.magic)
		{
			this.actor.system.magic = {
					type: "",
					nanoMagicTalents: [],
					auraMagicTalents: [],
					metalMagicTalents: [],
					nanoMagicPrograms: [],
					nanoPoints: {
						value: 0,
						base: 0,
					},
					auraMagicEffects: [],
					metalMagicPowers: [],
					unknownMetalMagicPowers: [],
			};
			this.actor.update({"system.magic": {
					type: "",
					nanoMagicTalents: [],
					auraMagicTalents: [],
					metalMagicTalents: [],
					nanoMagicPrograms: [],
					nanoPoints: {
						value: 0,
						base: 0,
					auraMagicEffects: [],
					metalMagicPowers: [],
					unknownMetalMagicPofwers: [],
			}}});
		}

		context.magicCoreLevel = await this.actor.magicCoreLevel(this.actor?.system?.magic?.type);
	}
	
	async _onDropBackgroundItem(item) {
		switch (item.type) {
			case "Ancestry":
				return this.actor.addAncestry(item);
			case "Background":
				return this.actor.addBackground(item);
			case "Class":
				return this.actor.addClass(item);
			case "Deity":
				return this.actor.addDeity(item);
			case "Language":
				return this.actor.addLanguage(item);
			case "Patron":
				return this.actor.addPatron(item);
		}
	}

	/** @override */
	async _onDropItem(event, data) {
		switch ( data.documentName ) {
			case "Item":
				return this._onDropItemSD(event, data);
		}
		super._onDropItem(event, data);
	}

	/**
	 * Checks if the dropped item should be handled in a special way
	 * @param {Event} event - The triggering event
	 * @param {object} data - Contains the type of dropped item, and the uuid
	 * @returns {Promise<any>}
	 */
	async _onDropItemSD(event, data) {
		var item = data;
		if (data.uuid)
		{
			let uuidItem = await fromUuid(data.uuid);
			if (uuidItem) item = uuidItem;
		}
		else if (data.system.fromLoot?.uuid)
		{
			let uuidItem = await fromUuid(data.system.fromLoot?.uuid);
			if (uuidItem) item = uuidItem;
		}

		if (item.type === "Spell") return this._createItemFromSpellDialog(item);

		if (await this._effectDropNotAllowed(data)) return false;

		// Background items are handled differently currently
		const backgroundItems = [
			"Ancestry",
			"Background",
			"Class",
			"Deity",
			"Language",
			"Patron",
		];

		if (backgroundItems.includes(item.type)) {
			return this._onDropBackgroundItem(item);
		}

		// Items with Effects may need some user input
		if (!item.isPotion() && item.effects.toObject().length > 0) {
			
			var alreadyHasAtempHPeffect = this.actor.items.some(i => i.effects.some(e => e.changes.some(c => c.key === "system.bonuses.tempHP")));
			if (alreadyHasAtempHPeffect) {
				if (await this.actor.applyTempHp(item)) {
					this.render();
					return;
				}
			}

			// add item to actor
			item = await fromUuid(data.uuid);
			item.schema.name = item.documentName + '.schema';
			let itemObj = await shadowdark.effects.createItemWithEffect(item, this.actor);
			if (itemObj)
			{
				itemObj.system.level = this.actor?.system?.level?.value;

				//await super._onDropItem(event, item);
				await this.actor.createEmbeddedDocuments(item.documentName, [itemObj]);
				const newItem = this.actor.getEmbeddedDocument(item.documentName, item.id);

				if (itemObj.effects.some(e => e.changes.some(c => c.key === "system.light.template"))) {
					this._toggleLightSource(newItem);
				}

				await this.actor.applyTempHp(item);
				await this.actor.applyBonusHp(item);
			}
			game.shadowdark.effectPanel.refresh();
			this.render(true);
			return;
		}

		// Activate light spell if dropped onto the sheet
		if (CONFIG.SHADOWDARK.LIGHT_SOURCE_ITEM_IDS.includes(item.id)) {
			return this._dropActivateLightSource(item);
		}

		// is a light base item being dropped from a different actor?
		if (item.isLight() && item.actor && (item.actor._id !== this.actor._id)) {
			const isActiveLight = item.isActiveLight();

			if (isActiveLight) {
				// We're transferring an active light to this sheet, so turn off
				// any existing light sources
				const newActorLightSources = await this.actor.getActiveLightSources();
				for (const activeLight of newActorLightSources) {
					await this._toggleLightSource(activeLight);
				}
			}

			// Now create a copy of the item on the target
			const [newItem] = await super._onDropItem(event, data);

			if (isActiveLight) {
				// Turn the original light off before it gets deleted, and
				// make sure the new one is turned on
				item.actor.turnLightOff();
				newItem.actor.turnLightOn(newItem._id);
			}
			// Now we can delete the original item
			await item.actor.deleteEmbeddedDocuments(
				"Item",
				[item._id]
			);
		}
		else {
			var newItems = await super._onDropItem(event, item);
			if (newItems.length > 0 && data.system.fromLoot.description)
				await this._updateLootItem(newItems[0], data);
		}
	}

	async _updateLootItem(item, data) {
		item.name = data.name;
		item.update({"name": data.name});
		if (data.system.fromLoot.description)
		{
			item.system.description += data.system.fromLoot.description;
			item.update({"system.description": item.system.description});
		}
		if (data.system.fromLoot.magic_charges && data.system.fromLoot.magic_charges > 0)
		{
			item.system.max_magic_charges = data.system.fromLoot.magic_charges;
			item.update({"system.max_magic_charges": item.system.max_magic_charges});
		}
		if (data.system.fromLoot.properties)
		{ 
			if (data.type === "Weapon" || data.type === "Armor")
			{
				for (let property of data.system.fromLoot.properties)
				{
					await item.addProperty(property.uuid);
				}
			}
			else
			{
				for (let property of data.system.fromLoot.properties)
				{
					const effectData = [
						{
							name: property.name,
							label: property.name,
							img: property.img,
							changes: [],
							disabled: false,
							origin: item.uuid,
							transfer: true,
							description: property.description
						},
					];

					const [newActiveEffect] = await item.createEmbeddedDocuments(
						"ActiveEffect",
						effectData
					);
				}
			}
		}
	}

	/**
	 * Actives a lightsource if dropped onto the Player sheet. Used for
	 * activating Light spell et.c.
	 *
	 * @param {Item} item - Item that is a lightsource
	 */
	async _dropActivateLightSource(item) {
		const actorItem = await super._onDropItemCreate(item);
		this._toggleLightSource(actorItem[0]);
	}

	/**
	 * Creates a scroll from a spell item
	 */
	async _createItemFromSpellDialog(item) {
		const content = await foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/create-item-from-spell.hbs",
			{
				spellName: item.name,
				isGM: game.user.isGM,
			}
		);

		const buttons = {
			potion: {
				icon: '<i class="fas fa-prescription-bottle"></i>',
				label: game.i18n.localize("SHADOWDARK.item.potion.label"),
				callback: () => this._createItemFromSpell(item, "Potion"),
			},
			scroll: {
				icon: '<i class="fas fa-scroll"></i>',
				label: game.i18n.localize("SHADOWDARK.item.scroll.label"),
				callback: () => this._createItemFromSpell(item, "Scroll"),
			},
			spell: {
				icon: '<i class="fa-solid fa-hand-sparkles"></i>',
				label: game.i18n.localize("SHADOWDARK.item.spell.label"),
				callback: () => this._createItemFromSpell(item, "Spell"),
			},
			wand: {
				icon: '<i class="fa-solid fa-wand-magic-sparkles"></i>',
				label: game.i18n.localize("SHADOWDARK.item.wand.label"),
				callback: () => this._createItemFromSpell(item, "Wand"),
			},
		};

		return Dialog.wait({
			title: game.i18n.format("SHADOWDARK.dialog.item.create_from_spell", { spellName: item.name }),
			content,
			buttons,
			close: () => false,
			default: "scroll",
		});
	}

	async _createItemFromSpell(spell, type) {
		const itemData = await shadowdark.utils.createItemFromSpell(type, spell);

		super._onDropItemCreate(itemData);
	}

	static async #onSubmit(event, form, formData) {
		const match = event.target?.name?.match(/system\.abilities\.(.*?)\.total/);
		if (match)
		{
			let abilityId = match[1];
			let targetName = event.target.name;
			let targetBase = targetName.replace(".total", ".base");
			let baseValue = this.actor.system.abilities[abilityId].base;
			let originalValue = this.actor.system.abilities[abilityId].base + this.actor.system.abilities[abilityId].bonus;
			let newValue = parseInt(event.target.value);
			let valueDiff = newValue - originalValue;
			let newBaseValue = baseValue + valueDiff;
			await this.actor.update({[targetBase]: newBaseValue});
		}
		else if (event.target?.name === "system.attributes.hp.max")
		{
			let hpBase = this.actor.system.attributes.hp.base;
			let hpBonus = this.actor.system.attributes.hp.bonus;
			let currentHpMax = hpBase + hpBonus;
			let newHpMax = parseInt(event.target.value);
			let hpMaxDiff = newHpMax - currentHpMax;
			let newHpBase = hpBase + hpMaxDiff;

			await this.actor.update({
				"system.attributes.hp.max": newHpMax,
				"system.attributes.hp.base": newHpBase,
			});
		}
		else if (event.target?.name === 'predefinedEffects')
			shadowdark.effects.fromPreDefined(this.actor, event.target.value);
		else if (event.target?.name === "system.attributes.hp.value")
		{
			var newHpValue = this.actor.updateHP(event.target.value);

			await this.actor.update({
				"system.attributes.hp.value": newHpValue,
				"system.attributes.hp.temp": this.actor.system.attributes.hp.temp,
			});
		}
		else if (event.target.type === 'checkbox')
			await this.actor.update({[event.target.name]: event.target.checked});
		else if (event.target.type === 'number')
		{
			await this.actor.update({[event.target.name]: parseInt(event.target.value)});
			if (event.target.name.includes(".magic."))
				this.render(true);
		}
		else
			await this.actor.update({[event.target.name]: event.target.value});
	}

	static async #onAbilityUsesDecrement(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.uses.available > 0) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": itemId,
					"system.uses.available": item.system.uses.available - 1,
				},
			]);
		}
	}

	static async #onAbilityUsesIncrement(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.uses.available < item.system.uses.max) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": itemId,
					"system.uses.available": item.system.uses.available + 1,
				},
			]);
		}
	}
	
	static async #onCreateBoon(event, target) {
		new Dialog( {
			title: game.i18n.localize("SHADOWDARK.dialog.create_custom_item"),
			content: await foundry.applications.handlebars.renderTemplate(
				"systems/shadowdark/templates/dialog/create-new-boon.hbs",
				{
					boonTypes: CONFIG.SHADOWDARK.BOON_TYPES,
					default: "blessing",
					level: this.actor?.system?.level?.value ?? 0,
				}
			),
			buttons: {
				create: {
					label: game.i18n.localize("SHADOWDARK.dialog.create"),
					callback: async html => {
						// create boon from dialog data
						const itemData = {
							name: html.find("#item-name").val(),
							type: "Boon",
							system: {
								boonType: html.find("#item-boonType").val(),
								level: Number(html.find("#item-boonLevel").val()),
							},
						};
						const [newItem] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
						newItem.sheet.render(true);
					},
				},
			},
			default: "create",
		}).render(true);
	}

	static async #onCreateItem(event, target) {
		new Dialog( {
			title: game.i18n.localize("SHADOWDARK.dialog.create_custom_item"),
			content: await foundry.applications.handlebars.renderTemplate("systems/shadowdark/templates/dialog/create-new-item.hbs"),
			buttons: {
				create: {
					label: game.i18n.localize("SHADOWDARK.dialog.create"),
					callback: async html => {
						// create item from dialog data
						const itemData = {
							name: html.find("#item-name").val(),
							type: html.find("#item-type").val(),
							system: {},
						};
						const [newItem] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
						newItem.sheet.render(true);
					},
				},
			},
			default: "create",
		}).render(true);
	}

	static async #onCreateTreasure(event, target) {
		new Dialog( {
			title: game.i18n.localize("SHADOWDARK.dialog.create_treasure"),
			content: await foundry.applications.handlebars.renderTemplate("systems/shadowdark/templates/dialog/create-new-treasure.hbs"),
			buttons: {
				create: {
					label: game.i18n.localize("SHADOWDARK.dialog.create"),
					callback: async html => {
						// create treasure from dialog data
						const itemData = {
							name: html.find("#item-name").val(),
							type: "Basic",
							system: {
								treasure: true,
								cost: {
									gp: parseInt(html.find("#item-gp").val()),
									sp: parseInt(html.find("#item-sp").val()),
									cp: parseInt(html.find("#item-cp").val()),
								},
							},
						};
						await this.actor.createEmbeddedDocuments("Item", [itemData]);
					},
				},
			},
			default: "create",
		}).render(true);
	}

	static async #onItemChatClick(event, target) {
		event.preventDefault();
		const itemId = event.target.parentElement.dataset.itemId;
		//const itemId = $(event.currentTarget.parentElement).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		item.displayCard();
	}

	static async #onItemQuantityDecrement(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.quantity > 0) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": itemId,
					"system.quantity": item.system.quantity - 1,
				},
			]);
		}
	}

	static async #onItemQuantityIncrement(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.quantity < item.system.slots.per_slot) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": itemId,
					"system.quantity": item.system.quantity + 1,
				},
			]);
		}
	}

	static async #onToggleEditHp(event, target) {
		this.editingHp = !this.editingHp;
		this.render();
	}

	static async #onToggleEditStats(event, target) {
		this.editingStats = !this.editingStats;
		this.render();
	}

	static async #onCastSpell(event, options) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		if (event.shiftKey) {
			this.actor.castSpell(itemId, {...{ isFocusRoll: true }, fastForward: true});
		}
		else {
			this.actor.castSpell(itemId, { isFocusRoll: true });
		}
	}

	static async #onLearnSpell(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;

		this.actor.learnSpell(itemId);
	}

	static async #onOpenSpellBook(event, target) {
		event.preventDefault();
		this.actor.openSpellBook();
	}

	static async #onlevelUp(event, target) {
		event.preventDefault();

		let actorClass = await this.actor.getClass();
		if (this.actor.system.level.value === 0 && actorClass.name.includes("Level 0")) {
			new shadowdark.apps.CharacterGeneratorSD(this.actor._id).render(true);
			this.close();
		}
		else {
			new shadowdark.apps.LevelUpSD(this.actor._id).render(true);
		}
	}

	static async #onOpenGemBag(event, target) {
		event.preventDefault();

		this.gemBag.render(true);
	}

	static async #onSellTreasure(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		const itemData = this.actor.getEmbeddedDocument("Item", itemId);

		foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/sell-item.hbs",
			{name: itemData?.name}
		).then(html => {
			new Dialog({
				title: game.i18n.localize("SHADOWDARK.dialog.item.confirm_sale"),
				content: html,
				buttons: {
					Yes: {
						icon: "<i class=\"fa fa-check\"></i>",
						label: game.i18n.localize("SHADOWDARK.dialog.general.yes"),
						callback: async () => {
							this.actor.sellItemById(itemId);
						},
					},
					Cancel: {
						icon: "<i class=\"fa fa-times\"></i>",
						label: game.i18n.localize("SHADOWDARK.dialog.general.cancel"),
					},
				},
				default: "Yes",
			}).render(true);
		});
	}

	static async #onSellItem(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		const itemData = this.actor.getEmbeddedDocument("Item", itemId);

		foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/sell-item.hbs",
			{name: itemData?.name}
		).then(html => {
			new Dialog({
				title: game.i18n.localize("SHADOWDARK.dialog.item.confirm_sale"),
				content: html,
				buttons: {
					Yes: {
						icon: "<i class=\"fa fa-check\"></i>",
						label: game.i18n.localize("SHADOWDARK.dialog.general.yes"),
						callback: async () => {
							this.actor.sellItemById(itemId);
						},
					},
					Cancel: {
						icon: "<i class=\"fa fa-times\"></i>",
						label: game.i18n.localize("SHADOWDARK.dialog.general.cancel"),
					},
				},
				default: "Yes",
			}).render(true);
		});
	}

	static async #onToggleEquipped(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);
		
		await this.actor.updateEmbeddedDocuments("Item", [
			{
				"_id": itemId,
				"system.equipped": !item.system.equipped,
				"system.stashed": false,
			},
		]);

		if (item.system.spellbook && item.system.equipped)
		{
			var embeddedCollection = await this.actor.getEmbeddedCollection("Item");
			var equippedItems = embeddedCollection.filter(i => i.system.equipped);
			for (let equippedItem of equippedItems)
			{
				if (equippedItem.uuid === item.uuid)
					continue;

				if (equippedItem.system.spellbook)
				{
					await this.actor.updateEmbeddedDocuments("Item", [
						{
							"_id": equippedItem.id,
							"system.equipped": !equippedItem.system.equipped,
							"system.stashed": false,
						},
					]);
				}
			}
		}
	}

	static async #onToggleStashed(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		await this.actor.updateEmbeddedDocuments("Item", [
			{
				"_id": itemId,
				"system.stashed": !item.system.stashed,
				"system.equipped": false,
			},
		]);
	}

	static async #onUseAbility(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		if (event.shiftKey) {
			this.actor.useAbility(itemId, {fastForward: true});
		}
		else {
			this.actor.useAbility(itemId);
		}
	}

	static async #onUsePotion(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		this.actor.usePotion(itemId);
	}

	async _sendDroppedItemToChat(active, item, options = {}) {
		const cardData = {
			name: item?.name,
			actor: this,
			item: item,
			picked_up: options.picked_up ?? false,
		};

		let template = options.template ?? "systems/shadowdark/templates/chat/item-drop.hbs";

		const content = await foundry.applications.handlebars.renderTemplate(template, cardData);

		await ChatMessage.create({
			content,
			speaker: options.speaker ?? ChatMessage.getSpeaker(),
			rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
		});
	}

	async _sendToggledLightSourceToChat(active, item, options = {}) {
		const cardData = {
			active: active,
			name: item?.name,
			timeRemaining: Math.floor(item.system.light.remainingSecs / 60),
			longevity: item.system.light.longevityMins,
			actor: this,
			item: item,
			picked_up: options.picked_up ?? false,
		};

		let template = options.template ?? "systems/shadowdark/templates/chat/lightsource-toggle.hbs";

		const content = await foundry.applications.handlebars.renderTemplate(template, cardData);

		await ChatMessage.create({
			content,
			speaker: options.speaker ?? ChatMessage.getSpeaker(),
			rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
		});
	}

	static async #onToggleLightSource(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		this._toggleLightSource(item);
	}

	async _toggleLightSource(item, options = {}) {
		const active = !item.system.light.active;

		if (active) {
			// Find any currently active lights and turn them off
			const activeLightSources = await this.actor.getActiveLightSources();
			for (const lightSource of activeLightSources) {
				this.actor.updateEmbeddedDocuments(
					"Item", [{
						"_id": lightSource.id,
						"system.light.active": false,
					}]
				);
			}
		}

		const dataUpdate = {
			"_id": item.id,
			"system.light.active": active,
		};

		if (!item.system.light.hasBeenUsed) {
			dataUpdate["system.light.hasBeenUsed"] = true;
		}

		const [updatedLight] = await this.actor.updateEmbeddedDocuments(
			"Item", [dataUpdate]
		);

		await this.actor.toggleLight(active, item.id);

		// We only update the Light Source Tracker if this Actor is currently
		// selected by a User as their character
		//
		if (this.actor.isClaimedByUser()) {
			this._sendToggledLightSourceToChat(active, item, options);
			game.shadowdark.lightSourceTracker.toggleLightSource(
				this.actor,
				updatedLight
			);
		}
	}

	async _prepareItems(context) {
		const gems = [];

		const boons = {};
		for (const [key, label] of Object.entries(CONFIG.SHADOWDARK.BOON_TYPES)) {
			boons[key] = {
				label,
				items: [],
			};
		}

		const inventory = {
			equipped: [],
			stashed: [],
			treasure: [],
			carried: [],
		};

		const spellitems = {
			wands: [],
			scrolls: [],
		};

		const spells = {};


		const talents = {
			ancestry: {
				label: game.i18n.localize("SHADOWDARK.talent.class.ancestry"),
				items: [],
			},
			class: {
				label: game.i18n.localize("SHADOWDARK.talent.class.class"),
				items: [],
			},
			level: {
				label: game.i18n.localize("SHADOWDARK.talent.class.level"),
				items: [],
			},
			technique: {
				label: game.i18n.localize("SHADOWDARK.talent.class.technique"),
				items: [],
			},
			nanoMagic: {
				label: game.i18n.localize("SHADOWDARK.talent.class.nanoMagic"),
				items: [],
			},
			auraMagic: {
				label: game.i18n.localize("SHADOWDARK.talent.class.auraMagic"),
				items: [],
			},
			metalMagic: {
				label: game.i18n.localize("SHADOWDARK.talent.class.metalMagic"),
				items: [],
			},
		};

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

		const attacks = {melee: [], ranged: [], special: []};

		const allClassAbilities = {};

		const slots = {
			total: 0,
			gear: 0,
			treasure: 0,
			coins: 0,
			gems: 0,
		};

		const freeCarrySeen = {};

		context.hasEquippedGearWithMagicalCharges = false;
		context.hasCarriedGearWithMagicalCharges = false;
		context.hasTreasureWithMagicalCharges = false;

		for (const i of this._sortAllItems(context)) {
			i.uuid = `Actor.${this.actor._id}.Item.${i._id}`;

			i.hasCharges = i.system.max_magic_charges && i.system.max_magic_charges > 0;

			if (i.system.isPhysical && i.type !== "Gem") {
				i.showQuantity =
					i.system.isAmmunition || i.system.slots.per_slot > 1
						? true
						: false;

				// We calculate how many slots are used by this item, taking
				// into account the quantity and any free items.
				//
				let freeCarry = i.system.slots.free_carry;

				if (Object.hasOwn(freeCarrySeen, i.name)) {
					freeCarry = Math.max(0, freeCarry - freeCarrySeen[i.name]);
					freeCarrySeen[i.name] += freeCarry;
				}
				else {
					freeCarrySeen[i.name] = freeCarry;
				}

				const perSlot = i.system.slots.per_slot;
				const quantity = i.system.quantity;
				var slotsUsed = i.system.slots.slots_used;

				if (i.type === "Armor" && i.system.equipped && this.actor.system.bonuses.armorConditioning && this.actor.system.bonuses.armorConditioning == i.name.slugify())
				{
					slotsUsed--;
					if (slotsUsed < 0)
						slotsUsed = 0;
				}

				if (i.type === "Armor" && this.actor.system?.magic?.manifestedMetalCore)
				{
					i.isArmorWhileManifestedMetalCore = true;
				}

				let totalSlotsUsed = Math.ceil(quantity / perSlot) * slotsUsed;
				totalSlotsUsed -= freeCarry * slotsUsed;

				i.slotsUsed = totalSlotsUsed;

				// calculate slot usage
				if (!i.system.stashed) {
					if (i.system.treasure) {
						slots.treasure += i.slotsUsed;
					}
					else {
						slots.gear += i.slotsUsed;
					}
				}

				// sort into groups
				if (i.system.equipped) {
					if (i.system.wearable && !i.system.canBeEquipped)
						i.system.canBeEquipped = true;
					inventory.equipped.push(i);
					if (i.hasCharges)
						context.hasEquippedGearWithMagicalCharges = true;
				}
				else if (i.system.stashed) {
					inventory.stashed.push(i);
				}
				else if (i.system.treasure) {
					inventory.treasure.push(i);
					if (i.hasCharges)
						context.hasTreasureWithMagicalCharges = true;
				}
				else {
					if (i.system.wearable && !i.system.canBeEquipped)
						i.system.canBeEquipped = true;
					inventory.carried.push(i);
					if (i.hasCharges)
						context.hasCarriedGearWithMagicalCharges = true;
				}

				if (i.type === "Basic" && i.system.light.isSource) {
					i.isLightSource = true;
					i.lightSourceActive = i.system.light.active;
					i.lightSourceUsed = i.system.light.hasBeenUsed;

					const timeRemaining = Math.ceil(
						i.system.light.remainingSecs / 60
					);

					const lightRemainingSetting = (game.user.isGM)? 2 : game.settings.get("shadowdark", "playerShowLightRemaining");

					if (lightRemainingSetting > 0) {
						// construct time remaing progress bar
						const maxSeconds = i.system.light.longevityMins * 60;
						i.lightSourceProgress = "◆";
						for (let x = 1; x < 4; x++) {
							if (i.system.light.remainingSecs > (maxSeconds * x / 4)) {
								i.lightSourceProgress = i.lightSourceProgress.concat(" ", "◆");
							}
							else {
								i.lightSourceProgress = i.lightSourceProgress.concat(" ", "◇");
							}
						}
					}

					if (lightRemainingSetting < 2) {
						i.lightSourceTimeRemaining = "";
					}
					else if (i.system.light.remainingSecs < 60) {
						i.lightSourceTimeRemaining = game.i18n.localize(
							"SHADOWDARK.inventory.item.light_seconds_remaining"
						);
					}
					else {
						i.lightSourceTimeRemaining = game.i18n.format(
							"SHADOWDARK.inventory.item.light_remaining",
							{ timeRemaining }
						);
					}
				}

				if (i.type === "Weapon" && i.system.equipped) {
					const weaponAttacks = await this.actor.buildWeaponDisplays(i._id);
					attacks.melee.push(...weaponAttacks.melee);
					attacks.ranged.push(...weaponAttacks.ranged);
				}

				if (i.type === "Wand" && !i.system.stashed) {
					spellitems.wands.push(i);
				}

				if (i.type === "Scroll" && !i.system.stashed) {
					spellitems.scrolls.push(i);
				}
			}
			else if (i.type === "Boon") {
				if (boons[i.system.boonType]) {
					boons[i.system.boonType].items.push(i);
				}
			}
			else if (i.type === "Gem") {
				gems.push(i);
			}
			else if (i.type === "Spell") {
				const spellTier = i.system.tier;
				spells[spellTier] ||= [];
				spells[spellTier].push(i);
			}
			else if (i.type === "Talent") {
				const talentClass = i.system.talentClass;
				const section = talentClass !== "patronBoon" ? talentClass : "level";
				talents[section]?.items.push(i);
			}
			else if (i.type === "Effect") {
				const category = i.system.category;
				effects[category].items.push(i);
			}
			else if (i.type === "Class Ability") {
				const group = i.system.group !== ""
					? i.system.group
					: game.i18n.localize("SHADOWDARK.sheet.abilities.ungrouped.label");

				if (Array.isArray(allClassAbilities[group])) {
					allClassAbilities[group].push(i);
				}
				else {
					allClassAbilities[group] = [i];
				}
			}
		}

		if (this.actor.system.penalties?.burning)
		{
			attacks.special.push({
				baseDamage: '',
				needsRoll: false,
				display: '<b style="font-size:16px">Douse Flames</b> take a moment to douse your flames.',
				removesEffectKey: 'system.penalties.burning'
			});
		}

		// Work out how many slots all these coins are taking up...
		const coins = this.actor.system.coins;
		const totalCoins = coins.gp + coins.sp + coins.cp;

		const freeCoins = shadowdark.defaults.FREE_COIN_CARRY;
		if (totalCoins > freeCoins) {
			slots.coins = Math.ceil((totalCoins - freeCoins) / freeCoins);
		}

		// Now do the same for gems...
		let totalGems = gems.length;
		if (totalGems > 0) {
			slots.gems = Math.ceil(totalGems / CONFIG.SHADOWDARK.DEFAULTS.GEMS_PER_SLOT);
		}

		// calculate total slots
		slots.total = slots.gear + slots.treasure + slots.coins + slots.gems;

		const classAbilities = [];

		const sortedGroups = Object.keys(allClassAbilities).sort((a, b) => a.localeCompare(b));
		for (const group of sortedGroups) {
			classAbilities.push({
				name: group,
				abilities: allClassAbilities[group],
			});
		}

		// Sort talents by level for display...
		talents.level.items = talents.level.items.sort(
			(a, b) => a.system.level - b.system.level
		);

		// Sorts inventory items by user defined order
		Object.keys(inventory).forEach(key => {
			inventory[key] = inventory[key].sort((a, b) => (a.sort || 0) - (b.sort || 0));
		  });

		context.classAbilities = classAbilities;
		context.hasClassAbilities = classAbilities.length > 0;

		context.attacks = attacks;
		context.boons = boons;
		context.totalCoins = totalCoins;
		context.gems = {items: gems, totalGems};
		context.inventory = inventory;
		context.spellitems = spellitems;
		context.slots = slots;
		context.spells = spells;
		context.talents = talents;
		context.effects = effects;
	}
	
 	async _updateObject(event, formData) {
		if (event.target) {
			if (event.target.name === "system.attributes.hp.value" && this.actor.system.bonuses.tempHP) {
				var newHpValue = this.actor.updateHP(event.target.value);
				
				formData["system.attributes.hp.value"] = newHpValue;
				formData["system.attributes.hp.temp"] = this.actor.system.attributes.hp.temp
				//this.editingHp = false;
			}
			
			// if HP MAX was change, turn off editing and set base hp value
			if (event.target.name === "system.attributes.hp.max") {
				this.editingHp = false;

				// Calculate new base hp value to pass to super
				const hpValues = this.object.system.attributes.hp;
				formData["system.attributes.hp.base"] =
				formData["system.attributes.hp.max"] - hpValues.bonus;
			}

			// if a stat was manually changed, also change base values, turn off editing
			if (event.target.name.match(/system\.abilities\.(\w*)\.total/)) {
				const abilityKey = event.target.name.match(/system\.abilities\.(\w*)\.total/);
				const base = `system.abilities.${abilityKey[1]}.base`;
				const total = `system.abilities.${abilityKey[1]}.total`;
				formData[base] = formData[total]
					- this.object.system.abilities[abilityKey[1]].bonus;
				this.editingStats = false;
			}

			if (event.target.name === "system.magic.auralCore.value") {
				this.actor.system.magic.auralCore.value = event.target.value;
				formData["system.magic.auralCore.value"] = event.target.value;
			}

			if (await NanoMagicSD._updateNanoPoints(this.actor, event))
				formData["system.magic.nanoPoints.value"] = event.target.value;

			if (await NanoMagicSD._updateMagic(this.actor, event))
				formData["system.magic.nanoMagicPrograms"] = this.actor.system.magic.nanoMagicPrograms;

			if (event.target.name === "abyssal.trauma")
			{
				this.actor.system.magic.trauma = event.target.value;
				this.actor.update({"system.magic.trauma": this.actor.system.magic.trauma});
			}
		}
		super._updateObject(event, formData);
	}

	static async #onRechargeMagicItem(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.magic_charges < item.system.max_magic_charges) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": itemId,
					"system.magic_charges": item.system.magic_charges + 1,
				},
			]);
		}
	}

	static async #onSpendMagicCharge(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.magic_charges > 0) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": itemId,
					"system.magic_charges": item.system.magic_charges - 1,
				},
			]);
		}
	}

	async _onSetDescription(event, fieldName) {
		const newDesc = event.currentTarget.innerHTML;
		UtilitySD.setNestedProperty(this.actor, fieldName, newDesc);
		await this.actor.update({fieldName: newDesc});
	}

	static async #onFocusSpell(event, target) {
		this.#onCastSpell(event, target);
	} 

	static async #onAbyssalPowerRoll(event, target) {
		AbyssalMagicSD._onRollAbyssalPower(this.actor, event, target);
	} 
	
	static async #onMistPowerRoll(event, target) {
		MistMagicSD._onRollMistPower(this.actor, event, target);
	} 

	static async #onRollNanoMagic(event, target) {
		NanoMagicSD._onRollNanoMagic(this.actor, event, target);
	}

	static async #onResetCoreDump(event, target) {
		NanoMagicSD._onResetCoreDump(this.actor, this, target);
	}

	static async #onOptimizeProgram(event, target) {
		NanoMagicSD._onOptimizeProgram(this.actor, event, this, target);
	}

	static async #onProductionReadyProgram(event, target) {
		NanoMagicSD._onProductionReadyProgram(this.actor, event, this, target);
	}

	static async #onCreateNanoProgram(event, target) {
		NanoMagicSD._onCreateNanoProgram(event, this.actor, this, target);
	}

	static async #onEditNanoProgram(event, target) {
		NanoMagicSD._onEditNanoProgram(event, this.actor, this, target);
	}

	static async #onDeleteNanoProgram(event, target) {
		NanoMagicSD._onDeleteNanoProgram(event, this.actor, this, target);
	}

	static async #onCancelNanoProgram(event, target) {
		NanoMagicSD._onCancelNanoProgram(event, this.actor, this, target);
	}

	static async #onResetNanoProgram(event, target) {
		NanoMagicSD._onResetNanoProgram(event, this.actor, this, target);
	}

	static async #onRollAuraMagic(event, target) {
		AuraMagicSD._onRollAuraMagic(this.actor, event, target);
	}

	static async #onResetAuralCore(event, target) {
		AuraMagicSD._onResetAuralCore(this.actor, event, this, target);
	}

	static async #onRedundantPatternways(event, target) {
		AuraMagicSD._onRedundantPatternways(this.actor, event, this, target);
	}

	static async #onSelectMetalPower(event, target) {
		MetalMagicSD._onSelectMetalPower(this.actor, event, target);
	}

	static async #onRemoveMetalPower(event, target) {
		MetalMagicSD._onRemoveMetalPower(this.actor, event, target);
	}

	static async #onIncreaseMetalPower(event, target) {
		MetalMagicSD._onIncreaseMetalPower(this.actor, event, target);
	}

	static async #onDecreaseMetalPower(event, target) {
		MetalMagicSD._onDecreaseMetalPower(this.actor, event, target);
	}

	static async #onPickMetalAltToken(event, target) {
		MetalMagicSD._onPickMetalAltToken(this.actor, event, target);
	}

	static async #onManifestMetalCore(event, target) {
		MetalMagicSD._onManifestMetalCore(this.actor, event, target);
	}

	static async #onChangeMistCorruption(event, target) {
		MistMagicSD._onChangeMistCorruption(this.actor, event, target);
	}

	static async #onSelectAbyssalPower(event, target) {
		AbyssalMagicSD._onSelectAbyssalPower(this.actor, event, target);
	}

	static async #onRecoverAbyssalPower(event, target) {
		AbyssalMagicSD._onRecoverAbyssalPower(this.actor, event, target);
	}

	static async #onRemoveAbyssalPower(event, target) {
		AbyssalMagicSD._onRemoveAbyssalPower(this.actor, event, target);
	}

	static async #onClearAbyssalPowers(event, target) {
		AbyssalMagicSD._onClearAbyssalPowers(this.actor, event, target);
	}

	static async #onLearnRune(event, target) {
		BritannianMagicSD._onLearnRune(event, this.actor, this, target);
	}

	static async #onSelectRune(event, target) {
		BritannianMagicSD._onSelectRune(event, this.actor, this, target);
	}

	static async #onIncreaseRune(event, target) {
		BritannianMagicSD._onIncreaseRune(event, this.actor, this, target);
	}

	static async #onFlipSpellBookLeft(event, target) {
		BritannianMagicSD._onFlipSpellBookLeft(event, this.actor, this, target);
	}

	static async #onFlipSpellBookRight(event, target) {
		BritannianMagicSD._onFlipSpellBookRight(event, this.actor, this, target);
	}

	static async #onCastBritannianMagic(event, target) {
		BritannianMagicSD._onCastBritannianMagic(event, this.actor, this, target);
	}

	static async #onWriteBritannianMagic(event, target) {
		BritannianMagicSD._onWriteBritannianMagic(event, this.actor, this, target);
	}

	static async #onCastBritannianSpell(event, target) {
		BritannianMagicSD._onCastSpell(event, this.actor, this, target, 'freecast');
	}

	static async #onCastWrittenSpell(event, target) {
		BritannianMagicSD._onCastSpell(event, this.actor, this, target, 'written');
	}

	static async #onEditWrittenSpell(event, target) {
		BritannianMagicSD._onEditWrittenSpell(event, this.actor, this, target);
	}

	static async #onEraseWrittenSpell(event, target) {
		BritannianMagicSD._onEraseSpell(event, this.actor, this, target);
	}
	static async #onRecoverRune(event, target) {
		BritannianMagicSD._onRecoverRune(event, this.actor, this, target);
	}
	static async #onRecoverWrittenSpell(event, target) {
		BritannianMagicSD._onRecoverSpell(event, this.actor, this, target);
	}
	static async #onCancelActiveBritannianSpell(event, target) {
		BritannianMagicSD._onCancelSpell(event, this.actor, this, target);
	}
}
