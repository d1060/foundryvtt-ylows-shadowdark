const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class BuyItemsSD extends HandlebarsApplicationMixin(ApplicationV2) {
	#dragDrop

    constructor(options) {
        super(options);
		this.barterCheck = 10;
		this.transactionCost = 0;
		this.items = [];
		this.sheet = options.sheet;
		this.#dragDrop = this.#createDragDropHandlers()
    }

   	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["app", "window-app", "shadowdark", 'themed', 'theme-light'],
		position: {
    		width: 450,
    		height: 600
  		},
		window: {
			resizable: true,
    		title: "SHADOWDARK.inventory.buy_items_title",
			controls: [],
  		},
		actions: {
			deleteItem: this.#onDeleteItem,
			confirmBuy: this.#onConfirmBuy,
		},
		form: {
			handler: this.#onSubmit,
		    submitOnChange: true,
    		closeOnSubmit: false
  		},
		dragDrop: [{
			dropSelector: ".droppable"
		}],
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/apps/buyItems.hbs" }
	}

	#createDragDropHandlers() {
		return this.options.dragDrop.map((d) => {
			d.permissions = {
				drop: this._canDragDrop.bind(this)
			};
			d.callbacks = {
				drop: this._onDrop.bind(this)
			};
			return new foundry.applications.ux.DragDrop(d);
		})
	}

	/** @inheritdoc */
	_canDragDrop() {
		return true;
	}

   	/** @override */
	async _prepareContext(options) {
		if (!this.barterCheck) this.barterCheck = 10;

		const context = {
            barterCheck: this.barterCheck,
			itemsChosen: this.items.length,
			items: this.items,
			transaction: this.transaction,
			haveFunds: this.haveFunds(),
		};

		return context;
    }

    async _updateObject(event, formData) {

    }

	async render(force, options) {
		await super.render(force, options);
		await this.activateListeners();
		this.#dragDrop.forEach((d) => d.bind(this.element));
	}

	async activateListeners() {
		//super.activateListeners(html);

		// live updates while sliding
		var barterCheck = this.element.querySelector('input[name="barterCheck"]');

		barterCheck.addEventListener("input", (ev) => {
		 	const val = Number(ev.currentTarget.value);
		 	this._onBarterSlide(val);
		});

		// prevent Enter from submitting while focused on the slider
		barterCheck.addEventListener("keydown", (ev) => {
		 	if (ev.key === "Enter") ev.preventDefault();
		});
	}

	static async #onSubmit(event, form, formData) {
		switch (event.target.name) {
			case 'itemQuantity':
				var index = parseInt(event.target.dataset.index);
				var q = parseInt(event.target.value);
				this.items[index].quantity = q;

				this.calcPrices();
				this.render(true);
				break;
		}
	}

	/** @override */
	async _onDrop(event) {
		const data = foundry.applications.ux.TextEditor.getDragEventData(event);
		if (!data?.uuid) return;
		const item = await fromUuid(data.uuid);
		this.items.push(item);
		this.calcPrices();
		this.render(true);
    }

	_onBarterSlide(val) {
		// Update internal state/vars
		this.barterCheck = val;

		const root = this.element;
		var barterCheck = this.element.querySelector('.barter-check-value');
		barterCheck.textContent = String(val);
		this.calcPrices();
		this.updatePrices();
	}

	calcPrices() {
		this.transactionCost = 0;
		for (const item of this.items) {
			let priceString = '';
			if (!item.quantity) item.quantity = 1;

			if (item.system.cost) {
				var price = item.system.cost.cp + item.system.cost.sp * 10 + item.system.cost.gp * 100;
				var priceRatio = 1;
				if (this.barterCheck < 20) {
					priceRatio = ((20 - this.barterCheck) * 0.1) + 1;
				} else {
					priceRatio = 1 - ((this.barterCheck - 20) * 0.05);
				}
				price = Math.floor(price * priceRatio * item.quantity);
				this.transactionCost += price;
				item.actualCost = this.splitPriceIntoCoins(price);
				priceString = item.actualCost.cp + game.i18n.localize('SHADOWDARK.coins.cp') + ' ' +
							  item.actualCost.sp + game.i18n.localize('SHADOWDARK.coins.sp') + ' ' +
							  item.actualCost.gp + game.i18n.localize('SHADOWDARK.coins.gp');
			}

			item.priceString = priceString;
		}
		this.transaction = this.splitPriceIntoCoins(this.transactionCost);
	}

	updatePrices() {
		for (var i = 0; i < this.items.length; i++) {
			const item = this.items[i];
			this.updateSinglePrice('.buy_item_index_' + i, item.actualCost, i);
		}
		this.updateSinglePrice('.buy_item_transaction', this.transaction);
		const confirmButton = document.querySelector('.confirm-buy');
		if (confirmButton) {
			if (this.haveFunds()) {
				confirmButton.disabled = false;
				confirmButton.style.opacity = 1;
			} else {
				confirmButton.disabled = true;
				confirmButton.style.opacity = 0.5;
			}
		}
	}

	updateSinglePrice(mainClass, actualCost, index) {
		const itemPrices = document.querySelectorAll(mainClass);
		for (const itemPrice of itemPrices) {
			this.updateSinglePriceCoin(actualCost, 'cp', itemPrice, index);
			this.updateSinglePriceCoin(actualCost, 'sp', itemPrice, index);
			this.updateSinglePriceCoin(actualCost, 'gp', itemPrice, index);
		}
	}

	updateSinglePriceCoin(actualCost, cointype, itemPrice, index) {
		if (itemPrice.classList.contains('item_' + cointype)) {
			var coinClassIndex = '.buy_item_' + cointype + (index != null ? '_' + index : '');
			const itemCoin = document.querySelector(coinClassIndex);
			if (actualCost[cointype]) {
				itemPrice.textContent = actualCost[cointype];
				if (itemCoin) itemCoin.textContent = game.i18n.localize('SHADOWDARK.coins.' + cointype);
			} else {
				itemPrice.textContent = '';
				if (itemCoin) itemCoin.textContent = '';
			}
		}
	}

	splitPriceIntoCoins(price) {
		var actualPriceCP = price;
		price = Math.floor(price / 10);
		actualPriceCP = actualPriceCP - (price * 10);
		var actualPriceSP = price;
		price = Math.floor(price / 10);
		actualPriceSP = actualPriceSP - (price * 10);
		var actualPriceGP = price;

		return {
			cp: actualPriceCP,
			sp: actualPriceSP,
			gp: actualPriceGP
		};
	}

	haveFunds() {
		const totalFunds =	this.sheet?.actor?.system?.coins?.cp +
							this.sheet?.actor?.system?.coins?.sp * 10 +
							this.sheet?.actor?.system?.coins?.gp * 100;

		return totalFunds >= this.transactionCost;
	}

	static async #onDeleteItem(event, target) {
		var index = parseInt(target.dataset.index);
		this.items.splice(index, 1);

		this.calcPrices();
		this.render(true);
	}

	static async #onConfirmBuy(event, target) {
		for (const item of this.items) {
			var instancesToCreate = Math.ceil(item.quantity / item.system.slots.per_slot);
			var amountToCreate = item.quantity;
			for (var i = 0; i < instancesToCreate; i++) {
				var inventoryQuantity = item.system.slots.per_slot;
				if (amountToCreate > item.system.slots.per_slot)
					amountToCreate -= item.system.slots.per_slot;
				else 
					inventoryQuantity = amountToCreate;

				var newItem = structuredClone(item);
				newItem.system.quantity = inventoryQuantity;

				this.sheet.actor.createEmbeddedDocuments(
					"Item",
					[newItem]
				);
			}
		}

		this.removeTransactionFunds();
		this.close();
	}

	async removeTransactionFunds() {
		let totalFunds = this.sheet?.actor?.system?.coins?.cp +
						 this.sheet?.actor?.system?.coins?.sp * 10 +
						 this.sheet?.actor?.system?.coins?.gp * 100;
		totalFunds -= this.transactionCost;
		this.sheet.actor.system.coins = this.splitPriceIntoCoins(totalFunds);
		await this.sheet.actor.update({"system.coins": this.sheet.actor.system.coins});
	}
}