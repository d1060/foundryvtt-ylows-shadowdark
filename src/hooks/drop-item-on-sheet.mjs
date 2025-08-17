export const DropItemOnSheetHooks = {
	attach: () => {
		Hooks.on("dropActorSheetData", async (actor, sheet, data) => {
            //let droppedDocument = await fromUuid(data.uuid);
            //shadowdark.log(`dropActorSheetData '${actor?.name}' '${droppedDocument?.name}'`);
        });
    }
}
