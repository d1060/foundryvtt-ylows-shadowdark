const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
export default class EffectPanelSD extends HandlebarsApplicationMixin(ApplicationV2) {

	static DURATION_CONVERSION = {
		IN_ONE_ROUND: 10,
		IN_ONE_MINUTE: 60,
		IN_TWO_MINUTES: 120,
		IN_ONE_HOUR: 3_600,
		IN_TWO_HOURS: 7_200,
		IN_ONE_DAY: 86_400,
		IN_TWO_DAYS: 172_800,
		IN_ONE_WEEK: 604_800,
		IN_TWO_WEEKS: 1_209_600,
		IN_ONE_YEAR: 31_536_000,
		IN_TWO_YEARS: 63_072_000,
	};

	constructor(options) {
		super(options);

		this._controller = new EffectPanelControllerSD(this);

		// Add a slight delay to the rendering, this is necessary to cover
		// some occasions when properly waiting for a promise is not doable.
		this.refresh = foundry.utils.debounce(this.render.bind(this), 100);
	}

	/* -------------------------------------------- */
	/*  Inherited                                   */
	/* -------------------------------------------- */

   	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["shadowdark", "effect-panel", 'themed', 'theme-light'],
		popOut: false,
		window: {
			resizable: true,
			controls: [],
			top: 900,
			left: 10,
			height: "auto",
			width: "auto",
			title: 'SHADOWDARK.event-tracker.title',
  		},
		actions: {
			effectClick: this.#effectClick,
		},
		form: {
		    submitOnChange: true,
    		closeOnSubmit: true
  		},
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/apps/effect-panel.hbs" }
	}

	/** @inheritdoc */
	async _onFirstRender(context, options) {
		await super._onFirstRender(context, options);

		//this.element.style.top = '900px';
		//this.element.style.left = '10px';
	}

	/** @inheritdoc */
	async render(force, options) {
		if (this.state === 0 && options == null) options = {position: {top: 800, left: 10}};
		await super.render(force, options);
		await this.activateListeners();
	}

	/* -------------------------------------------- */
	/*  Overrides                                   */
	/* -------------------------------------------- */

	/** @override */
	async _prepareContext(options) {
		return this._controller.getEffectData();
	}

	/** @override */
	async activateListeners() {
		if (!this.element) return;
		const icons = this.element.querySelectorAll("div.icon[data-effect-id]");
		for (const icon of icons)
		{
			icon.addEventListener("contextmenu", (event) => {
                this._controller.onIconRightClick(event);
			});
        }
	}

	/* -------------------------------------------- */
	/*  Getters                                     */
	/* -------------------------------------------- */

	get token() {
		return canvas.tokens.controlled.at(0)?.document ?? null;
	}

	get actor() {
		return this.token?.actor ?? game.user?.character ?? null;
	}

	get _dragHandler() {
		return this._rootView.find("#effect-panel-drag-handler");
	}

	static async #effectClick(event, target) {
		this._controller.onIconClick(event, target);
	}

	/* -------------------------------------------- */
	/*  Methods                                     */
	/* -------------------------------------------- */

	/**
	 * Manages expired Effect items.
	 * @returns {void}
	 */
	async deleteExpiredEffects() {
		const effectData = this._controller.getEffectData();

		// Get effects that have unique origin
		const expiredEffects = [...effectData.temporaryEffects, ...effectData.conditionEffects]
			.filter(e => {
				// Light source Effects are cleaned up by the Light Source Tracker
				return e.isExpired
				&& !(
					e.effectName === "Light Source"
					|| e.changes.some(c => c.key === "system.light.template")
				);
			})
			.filter((value, index, self) => {
				return self.findIndex(v => v.origin === value.origin) === index;
			});

		expiredEffects.forEach(e => {
			const i = fromUuidSync(e.parent.uuid);
			i.delete();
		});
	}

	/**
	 * Calculates a new x-axis position for the effect panel.
	 * @returns {string}
	 */
	// getRightPx() {
	// 	var sidebar = ui.sidebar.element;
	// 	var webrtc = ui.webrtc.element;

	// 	let sidebarLeft = sidebar?.getBoundingClientRect()?.width ?? 0;
	// 	let webrtcLeft = webrtc?.getBoundingClientRect()?.width ?? 0;

	// 	let rightPx =`${sidebarLeft + webrtcLeft + 18}px`;
	// 	return rightPx;
	// }

	/**
	 * Animates the Effect panel to the newly calculated x-position.
	 * @returns {void}
	 */
	updateFromRightPx() {
	//	this.element.animate(
	//		[
	//			{ right: getComputedStyle(this.element).right }, // from current right
	//			{ right: this.getRightPx() }                     // to new value
	//		],
	//		{
	//			duration: 300, // in milliseconds
	//			fill: 'forwards' // retain final state after animation
	//		}
	//	);
	}
}

