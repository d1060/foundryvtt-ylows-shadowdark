import UtilitySD from "../utils/UtilitySD.mjs";
import * as select from "../apps/CompendiumItemSelectors/_module.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api
const { ActorSheetV2 } = foundry.applications.sheets
export default class ActorSheetSD extends HandlebarsApplicationMixin(ActorSheetV2) {
	firstLoad = true;

	constructor(object) {
		super(object);
	}

		/** @inheritdoc */
	static DEFAULT_OPTIONS = {
		actions: {
			editImage: this.#onEditImage,
			hideSection: this.#onHideSection,
			rollAbilityCheck: this.#onRollAbilityCheck,
			rollModifier: this.#rollModifier,
			rollHp: this.#onRollHP,
			selectItem: this.#onItemSelection,
			showDetails: this.#showItemDetails,
			itemAttack: this.#onRollAttack,
			specialAttack: this.#onRollSpecial,
			magicRoll: this.#onRollMagic,
			toggleLost: this.#onToggleLost,
			itemCreate: this.#onItemCreate,
			manageActiveEffect: this.#manageActiveEffect,
		},
  	}

	_hiddenSectionsLut = {
		activeEffects: true,
		activeSpells: true,
	};

	// Emulate a itom drop as it was on the sheet, when dropped on the canvas
	async emulateItemDrop(data) {
		return this._onDropItem({}, data);
	}

	/** @override */
	async _prepareContext(options) {
		if (this.firstLoad) {
			this.firstLoad = false;
			this.loadingDialog = await new shadowdark.apps.LoadingSD().render(true);
		}

		const source = this.actor.toObject();
		const actorData = this.actor.toObject(false);

		const context = {
			actor: actorData,
			config: CONFIG.SHADOWDARK,
			cssClass: this.actor.isOwner ? "editable" : "locked",
			editable: this.isEditable,
			hiddenSections: this._hiddenSectionsLut,
			isNpc: this.actor.type === "NPC",
			isPlayer: this.actor.type === "Player",
			items: actorData.items,
			owner: this.actor.isOwner,
			predefinedEffects: await shadowdark.effects.getPredefinedEffectsList(),
			rollData: this.actor.getRollData.bind(this.actor),
			source: source.system,
			system: actorData.system,
		};

		context.activeEffects = shadowdark.effects.prepareActiveEffectCategories(
			this.actor.allApplicableEffects()
		);

		context.notesHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			context.system.notes,
			{
				secrets: this.actor.isOwner,
				async: true,
				relativeTo: this.actor,
			}
		);
		
