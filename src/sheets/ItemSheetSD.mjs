import UtilitySD from "../utils/UtilitySD.mjs";
import * as select from "../apps/CompendiumItemSelectors/_module.mjs";
import BritannianMagicSD from "./magic/BritannianMagicSD.mjs";
import EvolutionGridSD from "../apps/EvolutionGridSD.mjs";
import CompendiumsSD from "../documents/CompendiumsSD.mjs";
import BodySubpartSD from "../apps/BodySubpartSD.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api
const { ItemSheetV2 } = foundry.applications.sheets
export default class ItemSheetSD extends HandlebarsApplicationMixin(ItemSheetV2) {
	#dragDrop
	firstLoad = true;

	constructor(object) {
		super(object);
		this.#dragDrop = this.#createDragDropHandlers();
	}

	/* -------------------------------------------- */
	/*  Inherited                                   */
	/* -------------------------------------------- */

	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["window-app", "shadowdark", "sheet", "item", 'themed', 'theme-light'],
		scrollY: ["section.SD-content-body"],
		position: {
    		width: 665,
    		height: 620
  		},
		window: {
			resizable: true,
			title: "",
  		},
		form: {
			handler: this.#onSubmit,
		    submitOnChange: true,
    		closeOnSubmit: false
  		},
		actions: {
			editImage: this.#onEditImage,
			deleteChoice: this.#deleteChoiceItem,
			classTitleAdd: this.#onClassTitleAdd,
			classTitleDelete: this.#onClassTitleDelete,
			npcAttackRanges: this.#onNpcAttackRanges,
			removeNameTable: this.#onRemoveTable,
			deleteCraftTarget: this.#onDeleteCraftTarget,
			deleteCraftRecipeItem: this.#onDeleteCraftRecipeItem,
			deleteRequirement: this.#onDeleteRequirement,
			addPrefix: this.#onAddPrefix,
			addSuffix: this.#onAddSuffix,
			removePrefix: this.#onRemovePrefix,
			removeSuffix: this.#onRemoveSuffix,
			selectItem: this.#onItemSelection,
			manageActiveEffect: this.#manageActiveEffect,
			openEvolutionGrid: this.#onOpenEvolutionGrid,
			addBodyPart: this.#onAddBodyPart,
			removeBodyPart: this.#onRemoveBodyPart,
			subPartSetup: this.#onSubPartSetup,
			editBodyPartImage: this.#onEditBodyPartImage,
			defaultBodySetup: this.#onDefaultBodySetup,
			selectHitLocation: this.#onSelectHitLocation,
			pickLightIcon: this.#onPickLightIcon,
			deleteFuelSource: this.#onDeleteFuelSource,
		},
		dragDrop: [{dropSelector: ".items"}],
 	}

	/** @inheritdoc */
	static TABS = {
		sheet: {
    		tabs: [],
			labelPrefix: null,
			initial: null,
		}
	}

	/** @inheritdoc */
	static PARTS = {
		header:                  { template: "systems/shadowdark/templates/items/_partials/header.hbs" },
		tabs:                    { template: "systems/shadowdark/templates/items/_partials/tab-nav.hbs" },
		ancestryDetails:         { template: "systems/shadowdark/templates/items/ancestry/details-tab.hbs" },
		armorDetails:            { template: "systems/shadowdark/templates/items/armor/details-tab.hbs" },
		basicDetails:            { template: "systems/shadowdark/templates/items/basic/details-tab.hbs" },
		bodyPartsDetails:		 { template: "systems/shadowdark/templates/items/_partials/body-parts-details.hbs" },
		boonDetails:             { template: "systems/shadowdark/templates/items/boon/details-tab.hbs" },
		classAbilityDetails:     { template: "systems/shadowdark/templates/items/class-ability/details-tab.hbs" },
		classDetails:            { template: "systems/shadowdark/templates/items/class/details-tab.hbs" },
		deityDetails:            { template: "systems/shadowdark/templates/items/deity/details-tab.hbs" },
		description:             { template: "systems/shadowdark/templates/items/_partials/description-tab.hbs" },
		effectDetails:           { template: "systems/shadowdark/templates/items/effect/details-tab.hbs" },
		effects:                 { template: "systems/shadowdark/templates/items/_partials/effects-tab.hbs" },
		evolutionGridTypeDetails:{ template: "systems/shadowdark/templates/items/_partials/evolution-grid-type-details.hbs" },
		gemDetails:              { template: "systems/shadowdark/templates/items/gem/details-tab.hbs" },
		languageDetails:         { template: "systems/shadowdark/templates/items/language/details-tab.hbs" },
		light:                   { template: "systems/shadowdark/templates/items/basic/light-tab.hbs" },
		npcAttackDetails:        { template: "systems/shadowdark/templates/items/npc-attack/details-tab.hbs" },
		npcSpecialAttackDetails: { template: "systems/shadowdark/templates/items/npc-special-attack/details-tab.hbs" },
		npcSpellDetails:         { template: "systems/shadowdark/templates/items/npc-spell/details-tab.hbs" },
		patronDetails:           { template: "systems/shadowdark/templates/items/patron/details-tab.hbs" },
		potionDetails:           { template: "systems/shadowdark/templates/items/potion/details-tab.hbs" },
		propertyDetails:         { template: "systems/shadowdark/templates/items/property/details-tab.hbs" },
		magicPowerDetails:       { template: "systems/shadowdark/templates/items/magic-power/details-tab.hbs" },
		scrollDetails:           { template: "systems/shadowdark/templates/items/scroll/details-tab.hbs" },
		source:                  { template: "systems/shadowdark/templates/items/_partials/source-tab.hbs" },
		spellDetails:            { template: "systems/shadowdark/templates/items/spell/details-tab.hbs" },
		spellsKnown:             { template: "systems/shadowdark/templates/items/class/spells-known-tab.hbs" },
		talentDetails:           { template: "systems/shadowdark/templates/items/talent/details-tab.hbs" },
		titles:                  { template: "systems/shadowdark/templates/items/class/titles-tab.hbs" },
		wandDetails:             { template: "systems/shadowdark/templates/items/wand/details-tab.hbs" },
		weaponDetails:           { template: "systems/shadowdark/templates/items/weapon/details-tab.hbs" },
	}

	_getTabsConfig(group) {
		const tabs = foundry.utils.deepClone(super._getTabsConfig(group));

		switch (this.item.typeSlug)
		{
			case "ancestry":
				tabs.tabs.push({ id: 'ancestryDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "armor":
				tabs.tabs.push({ id: 'armorDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				this.assertVariableTab('effects', tabs, this.item.system.magicItem);
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "background":
				tabs.tabs.push({ id: 'effects', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.effects', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "basic":
				tabs.tabs.push({ id: 'basicDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				this.assertVariableTab('effects', tabs, this.item.system.magicItem);
				this.assertVariableTab('light', tabs, this.item.system.light.isSource);
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "body-parts":
				tabs.tabs.push({ id: 'bodyPartsDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.bodyPartsDetails', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "boon":
				tabs.tabs.push({ id: 'boonDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'effects', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.effects', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "class-ability":
				tabs.tabs.push({ id: 'classAbilityDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "class":
				tabs.tabs.push({ id: 'classDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'titles', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.titles', cssClass: "navigation-tab" })
				this.assertVariableTab('spellsKnown', tabs, this.item.system?.spellcasting?.class !== "__not_spellcaster__");
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "deity":
				tabs.tabs.push({ id: 'deityDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "effect":
				tabs.tabs.push({ id: 'effectDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'effects', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.effects', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "evolution-grid-type":
				tabs.tabs.push({ id: 'evolutionGridTypeDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.evolutionGridTypeDetails', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "gem":
				tabs.tabs.push({ id: 'gemDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "language":
				tabs.tabs.push({ id: 'languageDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "magic-power":
				tabs.tabs.push({ id: 'magicPowerDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'effects', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.effects', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "npc-attack":
				tabs.tabs.push({ id: 'npcAttackDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "npc-feature":
				tabs.tabs.push({ id: 'effects', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.effects', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "npc-special-attack":
				tabs.tabs.push({ id: 'npcSpecialAttackDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "npc-spell":
				tabs.tabs.push({ id: 'npcSpellDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "patron":
				tabs.tabs.push({ id: 'patronDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "potion":
				tabs.tabs.push({ id: 'potionDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'effects', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.effects', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "property":
				tabs.tabs.push({ id: 'propertyDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "scroll":
				tabs.tabs.push({ id: 'scrollDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "spell":
				tabs.tabs.push({ id: 'spellDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "talent":
				tabs.tabs.push({ id: 'talentDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'effects', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.effects', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "wand":
				tabs.tabs.push({ id: 'wandDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				tabs.tabs.push({ id: 'effects', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.effects', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
			case "weapon":
				tabs.tabs.push({ id: 'weaponDetails', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.details', cssClass: "navigation-tab active" })
				this.assertVariableTab('effects', tabs, this.item.system.magicItem);
				tabs.tabs.push({ id: 'description', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.description', cssClass: "navigation-tab" })
				tabs.tabs.push({ id: 'source', group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.source', cssClass: "navigation-tab" })
				break;
		}
		return tabs;
	}

	assertVariableTab(tabId, tabs, toggleProperty) {
		if (toggleProperty)
		{
			const effectsTab = { id: tabId, group: 'sheet', label: 'SHADOWDARK.sheet.item.tab.' + tabId, cssClass: "navigation-tab" };
			tabs.tabs.push(effectsTab)
			if (this.tabs && !this.tabs[tabId])
				this.tabs[tabId] = effectsTab;
		}
		else
		{
			if (this.tabs && this.tabs[tabId])
				delete this.tabs[tabId];
		}
	}

	async getTitle() {
		return `[${this.item.type}] ${this.item.name}`;
	}

	#createDragDropHandlers() {
		return this.options.dragDrop.map((d) => {
			d.permissions = {
				drop: this._canDragDrop.bind(this)
			}
			d.callbacks = {
				drop: this._onDrop.bind(this)
			}
			return new foundry.applications.ux.DragDrop.implementation(d);
		})
	}

	/** @inheritdoc */
	async _onRender(context, options) {
		this.#dragDrop.forEach((d) => d.bind(this.element));
		const prefixes = this.element.querySelectorAll('[data-action="prefix"]');
		if (prefixes && prefixes.length > 0)
		{
			for (let prefix of prefixes)
			{
				prefix.addEventListener("focusout", (event) => {
					this._onSetPrefix(event);
				});
			}
		}

		const suffixes = this.element.querySelectorAll('[data-action="suffix"]');
		if (suffixes && suffixes.length > 0)
		{
			for (let suffix of suffixes)
			{
				suffix.addEventListener("focusout", (event) => {
					this._onSetSuffix(event);
				});
			}
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

		this.hitLocationContexts = [];
		this.hitLocationCanvasses = [];
		for (let bodyPart of this.item.system.bodyParts ?? []) {
			let texture = await foundry.canvas.loadTexture(bodyPart.image);
			if (!texture) continue;

			const { frame, baseTexture } = texture;
			const w = frame.width, h = frame.height;
			const canvas = this.element.querySelector('.hitLocationMap canvas[name="' + bodyPart.name + '"]');
			if (!canvas) continue;

			canvas.width = w; canvas.height = h;
			const ctx = canvas.getContext('2d', { willReadFrequently: true });
			this.hitLocationCanvasses.push(canvas);
			this.hitLocationContexts.push(ctx);
			const src = baseTexture.resource.source;
			ctx.drawImage(src, frame.x, frame.y, w, h, 0, 0, w, h);
		}
		const hitLocation = this.element.querySelector('.hitLocationMap');
		if (hitLocation != null)
		{
			hitLocation.addEventListener("mousemove", (event) => {
				this._onHitLocationMouseMove(event);
			});
		}
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

	async getAncestrySelectorConfigs(context) {

		const [fixedLanguages, availableFixedLanguages] =
			await shadowdark.utils.getDedupedSelectedItems(
				await shadowdark.compendiums.languages(),
				this.item.system.languages?.fixed ?? []
			);

		const [selectedLanguages, availableSelectLanguages] =
		await shadowdark.utils.getDedupedSelectedItems(
			await shadowdark.compendiums.languages(),
			this.item.system.languages?.selectOptions ?? []
		);


		const ancestryNameTables =
			await shadowdark.compendiums.ancestryNameTables();

		context.ancestryNameTables = {};
		for (const ancestryNameTable of ancestryNameTables) {

			context.ancestryNameTables[ancestryNameTable.uuid] =
			ancestryNameTable.name.replace(/^Character\s+Names:\s/, "");
		}

		context.fixedLanguagesConfig = {
			availableItems: availableFixedLanguages,
			choicesKey: "languages.fixed",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.ancestry.languages.label"),
			name: "system.languages.fixed",
			prompt: game.i18n.localize("SHADOWDARK.ancestry.languages.prompt"),
			selectedItems: fixedLanguages,
		};

		context.languageChoicesConfig = {
			availableItems: availableSelectLanguages,
			choicesKey: "languages.selectOptions",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.language_choices.label"),
			name: "system.languages.selectOptions",
			prompt: game.i18n.localize("SHADOWDARK.class.language_choices.prompt"),
			selectedItems: selectedLanguages,
		};

		const [selectedTalents, availableTalents] =
			await shadowdark.utils.getDedupedSelectedItems(
				await shadowdark.compendiums.ancestryTalents(),
				this.item.system.talents ?? []
			);

		context.talentsConfig = {
			availableItems: availableTalents,
			choicesKey: "talents",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.ancestry.talents.label"),
			name: "system.talents",
			prompt: game.i18n.localize("SHADOWDARK.ancestry.talents.prompt"),
			selectedItems: selectedTalents,
		};

		const [selectedFixedTalents, availableFixedTalents] =
			await shadowdark.utils.getDedupedSelectedItems(
				await shadowdark.compendiums.ancestryTalents(),
				this.item.system.fixedTalents ?? []
			);

		context.fixedTalentsConfig = {
			availableItems: availableFixedTalents,
			choicesKey: "fixedTalents",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.ancestry.talents.label"),
			name: "system.fixedTalents",
			prompt: game.i18n.localize("SHADOWDARK.ancestry.talents.prompt"),
			selectedItems: selectedFixedTalents,
		};

		const [selectedLevelTalents, availableLevelTalents] =
			await shadowdark.utils.getDedupedSelectedItems(
				await shadowdark.compendiums.levelTalents(),
				this.item.system.levelTalents ?? []
			);

		context.levelTalentsConfig = {
			availableItems: availableLevelTalents,
			choicesKey: "levelTalents",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.level.talents.label"),
			name: "system.levelTalents",
			prompt: game.i18n.localize("SHADOWDARK.level.talents.prompt"),
			selectedItems: selectedLevelTalents,
		};
	}


	async getClassSelectorConfigs(context) {
		const [selectedArmor, availableArmor] =
			await shadowdark.utils.getDedupedSelectedItems(
				await shadowdark.compendiums.baseArmor(),
				this.item.system.armor ?? []
			);

		context.armorConfig = {
			availableItems: availableArmor,
			choicesKey: "armor",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.armor.label"),
			name: "system.armor",
			prompt: game.i18n.localize("SHADOWDARK.class.armor.prompt"),
			selectedItems: selectedArmor,
		};

		const classTalentTables =
			await shadowdark.compendiums.classTalentTables();

		context.classTalentTables = {};
		for (const classTalentTable of classTalentTables) {

			context.classTalentTables[classTalentTable.uuid] =
				classTalentTable.name.replace(/^Class\s+Talents:\s/, "");
		}

		const classTechniqueTables =
			await shadowdark.compendiums.classTechniqueTables();

		context.classTechniqueTables = {};
		for (const classTechniqueTable of classTechniqueTables) {

			context.classTechniqueTables[classTechniqueTable.uuid] =
				classTechniqueTable.name.replace(/^Class\s+Techniques:\s/, "");
		}

		const [fixedLanguages, availableFixedLanguages] =
		await shadowdark.utils.getDedupedSelectedItems(
			await shadowdark.compendiums.languages(),
			this.item.system.languages?.fixed ?? []
		);
		const [selectedLanguages, availableSelectLanguages] =
		await shadowdark.utils.getDedupedSelectedItems(
			await shadowdark.compendiums.languages(),
			this.item.system.languages?.selectOptions ?? []
		);

		context.fixedLanguagesConfig = {
			availableItems: availableFixedLanguages,
			choicesKey: "languages.fixed",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.languages.label"),
			name: "system.languages.fixed",
			prompt: game.i18n.localize("SHADOWDARK.class.language_choices.prompt"),
			selectedItems: fixedLanguages,
		};

		context.languageChoicesConfig = {
			availableItems: availableSelectLanguages,
			choicesKey: "languages.selectOptions",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.language_choices.label"),
			name: "system.languages.selectOptions",
			prompt: game.i18n.localize("SHADOWDARK.class.language_choices.prompt"),
			selectedItems: selectedLanguages,
		};

		const classTalents = await shadowdark.compendiums.classTalents();

		const [selectedTalents, availableTalents] =
			await shadowdark.utils.getDedupedSelectedItems(
				classTalents,
				this.item.system.talents ?? []
			);

		context.talentsConfig = {
			availableItems: availableTalents,
			choicesKey: "talents",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.talents.label"),
			name: "system.talents",
			prompt: game.i18n.localize("SHADOWDARK.class.talents.prompt"),
			selectedItems: selectedTalents,
		};
		
		const levelTalents = await shadowdark.compendiums.levelTalents();

		const [selectedLevelTalents, availableLevelTalents] =
			await shadowdark.utils.getDedupedSelectedItems(
				levelTalents,
				this.item.system.levelTalents ?? []
			);

		context.levelTalentsConfig = {
			availableItems: availableLevelTalents,
			choicesKey: "levelTalents",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.level.talents.label"),
			name: "system.levelTalents",
			prompt: game.i18n.localize("SHADOWDARK.level.talents.prompt"),
			selectedItems: selectedLevelTalents,
		};

		const [selectedTalentChoices, availableTalentChoices] =
			await shadowdark.utils.getDedupedSelectedItems(
				classTalents,
				this.item.system.talentChoices ?? []
			);

		context.talentChoicesConfig = {
			availableItems: availableTalentChoices,
			choicesKey: "talentChoices",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.talent_choices.label"),
			name: "system.talentChoices",
			prompt: game.i18n.localize("SHADOWDARK.class.talent_choices.prompt"),
			selectedItems: selectedTalentChoices,
		};
		//
		const classAbilities = await shadowdark.compendiums.classAbilities();

		const [selectedClassAbilities, availableClassAbilities] =
			await shadowdark.utils.getDedupedSelectedItems(
				classAbilities,
				this.item.system.classAbilities ?? []
			);

		context.classAbilitiesConfig = {
			availableItems: availableClassAbilities,
			choicesKey: "classAbilities",
			isItem: true,
			label: "CLASS.ABILITIES.LABEL", // game.i18n.localize("SHADOWDARK.class.talents.label"),
			name: "system.classAbilities",
			prompt: "CLASS.ABILITIES.PROMPT", // game.i18n.localize("SHADOWDARK.class.talents.prompt"),
			selectedItems: selectedClassAbilities,
		};

		const [selectedClassAbilityChoices, availableClassAbilityChoices] =
			await shadowdark.utils.getDedupedSelectedItems(
				classAbilities,
				this.item.system.classAbilityChoices ?? []
			);

		context.classAbilityChoicesConfig = {
			availableItems: availableClassAbilityChoices,
			choicesKey: "classAbilityChoices",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.talent_choices.label"),
			name: "system.classAbilityChoices",
			prompt: game.i18n.localize("SHADOWDARK.class.talent_choices.prompt"),
			selectedItems: selectedClassAbilityChoices,
		};

		const spellcastingClasses =
			await shadowdark.compendiums.spellcastingBaseClasses();

		context.spellcastingClasses = {};
		for (const spellcastingClass of spellcastingClasses) {
			if (spellcastingClass.name === this.item.name) continue;
			context.spellcastingClasses[spellcastingClass.uuid] =
				spellcastingClass.name;
		}

		const [selectedWeapons, availableWeapons] =
			await shadowdark.utils.getDedupedSelectedItems(
				await shadowdark.compendiums.baseWeapons(),
				this.item.system.weapons ?? []
			);

		context.weaponsConfig = {
			availableItems: availableWeapons,
			choicesKey: "weapons",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.weapons.label"),
			name: "system.weapons",
			prompt: game.i18n.localize("SHADOWDARK.class.weapons.prompt"),
			selectedItems: selectedWeapons,
		};

		//shadowdark.debug(this.item.system.fixedLevelTalents);
	}


	async getSources(context) {
		context.sources = await shadowdark.compendiums.sources();

		const itemSource = context.sources.find(
			s => s.uuid === context.item.system.source?.title
		);

		context.sourceLoaded = itemSource || context.item.system.source?.title === ""
			? true
			: false;
	}

	async getSpellSelectorConfigs(context) {
		const [selectedClasses, availableClasses] =
			await shadowdark.utils.getDedupedSelectedItems(
				await shadowdark.compendiums.spellcastingBaseClasses(),
				this.item.system.class ?? []
			);

		context.spellcasterClassesConfig = {
			availableItems: availableClasses,
			choicesKey: "class",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.spell.classes.label"),
			name: "system.class",
			prompt: game.i18n.localize("SHADOWDARK.spell.classes.prompt"),
			selectedItems: selectedClasses,
		};
	}

	/** @override */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);

		switch (partId)
		{
			case "tabs":
				const tabsArray = this._getTabsConfig('sheet').tabs;
				let newTabs = tabsArray.reduce((acc, tab) => {
					acc[tab.id] = tab;
					return acc;
				}, {});
				if (!this.tabs)
					this.tabs = newTabs;

				context.tabs = this.tabs;
				break;
			case "ancestryDetails":
				await this.getAncestrySelectorConfigs(context);
				await this.getSheetDataForAncestryItem(context);
				if (!this.item.system.fixedTalents) this.item.system.fixedTalents = [];
				break;
			case "armorDetails":
				await this.getSheetDataForArmorItem(context);
				break;
			case "basic":
			case "basicDetails":
				await this.getSheetDataForBasicItem(context);
				break;
			case "bodyPartsDetails":
				await this.getSheetDataForBodyParts(context);
				break;
			case "class":
				await this.getSheetDataForClassItem(context);
				break;
			case "effectDetails":
				await this.getSheetDataForEffectItem(context);
				break;
			case "light":
				await this.getSheetDataForLight(context);
				break;
			case "npcAttack":
				await this.getSheetDataForNPCAttackItem(context);
				break;
			case "npcSpecialAttack":
				await this.getSheetDataForNPCSpecialAttackItem(context);
				break;
			case "spell":
				await this.getSheetDataForNPCSpellItem(context);
				break;
			case "patronDetails":
				await this.getSheetDataForPatronItem(context);
				break;
			case "classDetails":
				await this.getClassSelectorConfigs(context);
				if (!this.item.system.levelTalents) this.item.system.levelTalents = [];
				break;
			case "propertyDetails":
				if (this.item.system.itemType === "magic_item" ||
					this.item.system.itemType === "magic_armor" ||
					this.item.system.itemType === "magic_weapon" ||
					this.item.system.itemType === "magic_melee_weapon" ||
					this.item.system.itemType === "magic_ranged_weapon")
					context.showMagicalNomenclature = true;
				else
					context.showMagicalNomenclature = false;

				if (this.item?.system?.prefixes)
					context.prefixes = this.item.system.prefixes;
				if (this.item?.system?.suffixes)
					context.suffixes = this.item.system.suffixes;
				break;
			case "magicPowerDetails":
				if (!this.item.system.runes) this.item.system.runes = [];
				else if (!Array.isArray(this.item.system.runes)) this.item.system.runes = [];
				context.availableRunes = [];
				context.chosenRunes = [];
				context.runesChoicesKey = this.item.id + '_runes';

				for (var rune of BritannianMagicSD.runes) {
					if (this.item.system.runes.some(r => r === rune.uuid))
						context.chosenRunes.push(rune);
					else
						context.availableRunes.push(rune);
				}
				break;
			case "scroll":
				await this.getSheetDataForScrollItem(context);
				break;
			case "spellDetails":
				await this.getSpellSelectorConfigs(context);
				await this.getSheetDataForSpellItem(context);
				break;
			case "talent":
				await this.getSheetDataForTalentItem(context);
				break;
			case "wand":
				await this.getSheetDataForWandItem(context);
				break;
			case "source":
				await this.getSources(context);
				break;
			case "weaponDetails":
				await this.getSheetDataForWeaponItem(context);
				break;
		}

		return context;
	}

	/** @override */
	async _prepareContext(options) {
		if (this.firstLoad) {
			this.firstLoad = false;
			this.loadingDialog = await new shadowdark.apps.LoadingSD().render(true);
		}

		const context = await super._prepareContext(options);
		if (this.item.typeSlug === 'evolution-grid-type')
		{
			if (!this.item.system.evolutionGrid)
			{
				this.item.system.evolutionGrid = {
					choices: {
						firstLevel: 5,
						evenLevels: 2,
						oddLevels: 2
					}
				};
				this.item.update({'system.evolutionGrid': this.item.system.evolutionGrid});
			}
		}
		else if (this.item.typeSlug === 'body-parts')
		{
			if (!this.item.system.bodyParts || this.item.system.bodyParts.length == 0)
			{
				this.item.system.bodyParts = [
					{
						name: "Background",
						toHit: 0,
						image: "systems/shadowdark/assets/body_parts/human-m-full.png",
						effect: ""
					}
				];
				this.item.update({'system.bodyParts': this.item.system.bodyParts});
			}
		}

		context.item = this.item;

		foundry.utils.mergeObject(context, {
			config: CONFIG.SHADOWDARK,
			editable: this.isEditable,
			itemType: game.i18n.localize(`SHADOWDARK.item.type.${context.item.type}`),
			predefinedEffects: await shadowdark.effects.getPredefinedEffectsList(),
			system: context.item.system,
		});

		context.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			context.system.description,
			{
				secrets: context.item.isOwner,
				async: true,
				relativeTo: this.item,
			}
		);
		
		context.showSpells = game.settings.get("shadowdark", "use_coreSpellcasting");
		context.showSeirizianMagic = game.settings.get("shadowdark", "use_seiriziaSpellcasting");
		context.showBritannianMagic = game.settings.get("shadowdark", "use_britannianRuneMagic");

		// Call any type-specific methods for this item type to gather
		// additional data for the sheet
		//
		const itemTypeSafeName = context.item.type.replace(/\s/g, "");
		const itemTypeFunctionName = `getSheetDataFor${itemTypeSafeName}Item`;

		if (typeof this[itemTypeFunctionName] === "function") {
			await this[itemTypeFunctionName](context);
		}

		context.requirementsChosen = true;
		if (!this.item.system.requirements || this.item.system.requirements.length === 0)
			context.requirementsChosen = false;

		context.allowsCrafting = false;
		if (this.item.system.craftablePotion)
			context.allowsCrafting = true;

		context.craftTargetsChosen = true;
		if (!this.item.system.craftTargets || this.item.system.craftTargets.length === 0)
			context.craftTargetsChosen = false;

		context.craftRecipeChosen = true;
		if (!this.item.system.craftRecipe || this.item.system.craftRecipe.length === 0)
			context.craftRecipeChosen = false;

		return context;
	}

	async _onFirstRender(context, options)
	{
		// loading is finished, pull down the loading screen
		if (this.loadingDialog)
		{
			this.loadingDialog.close({force: true});
			this.loadingDialog = null;
		} 

		await super._onFirstRender(context, options);
	}

	// ------------------------------------------------------------------------
	// Type-specific methods are used to gather any additional data necessary
	// for rendering the item sheet.
	//
	// These methods are called using reflection from the main getData() method
	// and should be named as follows:
	//
	//     getSheetDataFor{item_type_with_no_spaces}Item
	// ------------------------------------------------------------------------

	async getSheetDataForAncestryItem(context) {
		await this.getAncestrySelectorConfigs(context);
	}


	async getSheetDataForArmorItem(context) {
		context.propertyItems = await context.item.propertyItems();

		const mySlug = context.item.name.slugify();

		context.baseArmor = await shadowdark.utils.getSlugifiedItemList(
			await shadowdark.compendiums.baseArmor()
		);

        context.showHitLocation = game.settings.get("shadowdark", "hitLocation");
		if (context.showHitLocation) {
			context.coverageItems = context.item.system.coverage;
			//let defaultBodyType = await CompendiumsSD.defaultBodySetup(true);
			//context.coverageItems = defaultBodyType.system.bodyParts;
		}

		delete context.baseArmor[mySlug];
	}


	async getSheetDataForBasicItem(context) {
		const item = context.item;
		if (!item) return;

		if (item.system.light?.isSource) {
			if (!item.system.light.hasBeenUsed) {
				// Unused light sources should always have their remaining time
				// at maximum
				const maxRemaining = item.system.light.longevityMins * 60; // seconds

				if (item.system.light.remainingSecs !== maxRemaining) {
					item.setLightRemaining(maxRemaining);
					item.system.light.remainingSecs = maxRemaining;
				}

				context.lightRemainingMins = item.system.light.longevityMins;
			}
			else {
				context.lightRemainingMins = Math.floor(
					item.system.light.remainingSecs / 60
				);
			}
			const lightRemainingSetting = (game.user.isGM)? 2 : game.settings.get("shadowdark", "playerShowLightRemaining");
			context.showRemainingMins = lightRemainingSetting > 1;

			if (item.system.light.intensity)
				context.lightIntensity = item.system.light.intensity;
			else {
				const lightSources = await foundry.utils.fetchJsonWithTimeout("systems/shadowdark/assets/mappings/map-light-sources.json");
				context.lightIntensity = lightSources[item.system.light.template].light.dim;
			}
		}

		item.potion = item.isPotion();
	}

	async getSheetDataForBodyParts(context) {
		context.owner = game.user.isGM;
		context.parts = this.item.system.bodyParts;
	}

	async getSheetDataForClassItem(context) {
		await this.getClassSelectorConfigs(context);

		context.spellsKnown =
			context.item.system.spellcasting.class !== "__not_spellcaster__";
	}


	async getSheetDataForEffectItem(context) {
		if (context.item.system.duration)
			context.variableDuration = CONFIG.SHADOWDARK.VARIABLE_DURATIONS
				.includes(context.item.system.duration.type);

		if (context.item.typeSlug === 'magic-power' && context.item.effects && (context.item.effects.contents ?? []).length > 0)
			context.showEffectChanges = true;
	}

	async getSheetDataForLight(context) {
		context.unlitIcon = context.item.system.unlitIcon ?? context.item.img;
		context.litIcon = context.item.system.litIcon ?? context.item.img;
		context.expendedIcon = context.item.system.expendedIcon ?? context.item.img;
		context.fuelSources = context.item.system.fuelSources;
		context.fuelChosen = context.item.system.fuelSources && context.item.system.fuelSources.length;
	}

	async getSheetDataForNPCAttackItem(context) {
		context.npcAttackRangesDisplay = context.item.npcAttackRangesDisplay();
	}


	async getSheetDataForNPCSpecialAttackItem(context) {
		context.npcAttackRangesDisplay = context.item.npcAttackRangesDisplay();
	}


	async getSheetDataForNPCSpellItem(context) {
		context.variableDuration = CONFIG.SHADOWDARK.VARIABLE_DURATIONS
			.includes(context.item.system.duration.type);
	}


	async getSheetDataForPatronItem(context) {
		const patronBoonTables =
			await shadowdark.compendiums.patronBoonTables();

		context.patronBoonTables = {};

		for (const patronBoonTable of patronBoonTables) {
			context.patronBoonTables[patronBoonTable.uuid] =
				patronBoonTable.name.replace(/^Patron\s+Boons:\s/, "");
		}
	}


	async getSheetDataForScrollItem(context) {
		await this.getSpellSelectorConfigs(context);

		context.variableDuration = CONFIG.SHADOWDARK.VARIABLE_DURATIONS
			.includes(context.item.system.duration.type);
	}


	async getSheetDataForSpellItem(context) {
		await this.getSpellSelectorConfigs(context);

		context.variableDuration = CONFIG.SHADOWDARK.VARIABLE_DURATIONS
			.includes(context.item.system.duration?.type);
	}


	async getSheetDataForTalentItem(context) {
		context.showsLevelInput = {
			ancestry: false,
			class: false,
			level: true,
			patronBoon: true,
			technique: false,
			nanoMagic: false,
			auraMagic: false,
			metalMagic: false,
			abyssalMagic: false,
			mistMagic: false,
		};
		context.showsPowerSelection = {
			ancestry: false,
			class: false,
			level: false,
			patronBoon: false,
			technique: false,
			nanoMagic: false,
			auraMagic: true,
			metalMagic: true,
			abyssalMagic: true,
			mistMagic: true,
		};
		context.resistedBy = {
			ancestry: false,
			class: false,
			level: false,
			patronBoon: false,
			technique: false,
			nanoMagic: false,
			auraMagic: true,
			metalMagic: false,
			abyssalMagic: true,
			mistMagic: false,
		};
		context.hasHPCost = {
			ancestry: false,
			class: false,
			level: false,
			patronBoon: false,
			technique: false,
			nanoMagic: false,
			auraMagic: true,
			metalMagic: false,
			abyssalMagic: false,
			mistMagic: false,
		};
	}


	async getSheetDataForWandItem(context) {
		await this.getSpellSelectorConfigs(context);

		context.variableDuration = CONFIG.SHADOWDARK.VARIABLE_DURATIONS
			.includes(context.item.system.duration.type);
	}


	async getSheetDataForWeaponItem(context) {
		context.propertyItems = await context.item.propertyItems();

		const mySlug = context.item.name.slugify();

		context.ammunition = await shadowdark.utils.getSlugifiedItemList(
			await shadowdark.compendiums.ammunition()
		);

		context.baseWeapons = await shadowdark.utils.getSlugifiedItemList(
			await shadowdark.compendiums.baseWeapons()
		);

		context.item.potion = context.propertyItems.some(p => p && p.name.slugify() === 'potion');

		delete context.baseWeapons[mySlug];
	}


	/** @inheritdoc */
	_canDragDrop(selector) {
		return this.isEditable;
	}

	static async #onEditImage(event, target) {
		const field = target.dataset.field || "img";
		const current = foundry.utils.getProperty(this.document, field);

		const fp = new foundry.applications.apps.FilePicker({
			type: "image",
			current: current,
			callback: (path) => {
				this.item[field] = path;
				this.document.update({ [field]: path });
				this.render();
			}
		});

		await fp.render(true);
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
		const choicesKey = target.dataset.name ?? target.dataset.choicesKey;

		// handles cases where choicesKey is nested property.
		const currentChoices = choicesKey
			.split(".")
			.reduce((obj, path) => obj ? obj[path]: [], this.item.system);

		const newChoices = [];
		for (const itemUuid of currentChoices) {
			if (itemUuid === deleteUuid) continue;
			newChoices.push(itemUuid);
		}

		const dataKey = `system.${choicesKey}`;
		await this.item.update({[dataKey]: newChoices});
		this.render(true);
	}

	/** @inheritdoc */
	async _onChangeInput(event) {

		// Test Effects value change
		// Modify the effect when field is modified
		if (event.target?.id === "effect-change-value") {
			return await this._onEffectChangeValue(event, null);
		}

		// Test for Predefiend Effects
		// Create effects when added through the predefined effects input
		if (event.target?.name === "") {
			const key = event.target.value;
			return shadowdark.effects.createPredefinedEffect(null, key);
		}

		// Test for Effect Duration Change
		// If the change value is the duration field(s)
		const durationTarget = [
			"system.duration.type",
			"system.duration.value",
		].includes(event.target?.name);

		const durationClassName =
			event.target?.parentElement.id === "effect-duration";

		if (durationTarget && durationClassName) {
			if (event.target.name === "system.duration.value") {
				this.item.system.duration.value = event.target.value;
			}
			await this._onUpdateDurationEffect();
		}

		// Test for multi-choice selector
		// We only have to do something special if we're handling a multi-choice
		// datalist

		const choicesKey = target.dataset.choicesKey;
		const isItem = target.dataset.isItem === "true";
		if (event.target.list && choicesKey) {
			return await this._onChangeChoiceList(event, choicesKey, isItem);
		}

		await super._onChangeInput(event);
	}

	async _onChangeChoiceList(event, choicesKey, isItem) {
		const options = event.target.list.options;
		const value = event.target.value;

		let uuid = null;
		for (const option of options) {
			if (option.value === value) {
				uuid = option.getAttribute("data-uuid");
				break;
			}
		}

		if (uuid === null) return;

		// handles cases where choicesKey is nested property.
		let currentChoices = choicesKey
			.split(".")
			.reduce((obj, path) => obj ? obj[path]: [], this.item.system);

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

		return this.item.update({[event.target.name]: sortedChoiceUuids});
	}

	static async #onClassTitleAdd(event, target) {
		if (!this.isEditable) return;

		event.preventDefault();
		event.stopPropagation();

		const titles = this.item.system.titles ?? [];
		const toValues = [0];

		titles.forEach(t => {
			toValues.push(t.to);
		});

		const max = Math.max(...toValues) + 1;

		titles.push({
			from: max,
			to: max + 1,
			lawful: "",
			neutral: "",
			chaotic: "",
		});

		this.item.update({"system.titles": titles});

	}

	async _onClassTitleUpdate(target) {
		let index = parseInt(target.dataset.index);
		let key = target.name;
		let value = target.value;
		const titles = this.item.system.titles ?? [];
		
		switch(key)
		{
			case 'title.from':
				titles[index].from = parseInt(value);
				break;
			case 'title.to':
				titles[index].to = parseInt(value);
				break;
			case 'title.lawful':
				titles[index].lawful = value;
				break;
			case 'title.chaotic':
				titles[index].chaotic = value;
				break;
			case 'title.neutral':
				titles[index].neutral = value;
				break;
		}

		this.item.update({"system.titles": titles});
	}

	static async #onClassTitleDelete(event, target) {
		if (!this.isEditable) return;
		event.preventDefault();
		event.stopPropagation();

		const index = Number.parseInt(target.dataset.index);
		const titles = this.item.system.titles ?? [];
		const newTitles = [];

		for (let i = 0; i < titles.length; i++) {
			if (index === i) continue;
			newTitles.push(titles[i]);
		}

		this.item.update({"system.titles": newTitles});
	}

	async _onEffectChangeValue(event, effectId) {
		//const li = event.target.closest("li");
		//const effectId = li.dataset.effectId;
		const effect = this.item.effects.get(effectId);

		//shadowdark.debug(`Modifying talent ${event.target.name} (${effectId}) with value ${event.target.value}`);
		const updates = {};

		const value = (isNaN(parseInt(event.target.value, 10)))
			? event.target.value
			: parseInt(event.target.value, 10);

		// Check the changes
		updates.changes = effect.changes.map(ae => {
			if (ae.key === event.target.name) {
				ae.value = value;
			}
			return ae;
		});

		// Set the duration
		updates.duration = this._getDuration();

		await effect.update(updates);

		//return await super._onChangeInput(event);
	}

	/** @inheritdoc */
	async _onDrop(event) {
		const data = foundry.applications.ux.TextEditor.getDragEventData(event);

		switch (data.type) {
			case "Item":
				return this._onDropItemSD(event, data);
			case "RollTable":
				return this._onDropTable(event, data);
			default:
				return super._onDrop();
		}
	}

	async _onDropItemSD(event, data) {
		const myType = this.item.type;

		// Allow the dropping of spells onto the following Item types to make
		// creating them easier

		const allowedType = ["Potion", "Scroll", "Wand"].includes(myType);

		const droppedItem = await fromUuid(data.uuid);
		const isSpellDrop = droppedItem.type === "Spell";
		const isPowerDrop = droppedItem.type === "Talent" && droppedItem.system.isPower;
		
		if (this.item.system.isPower && isPowerDrop)
		{
			//shadowdark.debugObject(droppedItem);
			if (!this.item.system.requirements) this.item.system.requirements = [];
			this.item.system.requirements.push(droppedItem);
			this.item.update({"system.requirements": this.item.system.requirements});
		}

		if (this.item.system.light && droppedItem.type == 'Basic' && event.target.dataset.type == "lightFuel") {
			if (!this.item.system.fuelSources) this.item.system.fuelSources = [];
			const fuelSource = {
				name: droppedItem.name, 
				uuid: droppedItem.uuid
			}

			if (!this.item.system.fuelSources.some(s => s.uuid == droppedItem.uuid))
			{
				this.item.system.fuelSources.push(fuelSource);
			}

			this.item.update({"system.fuelSources": this.item.system.fuelSources});
			return;
		}

		if (myType == 'Talent' && data.type == 'Item' && this.item.system.craftablePotion)
		{
			const droppedItem = await fromUuid(data.uuid);
			if (droppedItem.isPotion() || await droppedItem.hasProperty('potion'))
			{
				const pushData = {
					name: droppedItem.name,
					_id: droppedItem._id,
					uuid: droppedItem.uuid,
					img: droppedItem.img
				}

				if (!this.item.system.craftTargets) this.item.system.craftTargets = [];
				this.item.system.craftTargets.push(pushData);
				this.item.update({"system.craftTargets": this.item.system.craftTargets});
			}
			return;
		}

		if (data.type == 'Item' && this.item.system.craftable)
		{
			const droppedItem = await fromUuid(data.uuid);

			const pushData = {
				name: droppedItem.name,
				_id: droppedItem._id,
				uuid: droppedItem.uuid,
				img: droppedItem.img,
				quantity: 1
			}

			if (!this.item.system.craftRecipe) this.item.system.craftRecipe = [];

			const craftRecipe = this.item.system.craftRecipe.find(r => r.uuid === droppedItem.uuid);
			if (craftRecipe) {
				craftRecipe.quantity++;
			} else {
				this.item.system.craftRecipe.push(pushData);
			}

			this.item.update({"system.craftRecipe": this.item.system.craftRecipe});
			return;
		}

		if (!(allowedType && isSpellDrop)) return super._onDrop();

		const name = game.i18n.format(
			`SHADOWDARK.item.name_from_spell.${myType}`,
			{spellName: droppedItem.name}
		);

		const updateData = {
			name,
			system: droppedItem.system,
			// TODO Add some kind of default cost to the new item?
		};

		delete updateData.system.lost;
		updateData.system.magicItem = true;
		updateData.system.spellName = droppedItem.name;

		this.item.update(updateData);
	}

	async _onDropTable(event, data) {
		if (this.item.type === "Ancestry") {
			this.item.update({"system.nameTable": data.uuid});
		}
	}

	static async #onRemoveTable(event, data) {
		this.item.update({"system.nameTable": ""});
	}

	static async #onItemSelection(event, target) {
		event.preventDefault();

		const itemType = target.dataset.itemType;
		const selectType = target.dataset.selectType;

		switch (selectType) {
			case "class":
				new select.ClassSelector(this.item).render(true);
				break;
			case "itemProperty":
				if (itemType === "armor" && !this.item.system.magicItem) {
					new select.ArmorPropertySelector(this.item).render(true);
				}
				else if (itemType === "armor" && this.item.system.magicItem) {
					new select.MagicArmorPropertySelector(this.item).render(true);
				}
				else if (itemType === "weapon" && !this.item.system.magicItem) {
					new select.WeaponPropertySelector(this.item).render(true);
				}
				else if (itemType === "weapon" && this.item.system.magicItem) {
					new select.MagicWeaponPropertySelector(this.item).render(true);
				}
				break;
			case "itemCoverage":
				new select.DefaultBodyTypePartSelector(this.item).render(true);
				break;
		}
	}

	_onMagicItemTypeProperties(event) {
		event.preventDefault();

		if (!this.isEditable) return;

		new shadowdark.apps.MagicItemEffectsSD(
			this.item, {event: event}
		).render(true);
	}

	static async #onNpcAttackRanges(event, target) {
		event.preventDefault();

		if (!this.isEditable) return;

		new shadowdark.apps.NpcAttackRangesSD(
			this.item, {event: event}
		).render(true);
	}

	/** @inheritdoc */
	static async #onSubmit(event, form, formData) {
		// convert light remain from minutes to secsonds for update
		if (formData["system.light.remainingSecs"]) {
			formData["system.light.remainingSecs"] = formData["system.light.remainingSecs"] * 60;
		}

		if (!this.isEditable) return;

		if (event.target.name === "system.newExtraDamage")
			await this._onNewExtraDamage(event.target);
		else if (event.target.name === "system.extraDamage" || event.target.name === "system.extraDamageType")
			await this._onEditExtraDamage(event.target);
		else if (this.item.type === 'Class' && event.target.name.startsWith("title."))
			await this._onClassTitleUpdate(event.target);
		else if (event.target.name.startsWith("body-part"))
			await this._onUpdateBodyPart(event.target);
		else if (event.target.id === 'effect-change-value')
		{
			let effectId = event.target.dataset.effectId;
			if (effectId)
				await this._onEffectChangeValue(event, effectId);
		}
		else if (event.target.name === 'craftRecipeQuantity')
			await this._onUpdateCraftRecipeQuantity(event.target);
		else if (UtilitySD.isNestedPropertyArray(this.item, event.target.name))
		{
			let uuid = UtilitySD.getSelectedUuid(form, event.target);

			if (uuid)
			{
				UtilitySD.setNestedProperty(this.item, event.target.name, uuid);
				await this.item.update({[event.target.name]: UtilitySD.getNestedProperty(this.item, event.target.name)});
			}
		}
		else if (event.target.name === 'predefinedEffects')
			shadowdark.effects.fromPreDefined(this.item, event.target.value);
		else if (event.target.name === 'system.description')
			await this.item.update({[event.target.name]: event.target.value});
		else if (event.target.name === 'system.light.remainingSecs')
			await this.item.update({[event.target.name]: parseInt(event.target.value) * 60});
		else if (event.target.type === 'checkbox')
			await this.item.update({[event.target.name]: event.target.checked});
		else if (event.target.type === 'number')
			await this.item.update({[event.target.name]: parseInt(event.target.value)});
		else
			await this.item.update({[event.target.name]: event.target.value});

		switch (this.item.type) {
			case "Armor":
			case "Ancestry":
			case "Class":
			case "Scroll":
			case "Spell":
			case "Wand":
			default:
				break;
		}
		await this.render();
	}

	_onTalentTypeProperties(event) {
		event.preventDefault();

		if (!this.isEditable) return;

		new shadowdark.apps.TalentTypesSD(
			this.item, {event: event}
		).render(true);
	}

	async _onUpdateDurationEffect() {
		if (!this.isEditable) return;
		this.item.effects.map(e => e.update({duration: this._getDuration()}));
	}


	/**
	 * Returns duration data for an active effect. This is used
	 * to make sure the effect will show on a token icon.
	 * @returns {object}
	 */
	_getDuration() {
		const duration = {
			rounds: null,
			seconds: null,
		};

		// Set duration
		if (
			this.item.system.tokenIcon?.show
			&& !["unlimited", "focus", "instant", "permanent"].includes(this.item.system.duration.type)
		) {
			if (this.item.system.duration.type === "rounds") {
				duration.rounds = this.item.system.duration.value;
			}
			else {
				duration.seconds =
				this.item.system.duration.value
					* (CONFIG.SHADOWDARK.DURATION_UNITS[this.item.system.duration.type] ?? 0);
			}
		}

		// If the show token icon is checked and it is either a condition OR the setting for always
		// showing passive effects is checked in settings, we set a duration that won't tick down.
		if (
			this.item.system.tokenIcon?.show
			&& (
				this.item.system.category === "condition"
				|| game.settings.get("shadowdark", "showPassiveEffects")
			)
			&& ["unlimited", "focus", "instant", "permanent"].includes(this.item.system.duration.type)
		) {
			duration.seconds = 4201620;
		}

		return duration;
	}

	static async #onDeleteCraftTarget(event, target) {
		const targetId = target.dataset.id;
		var target = this.item.system.craftTargets.find(r => r._id === targetId);
		var index = this.item.system.craftTargets.indexOf(target);
		this.item.system.craftTargets.splice(index, 1);
		this.item.update({"system.craftTargets": this.item.system.craftTargets});
	}

	static async #onDeleteCraftRecipeItem(event, target) {
		const targetId = target.dataset.id;
		var target = this.item.system.craftRecipe.find(r => r._id === targetId);
		var index = this.item.system.craftRecipe.indexOf(target);
		this.item.system.craftRecipe.splice(index, 1);
		this.item.update({"system.craftRecipe": this.item.system.craftRecipe});
	}

	static async #onDeleteRequirement(event, target) {
		const requirementId = target.dataset.id;
		var requirement = this.item.system.requirements.find(r => r._id === requirementId);
		var index = this.item.system.requirements.indexOf(requirement);
		this.item.system.requirements.splice(index, 1);
		this.item.update({"system.requirements": this.item.system.requirements});
	}

	static async #onAddPrefix(event, target) {
		if (!this.item.system.prefixes) this.item.system.prefixes = [];
		this.item.system.prefixes.push({text: "", id: this.item.system.prefixes.length});
		this.item.update({"system.prefixes": this.item.system.prefixes});
		this.render(true);
	}

	static async #onAddSuffix(event, target) {
		if (!this.item.system.suffixes) this.item.system.suffixes = [];
		this.item.system.suffixes.push({text: "", id: this.item.system.suffixes.length});
		this.item.update({"system.suffixes": this.item.system.suffixes});
		this.render(true);
	}

	static async #onRemovePrefix(event, target) {
		var id = target.dataset.index;
		if (id >= 0 && id < this.item.system.prefixes.length)
			this.item.system.prefixes.splice(id, 1);

		this.item.update({"system.prefixes": this.item.system.prefixes});
		this.render(true);
	}

	static async #onRemoveSuffix(event, target) {
		var id = target.dataset.index;
		if (id >= 0 && id < this.item.system.suffixes.length)
			this.item.system.suffixes.splice(id, 1);

		this.item.update({"system.suffixes": this.item.system.suffixes});
		this.render(true);
	}

	async _onSetPrefix(event, target) {
		var id = target.dataset.index;
		var text = event.target.value;
		this.item.system.prefixes[id].text = text;
		this.item.update({"system.prefixes": this.item.system.prefixes});
	}

	async _onSetSuffix(event, target) {
		var id = target.dataset.index;
		var text = event.target.value;
		this.item.system.suffixes[id].text = text;
		this.item.update({"system.suffixes": this.item.system.suffixes});
	}

	async _onSetDescription(event, fieldName) {
		const newDesc = event.currentTarget.innerHTML;
		if (newDesc != null)
		{
			UtilitySD.setNestedProperty(this.item, fieldName, newDesc);
			await this.item.update({[fieldName]: newDesc});
		}
		else
			shadowdark.log(`Setting Description to NULL.`);
	}

	static async #manageActiveEffect(event, target) {
		shadowdark.effects.onManageActiveEffect(event, this.item, target);
	}

	static async #onOpenEvolutionGrid(event, target) {
		if (!this.evolutionGrid)
			this.evolutionGrid = new EvolutionGridSD({type: this.item});
		this.evolutionGrid.render(true);

	}

	static async #onAddBodyPart(event, target) {
		let bodyPart = {
			name: "Part",
			toHit: 0,
			image: "systems/shadowdark/assets/body_parts/human-m-full.png"
		}

		this.item.system.bodyParts.unshift(bodyPart);
		await this.item.update({['system.bodyParts']: this.item.system.bodyParts});
		this.render(true);
	}

	static async #onRemoveBodyPart(event, target) {
		const index = target.dataset.index;
		this.item.system.bodyParts.splice(index, 1);
		await this.item.update({['system.bodyParts']: this.item.system.bodyParts});
		this.render(true);
	}

	static async #onSubPartSetup(event, target) {
		const index = target.dataset.index;
		const bodyPart = this.item.system.bodyParts[index];
		if (!bodyPart.subParts) bodyPart.subParts = [];
		const subparts = new BodySubpartSD({index, bodyPart, sheet: this});
		subparts.render(true);
	}

	static async #onEditBodyPartImage(event, target) {
		const index = target.dataset.index;
		const current = this.item.system.bodyParts[index].image;

		const fp = new foundry.applications.apps.FilePicker({
			type: "image",
			current: current,
			callback: async(path) => {
				this.item.system.bodyParts[index].image = path;
				await this.item.update({['system.bodyParts']: this.item.system.bodyParts});
				this.render();
			}
		});

		await fp.render(true);
	}

	static async #onDefaultBodySetup(event, target) {
		this.item.system.defaultBodySetup = target.checked;
		await this.item.update({['system.defaultBodySetup']: this.item.system.defaultBodySetup});
	}

	async _onUpdateBodyPart(target) {
		const index = target.dataset.index;
		switch (target.name) {
			case "body-part-name":
				this.item.system.bodyParts[index].name = target.value;
				break;
			case "body-part-toHit":
				this.item.system.bodyParts[index].toHit = target.value;
				break;
			case "body-part-effect":
				this.item.system.bodyParts[index].effect = target.value;
				break;
			case "body-part-image":
				this.item.system.bodyParts[index].image = target.value;
				break;
		}
		await this.item.update({['system.bodyParts']: this.item.system.bodyParts});
	}

	async _onUpdateCraftRecipeQuantity(target) {
		const targetId = target.dataset.id;
		var recipeItem = this.item.system.craftRecipe.find(r => r._id === targetId);

		const value = parseInt(target.value);
		recipeItem.quantity = value;
		
		this.item.update({"system.craftRecipe": this.item.system.craftRecipe});
	}

	async _onHitLocationMouseMove(event) {
		const baseCanvas = this.element.querySelector('.hitLocationMap canvas[name="Background"]');
		if (!baseCanvas) return;

		const dispW = baseCanvas.clientWidth;
		const dispH = baseCanvas.clientHeight;

		const natW = baseCanvas.width;
		const natH = baseCanvas.height;

		let scaleX = natW / dispW;
		let scaleY = natH / dispH;

		const rect = event.currentTarget.getBoundingClientRect();

		const x = (event.clientX - rect.left) * scaleX;
		const y = (event.clientY - rect.top) * scaleY;

		let selectedIndex = -1;
		for (let i = 0; i < this.item.system.bodyParts.length; i++) {
			if (this.item.system.bodyParts[i].name == 'Background')
			{
				this.hitLocationCanvasses[i].hidden = false;
				continue;
			}

			let ctx = this.hitLocationContexts[i];
			const { data } = ctx.getImageData(x|0, y|0, 1, 1);
			let alpha = data[3];
			if (alpha > 0 && selectedIndex == -1)
			{
				selectedIndex = i;
				this.hitLocationCanvasses[i].hidden = false;
			}
			else
				this.hitLocationCanvasses[i].hidden = true;
		}
	}

	static async #onSelectHitLocation(event, target) {

	}

	static async #onPickLightIcon(event, target) {
		const type = event.target.dataset.type;
		switch (type) {
			case 'unlit':
			case 'lit':
			case 'expended':
				const fp = new foundry.applications.apps.FilePicker({
					type: "image",
					current: event.target.getAttribute("src"),
					callback: (path) => {
						const key = "system." + type + "Icon";
						this.item.update({[key]: path});
						this.render();
					}
				});
				await fp.render(true);
				break;
		}
	}

	static async #onDeleteFuelSource(event, target) {
		const uuid = event.target.dataset.uuid;
		if (!this.item.system.fuelSources) return;
		if (!this.item.system.fuelSources.some(s => s.uuid == uuid)) return;
		const fuelIdx = this.item.system.fuelSources.findIndex(s => s.uuid == uuid);
		if (fuelIdx < 0) return;
		this.item.system.fuelSources.splice(fuelIdx, 1);

		this.item.update({"system.fuelSources": this.item.system.fuelSources});
		this.render();
	}

	async _onNewExtraDamage(target) {
		if (!this.item.system.extraDamage) this.item.system.extraDamage = [];
		this.item.system.extraDamage.push({
			damage: target.value,
			type: this.item.system.newExtraDamageType
		});
		await this.item.update({['system.extraDamage']: this.item.system.extraDamage});
	}

	async _onEditExtraDamage(target) {
		if (!this.item.system.extraDamage) return;
		const index = target.dataset.index;
		const extraDamage = this.item.system.extraDamage[index];
		switch (target.name) {
			case "system.extraDamage":
				extraDamage.damage = target.value;
				break;
			case "system.extraDamageType":
				extraDamage.type = target.value;
				break;
		}

		if (extraDamage.damage === '')
		{
			this.item.system.extraDamage.splice(index, 1);
		}
		else
		{
			this.item.system.extraDamage[index] = extraDamage;
		}
		await this.item.update({['system.extraDamage']: this.item.system.extraDamage});
	}
}
