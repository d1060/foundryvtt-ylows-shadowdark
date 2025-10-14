import { MetalMagicSD } from "../sheets/_module.mjs";
import ItemSheetSD from "../sheets/ItemSheetSD.mjs";

export const NPCHooks = {
	attach: () => {
		Hooks.on("createToken", (token, options, userId) => {
			if (!game.user.isGM) return;
			if (token.actor.type === "Player")
			{
				if (token.actor.system?.magic?.type === 'metalMagic')
					MetalMagicSD._onDropManifestedToken(token);
				return;
			}

			const rollHp = game.settings.get(
				"shadowdark", "rollNpcHpWhenAddedToScene"
			);

			if (rollHp && !token.actor.isLightSource) {
				token.actor._npcRollHP();
			}
		});

		Hooks.on("updateToken", (token, changes, context, userId) => {
			if ("x" in changes || "y" in changes) {
   				if (token.actor?.isBurning()) token.actor.burnOut();
				if (token.actor?.isFrozen()) token.actor.thawFrost(); 
			}
		});

		Hooks.on("renderApplicationV2", (element, context, options) => { 
			if (options.document!= null) {
				shadowdark.debug(`rendering Application V2 for ${options?.document?.constructor?.name}`);
				if (options?.document?.constructor?.name === 'ActorSD') {
					const actor = options.document;
					if (!actor || !actor.system.droppedItem) return;
					const itemCollection = actor.getEmbeddedCollection("Item");
					if (!itemCollection || itemCollection.contents?.length != 1) return;
					for (const item of itemCollection.contents) {
						if (item.sheet) {
							item.sheet.render(true);
						}
					}
					actor.sheet.close();
				}
			} else if (options.actor != null) {
				const actor = options.actor;
				if (!actor || !actor.system.droppedItem) return;
				if (!actor.items || actor.items?.length != 1) return;
				if (actor.system.uuid) {
					fromUuid(actor.system.uuid).then(realActor => {
						for (const item of realActor.items) {
							item.sheet.render(true);
						}
					});
					element.close();
				}
			}
		});
	},
};
