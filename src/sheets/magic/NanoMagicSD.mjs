import UtilitySD from "../../utils/UtilitySD.mjs";

const nanoEffectsEffects = {
	"muscleReinforcement": { key: "system.bonuses.str.bonus", img: "icons/magic/control/buff-strength-muscle-damage-orange.webp" },
	"cardiacSupport": { key: "system.bonuses.con.bonus", img: "icons/skills/wounds/anatomy-organ-heart-red.webp" },
	"reflexBypass": { key: "system.bonuses.dex.bonus", img: "icons/skills/melee/maneuver-sword-katana-yellow.webp" },
	"muscleOxygenation": { key: "system.bonuses.str.advantage", img: "icons/magic/control/buff-strength-muscle-damage.webp" },
	"artificialBloodFiltering": { key: "system.bonuses.con.advantage", img: "icons/skills/social/intimidation-impressing.webp" },
	"secondaryReflexArcs": { key: "system.bonuses.dex.advantage", img: "icons/skills/melee/maneuver-greatsword-yellow.webp" },
	"speedBoost": { key: "system.bonuses.meleeDamageBonus", img: "icons/skills/melee/strikes-sword-scimitar.webp" },
	"trackingInterface": { key: "system.bonuses.opponentACpenalty", img: "icons/skills/targeting/crosshair-ringed-gray.webp" },
	"secondaryMemorySearch": { key: "system.bonuses.int.advantage", img: "icons/skills/trades/academics-book-study-purple.webp" },
	"microExpressionsReadout": { key: "system.bonuses.cha.advantage", img: "icons/environment/people/commoner.webp" },
	"moralNeuralNetwork": { key: "system.bonuses.wis.advantage", img: "icons/magic/perception/third-eye-blue-red.webp" },
	"augmentedSensorialGain": { key: "system.bonuses.advantage(perception)", img: "icons/magic/perception/eye-ringed-glow-angry-small-red.webp" },
	"threatPrediction": { key: "system.bonuses.dexBonusToAc", img: "icons/skills/melee/shield-block-fire-orange.webp" },
	"suppressWeariness": { key: "system.bonuses.move_bonus", img: "icons/skills/movement/figure-running-gray.webp" },
	"improvedOpticalProcessing": { key: "system.bonuses.rangedAttackBonus", img: "icons/skills/ranged/target-bullseye-arrow-blue.webp" },
	"chameleonSkin": { key: "system.bonuses.unarmoredStealthBonus", img: "icons/creatures/reptiles/chameleon-camouflage-green-brown.webp" },
	"tendonReinforcement": { key: "system.bonuses.gearSlots", img: "icons/containers/bags/pack-leather-red.webp" },
	"bloodFiltering": { key: "system.bonuses.advantage(resistance)", img: "icons/skills/wounds/blood-drip-droplet-red.webp" },
	"skinDeOxygenation": { key: "system.bonuses.resistance(fire)", img: "icons/magic/fire/barrier-wall-explosion-orange.webp" },
	"internalHeating": { key: "system.bonuses.resistance(cold)", img: "icons/environment/wilderness/mine-interior-dungeon-door.webp" },
	"electromagneticSubdermalMesh": { key: "system.bonuses.resistance(electricity)", img: "icons/magic/lightning/fist-unarmed-strike-blue-green.webp" },
	"gammaFiltering": { key: "system.bonuses.resistance(radiation)", img: "icons/magic/lightning/bolt-strike-explosion-blue.webp" },
	"adaptiveTrackingSystem": { key: "system.bonuses.advantageOnAllAttacks", img: "icons/skills/melee/weapons-crossed-swords-black-gray.webp" },
	"neuralNetPrediction": { key: "system.bonuses.acBonus", img: "icons/magic/defensive/illusion-evasion-echo-purple.webp" },
	"electromagneticMesh": { key: "system.bonuses.tempHP", img: "icons/magic/defensive/shield-barrier-glowing-blue.webp" },

	"stingingCloud": { key: "damage", img: "icons/magic/death/skeleton-glow-yellow-black.webp", damage: 1, damagePerIncrease: 1, damageType: 'acid' },
	"corrosiveCloud": { key: "damage", img: "icons/magic/death/skull-energy-light-white.webp", damage: 1, damagePerIncrease: 1, damageType: 'acid' },
	"staticCloud": { key: "damage", img: "icons/magic/lightning/bolt-strike-sparks-teal.webp", damage: 2, damagePerIncrease: 2, damageType: 'electricity' },
	"hyperStaticCloud": { key: "damage", img: "icons/magic/lightning/bolts-forked-large-blue.webp", damage: 2, damagePerIncrease: 2, damageType: 'electricity' },
	"flameBurst": { key: "damage", img: "icons/magic/fire/explosion-fireball-large-orange.webp", damage: '1d6', damagePerIncrease: 1, damageType: 'fire' },
	"nanoBoom": { key: "con", img: "icons/magic/sonic/explosion-shock-sound-wave.webp" },
	"stunningBurst": { key: "con", img: "icons/magic/sonic/explosion-impact-shock-wave.webp" },
};

