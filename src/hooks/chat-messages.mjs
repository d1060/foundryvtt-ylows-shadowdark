import {
	addChatMessageContextOptions,
	onRenderChatMessageHTML,
} from "../chat/hooks.mjs";

export const ChatMessageHooks = {
	attach: () => {
		Hooks.on("getChatLogEntryContext", addChatMessageContextOptions);
		Hooks.on("renderChatMessageHTML", (app, html, data) => onRenderChatMessageHTML(app, html, data));
	},
};
