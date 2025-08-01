import UtilitySD from "../utils/UtilitySD.mjs";
import BritannianMagicSD from "../sheets/magic/BritannianMagicSD.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class BritannianSpellSD extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options) {
        super(options);
        this.setOptions(options);
    }
    
    setOptions(options) {
        this.actor = options.actor;
        this.type = options.type;
        this.spell = options.spell ?? { runes: options.actor.system.britannian_magic.selected_runes, uuid: UtilitySD.generateUUID() };
    }

   	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["app", "window-app", "shadowdark", 'themed', 'theme-light'],
		position: {
    		width: 600,
    		height: 800
  		},
		window: {
			resizable: false,
    		title: 'SHADOWDARK.britannian_spell.title',
			controls: [],
  		},
		actions: {
			increaseRune: this.#onIncreaseRune,
            selectRune: this.#onSelectRune,
            selectEffect: this.#onSelectEffect,
            selectCreature: this.#onSelectCreature,
            castSpell: this.#castSpell,
            scribepell: this.#scribepell,
		},
		form: {
			handler: this.#onSubmit,
		    submitOnChange: true,
    		closeOnSubmit: false
  		},
		dragDrop: [{
		}],
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/apps/britannian-spell.hbs" }
	}

	async getTitle() {
        if (!this.spellName)
		    return game.i18n.localize("SHADOWDARK.britannian_spell.title");

        return game.i18n.localize("SHADOWDARK.britannian_spell.editingTitle") + this.spellName;
	}

	/** @override */
	async _prepareContext(options) {
		const context = {
            runes: this.spell.runes ?? [],
            canSelectRunes: false,
            actor: this.actor,
            spell: this.spell,
            selectedEffect: this.spell.effect ?? null,
            spellName: this.spell.name,
            editable: game.user.isGM || this.actor.isOwner,
            castingBonus: this.actor.system.abilities.int.mod,
            canScribeSpells: this.actor.system.bonuses.canScribeSpells,
		};

        if (this.actor.system.bonuses.spellcastingCheckBonus)
            context.castingBonus += this.actor.system.bonuses.spellcastingCheckBonus;
        if (context.castingBonus > 0) context.castingBonus = '+' + context.castingBonus;

        if (BritannianSpellSD.spellCircle(this.spell) < this.actor.system.level.value)
            context.canSelectRunes = true;

        context.availableRunes = [];
        context.chosenRunes = [];

        let inLevel = 0;
        let vasLevel = 0;

        for (var rune of (this.actor.system.britannian_magic?.runes ?? []))
        {
            if (rune.learned && !this.spell.runes.some(r => r.uuid == rune.uuid))
            {
                context.availableRunes.push(rune);
            }
            else if (rune.learned && this.spell.runes.some(r => r.uuid == rune.uuid))
            {
                var spellRune = this.spell.runes.find(r => r.uuid === rune.uuid);
                if (rune.name === 'in' && this.spell.effect)
                {
                    context.hasInWord = true;
                    inLevel = (spellRune.increases ?? 0) + 1;
                }
                else if (rune.name === 'vas' && this.spell.effect)
                {
                    context.hasVasWord = true;
                    vasLevel = (spellRune.increases ?? 0) + 1;
                }
            }
        }

        if (context.hasInWord)
        {
            context.inDurationIncreases = [];
            context.targetIncreases = [];
            context.rangeIncreases = [];
            let selectedWordEffects = (this.spell.inDurationIncreases ?? 0) + (this.spell.targetIncreases ?? 0) + (this.spell.rangeIncreases ?? 0);
            let removeEmptyEffects = false;
            if (selectedWordEffects >= inLevel)
                removeEmptyEffects = true;

            for (let i = 0; i < this.spell.inDurationIncreases ?? 0; i++) { context.inDurationIncreases.push(i); }
            for (let i = 0; i < this.spell.targetIncreases ?? 0; i++) { context.targetIncreases.push(i); }
            for (let i = 0; i < this.spell.rangeIncreases ?? 0; i++) { context.rangeIncreases.push(i); }

            context.InWordEffects = [];
            const spellDuration = this.spell.effect?.duration ?? '';
            if ((this.spell.areaIncreases ?? 0) <= 0 && (!removeEmptyEffects || this.spell.targetIncreases > 0))
                context.InWordEffects.push({label: 'Increase Targets', selections: context.targetIncreases});
            if (spellDuration !== '' && !UtilitySD.isObject(spellDuration) && (!removeEmptyEffects || this.spell.inDurationIncreases > 0))
                context.InWordEffects.push({label: 'Increase Duration', selections: context.inDurationIncreases});
            if (!removeEmptyEffects || this.spell.rangeIncreases > 0)
                context.InWordEffects.push({label: 'Increase Range', selections: context.rangeIncreases});

            context.openInWordEffects = [];
            context.inWordEffects = [];
            for (let i = selectedWordEffects; i < inLevel; i++) { context.openInWordEffects.push(i); }
            for (let i = 0; i < inLevel; i++) { context.inWordEffects.push(i); }
        }

        if (context.hasVasWord)
        {
            context.vasDurationIncreases = [];
            context.damageIncreases = [];
            context.damageDieIncreases = [];
            context.areaIncreases = [];
            context.otherIncreases = [];
            let selectedWordEffects = (this.spell.vasDurationIncreases ?? 0) + (this.spell.damageIncreases ?? 0) + (this.spell.damageDieIncreases ?? 0) + (this.spell.areaIncreases ?? 0) + (this.spell.otherIncreases ?? 0);
            let removeEmptyEffects = false;
            if (selectedWordEffects >= vasLevel)
                removeEmptyEffects = true;

            for (let i = 0; i < this.spell.vasDurationIncreases ?? 0; i++) { context.vasDurationIncreases.push(i); }
            for (let i = 0; i < this.spell.damageIncreases ?? 0; i++) { context.damageIncreases.push(i); }
            for (let i = 0; i < this.spell.damageDieIncreases ?? 0; i++) { context.damageDieIncreases.push(i); }
            for (let i = 0; i < this.spell.areaIncreases ?? 0; i++) { context.areaIncreases.push(i); }
            for (let i = 0; i < this.spell.otherIncreases ?? 0; i++) { context.otherIncreases.push(i); }

            context.VasWordEffects = [];
            const spellDuration = this.spell.effect?.duration ?? '';
            if (spellDuration !== '' && !UtilitySD.isObject(spellDuration) && (!removeEmptyEffects || this.spell.vasDurationIncreases > 0))
                context.VasWordEffects.push({label: 'Increase Duration', selections: context.vasDurationIncreases});
            if (this.spell.effect?.damage)
            {
                if (!removeEmptyEffects || this.spell.damageIncreases > 0)
                    context.VasWordEffects.push({label: 'Increase Damage', selections: context.damageIncreases});
                if (!removeEmptyEffects || this.spell.damageDieIncreases > 0)
                    context.VasWordEffects.push({label: 'Enhance Damage Die', selections: context.damageDieIncreases});
            }
            if (!removeEmptyEffects || this.spell.areaIncreases > 0)
                context.VasWordEffects.push({label: 'Area Effect', selections: context.areaIncreases});
            if (!removeEmptyEffects || this.spell.otherIncreases > 0)
                context.VasWordEffects.push({label: 'Other Effect', selections: context.otherIncreases});

            context.openVasWordEffects = [];
            context.vasWordEffects = [];
            for (let i = selectedWordEffects; i < vasLevel; i++)  { context.openVasWordEffects.push(i); }
            for (let i = 0; i < vasLevel; i++)  { context.vasWordEffects.push(i); }
        }

        if (!context.selectedEffect)
        {
            context.availableEffects = await this.getAvailableEffects();
        }

        context.selectedRunesCircle = BritannianSpellSD.spellCircle(this.spell);
        if (context.selectedRunesCircle === 1) context.selectedRunesCircleOrdinal = "st";
        else if (context.selectedRunesCircle === 2) context.selectedRunesCircleOrdinal = "nd";
        else if (context.selectedRunesCircle === 3) context.selectedRunesCircleOrdinal = "rd";
        else context.selectedRunesCircleOrdinal = "th";

        context.spellDC = 9 + context.selectedRunesCircle;

        if (context.selectedEffect != null)
        {
            if (!context.spellDescriptionHTML)
     		    context.spellDescriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML( 
                context.selectedEffect.description, 
                { 
                    secrets: this.actor.isOwner,
                    async: true,
                    relativeTo: this.actor,
                }
            );

            if ((context.selectedEffect.name.includes("Animal)") || context.selectedEffect.name.includes("Creature)") || context.selectedEffect.name.includes("Horde)")) && !this.spell.creature)
            {
                context.shouldSummonAnimal = true
                context.availableCreatures = await this.getAvailableCreatures();
            }
        }

        context.spellReady = await this.isSpellReady(context);
        context.hasEquippedSpellbook = (await this.actor.equippedSpellBook()) != null;

        return context;
    }

    async _onRender(context, options) {
        await this.addEventListeners(this);
    }

	async addEventListeners(sheet) {
		if (!game.settings.get("shadowdark", "use_britannianRuneMagic"))
			return;

		const runes = sheet.element.querySelectorAll(".selected-rune");
		for (const rune of runes)
		{
			rune.addEventListener("contextmenu", (event) => {
                this.decreaseRune(event, rune);
			});
        }
    }

    static async #onSelectRune(event, target) {

    }

    static async #onIncreaseRune(event, target) {
        if (BritannianSpellSD.spellCircle(this.spell) >= this.actor.system.level.value)
            return;
        const rune = target.dataset.rune;
        var actorRune = this.actor.system.britannian_magic.selected_runes.find(r => r.name === rune);
        if (actorRune)
        {
            if (!actorRune.increases) actorRune.increases = 1;
            else actorRune.increases++;
            if (actorRune.increases > 10) actorRune.increases = 10;

            this.spell.runes = this.actor.system.britannian_magic.selected_runes;
            await this.applyEffect();
    		await this.actor.update({ "system.britannian_magic": this.actor.system.britannian_magic });
            await this.render(true);
        }
    }

	async decreaseRune(event, target) {
		const rune = target.dataset.rune;
        var actorRune = this.actor.system.britannian_magic.selected_runes.find(r => r.name === rune);
        if (actorRune)
        {
            if (!actorRune.increases)
            {
                var index = this.actor.system.britannian_magic.selected_runes.indexOf(actorRune);
                this.actor.system.britannian_magic.selected_runes.splice(index, 1);

                for (let rune of this.actor.system.britannian_magic.runes ?? [])
                {
                    if (!this.actor.system.britannian_magic.selected_runes.some(r => r.name === rune.name))
                    {
                        rune.selected = false;
                    }
                }
                actorRune.increases = 0;
            }
            else actorRune.increases--;

            this.spell.runes = this.actor.system.britannian_magic.selected_runes;
            await this.applyEffect();
    		await this.actor.update({ "system.britannian_magic": this.actor.system.britannian_magic });
            await this.render(true);
        }
    }

    static async #onSubmit(event, form, formData) {
        const rune = event.target.dataset.rune;
        switch (event.target.name)
        {
            case 'actor.system.britannian_magic.selected_runes':
                await BritannianMagicSD.selectRune(this.actor, event.target.value);
                this.spell.runes = this.actor.system.britannian_magic.selected_runes;
                await this.applyEffect();
                break;
            case 'spell.name':
                this.spell.name = event.target.value;
                break;
            case 'spell.description':
                this.spell.description = event.target.value;
                this.spell.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML( 
                    event.target.value, 
                    { 
                        secrets: this.actor.isOwner,
                        async: true,
                        relativeTo: this.actor,
                    }
                );
                break;
            case 'Increase Duration':
                if (rune === 'in')
                {
                    if(!this.spell.inDurationIncreases) this.spell.inDurationIncreases = 0;
                    this.spell.inDurationIncreases += event.target.checked ? 1 : -1;
                }
                else if (rune === 'vas')
                {
                    if(!this.spell.vasDurationIncreases) this.spell.vasDurationIncreases = 0;
                    this.spell.vasDurationIncreases += event.target.checked ? 1 : -1;
                }
                break;
            case 'Increase Targets':
                if(!this.spell.targetIncreases) this.spell.targetIncreases = 0;
                this.spell.targetIncreases += event.target.checked ? 1 : -1;
                break;
            case 'Increase Range':
                if(!this.spell.rangeIncreases) this.spell.rangeIncreases = 0;
                this.spell.rangeIncreases += event.target.checked ? 1 : -1;
                break;
            case 'Increase Duration':
                if(!this.spell.vasDurationIncreases) this.spell.vasDurationIncreases = 0;
                this.spell.vasDurationIncreases += event.target.checked ? 1 : -1;
                break;
            case 'Increase Damage':
                if(!this.spell.damageIncreases) this.spell.damageIncreases = 0;
                this.spell.damageIncreases += event.target.checked ? 1 : -1;
                break;
            case 'Enhance Damage Die':
                if(!this.spell.damageDieIncreases) this.spell.damageDieIncreases = 0;
                this.spell.damageDieIncreases += event.target.checked ? 1 : -1;
                break;
            case 'Area Effect':
                if(!this.spell.areaIncreases) this.spell.areaIncreases = 0;
                this.spell.areaIncreases += event.target.checked ? 1 : -1;
                this.spell.targetIncreases = 0;
                break;
            case 'Other Effect':
                if(!this.spell.otherIncreases) this.spell.otherIncreases = 0;
                this.spell.otherIncreases += event.target.checked ? 1 : -1;
                break;
        }
        await this.applyEffect();
        await this.render(true);
    }

    static async #onSelectEffect(event, target) {
        const effectId = target.dataset.effectId;
        let newEffect = await this.getEffectFromUuid(effectId);
        this.spell.effect = newEffect;

        await this.applyEffect();
        if (!this.spell.name) this.spell.name = newEffect.name;
        await this.render(true);
    }

    static async #onSelectCreature(event, target) {
        const creatureId = target.dataset.creatureId;
        const creature = await fromUuid(creatureId);
        this.spell.creature = creature;
        this.spell.creatureUuid = creature.uuid;

        if (/\(.*?\)/.test(this.spell.name)) {
            this.spell.name = this.spell.name.replace(/\(.*?\)/, this.spell.creature.name);
        }

        await this.applyEffect();
        await this.render(true);
    }

    static async #castSpell(event, target) {
        BritannianMagicSD.unselectAllRunes(this.actor);
        this.close();
    }

    static async #scribepell(event, target) {
        let spellbook = await this.actor.equippedSpellBook();
        if (!spellbook.system.spells) spellbook.system.spells = [];

        const spellIndex = spellbook.system.spells.indexOf(s => s.uuid === this.spell.uuid);

        if (spellIndex == -1)
            spellbook.system.spells.push(this.spell);
        else
            spellbook.system.spells[spellIndex] = this.spell;

        await this.actor.updateEmbeddedDocuments("Item", [
            {
                "_id": spellbook.id,
                "system.spells": spellbook.system.spells
            },
        ]);
        BritannianMagicSD.unselectAllRunes(this.actor);
        this.close();
    }

    async getEffectFromUuid(effectId)
    {
        const effect = await fromUuid(effectId);
        if (!effect)
            return null;

        let newEffect = {
            name: effect.name,
            uuid: effect.uuid,
            targets: 1,
            range: 'Near',
            runes: effect.system.runes,
            description: effect.system.description,
            powerLevel: effect.system.powerLevel,
        };

        if (effect.system.resistedBy)
        {
            newEffect.resistedBy = effect.system.resistedBy;
            if (effect.system.resistance_penalty)
                newEffect.resistance_penalty = effect.system.resistance_penalty;
            if (effect.system.resistance_penalty_step)
                newEffect.resistance_penalty_step = effect.system.resistance_penalty_step;
        }

        if (effect.system.duration)
        {
            newEffect.duration = effect.system.duration;
            if (effect.system.duration_increase)
                newEffect.duration_increase = effect.system.duration_increase;
            if (effect.system.duration_increase_step)
                newEffect.duration_increase_step = effect.system.duration_increase_step;
        }

        if (effect.system.damage)
        {
            newEffect.damage = effect.system.damage;
            if (effect.system.damage_type)
                newEffect.damage_type = effect.system.damage_type;
            if (effect.system.damage_increase)
                newEffect.damage_increase = effect.system.damage_increase;
            if (effect.system.damage_increase_step)
                newEffect.damage_increase_step = effect.system.damage_increase_step;
        }
        return newEffect;
    }

    async getAvailableEffects() {
        let allMagicEffects = await shadowdark.compendiums.britannianMagicEffects();
        let availableEffects = [];
        for (let effectUuid of allMagicEffects)
        {
            let effect = await fromUuid(effectUuid);
            let hasAllRunes = true;
            for (let rune of effect.system.runes)
            {
                if (!this.actor.system.britannian_magic.selected_runes.some(r => r.uuid === rune))
                {
                    hasAllRunes = false;
                    break;
                }
            }
            if (!hasAllRunes)
                continue;

            if (/^\d+$/.test(effect.system.powerLevel))
            {
                let requiredLevel = parseInt(effect.system.powerLevel);
                if (BritannianSpellSD.spellCircle(this.spell) < requiredLevel)
                    continue;
            }

            availableEffects.push({
                uuid: effect.uuid,
                img: effect.img,
                description: effect.system.description,
                name: effect.name
            });
        }
        return availableEffects;
    }

    async getAvailableCreatures() {
        let allCreatures = await shadowdark.compendiums.britannianMagicNPCs();
        let availableCreatures = [];
        for (let creature of allCreatures)
        {
            let hasAllRunes = true;
            for (let rune of creature.system.characterRunes)
            {
                if (!this.actor.system.britannian_magic.selected_runes.some(r => r.uuid === rune))
                {
                    hasAllRunes = false;
                    break;
                }
            }
            if (!hasAllRunes)
                continue;

            let requiredLevel = creature.system.level.value;
            if (BritannianSpellSD.spellCircle(this.spell) < requiredLevel)
                continue;

            availableCreatures.push({
                uuid: creature.uuid,
                img: creature.img,
                description: creature.system.notes,
                name: creature.name
            });
        }
        return availableCreatures;
    }

    async applyEffect() {
        if (!this.spell.effect)
            return;

        let spell = this.spell;

        if(!spell.description)
        {
            spell.description = spell.effect.description;
            spell.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML( 
                spell.effect.description, 
                { 
                    secrets: this.actor.isOwner,
                    async: true,
                    relativeTo: this.actor,
                }
            );
        }

        const spellCircle = BritannianSpellSD.spellCircle(this.spell);
        let extraLevels = spellCircle;
        if (spell.effect.powerLevel != "*")
            extraLevels = spellCircle - parseInt(spell.effect.powerLevel ?? '0');

        spell.duration = null;
        spell.resistance = null;
        spell.damage = null;

        spell.resistance = BritannianSpellSD.getSpellResistance(spell);
        spell.duration = BritannianSpellSD.getSpellDuration(spell);
        spell.damage = BritannianSpellSD.getSpellDamage(spell);
        spell.effect.range = BritannianSpellSD.getSpellRange(spell);
        spell.area = BritannianSpellSD.getSpellArea(spell);
        spell.targets = BritannianSpellSD.getSpellTargets(spell);
    }

    static increaseDurationByWord(spell, duration)
    {
        if (spell.runes.some(r => (r.name === 'in' || r.name === 'vas')))
        {
            const durationIncreases = (spell.inDurationIncreases ?? 0) + (spell.vasDurationIncreases ?? 0);
            if (durationIncreases === 0)
                return duration;

            const durations = ["sustained", "1-turn", "1-minute", "1-hour", "1-day", "permanent"];

            let durationsIndex = durations.indexOf(duration);
            if (durationsIndex === -1)
                return duration;

            durationsIndex += durationIncreases;

            if (durationsIndex >= durations.length)
                durationsIndex = durations.length - 1;

            return durations[durationsIndex];
        }

        return duration;
    }

    static getDamageIncreasesByWord(spell)
    {
        let autoIncreaseWords = ['jux', 'kal', 'nox'];
        let increases = 0;
        for (let autoIncreaseWord of autoIncreaseWords)
        {
            if (!spell.runes.some(r => r.name === autoIncreaseWord))
                continue;
            if (spell.effect.runes.some(r => r.name === autoIncreaseWord))
                continue;
            increases++;
        }
        return increases;
    }

    static applyVasDamage(spell, damage)
    {
        if (!spell.runes.some(r => r.name === 'vas'))
            return damage;

        const vasIncreases = (spell.damageIncreases ?? 0);
        let newDamage = UtilitySD.addDamageDie(damage, vasIncreases);
        const vasDieIncreases = (spell.damageDieIncreases ?? 0);
        newDamage = UtilitySD.enhanceDamageDie(newDamage, vasDieIncreases);
        return newDamage;
    }

    async isSpellReady(context) {
        if (!this.spell.effect)
            return false;
        if (!this.spell.name)
            return false;
        if (context.hasInWord && context.openInWordEffects.length > 0)
            return false;
        if (context.hasVasWord && context.openVasWordEffects.length > 0)
            return false;
        if ((context.selectedEffect.name.includes("Animal)") || context.selectedEffect.name.includes("Creature)") || context.selectedEffect.name.includes("Horde)")) && !this.spell.creature)
            return false;

        return true;
    }

    static spellCircle(spell) {
        if (!spell)
            return 0;

        var selectedCircle = 0;
        for (var rune of spell.runes)
        {
            selectedCircle++;
            if (rune.increases)
                selectedCircle += rune.increases;
        }
        return selectedCircle;
    }

    static getSpellCircle(spell) {
        let selectedRunesCircle = BritannianSpellSD.spellCircle(spell);
        let selectedRunesCircleOrdinal = "th";

        if (selectedRunesCircle === 1) selectedRunesCircleOrdinal = "st";
        else if (selectedRunesCircle === 2) selectedRunesCircleOrdinal = "nd";
        else if (selectedRunesCircle === 3) selectedRunesCircleOrdinal = "rd";

        return `${selectedRunesCircle}<sup>${selectedRunesCircleOrdinal}</sup> Circle.`;
    }

    static getSpellTargets(spell) {
        const areaIncreases = spell.areaIncreases ?? 0;
        if (areaIncreases > 0)
            return null;

        if (spell.effect.targets)
            return spell.effect.targets + (spell.targetIncreases ?? 0);

        return null;
    }

    static getSpellArea(spell) {
        const areaIncreases = spell.areaIncreases ?? 0;

        if (areaIncreases > 0)
        {
            const hexRadius = (spell.areaIncreases * 2) + 1;
            return hexRadius + "x" + hexRadius + " hex radius";
        }

        return null;
    }

    static getSpellRange(spell) {
        if ((spell.rangeIncreases ?? 0) > 0)
        {
            switch(spell.rangeIncreases)
            {
                case 1:
                    return 'Double Near';
                case 2:
                    return 'Far';
                default:
                    return 'Line of Sight';
            }
        }

        return 'Near';
    }

    static getSpellDuration(spell) {
        if (spell.effect.duration && !UtilitySD.isObject(spell.effect.duration))
        {
            let duration = spell.effect.duration;
            return this.increaseDurationByWord(spell, duration);
        }
        return 'instant';
    }

    static getSpellDamage(spell) {
        if (spell.effect.damage)
        {
            const spellCircle = BritannianSpellSD.spellCircle(spell);
            let extraLevels = spellCircle;
            if (spell.effect.powerLevel != "*")
                extraLevels = spellCircle - parseInt(spell.effect.powerLevel ?? '0');

            let damage = spell.effect.damage;
            const damageIncrease = spell.effect.damage_increase;
            const damage_increase_step = parseInt(spell.effect.damage_increase_step);
            let increases = Math.floor(extraLevels / damage_increase_step);
            increases += this.getDamageIncreasesByWord(spell);

            const extraDamage = UtilitySD.multiplyDamage(damageIncrease, increases);
            let finalDamage = UtilitySD.addDamage(damage, extraDamage);
            finalDamage = this.applyVasDamage(spell, finalDamage);

            return finalDamage;
        }
        return null;
    }

    static getSpellResistance(spell) {
        if (spell.effect.resistedBy)
        {
            const spellCircle = BritannianSpellSD.spellCircle(spell);
            let extraLevels = spellCircle;
            if (spell.effect.powerLevel != "*")
                extraLevels = spellCircle - parseInt(spell.effect.powerLevel ?? '0');
            else
                extraLevels = spellCircle - 1;

            let resistance = spell.effect.resistedBy;
            resistance = resistance.charAt(0).toUpperCase() + resistance.slice(1);
            if (spell.effect.resistance_penalty)
            {
                let totalPenalty = parseInt(spell.effect.resistance_penalty);
                if (spell.effect.resistance_penalty_step === 'per_extra_level')
                {
                    totalPenalty = parseInt(spell.effect.resistance_penalty) * extraLevels;
                }
                else if (spell.effect.resistance_penalty_step === 'per_level')
                {
                    totalPenalty = parseInt(spell.effect.resistance_penalty) * spellCircle;
                }
                const dc = 10 - totalPenalty;
                resistance += ' vs ' + dc;
            }
            return resistance;
        }
        return null;
    }

    static getSpellHealing(spell) {

    }

    static getSpellCreature(spell) {
        return spell.creature;
    }
}