export default class NanoMagicSD {
	static async activateListeners(html, actor, sheet) {
		html.find("[data-action='nano-program-roll']").click(
			event => this._onRollNanoMagic(actor, event, html)
		);

		html.find("[data-action='reset-core-dump']").click(
			event => this._onResetCoreDump(actor, sheet)
		);

		html.find("[data-action='optimize-program']").click(
			event => this._onOptimizeProgram(actor, event, sheet)
		);

		html.find("[data-action='production-ready']").click(
			event => this._onProductionReadyProgram(actor, event, sheet)
		);

		html.find("[data-action='create-program']").click(
			event => this._onCreateNanoProgram(event, actor, sheet)
		);

		html.find("[data-action='edit-program']").click(
			event => this._onEditNanoProgram(event, actor, sheet)
		);

		html.find("[data-action='delete-program']").click(
			event => this._onDeleteNanoProgram(event, actor, sheet)
		);

		html.find("[data-action='cancel-program']").click(
			event => this._onCancelNanoProgram(event, actor, sheet)
		);

		html.find("[data-action='reset-program']").click(
			event => this._onResetNanoProgram(event, actor, sheet)
		);
	}

	static async _prepareNanoMagic(actor, context) {
		if (actor.system.magic.type === "nanoMagic")
			context.showNanoMagic = true;
		else
			return;

		if (!actor?.system?.magic?.nanoPoints)
		{
			actor.system.magic.nanoPoints = { value: 0, base: 0, };
			actor.update({"system.magic.nanoPoints": { value: 0, base: 0, }});
		}

		context.knownNanoMagicTalents = await actor.nanoMagicTalents();
		context.nanoMagicPrograms = actor.system?.magic?.nanoMagicPrograms ?? [];
		
		if (!actor?.system?.magic?.nanoMagicPrograms)
		{
			actor.system.magic.nanoMagicPrograms = [];
		}
		
		context.knownNanoProgramCount = actor.level * 2;
		context.nanoProgramsFailureTolerance = 0;
		context.nanoMemoryProtection = 0;
		context.nanoTolerance = 0;
		context.programOptimizations = 0;
		context.durationReduction = 0;
		context.programOptimization = false;
		context.productionReadyCount = 0;
		context.productionReady = false;
		
		for (var nanoTalent of context.knownNanoMagicTalents ?? [])
		{
			if (!nanoTalent?.effects)
				continue;
			
			for (var nanoTalentEffect of nanoTalent.effects)
			{
				if (!nanoTalentEffect?.changes)
					continue;
				
				for (var nanoTalentEffectChanges of nanoTalentEffect.changes)
				{
					if (nanoTalentEffectChanges.key === "system.bonuses.knownNanoPrograms")
						context.knownNanoProgramCount += parseInt(nanoTalentEffectChanges.value);
					else if (nanoTalentEffectChanges.key === "system.bonuses.nanoProgramsFailureTolerance")
						context.nanoProgramsFailureTolerance += parseInt(nanoTalentEffectChanges.value);
					else if (nanoTalentEffectChanges.key === "system.bonuses.nanoProtectedMemory")
						context.nanoMemoryProtection += parseInt(nanoTalentEffectChanges.value);
					else if (nanoTalentEffectChanges.key === "system.bonuses.nanoTolerance")
						context.nanoTolerance += parseInt(nanoTalentEffectChanges.value);
					else if (nanoTalentEffectChanges.key === "system.bonuses.programOptimizationCount")
					{
						context.programOptimizations += parseInt(nanoTalentEffectChanges.value);
						context.programOptimization = true;
					}
					else if (nanoTalentEffectChanges.key === "system.bonuses.productionReady")
					{
						context.productionReadyCount += parseInt(nanoTalentEffectChanges.value);
						context.productionReady = true;
					}
					else if (nanoTalentEffectChanges.key === "system.bonuses.solarNanobots")
						context.durationReduction += parseInt(nanoTalentEffectChanges.value);
				}
			}
		}

		this.durationReduction = context.durationReduction;

		context.productionReadyOrProgramOptimization = context.productionReady || context.programOptimization;

		var nanoPoints = actor.system?.level?.value;
		if (context.nanoTolerance)
			nanoPoints += Math.floor(actor.system?.level?.value / 2) * context.nanoTolerance;
		
		if (!actor.system?.magic?.nanoPoints?.base)
		{
			actor.system.magic.nanoPoints.base = nanoPoints;
			context.actor.system.magic.nanoPoints.base = nanoPoints;
			actor.update({"system.magic.nanoPoints.base": nanoPoints});
		}
		
		if (actor.system?.magic?.nanoPoints?.base != nanoPoints)
		{
			actor.system.magic.nanoPoints.base = nanoPoints;
			actor.system.magic.nanoPoints.value = nanoPoints;
			actor.update({"system.magic.nanoPoints.base": nanoPoints});
			actor.update({"system.magic.nanoPoints.value": nanoPoints});
		}

		for (var i = 0; i < actor.system.magic.nanoMagicPrograms.length; i++)
		{
			await this._localizeProgram(actor, i);
			if (actor.system.magic.nanoMagicPrograms[i].durationReduction != context.durationReduction)
			{
				actor.system.magic.nanoMagicPrograms[i].durationReduction = context.durationReduction;
				shadowdark.sheets.NanoMagicProgramSD.calculateEffectNanoPoints(actor.system.magic.nanoMagicPrograms[i], context.durationReduction);
			}
		}

		for (var i = actor.system.magic.nanoMagicPrograms.length; i > context.knownNanoProgramCount; i--)
		{
			actor.system.magic.nanoMagicPrograms.pop();
		}

		if (actor.system.magic.nanoMagicPrograms.length < context.knownNanoProgramCount)
			context.canSelectNanoProgramCount = true;

		var numOptimizedPrograms = 0;
		var numProductionReadyPrograms = 0;
		for (var i = 0; i < actor.system.magic.nanoMagicPrograms.length; i++)
		{
			let program = actor.system.magic.nanoMagicPrograms[i];
			if (program.lost)
				context.anyProgramLost = true;

			if (context.programOptimization)
			{
				if (program.optimized)
					numOptimizedPrograms++;
			}
			else
			{
				program.optimized = false;
			}

			if (context.productionReady)
			{
				if (program.productionReady)
					numProductionReadyPrograms++;
			}
			else
			{
				program.productionReady = false;
			}

			program.disabled = program.lost || (program.points > actor.system?.magic?.nanoPoints.value && !actor.system.magic.nanoMagicPrograms[i].active);
			program.hideDrawback = !program.drawback || program.drawback === "noDrawback";
		}
		
		if (numOptimizedPrograms >= context.programOptimizations)
			context.programOptimizations = 0;

		if (numProductionReadyPrograms >= context.productionReadyCount)
			context.productionReadyCount = 0;
		
		context.nanoMagicPrograms = actor.system.magic.nanoMagicPrograms;
		context.actor.system.magic = actor.system.magic;
	}

