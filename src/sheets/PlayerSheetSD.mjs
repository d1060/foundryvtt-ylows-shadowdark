import ActorSheetSD from "./ActorSheetSD.mjs";
import NanoMagicSD from "./magic/NanoMagicSD.mjs";
import AuraMagicSD from "./magic/AuraMagicSD.mjs";
import MetalMagicSD from "./magic/MetalMagicSD.mjs";
import MistMagicSD from "./magic/MistMagicSD.mjs";
import AbyssalMagicSD from "./magic/AbyssalMagicSD.mjs";
import BritannianMagicSD from "./magic/BritannianMagicSD.mjs";
import UtilitySD from "../utils/UtilitySD.mjs";
import EvolutionGridSD from "../apps/EvolutionGridSD.mjs";
import BulkSellSD from "../utils/BulkSellSD.mjs";
import BuyItemsSD from "../apps/BuyItemsSD.mjs";
import RandomizerSD from "../apps/RandomizerSD.mjs";
import LightSourceTrackerSD from "../apps/LightSourceTrackerSD.mjs";
import CompendiumsSD from "../documents/CompendiumsSD.mjs";

export default class PlayerSheetSD extends ActorSheetSD {

	constructor(object) {
		super(object);

		this.editingHp = false;
		this.editingStats = false;
		this.gemBag = new shadowdark.apps.GemBagSD({actor: this.actor});
		//this.actor.deleteEmbeddedDocuments("Item", ['oht44oDr9TXXEmB7']);
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
			discardItem: this.#onDiscardItem,
			useAbility: this.#onUseAbility,
			usePotion: this.#onUsePotion,
			craftPotion: this.#onCraftPotion,
			rechargeMagicItem: this.#onRechargeMagicItem,
			spendMagicalCharge: this.#onSpendMagicCharge,
			focusSpell: this.#onFocusSpell,
			abyssalPowerRoll: this.#onAbyssalPowerRoll,
			mistPowerRoll: this.#onMistPowerRoll,
			itemChatClick: this.#onItemChatClick,
			openEvolutionGrid: this.#onOpenEvolutionGrid,
			startSellItems: this.#onStartSellItems,
			buyItems: this.#onBuyItems,
			craftItems: this.#onCraftItems,
			sellBulkSell: this.#onSellBulkSell,
			cancelBulkSell: this.#onCancelBulkSell,
			addToBulkSell: this.#onAddToBulkSell,
			deleteChoice: this.#deleteChoiceItem,
			recoverWound: this.#onRecoverWound,
			worsenWound: this.#onWorsenWound,
			makeScar: this.#onMakeScar,
			removeScar: this.#onRemoveScar,

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
				item: fromUuidSync(system.ancestry) ?? null,
			},
			background: {
				name: "background",
				label: game.i18n.localize("TYPES.Item.Background"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.background.tooltip"),
				item: fromUuidSync(system.background) ?? null,
			},
			class: {
				name: "class",
				label: game.i18n.localize("TYPES.Item.Class"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.class.tooltip"),
				item: fromUuidSync(system.class) ?? null,
			},
			deity: {
				name: "deity",
				label: game.i18n.localize("TYPES.Item.Deity"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.deity.tooltip"),
				item: fromUuidSync(system.deity) ?? null,
			},
			patron: {
				name: "patron",
				label: game.i18n.localize("TYPES.Item.Patron"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.patron.tooltip"),
				item: fromUuidSync(system.patron) ?? null,
			},
		};

		return data;
	}

	async _onFirstRender(context, options) {
		shadowdark.logTimestamp("PlayerSheetSD _onFirstRender Start.");
		if (game.settings.get("shadowdark", "use_britannianRuneMagic"))
		{
			options.position.width = 794;
			options.position.height = 712;
		}

		super._onFirstRender(context, options);
		shadowdark.logTimestamp("PlayerSheetSD _onFirstRender End.");
	}

	async _onRender(context, options) {
		shadowdark.logTimestamp("PlayerSheetSD _onRender Start.");
		await super._onRender(context, options);
		shadowdark.logTimestamp("PlayerSheetSD after super._onRender.");
		await AbyssalMagicSD.addEventListeners(this);
		await BritannianMagicSD.addEventListeners(this);
		shadowdark.logTimestamp("PlayerSheetSD added Event Listeners.");

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

		var barterCheck = this.element.querySelector('input[name="bulkSell.barterCheck"]');
		if (barterCheck) {
			barterCheck.addEventListener("input", (ev) => {
				const val = Number(ev.currentTarget.value);
				this._onBarterSlider(val);
			});

			// prevent Enter from submitting while focused on the slider
			barterCheck.addEventListener("keydown", (ev) => {
				if (ev.key === "Enter") ev.preventDefault();
			});
		}

		shadowdark.logTimestamp("PlayerSheetSD _onRender End.");
	}

	/** @override */
	async _preparePartContext(partId, context, options) {
		shadowdark.resetTimestamp();
		this.compendiumItemsCheck(context);
		shadowdark.logTimestamp(`PlayerSheetSD _preparePartContext for '${partId}' START.`);
		context = await super._preparePartContext(partId, context, options);
		context.evolutionGrid = game.settings.get("shadowdark", "evolutionGrid");

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
				context.isOwnerOrGM = false;

				if (this.actor.ownership[game.user._id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER || this.actor.ownership.default === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) context.isOwnerOrGM = true;
				if (game.user.isGM) context.isOwnerOrGM = true;
				break;
			case "details":
				context.showBritannianMagic = game.settings.get("shadowdark", "use_britannianRuneMagic");
				context.showHitLocation = game.settings.get("shadowdark", "hitLocation");

				if (context.evolutionGrid) {
					context.evolutionGridItems = [];
					for (let node of this.actor.system.evolutionGrid?.openNodes ?? []) {
						let nodeItem = fromUuidSync(node.itemUuid);
						if (nodeItem != null) {
							if (!nodeItem.system) nodeItem.system = {};
							if (!nodeItem.system.description) nodeItem.system.description = '';
							context.evolutionGridItems.push(nodeItem);
						}
					}
				}

				if (context.showHitLocation)
				{
					context.bodySetupChoicesKey = 'bodySetup';
					context.bodySetups = await CompendiumsSD.bodySetups(false);
					context.bodySetup = this.actor.system.bodySetup ? fromUuidSync(this.actor.system.bodySetup) : null;
				}

				shadowdark.logTimestamp(`PlayerSheetSD _preparePartContext for '${partId}' Got Evolution Grid Items.`);
				context.xpNextLevel = this.actor.level * 10;
				context.levelUp = (context.system.level.xp >= context.xpNextLevel);
				context.knownLanguages = await this.actor.languageItems();
				shadowdark.logTimestamp(`PlayerSheetSD _preparePartContext for '${partId}' Got Languages.`);
				context.backgroundSelectors = await this.getBackgroundSelectors();
				shadowdark.logTimestamp(`PlayerSheetSD _preparePartContext for '${partId}' Got Background Selectors.`);
				context.characterClass = await this.actor.getClass();
				shadowdark.logTimestamp(`PlayerSheetSD _preparePartContext for '${partId}' Got Class.`);
				context.classHasPatron = context.characterClass?.system?.patron?.required ?? false;
				context.classTitle = await this.actor.getTitle();
				shadowdark.logTimestamp(`PlayerSheetSD _preparePartContext for '${partId}' Got Title.`);
				context.characterPatron = await this.actor.getPatron();
				shadowdark.logTimestamp(`PlayerSheetSD _preparePartContext for '${partId}' Got Patron.`);
				break;
			case "abilities":
				//shadowdark.debug(`PlayerSheetSD _preparePartContext Abilities for ${this.actor.name}. this.actor.system.attributes.hp.value: ${this.actor.system.attributes.hp.value}`);
				if (context.evolutionGrid) {
					[context.maxHp, context.hpTooltip] = await this.actor.recalculateHp();
				}

				let numLuckTokens = 1;
				if (this.actor.system.bonuses.luckTokens)
					numLuckTokens += this.actor.system.bonuses.luckTokens;
				if (this.actor.system.scars?.length)
					numLuckTokens += Math.floor(this.actor.system.scars.length * CONFIG.SHADOWDARK.SCAR_EFFECT_RATIO);

				if (!this.actor.system.luck.tokens) this.actor.system.luck.tokens = [];

				if (this.actor.system.luck.tokens.length < numLuckTokens)
				{
					for (let i = this.actor.system.luck.tokens.length; i < numLuckTokens; i++)
						this.actor.system.luck.tokens.push(true);
				}

				if (this.actor.system.luck.tokens.length > numLuckTokens)
				{
					for (let i = this.actor.system.luck.tokens.length; i > numLuckTokens; i--)
						this.actor.system.luck.tokens.pop();
				}

				shadowdark.logTimestamp(`PlayerSheetSD _preparePartContext for '${partId}' Starting checks.`);

				context.luckTokens = this.actor.system.luck.tokens;
				[context.system.attributes.ac.value, context.system.attributes.ac.tooltip] = await this.actor.getArmorClass('Chest');
				if (!context.system.attributes.dr) context.system.attributes.dr = {};
				context.system.attributes.dr.base = this.actor.getDamageReduction({name: 'Chest'});
				shadowdark.logTimestamp(`PlayerSheetSD _preparePartContext for '${partId}' Got AC and DR.`);
				context.hasTempHP = this.actor.system.attributes.hp.temp && this.actor.system.attributes.hp.temp > 0;
				context.actor.system.attributes.hp.temp = this.actor.system.attributes.hp.temp;
				if (!context.evolutionGrid) {
					context.maxHp = this.actor.system.attributes.hp.base
						+ this.actor.system.attributes.hp.bonus;

					if (this.actor.system.penalties?.maxHp)
						context.maxHp += this.actor.system.penalties.maxHp;
				}

				context.hpValue = this.actor.system.attributes.hp.value;
				//shadowdark.debug(`PlayerSheetSD _preparePartContext hpValue: ${context.hpValue}`);

				if (context.hpValue > context.maxHp) context.hpValue = context.maxHp;
				//shadowdark.debug(`PlayerSheetSD _preparePartContext hpValue 2: ${context.hpValue}`);
				if (context.hpValue < 0) context.hpValue = 0;
				//shadowdark.debug(`PlayerSheetSD _preparePartContext hpValue 3: ${context.hpValue}`);

				context.abilities = this.actor.getCalculatedAbilities();
				shadowdark.logTimestamp(`PlayerSheetSD _preparePartContext for '${partId}' Got Abilities.`);
				this.actor.system.move = await this.actor.getCalculatedMove();
				shadowdark.logTimestamp(`PlayerSheetSD _preparePartContext for '${partId}' Got Move.`);
				context.move = this.actor.system.move;
				if (this.actor.system.penalties?.move)
				{
					context.movePenalty = this.actor.system.penalties.move;
				}
				context.statPoints = this.actor.statPoints();

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
				
				context.editingHp = this.editingHp && !context.evolutionGrid;
				context.editingStats = this.editingStats;
				context.scars = this.actor.system.scars;
				context.wounds = this.actor.system.wounds;

				if (this.actor.system.scars?.length) {
					context.scarsTooltip = this.buildScarsTooltip();

					if (this.actor.system.scars.length == 1)
						context.scarsTitle = this.actor.system.scars.length + ' ' + game.i18n.localize("SHADOWDARK.sheet.player.scar");
					else
						context.scarsTitle = this.actor.system.scars.length + ' ' + game.i18n.localize("SHADOWDARK.sheet.player.scars");
				}

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
				if (this.actor.bulkSell?.active)
				{
					context.bulkSelling = this.actor.bulkSell.active;
					context.bulkSell = this.actor.bulkSell;
				}
				else
					context.bulkSelling = false;
				this.setupActiveItemIcons(context);
				[context.gearSlots, context.gearSlotsTooltip] = this.actor.numGearSlots();
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

		shadowdark.logTimestamp(`PlayerSheetSD _preparePartContext for '${partId}' END.`);
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
	
	compendiumItemsCheck(context) {
		const ancestry = fromUuidSync(context.system.ancestry);
		if (!ancestry) delete context.system['ancestry'];
		const background = fromUuidSync(context.system.background);
		if (!background) delete context.system['background'];
		const deity = fromUuidSync(context.system.deity);
		if (!deity) delete context.system['deity'];
		const playerClass = fromUuidSync(context.system.class);
		if (!playerClass) delete context.system['class'];
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
	async _onDragEnd(event, data) {
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
		if (item?.actor?.id === this.actor.id) return;

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
		var effects = await item.getEmbeddedCollection("ActiveEffect");
		if (!item.isPotion() && effects.contents.length > 0) {
			// add item to actor
			//item = await fromUuid(data.uuid);
			item.schema.name = item.documentName + '.schema';
			this.actor.createItemOnActor(item);
			game.shadowdark.effectPanel.refresh();
			this.render(true);
			this.removeItemFromOriginalActor(data, item);
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
		this.removeItemFromOriginalActor(data, item);
	}

	async removeItemFromOriginalActor(data, item) {
		shadowdark.log(`removeItemFromOriginalActor`);
		if (data.actor) {
			if (game.user.isGM) {
				const existingItem = item.actor.getEmbeddedDocument("Item", item.id);

				if (existingItem)
				{
					item.actor.deleteEmbeddedDocuments(
							"Item",
							[item.id]
						);
				}
			} else {
				shadowdark.log(`emiting removeItemFromActor for ${item.actor.name} ${item.name}`);
				game.socket.emit(
					"system.shadowdark",
					{
						type: "removeItemFromActor",
						data: {
							itemId: item.id,
							itemOwnerId: item.actor.uuid,
						},
					}
				);
			}
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
							description: property.description,
							active: true,
							transfer: false
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
		let match;
		if (typeof event.target?.name?.match === "function")
			match = event.target?.name?.match(/system\.abilities\.(.*?)\.total/);
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
			if (game.settings.get("shadowdark", "evolutionGrid")) 
				return;

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
		else if (event.target?.name.includes('bulkSell.'))
			BulkSellSD.onSubmit(this.actor, event);
		else if (event.target?.name === 'predefinedEffects')
			shadowdark.effects.fromPreDefined(this.actor, event.target.value);
		else if (event.target?.name === "system.attributes.hp.value")
		{
			await this.actor.updateHP(event.target.value);
			this.render(true);
		}
		else if (event.target?.name === "system.bodySetup")
		{
			let uuid = UtilitySD.getSelectedUuid(form, event.target);
			if (uuid)
			{
				await this.actor.update({[event.target.name]: uuid});
			}
		}
		else if (event.target.type === 'checkbox')
		{
			if (event.target.name === 'system.luck.token')
			{
				const idx = parseInt(event.target.dataset.index);
				this.actor.system.luck.tokens[idx] = event.target.checked;
				this.actor.update({'system.luck.tokens': this.actor.system.luck.tokens});
			}
			else
				await this.actor.update({[event.target.name]: event.target.checked});
		}
		else if (event.target.type === 'number')
		{
			if (event.target.name === 'system.level.xp' && game.settings.get("shadowdark", "evolutionGrid"))
			{
				const gridLevel = this.actor.system.level.grid ?? 1;
				let totalXPforCurrentGridLevel = (gridLevel * (gridLevel - 1) / 2) * 10;
				totalXPforCurrentGridLevel += parseInt(event.target.value);
				const newGridLevel = Math.floor((Math.sqrt((totalXPforCurrentGridLevel / 10) * 8 + 1) + 1) / 2);
				if (this.actor.system.level.grid != newGridLevel)
				{
					this.actor.system.level.grid = newGridLevel;
					await this.actor.update({'system.level.grid': newGridLevel});
				}
				const totalXPforNewGridLevel = (newGridLevel * (newGridLevel - 1) / 2) * 10;
				const leftOverXP = totalXPforCurrentGridLevel - totalXPforNewGridLevel;
				await this.actor.update({[event.target.name]: leftOverXP});
			}
			else
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

	static async #onOpenEvolutionGrid(event, target) {
		let evolutionGridTypeSetting = game.settings.get("shadowdark", "evolutionGrid");
		evolutionGridTypeSetting--;

		let allGridTypes = await shadowdark.compendiums.evolutionGridTypes();
		if (!allGridTypes) return;
		let actorGridTypeChoice = allGridTypes.contents[evolutionGridTypeSetting];
		if (!actorGridTypeChoice) return;

		const actorGridType = await fromUuid(actorGridTypeChoice.uuid);
		if (!this.evolutionGrid)
			this.evolutionGrid = new EvolutionGridSD({actor: this.actor, type: actorGridType});
		this.evolutionGrid.render(true);
	}

	static async #onStartSellItems(event, target) {
		this.actor.bulkSell = {active: true, barterCheck: 10, gp: 0, sp: 0, cp: 0, originalCost: 0 }
		await BulkSellSD.clearBulkSelltems(this.actor);
		this.render(true);
	}

    async _onBarterSlider(value) {
		this.actor.bulkSell.barterCheck = parseInt(value);
		await BulkSellSD.calculatePricesByBarterCheck(this.actor);
		await BulkSellSD.updatePrices(this);
    }

	static async #onBuyItems(event, target) {
		var buyItems = new BuyItemsSD({sheet: this});
		buyItems.render(true);
	}

	static async #onCraftItems(event, target) {
		event.preventDefault();
		const allCraftableItems = await CompendiumsSD.craftableItems();

		if (!allCraftableItems || !allCraftableItems.length)
		{
			//shadowdark.debug(`onCraftItems: Could not find any craftable item`);
			return;
		}

		const itemsYouCanCraft = [];
		const itemsYouCannotCraft = [];
		for (const item of allCraftableItems) {
			if (!item.system.craftRecipe || item.system.craftRecipe.length == 0)
				item.noRecipe = true;
			else 
			{
				item.noRecipe = false;
				item.hasIngredients = true;
				item.recipeTooltip = "";
				for (const recipeItem of item.system.craftRecipe) {
					let recipeQuantity = recipeItem.quantity;
					if (this.actor.system.bonuses.smithingForgeImproviser)
						recipeQuantity = Math.ceil(recipeQuantity / 2);

					item.recipeTooltip += '<br>' + recipeItem.name + ': ' + recipeQuantity;
					//shadowdark.debug(`onCraftItems: Checking recipe for ${item.name}: ${recipeItem.quantity} ${recipeItem.name}`);
					const itemsIhave = this.actor.items.filter(i => i.name.slugify() === recipeItem.name.slugify());
					if (!itemsIhave)
					{
						item.hasIngredients = false;
					}
					let myQuantity = 0;
					for (const itemIhave of itemsIhave) {
						myQuantity += itemIhave.system.quantity;
					}
					if (myQuantity < recipeQuantity)
					{
						item.hasIngredients = false;
					}
				}

				if (item.noRecipe || !item.hasIngredients)
				{
					item.disabled = true;
					itemsYouCannotCraft.push(item)
				} else {
					item.disabled = false;
					itemsYouCanCraft.push(item);
				}
			}
		}

		const content = await foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/craft-item.hbs",
			{
				itemsYouCanCraft,
				itemsYouCannotCraft,
				allCraftableItems,
			}
		);

		const targetItem = await foundry.applications.api.DialogV2.wait({
				classes: ["app", "shadowdark", "shadowdark-dialog", "window-app", 'themed', 'theme-light'],
				window: {
					resizable: false,
					title: game.i18n.localize("SHADOWDARK.dialog.item.craft_item_select.title"),
				},
				content,
				buttons: [
					{
						action: 'select',
						icon: "fa fa-square-check",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.select")}`,
						callback: event => {
							const checkedRadio = event.currentTarget.querySelector("input[type='radio']:checked");
							return checkedRadio?.getAttribute("uuid") ?? false;
						},
					},
					{
						action: 'cancel',
						icon: "fa fa-square-xmark",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
						callback: () => false,
					},
				],
				default: "select",
		});

		if (targetItem) {
			const newItem = await fromUuid(targetItem);
			if (!newItem) return;

			const [createdItem] = await this.actor.createEmbeddedDocuments(
				"Item",
				[newItem]
			);

			await this.actor.applySmithingPerksToCreatedItem(createdItem);

			for (const recipeItem of newItem.system.craftRecipe) {
				const ingredients = this.actor.items.filter(i => i.name.slugify() === recipeItem.name.slugify());
				if (!ingredients)
					continue;

				let toReduce = recipeItem.quantity;
				if (this.actor.system.bonuses.smithingForgeImproviser)
					toReduce = Math.ceil(toReduce / 2);

				for (const ingredient of ingredients) {
					if (ingredient.system.quantity >= toReduce)
					{
						this.actor.reduceQuantity(ingredient, toReduce);
						break;
					}
					else
					{
						this.actor.reduceQuantity(ingredient, ingredient.system.quantity);
						toReduce -= ingredient.system.quantity;
					}
				}
			}
		}
	}

	static async #onSellBulkSell(event, target) {
		await BulkSellSD.bulkSell(this.actor);
		this.render(true);
	}

	static async #onCancelBulkSell(event, target) {
		this.actor.bulkSell.active = false;
		this.render(true);
	}

	static async #onAddToBulkSell(event, target) {
		await BulkSellSD.addToBulkSell(this.actor, target.dataset.itemId);
		this.render(true);
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
		if (this.actor.level === 0 && actorClass.name.includes("Level 0")) {
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

		var activeEffects = await item.getEmbeddedCollection("ActiveEffect");
		for (const activeEffect of activeEffects)
		{
			await item.updateEmbeddedDocuments("ActiveEffect", [
				{
					"_id": activeEffect.id,
					"disabled": !item.system.equipped,
				},
			]);
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

	static async #onDiscardItem(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
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

	static async #onCraftPotion(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		const craftablePotionsTalents = await this.actor.craftablePotions();
		if (!craftablePotionsTalents || !craftablePotionsTalents.length) return;

		const craftablePotions = [];
		for (const talent of craftablePotionsTalents) {
			for (const item of talent?.system?.craftTargets ?? []) {
				craftablePotions.push(item);
			}
		}

		if (!craftablePotions || !craftablePotions.length) return;

		const content = await foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/craft-potion.hbs",
			{
				craftablePotions,
			}
		);

		const targetPotion = await foundry.applications.api.DialogV2.wait({
				classes: ["app", "shadowdark", "shadowdark-dialog", "window-app", 'themed', 'theme-light'],
				window: {
					resizable: false,
					title: game.i18n.localize("SHADOWDARK.dialog.item.craft_potion_select.title"),
				},
				content,
				buttons: [
					{
						action: 'select',
						icon: "fa fa-square-check",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.select")}`,
						callback: event => {
							const checkedRadio = event.currentTarget.querySelector("input[type='radio']:checked");
							return checkedRadio?.getAttribute("uuid") ?? false;
						},
					},
					{
						action: 'cancel',
						icon: "fa fa-square-xmark",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
						callback: () => false,
					},
				],
				default: "select",
		});

		if (targetPotion) {
			const potion = await fromUuid(targetPotion);
			if (!potion) return;

			const [newPotion] = await this.actor.createEmbeddedDocuments(
				"Item",
				[potion]
			);

			let strenghtened = 0;
			if (this.actor.system.bonuses.strenghtenedPotions && newPotion.name.slugify().includes('potion')) {
				await this.multiplyPotionParameters(newPotion, 2);
				strenghtened++;
			}
			else if (this.actor.system.bonuses.strenghtenedPoisons && newPotion.name.slugify().includes('poison')) {
				await this.multiplyPotionParameters(newPotion, 2);
				strenghtened++;
			}

			if (this.actor.system.bonuses.potionSpecialist && newPotion.name.slugify() == this.actor.system.bonuses.potionSpecialist) {
				await this.multiplyPotionParameters(newPotion, 2);
				strenghtened++;
			}
			else if (this.actor.system.bonuses.poisonSpecialist && newPotion.name.slugify() == this.actor.system.bonuses.poisonSpecialist) {
				await this.multiplyPotionParameters(newPotion, 2);
				strenghtened++;
			}

			if (strenghtened) {
				const newName = (strenghtened == 1 ? "Strenghtened " : "Double-Strenghtened ") + newPotion.name
				this.actor.updateEmbeddedDocuments(
					"Item", [{
						"_id": newPotion.id,
						"name": newName,
					}]
				);
			}

			const item = this.actor.getEmbeddedDocument("Item", itemId);
			if (item.system.quantity <= 1) {
				this.actor.deleteEmbeddedDocuments("Item", [itemId]);
			} else {
				item.system.quantity--;
				this.actor.updateEmbeddedDocuments(
					"Item", [{
						"_id": itemId,
						"system.quantity": item.system.quantity,
					}]
				);
			}
		}
	}

	async multiplyPotionParameters(potion, factor) {
		for (const effect of potion.effects) {
			for (const change of effect.changes) {
				if (UtilitySD.isNumeric(change.value)) {
					change.value *= factor;
					await potion.updateEmbeddedDocuments("ActiveEffect", [
						{
							"_id": effect.id,
							"changes": effect.changes,
						},
					]);
				}
			}
		}

		if (potion.system.damage) {
			potion.system.damage.numDice *= factor
			if (potion.system.damage.numDice > 1) {
				if (potion.system.damage.oneHanded)
				{
					const match = potion.system.damage.oneHanded.match(/[dD](\d+?)/);
					if (match) {
						const diceType = match[1];
						potion.system.damage.oneHanded = potion.system.damage.numDice + 'd' + diceType;
					}
				}
				if (potion.system.damage.twoHanded)
				{
					const match = potion.system.damage.twoHanded.match(/[dD](\d+?)/);
					if (match) {
						const diceType = match[1];
						potion.system.damage.twoHanded = potion.system.damage.numDice + 'd' + diceType;
					}
				}
			}

			await this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": potion.id,
					"system.damage": potion.system.damage,
				},
			]);
		}
		
