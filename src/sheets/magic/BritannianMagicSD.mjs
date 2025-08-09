import UtilitySD from "../../utils/UtilitySD.mjs";

export default class BritannianMagicSD {
    static runes = [
        {uuid: 'britannian-rune-an', name: 'an'},
        {uuid: 'britannian-rune-bet', name: 'bet'},
        {uuid: 'britannian-rune-corp', name: 'corp'},
        {uuid: 'britannian-rune-des', name: 'des'},
        {uuid: 'britannian-rune-ex', name: 'ex'},
        {uuid: 'britannian-rune-flam', name: 'flam'},
        {uuid: 'britannian-rune-grav', name: 'grav'},
        {uuid: 'britannian-rune-hur', name: 'hur'},
        {uuid: 'britannian-rune-in', name: 'in'},
        {uuid: 'britannian-rune-jux', name: 'jux'},
        {uuid: 'britannian-rune-kal', name: 'kal'},
        {uuid: 'britannian-rune-lor', name: 'lor'},
        {uuid: 'britannian-rune-mani', name: 'mani'},
        {uuid: 'britannian-rune-nox', name: 'nox'},
        {uuid: 'britannian-rune-ort', name: 'ort'},
        {uuid: 'britannian-rune-por', name: 'por'},
        {uuid: 'britannian-rune-quas', name: 'quas'},
        {uuid: 'britannian-rune-rel', name: 'rel'},
        {uuid: 'britannian-rune-sanct', name: 'sanct'},
        {uuid: 'britannian-rune-tym', name: 'tym'},
        {uuid: 'britannian-rune-uus', name: 'uus'},
        {uuid: 'britannian-rune-vas', name: 'vas'},
        {uuid: 'britannian-rune-wis', name: 'wis'},
        {uuid: 'britannian-rune-xen', name: 'xen'},
        {uuid: 'britannian-rune-ylem', name: 'ylem'},
        {uuid: 'britannian-rune-zu', name: 'zu'}];

    static exclusiveRunes = [ // Exclusive runed prevent effects from being available unless the user speficically selected them.
        {uuid: 'britannian-rune-an', name: 'an'},
        {uuid: 'britannian-rune-bet', name: 'bet'},
    ];

	static async addEventListeners(sheet) {
		if (!game.settings.get("shadowdark", "use_britannianRuneMagic"))
			return;

		const runes = sheet.element.querySelectorAll(".selected-rune");
		for (const rune of runes)
		{
			rune.addEventListener("contextmenu", (event) => {
                BritannianMagicSD.#onDecreaseRune(event, sheet, rune);
			});
        }
    }

