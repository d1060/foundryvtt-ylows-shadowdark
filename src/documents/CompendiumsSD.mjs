export default class CompendiumsSD {

	static _collectionFromArray(array) {
		const collection = new Collection();
		for (let d of array) {
			collection.set(d._id, d);
		}
		return collection;
	 }

	static async _documents(type, subtype=null, filterSources=true) {
		let sources = [];

		if (filterSources === true) {
			sources = game.settings.get("shadowdark", "sourceFilters") ?? [];
		}

		const sourcesSet = sources.length !== 0;

		let docs = [];

		// Iterate through the Packs, adding them to the list
		for (let pack of game.packs) {
			if (pack.metadata.type !== type) continue;

			let documents = await pack.getIndex({fields: ["system"]});

			// filter by subtype
			if (subtype !== null) {
				documents = documents.filter(d => d.type === subtype);
			}

			for (const doc of documents) {
				docs.push(doc);
			}
		}

		// filter out non selected sources
		if (sourcesSet) {
			docs = docs.filter(
				d => {
					const source = d.system?.source?.title ?? "";
					return source === "" || sources.includes(source);
				}
			);
		}

		// Dedupe and sort the list alphabetically
		docs = Array.from(new Set(docs)).sort(
			(a, b) => a.name.localeCompare(b.name)
		);

		// return new collection
		return this._collectionFromArray(docs);
	}

	static async ammunition(filterSources=true) {
		const documents = shadowdark.utils.combineCollection(
			await CompendiumsSD._documents("Item", "Basic", filterSources),
			await CompendiumsSD._documents("Item", "Weapon", filterSources)
		);

		return this._collectionFromArray(
			documents.filter(document => document.system.isAmmunition)
		);
	}

	static async ancestries(filterSources=true) {
		return CompendiumsSD._documents("Item", "Ancestry", filterSources);
	}

	static async ancestryNameTables(filterSources=true) {
		const documents = await CompendiumsSD._documents(
			"RollTable", null, filterSources
		);

		return this._collectionFromArray(
			documents.filter(
				document => document && document.name.match(/Character\s+Names/i)
			)
		);
	}

	static async britannianRunes(filterSources=true) {
		const documents = await CompendiumsSD._documents(
			"RollTable", null, filterSources
		);

		let britannianRunesTables = this._collectionFromArray(
			documents.filter(
				document => document && document.name.match(/Runes\sof\sPower/i)
			)
		);

		if (britannianRunesTables.length <= 0)
			return null;

		var runes = [];
		for (var tableRef of britannianRunesTables)
		{
			var rollTable = await fromUuid(tableRef.uuid);
			var drawResult = await rollTable.draw({recursive: true, displayChat: false});
			runes.push(...drawResult.results);
		}

		return runes;
	}

	static async ancestryTalents(filterSources=true) {
		return CompendiumsSD.talents("ancestry", filterSources);
	}

	static async armor(filterSources=true) {
		return CompendiumsSD._documents("Item", "Armor", filterSources);
	}

	static async armorProperties(filterSources=true) {
		return CompendiumsSD.properties("armor", filterSources);
	}

	static async backgrounds(filterSources=true) {
		return CompendiumsSD._documents("Item", "Background", filterSources);
	}

	static async baseArmor(filterSources=true) {
		const documents =
			await CompendiumsSD._documents("Item", "Armor", filterSources);

		return this._collectionFromArray(
			documents.filter(
				document => document.system.baseArmor === ""
					&& !document.system.magicItem
			)
		);
	}

	static async baseWeapons(filterSources=true) {
		const documents =
			await CompendiumsSD._documents("Item", "Weapon", filterSources);

		return this._collectionFromArray(
			documents.filter(
				document => document.system.baseWeapon === ""
					&& !document.system.magicItem
			)
		);
	}

	static async base2HWeapons(filterSources=true) {
		const documents =
			await CompendiumsSD._documents("Item", "Weapon", filterSources);

		return this._collectionFromArray(
			documents.filter(
				document => document.system.baseWeapon === ""
					&& document.system.damage.twoHanded !== ''
			)
		);
	}

	static async rangedWeapons(filterSources=true) {
		const documents =
			await CompendiumsSD._documents("Item", "Weapon", filterSources);

		return this._collectionFromArray(
			documents.filter(
				document => document.system.baseWeapon === ""
					&& !document.system.magicItem 
					&& document.system.type == "ranged"
			)
		);
	}

	static async baseWeaponsAndArmor(filterSources=true) {
		const documentsArmor =
			await CompendiumsSD._documents("Item", "Armor", filterSources);

		const documentsWeapon =
			await CompendiumsSD._documents("Item", "Weapon", filterSources);

		return this._collectionFromArray(
			documentsArmor.filter(
				document => document.system.baseArmor === ""
					&& !document.system.magicItem
			).concat( documentsWeapon.filter(
					document => document.system.baseWeapon === ""
						&& !document.system.magicItem
				)
			)
		);
	}

	static async basicItems(filterSources=true) {
		return CompendiumsSD._documents("Item", "Basic", filterSources);
	}

	static async classAbilities(filterSources=true) {
		return CompendiumsSD._documents("Item", "Class Ability", filterSources);
	}

	static async classes(filterSources=true) {
		return CompendiumsSD._documents("Item", "Class", filterSources);
	}

	static async classSpellBook(casterClass, filterSources=true) {
		if (!casterClass) {
			return CompendiumsSD._documents("Item", "Spell", filterSources);
		}
		else {
			const documents = await CompendiumsSD._documents(
				"Item", "Spell", filterSources
			);

			return this._collectionFromArray(
				documents.filter(
					document => document.system.class.includes(casterClass)
				)
			);
		}
	}

	static async classTalents(filterSources=true) {
		return CompendiumsSD.talents("class", filterSources);
	}

	static async classTalentTables(filterSources=true) {
		const documents = await CompendiumsSD._documents(
			"RollTable", null, filterSources
		);

		return this._collectionFromArray(
			documents.filter(
				document => document && document.name.match(/class\s+talents/i)
			)
		);
	}

	static async classTechniqueTables(filterSources=true) {
		const documents = await CompendiumsSD._documents(
			"RollTable", null, filterSources
		);

		return this._collectionFromArray(
			documents.filter(
				document => document && document.name.match(/class\s+techniques/i)
			)
		);
	}

	static async britannianMagicEffects(filterSources=true) {
		const documents = await CompendiumsSD._documents("Item", "Magic Power", filterSources);
		let filteredDocuments = documents.filter(
			document => (document.system.runes ?? []).length > 0
		);

		return filteredDocuments.map(d => d.uuid);
	}

	static async britannianMagicNPCs(filterSources=true) {
		const documents = await CompendiumsSD._documents("Actor", "NPC", filterSources);
		let filteredDocuments = documents.filter(
			document => (document.system.characterRunes ?? []).length > 0
		);

		return filteredDocuments;
	}

	static async nanoMagicTalents(filterSources=true) {
		const documents = await CompendiumsSD._documents("Item", "Talent", filterSources);

		return this._collectionFromArray(
			documents.filter(
				document => document.system.talentClass === "nanoMagic"
			)
		);
	}

	static async auraMagicPowers(filterSources=true) {
		const documents = await CompendiumsSD._documents("Item", "Talent", filterSources);

		return this._collectionFromArray(
			documents.filter(
				document => document.system.talentClass === "auraMagic" && document.system.isPower
			)
		);
	}

	static async auraMagicTalents(filterSources=true) {
		const documents = await CompendiumsSD._documents("Item", "Talent", filterSources);

		return this._collectionFromArray(
			documents.filter(
				document => document.system.talentClass === "auraMagic" && !document.system.isPower
			)
		);
	}

	static async metalMagicTalents(filterSources=true) {
		const documents = await CompendiumsSD._documents("Item", "Talent", filterSources);

		return this._collectionFromArray(
			documents.filter(
				document => document.system.talentClass === "metalMagic" && !document.system.isPower
			)
		);
	}

	static async metalMagicPowers(filterSources=true) {
		const documents = await CompendiumsSD._documents("Item", "Talent", filterSources);

		return this._collectionFromArray(
			documents.filter(
				document => document.system.talentClass === "metalMagic" && document.system.isPower
			)
		);
	}

	static async abyssalMagicPowers(filterSources=true) {
		const documents = await CompendiumsSD._documents("Item", "Talent", filterSources);

		return this._collectionFromArray(
			documents.filter(
				document => document.system.talentClass === "abyssalMagic" && document.system.isPower
			)
		);
	}

	static async mistMagicPowers(filterSources=true) {
		const documents = await CompendiumsSD._documents("Item", "Talent", filterSources);

		return this._collectionFromArray(
			documents.filter(
				document => document.system.talentClass === "mistMagic" && document.system.isPower
			)
		);
	}

	static async commonLanguages(filterSources=true) {
		return CompendiumsSD.languages("common", filterSources);
	}

	static async deities(filterSources=true) {
		return CompendiumsSD._documents("Item", "Deity", filterSources);
	}

	static async gems(filterSources=true) {
		return CompendiumsSD._documents("Item", "Gem", filterSources);
	}

	static async effects(filterSources=true) {
		return CompendiumsSD._documents("Item", "Effect", filterSources);
	}

	static async languages(subtypes=[], filterSources=true) {
		if (subtypes.length === 0) {
			return CompendiumsSD._documents("Item", "Language", filterSources);
		}
		else {
			const documents = await CompendiumsSD._documents("Item", "Language", filterSources);

			return this._collectionFromArray(
				documents.filter(
					document => subtypes.includes(document.system.rarity)
				)
			);
		}
	}

	static async levelTalents(filterSources=true) {
		const documents = await CompendiumsSD._documents("Item", "Talent", filterSources);
		
		return this._collectionFromArray(
			documents.filter(
				document => ["level"].includes(document.system.talentClass)
			)
		);
	}

	static async npcAttacks(filterSources=true) {
		return CompendiumsSD._documents("Item", "NPC Attack", filterSources);
	}

	static async npcFeatures(filterSources=true) {
		return CompendiumsSD._documents("Item", "NPC Features", filterSources);
	}

	static async patrons(filterSources=true) {
		return CompendiumsSD._documents("Item", "Patron", filterSources);
	}

	static async patronBoonTables(filterSources=true) {
		const documents = await CompendiumsSD._documents(
			"RollTable", null, filterSources
		);

		return this._collectionFromArray(
			documents.filter(
				document => document && document.name.match(/patron\s+boons/i)
			)
		);
	}

	static async potions(filterSources=true) {
		return CompendiumsSD._documents("Item", "Potion", filterSources);
	}

	static async properties(subtypes=[], filterSources=true) {
		if (subtypes.length === 0) {
			return CompendiumsSD._documents("Item", "Property", filterSources);
		}
		else {
			const documents = await CompendiumsSD._documents("Item", "Property", filterSources);

			return this._collectionFromArray(
				documents.filter(
					document => subtypes.includes(document.system.itemType)
				)
			);
		}
	}

	static async rareLanguages(filterSources=true) {
		return CompendiumsSD.languages("rare", filterSources);
	}

	static async rollTables(filterSources=true) {
		return CompendiumsSD._documents("RollTable", null, filterSources);
	}

	static async scrolls(filterSources=true) {
		return CompendiumsSD._documents("Item", "Scroll", filterSources);
	}

	static async sources() {
		const sources = [];

		for (const source of Object.keys(shadowdark.config.OFFICIAL_SOURCES)) {
			sources.push({
				uuid: source,
				name: shadowdark.config.OFFICIAL_SOURCES[source],
			});
		}

		for (const module of game.modules) {
			if (!module.active) continue;

			const moduleSources = module.flags?.shadowdark?.sources ?? {};

			for (const moduleSource of Object.keys(moduleSources)) {

				sources.push({
					uuid: moduleSource,
					name: game.i18n.localize(
						moduleSources[moduleSource]
					),
				});
			}
		}

		return sources.sort((a, b) => a.name.localeCompare(b.name));
	}

	static async spellcastingBaseClasses(filterSources=true) {
		const documents = await CompendiumsSD._documents("Item", "Class", filterSources);

		return this._collectionFromArray(documents.filter(document =>
			document.system.spellcasting.class === ""
		));
	}

	static async spellcastingClasses(filterSources=true) {
		const documents = await CompendiumsSD._documents("Item", "Class", filterSources);

		return this._collectionFromArray(documents.filter(document =>
			document.system.spellcasting.ability !== ""
			&& document.system.spellcasting.class !== "__not_spellcaster__"
		));
	}

	static async spells(filterSources=true) {
		return CompendiumsSD._documents("Item", "Spell", filterSources);
	}

	static async talents(subtypes=[], filterSources=true) {
		if (subtypes.length === 0) {
			return CompendiumsSD._documents("Item", "Talent", filterSources);
		}
		else {
			const documents = await CompendiumsSD._documents("Item", "Talent", filterSources);

			return this._collectionFromArray(
				documents.filter(
					document => subtypes.includes(document.system.talentClass)
				)
			);
		}
	}

	static async wands(filterSources=true) {
		return CompendiumsSD._documents("Item", "Wand", filterSources);
	}

	static async weaponProperties(filterSources=true) {
		return CompendiumsSD.properties("weapon", filterSources);
	}

	static async weapons(filterSources=true) {
		return CompendiumsSD._documents("Item", "Weapon", filterSources);
	}
}
