import ActiveEffectsSD from "./src/system/ActiveEffectsSD.mjs";
import ChatSD from "./src/system/ChatSD.mjs";
import CompendiumsSD from "./src/documents/CompendiumsSD.mjs";
import loadTemplates from "./src/templates.mjs";
import Logger from "./src/utils/Logger.mjs";
import PerformanceLogger from "./src/utils/PerformanceLogger.mjs";
import performDataMigration from "./src/migration.mjs";
import registerHandlebarsHelpers from "./src/handlebars.mjs";
import registerSystemSettings from "./src/settings.mjs";
import registerTextEditorEnrichers from "./src/enrichers.mjs";
import SHADOWDARK from "./src/config.mjs";
import ShadowdarkMacro from "./src/macro.mjs";
import UtilitySD from "./src/utils/UtilitySD.mjs";

import * as apps from "./src/apps/_module.mjs";
import * as chat from "./src/chat/_module.mjs";
import * as dice from "./src/dice/_module.mjs";
import * as documents from "./src/documents/_module.mjs";
import * as sheets from "./src/sheets/_module.mjs";
import * as preloader from "./src/hooks/body-parts-image-preloader.mjs";

import {
	HooksSD,
	HooksImmediate,
	HooksInitSD,
} from "./src/hooks.mjs";

import listenOnSocket from "./src/socket.mjs";

/* -------------------------------------------- */
/*  Define Module Structure                     */
/* -------------------------------------------- */

globalThis.shadowdark = {
	apps,
	chat: ChatSD,
	compendiums: CompendiumsSD,
	config: SHADOWDARK,
	debug: Logger.debug,
	defaults: SHADOWDARK.DEFAULTS,
	dice,
	documents,
	effects: ActiveEffectsSD,
	error: Logger.error,
	log: Logger.log,
	debugObject: Logger.debugObject,
	resetTimestamp: PerformanceLogger.resetTimestamp,
	logTimestamp: PerformanceLogger.logTimestamp,
	macro: ShadowdarkMacro,
	sheets,
	utils: UtilitySD,
	warn: Logger.warn,
};

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

// A hook event that fires as Foundry is initializing, right before any
// initialization tasks have begun.
//
Hooks.once("init", () => {
	globalThis.shadowdark = game.shadowdark = Object.assign(
		game.system,
		globalThis.shadowdark
	);

	shadowdark.log("Initialising the Shadowdark RPG Game System");

	game.shadowdark = {
		config: SHADOWDARK,
		lightSourceTracker: new apps.LightSourceTrackerSD(),
		effectPanel: null,
		lootPanel: null,
		utils: globalThis.shadowdark.utils
	};

	CONFIG.SHADOWDARK = SHADOWDARK;
	CONFIG.Actor.documentClass = documents.ActorSD;
	CONFIG.Item.documentClass = documents.ItemSD;
	CONFIG.DiceSD = dice.DiceSD;
	CONFIG.Combat.documentClass = documents.EncounterSD;
	CONFIG.ActorSheetSD = sheets.ActorSheetSD;

	CONFIG.ActiveEffect.legacyTransferral = false;

	registerHandlebarsHelpers();
	registerSystemSettings();
	registerTextEditorEnrichers();
	loadTemplates();

	UtilitySD.loadLegacyArtMappings();

	// Register sheet application classes
	foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
	foundry.documents.collections.Actors.registerSheet("shadowdark", sheets.PlayerSheetSD, {
		types: ["Player"],
		makeDefault: true,
		label: "SHADOWDARK.sheet.class.player",
	});

	foundry.documents.collections.Actors.registerSheet("shadowdark", sheets.NpcSheetSD, {
		types: ["NPC"],
		makeDefault: true,
		label: "SHADOWDARK.sheet.class.npc",
	});

	foundry.documents.collections.Actors.registerSheet("shadowdark", sheets.LightSheetSD, {
		types: ["Light"],
		makeDefault: true,
		label: "SHADOWDARK.sheet.class.npc",
	});

	foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
	foundry.documents.collections.Items.registerSheet("shadowdark", sheets.ItemSheetSD, {
		makeDefault: true,
		label: "SHADOWDARK.sheet.class.item",
	});

	// Attack init hooks
	HooksInitSD.attach();

	game.shadowdark.effectPanel = new apps.EffectPanelSD();
	game.shadowdark.lootPanel = new apps.LootSD();
});

/* -------------------------------------------- */
/*  Foundry VTT Ready                           */
/* -------------------------------------------- */

// A hook event that fires when the game is fully ready.
//
Hooks.on("ready", async () => {
	// Check to see if any data migrations need to be run, and then run them
	await performDataMigration();

	HooksSD.attach();
	listenOnSocket();
	preloader.preLoadBodyPartImages();

	chat.messages.welcomeMessage();

	UtilitySD.showNewReleaseNotes();

	game.shadowdark.lightSourceTracker.start();

	let evolutionGridChoices = {0: 'SHADOWDARK.evolution_grid_type.no_grid'};
	let choicesIndex = 1;
	const evolutionGridTypes = await CompendiumsSD.evolutionGridTypes(false);
	for (let [k, v] of evolutionGridTypes.entries()) {
		const item = await fromUuid(v.uuid);
		evolutionGridChoices[choicesIndex++] = item.name;
	}

	const evolutionGridSettings = game.settings.settings.get("shadowdark.evolutionGrid");
	evolutionGridSettings.choices = evolutionGridChoices;

	shadowdark.log("Game Ready");
});

/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

// A hook event that fires when Foundry has finished initializing but before
// the game state has been set up. Fires before any Documents, UI applications,
// or the Canvas have been initialized.
//
Hooks.once("setup", () => {
	shadowdark.log("Setup Hook");

	// Localize all the strings in the game config in advance
	//
	for (const obj in game.shadowdark.config) {
		if ({}.hasOwnProperty.call(game.shadowdark.config, obj)) {
			for (const el in game.shadowdark.config[obj]) {
				if ({}.hasOwnProperty.call(game.shadowdark.config[obj], el)) {
					if (typeof game.shadowdark.config[obj][el] === "string") {
						game.shadowdark.config[obj][el] = game.i18n.localize(
							game.shadowdark.config[obj][el]
						);
					}
				}
			}
		}
	}

	for (const predefinedEffect in CONFIG.SHADOWDARK.PREDEFINED_EFFECTS) {
		CONFIG.SHADOWDARK.PREDEFINED_EFFECTS[predefinedEffect].name =
			game.i18n.localize(
				CONFIG.SHADOWDARK.PREDEFINED_EFFECTS[predefinedEffect].name
			);
	}
});

HooksImmediate.attach();
