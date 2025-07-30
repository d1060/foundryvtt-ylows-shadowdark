export default class ChatSD {

	static async _renderChatMessageHTML(
		actor,
		data,
		template,
		mode
	) {
		const html = await foundry.applications.handlebars.renderTemplate(template, data.templateData);

		if (!mode) {
			mode = game.settings.get("core", "rollMode");
		}

		const chatData = {
			content: html,
			flags: { "core.canPopout": true },
			flavor: data.flavor ?? undefined,
			rollMode: mode,
			speaker: ChatMessage.getSpeaker({
				actor: actor,
			}),
			type: data.type ?? CONST.CHAT_MESSAGE_STYLES.OTHER,
			user: game.user.id,
		};

		ChatMessage.applyRollMode(chatData, mode);

		await ChatMessage.create(chatData);
	}

	static async renderGeneralMessage(actor, data, mode) {
		this._renderChatMessageHTML(actor, data,
			"systems/shadowdark/templates/chat/general.hbs",
			mode
		);
	}

	static async renderItemCardMessage(actor, data, mode) {
		this._renderChatMessageHTML(actor, data, data.template, mode);
	}

	static async renderRollRequestMessage(actor, data, mode) {
		this._renderChatMessageHTML(actor, data,
			"systems/shadowdark/templates/chat/roll-request.hbs",
			mode
		);
	}

	static async renderUseAbilityMessage(actor, data, mode) {
		this._renderChatMessageHTML(actor, data,
			"systems/shadowdark/templates/chat/use-ability.hbs",
			mode
		);
	}
}
