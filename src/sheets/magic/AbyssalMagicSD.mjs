export default class AbyssalMagicSD {

	static tentacles = [ '/systems/shadowdark/assets/icons/seirizia/tentacle_1.png', '/systems/shadowdark/assets/icons/seirizia/tentacle_2.png', '/systems/shadowdark/assets/icons/seirizia/tentacle_3.png', '/systems/shadowdark/assets/icons/seirizia/tentacle_4.png', '/systems/shadowdark/assets/icons/seirizia/tentacle_5.png', '/systems/shadowdark/assets/icons/seirizia/tentacle_6.png', '/systems/shadowdark/assets/icons/seirizia/tentacle_7.png', '/systems/shadowdark/assets/icons/seirizia/tentacle_8.png', '/systems/shadowdark/assets/icons/seirizia/tentacle_9.png', '/systems/shadowdark/assets/icons/seirizia/tentacle_10.png' ];

	static async addEventListeners(sheet) {
		if (sheet.actor.system.magic.type !== "abyssalMagic")
			return;

		const images = sheet.element.querySelectorAll(".abyssal-power");
		const images2 = sheet.element.querySelectorAll(".abyssal-power-2");
		sheet.amImages = [];
		let idx = 0;
		for (const image of images)
		{
			const image2 = images2[idx++];
			const imageObj = {image: image, image2: image2, intervalId: null, index: 0};

			imageObj.image2.addEventListener("mouseenter", () => {
				setTimeout(() => {
					imageObj.image.src = AbyssalMagicSD.tentacles[Math.floor(Math.random() * 10)];
					imageObj.image.style.opacity = 1;
					imageObj.image2.style.opacity = 0;
				}, 1000); 

				imageObj.intervalId = setInterval(() => {
					imageObj.index = (imageObj.index + 1) % AbyssalMagicSD.tentacles.length;

					imageObj.image.style.opacity = 0;
					imageObj.image2.src = AbyssalMagicSD.tentacles[Math.floor(Math.random() * 10)];
					imageObj.image2.style.opacity = 1;

					setTimeout(() => {
						imageObj.image.src = AbyssalMagicSD.tentacles[Math.floor(Math.random() * 10)];
						imageObj.image.style.opacity = 1;
						imageObj.image2.style.opacity = 0;
					}, 1000); 
    			}, 2000);
			});

			imageObj.image2.addEventListener("mouseleave", () => {
				clearInterval(imageObj.intervalId);
				imageObj.intervalId = null;
				imageObj.image.style.opacity = 0.5;
				imageObj.image2.style.opacity = 0;

				setTimeout(() => {
					imageObj.image.style.opacity = 0;
					imageObj.image2.style.opacity = 0.5;
				}, 1000);
			});

			sheet.amImages.push(imageObj);
		}
	}

	static async _prepareAbyssalMagic(actor, context) {
		if (actor.system.magic.type === "abyssalMagic")
			context.showAbyssalMagic = true;
		else
			return;
		
		if (!actor.system.magic.disturbance)
		{
			actor.system.magic.disturbance = {
				value: 0,
				remaining: context.magicCoreLevel,
				int: 0,
				wis: 0,
				cha: 0,
			}
		}
		
        const intDisturbance = parseInt(actor.system.magic.disturbance.int == null ? 0 : actor.system.magic.disturbance.int);
        const wisDisturbance = parseInt(actor.system.magic.disturbance.wis == null ? 0 : actor.system.magic.disturbance.wis);
        const chaDisturbance = parseInt(actor.system.magic.disturbance.cha == null ? 0 : actor.system.magic.disturbance.cha);

		actor.system.magic.disturbance.value = -(intDisturbance + wisDisturbance + chaDisturbance);
		actor.system.magic.disturbance.remaining = context.magicCoreLevel - actor.system.magic.disturbance.value;
		if (actor.system.magic.disturbance.remaining < 0) actor.system.magic.disturbance.remaining = 0;
		var wisModifierIfPositive = actor.baseAbilityModifier("wis");
		if (wisModifierIfPositive < 0) wisModifierIfPositive = 0;
		
		context.remainingInt = -intDisturbance + actor.system.magic.disturbance.remaining;
		context.remainingWis = -wisDisturbance + actor.system.magic.disturbance.remaining;
		context.remainingCha = -chaDisturbance + actor.system.magic.disturbance.remaining;
		
		context.abyssalMagicPowers = await actor.abyssalMagicPowers();
		var allAbyssalMagicPowers = await shadowdark.compendiums.abyssalMagicPowers();
		context.unknownAbyssalMagicPowers = [];
		context.knownAbyssalMagicPowersCount = context.abyssalMagicPowers.length;
		context.abyssalPowerLost = false;
		
		for (var power of allAbyssalMagicPowers)
		{
			if (power.system.powerLevel > actor.system.magic.disturbance.value)
				continue;
			
			if (!this.isPowerAvailable(power, context.abyssalMagicPowers))
				continue;
			
			var knownPower = context.abyssalMagicPowers.find(p => p && p.name.slugify() === power.name.slugify());
			if (!knownPower)
				context.unknownAbyssalMagicPowers.push(await fromUuid(power.uuid));
			else
			{
				if (power.system.allowMultipleChoice)
					knownPower.allowMultipleChoice = true;
				
				if (knownPower.quantity && knownPower.quantity > 1)
					context.knownAbyssalMagicPowersCount += knownPower.quantity - 1;
				else if (power.system.allowMultipleChoice)
					knownPower.quantity = 1;
				
				knownPower.nameId = knownPower.name.slugify();
				if (knownPower.lost)
					context.abyssalPowerLost = true;
			}
		}

		for (var unknownPower of context.unknownAbyssalMagicPowers ?? [])
		{
			unknownPower.randomizedImage = AbyssalMagicSD.tentacles[Math.floor(Math.random() * 10)];
			unknownPower.randomizedImage2 = AbyssalMagicSD.tentacles[Math.floor(Math.random() * 10)];
		}
		for (var knownPower of context.abyssalMagicPowers ?? [])
		{
			knownPower.randomizedImage = AbyssalMagicSD.tentacles[Math.floor(Math.random() * 10)];
			knownPower.randomizedImage2 = AbyssalMagicSD.tentacles[Math.floor(Math.random() * 10)];
		}
		
		if (context.knownAbyssalMagicPowersCount < actor.system.magic.disturbance.value + wisModifierIfPositive && context.unknownAbyssalMagicPowers.length > 0)
			context.allowsAbyssalPowerSelection = true;
		else
			context.allowsAbyssalPowerSelection = false;
		
		context.hasSelectedAtLeastOneAbyssalMagicPower = context.knownAbyssalMagicPowersCount > 0;
		
		actor.system.magic.abyssalMagicPowers = context.abyssalMagicPowers;
		actor.system.magic.unknownAbyssalMagicPowers = context.unknownAbyssalMagicPowers;
		
		context.system.magic = actor.system.magic;
	}

	static async _onSelectAbyssalPower(actor, event, target) {
		if (!actor.system?.magic?.unknownAbyssalMagicPowers)
			return;

		const powerId = target.dataset.id;
		const power = actor.system?.magic?.unknownAbyssalMagicPowers?.find(p => p && p.id === powerId);
		if (power)
		{
			var compendiumPower = await fromUuid(power.uuid);
			var index = actor.system.magic.unknownAbyssalMagicPowers.indexOf(power);
			actor.system.magic.unknownAbyssalMagicPowers.splice(index,1);
			actor.system.magic.abyssalMagicPowers.push(power);
			
			actor.update({"system.magic.unknownAbyssalMagicPowers": actor.system.magic.unknownAbyssalMagicPowers});
			actor.update({"system.magic.abyssalMagicPowers": actor.system.magic.abyssalMagicPowers});
		}
	}
	
	static async _onRemoveAbyssalPower(actor, event, target) {
		if (!actor.system?.magic?.abyssalMagicPowers)
			return;

		const powerId = target.dataset.id;
		const power = actor.system?.magic?.abyssalMagicPowers?.find(p => p && p._id === powerId);
		if (power)
		{
			var index = actor.system.magic.abyssalMagicPowers.indexOf(power);
			actor.system.magic.abyssalMagicPowers.splice(index,1);
			actor.system.magic.unknownAbyssalMagicPowers.push(power);

			actor.update({"system.magic.unknownAbyssalMagicPowers": actor.system.magic.unknownAbyssalMagicPowers});
			actor.update({"system.magic.abyssalMagicPowers": actor.system.magic.abyssalMagicPowers});
		}
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

	static async _onRollAbyssalPower(actor, event, target) {
		const powerId = target.dataset.id;
		const magicCoreLevel = target.dataset.disturbance;
		const power = actor.system.magic.abyssalMagicPowers.find(p => p._id === powerId);
		
		if (!power) return;
		
		const powerLevel = power.system.powerLevel;
		var excessPower = magicCoreLevel - powerLevel;
		const powerResistedBy = power.system.resistedBy;
		var duration = power.system.duration;
		var damage = power.system.damage;
		const magicType = "abyssal-magic";
		if (excessPower < 0) excessPower = 0;
		
		var spellDC = 10;
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
		options.callback = this._rollAbyssalMagicCallback;
		
		await actor.rollMagic(magicCoreLevel, options, power);
	}

	static async _rollAbyssalMagicCallback(result) {
		if (!result || !result?.rolls || !result?.rolls?.main)
			return;

		var actor = result.actor;
		var power = result.power;
		
		const resultMargin = result.rolls.main.roll._total - result.target;

		if (resultMargin < 0)
		{
			power.lost = true;
			actor.update({"system.magic.abyssalMagicPowers": actor.system.magic.abyssalMagicPowers});
		}
	}

	static async _onRecoverAbyssalPower(actor, event, target) {
		const powerId = target.dataset.id;
		const power = actor.system.magic.abyssalMagicPowers.find(p => p._id === powerId);
		if (!power) return;
		power.lost = false;
		actor.update({"system.magic.abyssalMagicPowers": actor.system.magic.abyssalMagicPowers});
	}

	static async _onClearAbyssalPowers(actor, event) {
		for (var i = 0; i < actor.system.magic.abyssalMagicPowers.length; i++)
		{
			actor.system.magic.abyssalMagicPowers[i].lost = false;
		}
		actor.update({"system.magic.abyssalMagicPowers": actor.system.magic.abyssalMagicPowers});
	}
}