const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class LootSD extends HandlebarsApplicationMixin(ApplicationV2) {
	#dragDrop

    constructor(options) {
        super(options);
		this.config = game.settings.get("shadowdark", "rollLoot");
		this.lootItems = [];
		this.#dragDrop = this.#createDragDropHandlers()
    }

   	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["app", "window-app", "shadowdark", 'themed', 'theme-light'],
		position: {
    		width: 800,
    		height: "auto"
  		},
		window: {
			resizable: true,
    		title: 'SHADOWDARK.app.loot_maker.title',
			controls: [],
  		},
		actions: {
			selectIncludeMagical: this.#onSelectIncludeMagical,
			deleteTable: this.#onDeleteTable,
			selectLootLevel: this.#onChangeLootLevel,
			rollLoot: this.#onRollLoot,
			rollMagical: this.#onRollMagicItem,
		},
		form: {
			handler: this.#onSubmit,
		    submitOnChange: false,
    		closeOnSubmit: true
  		},
		dragDrop: [{
			dragSelector: ".item",
			dropSelector: ".droppable"
		}],
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/apps/loot.hbs" }
	}

	#createDragDropHandlers() {
		return this.options.dragDrop.map((d) => {
		d.permissions = {
			dragstart: this._canDragStart.bind(this),
			drop: this._canDragDrop.bind(this)
		};
		d.callbacks = {
			dragstart: this._onDragStart.bind(this),
			dragover: this._onDragOver.bind(this),
			drop: this._onDrop.bind(this)
		};
		return new foundry.applications.ux.DragDrop(d);
		})
	}

	_onRender(context, options) {
    	this.#dragDrop.forEach((d) => d.bind(this.element))
  	}

	/** @inheritdoc */
	_canDragDrop() {
		return true;
	}

	/** @inheritdoc */
	_canDragStart() {
		return true;
	}

	/** @override */
	async _prepareContext(options) {

		const context = {
            system: this.config,
		};

		context.system.canRoll = true;
		if (!this.config.table03Chosen && this.config.level === '0-3')
			context.system.canRoll = false;
		if (!this.config.table46Chosen && this.config.level === '4-6')
			context.system.canRoll = false;
		if (!this.config.table79Chosen && this.config.level === '7-9')
			context.system.canRoll = false;
		if (!this.config.table10Chosen && this.config.level === '10')
			context.system.canRoll = false;

		context.system.canRollMagical = this.config.includeMagical &&
										this.config.tableMagicItem &&
										this.config.tableMagicWeapon &&
										this.config.tableMagicArmor &&
										this.config.tableMagicProperty &&
										this.config.tableMagicSources;

		context.lootItems = this.lootItems;

		return context;
	}

    async _updateObject(event, formData) {
		shadowdark.debug(`LootSD Update Object`);
    }

	async render(force, options) {
		// Don't allow non-GM users to view the UI
		if (!game.user.isGM) return;

		super.render(force, options);
	}

	async start() {
		if (!game.user.isGM) return;
		this.render(true);
	}
	
	static async #onSubmit(event, form, formData) {
		if (!this.config) this.config = {};
	}

	static async #onChangeLootLevel(event, target) {
        if (!this.config) this.config = {};
        this.config.level = event.target.value;
		game.settings.set("shadowdark", "rollLoot", this.config);
		//this.render(true);
	}

    static async #onSelectIncludeMagical(event, target) {
        if (!this.config) this.config = {};
        this.config.includeMagical = event.target.checked;
		game.settings.set("shadowdark", "rollLoot", this.config);
		this.render(true);
    }

	/** @override */
	async _onDragStart(event) {
		const uuid = $(event.target).data("uuid");
		const index = $(event.target).data("index");
		const lootItem = this.lootItems[index];
		event.dataTransfer.setData("text/plain", JSON.stringify(
			{
				type: "Item",
				uuid: uuid,
				isLootItem: lootItem.isLootItem,
				name: lootItem.name,
				lootDescription: lootItem.lootDescription,
				lootProperties: lootItem.lootProperties,
				magic_charges: lootItem.magic_charges,
			}));

		//super._onDragStart(event);
	}

	_onDragOver(event) {
	    // Optional: handle dragover events if needed
  	}

	/** @override */
	async _onDrop(event) {
		// get item that was dropped based on event
		const eventData = foundry.applications.ux.TextEditor.getDragEventData(event);
		const itemObj = await fromUuid(eventData.uuid);
		const tableType = $(event.target).data("table");
		if (itemObj && itemObj.documentName === "RollTable")
		{
			switch (tableType) {
				case "0-3":
					this.config.table03 = {name: itemObj.name, uuid: itemObj.uuid};
					this.config.table03Chosen = true;
					break;
				case "4-6":
					this.config.table46 = {name: itemObj.name, uuid: itemObj.uuid};
					this.config.table46Chosen = true;
					break;
				case "7-9":
					this.config.table79 = {name: itemObj.name, uuid: itemObj.uuid};
					this.config.table79Chosen = true;
					break;
				case "10":
				case 10:
					this.config.table10 = {name: itemObj.name, uuid: itemObj.uuid};
					this.config.table10Chosen = true;
					break;
				case "magicItem":
					this.config.tableMagicItem = {name: itemObj.name, uuid: itemObj.uuid};
					this.config.tableMagicItemChosen = true;
					break;
				case "magicWeapon":
					this.config.tableMagicWeapon = {name: itemObj.name, uuid: itemObj.uuid};
					this.config.tableMagicWeaponChosen = true;
					break;
				case "magicArmor":
					this.config.tableMagicArmor = {name: itemObj.name, uuid: itemObj.uuid};
					this.config.tableMagicArmorChosen = true;
					break;
				case "magicProperty":
					this.config.tableMagicProperty = {name: itemObj.name, uuid: itemObj.uuid};
					this.config.tableMagicPropertyChosen = true;
					break;
				case "magicSources":
					this.config.tableMagicSources = {name: itemObj.name, uuid: itemObj.uuid};
					this.config.tableMagicSourcesChosen = true;
					break;
			}
			game.settings.set("shadowdark", "rollLoot", this.config);
			this.render(true);
		}
	}

	static async #onDeleteTable(event, target) {
        if (!this.config) this.config = {};
		const tableType = $(event.target).data("table");
		const uuid = $(event.target).data("uuid");
		switch (tableType) {
			case "0-3":
				this.config.table03 = null;
				this.config.table03Chosen = false;
				break;
			case "4-6":
				this.config.table46 = null;
				this.config.table46Chosen = false;
				break;
			case "7-9":
				this.config.table79 = null;
				this.config.table79Chosen = false;
				break;
			case "10":
				this.config.table10 = null;
				this.config.table10Chosen = false;
				break;
			case "magicItem":
				this.config.tableMagicItem = null;
				this.config.tableMagicItemChosen = false;
				break;
			case "magicWeapon":
				this.config.tableMagicWeapon = null;
				this.config.tableMagicWeaponChosen = false;
				break;
			case "magicArmor":
				this.config.tableMagicArmor = null;
				this.config.tableMagicArmorChosen = false;
				break;
			case "magicProperty":
				this.config.tableMagicProperty = null;
				this.config.tableMagicPropertyChosen = false;
				break;
			case "magicSources":
				this.config.tableMagicSources = null;
				this.config.tableMagicSourcesChosen = false;
				break;
		}
		game.settings.set("shadowdark", "rollLoot", this.config);
		this.render(true);
	}

	static async #onRollLoot(event, target) {
		let table = null;
		switch(this.config.level)
		{
			case '0-3':
				table = await fromUuid(this.config.table03.uuid);
				break;
			case '4-6':
				table = await fromUuid(this.config.table46.uuid);
				break;
			case '7-9':
				table = await fromUuid(this.config.table79.uuid);
				break;
			case '10':
				table = await fromUuid(this.config.table10.uuid);
				break;
		}
		if (!table)
			return;

		if (!this.lootItems) this.lootItems = [];
		this.lootItems.push(...await this.drawResults(table));
		await this.removeUndefinedLoot();
		if (this.lootItems.length > 14) this.lootItems.shift();
		for (var lootItem of this.lootItems)
		{
			if (!lootItem.lootName) lootItem.lootName = lootItem.name;
		}
		if (this.lootItems.length > 0) this.render(true);
	}

	static async #onRollMagicItem(event, target) {
		let magicItems = await this.rollMagicItem();

		if (!this.lootItems) this.lootItems = [];
		this.lootItems.push(...magicItems);
		await this.removeUndefinedLoot();
		if (this.lootItems.length > 14) this.lootItems.shift();
		this.render(true);
	}

	async rollMagicItem() {
		let baseMagicItems = await this.drawResults(await fromUuid(this.config.tableMagicItem.uuid));
		let items = [];
		for (var magicItem of baseMagicItems)
		{
			let properties = [];
			if (magicItem.type === "Weapon")
			{
				var weaponPropertiesAndTypesMatch = true;
				var countAttempt = 0;
				do {
					properties = await this.drawResults(await fromUuid(this.config.tableMagicWeapon.uuid));
					countAttempt++;
					for (var rolledProperty of properties)
					{
						if ((rolledProperty.itemType === "magic_melee_weapon" && magicItem.type === "ranged") ||
							(rolledProperty.itemType === "magic_ranged_weapon" && magicItem.type === "melee"))
						{
							weaponPropertiesAndTypesMatch = false;
						}
					}
				} while (!weaponPropertiesAndTypesMatch && countAttempt < 10)
			}
			else if (magicItem.type === "Armor")
				properties = await this.drawResults(await fromUuid(this.config.tableMagicArmor.uuid));
			else 
				properties = await this.drawResults(await fromUuid(this.config.tableMagicProperty.uuid));

			let sources = await this.drawResults(await fromUuid(this.config.tableMagicSources.uuid));

			if (!magicItem.lootProperties) magicItem.lootProperties = [];
			magicItem.lootProperties.push(...properties);
			magicItem.lootProperties.push(...sources);

			if (magicItem.type === "Weapon" || magicItem.type === "Armor")
			{
				let extraDescription = "";
				// Adds Magical properties and source as Weapon and Armor Properties.
				for (let property of properties)
				{
					extraDescription += "<p><b>" + property.name + ":</b></p>" + property.description;
				}

				for (let source of sources)
				{
					extraDescription += "<p><b>" + source.name + ":</b></p>" + source.description;
				}

				magicItem.lootDescription = extraDescription;
			}
			else 
			{
				let extraDescription = "";
				// For regular items, add properties as effects.
				for (let property of properties)
				{
					extraDescription += "<p><b>" + property.name + ":</b></p>" + property.description;
				}

				for (let source of sources)
				{
					extraDescription +=  "<p><b>" + source.name + ":</b></p>" + source.description;
				}

				magicItem.lootDescription = extraDescription;
			}

			await this.setPropertyAppropriateNames(magicItem, properties);
			items.push(magicItem);
		}
		return items;
	}

	async drawResults(table) {
		var drawResult = await table.draw({recursive: true, displayChat: false});
		var items = [];
		if (drawResult.results.length > 0)
		{
			for (let result of drawResult.results)
			{
				var resultObj = await fromUuid(result.documentUuid);

				if (resultObj)
				{
					if (resultObj.name.slugify() === "magic-item")
					{
						if (this.config.includeMagical &&
							this.config.tableMagicItem &&
							this.config.tableMagicWeapon &&
							this.config.tableMagicArmor &&
							this.config.tableMagicProperty &&
							this.config.tableMagicSources)
						{
							items.push(...await this.rollMagicItem());
						}
						else
							items.push(...await this.drawResults(table));
					}
					else if (resultObj.name.slugify() === "roll-twice")
					{
						items.push(...await this.drawResults(table));
						items.push(...await this.drawResults(table));
					}
					else
					{
						var lootItem = {
							isLootItem: true,
							name: resultObj.name,
							description: resultObj.system.description,
							uuid: resultObj.uuid,
							type: resultObj.type,
							itemType: resultObj.system.itemType,
							subtype: resultObj.system.type,
							img: resultObj.img,
							magic_charges: resultObj.system.magic_charges
						};
						if (resultObj.system.prefixes)
							lootItem.prefixes = resultObj.system.prefixes;
						if (resultObj.system.suffixes)
							lootItem.suffixes = resultObj.system.suffixes;

						lootItem.displayCost = "";
						if (resultObj.system.cost)
						{
							if (resultObj.system.cost.gp)
							{
								let costInGp = resultObj.system.cost.gp
									+ (resultObj.system.cost.sp /10 )
									+ (resultObj.system.cost.cp /100 );
								costInGp = costInGp * resultObj.system.quantity;
								lootItem.displayCost = costInGp.toString().concat(" gp");
							}
							else if (resultObj.system.cost.sp)
							{
								let costInSp = resultObj.system.cost.sp
									+ (resultObj.system.cost.cp /10 );
								costInSp = costInSp * resultObj.system.quantity;
								lootItem.displayCost = costInSp.toString().concat(" sp");
							}
							else if (resultObj.system.cost.cp)
							{
								let costInCp = resultObj.system.cost.cp;
								costInCp = costInCp * resultObj.system.quantity;
								lootItem.displayCost = costInCp.toString().concat(" cp");
							}
						}

						items.push(lootItem);
					}
				}
			}
		}
		return items;
	}

	async removeUndefinedLoot() {
		var loot = [];
		for (var item of this.lootItems)
		{
			if (item)
				loot.push(item);
		}
		this.lootItems = loot;
	}

	async setPropertyAppropriateNames(item, properties) {
		var suffixes = [];
		var prefixes = [];
		for (var property of properties) {
			if (property.prefixes)
			{
				for (var prefix of property.prefixes)
				{
					if (prefix && prefix.text && prefix.text !== "")
						prefixes.push(prefix.text);
				}
			}

			if (property.suffixes)
			{
				for (var suffix of property.suffixes)
				{
					if (prefix && suffix.text && suffix.text !== "")
						suffixes.push(suffix.text);
				}
			}
		}

		var maxLength = prefixes.length + suffixes.length;
		if (maxLength > 0)
		{
			let roll = await new Roll("1d" + maxLength).evaluate();
			var selectedIndex = roll._total - 1;

			if (selectedIndex < prefixes.length)
			{
				var prefix = prefixes[selectedIndex];
				item.name = prefix + " " + item.name;
			}
			else if (selectedIndex < maxLength)
			{
				var suffixIndex = selectedIndex - prefixes.length;
				var suffix = suffixes[suffixIndex];
				item.name = item.name + " " + suffix;
			}
		}
	}
}