    static async prepareBritannianMagic(context, actor) {

        var runes = await shadowdark.compendiums.britannianRunes();
        if (!actor.system.britannian_magic)
        {
            actor.system.britannian_magic = {
                runes: [],
                selected_runes: [],
                last_spells: [],
                page: 0,
            };
        }

        if (!actor.system.britannian_magic.runes) actor.system.britannian_magic.runes = [];
        if (!actor.system.britannian_magic.selected_runes) actor.system.britannian_magic.selected_runes = [];

        var runeCount = 0;
        context.learnedRunes = 0;
        for (var rune of BritannianMagicSD.runes) {
            runeCount++;
            var div4 = runeCount % 4;

            var actorRune = {
                name: rune.name,
                uuid: rune.uuid,
                titleName: BritannianMagicSD._toTitleCase(rune.name),
                learned: false,
                selected: false,
                meaning: 'SHADOWDARK.britannian_rune.'+rune.name+'_meaning',
                tooltip: 'SHADOWDARK.britannian_rune.'+rune.name+'_tooltip',
                style: (div4 == 1 || div4 == 2) ? 'britannian-rune-left' : ( div4 == 3 ? 'britannian-rune-right' : 'britannian-rune-right-end' ),
                runeStyle: (div4 == 1 || div4 == 2) ? 'magic-rune-left' : ( div4 == 3 ? 'magic-rune-right' : 'magic-rune-right-end' ),
                oddLayout: (div4 == 1 || div4 == 2) ? true : false
            };

            var existingRune = actor.system.britannian_magic.runes.find(r => r.name === rune.name);
            if (!existingRune)
            {
                actor.system.britannian_magic.runes.push(actorRune);
            }
            else
            {
                existingRune.uuid = actorRune.uuid;
                existingRune.style = actorRune.style;
                existingRune.runeStyle = actorRune.runeStyle;
                existingRune.oddLayout = actorRune.oddLayout;
                if (existingRune.learned)
                    context.learnedRunes++;
            }
        }
        
        context.knownRunes = 0;
        if (actor.system.bonuses.words_of_power_starting)
            context.knownRunes += actor.system.bonuses.words_of_power_starting;
        if (actor.system.bonuses.words_of_power)
            context.knownRunes += actor.system.bonuses.words_of_power;
        if (actor.system.level.value > 1 && actor.system.bonuses.words_of_power_per_level)
            context.knownRunes += (actor.system.level.value - 1) * actor.system.bonuses.words_of_power_per_level;

        if (actor.system.bonuses.words_of_power_ability_modifier)
        {
            var abilityMod = actor.abilityModifier(actor.system.bonuses.words_of_power_ability_modifier);
            if (abilityMod > 0)
                context.knownRunes += abilityMod;
        }

        if (actor.system.bonuses.words_of_power_known)
        {
            context.knownRunes += actor.system.bonuses.words_of_power_known.length;
            for (var fixedWord of actor.system.bonuses.words_of_power_known) {
                if (!actor.system.britannian_magic.runes.some(r => r === fixedWord))
                {
                    actor.system.britannian_magic.runes.push(fixedWord);
                }
            }
        }

        context.canLearnRunes = false;
        if (context.knownRunes > context.learnedRunes)
            context.canLearnRunes = true;

        context.selectingRunes = actor.system.britannian_magic.selected_runes.length > 0;
        context.selectedRunes = actor.system.britannian_magic.selected_runes;
        context.selectedRunesCount = actor.system.britannian_magic.selected_runes.length > 0;
        context.selectedRunesCircle = BritannianMagicSD.selectedRunesCircle(actor);

        if (context.selectedRunesCircle === 1) context.selectedRunesCircleOrdinal = "st";
        else if (context.selectedRunesCircle === 2) context.selectedRunesCircleOrdinal = "nd";
        else if (context.selectedRunesCircle === 3) context.selectedRunesCircleOrdinal = "rd";
        else context.selectedRunesCircleOrdinal = "th";

        if (!actor.system.britannian_magic.page) actor.system.britannian_magic.page = 0;
        context.page = actor.system.britannian_magic.page;
        context.canGoToPreviousPage = false;
        context.canGoToNextPage = false;
        context.readyToCast = false;
        context.readyToWrite = false;
        context.isSustainingASpell = false;

        for (let active_spell of actor.system.britannian_magic.active_spells ?? [])
        {
            if (active_spell.duration === 'sustained')
            {
                context.isSustainingASpell = true;
                break;
            }
        }

        let equippedSpellbook = await actor.equippedSpellBook();

        if (context.page == 0)
        {
            context.runes = actor.system.britannian_magic.runes;
            if (actor.system.britannian_magic.selected_runes.length > 0)
                context.readyToCast = true;

            if (actor.system.bonuses.canScribeSpells && actor.system.britannian_magic.selected_runes.length > 0 && equippedSpellbook != null)
                context.canGoToNextPage = true;
            if (actor.system.britannian_magic.selected_runes.length == 0 && (equippedSpellbook?.system?.spells ?? []).length > 0)
                context.canGoToNextPage = true;
        }
        else
        {
            context.canGoToPreviousPage = true;
            let allSpells = equippedSpellbook?.system?.spells ?? [];
            context.britannianSpells = [];
            const firstIndex = (context.page - 1) * 8;
            let lastIndex = context.page * 8;
            if (lastIndex > allSpells.length)
                lastIndex = allSpells.length;
            else
                context.canGoToNextPage = true;

            for (let i = firstIndex; i < lastIndex; i++)
            {
                const spell = allSpells[i];

                spell.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML( 
                spell.description, 
                { 
                    secrets: actor.isOwner,
                    async: true,
                    relativeTo: actor,
                });

                spell.sanitizedDescription = UtilitySD.sanitizeHTML(spell.description);
                spell.parameterLines = this.getSpellParametersLines(spell);
                spell.runicName = '';
                spell.unavailable = false;

                if (spell.duration === 'sustained' && context.isSustainingASpell)
                    spell.unavailable = true;
                if (spell.lost)
                    spell.unavailable = true;

                for (let rune of spell.runes)
                {
                    spell.runicName += rune.name.charAt(0).toUpperCase() + rune.name.slice(1) + ' ';
                }
                context.britannianSpells.push(spell);
            }

            if (actor.system.britannian_magic.selected_runes.length > 0)
                context.readyToWrite = true;
        }
    }

