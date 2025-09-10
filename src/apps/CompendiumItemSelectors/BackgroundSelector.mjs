import CompendiumItemSelector from "../CompendiumItemSelector.mjs";

export default class BackgroundSelector extends CompendiumItemSelector {

	closeOnSelection = true;

	maxChoices = 1;

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_background.title");
	}

	async getAvailableItems() {
		return await shadowdark.compendiums.backgrounds();
	}

	async getMultipleSelectionItems() {
		var background = await shadowdark.compendiums.backgrounds();
		return background.filter(b => b.system.allowMultipleChoice);
	}

	async getUuids() {
		const uuid = this.object?.system?.background;

		return uuid !== "" ? [uuid] : [];
	}

	async saveUuids(uuids) {
		const uuid = uuids[0] ?? "";

		const currentBackgroundUuid = this.object.system.background;
		const newBackgroundUuid = uuid;
		this._removeItemTalentsAndEffects(currentBackgroundUuid);
		this._addItemTalentsAndEffects(newBackgroundUuid);

		return this.object.update({
			"system.background": uuid,
		});
	}
}
