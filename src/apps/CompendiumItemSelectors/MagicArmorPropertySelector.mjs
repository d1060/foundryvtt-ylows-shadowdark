import CompendiumItemSelector from "../CompendiumItemSelector.mjs";

export default class ArmorPropertySelector extends CompendiumItemSelector {

    get title() {
        return game.i18n.localize("SHADOWDARK.dialog.select_armor_property.title");
    }

    async getAvailableItems() {
        const properties = await shadowdark.compendiums.armorProperties();
        const magicProperties = await shadowdark.compendiums.magicArmorProperties();
        const energySources = await shadowdark.compendiums.energySources();

        return shadowdark.compendiums._collectionFromArray(
            [...properties.contents, ...magicProperties.contents, ...energySources.contents]
        );
    }

    async getMultipleSelectionItems() {
        const properties = await shadowdark.compendiums.armorProperties();
        const magicProperties = await shadowdark.compendiums.magicArmorProperties();
        const energySources = await shadowdark.compendiums.energySources();

        const allProperties = shadowdark.compendiums._collectionFromArray(
            [...properties.contents, ...magicProperties.contents, ...energySources.contents]
        );

        return allProperties.filter(p => p.system.allowMultipleChoice);
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
