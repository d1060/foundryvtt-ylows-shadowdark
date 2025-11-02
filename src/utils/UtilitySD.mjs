import CompendiumsSD from "../documents/CompendiumsSD.mjs";

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
		if (typeof str === 'number') return true;
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
				if (sceneToken === token) continue;
				if (!groupedTokens.some(t => t.id === sceneToken.id))
				{
					if (sceneToken._source.name.slugify() === token._source.name.slugify())
					{
						const distance = UtilitySD.distanceBetweenTokens(scene, token, sceneToken);
						if (distance < 1) {
							groupedTokens.push(sceneToken);
						}
					}
				}
			}
		}
		return groupedTokens;
	}

	static getAllNearTokens(primaryToken, distance) {
		let tokens = [];
		for (let token of canvas.scene.tokens) {
			if (token === primaryToken) continue;
			if (UtilitySD.distanceBetweenTokens(canvas.scene, primaryToken, token) < distance)
				tokens.push(token);
		}
		return tokens;
	}

	static distanceBetweenTokens(scene, token1, token2)
	{
		let deltaX = Math.abs(token1._object.center.x - token2._object.center.x);
		let deltaY = Math.abs(token1._object.center.y - token2._object.center.y);
		const xRate = deltaX / (deltaX + deltaY);
		const yRate = deltaY / (deltaX + deltaY);

		let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		distance /= (scene.grid.sizeX < scene.grid.sizeY ? scene.grid.sizeX : scene.grid.sizeY);

		const token1borderDistance = (token1.width * xRate + token1.height * yRate) / 2;
		const token2borderDistance = (token2.width * xRate + token2.height * yRate) / 2;

		distance -= token1borderDistance;
		distance -= token2borderDistance;

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
				Math.hypot(
					(gx - token.center?.x) / gridSize.x,
					(gy - token.center?.y) / gridSize.y
				) <= 0.5
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

		let curr = obj;
		for (const key of keys) {
    		if (curr != null && Object.prototype.hasOwnProperty.call(curr, key)) {
      			curr = curr[key];
    		} else {
      			return false;
    		}
  		}

		if (Array.isArray(curr[lastKey])) {
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

	static capitalize(str) {
		if (typeof str !== 'string' || str.length === 0) return str;
		const c0 = str.charCodeAt(0);
		if (c0 >= 97 && c0 <= 122) {
			return String.fromCharCode(c0 - 32) + str.slice(1);
		}
		return str;
	}

	static sanitizeHTML(content) {
		let sanitized =  foundry.applications.ux.TextEditor.implementation.decodeHTML(content);
		sanitized = sanitized.replace(/\[\[/g, "");
		sanitized = sanitized.replace(/\]\]/g, "");
		sanitized = sanitized.replace(/\/r/g, "");
		sanitized = sanitized.replace(/\\r/g, "");
		return sanitized;
	}

	static adjustDescriptionForLevel(description, level) {
		if (!description.includes("{") || !description.includes("}"))
			return description;

		let openBrackets = description.indexOf("{");
		let closeBrackets = description.indexOf("}");
		do {
			if (closeBrackets > openBrackets) {
				let formula = description.substring(openBrackets + 1, closeBrackets);
				let evaluatedFormula = this.evaluateFormula(formula, level);
				description = description.slice(0, openBrackets) + evaluatedFormula + description.slice(closeBrackets + 1);
			}

			openBrackets = description.indexOf("{");
			closeBrackets = description.indexOf("}");
		} while (openBrackets != -1 && closeBrackets > openBrackets);

		return description;
	}

	static evaluateFormula(formula, level) {
		formula = formula.replace(/L\+(\d+)/, (_, x) => level + Number(x));
		formula = formula.replace(/L\-(\d+)/, (_, x) => level - Number(x));
		formula = formula.replace(/L\*(\d+)/, (_, x) => level * Number(x));
		formula = formula.replace(/L\/(\d+)/, (_, x) => Math.floor(level / Number(x)));
		formula = formula.replace(/L\^(\d+)/, (_, x) => Math.pow(level, Number(x)));
		formula = formula.replace(/(\d+)\+L/, (_, x) => level + Number(x));
		formula = formula.replace(/(\d+)\-L/, (_, x) => Number(x) - level);
		formula = formula.replace(/(\d+)\*L/, (_, x) => level * Number(x));
		formula = formula.replace(/(\d+)\/L/, (_, x) => Math.floow(Number(x) / level));
		formula = formula.replace(/(\d+)\^L/, (_, x) => Math.pow(Number(x), level));
		formula = formula.replace("L", level);

		return this.evaluateNumeric(formula);
	}

	static evaluateNumeric(formula) {
		let openParenthesis = formula.indexOf("(");
		let closeParenthesis = formula.indexOf(")");
		do {
			if (openParenthesis != -1 && closeParenthesis > openParenthesis)
			{
				let subFormula = formula.substring(openParenthesis + 1, closeParenthesis);
				subFormula = this.evaluateNumeric(subFormula);
				formula = formula.slice(0, openParenthesis) + subFormula + formula.slice(closeParenthesis + 1);
			}
			openParenthesis = formula.indexOf("(");
			closeParenthesis = formula.indexOf(")");
		} while (openParenthesis != -1 && closeParenthesis > openParenthesis);

		let accum = null;
		let current = null;
		let operation = null;

		for (const ch of formula) {
			const code = parseInt(ch);
 			if (Number.isNaN(code)) {

				if (current != null) {
					if (accum != null && operation != '') {
						switch (operation) {
							case '+':
								accum += current;
								break;
							case '-':
								accum -= current;
								break;
							case '*':
								accum *= current;
								break;
							case '/':
								accum = Math.floor(accum / current);
								break;
							case '^':
								accum = Math.pow(accum, current);
								break;
						}
					}
					else if (accum == null)
						accum = current;

					current = null;
				}

				switch (ch) {
					case '+':
					case '-':
					case '*':
					case '/':
					case '^':
						operation = ch;
						break;
					default:
						operation = '';
				}
			} else { // It's a number
				current = current * 10 + code;
			}
		}

		if (operation != '' && accum != null && current != null)
		{
			switch (operation) {
				case '+':
					accum += current;
					break;
				case '-':
					accum -= current;
					break;
				case '*':
					accum *= current;
					break;
				case '/':
					accum = Math.floor(accum / current);
					break;
				case '^':
					accum = Math.pow(accum, current);
					break;
			}
		}
		else if (accum == null && current != null)
			return current;

		return accum;
	}

	static parseIntOrZero(number)
	{
		const n = parseInt(number, 10);
		if (Number.isNaN(n)) return 0
		return n;
	}

	static parseIntIfNumeric(number) {
		if (!this.isNumeric(number))
			return number;
		if (typeof number === 'number') return number;
		return this.parseIntOrZero(number);
	}

	static normalize(v) {
		const m = Math.hypot(v.x, v.y) || 1; return {x:v.x/m, y:v.y/m};
	}

	static perpendicular(unit) {
		return {x:-unit.y, y:unit.x};
	}

	static perp(u) {
		return {x: -u.y, y: u.x};
	}

	static polygonalAlign(points, opts = {}) {
		const n = points.length;
		if (n <= 1) {
			return { aligned: points.slice(), center: {...(points[0] || {x:0,y:0})}, radius: 0, rotation: 0 };
		}

		const scale = (opts.scale ?? 1);

		// --- Center: centroid (unless provided)
		const center = opts.center ?? (()=>{
			let sx = 0, sy = 0;
			for (const p of points) { sx += p.x; sy += p.y; }
			return { x: sx / n, y: sy / n };
		})();

		// --- Polar coords relative to center
		const polar = points.map((p, idx) => {
			const dx = p.x - center.x, dy = p.y - center.y;
			return { idx, x:p.x, y:p.y, r: Math.hypot(dx,dy), a: Math.atan2(dy,dx) };
		});

		// --- Radius: mean radial distance (unless provided)
		const radius = (opts.radius ?? (polar.reduce((s,p)=>s+p.r,0) / n)) * scale;

		// Guard tiny radius
		const R = Math.max(radius, 1e-6);

		// --- Sort by angle to define the order around the center
		polar.sort((a,b)=>a.a-b.a);

		// Unwrap angles to a continuous increasing sequence (avoid 2π jumps)
		const unwrap = (arr) => {
			const out = arr.map(o=>({ ...o, au: o.a }));
			for (let i=1;i<out.length;i++){
			let d = out[i].au - out[i-1].au;
			if (d <= -Math.PI) out[i].au += 2*Math.PI * Math.ceil((out[i-1].au - out[i].au) / (2*Math.PI));
			else if (d > Math.PI) out[i].au -= 2*Math.PI * Math.ceil((out[i].au - out[i-1].au) / (2*Math.PI));
			}
			return out;
		};
		const polUn = unwrap(polar);

		// Try both orientations and all cyclic offsets; pick minimal error
		const TWO_PI = Math.PI * 2;
		const step = TWO_PI / n;

		function fitForOrientation(sign) {
			let best = { err: Infinity, offset: 0, theta0: 0 };
			for (let o = 0; o < n; o++) {
			// Find rotation θ0 that best aligns angles (on the circle) for this offset+orientation
			// θ0 = arg( mean_i exp(j*(α_i - s*(i+o))) ), s = sign*2π/n
			const s = sign * step;
			let cs = 0, sn = 0;
			for (let i = 0; i < n; i++) {
				const delta = polUn[i].au - s * (i + o);
				cs += Math.cos(delta);
				sn += Math.sin(delta);
			}
			const theta0 = Math.atan2(sn, cs);

			// Compute squared positional error for this θ0, offset o
			let err = 0;
			for (let i = 0; i < n; i++) {
				const phi = theta0 + s * (i + o);
				const tx = center.x + R * Math.cos(phi);
				const ty = center.y + R * Math.sin(phi);
				const dx = polUn[i].x - tx;
				const dy = polUn[i].y - ty;
				err += dx*dx + dy*dy;
			}
			if (err < best.err) best = { err, offset: o, theta0 };
			}
			return best;
		}

		const fitCCW = fitForOrientation(+1);
		const fitCW  = fitForOrientation(-1);
		const useCW = (opts.clockwise === true) || (opts.clockwise === undefined && fitCW.err < fitCCW.err);
		const fit = useCW ? fitCW : fitCCW;
		const s = (useCW ? -1 : +1) * step;

		// Build target positions mapped back to original input order
		const alignedBySorted = new Array(n);
		for (let i = 0; i < n; i++) {
			const phi = fit.theta0 + s * (i + fit.offset);
			alignedBySorted[i] = {
			idx: polUn[i].idx,
			x: center.x + R * Math.cos(phi),
			y: center.y + R * Math.sin(phi)
			};
		}

		// Reorder to the original input order
		const aligned = new Array(n);
		for (const v of alignedBySorted) aligned[v.idx] = { x: v.x, y: v.y };

		// Return also the effective rotation (angle of vertex 0)
		return aligned;
	}

	static circleAlign(points)
	{
		let c = {x : 0, y : 0};
		for (let p of points) {
			c.x += p.x; 
			c.y += p.y;
		}
		c.x /= points.length; 
		c.y /= points.length;

		let r = 0;
		for (let p of points) {
			let d = (p.x - c.x)*(p.x - c.x) + (p.y - c.y)*(p.y - c.y);
			if (d > r)
				r = d;
		}
		r = Math.sqrt(r);

		for (let p of points) {
			let v = {x: p.x - c.x, y: p.y - c.y};
			v = this.normalize(v);
			p.x = c.x + v.x * r;
			p.y = c.y + v.y * r;
		}
		return [points, c, r];
	}

	static circleFit(points) {
		const n = points?.length|0;
		
		// --- 1) Best-fit circle (Kåsa LSQ) ---
		// Solve [Σx² Σxy Σx][B] = -[Σx z], with z = x²+y²
		//       [Σxy Σy² Σy][C]    [Σy z]
		//       [Σx  Σy   n ][D]    [Σz  ]
		let Sx=0,Sy=0,Sxx=0,Syy=0,Sxy=0,Sxz=0,Syz=0,Sz=0;
		for (const p of points) {
			const x=p.x, y=p.y, z=x*x+y*y;
			Sx+=x; Sy+=y; Sxx+=x*x; Syy+=y*y; Sxy+=x*y; Sxz+=x*z; Syz+=y*z; Sz+=z;
		}
		const A = [
			[Sxx, Sxy, Sx],
			[Sxy, Syy, Sy],
			[Sx,  Sy,  n ]
		];
		const b = [-Sxz, -Syz, -Sz];

		const sol = this.solve3x3(A, b); // {x:B, y:C, z:D} or null if singular
		// Fallback: centroid + mean radius if singular/degenerate
		let cx, cy, r;
		if (!sol) {
			cx = Sx/n; cy = Sy/n;
			let rSum = 0; for (const p of points) rSum += Math.hypot(p.x-cx, p.y-cy);
			r = rSum / n;
		} else {
			const B=sol.x, C=sol.y, D=sol.z;
			cx = -B/2; cy = -C/2;
			const rr = (B*B + C*C)/4 - D;
			r = rr > 0 ? Math.sqrt(rr) : 0;
		}

		// --- 2) Push points to the circle (preserve order around center) ---
		const polar = points.map((p, idx) => {
			const a = Math.atan2(p.y - cy, p.x - cx);
			return { idx, a };
		}).sort((u,v)=>u.a-v.a);

		const aligned = new Array(n);
		let angles  = new Array(n);
		for (let k=0; k<n; k++) {
			const a = polar[k].a;
			const x = cx + r * Math.cos(a);
			const y = cy + r * Math.sin(a);
			aligned[polar[k].idx] = { x, y }; // mapped back to original order
			angles[k] = a;
		}

		//if (opts.mutate) {
		//	for (let i=0;i<n;i++) { points[i].x = aligned[i].x; points[i].y = aligned[i].y; }
		//}
		angles = polar.map(p=>p.a);

		return [aligned, angles, {x: cx, y: cy}, r];
	}

	/* ---------- tiny 3x3 solver (Gaussian elimination) ---------- */
	static solve3x3(A, b){
		// A is 3x3, b length 3. Mutate local copies.
		const m = [A[0].slice(), A[1].slice(), A[2].slice()];
		const v = b.slice();

		// pivot 0
		if (Math.abs(m[0][0]) < Math.abs(m[1][0])) { [m[0],m[1]] = [m[1],m[0]]; [v[0],v[1]] = [v[1],v[0]]; }
		if (Math.abs(m[0][0]) < Math.abs(m[2][0])) { [m[0],m[2]] = [m[2],m[0]]; [v[0],v[2]] = [v[2],v[0]]; }
		if (Math.abs(m[0][0]) < 1e-12) return null;
		let f = m[1][0]/m[0][0];
		for(let j=0;j<3;j++) m[1][j]-=f*m[0][j]; v[1]-=f*v[0];
		f = m[2][0]/m[0][0];
		for(let j=0;j<3;j++) m[2][j]-=f*m[0][j]; v[2]-=f*v[0];

		// pivot 1
		if (Math.abs(m[1][1]) < Math.abs(m[2][1])) { [m[1],m[2]] = [m[2],m[1]]; [v[1],v[2]] = [v[2],v[1]]; }
		if (Math.abs(m[1][1]) < 1e-12) return null;
		f = m[2][1]/m[1][1];
		for(let j=1;j<3;j++) m[2][j]-=f*m[1][j]; v[2]-=f*v[1];

		// back-substitute
		if (Math.abs(m[2][2]) < 1e-12) return null;
		const z = v[2]/m[2][2];
		const y = (v[1] - m[1][2]*z)/m[1][1];
		const x = (v[0] - m[0][1]*y - m[0][2]*z)/m[0][0];
		return { x, y, z };
	}

	static closestPoint(points, point)
	{
		if (!points || points.length == 0) return point;
		let closest = Number.MAX_VALUE;
		let closestPoint = point;
		for (let p of points) {
			const d = Math.hypot(p.x - point.x, p.y - point.y);
			if (d < closest)
			{
				closest = d;
				closestPoint = p;
			}
		}
		return closestPoint;
	}

	static pointProjectionToLine(p, a, b) {
		const abx = b.x - a.x, aby = b.y - a.y;
		const ab2 = abx * abx + aby * aby;
		if (ab2 === 0) return { x: a.x, y: a.y };

		const apx = p.x - a.x, apy = p.y - a.y;
		const t = (apx * abx + apy * aby) / ab2;
		return { x: a.x + t * abx, y: a.y + t * aby };
	}

	static pointToSegmentDistance(p, a, b) {
		const projection = this.pointProjectionToLine(p, a, b);
		const abx = b.x - a.x, aby = b.y - a.y;
		const pax = projection.x - a.x, pay = projection.y - a.y;
		const pbx = projection.x - b.x, pby = projection.y - b.y;

		let distABSqr = abx * abx + aby * aby;
		let distPASqr = pax * pax + pay * pay;
		let distPBSqr = pbx * pbx + pby * pby;

		if (distPASqr > distABSqr)
		{
			return Math.hypot(p.x - b.x, p.y - b.y);
		}
		else if (distPBSqr > distABSqr)
		{
			return Math.hypot(p.x - a.x, p.y - a.y);
		}
		else
		{
			return Math.hypot(p.x - projection.x, p.y - projection.y);
		}
	}

	static uniqBy(arr, keyFn) {
  		const out = [], seen = new Set();
  		for (const item of arr) {
    		const k = keyFn(item);
    		if (!seen.has(k)) { seen.add(k); out.push(item); }
  		}
  		return out;
	}

	static roundTo(x, n = 0)
	{
  		const f = 10 ** n;
  		return Math.round((x + Number.EPSILON) * f) / f;
	}

	static coSort(arr1, arr2, compare = (a, b) => a - b) {
		if (arr1.length !== arr2.length) throw new Error("Arrays must have same length");

		// robust numeric compare (keeps NaN at the end)
		const numCmp = (a, b) =>
			Number.isNaN(a) ? (Number.isNaN(b) ? 0 : 1) :
			Number.isNaN(b) ? -1 : compare(a, b);

		const zipped = arr1.map((v, i) => [v, arr2[i]]);
		zipped.sort((p, q) => numCmp(p[0], q[0]));

		for (let i = 0; i < zipped.length; i++) {
			arr1[i] = zipped[i][0];
			arr2[i] = zipped[i][1];
		}
	}

	static async AreYouSureDialog(titleKey, textKey) {
		const returnOption = await foundry.applications.api.DialogV2.wait({
			classes: ["shadowdark", "shadowdark-dialog", "window-app", 'themed', 'theme-light'],
			window: {
				resizable: false,
				title: `${game.i18n.localize(titleKey)}`,
			},
			content: '<div class="shadowdark-dialog"><p>' + game.i18n.localize(textKey) + '</p></div>',
			buttons: [
				{
					action: 'Yes',
					icon: '<i class="fa fa-check"></i>',
					label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`
				},
				{
					action: 'Cancel',
					icon: '<i class="fa fa-times"></i>',
					label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
				},
			],
			default: "Yes",
		});

		return returnOption == 'Yes';
	}

	static async actorChoiceDialog(options) {
		if (!options.template) options.template = "systems/shadowdark/templates/dialog/choose-actor.hbs";
		if (!options.title) options.title = "SHADOWDARK.dialog.item.pick_up.title";
		if (!options.label) options.label = "SHADOWDARK.dialog.item.give_item.label";

		const playerActors = game.actors.filter(
			actor => actor.type === "Player" && actor != this.actor
		);

		if (options.addSomeoneElse) {
			playerActors.push({
				_id: 'someoneElse',
				name: "Someone Else",
				img: 'icons/environment/people/traveler.png'
			});
		}

		if (!playerActors.length) return null;
		
		const content = await foundry.applications.handlebars.renderTemplate(
			options.template,
			{
				playerActors,
				data: {
					item: options.item
				},
				label: options.label,
			}
		);

		const targetActor = await foundry.applications.api.DialogV2.wait({
				classes: ["app", "shadowdark", "shadowdark-dialog", "window-app", 'themed', 'theme-light'],
				window: {
					resizable: false,
					title: game.i18n.localize(options.title),
				},
				content,
				buttons: [
					{
						action: 'select',
						icon: "fa fa-square-check",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.select")}`,
						callback: event => {
							const checkedRadio = event.currentTarget.querySelector("input[type='radio']:checked");
							return checkedRadio?.getAttribute("id") ?? false;
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
				close: () => shadowdark.debug("Closed Actor Choice Dialog"),
		});

		if (targetActor && targetActor != 'someoneElse')
			return game.actors.get(targetActor);

		return null;
	}

	static async choiceDialog(options) {
		if (!options.choices || !options.choices.length) return null;
		if (!options.template) options.template = "systems/shadowdark/templates/dialog/choose-document.hbs";
		if (!options.title) options.title = "SHADOWDARK.dialog.item.pick_up.title";
		if (!options.label) options.label = "SHADOWDARK.dialog.item.give_item.label";

		for (const choice of options.choices) {
			if (choice.system.description) {
				choice.enrichedDescription =  await foundry.applications.ux.TextEditor.implementation.enrichHTML( 
                choice.system.description, 
                { 
                    async: true,
                });
			} else {
				choice.enrichedDescription = "";
			}
			choice.enrichedDescription = foundry.utils.escapeHTML(choice.enrichedDescription);
		}

		const content = await foundry.applications.handlebars.renderTemplate(
			options.template,
			{
				choices: options.choices,
				label: options.label,
			}
		);

		const target = await foundry.applications.api.DialogV2.wait({
				classes: ["app", "shadowdark", "shadowdark-dialog", "window-app", 'themed', 'theme-light'],
				window: {
					resizable: false,
					title: game.i18n.localize(options.title),
				},
				content,
				buttons: [
					{
						action: 'select',
						icon: "fa fa-square-check",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.select")}`,
						callback: event => {
							const checkedRadio = event.currentTarget.querySelector("input[type='radio']:checked");
							return checkedRadio?.getAttribute("id") ?? false;
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
				close: () => shadowdark.debug("Closed Actor Choice Dialog"),
		});

		if (target)
			return await fromUuid(target);

		return null;
	}

	static async fixRollTablesByCompendium(compendiumName) {
		const documents = await CompendiumsSD._documents(
			"RollTable", null, true
		);

		const packs = game.packs.contents.filter(pack => pack.collection.startsWith(compendiumName));
		
		for (const document of documents) {
			const compendium = this.getCompendiumFromUuid(document.uuid);
			if (compendium != 'Compendium.' + compendiumName) continue;

			shadowdark.debug(`Processing Roll Table '${document.name}' in '${compendium}'`);

			const lootTable = await fromUuid(document.uuid);
			if (!lootTable) continue;
			const updates = [];

			for (const result of lootTable.results.contents) {
				if (!result || !result.documentUuid)
					continue;
				const resultCompendium = this.getCompendiumFromUuid(result.documentUuid);
				if (compendium != resultCompendium) {
					shadowdark.debug(`    Result '${result.name}' from compendium '${resultCompendium}' doesn't match Loot table's '${compendium}'`);

					let foundItemInPack;
					for (const pack of packs) {
						foundItemInPack = pack.index.contents.find(c => c.name.slugify() === result.name.slugify());
						if (foundItemInPack) break;
					}

					if (foundItemInPack) {
						const item = await fromUuid(foundItemInPack.uuid);
						shadowdark.debug(`        Found Item '${item.name}' in selected compendium. Replacing it.`);

						const isFromPack = !!item.pack;
						updates.push({
							_id: result.id,
							documentCollection: isFromPack ? item.pack : item.documentName,
							documentUuid: item.uuid,
							img: item.img
						});
					}
				}
			}

			if (updates.length)
				await lootTable.updateEmbeddedDocuments("TableResult", updates);
		}
		shadowdark.debug(`Done Processing Roll Tables`);
	}

	static getCompendiumFromUuid(uuid) {
		if (!uuid) return uuid;
		let match = uuid.match(/(Compendium\..*?)\./);
		if (match)
			return match[1];
		match = uuid.match(/(.*?)\./);
		if (match)
			return match[1];
		return null;
	}
}
