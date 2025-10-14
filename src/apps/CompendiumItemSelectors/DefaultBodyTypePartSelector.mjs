import CompendiumsSD from "../../documents/CompendiumsSD.mjs";

import CompendiumItemSelector from "../CompendiumItemSelector.mjs";

export default class DefaultBodyTypePartSelector extends CompendiumItemSelector {

    get title() {
        return game.i18n.localize("SHADOWDARK.dialog.select_armor_coverage.title");
    }

    async getAvailableItems() {
        const defaultBodyType =  await CompendiumsSD.defaultBodySetup(true);
        const parts = [];
        for (let part of defaultBodyType.system.bodyParts)
        {
            let name = part.name;
            if (name == "Background") name = "Full Body";

            let newPart = structuredClone(part);
            newPart.name = name;
            newPart.uuid = name;
            newPart.decoratedName = name;
            newPart._id = name;
            parts.push(newPart);
        }

        return CompendiumsSD._collectionFromArray(parts);
    }

    async getMultipleSelectionItems() {
        return [];
    }

    async getUuids() {
        return this.object?.system?.coverage ?? [];
    }

	async getCurrentItems() {
        const currentIds = this.object?.system?.coverage ?? [];
        const defaultBodyType =  await CompendiumsSD.defaultBodySetup(true);
        const parts = [];
        for (let part of defaultBodyType.system.bodyParts)
        {
            let name = part.name;
            if (name == "Background") name = "Full Body";

            if (currentIds.includes(name))
            {
                let newPart = structuredClone(part);
                newPart.name = name;
                newPart.uuid = name;
                newPart.decoratedName = name;
                newPart._id = name;
                parts.push(newPart);
            }
        }
        return parts;
    }

    async saveUuids(uuids) {
        return this.object.update({
            "system.coverage": uuids,
        });
    }
}
