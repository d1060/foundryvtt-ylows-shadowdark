import UtilitySD from "../../utils/UtilitySD.mjs";
import NanoMagicSD from "./NanoMagicSD.mjs";

const nanoPointsSetup = {
	"1-turn" : 0,
	"3-turns" : 1,
	"1-minute" : 2,
	"30-minutes" : 3,
	"1-day" : 4,

	"noDrawback" : 0,

	"dizzyOneTurn" : -1,
	"dizzyThreeTurns" : -2,
	"dizzyOneMinute" : -3,
	"blindedOneTurn" : -2,
	"blindedThreeTurns" : -4,
	"blindedOneMinute" : -6,
	"stunnedOneTurn" : -3,
	"stunnedThreeTurns" : -5,
	"stunnedOneMinute" : -7,
	"damageOne" : -3,
	"damageTwo" : -5,
	"damageFour" : -7,
	"programLost" : -3,
	
	"hpReduction" : -1,
	"meleeAttackDisadvantage" : -5,
	"meleeDamageDisadvantage" : -5,
	"rangedAttackDisadvantage" : -3,
	"rangedDamageDisadvantage" : -3,
	"wisDisadvantage" : -3,
	"dexDisadvantage" : -3,
	"strDisadvantage" : -1,
	"conDisadvantage" : -1,
	"intDisadvantage" : -1,
	"chaDisadvantage" : -1,
	"achingJoints" : -1,
	"chronicPain" : -5,
	"hallucinations" : -5,
	"shiveringFever" : -4,
	"dizziness" : -4,
	"blinded" : -5,
	"oncePerWeek" : -3,
};

const nanoPointsPerLevel = {
	"hpReduction" : -1,
	"achingJoints" : -1,
};

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
export default class NanoMagicProgramSD extends HandlebarsApplicationMixin(ApplicationV2) {

