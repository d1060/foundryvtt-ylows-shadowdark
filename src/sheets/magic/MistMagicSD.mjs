export default class MistMagicSD {

	static async _prepareMistMagic(actor, context) {
		 if (actor.system.magic.type === "mistMagic")
		 	context.showMistMagic = true;
		 else
		 	return;
		
		if (!actor.system.magic?.corruption)
		{
			actor.system.magic.corruption = {
				value: 0,
				remaining: context.magicCoreLevel,
				str: 0,
				dex: 0,
				con: 0,
			}
		}

        const strCorruption = parseInt(actor.system.magic.corruption.str == null ? 0 : actor.system.magic.corruption.str);
        const dexCorruption = parseInt(actor.system.magic.corruption.dex == null ? 0 : actor.system.magic.corruption.dex);
        const conCorruption = parseInt(actor.system.magic.corruption.con == null ? 0 : actor.system.magic.corruption.con);
		
		actor.system.magic.corruption.value = -(strCorruption + dexCorruption + conCorruption);
		actor.system.magic.corruption.remaining = context.magicCoreLevel - actor.system.magic.corruption.value;
		if (actor.system.magic.corruption.remaining < 0) actor.system.magic.corruption.remaining = 0;
		
		context.remainingStr = -strCorruption + actor.system.magic.corruption.remaining;
		context.remainingDex = -dexCorruption + actor.system.magic.corruption.remaining;
		context.remainingCon = -conCorruption + actor.system.magic.corruption.remaining;
		
		context.mistMagicPowers = [];
		var allMistMagicPowers = await shadowdark.compendiums.mistMagicPowers();
		
		for (var power of allMistMagicPowers)
		{
			if (power.system.powerLevel > actor.system.magic.corruption.value)
				continue;

			if (!this.isPowerAvailable(power, context.mistMagicPowers))
				continue;
			
			context.mistMagicPowers.push(await fromUuid(power.uuid));
		}
		
		context.hasSelectedAtLeastOneMistMagicPower = context.mistMagicPowers.length > 0;
		actor.system.magic.mistMagicPowers = context.mistMagicPowers;
		context.system.magic = actor.system.magic;
	}

	static isPowerAvailable(power, knownPowers) {
		if (!power.system.requirements)
			return true;

		if (power.system.requirements.length <= 0)
			return true;
		
		for (var requirement of power.system.requirements)
		{
			if (knownPowers.some(p => p.name.slugify() === requirement.name.slugify()))
				continue;
			
			return false;
		}
		
		return true;
	}

    static async _onChangeMistCorruption(actor, event, target) {
        const attribute = target.dataset.attribute;
        
        switch (attribute)
        {
            case "str":
                actor.system.magic.corruption.str = parseInt(event.target.value);
            break;
            case "dex":
                actor.system.magic.corruption.dex = parseInt(event.target.value);
            break;
            case "con":
                actor.system.magic.corruption.con = parseInt(event.target.value);
            break;
        }
    }
    
    static async _onRollMistPower(actor, event, target) {
        const powerId = target.dataset.id;
        const magicCoreLevel = parseInt(target.dataset.corruption);
        const power = actor.system.magic.mistMagicPowers.find(p => p._id === powerId);
        
        if (!power) return;
        
        const powerLevel = parseInt(power.system.powerLevel);
        var excessPower = magicCoreLevel - powerLevel;
        const powerResistedBy = power.system.resistedBy;
        var duration = power.system.duration;
        var damage = power.system.damage;
        const magicType = "mist-magic";
        if (excessPower < 0) excessPower = 0;
        
        var spellDC = 9 + magicCoreLevel;
        const spellName = power.name;
        
        if (excessPower > 0)
        {
            damage = shadowdark.dice.RollMagicSD.increasePowerDamage(power, excessPower);
            duration = shadowdark.dice.RollMagicSD.increasePowerDuration(power, excessPower);
        }
        
        const options = {
            powerId,
            spellName,
            powerLevel,
            magicType,
            magicCoreLevel,
            damage,
            duration,
        };
        
        options.effectiveLevel = String(magicCoreLevel);

        if (options.duration.includes("-"))
        {
            var durationParts = options.duration.split("-");
            options.duration_amount = game.i18n.localize("SHADOWDARK.duration_"+durationParts[0]);
            options.duration_desc = game.i18n.localize("SHADOWDARK.duration_"+durationParts[1] + (parseInt(durationParts[0]) > 1 ? "s" : ""));
        }
        else
        {
            options.duration_amount = "";
            options.duration_desc = game.i18n.localize("SHADOWDARK.duration_"+options.duration);
        }

        options.target = spellDC;
		options.callback = this._rollMistMagicCallback;
        
        await actor.rollMagic(magicCoreLevel, options, power);
    }

    static async _rollMistMagicCallback(result) {
		if (!result || !result?.rolls || !result?.rolls?.main)
			return;

		var actor = result.actor;
		var power = result.power;
		
		const resultMargin = result.rolls.main.roll._total - result.spellDC;

        //shadowdark.debug(`ActorSD _rollMagicCallback for Mist-Magic. Result by ${resultMargin}.`);
        if (resultMargin < 0)
        {
            var hp = actor.system.attributes.hp.value;
            hp -= result.magicCoreLevel;
            actor.system.attributes.hp.value = hp;
            actor.update({"system.attributes.hp.value": hp});
        }
    }

    static async applyMistTaintToActor(actor)
    {
        const abilityIndex = Math.floor(Math.random() * 6);
        const ability = CONFIG.SHADOWDARK.ABILITY_KEYS[abilityIndex];

        if (await MistMagicSD.isActorTainted(actor, ability))
            return await MistMagicSD.worsenTaint(actor, ability);

        let abilityIcon = 'icons/magic/death/skull-flames-white-blue.webp';
        switch (ability)
        {
            case 'str':
                abilityIcon = 'icons/magic/death/hand-undead-skeleton-fire-green.webp';
                break;
            case 'dex':
                abilityIcon = 'icons/magic/unholy/strike-body-explode-disintegrate.webp';
                break;
            case 'cha':
                abilityIcon = 'icons/magic/death/undead-skeleton-lich-armor.webp';
                break;
            case 'con':
                abilityIcon = 'icons/magic/death/blood-corruption-vomit-red.webp';
                break;
            case 'wis':
                abilityIcon = 'icons/magic/perception/silhouette-stealth-shadow.webp';
                break;
        }

        const taintEffectData =  {
            name: ability.toUpperCase() + " Tainted",
            label: ability.toUpperCase() + " Tainted",
            img: abilityIcon,
            changes: [{	key: "system.abilities." + ability + ".base", 
                        mode: 2,
                        value: -1
                    }],
            disabled: false,
            transfer: true,
            sourceName: 'Mistdark',
            system: { origin: 'Mistdark' },
            description: "You are tainted by the mistdark and now suffer a penalty to " + ability.toUpperCase(),
        };

        const [newEffect] = await actor.createEmbeddedDocuments("ActiveEffect", [taintEffectData]);
        return;
    }

    static async isActorTainted(actor, ability) {
        const activeEffects = await actor.getEmbeddedCollection("ActiveEffect");
        if (!activeEffects) return;
        return activeEffects.contents.some(e => e.name === ability.toUpperCase() + " Tainted");
    }

    static async worsenTaint(actor, ability) {
        const activeEffects = await actor.getEmbeddedCollection("ActiveEffect");
        if (!activeEffects) return;
        const activeEffect = activeEffects.contents.find(e => e.name === ability.toUpperCase() + " Tainted");
        if (!activeEffect) return;
        let changes = activeEffect.changes.find(c => c.key === "system.abilities." + ability + ".base");
        changes.value--;
        await actor.updateEmbeddedDocuments("ActiveEffect", [
            {
                "_id": activeEffect._id,
                "changes": activeEffect.changes
            },
        ]);
    }
}