    static async _onRollNanoMagic(actor, event, target)
    {
        const effectId = target.dataset.id;
		const program = actor.system.magic.nanoMagicPrograms.find(p => p.id === effectId);
		if (!program)
			return;

        const nanoPoints =  program.points;
		const effectPoints = program.effectPoints;
        const spellDC =  program.programDC;
        const failureTolerance = target.dataset.failureTolerance;
        const memoryProtection = target.dataset.memoryProtection;
        const advantage =  program.productionReady;
		const advantageTooltip = (advantage ? game.i18n.localize("SHADOWDARK.dialog.tooltip.production_ready") : "");

        const magicType = "nano-magic";
        const magicCoreLevel = await actor.magicCoreLevel(magicType);
		NanoMagicSD.calculateEffectDamage(program);
        const effect = actor.system.magic.nanoMagicPrograms.find(p => p.id === effectId);

        const options = {
            magicCoreLevel,
            magicType,
            effectPoints,
            nanoPoints,
            spellDC,
            effect,
            memoryProtection,
            advantage,
			advantageTooltip,
            failureTolerance,
			damage: program.damage,
        };
        options.target = spellDC;
        options.spellName = program.name;
		options.callback = this._rollNanoMagicCallback;

        await actor.rollMagic(magicCoreLevel, options, effect);
    }