		let desc = potion.system.description;
		const DELIMS = /([ ,.\n\r])(\d+)(?=[ ,.\n\r])/g;
  		desc = desc.replace(DELIMS, (_, lead, num) => lead + String(Number(num) * factor));

		const DELIMSD = /([ ,.\n\r])(\d+)([dD])/g;
  		desc = desc.replace(DELIMSD, (_, lead, num, d) => lead + String(Number(num) * factor) + d);

		await this.actor.updateEmbeddedDocuments("Item", [
			{
				"_id": potion.id,
				"system.description": desc,
			},
		]);
	}

	async _sendDroppedItemToChat(active, item, options = {}) {
		const cardData = {
			name: item?.name,
			source: options.source,
			target: options.target,
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
			source: options.source,
			target: options.target,
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
			//Check if I have available Fuel, if I need it.
			if (item.system.fuelSources && item.system.fuelSources.length) {
				const fuelSource = this.actor.items.find(actorItem => item.system.fuelSources.some(s => s.name == actorItem.name));
				if (fuelSource)
				{
					if (fuelSource.system.quantity > 1) {
						fuelSource.system.quantity--;
						this.actor.updateEmbeddedDocuments(
							"Item", [{
								"_id": fuelSource.id,
								"system.quantity": fuelSource.system.quantity,
							}]
						);
					} else {
						this.actor.deleteEmbeddedDocuments("Item", [fuelSource.id]);
					}
				}
				else
				{
					return ui.notifications.warn(
						game.i18n.localize("SHADOWDARK.item.errors.no_available_fuel"),
						{ permanent: false }
					);
				}
			}

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

		if (active && game.settings.get("shadowdark", "newLightRideOldTimer"))
		{
			const allLights = await LightSourceTrackerSD.getCurrentLightSources();
			let lowestRemainingSecs = Number.MAX_VALUE;
			for (let lightActor of allLights) {
				for (let lightSource of lightActor.lightSources) {
					if (lightActor.id != this.actor.id || lightSource._id != item.id) {
						if (lightSource.system.light.remainingSecs < lowestRemainingSecs && lightSource.system.light.remainingSecs > 0)
							lowestRemainingSecs = lightSource.system.light.remainingSecs;
					}
				}
			}

			if (lowestRemainingSecs != Number.MAX_VALUE)
				dataUpdate['system.light.remainingSecs'] = lowestRemainingSecs;
		}
		
		if (!item.system.light.hasBeenUsed) {
			dataUpdate["system.light.hasBeenUsed"] = true;
		}

		const [updatedLight] = await this.actor.updateEmbeddedDocuments(
			"Item", [dataUpdate]
		);


		await this.actor.toggleLight(active, item.id);

		LightSourceTrackerSD._updateLightSourceImages(item, null);
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
		const sortedItems = this._sortAllItems(context);

		const equippedArmorByPart = {};
		const partsCoveredByArmor = [];
		for (const item of sortedItems) {
			if (item.type === 'Armor' && item.system.equipped && item.system.coverage?.length) {
				for (let part of item.system.coverage) {
					if (!Object.hasOwn(equippedArmorByPart, part)) {
						equippedArmorByPart[part] = [];
						partsCoveredByArmor.push(part);
					}
					equippedArmorByPart[part].push(item);
				}
			}
		}

		if (game.settings.get("shadowdark", "hitLocation")) {
			for (const part of partsCoveredByArmor) {
				let items = equippedArmorByPart[part];
				items = items.sort((a, b) => a.system.coverage.length - b.system.coverage.length);
				if (items.length) {
					items[0].bodyPartFreeSlot = true;

					for (const part2 of partsCoveredByArmor) {
						if (part === part2) continue;
						for (let i = 0; i < equippedArmorByPart[part2].length; i++) {
							if (equippedArmorByPart[part2][i]._id == items[0]._id)
							{
								equippedArmorByPart[part2].splice(i, 1);
								break;
							}
						}
					}
				}
			}
		}

		for (const i of sortedItems) {
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

				if (i.type === "Armor" && i.system.equipped)
				{
					if (this.actor.system.bonuses.armorConditioning && (this.actor.system.bonuses.armorConditioning == i.name.slugify() || i.system.baseArmor == this.actor.system.bonuses.armorConditioning))
						slotsUsed--;
					if (this.actor.system.bonuses.armorBorn)
						slotsUsed--;

					if (slotsUsed < 0)
						slotsUsed = 0;
				}

				if (i.type === "Armor" && this.actor.system?.magic?.manifestedMetalCore)
				{
					i.isArmorWhileManifestedMetalCore = true;
				}

				let totalSlotsUsed = (quantity / perSlot) * slotsUsed;
				totalSlotsUsed -= freeCarry * slotsUsed;
				if (i.bodyPartFreeSlot && totalSlotsUsed >= 1) totalSlotsUsed -= 1;

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

				let perSlotMagnitude = Math.ceil(Math.log10(perSlot));
				i.slotsUsed = UtilitySD.roundTo(i.slotsUsed, perSlotMagnitude);

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
					i.lightSourceExpended = i.system.light.isExpended;

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

		for (const e of context.activeEffects?.active?.effects ?? []) {
			if (!e._id) e._id = e.id;
			if (e.sourceName === 'Nano-Magic') {
				effects.effect.items.push(e);
			}
			else if (e.sourceName === 'Nano-Magic Drawback') {
				effects.condition.items.push(e);
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
			slots.coins = (totalCoins - freeCoins) / freeCoins;
		}

		// Now do the same for gems...
		let totalGems = gems.length;
		if (totalGems > 0) {
			slots.gems = totalGems / CONFIG.SHADOWDARK.DEFAULTS.GEMS_PER_SLOT;
		}

		// calculate total slots
		slots.total = slots.gear + slots.treasure + slots.coins + slots.gems;

		slots.total = UtilitySD.roundTo(slots.total, 1);
		slots.gear = UtilitySD.roundTo(slots.gear, 1);
		slots.treasure = UtilitySD.roundTo(slots.treasure, 1);
		slots.coins = UtilitySD.roundTo(slots.coins, 1);
		slots.gems = UtilitySD.roundTo(slots.gems, 1);

		slots.totalTooltip = '';
		if (slots.gear)     slots.totalTooltip += slots.gear     + ' ' + game.i18n.localize("SHADOWDARK.inventory.gear") + '<br>';
		if (slots.treasure) slots.totalTooltip += slots.treasure + ' ' + game.i18n.localize("SHADOWDARK.inventory.section.treasure") + '<br>';
		if (slots.coins)    slots.totalTooltip += slots.coins    + ' ' + game.i18n.localize("SHADOWDARK.inventory.coins") + '<br>';
		if (slots.gems)     slots.totalTooltip += slots.gems     + ' ' + game.i18n.localize("SHADOWDARK.inventory.gems");

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
				await this.actor.updateHP(event.target.value);
				this.render(true);
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

	static async newRandomPlayerSheet(ownerId) {
		const newActor = await Actor.create(RandomizerSD.newCharacter());
		newActor.ownership[ownerId] = 3;
        await newActor.update({
            ownership: newActor.ownership
        });

		if (ownerId !== game.userId) {
			game.socket.emit("system.shadowdark", {
				type: "openCharacter",
				payload: {actorId: newActor.id, userId: ownerId},
			});
		}
		else
		{
			newActor.sheet.render(true);
		}
	}

	setupActiveItemIcons(context) {
		for (const item of context.inventory.equipped) {
			this.setupActiveItemIcon(item);
		}
		for (const item of context.inventory.carried) {
			this.setupActiveItemIcon(item);
		}
	}

	setupActiveItemIcon(item) {
		item.activeImg = item.img;

		if (item.system.light?.active) {
			if (item.system.litIcon)
				item.activeImg = item.system.litIcon;
		} else if (!item.system.light?.isExpended) {
			if (item.system.unlitIcon)
				item.activeImg = item.system.unlitIcon;
		} else {
			if (item.system.expendedIcon)
				item.activeImg = item.system.expendedIcon;
		}
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

		let newChoices = [];
		if (Array.isArray(currentChoices))
		{
			for (const itemUuid of currentChoices) {
				if (itemUuid === deleteUuid) continue;
				newChoices.push(itemUuid);
			}
		}
		else
		{
			if (currentChoices === deleteUuid)
				newChoices = null;
			else
				newChoices = currentChoices;
		}

		const dataKey = `system.${choicesKey}`;
		await this.actor.update({[dataKey]: newChoices});
	}

	static async #onRecoverWound(event, target) {
		const idx = parseInt(event.target.dataset.index);
		const wound = this.actor.system.wounds[idx];
		if (wound.level == 1) {
			this.actor.system.wounds.splice(idx, 1);
		} else {
			wound.level--;
			const damageDesc = game.i18n.localize(`SHADOWDARK.wounds.${wound.level}_${wound.desctype}_${wound.descIndex}`);
			wound.damageDesc = damageDesc;
		}

		this.actor.update({"system.wounds": this.actor.system.wounds});
		this.actor.updateWoundCondition(wound);
	}

	static async #onWorsenWound(event, target) {
		const idx = parseInt(event.target.dataset.index);
		const wound = this.actor.system.wounds[idx];
		wound.level++;
		const damageDesc = game.i18n.localize(`SHADOWDARK.wounds.${wound.level}_${wound.desctype}_${wound.descIndex}`);
		wound.damageDesc = damageDesc;

		this.actor.update({"system.wounds": this.actor.system.wounds});
		this.actor.updateWoundCondition(wound);
	}

	static async #onMakeScar(event, target) {
		if (await UtilitySD.AreYouSureDialog('SHADOWDARK.wounds.make_scar_title', 'SHADOWDARK.wounds.make_scar_are_you_sure')) {
			const idx = parseInt(event.target.dataset.index);
			const wound = this.actor.system.wounds[idx];
			this.actor.system.wounds.splice(idx, 1);
			this.actor.update({"system.wounds": this.actor.system.wounds});
			this.actor.updateWoundCondition(wound);
			this.actor.createScarFromWound(wound);
		}
	}

	static async #onRemoveScar(event, target) {
		if (await UtilitySD.AreYouSureDialog('SHADOWDARK.wounds.remove_scar_title', 'SHADOWDARK.wounds.remove_scar_are_you_sure')) {
			const idx = parseInt(event.target.dataset.index);
			const scar = this.actor.system.scars[idx];
			this.actor.system.scars.splice(idx, 1);
			this.actor.update({"system.scars": this.actor.system.scars});
		}
	}

	buildScarsTooltip() {
		let tooltip = game.i18n.localize("SHADOWDARK.wounds.scarsTooltip");
		const allScarsModifier = this.actor.system.scars.length * CONFIG.SHADOWDARK.SCAR_EFFECT_RATIO;
		tooltip += "<br>" + game.i18n.format('SHADOWDARK.wounds.makeScarThreshold', { ratio: allScarsModifier.toFixed(1) });
		tooltip += "<br>" + game.i18n.format('SHADOWDARK.wounds.makeScarLuck', { ratio: allScarsModifier.toFixed(1) });
		const abilitiesModifiers = { str: 0, dex: 0, con: 0, wis: 0, cha: 0, int: 0 };
		for (const scar of this.actor.system.scars) {
			abilitiesModifiers[scar.abilityId] += CONFIG.SHADOWDARK.SCAR_EFFECT_RATIO;
		}

		if (abilitiesModifiers.str)
			tooltip += "<br>" + game.i18n.format('SHADOWDARK.wounds.makeScarAbility', { ratio: abilitiesModifiers.str.toFixed(1), ability: game.i18n.localize('SHADOWDARK.ability_str') });
		if (abilitiesModifiers.dex)
			tooltip += "<br>" + game.i18n.format('SHADOWDARK.wounds.makeScarAbility', { ratio: abilitiesModifiers.dex.toFixed(1), ability: game.i18n.localize('SHADOWDARK.ability_dex') });
		if (abilitiesModifiers.con)
			tooltip += "<br>" + game.i18n.format('SHADOWDARK.wounds.makeScarAbility', { ratio: abilitiesModifiers.con.toFixed(1), ability: game.i18n.localize('SHADOWDARK.ability_con') });
		if (abilitiesModifiers.int)
			tooltip += "<br>" + game.i18n.format('SHADOWDARK.wounds.makeScarAbility', { ratio: abilitiesModifiers.int.toFixed(1), ability: game.i18n.localize('SHADOWDARK.ability_int') });
		if (abilitiesModifiers.wis)
			tooltip += "<br>" + game.i18n.format('SHADOWDARK.wounds.makeScarAbility', { ratio: abilitiesModifiers.wis.toFixed(1), ability: game.i18n.localize('SHADOWDARK.ability_wis') });
		if (abilitiesModifiers.cha)
			tooltip += "<br>" + game.i18n.format('SHADOWDARK.wounds.makeScarAbility', { ratio: abilitiesModifiers.cha.toFixed(1), ability: game.i18n.localize('SHADOWDARK.ability_cha') });

		return tooltip;
	}
}
