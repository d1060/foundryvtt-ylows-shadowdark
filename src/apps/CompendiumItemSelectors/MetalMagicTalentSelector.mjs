import CompendiumItemSelector from "../CompendiumItemSelector.mjs";

export default class MetalMagicTalentSelector extends CompendiumItemSelector {

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_metal_magic_talent.title");
	}

	async decorateName(item) {
		// Decorate rare languages so they're easy to spot in the selector
		return item.system.rarity === "rare" ? `*${item.name}` : item.name;
	}

	async getAvailableItems() {
		return await shadowdark.compendiums.metalMagicTalents();
	}

	async getMultipleSelectionItems() {
		var talent = await shadowdark.compendiums.metalMagicTalents();
		return talent.filter(b => b.system.allowMultipleChoice);
	}

	async getUuids() {
		return this.object?.system?.magic?.metalMagicTalents ?? [];
	}

	async saveUuids(uuids) {
		return this.object.update({
			"system.magic.metalMagicTalents": uuids,
		});
	}
}