	static async prepareBritannianMagicActiveSpells(context, actor) {
        context.activeSpells = actor.system.britannian_magic.active_spells ?? [];
    }

	static async learnRune(actor, rune) {
        var actorRune = actor.system.britannian_magic.runes.find(r => r.name === rune);
        if (actorRune)
        {
            actorRune.learned = true;
			actor.update({"system.britannian_magic": actor.system.britannian_magic});
        }
    }

    static async selectRune(actor, rune) {
        var atMax = false;
        if (BritannianMagicSD.selectedRunesCircle(actor) >= actor.system.level.value)
            atMax = true;

        var actorRune = actor.system.britannian_magic.runes.find(r => r.name === rune);
        if (actorRune)
        {
            if (!actorRune.selected && atMax)
                return;
            
            actorRune.selected = !actorRune.selected;
            if (actorRune.selected && !actor.system.britannian_magic.selected_runes.some(r => r.name === rune))
                actor.system.britannian_magic.selected_runes.push(actorRune);
            if (!actorRune.selected && actor.system.britannian_magic.selected_runes.some(r => r.name === rune))
            {
                var selectedRune = actor.system.britannian_magic.selected_runes.find(r => r.name === rune);
                var index = actor.system.britannian_magic.selected_runes.indexOf(selectedRune);
                actor.system.britannian_magic.selected_runes.splice(index, 1);
            }
                
			actor.update({"system.britannian_magic": actor.system.britannian_magic});
        }
    }

    static async unselectAllRunes(actor) {
        for (let rune of actor.system.britannian_magic.runes)
        {
            rune.selected = false;
        }
        actor.system.britannian_magic.selected_runes = []
		actor.update({"system.britannian_magic": actor.system.britannian_magic});
    }

    static async increaseRune(actor, rune) {
        if (BritannianMagicSD.selectedRunesCircle(actor) >= actor.system.level.value)
            return;
        var actorRune = actor.system.britannian_magic.selected_runes.find(r => r.name === rune);
        if (actorRune)
        {
            if (!actorRune.increases) actorRune.increases = 1;
            else actorRune.increases++;
            if (actorRune.increases > 10) actorRune.increases = 10;
    		actor.update({"system.britannian_magic": actor.system.britannian_magic});
        }
    }

    static async decreaseRune(actor, rune) {
        var actorRune = actor.system.britannian_magic.selected_runes.find(r => r.name === rune);
        if (actorRune)
        {
            if (!actorRune.increases) actorRune.increases = 0;
            actorRune.increases--;
            if (actorRune.increases < 0)
            {
                actorRune.increases = 0;
                actorRune.selected = false;
                var selectedRune = actor.system.britannian_magic.selected_runes.find(r => r.name === rune);
                var index = actor.system.britannian_magic.selected_runes.indexOf(selectedRune);
                actor.system.britannian_magic.selected_runes.splice(index, 1);
                let mainRune = actor.system.britannian_magic.runes.find(r => r.name === rune);
                mainRune.selected = false;
            }
    		actor.update({"system.britannian_magic": actor.system.britannian_magic});
        }
    }

    static selectedRunesCircle(actor) {
        var selectedCircle = 0;
        for (var rune of actor.system.britannian_magic.selected_runes)
        {
            selectedCircle++;
            if (rune.increases)
                selectedCircle += rune.increases;
        }
        return selectedCircle;
    }

	static _toTitleCase(str) {
		return str.replace(/\w\S*/g, m =>  m.charAt(0).toUpperCase() + m.substr(1).toLowerCase());
	}

	static async _onLearnRune(event, actor, sheet, target) {
		const rune = target.dataset.rune;
		await BritannianMagicSD.learnRune(actor, rune);
		sheet.render(true);
	}

	static async _onSelectRune(event, actor, sheet, target) {
		const rune = target.dataset.rune;
		await BritannianMagicSD.selectRune(actor, rune);
		sheet.render(true);
	}

	static async _onIncreaseRune(event, actor, sheet, target) {
		const rune = target.dataset.rune;
		await BritannianMagicSD.increaseRune(actor, rune);
		sheet.render(true);
	}