		return context;
	}

	async _onFirstRender(context, options) {
		await super._onFirstRender(context, options);

		this._createContextMenu(this._getItemContextOptions, "[data-item-id], [data-effect-id]", {
      		hookName: "_getItemContextOptions",
      		parentClassHooks: false,
      		fixed: true,
    	});

		this._createContextMenu(this._showImage, "[data-image-id]", {
      		hookName: "_showImage",
      		parentClassHooks: false,
      		fixed: true,
    	});

		if (this.loadingDialog)
		{
			this.loadingDialog.close({force: true});
			this.loadingDialog = null;
		}
	}

	_getActorOverrides() {
		return Object.keys(foundry.utils.flattenObject(this.object.overrides || {}));
	}

	_getItemContextOptions() {
		const canEdit = function(element, actor) {
			let result = false;
			const itemId = element.dataset.itemId;

			if (game.user.isGM) {
				result = true;
			}
			else if (actor.canUserModify(game.user, "update")) {
				result = actor.items.find(item => item._id === itemId)
					? true
					: false;
			}

			return result;
		};

		return [
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_edit.title"),
				icon: '<i class="fas fa-edit"></i>',
				condition: element => canEdit(element, this.actor),
				callback: element => {
					const itemId = element.dataset.itemId;
					if (itemId)
					{
						const item = this.actor.items.get(itemId);
						return item?.sheet.render(true);
					}
					const effectId = element.dataset.effectId;
					if (effectId)
					{
						const effect = this.actor.appliedEffects.find(e => e.id === effectId);
						return effect?.sheet.render(true);
					}
				},
			},
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_delete.title"),
				icon: '<i class="fas fa-trash"></i>',
				condition: element => canEdit(element, this.actor),
				callback: element => {
					const itemId = element.dataset.itemId;
					if (itemId)
						this._onItemDelete(itemId);
					else
					{
						const effectId = element.dataset.effectId;
						if (effectId)
							this._onEffectDelete(effectId);
					}
				},
			},
		];
	}

	_showImage() {
		const canEdit = function(element, actor) {
			let result = false;

			if (game.user.isGM) {
				result = true;
			}
			else if (actor.canUserModify(game.user, "update")) {
				result = true;
			}

			return result;
		};

		return [
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.show_portrait.title"),
				icon: '<i class="fas fa-eye"></i>',
				condition: element => canEdit(element, this.actor),
				callback: async element => {
					const portrait = PIXI.Texture.from(this.actor.img);
					const { width, height } = portrait.baseTexture;
					await ActorSheetSD.showImageDialog(this.actor.img, this.actor.name, true, game.user, width, height);
				},
			},
		];
	}

	_itemContextMenu(html) {
		foundry.applications.ux.ContextMenu.create(this, html, ".item", this._getItemContextOptions());
		foundry.applications.ux.ContextMenu.create(this, html, ".portrait", this._showImage());
	}

	async _effectDropNotAllowed(data) {
		var item = data;
		if (data.uuid)
		{
			let uuidItem = await fromUuid(data.uuid);
			if (uuidItem) item = uuidItem;
		}

		if (item.type === "Effect") {
			if (item.system.duration.type === "rounds" && !game.combat) {
				ui.notifications.warn(
					game.i18n.localize("SHADOWDARK.item.effect.warning.add_round_item_outside_combat")
				);
				return true;
			}
		}

		return false;
	}

	/** @inheritdoc */
	async _onChangeInput(event) {
		// Test for Predefiend Effects
		// Create effects when added through the predefined effects input
		if (event.target?.name === "predefinedEffects") {
			const key = event.target.value;
			return shadowdark.effects.createPredefinedEffect(this.actor, key);
		}

		await super._onChangeInput(event);
	}

	async _onDropItem(event, data) {
		if (await this._effectDropNotAllowed(data)) return false;

		const newItem = await super._onDropItem(event, data);

		return [newItem];
	}

	static async #onEditImage(event, target) {
		const field = target.dataset.field || "img";
		const current = foundry.utils.getProperty(this.document, field);

		const fp = new foundry.applications.apps.FilePicker({
			type: "image",
			current: current,
			callback: (path) => {
				this.actor[field] = path;
				this.document.update({ [field]: path });
				this.render();
			}
		});

		fp.render(true);
	}


	static async #onHideSection(event, target) {
		event.preventDefault();

		const data = event.target.dataset;
		const sectionId = data.sectionToHide;

		const html = event.currentTarget instanceof HTMLElement ? event.currentTarget : event.currentTarget[0];
		const hideableSection = html.querySelector(`[data-hideable-section-id="${sectionId}"]`);

		if (this._hiddenSectionsLut[sectionId]) {
			this._hiddenSectionsLut[sectionId] = !this._hiddenSectionsLut[sectionId];
		}
		else {
			this._hiddenSectionsLut[sectionId] = true;
		}

		if (this._hiddenSectionsLut[sectionId]) {
			UtilitySD.slideUp(hideableSection, 200);
			event.target.dataset.tooltip = game.i18n.localize(
				"SHADOWDARK.sheet.general.section.toggle_show"
			);
		}
		else {
			UtilitySD.slideDown(hideableSection, 200);
			event.target.dataset.tooltip = game.i18n.localize(
				"SHADOWDARK.sheet.general.section.toggle_hide"
			);
		}

		let targetHtml = event.target instanceof HTMLElement ? event.target : event.target[0];
		let iconElement = targetHtml.querySelector("i");
		if (!iconElement) iconElement = targetHtml;

		iconElement.classList.toggle("fa-caret-down");
		iconElement.classList.toggle("fa-caret-right");
	}

	_onItemDelete(itemId) {
		const itemData = this.actor.getEmbeddedDocument("Item", itemId);

		foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/delete-item.hbs",
			{name: itemData.name}
		).then(html => {
			foundry.applications.api.DialogV2.wait({
				classes: ["app", "shadowdark", "shadowdark-dialog", "window-app", 'themed', 'theme-light'],
				window: {
					resizable: false,
					title: "Confirm Deletion",
				},
				content: html,
				buttons: [
					{
						action: 'Yes',
						icon: "<i class=\"fa fa-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
							if (itemData.system.light?.active) {
								await itemData.parent.sheet._toggleLightSource(itemData);
							}
							await this.actor.deleteEmbeddedDocuments(
								"Item",
								[itemId]
							);

							this.actor.onDeleteDocuments(itemData);
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
		});
	}

	_onEffectDelete(effectId) {
		const effect = this.actor.allApplicableEffects().find(effect => effect.id === effectId);

		return foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/are-you-sure.hbs"
		).then(html => {
			foundry.applications.api.DialogV2.wait({
				classes: ["shadowdark", "shadowdark-dialog", "window-app", 'themed', 'theme-light'],
				window: {
					resizable: false,
					title: `${game.i18n.localize("SHADOWDARK.sheet.general.active_effects.delete_effect.tooltip")}`,
				},
				content: html,
				buttons: [
					{
						action: 'Yes',
						icon: '<i class="fa fa-check"></i>',
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
							if (effect)
							{
								await effect.delete();
								this.actor.onDeleteEffects(effect);
							}
						},
					},
					{
						action: 'Cancel',
						icon: '<i class="fa fa-times"></i>',
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
					},
				],
				default: "Yes",
			});
		});
	}

	static async #onItemSelection(event, target) {
		event.preventDefault();

		const itemType = target.dataset.options;

		switch (itemType) {
			case "ancestry":
				new select.AncestrySelector(this.actor).render(true);
				break;
			case "background":
				new select.BackgroundSelector(this.actor).render(true);
				break;
			case "class":
				new select.ClassSelector(this.actor).render(true);
				break;
			case "deity":
				new select.DeitySelector(this.actor).render(true);
				break;
			case "language":
				new select.LanguageSelector(this.actor).render(true);
				break;
			case "patron":
				new select.PatronSelector(this.actor).render(true);
				break;
			case "nanoMagicTalents":
				new select.NanoMagicTalentSelector(this.actor).render(true);
				break;
			case "auraMagicTalents":
				new select.AuraMagicTalentSelector(this.actor).render(true);
				break;
			case "metalMagicTalents":
				new select.MetalMagicTalentSelector(this.actor).render(true);
				break;
		}
	}

	static async #showItemDetails(event, target) {
		shadowdark.utils.toggleItemDetails(target)
	}

	static async #onRollHP(event, target) {
		event.preventDefault();

		this.actor.rollHP();
	}

	static async #onRollAbilityCheck(event, target) {
		event.preventDefault();

		let ability = target.dataset.ability;

		// skip roll prompt if shift clicked
		if (event.shiftKey) {
			this.actor.rollAbility(this, ability, {event: event, fastForward: true});
		}
		else {
			this.actor.rollAbility(this, ability, {event: event});
		}
	}

	static async #rollModifier(event, target) {
		event.preventDefault();

		const parts = [game.settings.get("shadowdark", "use2d10") ? "2d10" : "1d20", "@abilityBonus"];

		const data = {
			actor: this.actor,
			abilityBonus: this.actor.system.abilities[target.dataset.ability].mod,
		};

		let options = {
			title: this.actor.name + ": " + game.i18n.localize("SHADOWDARK.dialog.ability_check." + target.dataset.ability),
		};
		options.dialogTemplate =  "systems/shadowdark/templates/dialog/roll-npc-modifier.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/item-card.hbs";
		if (event.shiftKey)
			options.fastForward = true;

		await CONFIG.DiceSD.RollDialog(parts, data, options);
	}

	static async #onRollAttack(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		const attackType =  target.dataset.attackType;
		const handedness = target.dataset.handedness;
		const attackOption = target.dataset.attackOption;
		const baseDamage = target.dataset.baseDamage;

		const options = {
			attackType,
			handedness,
			attackOption,
			baseDamage
		};

		// skip roll prompt if shift clicked
		if (event.shiftKey) {
			options.fastForward = true;
		}
		
		this.actor.rollAttack(itemId, options);
	}

	static async #onRollSpecial(event, target) {
		const needsRoll = target.dataset.needsRoll;
		const baseDamage = target.dataset.baseDamage;
		const removesEffectKey = target.dataset.removesEffectKey;

		if (removesEffectKey)
		{
			var effects = await this.actor.getEmbeddedCollection("ActiveEffect");
			if (effects.contents.length)
			{
				let effect = effects.contents.find(e => e.changes.find(c => c.key === removesEffectKey));
				if (effect) {
					this.actor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
				}
			}
		}

		this.render(true);
	}
	
	static async #onRollMagic(event, target) {
		const magicCoreLevel =  target.dataset.magicCoreLevel;
		const magicType = target.dataset.magicType;

		const options = {
			magicCoreLevel,
			magicType,
		};
		
		this.actor.rollMagic(magicCoreLevel, options);
	}

	static async #onToggleLost(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		this.actor.updateEmbeddedDocuments("Item", [
			{
				"_id": itemId,
				"system.lost": !item.system.lost,
			},
		]);
	}

	static async #onItemCreate(event, target) {
		event.preventDefault();
		const itemType = target.dataset.itemType;

		const itemData = {
			name: `New ${itemType}`,
			type: itemType,
			system: {},
		};

		switch (itemType) {
			case "Basic":
				if (target.dataset.itemTreasure) {
					itemData.system.treasure = true;
				}
				break;
			case "Spell":
				itemData.system.tier =
					target.dataset.spellTier || 1;
				break;
			case "Talent":
				itemData.system.talentClass =
					target.dataset.talentClass || "level";
				itemData.system.allowMultipleChoice = false;
				break;
		}

		const [newItem] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
		
		newItem.sheet.render(true);
	}

	_sortAllItems(context) {
		// Pre-sort all items so that when they are filtered into their relevant
		// categories they are already sorted alphabetically (case-sensitive)
		return (context.items ?? []).sort((a, b) => a.name.localeCompare(b.name));
	}

	static async #manageActiveEffect(event, target) {
		shadowdark.effects.onManageActiveEffect(event, this.actor, target);
	}

	static async showImageDialog(image, name, propagate, origin, width, height) {
		const imageAspect = width / height;
		const canvasWidth = canvas.app.renderer.view.width;
		const canvasHeight = canvas.app.renderer.view.height;
		const fixedHeight = 70;

		let displayWidth = width;
		if (width > canvasWidth * 0.9) displayWidth = canvasWidth * 0.9;
		let displayHeight = height;
		if (height > (canvasHeight * 0.9) - fixedHeight) displayHeight = (canvasHeight * 0.9) - fixedHeight;

		let newAspect = displayWidth / displayHeight;

		if (newAspect > imageAspect)
			displayWidth = displayHeight * imageAspect;
		//else if (newAspect < imageAspect)
			//displayHeight = (displayWidth / imageAspect) + 30;

		//displayHeight += fixedHeight;

		let buttons = [{
				id: "close",
				class: "showImageDialogButton",
				label: game.i18n.localize("SHADOWDARK.image.close"),
				default: true,
				action: "close"
			}];
		if (propagate)
			buttons.push({
				id: "share",
				class: "showImageDialogButton",
				label: game.i18n.localize("SHADOWDARK.image.showToPlayers"),
				default: false,
				disabled: !propagate,
				action: "share"
			});

		var response = await foundry.applications.api.DialogV2.wait({
			window: {
				resizable: true,
				title: game.i18n.localize("SHADOWDARK.sheet.general.show_portrait.of") + name + (propagate ? "" : game.i18n.localize("SHADOWDARK.sheet.general.show_portrait.sent_by") + origin.name),
			},
			position: {
				width: displayWidth,
				height: "auto"
			},
			content: `<img class="portrait" src="${image}" name="portrait.img" data-tooltip="${name}" style="max-height: 100%" />`,
			buttons: buttons, 
			submit: result => {
			},
		});

		if (response === 'share') {
			game.socket.emit(
				"system.shadowdark",
				{
					type: "showImage",
					data: {
						src: image,
						width: width,
						height: height,
						name: name,
						origin: game.user,
					},
				}
			);
		}
	}
}
