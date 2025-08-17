const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class EvolutionGridSD extends HandlebarsApplicationMixin(ApplicationV2) {
	#dragDrop

    constructor(options) {
        super(options);

		let optionsKeys = Object.keys(options);
		for (let key of optionsKeys) {
			this[key] = options[key];
		}
		this.editing = false;

		this.#dragDrop = this.#createDragDropHandlers()
    }

   	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["application", "window-app", "shadowdark", 'themed', 'theme-light'],
		position: {
    		width: 800,
    		height: 800
  		},
		window: {
			resizable: true,
    		title: 'SHADOWDARK.app.evolutionGrid.title',
			controls: [],
  		},
		actions: {
			editEvolutionGrid: this.#onEditEvolutionGrid
		},
		form: {
			handler: this.#onSubmit,
		    submitOnChange: false,
    		closeOnSubmit: false
  		},
		dragDrop: [{
			dragSelector: ".item",
			dropSelector: ".droppable"
		}],
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/apps/evolution-grid.hbs" }
	}

	/** @inheritdoc */
	get title() {

		let classes = "";
		if (!this.actor && this.type?.system?.class)
		{
			for (let uuid of this.type.system.class)
			{
				if (classes !== "") classes += ", ";
				classes += shadowdark.utils.getFromUuidSync(uuid).name;
			}
		}

		const title = game.i18n.localize("SHADOWDARK.app.evolutionGrid.title");
		return `${title} ${this.actor ? this.actor.name : classes}`;
	}

	/** @inheritdoc */
	_canDragDrop() {
		return true;
	}

	/** @inheritdoc */
	_canDragStart() {
		return true;
	}

	#createDragDropHandlers() {
		return this.options.dragDrop.map((d) => {
		d.permissions = {
			dragstart: this._canDragStart.bind(this),
			drop: this._canDragDrop.bind(this)
		};
		d.callbacks = {
			dragstart: this._onDragStart.bind(this),
			dragover: this._onDragOver.bind(this),
			drop: this._onDrop.bind(this)
		};
		return new foundry.applications.ux.DragDrop(d);
		})
	}

	/** @override */
	async _onDragStart(event) {
	}

	async _onDragOver(event) {

	}

	async _onDrop(event) {
		const eventData = foundry.applications.ux.TextEditor.getDragEventData(event);

	}

	_onRender(context, options) {
    	this.#dragDrop.forEach((d) => d.bind(this.element))
  	}

	/** @inheritdoc */
	async _onFirstRender(context, options) {
		await super._onFirstRender(context, options);
	}

	/** @inheritdoc */
	async render(force, options) {
		await super.render(force, options);
		await this.activateListeners();
	}

	/** @override */
	async activateListeners() {

	}

	/** @override */
	async _prepareContext(options) {
		let context = {
			editing: this.editing
		};

		return context;
	}

	/** @override */
	static async #onSubmit(event, form, formData) {
		
	}

	static async #onEditEvolutionGrid(event, form, formData) {
		if (this.editing == null) this.editing = false;
		this.editing = !this.editing;
		this.render(true);
	}
}
