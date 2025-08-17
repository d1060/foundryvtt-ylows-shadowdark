export default class BulkSellSD {
    static async onSubmit(actor, event) {
        switch (event.target?.name)
        {
            case "bulkSell.barterCheck":
                actor.bulkSell.barterCheck = parseInt(event.target.value);
                this.calculatePricesByBarterCheck(actor);
                actor.sheet.render(true);
                break;
        }
    }

	static async clearBulkSelltems(actor) {
        let itemIds = [];
		for (const i of actor.items) {
            if (i.system.bulkSelling)
            {
                i.system.bulkSelling = false;
                itemIds.push({"_id": i.id});
            }
		}

        //if (itemIds.length)
		//	actor.updateEmbeddedDocuments("Item", itemIds);
    }

	static async addToBulkSell(actor, itemId) {
        const item = actor.items.get(itemId);
        if (!item.system.bulkSelling) item.system.bulkSelling = false;
        item.system.bulkSelling = !item.system.bulkSelling;

		//actor.updateEmbeddedDocuments("Item", [{"_id": item.id}]);

        await this.collectPrices(actor);
    }

    static async collectPrices(actor) {
        let totalCost = 0;
		for (const i of actor.items) {
            if (i.system?.cost && i.system.bulkSelling) {
                totalCost += i.system.cost.cp + i.system.cost.sp * 10 + i.system.cost.gp * 100;
            }
		}
        actor.bulkSell.originalCost = totalCost;
        await this.calculatePricesByBarterCheck(actor);
    }

    static async calculatePricesByBarterCheck(actor) {
        let priceFactor = 0.5;
        if (actor.bulkSell.barterCheck < 12) {
            priceFactor = 0.1 + 0.4 * (actor.bulkSell.barterCheck - 2) / 10;
        } else {
            priceFactor = 0.5 + 0.5 * (actor.bulkSell.barterCheck - 12) / 8;
        }
        let newPrice = Math.ceil(actor.bulkSell.originalCost * priceFactor);
        let gps = Math.floor(newPrice / 100);
        newPrice -= gps * 100;
        let sps = Math.floor(newPrice / 10);
        let cps = newPrice - sps * 10;

        actor.bulkSell.gp = gps;
        actor.bulkSell.sp = sps;
        actor.bulkSell.cp = cps;
    }

	static async bulkSell(actor) {
        actor.system.coins.gp += actor.bulkSell.gp;
        actor.system.coins.sp += actor.bulkSell.sp;
        actor.system.coins.cp += actor.bulkSell.cp;

        actor.bulkSell.gp = 0;
        actor.bulkSell.sp = 0;
        actor.bulkSell.cp = 0;

        let items = [];
		for (const i of actor.items) {
            if (i.system.bulkSelling) {
                items.push(i.id);
            }
		}

		await actor.update({"system.coins": actor.system.coins});

        if (items.length) {
            await actor.deleteEmbeddedDocuments(
                    "Item",
                    items
			);
        }

        actor.bulkSell.active = false;
    }
}
