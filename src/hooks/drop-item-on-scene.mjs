// Hooks used for the Canvas & Scenes

async function addPickUpButton(hud, hudHTML, _hudData) {
	const token = hud.object.document;
	const actor = game.actors.get(hud.object.document.actorId);
	// Check if token belongs to a Light actor
	if (actor.type === "Light") return;
	if (actor.type !== "Armor" && actor.type !== "Weapon" && actor.type !== "Potion" && actor.type !== "Basic" && actor.type !== "Gem" && actor.type !== "Scroll" && actor.type !== "Wand") return;

	// Add button to HUD
	const buttonHTML = `<div class="control-icon light-source" data-tooltip="
		${game.i18n.localize("SHADOWDARK.item.pick-up.tooltip")}
		">
			<img src="/systems/shadowdark/assets/icons/pick-up-white.png"/>
		</div>`;
	const container = document.createElement("div");
	container.innerHTML = buttonHTML;
	const button = container.firstElementChild; // This is now a native DOM element

	hudHTML.querySelector(".col.middle").prepend(button);

	// Add listeners to button
	let i = button.querySelector("img");
	i.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();

		shadowdark.sheets.LightSheetSD._onPickupItem(event, { actor, token });
	});
}

export const DropItemHooks = {
	attach: () => {

		Hooks.on("renderTokenHUD", (app, html, data) => {
			addPickUpButton(app, html, data);
		});

		Hooks.on("dropCanvasData", async (canvas, data) => {

			// Create the item on the actor if it was an effect
			if (data.type === "Item") {
				let item = {};
				try {
					item = fromUuidSync(data.uuid);
				}
				catch(error) {
					shadowdark.log(`Couldn't read anything: ${error}`);
				}

				// Check if the dropped item is a lightsource
				if (item && (item.isWeapon() || item.isPotion() || item.isArmor() || item.isBasic() || item.isGem() || item.isScroll() || item.isWand()) && !item.isLight()) {
					const actorData = {
						name: game.i18n.format("SHADOWDARK.item.dropped", {name: item.name}),
						img: item.img,
						owner: game.user,
						type: item.type,
						prototypeToken: {
							texture: {
								src: item.img,
								scaleX: 0.5,
								scaleY: 0.5,
							},
						},
						ownership: { default: 3 }, // Everyone is owner
					};

					// Let a GM handle the dropping as it requires elevated permissions
					if (game.user.isGM) {
						game.shadowdark.lightSourceTracker.dropItemOnScene(
							item,
							item.parent,
							actorData,
							data,
							ChatMessage.getSpeaker()
						);
					}
					else {
						game.socket.emit(
							"system.shadowdark",
							{
								type: "dropItemOnScene",
								data: {
									item,
									itemOwner: item.actor,
									actorData,
									dropData: { x: data.x, y: data.y },
									speaker: ChatMessage.getSpeaker(),
								},
							}
						);
					}

					return false; // Prevent further modifications
				}
			}
		});
	},
};
