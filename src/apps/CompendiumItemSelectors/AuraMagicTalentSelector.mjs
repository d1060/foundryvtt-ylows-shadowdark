import CompendiumItemSelector from "../CompendiumItemSelector.mjs";

export default class AuraMagicTalentSelector extends CompendiumItemSelector {

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_aura_magic_talent.title");
	}

	async decorateName(item) {
		// Decorate rare languages so they're easy to spot in the selector
		return item.system.rarity === "rare" ? `*${item.name}` : item.name;
	}

	async getAvailableItems() {
		return await shadowdark.compendiums.auraMagicTalents();
	}

	async getMultipleSelectionItems() {
		var auraMagicTalents = await shadowdark.compendiums.auraMagicTalents();
		return auraMagicTalents.filter(t => t.system.allowMultipleChoice);
	}

	async getUuids() {
		return this.object?.system?.magic?.auraMagicTalents ?? [];
	}

	async saveUuids(uuids) {
		return this.object.update({
			"system.magic.auraMagicTalents": uuids,
		});
	}
}
