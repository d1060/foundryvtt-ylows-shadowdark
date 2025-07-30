const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
export default class CompendiumItemSelector extends HandlebarsApplicationMixin(ApplicationV2) {

	closeOnSelection = false;

	maxChoices = 0;

	itemsLoaded = false;

	uuid = foundry.utils.randomID();

	constructor(object) {
	    super(object);
		this.object = object;
	}

	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["shadowdark", "window-app", 'themed', 'theme-light'],
		position: {
    		width: 320,
    		height: "auto"
  		},
		window: {
			resizable: true,
    		title: 'SHADOWDARK.dialog.item_selector.default_title',
			controls: [],
  		},
		form: {
			handler: this.#updateObject,
		    submitOnChange: true,
    		closeOnSubmit: false,
  		},
		dragDrop: [{dropSelector: ".items"}],
		actions: {
			delete: this.#onRemoveItem,
		},
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/apps/compendium-item-selector.hbs" }
	}

	get prompt() {
		return game.i18n.localize("SHADOWDARK.dialog.type_here");
	}

	async _autoCloseWhenRendered() {
		while (!this.rendered) {
			await shadowdark.utils.sleep(100); // millisecs
		}

		this.close({force: true});
	}

	async _getAvailableItems() {
		const loadingDialog = await new shadowdark.apps.LoadingSD().render(true);

		const availableItems = await this.getAvailableItems() ?? [];
		this.itemsLoaded = true;

		const itemsAvailable = availableItems?.size > 0 ?? false;

		if (itemsAvailable) {
			for (const item of availableItems) {
				item.decoratedName = await this.decorateName(item);
			}

			this.availableItems = Array.from(availableItems).sort(
				(a, b) => a.name.localeCompare(b.name)
			);
		}
		else {
			ui.notifications.warn(
				game.i18n.localize("SHADOWDARK.dialog.item_selector.error.no_items_found")
			);

			this._autoCloseWhenRendered();
		}

		await loadingDialog.close({force: true});
	}

	async decorateName(item) {
		// By default we just use the name, but this can be overriden by each
		// selector class if needed
		return item.name;
	}
	
	async getCurrentItemData() {
		this.currentItemUuids = await this.getUuids() ?? [];
		this.currentItems = await this.getCurrentItems() ?? [];
	}

	async getCurrentItems() {
		const items = [];
		for (const uuid of this.currentItemUuids) {
			const item = await fromUuid(uuid);
			if (item)
			{
				item.decoratedName = await this.decorateName(item);
				items.push(item);
			}
		}

		return items.sort((a, b) => a.name.localeCompare(b.name));
	}

	async _prepareContext() {
		if (!this.itemsLoaded) {
			await this._getAvailableItems();
		}

		await this.getCurrentItemData();

		const data = {
			currentItems: this.currentItems,
			itemChoices: [],
			prompt: this.prompt,
			uuid: this.uuid,
		};

		var multipleSelectionItems = await this.getMultipleSelectionItems() ?? [];

		// Don"t include already selected items
		for (const item of this.availableItems) {
			if (!this.currentItemUuids.includes(item.uuid) || multipleSelectionItems.includes(item)) {
				data.itemChoices.push(item);
			}
		}

		return data;
	}

	static async #onRemoveItem(event) {
		event.preventDefault();
		event.stopPropagation();

		let itemIndex = parseInt(event.target.dataset.itemIndex);

		const newItemUuids = [];

		for (let i = 0; i < this.currentItems.length; i++) {
			if (itemIndex === i) continue;
			newItemUuids.push(this.currentItems[i].uuid);
		}

		await this._saveUuids(newItemUuids);
	}

	async _saveUuids(uuids) {
		await this.saveUuids(uuids);
		this.render(false);
	}

	static async #updateObject(event, form, formData) {
		let newUuids = this.currentItemUuids;

		const currentItemCount = this.currentItemUuids.length;
		if (this.maxChoices === 1 && currentItemCount === 1 && formData.object["item-selected"] !== "") {
			for (const item of this.availableItems) {
				if (item.decoratedName === formData.object["item-selected"]) {
					newUuids = [item.uuid];
					break;
				}
			}

			await this._saveUuids(newUuids);
		}
		else if (this.maxChoices === 0 || this.maxChoices > currentItemCount) {
			for (const item of this.availableItems) {
				if (item.decoratedName === formData.object["item-selected"]) {
					newUuids.push(item.uuid);
					break;
				}
			}

			await this._saveUuids(newUuids);
		}
		else {
			ui.notifications.warn(
				game.i18n.format("SHADOWDARK.dialog.item_selector.error.max_choices_exceeded",
					{maxChoices: this.maxChoices}
				)
			);

			return this.render(true);
		}

		if (this.closeOnSelection) this.close({force: true});
	}
}
