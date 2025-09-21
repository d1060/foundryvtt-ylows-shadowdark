import CompendiumsSD from "../../documents/CompendiumsSD.mjs";

export default class MetalMagicSD {

	static async _prepareMetalMagic(actor, context) {
		if (actor.system.magic.type === "metalMagic")
			context.showMetalMagic = true;
		else
			return;
		
		context.knownMetalMagicTalents = await actor.metalMagicTalents();
		context.metalMagicPowers = await actor.metalMagicPowers();
		context.allMetalMagicPowers = await shadowdark.compendiums.metalMagicPowers();
		context.unknownMetalMagicPowers = [];
		context.knownMetalMagicPowersCount = context.metalMagicPowers.length;
		context.metalMagicAltToken = actor.system.magic?.metalCore?.altToken ?? CONST.DEFAULT_TOKEN;
		
		var effectiveMetalCore = context.magicCoreLevel;
		for (var talent of context.knownMetalMagicTalents)
		{
			for (var effect of talent.effects)
			{
				for (var change of effect.changes)
				{
					if (change.key === "system.bonuses.metalMagicMastery")
						effectiveMetalCore += parseInt(change.value);
				}
			}
		}
		
		if (!actor.system.magic.metalCore)
		{
			actor.system.magic.metalCore = {
				base: context.magicCoreLevel,
				value: context.magicCoreLevel,
				hp: {
					base: 0,
					value: 0,
				}
			}
		}
		if (!actor.system.magic.metalCore.base || actor.system.magic.metalCore.base != context.magicCoreLevel)
			actor.system.magic.metalCore.base = context.magicCoreLevel;
		if (!actor.system.magic.metalCore.value)
			actor.system.magic.metalCore.value = context.magicCoreLevel;
		if (!actor.system.magic.metalCore.hp)
			actor.system.magic.metalCore.hp = { base: 0, value: 0, };
		
		if (actor.system.magic.metalCore.hp.base <= 0)
		{
			for (var i = 0; i < context.magicCoreLevel; i++)
			{
				var hpRollMode = game.settings.get("shadowdark", "useFixedHP");
				if (hpRollMode === 0)
				{
					let parts = ["1d8"];
					const data = {
						rollType: "metalCoreHp",
						actor: actor,
					};
					let options = {
						fastForward: true,
					};
					let advantage = 0;
					const result = await CONFIG.DiceSD.Roll(parts, data, false, advantage, options);
					
					actor.system.magic.metalCore.hp.base += result.rolls.main.roll.total;
					actor.system.magic.metalCore.hp.value += result.rolls.main.roll.total;
				}
				else
				{
					if (i === 0)
					{
						actor.system.magic.metalCore.hp.base += 8;
						actor.system.magic.metalCore.hp.value += 8;
					}
					else
					{
						var hpIncrease = 0;
						switch (hpRollMode)
						{
							case 1: // Full HP
								hpIncrease += 8;
							break;
							case 2: // 75% HP
								hpIncrease += (8 + 1) * 0.75;
							break;
							case 3: // Half HP
								hpIncrease += (8 + 1) * 0.5;
							break;
						}
						actor.system.magic.metalCore.hp.base += hpIncrease;
						actor.system.magic.metalCore.hp.value += hpIncrease;
					}
				}
			}
			actor.system.magic.metalCore.hp.base = Math.floor(actor.system.magic.metalCore.hp.base);
			actor.system.magic.metalCore.hp.value = Math.floor(actor.system.magic.metalCore.hp.value);

			await actor.update({
				"system.magic.metalCore.hp.base": actor.system.magic.metalCore.hp.base,
				"system.magic.metalCore.hp.value": actor.system.magic.metalCore.hp.value,
			});
		}
		
		for (var power of context.allMetalMagicPowers)
		{
			var knownPower = context.metalMagicPowers.find(p => p && p.name.slugify() === power.name.slugify());
			if (!knownPower)
				context.unknownMetalMagicPowers.push(fromUuidSync(power.uuid));
			else
			{
				if (power.system.allowMultipleChoice)
					knownPower.allowMultipleChoice = true;
				
				if (knownPower.quantity && knownPower.quantity > 1)
					context.knownMetalMagicPowersCount += knownPower.quantity - 1;
				else if (power.system.allowMultipleChoice)
					knownPower.quantity = 1;
				
				knownPower.nameId = knownPower.name.slugify();
			}
		}
		
		if (context.knownMetalMagicPowersCount < effectiveMetalCore)
			context.allowsMetalPowerSelection = true;
		else
			context.allowsMetalPowerSelection = false;
		
		context.hasSelectedAtLeastOneMetalMagicPower = context.knownMetalMagicPowersCount > 0;
		
		actor.system.magic.metalMagicPowers = context.metalMagicPowers;
		actor.system.magic.unknownMetalMagicPowers = context.unknownMetalMagicPowers;
		context.actor.system.magic = actor.system.magic;

		context.manifested = actor.system.magic.manifestedMetalCore;
	}

