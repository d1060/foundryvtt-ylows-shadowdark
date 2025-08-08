const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
export default class RollMagicSD extends HandlebarsApplicationMixin(ApplicationV2) {

	constructor(params) {
		super(params.actor);

		this.callback = params.callback;
		this.data = params.data;
		this.target = params.data.target;
		this.rollParts = params.parts;
		this.targetName = params.targetName;
		this.power = params.data.power ?? params.power;
		this.params = params;
		this.chatCardTemplate = "systems/shadowdark/templates/chat/magic-card.hbs";
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
  		},
		actions: {
			rollButton: this.#onRoll,
		},
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/apps/roll-magic.hbs" }
	}

	/** @inheritdoc */
	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.cast_roll.title") + " " + this.data.spellName;
	}

	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		
		context.rollModes = CONFIG.Dice.rollModes;
		context.rollMode =  this.rollMode;
		context.data = this.data;
		context.targetName = this.targetName;
		context.isSpell = this.params.isSpell;

		return context;
	}

	_onRender(context, options) {

	}

	static async #onSubmit(event, form, formData) {
		switch (event.target.name)
		{
			case "data.effectiveLevel":
				await this._onChangeMagicLevel(event, formData);
				break;
			case "rollMode":
				this.rollMode = event.target.value;
				break;
			case "data.talentBonus":
				await this._onChangeTalentBonus(event, formData);
				break;
			case "data.damage":
				await this._onChangeDamage(event, formData);
				break;
		}
		this.render(true);
	}	

	async _onChangeMagicLevel(event, formData) {
		const newLevel =  parseInt(event.target.value);
		this.data.effectiveLevel = event.target.value;
		this.data.spellDC = 9 + newLevel;
		this.data.target = this.data.spellDC;
		this.target = this.data.spellDC;

		var powerLevel = this.data.power?.system?.powerLevel;
		var excessPower = newLevel - powerLevel;
		if (!newLevel || !powerLevel)
			return;
		
		this.data.damage = shadowdark.dice.RollMagicSD.increasePowerDamage(this.data.power, excessPower);
		this.data.duration = shadowdark.dice.RollMagicSD.increasePowerDuration(this.data.power, excessPower);
		if (this.data.duration.includes("-"))
		{
			var durationParts = this.data.duration.split("-");
			this.data.duration_amount = game.i18n.localize("SHADOWDARK.duration_" + durationParts[0]);
			this.data.duration_desc = game.i18n.localize("SHADOWDARK.duration_" + durationParts[1] + (parseInt(durationParts[0]) > 1 ? "s" : ""));
		}
		else
		{
			this.data.duration_amount = "";
			this.data.duration_desc = game.i18n.localize("SHADOWDARK.duration_" + this.data.duration);
		}

		return formData;
	}

	async _onChangeTalentBonus(event, formData) {
		const talentBonus = event.target.value;
		this.data.talentBonus = talentBonus;
	}

	async _onChangeDamage(event, formData) {
		const damage = event.target.value;
		this.data.damage = damage;
	}

	static increasePowerDamage(power, excessPower) {
		if (!power.system.damage || !power.system.damage_increase || power.system.damage_increase_step > excessPower)
			return power.system.damage;
		
		var increaseSteps = Math.floor(excessPower / power.system.damage_increase_step);
		
		var damageParts = power.system.damage.split("d");
		var damageIncreaseParts = power.system.damage_increase.split("d");
		
		if (damageParts[1] == damageIncreaseParts[1])
		{
			var newNumDice = parseInt(damageParts[0]) + parseInt(damageIncreaseParts[0]) * increaseSteps;
			damageParts[0] = newNumDice;
			var newDamage = damageParts.join("d");
			return newDamage;
		}
		else
		{
			var newNumDice = parseInt(damageIncreaseParts[0]) * increaseSteps;
			damageIncreaseParts[0] = newNumDice;
			var newDamageIncrease = damageParts.join("d");
			return power.system.damage + "+" + newDamageIncrease;
		}
	}
	
	static increasePowerDuration(power, excessPower) {
		if (!power.system.duration || !power.system.duration_increase || power.system.duration_increase_step > excessPower)
			return power.system.duration;
		var increaseSteps = Math.floor(excessPower / power.system.duration_increase_step);
		
		var duration = power.system.duration;
		if (!duration.includes("-"))
			return duration;
		
		var durationParts = duration.split("-");
		var durationAmount = parseInt(durationParts[0]);
		
		if (power.system.duration_increase === 'once')
		{
			durationAmount = durationAmount + durationAmount * increaseSteps;
			durationParts[0] = durationAmount;
			duration = durationParts.join("-");
			return duration;
		}
		else if (power.system.duration_increase === 'one-step')
		{
			var durationSteps = [
				'1-turn',
				'1-minute',
				'1-hour',
				'1-day',
				'1-week',
				'1-month',
				'1-year',
				'10-years',
				'100-years',
				'permanent',
			];
			var index = durationSteps.indexOf(duration);
			index += increaseSteps;
			if (index >= durationSteps.length)
				return durationSteps[durationSteps.length - 1];
			return durationSteps[index];
		}
	}
	
	static async #onRoll(event, html) {
		const rollButton = event.target.dataset.button;

		var advantage = 0;
		if (rollButton === "advantage")
			advantage = 1;
		else if (rollButton === "disadvantage")
			advantage = -1;

		this.params.title = this.title;

		var rollResult = await CONFIG.DiceSD.Roll(this.rollParts, this.data, event.currentTarget, advantage, this.params);
		if (!rollResult.power)
			rollResult.power = this.params.power;
		this.close();
		if (this.callback)
			this.callback(rollResult);
	}
}
