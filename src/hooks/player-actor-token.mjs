async function addTempHpBar(hud, hudHTML, _hudData) {
	const token = hud.object.document;
	const actor = game.actors.get(hud.object.document.actorId);
	// Check if token belongs to a Light actor
	if (!actor) return;
	if (actor.type !== "Player") return;
	if (!actor.system.attributes.hp.temp) return;

	// Add button to HUD
	const barHTML = `<div class="attribute barT"><input type="text" name="barT" data-previous-value="${actor.system.attributes.hp.temp}" value="${actor.system.attributes.hp.temp}"></div>`;
	const container = document.createElement("div");
	container.innerHTML = barHTML;
	const button = container.firstElementChild; // This is now a native DOM element

	hudHTML.querySelector(".col.middle").prepend(button);

	// Add listeners to button
	let i = button.querySelector("input");
	i.addEventListener("change", (event) => {
		actor.setTempHp(event, { actor, token });
	});
}

export const PlayerActorTokenHooks = {
	attach: () => {
		Hooks.on("renderTokenHUD", (app, html, data) => {
			addTempHpBar(app, html, data);
		});
    }
}
