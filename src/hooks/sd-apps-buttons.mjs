import PlayerSheetSD from "../sheets/PlayerSheetSD.mjs";
import RandomizerSD from "../apps/RandomizerSD.mjs";

export const SDAppsButtons = {
	attach: () => {
		Hooks.on("renderActorDirectory", async function(app, html) {
			const renderedHTML = await foundry.applications.handlebars.renderTemplate(
				"systems/shadowdark/templates/ui/sd-apps-buttons.hbs"
			);

			const footer = html.querySelector("#actors .directory-footer");
			await footer.insertAdjacentHTML("beforeend", renderedHTML);

			footer.querySelector(".character-generator-button").addEventListener("click", async () => {
				if (game.settings.get("shadowdark", "evolutionGrid"))
				{
					const newActor = await Actor.create(RandomizerSD.newCharacter());
					newActor.sheet.render(true);
				}
				else
					new shadowdark.apps.CharacterGeneratorSD().render(true);
			});

			footer.querySelector(".shadowdarkling-import-button").addEventListener("click", () => {
				new shadowdark.apps.ShadowdarklingImporterSD().render(true);
			});
		});
	},
};