export class EffectPanelControllerSD {
	constructor(panel) {
		this._panel = panel;
	}

	/**
	 * Returns an array with effects that are sorted and active
	 * to be used for rendering the effect panel.
	 * @returns {Array<ActiveEffect>}
	 */
	get _actorEffects() {
		const actor = this._actor;
		if (!actor) return [];
		const activeEffects = [];

		for (let effect of actor.appliedEffects)
		{
			if (effect.transfer) {

				const effectData = effect.clone({}, { keepId: true});

				// get the parent object of the effect
				effectData.parentName = effect.parent.name;
				if (effectData.parentName !== effect.name) {
					effectData.effectName = effect.name;
				}

				// get properties if parent is effect type
				if (effect.parent.type === "Effect") {
					effectData.category = effect.parent.system.category;
					effectData.hidden = !effect.parent.system.effectPanel.show ?? false;

					effectData.remainingDuration = effect.parent.remainingDuration;
					effectData.rounds = (effect.parent.system.duration?.type === "rounds")
						? effect.parent.system.duration.value
						: 0;
					effectData.isExpired = effectData.remainingDuration.expired;
					effectData.infinite = effectData.remainingDuration.remaining === Infinity;
					effectData.temporary = !effectData.infinite;

					// is item hidden
					effectData.hidden = !effect.parent.system.effectPanel.show ?? false;

				}

				if (effect.parent.type === "Talent") {
					effectData.talentType = effect.parent.system.talentClass;
				}

				activeEffects.push(effectData);
			}
		}

		return activeEffects;
	}

	/**
	 * Get the actor from either the token or the assigned actor for the user
	 * @returns {Actor|null}
	 */
	get _actor() {
		return canvas.tokens.ownedTokens[0]?.actor ?? game.user?.character ?? null;
	}

	/**
	 * Builds up an object that contains the effects categorized for rendering
	 * the template.
	 * @returns {Object}
	 */
	getEffectData() {
		const conditionEffects = [];
		const temporaryEffects = [];
		const passiveEffects = [];

		const effects = this._actorEffects;

		for (let effect of effects)
		{
			if (effect.hidden) return;
			// show non effect type item according to settings
			if (!effect.category && game.settings.get("shadowdark", "showPassiveEffects")) {
				passiveEffects.push(effect);
			}
			if (effect.category === "condition") {
				conditionEffects.push(effect);
			}
			else if (effect.category === "effect") {
				temporaryEffects.push(effect);
			}
		}

		return {
			conditionEffects,
			temporaryEffects,
			passiveEffects,
			//topStyle: this._getTopStyle(),
		};
	}

	/**
	 * Gets the top level position as stored for the user
	 * @returns {string}
	 */
	_getTopStyle() {
		let topPosition = game.user.getFlag(
			"shadowdark",
			"effectPanelTopPosition"
		);

		if (topPosition === undefined) {
			topPosition = 5;
			game.user.setFlag(
				"shadowdark",
				"effectPanelTopPosition",
				topPosition
			);
		}

		return `top: ${topPosition}px;`;
	}

