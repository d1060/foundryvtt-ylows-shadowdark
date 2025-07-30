import CompendiumItemSelector from "../CompendiumItemSelector.mjs";

export default class WeaponPropertySelector extends CompendiumItemSelector {

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_weapon_property.title");
	}

	async getAvailableItems() {
		return await shadowdark.compendiums.weaponProperties();
	}
	
	async getMultipleSelectionItems() {
		var property = await shadowdark.compendiums.weaponProperties();
		return property.filter(b => b.system.allowMultipleChoice);
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
