// Hooks used for the Canvas & Scenes

async function addTorchButton(hud, hudHTML, _hudData) {
	const token = hud.object.document;
	const actor = game.actors.get(hud.object.document.actorId);
	// Check if token belongs to a Light actor
	if (actor.type !== "Light") return;

	// Add button to HUD
	const buttonHTML = `<div class="control-icon light-source" data-tooltip="
		${game.i18n.localize("SHADOWDARK.light-source.pick-up-lightsource.tooltip")}
		">
			<i class="fas fa-fire-flame-simple"></i>
		</div>`;
	const container = document.createElement("div");
	container.innerHTML = buttonHTML;
	const button = container.firstElementChild; // This is now a native DOM element

	hudHTML.querySelector(".col.middle").prepend(button);

	// Add listeners to button
	let i = button.querySelector("i");
	i.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();

		actor.sheet._onPickupLight(event, { actor, token });
	});
}

export const DropLightsourceHooks = {
	attach: () => {

		Hooks.on("renderTokenHUD", (app, html, data) => {
			addTorchButton(app, html, data);
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

				const prototypeLight = {alpha: 0.5,
					angle: 360,
					animation: {type: null, speed: 5, intensity: 5, reverse: false},
					attenuation: 0.5,
					bright: 0,
					color: null,
					coloration: 1,
					contrast: 0,
					darkness: {min: 0, max: 1},
					dim: 1,
					invalid: false,
					luminosity: 0.5,
					negative: false,
					priority: 0,
					saturation: 0,
					shadows: 0,
					validationFailures: {fields: null, joint: null},
				};

				// Check if the dropped item is a lightsource
				if (item && item.isLight()) {
					const actorData = {
						name: game.i18n.format("SHADOWDARK.light-source.dropped", {name: item.name}),
						img: item.img,
						type: "Light",
						prototypeToken: {
							light: item.parent?.prototypeToken?.light ?? prototypeLight,
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
						game.shadowdark.lightSourceTracker.dropLightSourceOnScene(
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
								type: "dropLightSourceOnScene",
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
