import CompendiumsSD from "../documents/CompendiumsSD.mjs";
import UtilitySD from "../utils/UtilitySD.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
export default class RollDialogSD extends HandlebarsApplicationMixin(ApplicationV2) {
	constructor(params) {
		super(params);

		this.rollParts = params.parts;
		this.data = params.data;
        this.rollOptions = params.options;

		if (!this.rollOptions.title) {
			this.rollOptions.title = game.i18n.localize("SHADOWDARK.dialog.roll");
		}

        this.dialogTemplate = this.rollOptions.dialogTemplate
			? this.rollOptions.dialogTemplate
			: "systems/shadowdark/templates/dialog/roll-dialog.hbs";
    }

	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["shadowdark", "shadowdark-dialog", "window-app", 'themed', 'theme-light', 'standard-form'],
		position: {
    		width: "auto",
    		height: "auto"
  		},
		window: {
			resizable: false,
    		title: 'SHADOWDARK.dialog.cast_roll.title',
			controls: [],
  		},
		form: {
			handler: this.#onSubmit,
		    submitOnChange: true,
    		closeOnSubmit: false,
			closeOnEscape: true,
            modal: true,
  		},
		actions: {
			rollButton: this.#onRoll,
		},
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/dialog/roll-dialog-base.hbs" }
	}

	/** @inheritdoc */
	get title() {
		return this.rollOptions.title;
	}


	async _prepareContext(options) {
		shadowdark.resetTimestamp();
		shadowdark.logTimestamp(`RollDialogSD _prepareContext START`);
		this.data.damageDisadvantage = false;
		//const context = await super._prepareContext(options);
		this.advantageTooltip = this.rollOptions.advantageTooltip ?? "";
		if (this.data.advantage && this.advantageTooltip === "")    this.advantageTooltip = game.i18n.localize("SHADOWDARK.dialog.tooltip.talent_advantage");
		if (this.data.disadvantage && this.advantageTooltip === "") this.advantageTooltip = game.i18n.localize("SHADOWDARK.dialog.tooltip.talent_disadvantage");
		let advantageCount = 0;

		if (this.data.actor?.system?.bonuses?.advantageOnAllAttacks)
		{
			advantageCount++;
			if (this.advantageTooltip !== "") this.advantageTooltip += "\n";
			this.advantageTooltip += game.i18n.localize("SHADOWDARK.dialog.tooltip.advantage_on_all_attacks");
		}

		var tokens = CONFIG.DiceSD.selectedTokens();
		shadowdark.logTimestamp(`RollDialogSD _prepareContext checking tokens`);
		if (tokens.some(t => t.actor.system?.bonuses?.displacementField))
		{
			advantageCount--;
			if (this.advantageTooltip !== "") this.advantageTooltip += "\n";
			this.advantageTooltip += game.i18n.localize("SHADOWDARK.dialog.tooltip.displacement_disadvantage");
		}

		shadowdark.logTimestamp(`RollDialogSD _prepareContext checking advantage`);
		if (this.data.item?.isWeapon())
		{
			if(!(await this.data.actor.isProficient(this.data.item)))
			{
				advantageCount--;
				if (this.advantageTooltip !== "") this.advantageTooltip += "\n";
				this.advantageTooltip += game.i18n.localize("SHADOWDARK.dialog.tooltip.not_proficient_with_weapon");
			}
		}

		shadowdark.logTimestamp(`RollDialogSD _prepareContext checking advantage is armor equipped`);
		if(!(await this.data.actor.isProficientWithAllEquippedArmor()))
		{
			advantageCount--;
			if (this.advantageTooltip !== "") this.advantageTooltip += "\n";
			this.advantageTooltip += game.i18n.localize("SHADOWDARK.dialog.tooltip.not_proficient_with_armor");
		}

		shadowdark.logTimestamp(`RollDialogSD _prepareContext checking advantage is blind`);
		if (this.data.actor?.system.penalties?.blindness)
		{
			advantageCount--;
			if (this.advantageTooltip !== "") this.advantageTooltip += "\n";
			this.advantageTooltip += game.i18n.localize("SHADOWDARK.dialog.tooltip.blinded");
		}
		else if (this.rollOptions.targetToken && this.rollOptions.targetToken.actor?.system.penalties?.blindness)
		{
			advantageCount++;
			if (this.advantageTooltip !== "") this.advantageTooltip += "\n";
			this.advantageTooltip += game.i18n.localize("SHADOWDARK.dialog.tooltip.blinded_target");
		}

		shadowdark.logTimestamp(`RollDialogSD _prepareContext checking advantage is weapon disadvantage`);
		if (this.data.actor?.system.penalties?.disadvantage && this.data.item?.typeSlug === 'weapon') {
			if (this.data.item.system.type === 'ranged' && this.data.actor.system.penalties.disadvantage.includes('ranged-attack')) {
				advantageCount--;
				if (this.advantageTooltip !== "") this.advantageTooltip += "\n";
				this.advantageTooltip += game.i18n.localize("SHADOWDARK.dialog.tooltip.conditionDisadvantage");
			}
			else if (this.data.item.system.type === 'melee' && this.data.actor.system.penalties.disadvantage.includes('melee-attack')) {
				advantageCount--;
				if (this.advantageTooltip !== "") this.advantageTooltip += "\n";
				this.advantageTooltip += game.i18n.localize("SHADOWDARK.dialog.tooltip.conditionDisadvantage");
			}

			if (this.data.item.system.type === 'ranged' && this.data.actor.system.penalties.disadvantage.includes('ranged-damage')) {
				this.data.damageDisadvantage = true;
			}
			else if (this.data.item.system.type === 'melee' && this.data.actor.system.penalties.disadvantage.includes('melee-damage')) {
				this.data.damageDisadvantage = true;
			}
		}

		shadowdark.logTimestamp(`RollDialogSD _prepareContext checking advantage count`);
		if (advantageCount > 0)
		{
			if (this.data.disadvantage)
			{
				 this.data.disadvantage = false;
				 advantageCount--;
			}
			if (!this.data.advantage && advantageCount > 0) this.data.advantage = true;
		}
		else if (advantageCount < 0)
		{
			if (this.data.advantage)
			{
				this.data.advantage = false;
				advantageCount++;
			}
			if (!this.data.disadvantage && advantageCount < 0) this.data.disadvantage = true;
		}

		if (this.data.actor?.system?.bonuses?.targetLock) this.data.targetLock = true;

		shadowdark.logTimestamp(`RollDialogSD _prepareContext checking pack tactics`);
		if (this.data.actor?.system?.bonuses?.packTactics)
		{
			if (!this.data.talentBonus) this.data.talentBonus = 0;
			this.data.talentBonus += this.packTacticsBonus(this.data.actor);
		}

		if (this.data.actor?.system?.bonuses?.poisonPenalty)
		{
			if (!this.data.talentBonus) this.data.talentBonus = 0;
			this.data.talentBonus += this.data.actor?.system?.bonuses?.poisonPenalty;
		}

		const showHitLocation = game.settings.get("shadowdark", "hitLocation");
        if (showHitLocation) {
			if (this.rollOptions.targetToken) {
				let [actorAc, acTooltip, isMetallic, metallicPart] = await this.rollOptions.targetToken.actor?.getArmorClass(this.data.hitLocation?.name ?? 'Chest') ?? [0, '', false, 0];
				this.rollOptions.target = actorAc;
			}
		}

		shadowdark.logTimestamp(`RollDialogSD _prepareContext getting roll dialog content`);
        this.content = await CONFIG.DiceSD._getRollDialogContent(this.rollParts, this.data, this.rollOptions);

        const context = {
            content: this.content,
			data: this.data,
			title: this.rollOptions.title,
			formula: Array.from(this.rollParts).join(" + "),
			rollModes: CONFIG.Dice.rollModes,
			rollMode: this.rollOptions.rollMode,
			target: this.rollOptions.target,
            dialogTemplate: this.dialogTemplate,
			showHitLocation
		};

		shadowdark.logTimestamp(`RollDialogSD _prepareContext checking hit location`);
        if (context.showHitLocation) {
			if (this.rollOptions.targetToken && this.rollOptions.targetToken.actor?.system?.bodySetup)
				this.bodyType = await fromUuidSync(this.rollOptions.targetToken.actor.system.bodySetup);

			if (!this.bodyType) {
            	let defaultBodyType = await CompendiumsSD.defaultBodySetup(true);
            	this.bodyType = defaultBodyType;
			}

            if (this.bodyType)
			{
                context.bodyParts = [];
				for (let i = 0; i < this.bodyType.system.bodyParts.length; i++)
				{
					let bodyPart = this.bodyType.system.bodyParts[i];
					bodyPart.idx = i;
					if (!CONFIG.SHADOWDARK.VITAL_HIT_LOCATIONS.includes(bodyPart.effect) || this.data.actor?.system.bonuses?.vitalStrike)
						context.bodyParts.push(bodyPart);
				}
			}
			else
                context.showHitLocation = false;

			if (this.data.hitLocationIndex == null) {
				if (this.data.actor.type == 'NPC') {
					this.data.hitLocationIndex = 'random';
				} else {
					this.data.hitLocationIndex = this.bodyType?.system.bodyParts.length - 2;
					if (this.data.hitLocationIndex < 0) this.data.hitLocationIndex = 0;
				}
			}

			context.hitLocationIndex = UtilitySD.parseIntIfNumeric(this.data.hitLocationIndex);
			this.data.hitLocation = RollDialogSD.getBodyPartFromIndex(this.bodyType?.system.bodyParts, this.data.hitLocationIndex, this.data.actor);
        }

		shadowdark.logTimestamp(`RollDialogSD _prepareContext final touch ups`);
        if (this.data.actor?.hasAdvantage(this.data))
        {
            context.advantageTooltip = this.advantageTooltip;
            context.advantageHighlight = "talent-highlight";
        }

        if (this.data.disadvantage)
        {
            context.disadvantageTooltip = this.advantageTooltip;
            context.disadvantageHighlight = "talent-highlight";
        }

		shadowdark.logTimestamp(`RollDialogSD _prepareContext END`);
		return context;
	}

	async _onRender(context, options) {
		shadowdark.logTimestamp(`RollDialogSD _onRender START`);
		await super._onRender(context, options);

        let showHitLocation = game.settings.get("shadowdark", "hitLocation");
        if (showHitLocation) {
            if (this.bodyType) {
				const mainDiv = this.element.querySelector(".rollDialogWithHitLocation");

                const hitLocation = this.element.querySelector('.hitLocationSelector');
				const parentRect = hitLocation.getBoundingClientRect();
				const parentH = Math.max(1, Math.round(parentRect.height));

				const bgPart = this.bodyType.system.bodyParts.find(p => p.name === "Background") ?? this.bodyType.system.bodyParts[0];
				const bgTex = await foundry.canvas.loadTexture(bgPart.image);
				const { frame: bgFrame, baseTexture: bgBase } = bgTex;
				const bgW = bgFrame.width;
				const bgH = bgFrame.height;
				this.hitLocationPanelWidth = Math.round((bgW / bgH) * parentH);
				hitLocation.style.width = this.hitLocationPanelWidth + 'px';

				mainDiv.style.gridTemplateColumns = "1fr " + this.hitLocationPanelWidth + "px";

				const dpr = window.devicePixelRatio || 1;

                this.hitLocationContexts = [];
                this.hitLocationCanvasses = [];
				shadowdark.logTimestamp(`RollDialogSD _onRender Loading Body Parts`);
                for (let bodyPart of this.bodyType.system.bodyParts) {
					if (CONFIG.SHADOWDARK.VITAL_HIT_LOCATIONS.includes(bodyPart.effect) && !(this.data.actor?.system.bonuses?.vitalStrike))
						continue;

					shadowdark.logTimestamp(`RollDialogSD _onRender Loading Body Part ${bodyPart.name}`);
                    let texture = await foundry.canvas.loadTexture(bodyPart.image);
                    const { frame, baseTexture } = texture;
                    //const w = frame.width;
                    //const h = frame.height;
                    const canvas = this.element.querySelector('.hitLocationSelector canvas[name="' + bodyPart.name + '"]');
                    const src = baseTexture.resource.source;
					shadowdark.logTimestamp(`RollDialogSD _onRender Loading Body Part ${bodyPart.name} - Loaded Image`);

					canvas.width = Math.max(1, Math.round(this.hitLocationPanelWidth * dpr));
					canvas.height = Math.max(1, Math.round(parentH * dpr));

					// 2) Set the canvas *CSS* size in CSS pixels
					canvas.style.position = "absolute";
					canvas.style.top = "0";
					canvas.style.left = parentRect.left;
					canvas.style.width = `${this.hitLocationPanelWidth}px`;
					canvas.style.height = `${parentH}px`;

					// 3) Draw scaled to the canvas size
					const ctx = canvas.getContext('2d', { willReadFrequently: true });
					shadowdark.logTimestamp(`RollDialogSD _onRender Loading Body Part ${bodyPart.name} - Got Context`);
					ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // map CSS px to device px for crispness
					ctx.clearRect(0, 0, this.hitLocationPanelWidth, parentH);
					ctx.drawImage(
						src,
						frame.x, frame.y, frame.width, frame.height, // source sub-rect
						0, 0, this.hitLocationPanelWidth, parentH                        // destination scaled to canvas box
					);

                    this.hitLocationCanvasses.push(canvas);
                    this.hitLocationContexts.push(ctx);
					shadowdark.logTimestamp(`RollDialogSD _onRender Loaded Body Part ${bodyPart.name}`);
                }
				
                if (hitLocation != null)
                {
                    hitLocation.addEventListener("mousemove", (event) => {
                        this._onHitLocationMouseMove(event);
                    });

                    hitLocation.addEventListener("click", (event) => {
                        this._onHitLocationClick(event);
                    });
				}
            }
        }
		shadowdark.logTimestamp(`RollDialogSD _onRender END`);
    }

	static async #onSubmit(event, form, formData) {
		switch (event.target.name)
		{
			case "check-type":
				this.params.checkType = event.target.dataset.value;
				break;
			case "ability-bonus":
				this.data.abilityBonus = parseInt(event.target.value);
				break;
			case "item-bonus":
				this.data.itemBonus = parseInt(event.target.value);
				break;
			case "talent-bonus":
				this.data.talentBonus = parseInt(event.target.value);
				break;
			case "rollMode":
				this.rollOptions.rollMode = event.target.value;
				break;
			case "damage":
				this.data.itemDamage.value = event.target.value;
				break;
			case "weapon-backstab":
				this.data.backstab = event.target.checked;
				break;
			case "hitLocation":
				this.data.hitLocationIndex = event.target.value;
				this.data.hitLocation = RollDialogSD.getBodyPartFromIndex(this.bodyType.system.bodyParts, this.data.hitLocationIndex, this.data.actor);
				break;
		}
        if (event.target.name.startsWith("extraDamage_"))
        {
            let extraDamageIndex = parseInt(event.target.name.replace("extraDamage_", ""));
            this.data.itemExtraDamage[extraDamageIndex].damage = event.target.value;
        }

		this.render(true);
	}
	static async #onRoll(event, html) {
		const rollButton = event.target.dataset.button;

		var advantage = 0;
		if (rollButton === "advantage")
			advantage = 1;
		else if (rollButton === "disadvantage")
			advantage = -1;

		if (game.settings.get("shadowdark", "hitLocation"))
		{
			this.data.hitLocationBonus = this.data.hitLocation?.toHit ?? 0;
		}

		// At this point, damage parts must have already been resolved.
		if (this.data.damageParts && this.data.damageParts.length) this.data.damageParts = [];

        CONFIG.DiceSD.Roll(this.rollParts, this.data, event.currentTarget, advantage, this.rollOptions);
        this.close();
    }

    async _onHitLocationMouseMove(event) {
		const selectedIndex = this.selectedBodyPartIndex(event);

		for (let i = 0, a = 0; i < this.bodyType.system.bodyParts.length; i++) {
			let bodyPart = this.bodyType.system.bodyParts[i];
			if (CONFIG.SHADOWDARK.VITAL_HIT_LOCATIONS.includes(bodyPart.effect) && !(this.data.actor?.system.bonuses?.vitalStrike))
				continue;

			if (bodyPart.name == 'Background')
			{
				this.hitLocationCanvasses[a].hidden = false;
				a++;
				continue;
			}

			if (selectedIndex == i || i == this.data.hitLocationIndex)
				this.hitLocationCanvasses[a].hidden = false;
			else
				this.hitLocationCanvasses[a].hidden = true;
			a++;
		}
    }

	async _onHitLocationClick(event) {
		const selectedIndex = this.selectedBodyPartIndex(event);
		if (selectedIndex == -1) return;
		this.data.hitLocationIndex = selectedIndex;
		this.data.hitLocation = RollDialogSD.getBodyPartFromIndex(this.bodyType.system.bodyParts, this.data.hitLocationIndex, this.data.actor);
		this.render(true);
	}

	selectedBodyPartIndex(event) {
		const baseCanvas = this.element.querySelector('.hitLocationSelector canvas[name="Background"]');

		const dispW = baseCanvas.clientWidth;
		const dispH = baseCanvas.clientHeight;

		const natW = baseCanvas.width;
		const natH = baseCanvas.height;

		let scaleX = natW / dispW;
		let scaleY = natH / dispH;

		const rect = event.currentTarget.getBoundingClientRect();

		const x = (event.clientX - rect.left) * scaleX;
		const y = (event.clientY - rect.top) * scaleY;

		for (let i = 0, a = 0; i < this.bodyType.system.bodyParts.length; i++) {
			let bodyPart = this.bodyType.system.bodyParts[i];
			if (CONFIG.SHADOWDARK.VITAL_HIT_LOCATIONS.includes(bodyPart.effect) && !(this.data.actor?.system.bonuses?.vitalStrike))
				continue;

			if (bodyPart.name == 'Background')
			{
				this.hitLocationCanvasses[a].hidden = false;
				a++;
				continue;
			}

			let ctx = this.hitLocationContexts[a];
			const { data } = ctx.getImageData(x|0, y|0, 1, 1);
			let alpha = data[3];
			if (alpha > 0)
			{
				return i;
			}
			a++;
		}
		return -1;
	}

	static getBodyPartFromIndex(bodyParts, index, actor) {
		if (!bodyParts)
			return null;
		if (UtilitySD.isNumeric(index) && index >= 0 && index < bodyParts.length) {
			return bodyParts[index];
		}
		// Randomize.
		let processedBodyParts = foundry.utils.deepClone(bodyParts);
		let invSum = 0;
		for (let bodyPart of processedBodyParts) {
			if (bodyPart.name === "Background") continue;
			if (CONFIG.SHADOWDARK.VITAL_HIT_LOCATIONS.includes(bodyPart.effect) && !(actor.system.bonuses?.vitalStrike))
				continue;
			bodyPart.invToHit = 1 / (-bodyPart.toHit + 1);
			invSum += bodyPart.invToHit;
		}
		let randomStrike = Math.random() * invSum;
		let accumSum = 0;

		for (let i = 0; i < bodyParts.length; i++) {
			if (processedBodyParts[i].name === "Background") continue;
			if (CONFIG.SHADOWDARK.VITAL_HIT_LOCATIONS.includes(processedBodyParts[i].effect) && !(actor.system.bonuses?.vitalStrike))
				continue;
			accumSum += processedBodyParts[i].invToHit;
			if (randomStrike <= accumSum)
				return bodyParts[i];
		}
		return null;
	}
}