	static async calculateEffectDamage(program) {
		if (program.effect in nanoEffectsEffects && nanoEffectsEffects[program.effect].key === 'damage')
		{
			if (typeof nanoEffectsEffects[program.effect].damage === 'string' && nanoEffectsEffects[program.effect].damage.includes('d'))
			{
				var damageParts = nanoEffectsEffects[program.effect].damage.split("d");
				damageParts[0] = parseInt(damageParts[0]) + nanoEffectsEffects[program.effect].damagePerIncrease * program.increases;
				program.damage = damageParts.join("d");
			}
			else
 				program.damage = nanoEffectsEffects[program.effect].damage + nanoEffectsEffects[program.effect].damagePerIncrease * program.increases;

			program.damage_type = nanoEffectsEffects[program.effect].damageType;
		}
		else
		{
			program.damage = null;
			program.damage_type = null;
		}
	}

	static async _rollNanoMagicCallback(result) {
		if (!result || !result?.rolls || !result?.rolls?.main)
			return;

		var actor = result.actor;
		var power = result.power;
		
		const resultMargin = result.rolls.main.roll._total - result.spellDC;

		if (resultMargin >= 0)
		{
			let cost = result.nanoPoints;
			if (result?.rolls?.main?.critical === "success")
				cost = 1;

			await NanoMagicSD.activatePower(actor, power, cost);
		}
		else
		{
			var failureMargin = -resultMargin;
			if (failureMargin > result.failureTolerance || result?.rolls?.main?.critical === "failure")
			{
				power.lost = true;
				actor.update({"system.magic.nanoMagicPrograms": actor.system.magic.nanoMagicPrograms});
			}
			
			if (result?.rolls?.main?.critical === "failure")
			{
				var hpToLose = result.nanoPoints - result.memoryProtection;
				if (hpToLose < 0) hpToLose = 0;
				actor.system.attributes.hp.value -= hpToLose;
				if (actor.system.attributes.hp.value < 0)
					actor.system.attributes.hp.value = 0;
				actor.update({"system.attributes.hp.value": actor.system.attributes.hp.value});
			}
		}
	}

