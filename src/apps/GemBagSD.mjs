import UtilitySD from "../utils/UtilitySD.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
export default class GemBagSD extends HandlebarsApplicationMixin(ApplicationV2) {
	constructor(options) {
		super(options);

		this.actor = options.actor;
	}

	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["shadowdark", 'themed', 'theme-light'],
		position: {
    		width: 400,
    		height: "auto",
		},
		window: {
			resizable: false,
    		title: "SHADOWDARK.app.gem_bag.title",
			controls: [],
  		},
		actions: {
			sellAllGems: this.#sellAllGems,
			sellGem: this.#sellGem,
			itemCreate: this.#itemCreate,
			showDetails: this.#showDetails,
		},
		form: {
		    submitOnChange: true,
    		closeOnSubmit: true
  		},
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/apps/gem-bag.hbs" }
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.app.gem_bag.title");
		return `${title}: ${this.actor.name}`;
	}

	async _onFirstRender(context, options) {
		await super._onFirstRender(context, options);

		this._createContextMenu(this._getItemContextOptions, "[data-item-id]", {
      		hookName: "_getItemContextOptions",
      		parentClassHooks: false,
      		fixed: true,
    	});
	}

	/** @inheritdoc */
	activateListeners(html) {
		// Create context menu for items on both sheets
		this._contextMenu(html);

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	/** @override */
	async _prepareContext(options) {
		const items = this.getGems();
		const totals = this.getGemValueTotal(items);
		const actor = this.actor;

		return {items, totals, actor};
	}

	gemBagIsEmpty() {
		return this.getGems().length === 0;
	}

	getGems() {
		return this.actor.items.filter(item => item.type === "Gem");
	}

	getGemValueTotal(items) {
		const totals = {
			system: {
				cost: {
					gp: 0,
					sp: 0,
					cp: 0,
				},
				quantity: 1,
			},
		};

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			totals.system.cost.gp += item.system.cost.gp;
			totals.system.cost.sp += item.system.cost.sp;
			totals.system.cost.cp += item.system.cost.cp;
		}

		return totals;
	}

	_itemContextMenu(html) {
		foundry.applications.ux.ContextMenu.create(this, html, ".item", this._getItemContextOptions());
	}

	_getItemContextOptions() {
		const me = this;

		const canEdit = function(element) {
			let result = false;
			const itemId = element.dataset.itemId;

			if (game.user.isGM) {
				result = true;
			}
			else {
				result = me.actor.items.find(item => item._id === itemId)
					? true
					: false;
			}

			return result;
		};

		const isItem = function(element, actor) {
			let result = false;
			const itemId = element.dataset.itemId;

			const item = actor.items.find(item => item._id === itemId);
			return item && ["Armor", "Basic", "Gem", "Potion", "Scroll", "Wand", "Weapon"].includes(item.type);
		};

		return [
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_edit.title"),
				icon: '<i class="fas fa-edit"></i>',
				condition: element => canEdit(element),
				callback: element => {
					const itemId = element.dataset.itemId;
					const item = this.actor.items.get(itemId);
					return item.sheet.render(true);
				},
			},
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_transfer.title"),
				icon: '<i class="fas fa-handshake-o"></i>',
				condition: element => canEdit(element, this.actor) && isItem(element, this.actor),
				callback: element => {
					const itemId = element.dataset.itemId;
					if (itemId)
					{
						const item = this.actor.items.get(itemId);
						this._onTransferItem(item);
					}
				},
			},
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_delete.title"),
				icon: '<i class="fas fa-trash"></i>',
				condition: element => canEdit(element),
				callback: element => {
					const itemId = element.dataset.itemId;
					this._onItemDelete(itemId);
				},
			},
		];
	}

	static async #itemCreate(event, target) {
		event.preventDefault();

		const [newItem] = await this.actor.createEmbeddedDocuments("Item", [{
			name: "New Gem",
			type: "Gem",
		}]);
		newItem.sheet.render(true);
	}

	async _onTransferItem(item, options = {}) {
		const targetActor = await UtilitySD.actorChoiceDialog({
			template: 'systems/shadowdark/templates/dialog/transfer-item.hbs',
			title: 'SHADOWDARK.dialog.item.pick_up.title'
		});

		if (targetActor) {
			const from = item.actor;
			const to = targetActor;
			from.transferItem(item, to);
		}
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
							let type = "Item";

							await this.actor.deleteEmbeddedDocuments(
								type,
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

	static async #sellGem(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		const itemData = this.actor.getEmbeddedDocument("Item", itemId);
		const actor = this.actor;

		foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/sell-item.hbs",
			{name: itemData.name}
		).then(html => {
			new Dialog({
				title: `${game.i18n.localize("SHADOWDARK.dialog.item.confirm_sale")}`,
				content: html,
				buttons: {
					Yes: {
						icon: "<i class=\"fa fa-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
							await actor.sellItemById(itemId);

							if (this.gemBagIsEmpty()) {
								this.close();
							}
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

	static async #sellAllGems(event, target) {
		event.preventDefault();

		foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/sell-all-items.hbs",
			{name: "Gems"}
		).then(html => {
			new Dialog({
				title: `${game.i18n.localize("SHADOWDARK.dialog.item.confirm_sale")}`,
				content: html,
				buttons: {
					Yes: {
						icon: "<i class=\"fa fa-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
							this.actor.sellAllGems();
							this.close();
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

	static async #showDetails(event, target) {
		shadowdark.utils.toggleItemDetails(target);
	}
}
