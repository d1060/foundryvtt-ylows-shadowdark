import CompendiumItemSelector from "../CompendiumItemSelector.mjs";

export default class WeaponPropertySelector extends CompendiumItemSelector {

    get title() {
        return game.i18n.localize("SHADOWDARK.dialog.select_weapon_property.title");
    }

    async getAvailableItems() {
        const properties = await shadowdark.compendiums.weaponProperties();
        let magicProperties = {contents: []};
        if (this.object?.system?.type == 'melee')
            magicProperties = await shadowdark.compendiums.magicMeleeWeaponProperties();
        else if (this.object?.system?.type == 'ranged')
            magicProperties = await shadowdark.compendiums.magicRangedWeaponProperties();
        
        const allMagicProperties = await shadowdark.compendiums.magicWeaponProperties();
        const energySources = await shadowdark.compendiums.energySources();

        return shadowdark.compendiums._collectionFromArray(
            [...properties.contents, ...magicProperties.contents, ...allMagicProperties.contents, ...energySources.contents]
        );
    }
    
    async getMultipleSelectionItems() {
        const properties = await shadowdark.compendiums.weaponProperties();
        let magicProperties = {contents: []};
        if (this.object?.system?.type == 'melee')
            magicProperties = await shadowdark.compendiums.magicMeleeWeaponProperties();
        else if (this.object?.system?.type == 'ranged')
            magicProperties = await shadowdark.compendiums.magicRangedWeaponProperties();
        
        const allMagicProperties = await shadowdark.compendiums.magicWeaponProperties();
        const energySources = await shadowdark.compendiums.energySources();

        const allProperties = shadowdark.compendiums._collectionFromArray(
            [...properties.contents, ...magicProperties.contents, ...allMagicProperties.contents, ...energySources.contents]
        );

        return allProperties.filter(b => b.system.allowMultipleChoice);
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
