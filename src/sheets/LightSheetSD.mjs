import ActorSheetSD from "./ActorSheetSD.mjs";
import UtilitySD from "../utils/UtilitySD.mjs";

export default class LightSheetSD extends ActorSheetSD {

	// TODO: How to add a button to the token HUD for picking up torch?

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "sheet"],
			width: 450,
			height: 200, // Memnon said "Hi!" at one point
			resizable: true,
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/actors/light.hbs";
	}

	/** @inheritdoc */
	activateListeners(html) {
		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);

		// Button that transfers the light source to the assigned character
		// and deletes the Light actor.
		html.find("[data-action='pickUpLight']").click(
			event => this._onPickupLight(event)
		);

		// Button that transfers the item to the assigned character
		// and deletes the Item actor.
		html.find("[data-action='pickUpItem']").click(
			event => this._onPickupItem(event)
		);
	}

	/** @override */
	async getData(options) {
		const context = await super.getData(options);

		return context;
	}

	async _onPickupLight(event, options = {}) {
		event.preventDefault();

		if (!game.user.isGM) {
			let character = game.user.character;
			if (character == null) {
				character = await LightSheetSD.getUserCharacter();
			}

			game.socket.emit(
				"system.shadowdark",
				{
					type: "pickupLightSourceFromScene",
					data: {
						character,
						lightActor: options.actor ?? this.actor,
						lightToken: options.token ?? this.object.token,
						speaker: ChatMessage.getSpeaker(),
					},
				}
			);
		}
		else {
			const targetActor = await UtilitySD.actorChoiceDialog({
				template: 'systems/shadowdark/templates/dialog/assign-picked-up-lightsource.hbs',
				title: 'SHADOWDARK.dialog.light_source.pick_up.title'
			});

			if (targetActor) {
				game.shadowdark.lightSourceTracker.pickupLightSourceFromScene(
					targetActor,
					options.actor ?? this.actor,
					ChatMessage.getSpeaker()
				);
			}
		}

		this.close();
	}

	static async _onPickupItem(event, options = {}) {
		event.preventDefault();

		if (!game.user.isGM) {
			let character = game.user.character;
			if (character == null) {
				character = await LightSheetSD.getUserCharacter();
			}
			if (character) {
				game.socket.emit(
					"system.shadowdark",
					{
						type: "pickupItemFromScene",
						data: {
							character,
							itemActor: options.actor ?? options.actor,
							itemToken: options.token ?? options.token,
							speaker: ChatMessage.getSpeaker(),
						},
					}
				);
			}
		}
		else {
			// Display a dialog allowing the GM to choose which character to assign
			// the dropped light source to.
			const playerActors = game.actors.filter(
				actor => actor.type === "Player"
			);
			// const activeUsers = game.users
			// 	.filter(u => u.active && !u.isGM);

			const targetActor = await this.multicharacterSelectionDialog(playerActors);

			if (targetActor) {
				game.shadowdark.lightSourceTracker.pickupItemFromScene(
					game.actors.get(targetActor),
					options.actor ?? options.actor,
					ChatMessage.getSpeaker()
				);
			}
		}
	}

	static async getUserCharacter() {
		const actors = game.actors.filter(
			actor => actor.type === "Player" && actor.ownership[game.user.id] && actor.ownership[game.user.id] == 3
		);
		if (actors.length == 1)
			return actors[0];
		else if (actors.length > 1)
		{
			const actorId = await this.multicharacterSelectionDialog(actors);
			return game.actors.get(actorId);
		}
		return null;
	}

	static async multicharacterSelectionDialog(playerActors) {
		const content = await foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/assign-picked-up-lightsource.hbs",
			{
				playerActors,
			}
		);

		const targetActor = await foundry.applications.api.DialogV2.wait({
			classes: ["app", "shadowdark", "shadowdark-dialog", "window-app", 'themed', 'theme-light'],
			position: {
				width: "auto",
				height: "auto"
			},
			window: {
				resizable: false,
				title: game.i18n.localize("SHADOWDARK.dialog.item.pick_up.title"),
			},
			content,
			buttons: [
				{
					action: 'select',
					icon: "fa fa-square-check",
					label: `${game.i18n.localize("SHADOWDARK.dialog.general.select")}`,
					callback: html => {
						return html.currentTarget.querySelector("input[type='radio']:checked")?.id ?? false;
					},
				},
				{
					action: 'cancel',
					icon: "fa fa-square-xmark",
					label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
					callback: () => false,
				},
			],
			default: "select",
			close: () => console.log("Closed Dialog"),
		});

		return targetActor;
	}
}