    constructor(object) {
        super(object);

		this.actor = object.sheet.actor;
		this.actorSheet = object.sheet;
		this.index = object.index;
		this.program = object.program;
		NanoMagicProgramSD.calculateEffectNanoPoints(this.program, this.program.durationReduction);
		this.replaceDescriptions().then(async () => {
			this.program.effectDescription = this.effectOptions[this.program.effect.name.slugify()].description;
			if (this.program.drawback) this.program.drawbackDescription = await this.replaceDescription(this.program.drawback.system.description, this.program.drawback.system.nanoPointCostPerLevel, this.program.drawback.system.descriptionFormula);
			await NanoMagicSD._updateNanoProgram(this.actor, this.program, this.index);
		});
    }

	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["shadowdark", "sheet", "player", "window-app", 'themed', 'theme-light'],
		position: {
    		width: 600,
    		height: "auto"
  		},
		window: {
			resizable: true,
    		title: 'SHADOWDARK.app.nano_magic_program.title',
			controls: [],
  		},
		form: {
			handler: this.#onSubmit,
		    submitOnChange: true,
    		closeOnSubmit: false
  		},
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/actors/player/seirizianMagic/nano-magic-program.hbs" }
	}

	static async #onSubmit(event, form, formData) {
		switch (event.target.name)
		{
			case "program.name":
				this._onChangeProgramName(event);
				break;
			case "program.type":
				this._onChangeProgramType(event);
				break;
			case "program.duration":
				this._onChangeProgramDuration(event);
				break;
			case "program.drawback":
				this._onChangeProgramDrawback(event);
				break;
			case "program.effectKey":
				this._onChangeProgramEffect(event);
				break;
			case "program.effectLevels":
				this._onChangeProgramEffectLevels(event);
				break;
			case "program.description":
				this._onChangeProgramDescription(event);
				this.render(true);
				break;
		}
	}

	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

        context.actor = this.actor;
        context.index = this.index;
		context.program = this.program;
		context.config = CONFIG.SHADOWDARK;
		context.editable = game.user.isGM || this.actor.isOwner;

		context.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			context.program.description,
			{
				secrets: this.actor.isOwner,
				async: true,
				relativeTo: this.program,
			}
		);

		this.program.hasLevels = this.program.effect.system.nanoPointCostPerLevel != null && this.program.effect.system.nanoPointCostPerLevel != 0;
		context.hasLevels = this.program.hasLevels;
		await this.configureEffectLevelList();
		context.effectLevelList = this.effectLevelList;

		await this.replaceDescriptions();
		context.effectOptions = this.effectOptions;

		context.drawbacks = [];
		if (this.program.type == 'internal') {
			const internalDrawbacks = await shadowdark.compendiums.nanoMagicInternalDrawbacks();
			for (const drawback of internalDrawbacks.contents) {
				const replacedDesc = await this.replaceDescription(drawback.system.description,  drawback.system.nanoPointCostPerLevel, drawback.system.descriptionFormula);
				context.drawbacks.push({
					key: drawback.name.slugify(),
					description: drawback.name + (replacedDesc ?  ": " + replacedDesc : "")
				});
			}
		} else if (this.program.type == 'external') {
			const externalDrawbacks = await shadowdark.compendiums.nanoMagicExternalDrawbacks();
			for (const drawback of externalDrawbacks.contents) {
				const replacedDesc = await this.replaceDescription(drawback.system.description,  drawback.system.nanoPointCostPerLevel, drawback.system.descriptionFormula);
				context.drawbacks.push({
					key: drawback.name.slugify(),
					description: drawback.name + (replacedDesc ?  ": " + replacedDesc : "")
				});
			}
		}
		context.drawbackName = this.program.drawback?.name?.slugify();

		return context;
	}

	_onRender(context, options) {

	}

	async _onChangeProgramName(event) {
		this.program.name = event.target.value;
		await NanoMagicProgramSD.calculateEffectNanoPoints(this.program, this.program.durationReduction);
		await NanoMagicSD._updateNanoProgram(this.actor, this.program, this.index);
		this.actorSheet.render(false);
	}

	async _onChangeProgramType(event) {
		this.program.type = event.target.value;

		if (this.program.type === 'internal')
		{
			this.program.lastExternalDrawback = this.program.drawback;
			this.program.effect = this.program.lastInternalEffect;
			if (!this.program.effect)
			{
				const internalEffects = await shadowdark.compendiums.nanoMagicInternalEffects();
				this.program.effect = internalEffects.find(e => e.name.slugify() === 'cardiac-support');
			}
			this.program.drawback = this.program.lastInternalDrawback;
			if (!this.program.drawback)
			{
				const internalDrawbacks = await shadowdark.compendiums.nanoMagicInternalDrawbacks();
				this.program.drawback = internalDrawbacks.find(d => d.name.slugify() === 'no-drawback');
			}
		}
		else
		{
			this.program.lastInternalDrawback = this.program.drawback;
			this.program.effect = this.program.lastExternalEffect;
			if (!this.program.effect)
			{
				const internalEffects = await shadowdark.compendiums.nanoMagicExternalEffects();
				this.program.effect = internalEffects.find(e => e.name.slugify() === 'target-analyzer');
			}
			this.program.drawback = this.program.lastExternalDrawback;
			if (!this.program.drawback)
			{
				const externalDrawbacks = await shadowdark.compendiums.nanoMagicExternalDrawbacks();
				this.program.drawback = externalDrawbacks.find(d => d.name.slugify() === 'no-drawback');
			}
		}
		this.program.effectKey = this.program.effect.name.slugify();

		await this.replaceDescriptions();
		this.program.effectDescription = this.effectOptions[this.program.effect.name.slugify()].description;
		if (this.program.drawback) this.program.drawbackDescription = await this.replaceDescription(this.program.drawback.system.description, this.program.drawback.system.nanoPointCostPerLevel, this.program.drawback.system.descriptionFormula);
		await NanoMagicProgramSD.calculateEffectNanoPoints(this.program, this.program.durationReduction);
		await NanoMagicSD._updateNanoProgram(this.actor, this.program, this.index);
		this.actorSheet.render(false);
		this.render(true);
	}

	async _onChangeProgramDuration(event) {
		this.program.duration = event.target.value;
		await NanoMagicProgramSD.calculateEffectNanoPoints(this.program, this.program.durationReduction);
		await NanoMagicSD._updateNanoProgram(this.actor, this.program, this.index);
		this.actorSheet.render(false);
		this.render(true);
	}

	async _onChangeProgramDrawback(event) {
		
		if (this.program.type === 'internal')
		{
			this.program.lastInternalDrawback = this.program.drawback;
			const internalDrawbacks = await shadowdark.compendiums.nanoMagicInternalDrawbacks();
			const drawback = internalDrawbacks.find(d => d.name.slugify() === event.target.value);
			this.program.drawback = drawback;
			this.program.drawbackDescription = await this.replaceDescription(this.program.drawback.system.description, this.program.drawback.system.nanoPointCostPerLevel, this.program.drawback.system.descriptionFormula);
		}
		else
		{
			this.program.lastExternalDrawback = this.program.drawback;
			const externalDrawbacks = await shadowdark.compendiums.nanoMagicExternalDrawbacks();
			const drawback = externalDrawbacks.find(d => d.name.slugify() === event.target.value);
			this.program.drawback = drawback;
			this.program.drawbackDescription = await this.replaceDescription(this.program.drawback.system.description, this.program.drawback.system.nanoPointCostPerLevel, this.program.drawback.system.descriptionFormula);
		}

		await NanoMagicProgramSD.calculateEffectNanoPoints(this.program, this.program.durationReduction);
		await NanoMagicSD._updateNanoProgram(this.actor, this.program, this.index);
		this.actorSheet.render(false);
		this.render(true);
	}

	async _onChangeProgramEffect(event) {
		this.program.effectKey = event.target.value;

		if (this.program.type === 'internal')
		{
			const effects = await shadowdark.compendiums.nanoMagicInternalEffects();
			this.program.effect = effects.find(e => e.name.slugify() === this.program.effectKey);
			this.program.lastInternalEffect = this.program.effect;
		}
		else
		{
			const effects = await shadowdark.compendiums.nanoMagicExternalEffects();
			this.program.effect = effects.find(e => e.name.slugify() === this.program.effectKey);
			this.program.lastExternalEffect = this.program.effect;
		}

		this.program.effectDescription = this.effectOptions[this.program.effect.name.slugify()].description;
		if (this.program.drawback) this.program.drawbackDescription = await this.replaceDescription(this.program.drawback.system.description, this.program.drawback.system.nanoPointCostPerLevel, this.program.drawback.system.descriptionFormula);
		this.program.hasLevels = this.program.effect in nanoPointsPerLevel;
		await NanoMagicProgramSD.calculateEffectNanoPoints(this.program, this.program.durationReduction);
		await NanoMagicSD._updateNanoProgram(this.actor, this.program, this.index);
		this.actorSheet.render(false);
		this.render(true);
	}

	async _onChangeProgramEffectLevels(event) {
		this.program.effectLevels = parseInt(event.target.value);
		await this.replaceDescriptions();
		this.program.effectDescription = this.effectOptions[this.program.effect.name.slugify()].description;
		if (this.program.drawback) this.program.drawbackDescription = await this.replaceDescription(this.program.drawback.system.description, this.program.drawback.system.nanoPointCostPerLevel, this.program.drawback.system.descriptionFormula);
		await NanoMagicProgramSD.calculateEffectNanoPoints(this.program, this.program.durationReduction);
		await NanoMagicSD._updateNanoProgram(this.actor, this.program, this.index);
		this.actorSheet.render(false);
		this.render(true);
	}

	async _onChangeProgramDescription(event)
	{
		this.program.description = event.target.value;
		await NanoMagicSD._updateNanoProgram(this.actor, this.program, this.index);
	}

	static async calculateEffectNanoPoints(program, durationReduction)
	{
		var totalNanoPoints = 0;
		var effectiveEffect = program.effect;
		if (!effectiveEffect)
		{
			const internalEffects = await shadowdark.compendiums.nanoMagicInternalEffects();
			effectiveEffect = internalEffects.find(e => e.name.slugify() === 'cardiac-support');
		}

		program.effectPoints = effectiveEffect.system.nanoPointCost;
		if (effectiveEffect.system.nanoPointCostPerLevel)
		{
			program.nanoPointsPerLevel = effectiveEffect.system.nanoPointCostPerLevel;
			program.increases = Math.floor((program.effectLevels - 1) / program.nanoPointsPerLevel);
			program.effectPoints += program.increases * program.nanoPointsPerLevel;
		}
		totalNanoPoints += program.effectPoints;

		if (effectiveEffect.system.nanoProgramType !== 'internal')
		{
			var durationCost = nanoPointsSetup[program.duration];
			if (durationReduction)
			{
				durationCost -= parseInt(durationReduction)
				if (durationCost < 0) durationCost = 0;
			}
			totalNanoPoints += durationCost;
		}

		var drawbackCost = parseInt(program.drawback?.system?.nanoPointCost ?? '0');
		if (program.drawback.system.nanoPointCostPerLevel)
		{
			drawbackCost += (program.effectLevels - 1) * parseInt(program.drawback?.system?.nanoPointCostPerLevel ?? '0');
		}
		totalNanoPoints += drawbackCost;
		
		if (program.optimized)
			totalNanoPoints = Math.ceil(totalNanoPoints/2);
	
		if (totalNanoPoints <= 0) totalNanoPoints = 1;
		
		program.points = totalNanoPoints;
		program.programDC = 9 + program.points;
	}

	async replaceDescriptions()
	{
		let effectOptions = {};
		let effects = [];
		
		if (this.program.type === 'internal')
			effects = await shadowdark.compendiums.nanoMagicInternalEffects();
		else
			effects = await shadowdark.compendiums.nanoMagicExternalEffects();

		for (const effect of effects) {
			let key = effect.name.slugify();
			let description = await this.replaceDescription(effect.system.description, effect.system.nanoPointCostPerLevel, effect.system.descriptionFormula);
			effectOptions[key] = {key, description};
		}

		this.effectOptions = effectOptions;
	}

	async replaceDescription(description, nanoPointCostPerLevel, descriptionFormula) {
		if (!description.includes("{")) return description;

		let perLevelIncrease = nanoPointCostPerLevel;
		if (perLevelIncrease) {
			let increases = Math.floor((this.program.effectLevels - 1) / perLevelIncrease);
			let isPlural = increases > 1;

			while (description.match(/\{\-?\d+\}/))
			{
				description = description.replace(/\{(\-?\d+)\}/, (match, number) => {
					switch (descriptionFormula)
					{
						case "power3":
							let powerOfThree = Math.pow(3, increases);
							return String(Number(number) * powerOfThree);
						case "add":
							return String(Number(number) + (increases));
						case "multiply":
						default:
							return String(Number(number) * (increases + 1));
					}
				});
			}

			if (description.match(/\{s\}/))
			{
				if (!isPlural) description = description.replace(/\{s\}/, "");
				else description = description.replace(/\{s\}/, "s");
			}
		}

		return description;
	}

	async configureEffectLevelList()
	{
		var effectiveEffect = this.program.effect;
		if (!effectiveEffect)
		{
			const internalEffects = await shadowdark.compendiums.nanoMagicInternalEffects();
			effectiveEffect = internalEffects.find(e => e.name.slugify() === 'cardiac-support');
		}

		var effectLevelList = {};

		for (var l = 1; l <= 10; l++)
			effectLevelList[l * effectiveEffect.system.nanoPointCostPerLevel] = l;

		this.effectLevelList = effectLevelList;
	}
}
