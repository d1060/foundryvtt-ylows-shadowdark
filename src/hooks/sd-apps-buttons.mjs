import PlayerSheetSD from "../sheets/PlayerSheetSD.mjs";
import RandomizerSD from "../apps/RandomizerSD.mjs";

function isThereALoggedGM() {
	return game.users.some(u => u.isGM && u.active);
}

export const SDAppsButtons = {
	attach: () => {
		Hooks.on("renderActorDirectory", async function(app, html) {
			const renderedHTML = await foundry.applications.handlebars.renderTemplate(
				"systems/shadowdark/templates/ui/sd-apps-buttons.hbs"
			);

			const footer = html.querySelector("#actors .directory-footer");
			await footer.insertAdjacentHTML("beforeend", renderedHTML);

			footer.querySelector(".character-generator-button").addEventListener("click", async () => {
				if (isThereALoggedGM())
				{
					if (game.settings.get("shadowdark", "evolutionGrid"))
					{
						if (game.user.isGM) {
							PlayerSheetSD.newRandomPlayerSheet(game.user.id);
						}
						else
						{
							game.socket.emit("system.shadowdark", {
								type: "createRandomizedCharacter",
								payload: {
									owner: game.user.id,
								},
							});
						}
					}
					else
						new shadowdark.apps.CharacterGeneratorSD().render(true);
				}
				else
				{
					const message = game.i18n.localize("SHADOWDARK.dialog.noGM_message");
					const title = game.i18n.localize("SHADOWDARK.dialog.noGM");
					foundry.applications.handlebars.renderTemplate(
						"systems/shadowdark/templates/dialog/warn.hbs",
						{message}
					).then(html => {
						foundry.applications.api.DialogV2.wait({
							classes: ["shadowdark", "shadowdark-dialog", "window-app", 'themed', 'theme-light'],
							window: {
								resizable: false,
								title,
							},
							content: html,
							buttons: [
								{
									action: 'Ok',
									default: true,
									icon: "fa fa-check",
									label: `${game.i18n.localize("SHADOWDARK.dialog.general.ok")}`,
								},
							],
							default: "Yes",
						});
					});
				}
			});

			footer.querySelector(".shadowdarkling-import-button").addEventListener("click", () => {
				new shadowdark.apps.ShadowdarklingImporterSD().render(true);
			});
		});
	},
};
