import { MetalMagicSD } from "../sheets/_module.mjs";

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
	},
};
