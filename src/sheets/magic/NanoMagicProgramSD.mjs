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

	"radioInterface": 1,
	"muscleReinforcement": 1,
	"cardiacSupport": 1,
	"reflexBypass": 1,
	"muscleOxygenation": 3,
	"artificialBloodFiltering": 3,
	"secondaryReflexArcs": 3,
	"speedBoost": 1,
	"trackingInterface": 3,
	"quantumEffectNanoGrapplers": 3,
	"skinFiltering": 3,
	"legMuscleAugment": 1,
	"organReinforcement": 1,
	"immuneSystemBoost": 1,
	"secondaryMemorySearch": 4,
	"microExpressionsReadout": 4,
	"moralNeuralNetwork": 4,
	"augmentedSensorialGain": 2,
	"threatPrediction": 2,
	"suppressWeariness": 1,
	"improvedOpticalProcessing": 1,
	"chameleonSkin": 1,
	"tendonReinforcement": 1,
	"bloodFiltering": 1,
	"skinDeOxygenation": 3,
	"internalHeating": 3,
	"electromagneticSubdermalMesh": 3,
	"gammaFiltering": 3,
	"hyperspectralVibrationAnalyzer": 1,
	"heuristicNoseFilter": 1,
	"nanoSight": 1,
	"adaptiveTrackingSystem": 3,
	"neuralNetPrediction": 4,
	"muscleOvercharge": 5,
	"electromagneticMesh": 1,

	"radioCloud": 1,
	"stingingCloud": 1,
	"corrosiveCloud": 3,
	"burningCloud": 1,
	"staticCloud": 1,
	"hyperStaticCloud": 3,
	"antiNanoCloud": 1,
	"nullNanoCloud": 3,
	"nanoBuffer": 1,
	"dustGatherer": 1,
	"darkFogEngine": 5,
	"flameBurst": 2,
	"targetAnalyzer": 1,
	"imageProjection": 3,
	"substanceProjection": 5,
	"etherealSpeakers": 3,
	"nanoBoom": 3,
	"stunningBurst": 5,
	"remoteSensing": 3,
	"attrictionCoating": 2,
	"antiAttrictionCoating": 2,
};

const nanoPointsPerLevel = {
	"hpReduction" : -1,
	"achingJoints" : -1,

	"radioInterface": 1,
	"muscleReinforcement": 1,
	"cardiacSupport": 1,
	"reflexBypass": 1,
	"speedBoost": 1,
	"trackingInterface": 3,
	"legMuscleAugment": 1,
	"threatPrediction": 2,
	"suppressWeariness": 1,
	"improvedOpticalProcessing": 1,
	"chameleonSkin": 1,
	"tendonReinforcement": 1,
	"adaptiveTrackingSystem": 1,
	"neuralNetPrediction": 4,
	"electromagneticMesh": 1,

	"radioCloud": 1,
	"stingingCloud": 1,
	"corrosiveCloud": 3,
	"staticCloud": 1,
	"hyperStaticCloud": 3,
	"antiNanoCloud": 1,
	"nullNanoCloud": 3,
	"nanoBuffer": 1,
	"dustGatherer": 1,
	"flameBurst": 2,
	"nanoBoom": 1,
	"stunningBurst": 1,
	"attrictionCoating": 2,
	"antiAttrictionCoating": 1,
};

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
export default class NanoMagicProgramSD extends HandlebarsApplicationMixin(ApplicationV2) {

    constructor(object) {
        super(object);

		this.actor = object.sheet.actor;
		this.actorSheet = object.sheet;
		this.index = object.index;
		this.program = this.actor.system.magic.nanoMagicPrograms[this.index];
		NanoMagicProgramSD.calculateEffectNanoPoints(this.program, this.program.durationReduction);
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
			case "program.effect":
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

		this.program.hasLevels = this.program.effect in nanoPointsPerLevel;
		context.hasLevels = this.program.hasLevels;
		this.configureEffectLevelList();
		context.effectLevelList = this.effectLevelList;

		this.replaceDescriptions();
		context.effectOptions = this.effectOptions;

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
			this.program.drawback = this.program.lastInternalDrawback;
		}
		else
		{
			this.program.lastInternalDrawback = this.program.drawback;
			this.program.effect = this.program.lastExternalEffect;
			this.program.drawback = this.program.lastExternalDrawback;
		}

