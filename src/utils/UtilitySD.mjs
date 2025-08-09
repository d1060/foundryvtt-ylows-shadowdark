export default class UtilitySD {

	static generateUUID() { // Public Domain/MIT
		var d = new Date().getTime();//Timestamp
		var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16;//random number between 0 and 16
			if(d > 0){//Use timestamp until depleted
				r = (d + r)%16 | 0;
				d = Math.floor(d/16);
			} else {//Use microseconds since page-load if supported
				r = (d2 + r)%16 | 0;
				d2 = Math.floor(d2/16);
			}
			return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
	}

	static toDom(value, asHtml = false) {
		const isJQ = value instanceof jQuery;

		const node = isJQ ? value[0] ?? null
							: value instanceof Node ? value
							: null;

		if (!node) return value;

		return asHtml ? node.outerHTML : node;
	}

	static isNumeric(str) {
		if (typeof str !== 'string' || str.length === 0) return false;

		for (let i = 0, len = str.length; i < len; ++i) {
			const code = str.charCodeAt(i) - 48;
			if (code >>> 0 > 9) return false;
		}
		return true;
	}
	
	// Checks that the current user has permissions to create Actors
	//
	static canCreateCharacter() {
		return game.permissions.ACTOR_CREATE.includes(game.user.role);
	}


	static combineCollection(map1, map2) {
		map2.forEach(value => {
			if (map1.has(value._id)) {
				shadowdark.warn(`Map already contains an item with key ${key}`);
			}
			else {
				map1.set(value._id, value);
			}
		});

		return map1;
	}


	/** Create a roll Macro from an Item dropped on the hotbar.
	 *  Get an existing item macro if one exists, otherwise create a new one.
	 *
	 * @param {object} data - The dropped data
	 * @param {number} slot - The hotbar slot to use
	 * @returns {Promise} - Promise of assigned macro or a notification
	 */
	static async createHotbarMacro(data, slot) {
		const itemData = await Item.implementation.fromDropData(data);

		if (!itemData) {
			return ui.notifications.warn(
				game.i18n.localize("SHADOWDARK.macro.warn.create_item_requires_ownership")
			);
		}

		let command = `await Hotbar.toggleDocumentSheet("${itemData.uuid}");`;
		let flags = {};
		let name = itemData.name;

		if (itemData.isRollable) {
			command = `shadowdark.macro.rollItemMacro("${itemData.name}")`;
			flags = {"shadowdark.itemMacro": true};
			name = `${game.i18n.localize("Roll")} ${name}`;
		}
		else {
			name = `${game.i18n.localize("Display")} ${name}`;
		}

		const macroData = {
			command,
			flags,
			img: itemData.img,
			name,
			scope: "actor",
			type: CONST.MACRO_TYPES.SCRIPT,
		};

		// Assign the macro to the hotbar
		const macro =
			game.macros.find(m => m.name === macroData.name
				&& m.command === macroData.command
				&& m.author.isSelf
			) || (await Macro.create(macroData));

		game.user.assignHotbarMacro(macro, slot);
	}


	static async createItemFromSpell(type, spell) {
		const name = (type !== "Spell")
			? game.i18n.format(
				`SHADOWDARK.item.name_from_spell.${type}`,
				{ spellName: spell.name }
			)
			: spell.name;

		const itemData = {
			type,
			name,
			system: spell.system,
		};

		if (type === "Spell") {
			itemData.img = spell.img;
		}
		else {
			delete itemData.system.lost;
			itemData.system.magicItem = true;
			itemData.system.spellImg = spell.img;
			itemData.system.spellName = spell.name;
		}
		return itemData;
	}


	static diceSound() {
		const sounds = [CONFIG.sounds.dice];
		const src = sounds[0];
		game.audio.play(src, {volume: 1});
	}


	static foundryMinVersion(version) {
		const majorVersion = parseInt(game.version.split(".")[0]);
		return majorVersion >= version;
	}


	// Work out the current Actor.
	// If the user is the GM then use the current token they have selected.
	//
	static async getCurrentActor() {
		let actor = null;

		if (game.user.isGM) {
			const controlledTokenCount = canvas.tokens.controlled.length;
			if (controlledTokenCount > 0) {
				if (controlledTokenCount !== 1) {
					return ui.notifications.warn(
						game.i18n.localize("SHADOWDARK.error.too_many_tokens_selected")
					);
				}
				else {
					actor = canvas.tokens.controlled[0].actor;
				}
			}
		}
		else {
			actor = game.user.character;
		}

		return actor;
	}


	/**
	 * Creates de-duplicated lists of Selected and Unselected Items.
	 *
	 * @param {allItems} Array A list of all available items
	 * @param {items} Array A list of currently selected items
	 *
	 * @returns {Promise} Promise which represents an array containing both the
	 * selected and unselected skill arrays
	 */
	static async getDedupedSelectedItems(allItems, items) {
		const unselectedItems = [];
		const selectedItems = [];

		allItems.forEach(item => {
			if (!items.includes(item.uuid)) {
				unselectedItems.push(item);
			}
		});

		for (const itemUuid of items) {
			selectedItems.push(await this.getFromUuid(itemUuid));
		}

		selectedItems.sort((a, b) => a.name.localeCompare(b.name));

		return [selectedItems, unselectedItems];
	}


	static async getFromUuid(uuid) {
		const itemObj = await fromUuid(uuid);
		if (itemObj) {
			return itemObj;
		}
		else {
			return {name: "[Invalid ID]", uuid: uuid};
		}
	}


	static getFromUuidSync(uuid) {
		const itemObj =  fromUuidSync(uuid);
		if (itemObj) {
			return itemObj;
		}
		else {
			return {name: "[Invalid ID]", uuid: uuid};
		}
	}


	static async getItemsFromRollResults(results) {
		const items = [];

		for (const result of results) {
			// const uuid = [
			// 	"Compendium",
			// 	result.documentCollection,
			// 	result.documentId,

			// ].join(".");

			items.push(await fromUuid(result.documentUuid));
		}

		return items;
	}


	static getNextDieInList(die, allDice) {
		if (die === false) return die;

		for (let i = 0; i < allDice.length; i++) {
			if (allDice[i] === die && allDice.length > i + 1) {
				return allDice[i + 1];
			}
		}

		return die;
	}


	static async getSlugifiedItemList(items) {
		const itemList = {};
		items.map(i => itemList[i.name.slugify()] = i.name );
		return itemList;
	}


	static isPrimaryGM() {
		if (!game.user.isGM) return false;

		// if primaryGM flag is true, return
		if (game.user.getFlag("shadowdark", "primaryGM")) {
			return true;
		}
		else {
			// locate the primary GM
			const primaryGMs = game.users.filter(x =>
				x.active === true && x.flags.shadowdark.primaryGM === true
			);
			if (primaryGMs.length === 0) {
				// if no primary GM, set current user as primary GM
				game.user.setFlag("shadowdark", "primaryGM", true);
				shadowdark.log("Promoted to Primary GM");
				return true;
			}
			else {
				return false;
			}
		}
	}


	static async loadLegacyArtMappings() {
		// search modules for legacy art mappings and convert to new format
		for (const module of game.modules) {
			if (!module.active) continue;
			const flags = module.flags?.[module.id];
			if (flags?.["shadowdark-art"]) {
				module.flags.compendiumArtMappings = {
					shadowdark: {
						mapping: flags["shadowdark-art"],
					},
				};
			}
		}
	}


	// If this is a new release, show the release notes to the GM the first time
	// they login
	static async showNewReleaseNotes() {
		if (game.user.isGM) {
			const savedVersion = game.settings.get("shadowdark", "systemVersion");
			const systemVersion = game.system.version;

			if (systemVersion !== savedVersion) {
				Hotbar.toggleDocumentSheet(
					CONFIG.SHADOWDARK.JOURNAL_UUIDS.RELEASE_NOTES
				);

				game.settings.set(
					"shadowdark", "systemVersion",
					systemVersion
				);
			}
		}
	}


	static async sleep(millisecs=1000) {
		return new Promise((resolve, reject) => {
  			setTimeout(resolve, millisecs);
		});
	}


	static async toggleItemDetails(target) {
		const listObj = $(target).parent();

		// if details are already shown, close details
		if (listObj.hasClass("expanded")) {
			const detailsDiv = listObj.find(".item-details");
			detailsDiv.slideUp(200, () => detailsDiv.remove());
		}
		else {

			const itemId = listObj.data("uuid");
			const item = await fromUuid(itemId);

			let details = "";
			if (item) {
				details = await item.getDetailsContent();
			}

			const detailsDiv = document.createElement("div");
			detailsDiv.setAttribute("style", "display: none");
			detailsDiv.classList.add("item-details");
			detailsDiv.insertAdjacentHTML("afterbegin", details);
			listObj.append(detailsDiv);
			$(detailsDiv).slideDown(200);
		}

		listObj.toggleClass("expanded");
	}

	static getGroupedTokens(scene, groupedTokens) {
		for (var token of groupedTokens)
		{
			for (var sceneToken of scene.tokens)
			{
				if (!groupedTokens.some(t => t.id === sceneToken.id))
				{
					if (sceneToken._source.name.slugify() === token._source.name.slugify())
					{
						const distance = UtilitySD.distanceBetweenTokens(scene, token, sceneToken);
						if (distance == 0) continue;
						if (distance <= 1) {
							groupedTokens.push(sceneToken);
						}
					}
				}
			}
		}
		return groupedTokens;
	}

	static distanceBetweenTokens(scene, token1, token2)
	{
		const deltaX = (token1.x - token2.x) / scene.grid.sizeX;
		const deltaY = (token1.y - token2.y) / scene.grid.sizeY;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		return distance;
	}

	static searchDeltas = [
		[-0.5, -0.75],
		[-1, 0],
		[-0.5, 0.75],
		[0.5, 0.75],
		[1, 0],
		[0.5, -0.75],
	];

	static findNearestFreeGridPosition(gx, gy) {
		const gridSize = {x: canvas.grid.sizeX, y: canvas.grid.sizeY};

		// Check if the grid cell is occupied by any token
		function isOccupied(gx, gy) {
			const rect = new PIXI.Rectangle(gx, gy, gridSize.x * 0.5, gridSize.y * 0.75);

			return canvas.tokens.placeables.some(token =>
				token.document.x < rect.right &&
				token.document.x + token.document.width * gridSize.x > rect.left &&
				token.document.y < rect.bottom &&
				token.document.y + token.document.height * gridSize.y > rect.top
			);
		}

		let radius = 1;
		while (radius < 5)
		{
			let searchPoint = [radius, 0];
			for (let a = 0; a < 6; a++) {
				let searchDelta = UtilitySD.searchDeltas[a];
				for (let s = 0; s < radius; s++) {
					const nx = gx + searchPoint[0] * gridSize.x;
					const ny = gy + searchPoint[1] * gridSize.y;

					if (!isOccupied(nx, ny)) {
						return [nx, ny];
					}

					searchPoint[0] += searchDelta[0];
					searchPoint[1] += searchDelta[1];
				}
			}
			radius++;
		}

		// No free space found
		return [gx, gy];
	}

	static duplicateString(str, numDuplications) {
		for (var i = 1; i <= numDuplications; i++)
		{
			switch (str)
			{
				case "One":
					str = "Two";
				break;
				case "Two":
					str = "Four";
				break;
				case "Four":
					str = "Eight";
				break;
				case "Eight":
					str = "16";
				break;
				case "16":
					str = "32";
				break;
				case "32":
					str = "64";
				break;
				case "64":
					str = "128";
				break;
				case "128":
					str = "256";
				break;
				case "256":
					str = "512";
				break;
				case "512":
					str = "1024";
				break;
			}
		}
		return str;
	}

	static camelToTitleCase(camelStr) {
  		if (!camelStr) return "";
  		const spaced = camelStr.replace(/([A-Z])/g, " $1");
  		return spaced.charAt(0).toUpperCase() + spaced.slice(1);
	}

	static slideDown(element, duration = 300) {
		element.style.removeProperty('display');
		let display = window.getComputedStyle(element).display;
		if (display === 'none') display = 'block';
		element.style.display = display;

		const height = element.scrollHeight + 'px';
		element.style.overflow = 'hidden';
		element.style.height = '0';
		element.offsetHeight; // Force reflow

		element.style.transition = `height ${duration}ms ease`;
		element.style.height = height;

		window.setTimeout(() => {
			element.style.removeProperty('height');
			element.style.removeProperty('overflow');
			element.style.removeProperty('transition');
		}, duration);
	}

	static slideUp(element, duration = 300) {
		element.style.height = element.scrollHeight + 'px'; // Set height explicitly
		element.style.overflow = 'hidden';
		element.offsetHeight; // Force reflow

		element.style.transition = `height ${duration}ms ease`;
		element.style.height = '0';

		window.setTimeout(() => {
			element.style.display = 'none';
			element.style.removeProperty('height');
			element.style.removeProperty('overflow');
			element.style.removeProperty('transition');
		}, duration);
	}

	static copyItemNameAndEffects(target, source) {
		target.name = source.name;

		for (const sourceEffect of source.effects ?? []) {
			for (const targetEffect of target.effects ?? []) {
				targetEffect.schema.name = 'BaseActiveEffect.schema';
				
				for (const sourceEffectChange of sourceEffect.changes ?? []) {
					for (const targetEffectChange of targetEffect.changes ?? []) {
						if (targetEffectChange.key === sourceEffectChange.key && targetEffectChange.value === 'REPLACEME') {
							targetEffectChange.value = sourceEffectChange.value;
							break;
						}
					}
				}

			}
		}

		return target;
	}

	static getSelectedUuid(form, target)
	{
		const selectedValue = target.value;
		const datalistId = target.getAttribute("list");
		const datalist = form.querySelector('datalist[id="' + datalistId + '"]');

		const matchedOption = Array.from(datalist.options).find(
    		(option) => option.value === selectedValue
  		);

		if (matchedOption) {
    		return matchedOption.dataset.uuid;
  		}
		return null;
	}

	static isNestedPropertyArray(obj, path) {
		const keys = path?.split(".") ?? [];
		const lastKey = keys.pop() ?? null;
		const target = keys.reduce((o, key) => o[key], obj);

		if (!target) return null;

		if (Array.isArray(target[lastKey])) {
			return true;
		} else {
			return false;
		}		
	}

	static setNestedProperty(obj, path, value) {
		const keys = path?.split(".") ?? [];
		const lastKey = keys.pop() ?? null;
		const target = keys.reduce((o, key) => o[key], obj);

		if (!lastKey) return;

		if (Array.isArray(target[lastKey])) {
			target[lastKey].push(value);
		} else {
			target[lastKey] = value;
		}		
	}

	static getNestedProperty(obj, path) {
  		return path?.split('.')?.reduce((o, key) => o?.[key], obj) ?? null;
	}

    static multiplyDamage(damage, factor) {
		if (!damage.includes('d'))
		{
			let damageInt = parseInt(damage);
			damageInt *= factor;
			return damageInt;
		}
		if (factor <= 0)
			return '';

		const parts = damage.split('d');
		const numDice = parseInt(parts[0]);
		parts[0] = numDice * factor;
		return parts.join('d');
	}

	static addDamageDie(damage, numdie) {
		if (typeof damage !== 'string' || !damage.includes('d'))
		{
			let damageInt = parseInt(damage);
			return damageInt + numdie;
		}
		if (numdie <= 0)
			return damage;

		const parts = damage.split('d');
		const numDice = parseInt(parts[0]);
		parts[0] = numDice + numdie;
		return parts.join('d');
	}

	static enhanceDamageDie(damage, increases) {
		if (typeof damage !== 'string' || !damage.includes('d'))
			return damage;
		if (increases <= 0)
			return damage;

		const parts = damage.split('d');

		let damageDiceIndex = shadowdark.config.DAMAGE_DICE.indexOf('d'+parts[1]);
		if (damageDiceIndex === -1)
			return damage;

		damageDiceIndex += increases;
		if (damageDiceIndex > shadowdark.config.DAMAGE_DICE.length - 1)
			damageDiceIndex = shadowdark.config.DAMAGE_DICE.length - 1;

		parts[1] = shadowdark.config.DAMAGE_DICE[damageDiceIndex];
		let newDamage = parts.join('d');
		newDamage = newDamage.replace("dd", "d");
		return newDamage;
	}

    static addDamage(damage1, damage2) {
		if (typeof damage1 === 'string' && damage1.includes('d') && typeof damage2 === 'string' && damage2.includes('d'))
		{
			const parts1 = damage1.split('d');
			const parts2 = damage2.split('d');

			const numDice1 = parseInt(parts1[0]);
			const numDice2 = parseInt(parts2[0]);

			const dieType1 = parseInt(parts1[1]);
			const dieType2 = parseInt(parts2[1]);

			if (dieType1 === dieType2)
			{
				parts1[0] = numDice1 + numDice2;
				return parts1.join('d');
			}
			return damage1 + '+' + damage2;
		}
		else if (typeof damage1 === 'string' && damage1.includes('d'))
		{
			let damageInt2 = parseInt(damage2);
			if (damageInt2 > 0)
				return damage1 + '+' + damage2;
			else
				return damage1;
		}
		else if (typeof damage2 === 'string' && damage2.includes('d'))
		{
			let damageInt1 = parseInt(damage1);
			if (damageInt1 > 0)
				return damage2 + '+' + damage1;
			else
				return damage2;
		}

		let damageInt1 = parseInt(damage1);
		let damageInt2 = parseInt(damage2);
		return damageInt1 + damageInt2;
	}

	static isObject(value) {
		return (
			typeof value === 'object' &&
			value !== null &&
			!Array.isArray(value)
		);
	}

	static sanitizeHTML(content) {
		let sanitized =  foundry.applications.ux.TextEditor.implementation.decodeHTML(content);
		sanitized = sanitized.replace(/\[\[/g, "");
		sanitized = sanitized.replace(/\]\]/g, "");
		sanitized = sanitized.replace(/\/r/g, "");
		sanitized = sanitized.replace(/\\r/g, "");
		return sanitized;
	}
}
