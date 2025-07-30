import CompendiumItemSelector from "../CompendiumItemSelector.mjs";

export default class AncestrySelector extends CompendiumItemSelector {

	closeOnSelection = true;

	maxChoices = 1;

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_ancestry.title");
	}

	async getAvailableItems() {
		return shadowdark.compendiums.ancestries();
	}

	async getMultipleSelectionItems() {
		return [];
	}

	async getUuids() {
		const uuid = this.object?.system?.ancestry;

		return uuid !== "" ? [uuid] : [];
	}

	async saveUuids(uuids) {
		const uuid = uuids[0] ?? "";

		return this.object.update({
			"system.ancestry": uuid,
		});
	}
}
