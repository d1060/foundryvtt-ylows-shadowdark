import BritannianMagicSD from "./sheets/magic/BritannianMagicSD.mjs";

export default function listenOnSocket() {

	game.socket.on("system.shadowdark", event => {
		if (event.type === "createCharacter") {
			// only the GM should handle this event
			if (!game.user.isGM) return;

			shadowdark.apps.CharacterGeneratorSD.createActorFromData(
				event.payload.characterData,
				event.payload.characterItems,
				event.payload.userId,
				event.payload.level0
			);
		}

		if (event.type === "dropLightSourceOnScene" && game.user.isGM) {
			game.shadowdark.lightSourceTracker.dropLightSourceOnScene(
				event.data.item,
				event.data.itemOwner,
				event.data.actorData,
				event.data.dropData,
				event.data.speaker
			);
		}

		if (event.type === "dropItemOnScene" && game.user.isGM) {
			game.shadowdark.lightSourceTracker.dropItemOnScene(
				event.data.item,
				event.data.itemOwner,
				event.data.actorData,
				event.data.dropData,
				event.data.speaker
			);
		}

		if (event.type === "openNewCharacter") {
			if (event.payload.userId === game.userId) {
				const actor = game.actors.get(event.payload.actorId);
				actor.sheet.render(true);

				return ui.notifications.info(
					game.i18n.localize("SHADOWDARK.apps.character-generator.success"),
					{permanent: false}
				);
			}
		}

		if (event.type === "pickupLightSourceFromScene" && game.user.isGM) {
			game.shadowdark.lightSourceTracker.pickupLightSourceFromScene(
				event.data.character,
				event.data.lightActor,
				event.data.speaker
			);
		}

		if (event.type === "pickupItemFromScene" && game.user.isGM) {
			game.shadowdark.lightSourceTracker.pickupItemFromScene(
				event.data.character,
				event.data.itemActor,
				event.data.speaker
			);
		}

		if (event.type === "toggleLightSource" && game.user.isGM) {
			game.shadowdark.lightSourceTracker.toggleLightSource(
				event.data.actor,
				event.data.item
			);
		}

		if (event.type === "changeNpcActorHP" && game.user.isGM) {
			var token = null;
			for (const scene of game.scenes) {
				token = scene.tokens.find(t => t.id === event.data.tokenId);
				if (token)
					break;
			}
			if (!token) return;

			CONFIG.DiceSD.applyDamageToToken(token._object, parseInt(event.data.damage));
		}

		if (event.type === "addSpellEffecstToActor" && game.user.isGM) {
			var token = null;
			for (const scene of game.scenes) {
				token = scene.tokens.find(t => t.id === event.data.tokenId);
				if (token)
					break;
			}
			if (!token) return;

			BritannianMagicSD.applyEffectsToToken(token, event.data.caster, event.data.effects, event.data.spellUuid);
		}

		if (event.type === "removeSpellEffecstFromActor" && game.user.isGM) {
			var token = null;
			for (const scene of game.scenes) {
				token = scene.tokens.find(t => t.actor.uuid === event.data.tokenId);
				if (token)
					break;
			}
			if (!token) return;

			BritannianMagicSD.removeEffectsFromToken(token.actor, event.data.caster, event.data.effects, event.data.spellUuid);
		}

		if (event.type === "showImage") {
			CONFIG.ActorSheetSD.showImageDialog(event.data.src, event.data.name, false, event.data.origin, event.data.width, event.data.height);
		}
	});
}
