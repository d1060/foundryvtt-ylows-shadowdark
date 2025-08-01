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
		form: { template: "systems/shadowdark/templates/apps/gem-bag.hbs"}
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.app.gem_bag.title");
		return `${title}: ${this.actor.name}`;
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
			const itemId = element.data("item-id");

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

		return [
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_edit.title"),
				icon: '<i class="fas fa-edit"></i>',
				condition: element => canEdit(element),
				callback: element => {
					const itemId = element.data("item-id");
					const item = this.actor.items.get(itemId);
					return item.sheet.render(true);
				},
			},
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_delete.title"),
				icon: '<i class="fas fa-trash"></i>',
				condition: element => canEdit(element),
				callback: element => {
					const itemId = element.data("item-id");
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

	_onItemDelete(itemId) {
		const itemData = this.actor.getEmbeddedDocument("Item", itemId);

		foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/delete-item.hbs",
			{name: itemData.name}
		).then(html => {
			new Dialog({
				title: `${game.i18n.localize("SHADOWDARK.dialog.item.confirm_delete")}`,
				content: html,
				buttons: {
					Yes: {
						icon: "<i class=\"fa fa-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
							await this.actor.deleteEmbeddedDocuments(
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

	static async #sellGem(event, target) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
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