	static async _onSelectMetalPower(actor, event, target) {
		if (!actor.system?.magic?.unknownMetalMagicPowers)
			return;

		const powerId = target.dataset.id;
		const power = actor.system?.magic?.unknownMetalMagicPowers?.find(p => p && p.uuid === powerId);
		if (power)
		{
			var compendiumPower = await fromUuid(power.uuid);
			var index = actor.system.magic.unknownMetalMagicPowers.indexOf(power);
			actor.system.magic.unknownMetalMagicPowers.splice(index,1);
			actor.system.magic.metalMagicPowers.push(power);
			
			actor.update({"system.magic.unknownMetalMagicPowers": actor.system.magic.unknownMetalMagicPowers});
			actor.update({"system.magic.metalMagicPowers": actor.system.magic.metalMagicPowers});
			
			if (actor.system.magic.manifestedMetalCore)
			{
				await this._embedMetalMagicPower(power);
			}
		}
	}
	
	static async _onRemoveMetalPower(actor, event, target) {
		if (!actor.system?.magic?.metalMagicPowers)
			return;

		const powerId = target.dataset.id;
		const power = actor.system?.magic?.metalMagicPowers?.find(p => p && p.name.slugify() === powerId);
		if (power)
		{
			var index = actor.system.magic.metalMagicPowers.indexOf(power);
			actor.system.magic.metalMagicPowers.splice(index,1);
			actor.system.magic.unknownMetalMagicPowers.push(power);

			actor.update({"system.magic.unknownMetalMagicPowers": actor.system.magic.unknownMetalMagicPowers});
			actor.update({"system.magic.metalMagicPowers": actor.system.magic.metalMagicPowers});

			if (actor.system.magic.manifestedMetalCore)
			{
				var embeddedCollection = await actor.getEmbeddedCollection("Item");
				await this._removeEmbeddedMetalMagicPower(power, embeddedCollection);
			}
		}
	}
	
	static async _onIncreaseMetalPower(actor, event, target) {
		if (!actor.system?.magic?.metalMagicPowers)
			return;

		const powerId = target.dataset.id;
		const power = actor.system?.magic?.metalMagicPowers?.find(p => p && p.name.slugify() === powerId);
		if (power && power.system.allowMultipleChoice)
		{
			if (!power.quantity) power.quantity = 1;
			power.quantity++;
			actor.update({"system.magic.metalMagicPowers": actor.system.magic.metalMagicPowers});

			if (actor.system.magic.manifestedMetalCore)
			{
				await actor.createEmbeddedDocuments("Item", [power]);
			}
		}
	}
	
	static async _onDecreaseMetalPower(actor, event, target) {
		if (!actor.system?.magic?.metalMagicPowers)
			return;

		const powerId = target.dataset.id;
		const power = actor.system?.magic?.metalMagicPowers?.find(p => p && p.name.slugify() === powerId);
		if (power && power.system.allowMultipleChoice)
		{
			if (!power.quantity) power.quantity = 1;
			power.quantity--;
			if (power.quantity < 1) power.quantity = 1;
			actor.update({"system.magic.metalMagicPowers": actor.system.magic.metalMagicPowers});

			if (actor.system.magic.manifestedMetalCore)
			{
				var embeddedItems = await actor.getEmbeddedCollection("Item");
				var embeddedPower = embeddedItems?.find(i => i.name.slugify() === power.name.slugify());
				if (embeddedPower)
				{
					await actor.deleteEmbeddedDocuments(
						"Item",
						[embeddedPower._id]
					);
				}
			}
		}
	}

	static async _onPickMetalAltToken(actor, event, target) {
		const field = target.dataset.field || "img";
		const current = actor.system.magic.metalCore.altToken ?? CONST.DEFAULT_TOKEN;;

		const fp = new foundry.applications.apps.FilePicker({
			type: "image",
			current: current,
			callback: (path) => {
				actor.system.magic.metalCore.altToken = path;
				actor.update({ "system.magic.metalCore": actor.system.magic.metalCore });
				actor.sheet.render();
			}
		});

		fp.render(true);
	}
	
