const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
export default class LoadingSD extends HandlebarsApplicationMixin(ApplicationV2) {

    constructor(options) {
        super(options);
    }

   	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["shadowdark", "loading-spinner", 'themed', 'theme-light'],
		position: {
    		width: "auto",
    		height: 120
  		},
		window: {
			resizable: false,
    		title: 'SHADOWDARK.app.loading.title',
			controls: [],
  		},
		actions: {
		},
		form: {
		    submitOnChange: true,
    		closeOnSubmit: true
  		},
		dragDrop: [{
			dragSelector: ".item",
			dropSelector: ".droppable"
		}],
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/apps/loading.hbs" }
	}

	async close(options={}) {
		while (!this.rendered) {
			await shadowdark.utils.sleep(100); // millisecs
		}

		super.close(options);
	}
}
