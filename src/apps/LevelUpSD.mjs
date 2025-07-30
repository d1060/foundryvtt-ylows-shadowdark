const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
export default class LevelUpSD extends HandlebarsApplicationMixin(ApplicationV2) {
	#dragDrop

	constructor(uid) {
	    super();
		this.firstrun = true;
		this.data = {};
		this.data.rolls = {
			hp: 0,
			hpEdit: false,
			talent: false,
			technique: false,
			boon: false,
		};
		this.data.actor = game.actors.get(uid);
		this.data.hpMod = 0;
		this.data.talents = [];
		this.data.techniques = [];
		this.data.spells = {};
		this.data.talentsRolled = false;
		this.data.talentsChosen = false;
		this.data.techniqueRolled = false;
		this.data.techniquesChosen = false;
		this.data.fixedTalentsGained = false;
		this.data.fixedTalents = [];

		for (let i = 1; i <= 5; i++) {
			this.data.spells[i] = {
				name: "Tier ".concat(i),
				max: 0,
				objects: [],
			};
		}
		this.#dragDrop = this.#createDragDropHandlers()
	}

	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["shadowdark", "level-up", "window-app", 'themed', 'theme-light'],
		position: {
    		width: 400,
    		height: "auto"
  		},
		window: {
			resizable: true,
    		title: 'SHADOWDARK.apps.level-up.title',
			controls: [],
  		},
		form: {
		    submitOnChange: false,
    		closeOnSubmit: true,
  		},
		dragDrop: [{dropSelector: ".items"}],
		actions: {
			rollHp: this.#onRollHP,
			reRollHp: this.#onReRollHP,
			rollMetalCoreHp: this.#onRollMetalCoreHP,
			reRollMetalCoreHp: this.#onReRollMetalCoreHP,
			viewBoonTable: this.#viewBoonTable,
			viewTalentTable: this.#viewTalentTable,
			viewTechniqueTable: this.#viewTechniqueTable,
			openSpellbook: this.#openSpellBook,
			deleteTalent: this.#onDeleteTalent,
			deleteTechnique: this.#onDeleteTechnique,
			deleteSpell: this.#onDeleteSpell,
			rollBoon: this.#onRollBoon,
			rollTalent: this.#onRollTalent,
			chooseTechnique: this.#onChooseTechnique,
			finalizeLevelUp: this.#onLevelUp,
		},
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/apps/level-up.hbs" }
	}

	/** @inheritdoc */
	_canDragDrop() {
		return true;
	}

	#createDragDropHandlers() {
		return this.options.dragDrop.map((d) => {
		d.permissions = {
			drop: this._canDragDrop.bind(this)
		};
		d.callbacks = {
			drop: this._onDrop.bind(this)
		};
		return new foundry.applications.ux.DragDrop(d);
		})
	}

	_onRender(context, options) {
    	this.#dragDrop.forEach((d) => d.bind(this.element))
  	}

	/** @override */
	async _prepareContext(options) {
		if (this.firstrun) {
			this.firstrun = false;
			this.data.class = await fromUuid(this.data.actor.system.class);
			this.data.talentTable = await fromUuid(this.data.class.system?.classTalentTable);
			this.data.techniqueTable = await fromUuid(this.data.class.system?.classTechniqueTable);
			this.data.currentLevel = this.data.actor.system.level.value;
			this.data.targetLevel =  this.data.currentLevel + 1;
			this.data.talentGained = (this.data.targetLevel % 2 !== 0);
			this.data.techniqueGained = this.data.class.system?.classTechniqueTable && (this.data.targetLevel === 1 || this.data.targetLevel % 2 !== 1);
			this.data.totalSpellsToChoose = 0;
			this.data.fixedTalentsGained = false;
			this.data.fixedTalents = [];

			this.data.patron = await fromUuid(this.data.actor.system.patron);

			this.data.boonTable = this.data.patron
				? await fromUuid(this.data.patron.system.boonTable)
				: undefined;

			this.data.startingBoons = 0;
			const classData = this.data.class.system;
			this.data.canRollBoons = classData.patron.required;

			const needsStartingBoons = classData.patron.required
				&& classData.patron.startingBoons > 0;

			if (this.data.targetLevel === 1 && needsStartingBoons) {
				this.data.startingBoons = classData.patron.startingBoons;
			}

			if (this.data.class?.system?.levelTalents)
			{
				for (var fixedTalent of this.data.class.system.levelTalents)
				{
					const fixedTalentObj = await fromUuid(fixedTalent);
					if (fixedTalentObj.system.talentClass === "level" && fixedTalentObj.system.level == this.data.targetLevel)
					{
						this.data.fixedTalentsGained = true;

						let talentObj = await shadowdark.effects.createItemWithEffect(fixedTalentObj, this.data.actor);
						talentObj.system.level = this.data.targetLevel;
						talentObj.uuid = fixedTalentObj.uuid;
						this.data.fixedTalents.push(talentObj);
						this.render();
					}
				}
			}

			if (await this.data.actor.isSpellCaster()) {
				this.data.spellcastingClass =
					this.data.class.system.spellcasting.class === ""
						? this.data.actor.system.class
						: this.data.class.system.spellcasting.class;

				// calculate the spells gained for the target level from the spells known table
				if (this.data.class.system.spellcasting.spellsknown) {
					// setup known spells for this level
					let currentSpells = {1: null, 2: null, 3: null, 4: null, 5: null};
					let targetSpells = {1: null, 2: null, 3: null, 4: null, 5: null};

					if (1 <= this.data.currentLevel && this.data.currentLevel <= 10) {
						currentSpells =
						this.data.class.system.spellcasting.spellsknown[this.data.currentLevel];
					}
					if (1 <= this.data.targetLevel && this.data.targetLevel <= 10) {
						targetSpells =
						this.data.class.system.spellcasting.spellsknown[this.data.targetLevel];
					}

					Object.keys(targetSpells).forEach(k => {
						this.data.spells[k].max = targetSpells[k] - currentSpells[k];
						this.data.totalSpellsToChoose += this.data.spells[k].max;
					});
				}
				else {
					ui.notifications.warn("Class missing Spells Known Table");
				}

			}
		}
		this.data.talentsRolled = this.data.rolls.talent || this.data.rolls.boon;
		this.data.talentsChosen = this.data.talents.length > 0;
		this.data.techniqueRolled = this.data.rolls.technique;
		this.data.techniquesChosen = this.data.techniques.length > 0;
		this.data.hpMod = this.data.actor.system.abilities.con.mod + (this.data.actor.system.bonuses.hardy ? this.data.actor.system.abilities.str.mod : 0);

		this.data.hpRollMode = game.settings.get("shadowdark", "useFixedHP");
		if (this.data.hpRollMode != 0)
		{
			let classHPparts = this.data.class.system.hitPoints.split("d");
			var classHP = classHPparts[1];
			const hpData = {
				rollType: "hp",
				actor: this.data.actor,
			};
			let advantage = 0;
			if (hpData.actor?.hasAdvantage(hpData)) advantage = 1;
			
			this.data.fixedFracHp = 0;
			this.data.metalCorefixedFracHp = 0;

			if (this.data.targetLevel == 1)
			{
				this.data.fixedHp = parseInt(classHP);
				if (advantage)
					this.data.fixedHp *= 0.5;
			}
			else
			{
				this.data.fixedHp = (this.data.actor.system.attributes.hp.frac ?? 0) - (this.data.actor.system.attributes.hp.base ?? 0);
				if (this.data.fixedHp < 0) this.data.fixedHp = 0;

				switch (this.data.hpRollMode)
				{
					case 1: // Full HP
						if (advantage) this.data.fixedFracHp += parseInt(classHP) * 0.5;
						else this.data.fixedFracHp += parseInt(classHP);
					break;
					case 2: // 75% HP
						if (advantage) this.data.fixedFracHp += parseInt(classHP);
						else this.data.fixedFracHp += (parseInt(classHP) + 1) * 0.75;
					break;
					case 3: // Half HP
						if (advantage) this.data.fixedFracHp += (parseInt(classHP) + 1) * 0.75;
						else this.data.fixedFracHp += (parseInt(classHP) + 1) * 0.5;
					break;
				}
			}

			if (this.data.actor.system.magic.type === "metalMagic")
			{
				this.data.metalCorefixedHp = (this.data.actor.system.magic.metalCore.hp.frac ?? 0) - (this.data.actor.system.magic.metalCore.hp.base ?? 0);
				if (this.data.metalCorefixedHp < 0) this.data.metalCorefixedHp = 0;

				switch (this.data.hpRollMode)
				{
					case 1: // Full HP
						if (advantage) this.data.metalCorefixedFracHp += 8 * 0.5;
						else this.data.metalCorefixedFracHp += 8;
					break;
					case 2: // 75% HP
						if (advantage) this.data.metalCorefixedFracHp += 8;
						else this.data.metalCorefixedFracHp += (8 + 1) * 0.75;
					break;
					case 3: // Half HP
						if (advantage) this.data.metalCorefixedFracHp += (8 + 1) * 0.75;
						else this.data.metalCorefixedFracHp += (8 + 1) * 0.5;
					break;
				}

				this.data.metalCorefixedHp += this.data.metalCorefixedFracHp
				this.data.rolls.metalCoreHp = Math.floor(this.data.metalCorefixedHp);
			}

			this.data.fixedHp += this.data.fixedFracHp
			this.data.rolls.hp = Math.floor(this.data.fixedHp);
		}

		return this.data;
	}

	/** @override */
	async _onDrop(event) {
		// get item that was dropped based on event
		const eventData = foundry.applications.ux.TextEditor.getDragEventData(event);
		const itemObj = await fromUuid(eventData.uuid);

		if (itemObj && eventData.type === "Item") {
			switch (itemObj.type) {
				case "Talent":
				 	this._onDropTalent(itemObj);
					break;
				case "Spell":
					this._onDropSpell(itemObj);
					break;
				default:
					break;
			}
		}
	}

	static async #viewBoonTable() {
		this.data.boonTable.sheet.render(true);
	}

	static async #viewTalentTable() {
		this.data.talentTable.sheet.render(true);
	}

	static async #viewTechniqueTable() {
		this.data.techniqueTable.sheet.render(true);
	}

	static async #openSpellBook() {
		this.data.actor.openSpellBook();
	}

	static async #onRollHP({isReroll = false}) {
		const data = {
			rollType: "hp",
			actor: this.data.actor,
		};
		let options = {};

		options.title = isReroll
			? game.i18n.localize("SHADOWDARK.dialog.hp_re_roll.title")
			: game.i18n.localize("SHADOWDARK.dialog.hp_roll.title");

		options.flavor = options.title;
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-hp.hbs";
		options.fastForward = true;

		let parts = [this.data.class.system.hitPoints];
		let advantage = 0;
		if (data.actor?.hasAdvantage(data)) advantage = 1;

		const result = await CONFIG.DiceSD.Roll(parts, data, false, advantage, options);

		this.data.rolls.hp = result.rolls.main.roll.total;
		ui.sidebar.changeTab("chat", "primary");
		this.render();
	}

	static async #onReRollHP() {
		Dialog.confirm({
			title: "Re-Roll HP",
			content: "Are you sure you want to re-roll hit points?",
			yes: () => this.#onRollHP({isReroll: true}),
			no: () => null,
			defaultYes: false,
		  });
	}

	static async #onRollMetalCoreHP({isReroll = false}) {
		const data = {
			rollType: "metalCoreHp",
			actor: this.data.actor,
		};
		let options = {};

		options.title = isReroll
			? game.i18n.localize("SHADOWDARK.dialog.hp_re_roll.title")
			: game.i18n.localize("SHADOWDARK.dialog.hp_roll.title");

		options.flavor = options.title;
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-hp.hbs";
		options.fastForward = true;

		let parts = ["1d8"];
		let advantage = 0;

		const result = await CONFIG.DiceSD.Roll(parts, data, false, advantage, options);

		this.data.rolls.metalCoreHp = result.rolls.main.roll.total;
		ui.sidebar.changeTab("chat", "primary");
		this.render();
	}
	
	static async #onReRollMetalCoreHP() {
		Dialog.confirm({
			title: "Re-Roll Metal Core HP",
			content: "Are you sure you want to re-roll the metal core's hit points?",
			yes: () => this.#onRollMetalCoreHP({isReroll: true}),
			no: () => null,
			defaultYes: false,
		  });
	}

	static async #onRollBoon() {
		if (!this.data.boonTable) {
			return ui.notifications.warn(
				game.i18n.localize("SHADOWDARK.apps.level-up.errors.missing_boon_table")
			);
		}

		await this.data.boonTable.draw();
		ui.sidebar.changeTab("chat", "primary");

		if (this.data.targetLevel > 1) {
			this.data.rolls.talent = true;
		}
		this.data.rolls.boon = true;

		this.render();
	}

	static async #onRollTalent() {
		await this.data.talentTable.draw();
		ui.sidebar.changeTab("chat", "primary");

		// Humans get extra talent at level 1 with the ambitious talent
		if (this.data.targetLevel === 1) {
			let ambitious = this.data.actor.items.find(x => x.name === "Ambitious");
			if (ambitious) {
				ChatMessage.create({
					flavor: "Ambitious",
					content: `${ambitious.system.description}`,
				});
				await this.data.talentTable.draw();
			}
		}

		if (this.data.targetLevel > 1) {
			this.data.rolls.boon = true;
		}
		this.data.rolls.talent = true;

		this.render();
	}
	
	static async #onChooseTechnique() {
		await this.data.techniqueTable.draw();
		ui.sidebar.changeTab("chat", "primary");
		this.data.rolls.technique = true;
		this.render();
	}

	async _onDropTalent(talentItem)
	{
		if (this.data.techniqueGained && talentItem.system.talentClass === "technique")
		{
			// checks for effects on talent and prompts if needed
			let talentObj = await shadowdark.effects.createItemWithEffect(talentItem, this.data.actor);
			talentObj.system.level = this.data.targetLevel;
			talentObj.uuid = talentItem.uuid;
			this.data.techniques.push(talentObj);
			this.render();
		}
		else if (this.data.talentGained)
		{
			// checks for effects on talent and prompts if needed
			let talentObj = await shadowdark.effects.createItemWithEffect(talentItem, this.data.actor);
			talentObj.system.level = this.data.targetLevel;
			talentObj.uuid = talentItem.uuid;
			this.data.talents.push(talentObj);
			this.render();
		}
		//shadowdark.debugObject(talentItem);
	}

	static async #onDeleteTalent(event) {
		this.data.talents.splice(event.target.dataset.index, 1);
		this.render();
	}
	
	static async #onDeleteTechnique(event) {
		this.data.techniques.splice(event.target.dataset.index, 1);
		this.render();
	}

	_onDropSpell(spellObj) {
		let spellTier = spellObj.system.tier;
		// Check to see if the spell is out of bounds
		if (1 > spellTier > 5) {
			ui.notifictions.error("Spell tier out of range");
			return;
		}
		// add spell if there is room in that tier
		if (this.data.spells[spellTier].objects.length < this.data.spells[spellTier].max) {
			this.data.spells[spellTier].objects.push(spellObj);
		}
		this.render();
	}

	static async #onDeleteSpell(event) {
		// get tier and index from passed event and remove that spell from array
		let tier = event.target.dataset.tier;
		let index = event.target.dataset.index;
		this.data.spells[tier].objects.splice(index, 1);
		this.render();
	}

	static async #onLevelUp() {

		let spellsSelected = true;
		for (let i = 1; i <= 5; i++) {
			if (this.data.spells[i].max > this.data.spells[i].objects.length) {
				spellsSelected = false;
			}
		}

		// Are all selections complete?
		if (this.data.rolls.hp <= 0 ||
			(this.data.rolls.metalCoreHp <= 0 && this.data.actor.system.magic.type === "metalMagic") ||
			(this.data.talentGained && this.data.talents.length < 1) ||
			(this.data.techniqueGained && this.data.techniques.length < 1) ||
			!spellsSelected )
		{
			Dialog.confirm({
				title: game.i18n.localize("SHADOWDARK.apps.level-up.missing_selections"),
				content: game.i18n.localize("SHADOWDARK.apps.level-up.prompt"),
				yes: () => this._finalizeLevelUp(),
				no: () => null,
				defaultYes: false,
			});
		}
		else
			this._finalizeLevelUp();
	}

	async _finalizeLevelUp() {
		// update actor XP and level
		let newXP = 0;

		// carry over XP for all levels except level 0
		if (this.data.currentLevel > 0) {
			newXP = this.data.actor.system.level.xp - (this.data.actor.system.level.value * 10);
		}

		// Add items first as they may include HP / Con bonuses
		let allItems = [
			...this.data.talents,
			...this.data.techniques,
			...this.data.fixedTalents,
		];

		// load all spells into allItems
		for (let i = 1; i <= 5; i++) {
			allItems = [
				...allItems,
				...this.data.spells[i].objects,
			];
		}

		// Names for audit log
		const itemNames = [];
		allItems.forEach(x => itemNames.push(x.name));

		// add talents and spells to actor
		await this.data.actor.createEmbeddedDocuments("Item", allItems);

		// calculate new HP base
		let newBaseHP = this.data.actor.system.attributes.hp.base + this.data.rolls.hp;
		let newValueHP = parseInt(this.data.actor.system.attributes.hp.value) + this.data.rolls.hp;
		let newMaxHP = newBaseHP + this.data.actor.system.attributes.hp.bonus;
		let newFracHP = this.data.actor.system.attributes.hp.frac ?? 0;

		this.data.hpRollMode = game.settings.get("shadowdark", "useFixedHP");
		if (this.data.hpRollMode != 0)
		{
			newFracHP += this.data.fixedFracHp;
			newBaseHP = Math.floor(newFracHP);
			newValueHP = parseInt(this.data.actor.system.attributes.hp.value) + this.data.rolls.hp;
			newMaxHP = newBaseHP + this.data.actor.system.attributes.hp.bonus;
		}

		if (this.data.targetLevel === 1) {
			let hpMod = this.data.actor.system.abilities.con.mod + (this.data.actor.system.bonuses.hardy ? this.data.actor.system.abilities.str.mod : 0);
			// apply conmod to a set minimum 1 HP
			if ((this.data.rolls.hp + hpMod) > 1)
			{
				newBaseHP = this.data.rolls.hp + hpMod;
				newFracHP = this.data.rolls.hp + hpMod;
			}
			else {
				newBaseHP = 1;
				newFracHP = 1;
			}
			newValueHP = newBaseHP + this.data.actor.system.attributes.hp.bonus;
			newMaxHP = newValueHP;
		}

		// load audit log, check for valid data, add new entry
		let auditLog = this.data.actor.system?.auditlog ?? {};
		if (auditLog.constructor !== Object) auditLog = {};

		auditLog[this.data.targetLevel] = {
			baseHP: newBaseHP,
			itemsGained: itemNames,
		};
		
		if (this.data.actor.system.magic.type === "metalMagic")
		{
			if (!this.data.actor.system.magic.metalCore.hp)
				this.data.actor.system.magic.metalCore.hp = { base: 0, value: 0, frac: 0 };

			this.data.actor.system.magic.metalCore.hp.base += this.data.rolls.metalCoreHp;
			this.data.actor.system.magic.metalCore.hp.value = parseInt(this.data.actor.system.magic.metalCore.hp.value) + this.data.rolls.metalCoreHp;

			await this.data.actor.update({
				"system.magic.metalCore.hp.base": this.data.actor.system.magic.metalCore.hp.base,
				"system.magic.metalCore.hp.value": this.data.actor.system.magic.metalCore.hp.value,
			});
		}

		// update values on actor
		await this.data.actor.update({
			"system.attributes.hp.base": newBaseHP,
			"system.attributes.hp.max": newMaxHP,
			"system.attributes.hp.value": newValueHP,
			"system.attributes.hp.frac": newFracHP,
			"system.auditLog": auditLog,
			"system.level.value": this.data.targetLevel,
			"system.level.xp": newXP,
		});

		this.close();
	}
}
