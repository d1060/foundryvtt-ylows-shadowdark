import { CanvasHooks } from "./hooks/canvas.mjs";
import { ChatMessageHooks } from "./hooks/chat-messages.mjs";
import { DropLightsourceHooks } from "./hooks/drop-lightsource-on-scene.mjs";
import { DropItemHooks } from "./hooks/drop-item-on-scene.mjs";
import { DropItemOnSheetHooks } from "./hooks/drop-item-on-sheet.mjs";
import { PlayerActorTokenHooks } from "./hooks/player-actor-token.mjs";
import { EffectHooks } from "./hooks/effects.mjs";
import { EffectPanelHooks } from "./hooks/effect-panel.mjs";
import { LightSourceTrackerHooks } from "./hooks/light-source-tracker.mjs";
import { NPCHooks } from "./hooks/npc.mjs";
import { PCHooks } from "./hooks/pc.mjs";
import { TargetingHooks } from "./hooks/targeting.mjs";
import { SDAppsButtons } from "./hooks/sd-apps-buttons.mjs";
import { hotbarHooks } from "./hooks/hotbar.mjs";

export const HooksSD = {
	attach: () => {
		const listeners = [
			CanvasHooks,
			DropLightsourceHooks,
			DropItemHooks,
			DropItemOnSheetHooks,
			PlayerActorTokenHooks,
			EffectHooks,
			LightSourceTrackerHooks,
			NPCHooks,
			PCHooks,
			TargetingHooks,
			hotbarHooks,
		];

		for (const listener of listeners) {
			listener.attach();
		}
	},
};

export const HooksImmediate = {
	attach: () => {
		const listeners = [
			ChatMessageHooks,
		];

		for (const listener of listeners) {
			listener.attach();
		}
	},
};

export const HooksInitSD = {
	attach: () => {
		const listeners = [
			SDAppsButtons,
			EffectPanelHooks,
		];

		for (const listener of listeners) {
			listener.attach();
		}
	},
};
