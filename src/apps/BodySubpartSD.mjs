const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class BodySubpartSD extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options) {
        super(options);
        this.index = options.index;
        this.sheet = options.sheet;
    }

   	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["app", "window-app", "shadowdark", 'themed', 'theme-light'],
		position: {
    		width: "300",
    		height: "auto"
  		},
		window: {
			resizable: true,
    		title: 'SHADOWDARK.sheet.item.tab.bodySubparts',
			controls: [],
  		},
		actions: {
            removeSubpart: this.#onRemoveSubpart
		},
		form: {
			handler: this.#onSubmit,
		    submitOnChange: true,
    		closeOnSubmit: false
  		},
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/apps/body-subparts.hbs" }
	}

	/** @override */
	async _prepareContext(options) {
		const context = {
            subParts: this.sheet.item.system.bodyParts[this.index].subParts
		};
        return context;
    }

	static async #onSubmit(event, form, formData) {
		switch (event.target.name) {
            case "subpart-name":
                const index = parseInt(event.target.dataset.index);
                this.sheet.item.system.bodyParts[this.index].subParts[index] = event.target.value;
                this.render();
        		this.sheet.item.update({['system.bodyParts']: this.sheet.item.system.bodyParts});
                break;
            case "new-subpart-name":
                this.sheet.item.system.bodyParts[this.index].subParts.push(event.target.value);
                this.render();
        		this.sheet.item.update({['system.bodyParts']: this.sheet.item.system.bodyParts});
                break;
        }
	}

    static async #onRemoveSubpart(event, form, formData) {
        const index = parseInt(event.target.dataset.index);
		this.sheet.item.system.bodyParts[this.index].subParts.splice(index, 1);
        this.render();
   		this.sheet.item.update({['system.bodyParts']: this.sheet.item.system.bodyParts});
    }
}
