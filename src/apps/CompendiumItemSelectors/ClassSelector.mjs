import CompendiumItemSelector from "../CompendiumItemSelector.mjs";

export default class ClassSelector extends CompendiumItemSelector {

	closeOnSelection = true;

	maxChoices = 1;

	constructor(object) {
	    super(object);
		if (this.object.type === 'Evolution Grid Type')
			this.maxChoices = 999;
	}

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_class.title");
	}

	async getAvailableItems() {
		return await shadowdark.compendiums.classes();
	}

	async getMultipleSelectionItems() {
		return [];
	}

	async getUuids() {
		const uuid = this.object?.system?.class;
		if (Array.isArray(uuid))
			return uuid;

		return uuid !== "" ? [uuid] : [];
	}

	async saveUuids(uuids) {
		if (this.maxChoices == 1)
		{
			const uuid = uuids[0] ?? "";

			return this.object.update({
				"system.class": uuid,
			});
		}
		else
		{
			return this.object.update({
				"system.class": uuids,
			});
		}
	}
}
