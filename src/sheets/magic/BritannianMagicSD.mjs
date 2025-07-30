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

	static async _onCastWrittenSpell(event, actor, sheet, target) {
        const spellUuid = target.dataset.spellUuid;
        const spellbook = await actor.equippedSpellBook();
        if (!spellbook) return;
        const spell = spellbook.system.spells.find(s => s.uuid == spellUuid);
        if (!spell) return;
    }

	static async _onEditWrittenSpell(event, actor, sheet, target) {
        const spellUuid = target.dataset.spellUuid;
        const spellbook = await actor.equippedSpellBook();
        if (!spellbook) return;
        const spell = spellbook.system.spells.find(s => s.uuid == spellUuid);
        if (!spell) return;

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
        
        if (damage)
            lines.push(openDiv + game.i18n.localize("SHADOWDARK.item.damage") + " " + damage + "." + closeDiv);

        if (resistance)
            lines.push(openDiv + game.i18n.localize("SHADOWDARK.item.talent_resistedBy") + " " + resistance + "." + closeDiv);

        if (creature)
            lines.push(openDiv + game.i18n.localize("SHADOWDARK.britannian_spell.creature") + ` <img class="BritannianSpell-EffectImage" style="border: 0; height: 20px" src="${creature.img}"> <a class="content-link uuid-link" data-link data-type="Actor" data-uuid="${spell.creatureUuid}" title="Actor">${creature.name}</a>` + "." + closeDiv);

        return lines;
    }
}
