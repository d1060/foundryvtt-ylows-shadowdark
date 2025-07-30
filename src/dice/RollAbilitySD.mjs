const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
export default class RollAbilitySD extends HandlebarsApplicationMixin(ApplicationV2) {
	constructor(params) {
		super(params.actor);
		
		this.params = {
			actor: params.actor,
			baseApplication: params.sheet,
			abilityId: params.abilityId,
			callback: params.callback,
			data: params.data,
			target: params.data.target,
			parts: params.parts,
			targetName: params.targetName,
			checkType: 'raw',
			chatCardTemplate: "systems/shadowdark/templates/chat/ability-card.hbs",
		};
    }

	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["shadowdark", "dice", "window-app", 'themed', 'theme-light'],
		position: {
    		width: 400,
    		height: "auto"
  		},
		window: {
			resizable: true,
    		title: 'SHADOWDARK.dialog.cast_roll.title',
			controls: [],
  		},
		form: {
			handler: this.#onSubmit,
		    submitOnChange: true,
    		closeOnSubmit: false,
			closeOnEscape: true,
            modal: true,
  		},
		actions: {
			rollButton: this.#onRoll,
			checkTypeRadio: this.#onCheckTypeRadio,
			checkTypeLabel: this.#onCheckTypeLabel,
		},
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/dialog/roll-ability-check-dialog.hbs" }
	}

	/** @inheritdoc */
	get title() {
		return game.i18n.localize(`SHADOWDARK.dialog.ability_check.${this.params.abilityId}`);
	}

	static async #onSubmit(event, form, formData) {
		switch (event.target.name)
		{
			case "check-type":
				this.params.checkType = event.target.dataset.value;
				break;
			case "ability-bonus":
				this.params.data.abilityBonus = event.target.value;
				break;
			case "item-bonus":
				this.params.data.itemBonus = event.target.value;
				break;
			case "rollMode":
				this.rollMode = event.target.value;
				break;
		}
		this.render(true);
	}	

	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		if (this.params.actor.system.bonuses?.[this.params.abilityId]?.advantage)
			context.rawAdvantage = true;

		if (this.params.actor.system.bonuses?.[this.params.abilityId]?.disadvantage)
		{
			if (context.rawAdvantage) context.rawAdvantage = false;
			else context.rawDisadvantage = true;
		}
		
		context.rollModes = CONFIG.Dice.rollModes;
		context.rollMode =  this.rollMode;
		context.data = this.params.data;
		context.targetName = this.params.targetName;
        context.checkType = this.params.checkType;

		context.data.advantage = false;
		context.data.disadvantage = false;
		context.data.talentBonus = null;
		this.params.data.talentBonus = null;

		if ("raw" === this.params.checkType.slugify() && context.rawAdvantage)
			context.data.advantage = true;
		else if ("raw" === this.params.checkType.slugify() && context.rawDisadvantage)
			context.data.disadvantage = true;

		let [stealthEquipmentModifier, swimEquipmentModifier, noArmorWorn] = await this.params.actor.getStealthSwimModifiers();
		let advantgeBonuses = await this.params.actor.advantages();
		let disadvantgePenalties = await this.params.actor.disadvantages();

		var checkTypes = [];
		for (var type of this.params.data.checkTypes)
		{
			var checkTypeObject = {label: type};
			let slugifiedType = type.slugify();

			if (slugifiedType === "swim" && swimEquipmentModifier === "no")
			{
				checkTypeObject.no = true;
				checkTypes.push(checkTypeObject);
				continue;
			}

			if (context.rawAdvantage)
				checkTypeObject.advantage = true;
			else if (context.rawDisadvantage)
				checkTypeObject.disadvantage = true;

			if ((slugifiedType === "swim" && swimEquipmentModifier === "disadvantage") || (slugifiedType === "stealth" && stealthEquipmentModifier === "disadvantage"))
			{
				if (checkTypeObject.advantage) checkTypeObject.advantage = false;
				else checkTypeObject.disadvantage = true;
			}

			if (advantgeBonuses.length > 0)
			{
				for (var advantageType of advantgeBonuses)
				{
					if (slugifiedType === advantageType.slugify() || advantageType.slugify().includes("resistance") && slugifiedType.includes("resistance"))
					{
						if (checkTypeObject.disadvantage) checkTypeObject.disadvantage = false;
						checkTypeObject.advantage = true;
					}
				}
			}

			if (disadvantgePenalties.length > 0)
			{
				for (var disadvantageType of disadvantgePenalties)
				{
					if (slugifiedType === disadvantageType.slugify() || disadvantageType.slugify().includes("resistance") && slugifiedType.includes("resistance"))
					{
						if (checkTypeObject.advantage) checkTypeObject.advantage = false;
						else checkTypeObject.disadvantage = true;
					}
				}
			}

			if (noArmorWorn && this.params.actor.system.bonuses.unarmoredStealthBonus && slugifiedType === "stealth")
				checkTypeObject.talentBonus = this.params.actor.system.bonuses.unarmoredStealthBonus;

			if (slugifiedType === this.params.checkType.slugify() && checkTypeObject.advantage)
				context.data.advantage = true;
			else if (slugifiedType === this.params.checkType.slugify() && checkTypeObject.disadvantage)
				context.data.disadvantage = true;
			if (checkTypeObject.talentBonus && slugifiedType === this.params.checkType.slugify())
			{
				context.data.talentBonus = checkTypeObject.talentBonus;
				this.params.data.talentBonus = checkTypeObject.talentBonus;
			}

			checkTypes.push(checkTypeObject);
		}

		context.checkTypes = checkTypes;

		return context;
	}

	static async #onCheckTypeLabel(event, html) {
		const checkType = event.target.dataset.value;
		this.params.checkType = checkType;
		this.render(true);
	}

	static async #onCheckTypeRadio(event, html) {

	}

	static async #onRoll(event, html) {
		const rollButton = event.target.dataset.button;

		var advantage = 0;
		if (rollButton === "advantage")
			advantage = 1;
		else if (rollButton === "disadvantage")
			advantage = -1;

		this.params.title = this.title;
		if (this.params.checkType && this.params.checkType !== 'raw')
			this.params.title += ": " + this.params.checkType;

		var rollResult = await CONFIG.DiceSD.Roll(this.params.parts, this.params.data, event.currentTarget, advantage, this.params);
		this.close();
		if (this.params.callback)
			this.params.callback(rollResult);
	}
}