		this.replaceDescriptions();
		this.program.effectDescription = this.effectOptions[this.program.effect];
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
	}

	async _onChangeProgramDrawback(event) {
		this.program.drawback = event.target.value;

		if (this.program.type === 'internal')
			this.program.lastInternalDrawback = this.program.drawback;
		else
			this.program.lastExternalDrawback = this.program.drawback;

		await NanoMagicProgramSD.calculateEffectNanoPoints(this.program, this.program.durationReduction);
		await NanoMagicSD._updateNanoProgram(this.actor, this.program, this.index);
		this.actorSheet.render(false);
	}

	async _onChangeProgramEffect(event) {
		this.program.effect = event.target.value;

		if (this.program.type === 'internal')
			this.program.lastInternalEffect = this.program.effect;
		else
			this.program.lastExternalEffect = this.program.effect;

		this.program.effectDescription = this.effectOptions[this.program.effect];
		this.program.hasLevels = this.program.effect in nanoPointsPerLevel;
		await NanoMagicProgramSD.calculateEffectNanoPoints(this.program, this.program.durationReduction);
		await NanoMagicSD._updateNanoProgram(this.actor, this.program, this.index);
		this.actorSheet.render(false);
		this.render(true);
	}

	async _onChangeProgramEffectLevels(event) {
		this.program.effectLevels = parseInt(event.target.value);
		this.replaceDescriptions();
		this.program.effectDescription = this.effectOptions[this.program.effect];
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
		var effectiveEffect = (!program.effect || program.effect === "") ? "cardiacSupport" : program.effect;
		program.effectPoints = nanoPointsSetup[effectiveEffect];
		if (effectiveEffect in nanoPointsPerLevel)
		{
			program.nanoPointsPerLevel = nanoPointsPerLevel[effectiveEffect];
			program.increases = Math.floor((program.effectLevels - 1) / program.nanoPointsPerLevel);

			program.effectPoints += (program.effectLevels - 1) * program.nanoPointsPerLevel;
		}
		totalNanoPoints += program.effectPoints;

		if (program.type !== 'internal')
		{
			var durationCost = nanoPointsSetup[program.duration];
			if (durationReduction)
			{
				durationCost -= durationReduction
				if (durationCost < 0) durationCost = 0;
			}
			totalNanoPoints += durationCost;
		}

		var drawbackCost = program.drawback ? nanoPointsSetup[program.drawback] : 0;
		if (program.drawback in nanoPointsPerLevel)
		{
			drawbackCost += (program.effectLevels - 1) * nanoPointsPerLevel[program.drawback];
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
		
		if (this.program.type === 'internal')
			effectOptions = Object.assign({}, CONFIG.SHADOWDARK.NANO_MAGIC_INTERNAL_EFFECTS);
		else
			effectOptions = Object.assign({}, CONFIG.SHADOWDARK.NANO_MAGIC_EXTERNAL_EFFECTS);

		for (const key in effectOptions) {
  			const value = effectOptions[key];
			let description = game.i18n.localize(value);

			if (!description.includes("{"))
				continue;

			if (key in nanoPointsPerLevel)
			{
				let perLevelIncrease = nanoPointsPerLevel[key];
				let increases = Math.floor((this.program.effectLevels - 1) / perLevelIncrease);
				let isPlural = increases > 1;
 
				while (description.match(/\{\d+\}/))
				{
					description = description.replace(/\{(\d+)\}/, (match, number) => {
						switch (key)
						{
							case "radioInterface":
							case "radioCloud":
								let powerOfThree = Math.pow(3, increases);
								return String(Number(number) * powerOfThree);
							case "legMuscleAugment":
							case "nanoBoom":
							case "stunningBurst":
							case "attrictionCoating":
							case "antiAttrictionCoating":
								return String(Number(number) + (increases));
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

				effectOptions[key] = description;
			}
		}

		this.effectOptions = effectOptions;
	}

	async configureEffectLevelList()
	{
		var effectiveEffect = (!this.program.effect || this.program.effect === "") ? "cardiacSupport" : this.program.effect;
		var effectLevelList = {};
		let perLevelIncrease = nanoPointsPerLevel[effectiveEffect];

		for (var l = 1; l <= 10; l++)
		{
			if ((l-1) % perLevelIncrease === 0)
				effectLevelList[l] = l;
		}

		this.effectLevelList = effectLevelList;
	}
}
