import CompendiumItemSelector from "../CompendiumItemSelector.mjs";

export default class BritannianMagicSelector extends CompendiumItemSelector {

    get title() {
        return game.i18n.localize("SHADOWDARK.dialog.select_nano_magic_talent.title");
    }

    async decorateName(item) {
        // Decorate rare languages so they're easy to spot in the selector
        return item.name;
    }

    async getAvailableItems() {
        return await shadowdark.compendiums.nanoMagicTalents();
    }

    async getMultipleSelectionItems() {
        var talent = await shadowdark.compendiums.nanoMagicTalents();
        return talent.filter(b => b.system.allowMultipleChoice);
    }
    
    async getUuids() {
        const nanoMagicTalentsUUIDs = [];

        for (const uuid of this.object.system?.magic?.nanoMagicTalents ?? []) {
            if (uuid.type === "Talent")
                nanoMagicTalentsUUIDs.push(uuid._id);
            else
                nanoMagicTalentsUUIDs.push(uuid);
        }

        return nanoMagicTalentsUUIDs.sort((a, b) => a?.name?.localeCompare(b?.name));
    }

    async saveUuids(uuids) {
        return this.object.update({
            "system.magic.nanoMagicTalents": uuids,
        });
    }
}