	static async activatePower(actor, power, cost) {
		if (power.type === 'internal' || power.duration !== '1-turn')
		{
			let program = actor.system.magic.nanoMagicPrograms.find(p => p.id === power.id);
			let powerIndex = actor.system.magic.nanoMagicPrograms.indexOf(program)

			if (power.effect in nanoEffectsEffects)
				await NanoMagicSD.addActiveEffect(actor, program, powerIndex);

			actor.system.magic.nanoPoints.value -= cost;
			if (actor.system.magic.nanoPoints.value < 0)
				actor.system.magic.nanoPoints.value = 0;

			actor.system.magic.nanoMagicPrograms[powerIndex].active = true;
			actor.update({"system.magic.nanoMagicPrograms": actor.system.magic.nanoMagicPrograms});
			actor.update({"system.magic.nanoPoints.value": actor.system.magic.nanoPoints.value});
		}
	}

	static async addActiveEffect(actor, program, powerIndex) {
		let effectName = UtilitySD.camelToTitleCase(program.effect);
		let effectKey = nanoEffectsEffects[program.effect].key;
		let effectValue = program.increases + 1;

		if (effectKey.includes("("))
		{
			const match = effectKey.match(/\(([^)]+)\)/);

			effectValue = match[1];
  			effectKey = effectKey.replace(match[0], "").trim();
		}