	static async _onManifestMetalCore(actor, event, target) {
		if (!actor.system?.magic)
			return;
		
		if (!actor.system.magic.manifestedMetalCore) actor.system.magic.manifestedMetalCore = false;
		
		actor.system.magic.manifestedMetalCore = !actor.system.magic.manifestedMetalCore;
		actor.update({"system.magic.manifestedMetalCore": actor.system.magic.manifestedMetalCore});
		
		//Removes all equipped items.
		var embeddedCollection = await actor.getEmbeddedCollection("Item");
		var equippedItems = embeddedCollection.filter(i => i.system.equipped);
		for (var equippedItem of equippedItems)
		{
			await actor.updateEmbeddedDocuments("Item", [
				{
					"_id": equippedItem._id,
					"system.equipped": false,
				},
			]);
		}
		
		if (actor.system.magic.manifestedMetalCore)
		{
			for (var power of actor.system?.magic?.metalMagicPowers)
			{
				await this._embedMetalMagicPower(actor, power);
			}
		}
		else
		{
			var embeddedItems = await actor.getEmbeddedCollection("Item");
			for (var power of actor.system?.magic?.metalMagicPowers)
			{
				await this._removeEmbeddedMetalMagicPower(actor, power, embeddedItems);
			}
		}

		if (actor.system.magic.metalCore.altToken && actor.system.magic.metalCore.altToken !== CONST.DEFAULT_TOKEN)
		{
			const tokens = canvas.scene.tokens.filter(t => t.actor?.id === actor.id);
			for (let token of tokens)
			{
				const imgToShow = actor.system.magic.manifestedMetalCore ? actor.system.magic.metalCore.altToken : actor.prototypeToken.texture.src;
				if (!imgToShow || imgToShow === CONST.DEFAULT_TOKEN)
					imgToShow = actor.img;
				token.texture.src = imgToShow;
		        canvas.scene.updateEmbeddedDocuments("Token", [{_id: token.id, texture: token.texture}]);
			}
		}
	}

	static async _onDropManifestedToken(token) {
		if (token.actor.system.magic.metalCore.altToken && token.actor.system.magic.metalCore.altToken !== CONST.DEFAULT_TOKEN && token.actor.system.magic.manifestedMetalCore)
		{
			const imgToShow = token.actor.system.magic.metalCore.altToken;
			token.texture.src = imgToShow;
			canvas.scene.updateEmbeddedDocuments("Token", [{_id: token.id, texture: token.texture}]);
		}
	}
	
	static async _embedMetalMagicPower(actor, power) {
		for (var c = 0; c < (power.quantity ? power.quantity : 1); c++)
		{
			await actor.createEmbeddedDocuments("Item", [power]);
		}

		if (power.name.slugify() === "living-claws")
		{
			var embeddedItems = await actor.getEmbeddedCollection("Item");
			var livingMetalClaws = embeddedItems?.find(i => i.name.slugify() === "living-metal-claws");

			if (!livingMetalClaws)
			{
				const allWeapons = await CompendiumsSD._documents("Item", "Weapon", false);
				const livingMetalClawsCompendium = allWeapons.find(w => w.name.slugify() === "living-metal-claws");
				livingMetalClaws = await fromUuid(livingMetalClawsCompendium.uuid);

				livingMetalClaws.system.equipped = true;
				
				const [newLivingMetalClaws] = await actor.createEmbeddedDocuments("Item", [livingMetalClaws]);

				await actor.updateEmbeddedDocuments("Item", [
					{
						"_id": newLivingMetalClaws._id,
						"system.equipped": true,
						"system.stashed": false,
					},
				]);
			}
		}
	}

	static async _removeEmbeddedMetalMagicPower(actor, power, embeddedItems) {
		for (var c = 0; c < (power.quantity ? power.quantity : 1); c++)
		{
			var embeddedPower = embeddedItems?.find(i => i.name.slugify() === power.name.slugify());
			if (embeddedPower)
			{
				await actor.deleteEmbeddedDocuments(
					"Item",
					[embeddedPower._id]
				);
			}
		}

		if (power.name.slugify() === "living-claws")
		{
			var livingMetalClaws = embeddedItems?.find(i => i.name.slugify() === "living-metal-claws");
			if (livingMetalClaws)
			{
				await actor.deleteEmbeddedDocuments(
					"Item",
					[livingMetalClaws._id]
				);
			}
		}
	}
}