	/* -------------------------------------------- */
	/*  Event Handling                              */
	/* -------------------------------------------- */

	/**
	 * Handles right clicking on an effect icon through the _handleEffectChange method.
	 * @param {Event} event - Mouse Event
	 * @returns {void}
	 */
	async onIconRightClick(event) {
		const $target = $(event.currentTarget);
		const actor = this._actor;
		const panel = this._panel;
		const sourceItem = actor.items.get($target[0].dataset.effectId);
		if (!sourceItem || (sourceItem.type !== "Effect" && sourceItem.type !== "Talent")) return;

		// TODO: Consider allowing default behavior to just delete effect item in settings.
		return Dialog.confirm({
			title: game.i18n.localize("SHADOWDARK.apps.effect_panel.dialog.delete_effect.title"),
			content: `<h4>${game.i18n.format(
				"SHADOWDARK.apps.effect_panel.dialog.delete_effect.content",
				{effectName: sourceItem.name}
			)}</h4>`,
			yes: async () => {
				if (sourceItem.system?.light?.active) {
					await sourceItem.parent.sheet._toggleLightSource(sourceItem);
				}
				await sourceItem.delete();
				actor.onDeleteDocuments(sourceItem);
				panel.refresh(true);
			},
			defaultYes: true,
		});
	}

	/**
	 * Handles single clicking on an effect icon.
	 * @param {Event} event - Mouse Event
	 * @returns
	 */
	async onIconClick(event, target) {
		const actor = this._actor;
		const sourceItem = actor.items.get(target.dataset.effectId);
		if (!sourceItem) return;

		if (event.ctrlKey || event.metaKey) {
			sourceItem?.sheet.render(true);
		}
		else {
			sourceItem?.displayCard();
		}
	}

	/**
	 * Allows the effect panel to be dragged around on the screen for positioning
	 * @param {Event} event - Mouse Down event
	 * @returns {void}
	 */
	async onMouseDown(event) {
		event.preventDefault();
		event = event || window.event;

		// Determine if it is the right mouse button that is clicked
		let isRightButton = false;
		// Gecko (Firefox), Webkit (Safari/Chrome) & Opera
		if ("which" in event) {
			isRightButton = event.which === 3;
		}
		// IE, Opera
		else if ("button" in event) {
			isRightButton = event.button === 2;
		}
		if (isRightButton) return;

		dragElement(document.querySelector("section.effect-panel"));

		function dragElement(element) {
			let newYPosition = 0;
			let mouseYPosition = 0;
			let timer;

			element.onmousedown = dragMouseDown;

			function dragMouseDown(event) {
				event.preventDefault();
				event = event || window.event;

				mouseYPosition = event.clientY;
				document.onmouseup = closeDragElement;

				timer = setTimeout(() => document.onmousemove = elementDrag, 200);
			}

			function elementDrag(event) {
				event.preventDefault();
				event = event || window.event;

				newYPosition = mouseYPosition - event.clientY;
				mouseYPosition = event.clientY;

				// Set the new position
				element.style.top = `${element.offsetTop - newYPosition}px`;
			}

			function closeDragElement() {
				// Stop moving when the mouse button is released
				element.onmousedown = null;
				document.onmouseup = null;
				document.onmousemove = null;
				clearTimeout(timer);

				// Ensure the panel is on the screen, on the bottom it will show
				// one icon at least.
				const topPosition = Math.max(
					5,
					Math.min(
						ui.sidebar.element.outerHeight() - 50,
						element.offsetTop - newYPosition
					)
				);
				element.style.top = `${topPosition}px`;

				game.user.setFlag(
					"shadowdark",
					"effectPanelTopPosition",
					topPosition
				);
			}
		}
	}
}