		if (effectKey.includes("system.bonuses"))
		{
			const effectData = [
				{
					name: effectName,
					label: effectName,
					img: nanoEffectsEffects[program.effect].img,
					changes: [{	key: effectKey, 
								mode: 2,
								value: effectValue}],
					disabled: false,
					origin: actor.uuid,
					transfer: true,
					description: program.effectDescription
				},
			];

			const [newActiveEffect] = await actor.createEmbeddedDocuments(
				"ActiveEffect",
				effectData
			);

			actor.system.magic.nanoMagicPrograms[powerIndex].effectId = newActiveEffect._id;
		}
	}

	static async removeActiveEffect(actor, program) {
		try {
			await actor.deleteEmbeddedDocuments(
				"ActiveEffect",
				[program.effectId]
			);
		}
		catch(err) {
		}
	}

	static hasNanoTalent(actor, talent) {
		for (var nanoTalent of context.knownNanoMagicTalents ?? [])
		{
			if (!nanoTalent?.effects)
				continue;
			
			for (var nanoTalentEffect of nanoTalent.effects)
			{
				if (!nanoTalentEffect?.changes)
					continue;
				
				for (var nanoTalentEffectChanges of nanoTalentEffect.changes)
				{
					if (nanoTalentEffectChanges.key === talent)
						return true;
				}
			}
		}
	}

    static async _updateNanoPoints(actor, event) {
        if (event.target.name === "system.magic.nanoPoints.value") {
            actor.system.magic.nanoPoints.value = event.target.value;
            return true;
        }
    }

    static async _updateMagic(actor, event, target)
	{
        if (event.target.name === "program.effect" ||
            event.target.name === "program.drawback" ||
            event.target.name === "program.duration" ||
            event.target.name === "program.type" ||
            event.target.name === "program.nanoPoints" ||
            event.target.name === "program.effect.nanoPoints")
        {
            const programId = target.dataset.id;
            const propertyName = event.target.name;
            const propertyValue = event.target.value;

            const durationReduction = target.dataset.durationReduction;

            var program = actor.system.magic.nanoMagicPrograms.find(p => p.id === programId);
            if (!program)
                return;
            
            if (propertyName === "program.nanoPoints")
                program.points = propertyValue;
            
            if (propertyName === "program.effect.nanoPoints")
                program.effectPoints = propertyValue;

            if (propertyName === "program.effect")
                program.effect = propertyValue;
            
            if (propertyName === "program.drawback")
                program.drawback = propertyValue;
            
            if (propertyName === "program.duration")
                program.duration = propertyValue;
            
            if (propertyName === "program.type")
                program.type = propertyValue;
            
            await shadowdark.sheets.NanoMagicProgramSD.calculateEffectNanoPoints(program, durationReduction);
            return true;
        }
        return false;
	}

	static async _onResetCoreDump(actor, actorSheet)
	{
		for (var i = 0; i < actor.system.magic.nanoMagicPrograms.length; i++)
		{
			actor.system.magic.nanoMagicPrograms[i].lost = false;
		}
		actor.update({"system.magic.nanoMagicPrograms": actor.system.magic.nanoMagicPrograms});
		actorSheet.render();
	}
	
	static async _onOptimizeProgram(actor, event, actorSheet, target)
	{
		const effectId = target.dataset.id;
		const durationReduction = target.dataset.durationReduction;
		const program = actor.system.magic.nanoMagicPrograms.find(p => p.id === effectId);
		program.optimized = !program.optimized;
		await shadowdark.sheets.NanoMagicProgramSD.calculateEffectNanoPoints(program, durationReduction);
		actor.update({"system.magic.nanoMagicPrograms": actor.system.magic.nanoMagicPrograms});
		actorSheet.render();
	}
	
	static async _onProductionReadyProgram(actor, event, actorSheet, target)
	{
		const effectId = target.dataset.id;
		const program = actor.system.magic.nanoMagicPrograms.find(p => p.id === effectId);
		program.productionReady = !program.productionReady;
		actor.update({"system.magic.nanoMagicPrograms": actor.system.magic.nanoMagicPrograms});
		actorSheet.render();
	}

	static async _onCreateNanoProgram(event, actor, sheet, target) {
		const durationReduction = target.dataset.durationReduction;

		var newProgram = {
			id: UtilitySD.generateUUID(),
			name: "New Program",
			type: "internal",
			duration: "1-turn",
			drawback: "noDrawback",
			effect: "cardiacSupport",
			effectDescription: "Cardiac Support: Increases CON by 1 (up to 20).",
			lastInternalEffect: "cardiacSupport",
			lastExternalEffect: "targetAnalyzer",
	        description: "",
			lost: false,
        	production_ready: false,
        	optimized: false,
			programDC: 10,
			points: 1,
			effectLevels: 1,
			durationReduction: durationReduction
		};
		actor.system.magic.nanoMagicPrograms.push(newProgram);
		actor.update({"system.magic.nanoMagicPrograms": actor.system.magic.nanoMagicPrograms});
		var newProgramIndex = actor.system.magic.nanoMagicPrograms.indexOf(newProgram);

		var programSheet = new shadowdark.sheets.NanoMagicProgramSD({program: newProgram, sheet: sheet, index: newProgramIndex});
		programSheet.render(true);
	}

	static async _updateNanoProgram(actor, program, index) {
		if (!(actor.system?.magic?.nanoMagicPrograms))
			return;

		actor.system.magic.nanoMagicPrograms[index] = program;
		actor.update({"system.magic.nanoMagicPrograms": actor.system.magic.nanoMagicPrograms});
	}

	static async _onEditNanoProgram(event, actor, sheet, target) {
		const programId = target.dataset.id;

		if (!(actor.system?.magic?.nanoMagicPrograms))
			return;

		var existingProgram = actor.system.magic.nanoMagicPrograms.find(p => p.id === programId);
		if (!existingProgram)
			return;

		var programIndex = actor.system.magic.nanoMagicPrograms.indexOf(existingProgram);

		var programSheet = new shadowdark.sheets.NanoMagicProgramSD({program: existingProgram, sheet: sheet, index: programIndex});
		programSheet.render(true);
	}

	static async _onDeleteNanoProgram(event, actor, sheet, target) {
		const programId = target.dataset.id;

		if (!(actor.system?.magic?.nanoMagicPrograms))
			return;

		var existingProgram = actor.system.magic.nanoMagicPrograms.find(p => p.id === programId);
		if (!existingProgram)
			return;

		var programIndex = actor.system.magic.nanoMagicPrograms.indexOf(existingProgram);
		actor.system.magic.nanoMagicPrograms.splice(programIndex, 1);
		actor.update({"system.magic.nanoMagicPrograms": actor.system.magic.nanoMagicPrograms});
		sheet.render(true);
	}

	static async _onCancelNanoProgram(event, actor, sheet, target) {
		const programId = target.dataset.id;

		if (!(actor.system?.magic?.nanoMagicPrograms))
			return;

		var existingProgram = actor.system.magic.nanoMagicPrograms.find(p => p.id === programId);
		if (!existingProgram)
			return;

		let powerIndex = actor.system.magic.nanoMagicPrograms.indexOf(existingProgram)

		if (existingProgram.effect in nanoEffectsEffects)
			await NanoMagicSD.removeActiveEffect(actor, existingProgram);

		actor.system.magic.nanoPoints.value += existingProgram.points;
		if (actor.system.magic.nanoPoints.value > actor.level)
			actor.system.magic.nanoPoints.value = actor.level;

		actor.system.magic.nanoMagicPrograms[powerIndex].active = false;
		actor.update({"system.magic.nanoPoints.value": actor.system.magic.nanoPoints.value});
		actor.update({"system.magic.nanoMagicPrograms": actor.system.magic.nanoMagicPrograms});
		sheet.render(true);
	}

	static async _onResetNanoProgram(event, actor, sheet, target) {
		const programId = target.dataset.id;

		if (!(actor.system?.magic?.nanoMagicPrograms))
			return;

		var existingProgram = actor.system.magic.nanoMagicPrograms.find(p => p.id === programId);
		if (!existingProgram)
			return;

		existingProgram.lost = false;
		actor.update({"system.magic.nanoMagicPrograms": actor.system.magic.nanoMagicPrograms});
		sheet.render(true);
	}

	static async _localizeProgram(actor, index) {
		actor.system.magic.nanoMagicPrograms[index].localizedType = game.i18n.localize(CONFIG.SHADOWDARK.NANO_MAGIC_TYPES[actor.system.magic.nanoMagicPrograms[index].type]);
		if (actor.system.magic.nanoMagicPrograms[index].type === 'internal')
		{
			actor.system.magic.nanoMagicPrograms[index].localizedEffect = game.i18n.localize(CONFIG.SHADOWDARK.NANO_MAGIC_INTERNAL_EFFECTS[actor.system.magic.nanoMagicPrograms[index].effect]);
			actor.system.magic.nanoMagicPrograms[index].localizedDuration = "";
			actor.system.magic.nanoMagicPrograms[index].localizedDrawback = game.i18n.localize(CONFIG.SHADOWDARK.NANO_MAGIC_INTERNAL_DRAWBACKS[actor.system.magic.nanoMagicPrograms[index].drawback]);
		}
		else
		{
			actor.system.magic.nanoMagicPrograms[index].localizedEffect = game.i18n.localize(CONFIG.SHADOWDARK.NANO_MAGIC_EXTERNAL_EFFECTS[actor.system.magic.nanoMagicPrograms[index].effect]);
			actor.system.magic.nanoMagicPrograms[index].localizedDuration = game.i18n.localize(CONFIG.SHADOWDARK.NANO_MAGIC_DURATIONS[actor.system.magic.nanoMagicPrograms[index].duration]);
			actor.system.magic.nanoMagicPrograms[index].localizedDrawback = game.i18n.localize(CONFIG.SHADOWDARK.NANO_MAGIC_EXTERNAL_DRAWBACKS[actor.system.magic.nanoMagicPrograms[index].drawback]);
		}
	}
}