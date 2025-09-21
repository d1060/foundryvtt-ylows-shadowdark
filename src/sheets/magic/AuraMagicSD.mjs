export default class AuraMagicSD {

	static async _prepareAuraMagic(actor, context) {
		shadowdark.logTimestamp(`PlayerSheetSD _prepareAuraMagic Start.`);
		if (actor.system.magic.type === "auraMagic")
			context.showAuraMagic = true;
		else
			return;
		
		context.knownAuraMagicTalents = await actor.auraMagicTalents();
		shadowdark.logTimestamp(`PlayerSheetSD _prepareAuraMagic Got Talents.`);
		if (!actor.system.magic.auralCore)
			actor.system.magic.auralCore = { 
				value: context.magicCoreLevel,
				base: context.magicCoreLevel,
				lost: 0,
				effective: context.magicCoreLevel,
			};
		else
		{
			if (actor.system.magic.auralCore.value === null)
				actor.system.magic.auralCore.value = context.magicCoreLevel;
			actor.system.magic.auralCore.base = context.magicCoreLevel;
		}
		if (!actor.system.magic.auralCore.lost) actor.system.magic.auralCore.lost = 0;
		actor.system.magic.auralCore.effective = actor.system.magic.auralCore.base - actor.system.magic.auralCore.lost;

		if (actor.system.magic.auralCore.value > actor.system.magic.auralCore.effective)
			actor.system.magic.auralCore.value = actor.system.magic.auralCore.effective;
		if (actor.system.magic.auralCore.value < 0)
			actor.system.magic.auralCore.value = 0;
		
		var auraCorePenalty = await actor.auraCorePenalty();
		context.magicCoreLevel -= auraCorePenalty;
		shadowdark.logTimestamp(`PlayerSheetSD _prepareAuraMagic Got Penalty.`);
		
		context.auralPowerBonus = 0;
		context.magneticVigor = 0;
		context.heuristicCore = 0;
		context.redundantPatternways = 0;
		context.canChooseRedundantPatternways = false;
		
		for (var talent of context.knownAuraMagicTalents ?? [])
		{
			if (!talent?.effects)
				continue;
			
			for (var talentEffect of talent.effects)
			{
				if (!talentEffect?.changes)
					continue;
				
				for (var talentEffectChanges of talentEffect.changes)
				{
					if (talentEffectChanges.key === "system.bonuses.auralPowerBonus")
						context.auralPowerBonus += parseInt(talentEffectChanges.value);
					else if (talentEffectChanges.key === "system.bonuses.magneticVigor")
						context.magneticVigor += parseInt(talentEffectChanges.value);
					else if (talentEffectChanges.key === "system.bonuses.heuristicCore")
						context.heuristicCore += parseInt(talentEffectChanges.value);
					else if (talentEffectChanges.key === "system.bonuses.redundantPatternways")
					{
						context.redundantPatternways += parseInt(talentEffectChanges.value);
						context.canChooseRedundantPatternways = true;
					}
				}
			}
		}
		shadowdark.logTimestamp(`PlayerSheetSD _prepareAuraMagic Got Modifiers.`);
		
		context.magicCoreLevel += context.auralPowerBonus;
		
		var newAuraMagicEffects = await actor.getAuraMagicEffects();
		shadowdark.logTimestamp(`PlayerSheetSD _prepareAuraMagic Got Effects.`);

		if (actor?.system?.magic?.auraMagicEffects)
		{
			for (var effect of actor?.system?.magic?.auraMagicEffects)
			{
				if (effect.redundantPatternways)
				{
					var newEffect = newAuraMagicEffects.find(p => p._id === effect._id);
					newEffect.redundantPatternways = effect.redundantPatternways;
				}
			}
		}

		actor.system.magic.auraMagicEffects = newAuraMagicEffects;

		context.chosenRedundantPatternways = 0;

		for (var effect of actor.system.magic.auraMagicEffects)
		{
			if (effect.name.slugify() === "sense-magnetic-field" || effect.name.slugify() === "sense-magic")
				effect.corePowerWithBonus = context.magicCoreLevel + context.heuristicCore;
			
			if (context.magneticVigor > 0)
			{
				var newCost = effect.cost - context.magneticVigor;
				var durationDuplications = 1 - newCost;
				if (newCost <= 0)
				{
					newCost = 1;
					if (durationDuplications > 0 && effect.duration !== "Instant")
					{
						var durationParts = effect.duration.split(" ");
						var newDuration = UtilitySD.duplicateString(durationParts[0], durationDuplications);
						var newAssembledDuration = newDuration + " " + durationParts[1] + "s";
						effect.duration = newAssembledDuration;
					}
				}
				effect.cost = newCost;
			}
			
			if (effect.redundantPatternways)
			{
				context.chosenRedundantPatternways++;
			}
		}
		shadowdark.logTimestamp(`PlayerSheetSD _prepareAuraMagic Processed Effects.`);
		
		if (context.chosenRedundantPatternways >= context.redundantPatternways)
			context.redundantPatternways = 0;
		
		context.auraMagicEffects = actor?.system?.magic?.auraMagicEffects ?? [];
		context.actor.system.magic = actor.system.magic;
		context.auralPowerLost = actor.system.magic.auralCore.lost > 0;
		shadowdark.logTimestamp(`PlayerSheetSD _prepareAuraMagic End.`);
	}

	static async _onRollAuraMagic(actor, event, target)
	{
		const effectId = target.dataset.id;
		const magicCoreLevel = target.dataset.coreLevel;
		const advantage = target.dataset.advantage;
		const advantageTooltip = (advantage ? game.i18n.localize("SHADOWDARK.dialog.tooltip.redundant_patternways") : "");
		const cost = target.dataset.cost;
		const damage = target.dataset.damage;
		const magicType = "aura-magic";
		const failureTolerance = 0;
		const auraMagicEffect = actor.system.magic.auraMagicEffects.find(e => e._id === effectId);
		
		var spellDC = 9 + parseInt(auraMagicEffect.increasedPowerLevel);
		
		const options = {
			effectId,
			magicType,
			magicCoreLevel,
			cost,
			spellDC,
			damage,
			advantage,
			advantageTooltip,
			failureTolerance,
			description: auraMagicEffect.formattedDescription,
		};
		options.target = spellDC;
		options.power = auraMagicEffect;
		options.spellName = auraMagicEffect.name;
		options.callback = this._rollAuraMagicCallback;

		await actor.rollMagic(magicCoreLevel, options, auraMagicEffect);
	}
	
	static async _onResetAuralCore(actor, event, sheet, target)
	{
		var currentLostCores = actor.system.magic.auralCore.lost;
		actor.system.magic.auralCore.lost = 0;
		actor.update({"system.magic.auralCore.lost": actor.system.magic.auralCore.lost});

		actor.system.magic.auralCore.value += currentLostCores;
		if (actor.system.magic.auralCore.value > actor.system.magic.auralCore.base)
			actor.system.magic.auralCore.value = actor.system.magic.auralCore.base;
		actor.update({"system.magic.auralCore.value": actor.system.magic.auralCore.value});
		sheet.render();
	}
	
	static async _onRedundantPatternways(actor, event, sheet, target)
	{
		const effectId = target.dataset.id;
		const effect = actor.system.magic.auraMagicEffects.find(p => p._id === effectId);
		effect.redundantPatternways = !effect.redundantPatternways;
		await actor.update({"system.magic.auraMagicEffects": actor.system.magic.auraMagicEffects});
		sheet.render();
	}

	static async _rollAuraMagicCallback(result) {
		if (!result || !result?.rolls || !result?.rolls?.main)
			return;

		var actor = result.actor;
		var power = await fromUuid(result.power.uuid);
		
		const resultMargin = result.rolls.main.roll._total - result.spellDC;

		if (resultMargin >= 0)
		{
			if (result?.rolls?.main?.critical !== "success" && parseInt(result.cost) > 0)
			{
				var newHp = parseInt(actor.system.attributes.hp.value) - parseInt(result.cost);
				actor.updateHP(newHp);
				actor.update({"system.attributes.hp.value": actor.system.attributes.hp.value});
				actor.update({"system.attributes.hp.temp": actor.system.attributes.hp.temp});

				if (power)
				{
					let powerEffects = await power.getEmbeddedCollection("ActiveEffect");
					for (let powerEffect of powerEffects.contents) {
						let changes = structuredClone(powerEffect.changes);
						for (let change of changes) {
							let changeValueInt = parseInt(change.value);
							if (!Number.isNaN(changeValueInt)) {
								if (power.system.damage) {
									let excessPower = 0;
									if (result.power.effectiveLevel) {
										excessPower = result.power.effectiveLevel - parseInt(power.system.powerLevel);
									}
									let newDamage = shadowdark.dice.RollMagicSD.increasePowerDamage(power, excessPower);
									let newDamageInt = parseInt(newDamage);
									if (!Number.isNaN(newDamageInt)) {
										change.value = newDamageInt;
									}
								}
							}
						}

						const newEffectData =  {
							name: powerEffect.name,
							label: powerEffect.name,
							img: powerEffect.img,
							changes: changes,
							disabled: false,
							transfer: true,
							sourceName: 'AuraMagic',
							system: { origin: 'AuraMagic' },
							description: power.system?.description,
						};

						const [newEffect] = await actor.createEmbeddedDocuments("ActiveEffect", [newEffectData]);
					}
				}
			}
		}
		else
		{
			var failureMargin = -resultMargin;
			if (failureMargin > result.failureTolerance || result?.rolls?.main?.critical === "failure")
			{
				if (actor.system.magic.auralCore)
					actor.system.magic.auralCore.lost += 1;
				else
					actor.system.magic.auralCore.lost = 1;
				
				actor.system.magic.auralCore.value = actor.system.magic.auralCore.value - 1;
				actor.update({"system.magic.auralCore.lost": actor.system.magic.auralCore.lost});
				actor.update({"system.magic.auralCore.value": actor.system.magic.auralCore.value});
			}
			
			if (result?.rolls?.main?.critical === "failure")
			{
				var newHp = actor.system.attributes.hp.value - result.cost;
				actor.updateHP(newHp);
				actor.update({"system.attributes.hp.value": actor.system.attributes.hp.value});
				actor.update({"system.attributes.hp.temp": actor.system.attributes.hp.temp});
			}
		}
	}

	static async getResistedAcBySpell(power, actorAc, isMetallic, metallicPart) {
		if (!power || !power.system) return actorAc;
		if (power.system.resistedBy === 'ac' && power.system.resistance_penalty_metallic) {
			return isMetallic ? actorAc - metallicPart : actorAc;
		}
		return actorAc;
	}
}
