import CompendiumItemSelector from "../CompendiumItemSelector.mjs";

export default class LanguageSelector extends CompendiumItemSelector {

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_languages.title");
	}

	async decorateName(item) {
		// Decorate rare languages so they're easy to spot in the selector
		return item.system.rarity === "rare" ? `*${item.name}` : item.name;
	}

	async getAvailableItems() {
		return await shadowdark.compendiums.languages();
	}

	async getMultipleSelectionItems() {
		return [];
	}

	async getUuids() {
		return this.object?.system?.languages ?? [];
	}

	async saveUuids(uuids) {
		return this.object.update({
			"system.languages": uuids,
		});
	}
}
