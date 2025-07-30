export class UpdateBaseSD {

	static version;

	version = this.constructor["version"];  

	// Update the actor to the latest schema version.
	//
	async updateActor(actorData) {}

	// Update the item to the latest schema version.
	//
	async updateItem(itemData, actorData) {}

	// And updates required to system settings can be performed here.
	//
	async updateSettings() {}

}
