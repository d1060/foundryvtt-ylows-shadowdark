import CompendiumItemSelector from "../CompendiumItemSelector.mjs";

export default class ArmorPropertySelector extends CompendiumItemSelector {

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_armor_property.title");
	}

	async getAvailableItems() {
		return await shadowdark.compendiums.armorProperties();
	}

	async getMultipleSelectionItems() {
		var property = await shadowdark.compendiums.armorProperties();
		return property.filter(p => p.system.allowMultipleChoice);
	}

	async getUuids() {
		return this.object?.system?.properties ?? [];
	}

	async saveUuids(uuids) {
		return this.object.update({
			"system.properties": uuids,
		});
	}
}