	static async #onDecreaseRune(event, sheet, target) {
		const rune = target.dataset.rune;
		await BritannianMagicSD.decreaseRune(sheet.actor, rune);
		sheet.render(true);
	}

	static async _onFlipSpellBookLeft(event, actor, sheet) {
        if (!actor.system.britannian_magic.page) actor.system.britannian_magic.page = 1;
        actor.system.britannian_magic.page--;
		sheet.render(true);
	}

	static async _onFlipSpellBookRight(event, actor, sheet) {
        if (!actor.system.britannian_magic.page) actor.system.britannian_magic.page = 0;
        actor.system.britannian_magic.page++;
		sheet.render(true);
	}

	static async _onCastBritannianMagic(event, actor, sheet) {
        let spellOptions = {actor: actor, type: 'cast'};
        if (!this.britannianSpell)
            this.britannianSpell = new shadowdark.apps.BritannianSpellSD(spellOptions);
        else
            this.britannianSpell.setOptions(spellOptions);
        await this.britannianSpell.render(true);
	}

	static async _onWriteBritannianMagic(event, actor, sheet) {
        let spellOptions = {actor: actor, type: 'write'};
        if (!this.britannianSpell)
            this.britannianSpell = new shadowdark.apps.BritannianSpellSD(spellOptions);
        else
            this.britannianSpell.setOptions(spellOptions);
        await this.britannianSpell.render(true);
	}

	static async _onCastSpell(event, actor, sheet, target, type, spell) {
        const spellUuid = target.dataset.spellUuid;
        const spellbook = await actor.equippedSpellBook();
        if (!spellbook && type != 'freecast') return;
        if (!spell && type != 'freecast')
            spell = spellbook.system.spells.find(s => s.uuid == spellUuid);

        if (!spell) return;

        let castingBonus = actor.system.abilities.int.mod;
        if (actor.system.bonuses.spellcastingCheckBonus)
            castingBonus += actor.system.bonuses.spellcastingCheckBonus;

        let spellDC = 9 + shadowdark.apps.BritannianSpellSD.fullSpellCircle(spell);
		const options = {
            isSpell: true,
			magicCoreLevel: castingBonus,
            spellDC,
            target: spellDC,
            isHealing: spell.effect.isHealing,
            damage: spell.damage,
			magicType: 'britannian-magic',
            spellName: spell.name,
            powerLevel: shadowdark.apps.BritannianSpellSD.fullSpellCircle(spell),
            duration_desc: spell.duration ?? 'Instant',
            advantage: 0,
            power: spell,
            callback: type == 'freecast' ? this._freeCastCallback :  this._writtenCastCallback,
		};
		
		actor.rollMagic(castingBonus, options);
    }

    static async _freeCastCallback(result) {
		const resultMargin = result.rolls.main.roll._total - result.spellDC;
        const actor = result.actor;
        const spell = result.power;

        if (resultMargin < 0)
        {
            if (!spell || !actor)
                return;
            for (let spellRune of spell.runes ?? [])
            {
                for (let i = 0; i < actor.system.britannian_magic.runes.length; i++)
                {
                    if (actor.system.britannian_magic.runes[i].uuid === spellRune.uuid)
                        actor.system.britannian_magic.runes[i].lost = true;
                }
            }
			actor.update({"system.britannian_magic": actor.system.britannian_magic});
        }
        else
        {
            if ((spell.duration ?? 'instant').slugify() != 'instant')
            {
                await BritannianMagicSD._addActiveSpell(actor, spell, result);
                actor.sheet.render(true);
            }
            await BritannianMagicSD._doSummon(actor, spell, result);
            await BritannianMagicSD._applySpellToTargets(actor, spell, result);
        }
    }
    
    static async _writtenCastCallback(result) {
		const resultMargin = result.rolls.main.roll._total - result.spellDC;
        const actor = result.actor;
        const spell = result.power;

        if (resultMargin < 0)
        {
            if (!spell || !actor)
                return;
            const spellbook = await actor.equippedSpellBook();
            if (!spellbook) return;
            
            const writtenSpell = spellbook.system.spells.find(s => s.uuid == spell.uuid);
            if (!writtenSpell) return;
            writtenSpell.lost = true;
            await actor.updateEmbeddedDocuments("Item", [
                {
                    "_id": spellbook.id,
                    "system.spells": spellbook.system.spells
                },
            ]);
        }
        else
        {
            if ((spell.duration ?? 'instant').slugify() != 'instant')
            {
                await BritannianMagicSD._addActiveSpell(actor, spell, result);
                actor.sheet.render(true);
            }
            await BritannianMagicSD._doSummon(actor, spell, result);
            await BritannianMagicSD._applySpellToTargets(actor, spell, result);
        }
    }

    static async _addActiveSpell(actor, spell, result) {
        if (!actor.system.britannian_magic.active_spells) actor.system.britannian_magic.active_spells = [];
        var tokens = result.targetTokens ?? [];

        const effect = (await fromUuid(spell.effect.uuid)).toObject();
        spell.effect.img = effect.img;
        if (tokens.length)
            spell.target_tokens_uuids = tokens.map(t => t.actor.uuid);

        actor.system.britannian_magic.active_spells.push(spell);
		await actor.update({"system.britannian_magic": actor.system.britannian_magic});
    }

    static async _applySpellToTargets(actor, spell, result) {
        if (!actor || !spell) return;
        var tokens = result.targetTokens ?? [];

        const effect = await fromUuid(spell.effect.uuid);
        if (!effect) return;

		var embeddedEffects = await effect.getEmbeddedCollection("ActiveEffect");

        if ((spell.duration ?? '').slugify() === 'instant' || !embeddedEffects.contents.length)
            return;

        let effects = structuredClone(embeddedEffects.contents);
        effects = await BritannianMagicSD.applyEffectsByLevel(spell, effects);

        for (var token of tokens) {
            if (!game.user.isGM) {
                game.socket.emit(
                    "system.shadowdark",
                    {
                        type: "addSpellEffecstToActor",
                        data: {
                            tokenId: token.id,
                            caster: actor,
                            spellUuid: spell.uuid,
                            effects: effects,
                        },
                    }
                );
            } else {
                BritannianMagicSD.applyEffectsToToken(token, actor, effects, spell.uuid, spell.name);
            }
        }
    }

    static async applyEffectsByLevel(spell, effects) {
        for (let effect of effects) {
            let compendiumEffect = await fromUuid(effect.origin);
            if (compendiumEffect.system.change_effect_by)
            {
                const effectChangeBy = parseInt(compendiumEffect.system.change_effect_by);
                const effectChangeEach = parseInt(compendiumEffect.system.change_effect_each ?? '1');
                const spellCircle = shadowdark.apps.BritannianSpellSD.spellWbritordsCircle(spell);
                const effectIncreases = effectChangeBy * Math.floor(spellCircle / effectChangeEach);
                for (let change of effect.changes) {
                    if (UtilitySD.isNumeric(change.value))
                    {
                        change.value = parseInt(change.value) + effectIncreases;
                    }
                }
            }
        }
        return effects;
    }

    static async applyEffectsToToken(token, actor, effects, spellUuid, spellName) {
        if (!token || !token.actor || token.actor.system.deleted) return;
        for (let effect of effects)
        {
            //effect.sourceName = effect.name + ' cast by ' + actor.name;
            let [newEffect] = await token.actor.createEmbeddedDocuments("ActiveEffect", [effect]);
            if (newEffect)
            {
                newEffect.system.spellUuid = spellUuid;
                newEffect.system.casterName = 'Spell cast by: ' + actor.name;
                await token.actor.updateEmbeddedDocuments("ActiveEffect", [
                    {
                        "_id": newEffect._id,
                        "name": spellName,
                        "system": newEffect.system,
                    },
                ]);
            }
        }
    }

    static async removeEffectsFromToken(targetActor, actor, effects, spellUuid) {
        let effectIds = [];
		let embeddedEffects = await targetActor.getEmbeddedCollection("ActiveEffect");
        for (let embeddedEffect of embeddedEffects)
        {
            if (embeddedEffect.system.spellUuid && embeddedEffect.system.spellUuid === spellUuid)
                effectIds.push(embeddedEffect.id);
        }
        if (effectIds.length)
            await targetActor.deleteEmbeddedDocuments("ActiveEffect", effectIds);
    }

    static async createTokenAndActor(creatureUuid, casterId, spellUuid, isShapeshift) {
        if (!creatureUuid) return
        let creature = await fromUuid(creatureUuid);
        if (!creature) return;

        const casterToken = game.scenes.active.tokens.find(t => t.actor.id === casterId);
        if (!casterToken) return;

        const newActor = await Actor.create(creature);
        newActor.prototypeToken.img = newActor.img;
        await newActor.update({
            ownership: casterToken.actor.ownership
        });
        if (!isShapeshift)
        {
            newActor.system.summonedBy = casterToken.actor.id;
            newActor.system.summonSpell = spellUuid;
        }
        else
        {
            newActor.system.shapeshiftedBy = casterToken.id;
            newActor.system.shapeshiftSpell = spellUuid;
        }
        await newActor.update({
            system: newActor.system
        });

        let [x, y] = [casterToken.x, casterToken.y];
        if (!isShapeshift) [x, y] = UtilitySD.findNearestFreeGridPosition(casterToken.x, casterToken.y);
        if (isShapeshift) await canvas.scene.updateEmbeddedDocuments("Token", [{_id: casterToken.id, hidden: true}]);

        const tokenData = newActor.prototypeToken.toObject();
        tokenData.name = newActor.name;
        tokenData.displayName = 50;
        tokenData.disposition = 1;
        tokenData.img = newActor.img;
        tokenData.actorId = newActor.id;
        tokenData.actor = newActor;
        tokenData.hasPlayerOwner = true;
        tokenData.x = x;
        tokenData.y = y;
        tokenData.hidden = false;
        tokenData.vision = true;
        tokenData.actorLink = true;

        const [newToken] = await game.scenes.active.createEmbeddedDocuments("Token", [tokenData]);

        let actorSpell = casterToken.actor.system.britannian_magic.active_spells.find(s => s.uuid === spellUuid);
        if (!actorSpell) return;
        
        if (!actorSpell.target_tokens_uuids) actorSpell.target_tokens_uuids = [];
        actorSpell.target_tokens_uuids.push(newActor.uuid);
		await casterToken.actor.update({"system.britannian_magic": casterToken.actor.system.britannian_magic});

        const effect = await fromUuid(actorSpell.effect.uuid);
        if (effect)
        {
            var embeddedEffects = await effect.getEmbeddedCollection("ActiveEffect");
            if ((actorSpell.duration ?? '').slugify() !== 'instant' && embeddedEffects.contents.length)
            {
                let effects = structuredClone(embeddedEffects.contents);
                await BritannianMagicSD.applyEffectsToToken(newToken, casterToken.actor, effects, spellUuid, actorSpell.name);
            }
        }
    }

    static async deleteTokenAndActor(tokenId) {
        const token = game.scenes.active.tokens.find(t => t.id === tokenId);
        if (!token || !token.actor) return;
        game.scenes.active.deleteEmbeddedDocuments("Token", [tokenId]);
        if (token)
        {
            const actor = token.actor;
            if (actor) actor.delete();
        }
        token.actor.system.deleted = true;
    }

    static async _doSummon(actor, spell, result) {
        if (!spell.creatureUuid) return;
        const [isSummon, isShapeshift] = await BritannianMagicSD.isSummonOrShapeShift(spell.effect.uuid);
        if (!isSummon && !isShapeshift) return;

        if (!game.user.isGM) {
            game.socket.emit(
                "system.shadowdark",
                {
                    type: "createTokenAndActor",
                    data: {
                        creatureUuid: spell.creatureUuid,
                        actorId: actor.id,
                        spellUuid: spell.uuid,
                        isSummon,
                        isShapeshift
                    },
                }
            );
        } else {
            BritannianMagicSD.createTokenAndActor(spell.creatureUuid, actor.id, spell.uuid, isShapeshift);
        }
    }

    static async isSummonOrShapeShift(spellUuuid) {
        let isSummon = false;
        let isShapeshift = false;

        const spellEffect = await fromUuid(spellUuuid);
   		var embeddedEffects = await spellEffect.getEmbeddedCollection("ActiveEffect");
        for (let effect of embeddedEffects.contents) {
            for (let change of effect.changes)
            {
                if (change.key === 'system.bonuses.summon')
                    isSummon = true;
                if (change.key === 'system.bonuses.shapeshifted')
                    isShapeshift = true;
            }
        }
        return [isSummon, isShapeshift];
    }

	static async _onEditWrittenSpell(event, actor, sheet, target) {
        const spellUuid = target.dataset.spellUuid;
        const spellbook = await actor.equippedSpellBook();
        if (!spellbook) return;
        const spell = spellbook.system.spells.find(s => s.uuid == spellUuid);
        if (!spell) return;

        actor.system.britannian_magic.selected_runes = [];
		await actor.update({"system.britannian_magic": actor.system.britannian_magic});

        let spellOptions = {actor: actor, type: 'write', spell: spell};
        if (!this.britannianSpell)
            this.britannianSpell = new shadowdark.apps.BritannianSpellSD(spellOptions);
        else
            this.britannianSpell.setOptions(spellOptions);
        await this.britannianSpell.render(true);
    }

	static async _onEraseSpell(event, actor, sheet, target) {
        const spellUuid = target.dataset.spellUuid;
        const spellbook = await actor.equippedSpellBook();
        if (!spellbook) return;
        const spell = spellbook.system.spells.find(s => s.uuid == spellUuid);
        if (!spell) return;

		foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/erase-spell.hbs",
			{name: spell.name}
		).then(html => {
			foundry.applications.api.DialogV2.wait({
				classes: ["app", "shadowdark", "shadowdark-dialog", "window-app", 'themed', 'theme-light'],
				window: {
					resizable: false,
					title: "Confirm Deletion",
				},
                position: {
                    width: 400,
                    height: 113
                },
				content: html,
				buttons: [
					{
						action: 'Yes',
						icon: "<i class=\"fa fa-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
                            const spellIndex = spellbook.system.spells.indexOf(spell);
                            spellbook.system.spells.splice(spellIndex, 1);

                            await actor.updateEmbeddedDocuments("Item", [
                                {
                                    "_id": spellbook.id,
                                    "system.spells": spellbook.system.spells
                                },
                            ]);
                            sheet.render(true);
                        },
					},
					{
						action: 'Cancel',
						icon: "<i class=\"fa fa-times\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
					},
				],
				default: "Yes",
			});
		});
	}

    static getSpellParametersLines(spell) {
        let area = shadowdark.apps.BritannianSpellSD.getSpellArea(spell);
        let targets = shadowdark.apps.BritannianSpellSD.getSpellTargets(spell);
        let range = shadowdark.apps.BritannianSpellSD.getSpellRange(spell);
        let duration = shadowdark.apps.BritannianSpellSD.getSpellDuration(spell);
        let damage = shadowdark.apps.BritannianSpellSD.getSpellDamage(spell);
        let healing = spell.effect.isHealing;
        let resistance = shadowdark.apps.BritannianSpellSD.getSpellResistance(spell);
        let creature = shadowdark.apps.BritannianSpellSD.getSpellCreature(spell);

        let lines = [];

        let openDiv = '<div class="britannian-spell-parameter">';
        let closeDiv = '</div>';

        lines.push(openDiv + shadowdark.apps.BritannianSpellSD.getSpellCircle(spell) + closeDiv);

        if (area)
            lines.push(openDiv + game.i18n.localize("SHADOWDARK.britannian_spell.area") + " " + area + "." + closeDiv);
        else
            lines.push(openDiv + game.i18n.localize("SHADOWDARK.britannian_spell.targets") + " " + targets + "." + closeDiv);

        lines.push(openDiv + game.i18n.localize("SHADOWDARK.britannian_spell.range") + " " + range + "." + closeDiv);

        lines.push(openDiv + game.i18n.localize("SHADOWDARK.item.spell_duration") + " " + (UtilitySD.isObject(duration) ? 'instant' : duration) + "." + closeDiv);
        
        if (damage && !healing)
            lines.push(openDiv + game.i18n.localize("SHADOWDARK.item.damage") + " " + damage + "." + closeDiv);
        if (damage && healing)
            lines.push(openDiv + game.i18n.localize("SHADOWDARK.item.healing") + " " + damage + "." + closeDiv);

        if (resistance)
            lines.push(openDiv + game.i18n.localize("SHADOWDARK.item.talent_resistedBy") + " " + resistance + "." + closeDiv);

        if (creature)
            lines.push(openDiv + game.i18n.localize("SHADOWDARK.britannian_spell.creature") + ` <img class="BritannianSpell-EffectImage" style="border: 0; height: 20px" src="${creature.img}"> <a class="content-link uuid-link" data-link data-type="Actor" data-uuid="${spell.creatureUuid}" title="Actor">${creature.name}</a>` + "." + closeDiv);

        return lines;
    }

	static async _onRecoverRune(event, actor, sheet, target) {
		const rune = target.dataset.rune;
        var actorRune = actor.system.britannian_magic.runes.find(r => r.name === rune);
        if (actorRune)
        {
            if (!actorRune.lost)
                return;
            
            actorRune.lost = false;
			actor.update({"system.britannian_magic": actor.system.britannian_magic});
        }
        sheet.render(true);
    }

	static async _onRecoverSpell(event, actor, sheet, target) {
        const spellUuid = target.dataset.spellUuid;
        const spellbook = await actor.equippedSpellBook();
        if (!spellbook) return;
        const spell = spellbook.system.spells.find(s => s.uuid == spellUuid);
        if (!spell) return;

        spell.lost = false;
        await actor.updateEmbeddedDocuments("Item", [
            {
                "_id": spellbook.id,
                "system.spells": spellbook.system.spells
            },
        ]);
        sheet.render(true);
    }

	static async _onCancelSpell(event, actor, sheet, target) {
        const spellUuid = target.dataset.spellUuid;
        let spell = (actor.system.britannian_magic.active_spells ?? []).find(s => s.uuid === spellUuid);
        if (!spell)
            return;

        let effect, embeddedEffects;

        if (spell.effect) effect = await fromUuid(spell.effect?.uuid);
        if (effect) embeddedEffects = await effect.getEmbeddedCollection("ActiveEffect");
        if (spell.creatureUuid && spell.target_tokens_uuids) {
            BritannianMagicSD.checkCancelSummonOrShapeshiftSpell(effect, spell.target_tokens_uuids);
        }
        else if (spell.target_tokens_uuids) {
            for (let actorUuid of spell.target_tokens_uuids) {
                let targetActor = await fromUuid(actorUuid);
                if (!game.user.isGM) {
                    game.socket.emit(
                        "system.shadowdark",
                        {
                            type: "removeSpellEffecstFromActor",
                            data: {
                                tokenId: actorUuid,
                                caster: actor,
                                spellUuid: spell.uuid,
                                effects: embeddedEffects.contents,
                            },
                        }
                    );
                } else {
                    BritannianMagicSD.removeEffectsFromToken(targetActor, actor, embeddedEffects.contents, spell.uuid);
                }
            }
        }

        var spellIndex = actor.system.britannian_magic.active_spells.indexOf(spell);
        actor.system.britannian_magic.active_spells.splice(spellIndex, 1);
    	actor.update({"system.britannian_magic": actor.system.britannian_magic});
        sheet.render(true);
    }

    static async removeActiveSpell(actorUuid, spellUuid) {
        const actor = game.actors.get(actorUuid);
        if (!actor) return;
        let spell = (actor.system.britannian_magic.active_spells ?? []).find(s => s.uuid === spellUuid);
        if (!spell) return;

        var spellIndex = actor.system.britannian_magic.active_spells.indexOf(spell);
        actor.system.britannian_magic.active_spells.splice(spellIndex, 1);
    	actor.update({"system.britannian_magic": actor.system.britannian_magic});
        actor.sheet?.render(true);
    }

    static async checkCancelSummonOrShapeshiftSpell(spellEffect, targets) {
        for (let actorUuid of targets) {
            let targetActor = await fromUuid(actorUuid);
            await BritannianMagicSD.checkCancelSummonOrShapeshiftActor(targetActor);
        }
    }

	static async checkCancelSummonOrShapeshiftActor(target) {
        if (!target) return false;

		let casterToken, casterSpell;

		if (target.system.summonedBy) {
			casterToken = game.scenes.active.tokens.find(t => t.actor.id === target.system.summonedBy);
			casterSpell = casterToken.actor.system.britannian_magic.active_spells.find(s => s.uuid === target.system.summonSpell);
		} else if (target.system.shapeshiftedBy) {
			casterToken = game.scenes.active.tokens.find(t => t.id === target.system.shapeshiftedBy);
			casterSpell = casterToken.actor.system.britannian_magic.active_spells.find(s => s.uuid === target.system.shapeshiftSpell);
		}

		if (!casterToken) return false;

		let token = game.scenes.active.tokens.find(t => t.actor.id === target.id);
		if (!token) return false;

		if (target.system.summonedBy) {
			await BritannianMagicSD.removeActiveSpell(token.actor.system.summonedBy, token.actor.system.summonSpell);
		} else if (target.system.shapeshiftedBy) {
			await BritannianMagicSD.removeActiveSpell(casterToken.actor.id, token.actor.system.shapeshiftSpell);
            await BritannianMagicSD.endShapeShift(casterToken, token);
		}

        if (!game.user.isGM) {
            game.socket.emit(
                "system.shadowdark",
                {
                    type: "deleteTokenAndActor",
                    data: {
                        tokenId: token.id
                    },
                }
            );
        } else {
            if (token)
                await BritannianMagicSD.deleteTokenAndActor(token.id);
        }

        return true;
	}

    static async endShapeShift(casterToken, token) {
		let tokenHPpercentage = token.actor.system.attributes.hp.value / token.actor.system.attributes.hp.max;

        canvas.scene.updateEmbeddedDocuments("Token", [{_id: casterToken.id, hidden: false, x: token.x, y: token.y}]);
        casterToken.actor.applyHPpercentage(tokenHPpercentage);
    }
}
