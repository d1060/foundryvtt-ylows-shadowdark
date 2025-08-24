import UtilitySD from "../utils/UtilitySD.mjs";
import ItemSheetSD from "../sheets/ItemSheetSD.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class EvolutionGridSD extends HandlebarsApplicationMixin(ApplicationV2) {
	#dragDrop
	_draggedTalent
	#movingCanvas
	#lineNode
	#multiselect
	_multiSelectedNodes
	MAX_UNDO_STEPS = 50;
	_undoSteps = [];
	_selectingStartingNodes = false;

    constructor(options) {
        super(options);

		let optionsKeys = Object.keys(options);
		for (let key of optionsKeys) {
			this[key] = options[key];
		}
		this.editing = false;
		this.#dragDrop = this.#createDragDropHandlers();
		if (!this.type.system.gridTalents) this.type.system.gridTalents = [];
		if (!this.type.system.gridLines) this.type.system.gridLines = [];
		if (!this.type.system.gridCircles) this.type.system.gridCircles = [];
		if (!this.type.system.grid) this.type.system.grid = {zoom: 1, left: -(this.gridSize/2-400), top: -(this.gridSize/2-400), type: 'triangular'};
		this.gridPosition = {left: 0, top: 0, zoom: 1 };
		if (this.actor && this.actor.system.evolutionGrid.location) this.gridPosition = structuredClone(this.actor.system.evolutionGrid.location);
		else if (this.type.system.grid) this.gridPosition = structuredClone(this.type.system.grid);
		this.setupAllCircleArcs();

		const lastStep = {
			gridLines: structuredClone(this.type.system.gridLines),
			gridTalents: structuredClone(this.type.system.gridTalents),
			grid: structuredClone(this.type.system.grid),
			gridCircles: structuredClone(this.type.system.gridCircles)
		};
		this._undoSteps.push(lastStep);

		if (this.actor)
			this.buildAvailableNodesList();

		this.sanityCheck();
	}

   	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
    	tag: "form",
		classes: ["application", "window-app", "shadowdark", 'themed', 'theme-light'],
		position: {
    		width: 800,
    		height: 800
  		},
		window: {
			resizable: true,
    		title: 'SHADOWDARK.app.evolutionGrid.title',
			controls: [],
  		},
		actions: {
			editEvolutionGrid: this.#onEditEvolutionGrid,
			horizontalAlign: this.#onHorizontalAlign,
			verticalAlign: this.#onVerticalAlign,
			polygonalAlign: this.#onPolygonalAlign,
			circleAlign: this.#onCircleAlign,
			circleFit: this.#onCircleFit,
			squareGrid: this.#onSquareGrid,
			triangularGrid: this.#onTriangularGrid,
			undo: this.#onUndo,
			startingNodes: this.#onStartingNodes
		},
		form: {
			handler: this.#onSubmit,
		    submitOnChange: false,
    		closeOnSubmit: false
  		},
		dragDrop: [{
			dragSelector: ".draggable",
			dropSelector: ".droppable"
		}],
  	}

	/** @inheritdoc */
	static PARTS = {
		form: { template: "systems/shadowdark/templates/apps/evolution-grid.hbs" }
	}

	/** @inheritdoc */
	get title() {

		let classes = "";
		if (!this.actor && this.type?.system?.class)
		{
			for (let uuid of this.type.system.class)
			{
				if (classes !== "") classes += ", ";
				classes += shadowdark.utils.getFromUuidSync(uuid).name;
			}
		}

		const title = game.i18n.localize("SHADOWDARK.app.evolutionGrid.title");
		return `${title} ${this.actor ? this.actor.name : classes}`;
	}

	get iconSize() {
		return 64;
  	}

	get gridSize() {
		return 5000;
	}

	get gridSpacing() {
		return 128;
	}

	get remaningChoices() {
		if (this.actor) {
			let availableChoices = 0;
			if (!this.actor.system.level?.grid && this.actor.system.level?.value)
				this.actor.system.level.grid = this.actor.system.level.value;

			for (let i = 0; i < this.actor.system.level.grid ?? 0; i++)
			{
				if (i == 0)
					availableChoices += this.type.system.evolutionGrid?.choices?.firstLevel ?? 0
				else if (i % 2 == 0)
					availableChoices += this.type.system.evolutionGrid?.choices?.evenLevels ?? 0
				else
					availableChoices += this.type.system.evolutionGrid?.choices?.oddLevels ?? 0
			}

			if (this.actor.system.bonuses.extraTalentChoices)
				availableChoices += this.actor.system.bonuses.extraTalentChoices * this.actor.system.level.grid;

			availableChoices -= (this.actor.system.evolutionGrid?.openNodes?.length ?? 0);
			return availableChoices < 0 ? 0 : availableChoices;
		}
		return null;
	}

	/** @inheritdoc */
	_canDragDrop() {
		return true;
	}

	/** @inheritdoc */
	_canDragStart() {
		return true;
	}

	#createDragDropHandlers() {
		return this.options.dragDrop.map((d) => {
			d.permissions = {
				dragstart: this._canDragStart.bind(this),
				drop: this._canDragDrop.bind(this)
			};
			d.callbacks = {
				dragstart: this._onDragStart.bind(this),
				dragover: this._onDragOver.bind(this),
				drop: this._onDrop.bind(this)
			};
			return new foundry.applications.ux.DragDrop(d);
		});
	}

	/** @override */
	_dragging
	async _onDragStart(event) {
		if (!this.editing || this._selectingStartingNodes) return;
		if (event.currentTarget.classList.contains("evolutionTalent"))
		{
			let gridClick = this.getGridClick(event);
			const gridTalentId = event.currentTarget.dataset.id;
			const gridTalent = this.type.system.gridTalents.find(t => t.uuid === gridTalentId);

			this._draggedTalent = {
				content: event.currentTarget,
				gridTalentId: gridTalentId,
				originalEventX: gridClick.x,
				originalEventY: gridClick.y,
				originalLayerX: event.offsetX,
				originalLayerY: event.offsetY,
				originalDivX: UtilitySD.parseIntOrZero(event.currentTarget.style.left),
				originalDivY: UtilitySD.parseIntOrZero(event.currentTarget.style.top)
			};
			this._draggedLines = this.addDraggedTalentLinesToDynamicPaint(gridTalentId);
			this.scheduleEraseStatic(this._draggedLines);

			let circles = [];
			if (this._draggedTalent) {
				for (const arc of gridTalent.arcs ?? []) {
					const circle = this.type.system.gridCircles.find(c => c.uuid == arc.circle);
					if (circle)
						circles.push(circle);
				}
			}

			if (this._multiSelectedNodes) {
				if (!this._multiSelectedNodes.some(n => n.uuid == gridTalentId))
					this._multiSelectedNodes = null;

				for (let multiSelectedNode of this._multiSelectedNodes) {
					const gridTalent = this.type.system.gridTalents.find(t => t.uuid === multiSelectedNode.uuid);
					for (const arc of gridTalent.arcs ?? []) {
						const circle = this.type.system.gridCircles.find(c => c.uuid == arc.circle);
						if (circle)
							circles.push(circle);
					}
				}
			}
			circles = UtilitySD.uniqBy(circles, c => c.uuid);

			for (const circle of circles) {
				circle.originalCenter = {x: circle.c.x, y: circle.c.y};
			}

			this._dragging = true;
			this.setDebugText(`Dragged Talent: left: ${UtilitySD.roundTo(UtilitySD.parseIntOrZero(this._draggedTalent.content.style.left), 2)}, top: ${UtilitySD.roundTo(UtilitySD.parseIntOrZero(this._draggedTalent.content.style.top), 2)} ${this._multiSelectedNodes ? 'and' + this._multiSelectedNodes.length + ' more' : ''}`);
		}
	}

	/** @override */
	async _onDragOver(event) {
		if (!this.editing || this._selectingStartingNodes) return;
		if (this._draggedTalent)
		{
			let gridClick = this.getGridClick(event);

			let eventDeltaX = (gridClick.x - this._draggedTalent.originalEventX);
			let eventDeltaY = (gridClick.y - this._draggedTalent.originalEventY);

			let newDivX = (this._draggedTalent.originalDivX + eventDeltaX);
			let newDivY = (this._draggedTalent.originalDivY + eventDeltaY);

			this._draggedTalent.content.style.left = newDivX + 'px';
			this._draggedTalent.content.style.top = newDivY + 'px';

			const gridTalentId = this._draggedTalent.content.dataset.id;
			const gridTalent = this.type.system.gridTalents.find(t => t.uuid === gridTalentId);

			let circles = [];
			if (gridTalent) {
				gridTalent.coordinates = {x: UtilitySD.parseIntOrZero(this._draggedTalent.content.style.left),
										  y: UtilitySD.parseIntOrZero(this._draggedTalent.content.style.top)};

				for (const arc of gridTalent.arcs ?? []) {
					const circle = this.type.system.gridCircles.find(c => c.uuid == arc.circle);
					if (circle)
						circles.push(circle);
				}
			}

			if (this._multiSelectedNodes) {
				for (let node of this._multiSelectedNodes) {
					if (this._draggedTalent.content.dataset.id == node.uuid) continue;

					newDivX = (node.originalDivX + eventDeltaX);
					newDivY = (node.originalDivY + eventDeltaY);

					node.content.style.left = newDivX + 'px';
					node.content.style.top = newDivY + 'px';

					const nodeTalent = this.type.system.gridTalents.find(t => t.uuid === node.uuid);
					nodeTalent.coordinates = {x: newDivX, y: newDivY};

					for (const arc of nodeTalent.arcs ?? []) {
						const circle = this.type.system.gridCircles.find(c => c.uuid == arc.circle);
						if (circle)
							circles.push(circle);
					}
				}
			}
			circles = UtilitySD.uniqBy(circles, c => c.uuid);

			if (this._draggedLines)
				this.scheduleDraw(this._draggedLines);

			for (const circle of circles)
			{
				circle.c = {x: circle.originalCenter.x + eventDeltaX, y: circle.originalCenter.y + eventDeltaY};
			}

			if (circles.length)
				this.scheduleDrawCircles();

			this.setDebugText(`Dragged Talent: left: ${UtilitySD.roundTo(UtilitySD.parseIntOrZero(this._draggedTalent.content.style.left), 2)}, top: ${UtilitySD.roundTo(UtilitySD.parseIntOrZero(this._draggedTalent.content.style.top), 2)} ${this._multiSelectedNodes ? 'and' + this._multiSelectedNodes.length + ' more' : ''}`);
		}
	}

	/** @override */
	async _onDrop(event) {
		//shadowdark.log(`onDrop`);
		if (!this.editing || this._selectingStartingNodes) return;
		const eventData = foundry.applications.ux.TextEditor.getDragEventData(event);
		if (!eventData) return;
		let uuid = eventData.uuid;

		let gridClick = this.getGridClick(event);
		if (this._draggedTalent)
		{
			gridClick.x -= this._draggedTalent.originalLayerX;
			gridClick.x += (this.iconSize / 2);
			gridClick.y -= this._draggedTalent.originalLayerY;
			gridClick.y += (this.iconSize / 2);
		}
		let snappedGridClick = this.snapToGrid(gridClick, event.altKey);

		let dropCoordinates = {x: snappedGridClick.x - (this.iconSize / 2), y: snappedGridClick.y - (this.iconSize / 2)};

		if (uuid)
		{
			let item = await fromUuid(uuid);
			if (!item || item.type != "Talent") return;

			if (!this.type.system.gridTalents) this.type.system.gridTalents = [];

			let gridTalent = {
				uuid: UtilitySD.generateUUID(),
				itemUuid: item.uuid,
				coordinates: dropCoordinates,
				lines: [],
				arcs: [],
			};

			await this.addNewTalent(gridTalent, item);
			this.setDebugText(`Dragged New Talent at left: ${UtilitySD.roundTo(dropCoordinates.x, 2)}, top: ${UtilitySD.roundTo(dropCoordinates.y, 2)}`);
		}
		else
		{
			//shadowdark.log(`onDrop grid Talent`);
			let lines = this._draggedLines;
			const div = event.target.closest('div');
			let gridTalentId = div.dataset.id;
			let gridTalent = this.type.system.gridTalents.find(t => t.uuid == gridTalentId);
			if (gridTalent)
			{
				// Clear dynamic lines before updating coordinates.
				this.clearDynamic();
				gridTalent.coordinates = {x: dropCoordinates.x, y: dropCoordinates.y};
			}
			//shadowdark.log(`onDrop Cleared Dynamic`);
			div.style.left = dropCoordinates.x + 'px';
			div.style.top = dropCoordinates.y + 'px';

			if (this._multiSelectedNodes) {
				const dropSnapDelta = {x: snappedGridClick.x - gridClick.x, y: snappedGridClick.y - gridClick.y};
				for (let node of this._multiSelectedNodes) {
					if (node.uuid === gridTalentId) continue;

					const nodeTalent = this.type.system.gridTalents.find(t => t.uuid === node.uuid);
					if (nodeTalent)
					{
						let dropCoordinates = this.snapToGrid({x: nodeTalent.coordinates.x + (this.iconSize / 2), y: nodeTalent.coordinates.y + (this.iconSize / 2)}, event.altKey);
						nodeTalent.coordinates = {x: dropCoordinates.x - (this.iconSize / 2), y: dropCoordinates.y - (this.iconSize / 2)};
						node.content.style.left = (dropCoordinates.x - (this.iconSize / 2)) + 'px';
						node.content.style.top = (dropCoordinates.y - (this.iconSize / 2)) + 'px';
						node.originalEventX = dropCoordinates.x;
						node.originalEventY = dropCoordinates.y;
						node.originalDivX = (dropCoordinates.x - (this.iconSize / 2));
						node.originalDivY = (dropCoordinates.y - (this.iconSize / 2));
					}
				}
			}

			this.scheduleDrawStatic(lines);
			this.setDebugText(`Dragged Talent at left: ${UtilitySD.roundTo(dropCoordinates.x, 2)}, top: ${UtilitySD.roundTo(dropCoordinates.y, 2)} ${this._multiSelectedNodes ? 'and' + this._multiSelectedNodes.length + ' more' : ''}`);
		}

		if (this._draggedTalent)
		{
			this.removeDraggedTalentLinesFromDynamicPaint();
			this._draggedLines = null;
			this._draggedTalent = null;
		}
		//shadowdark.log(`onDrop Removed Dragged Talent Lines`);
		this._dragging = false;
		this.#movingCanvas = null;
		this.updateGrid();
		//shadowdark.log(`onDrop Done`);
	}

	/** @override */
	async _onRender(context, options) {
		await super._onRender(context, options);
		await this.renderAll();
  	}

	async renderAll() {
		//shadowdark.log(`_onRender Start.`);
		this.grid = this.element.querySelector(".evolution-grid");
		this.talentsGrid = this.element.querySelector(".evolution-grid-talents");
		//shadowdark.log(`_onRender drawTalents.`);
		await this.drawTalents();
		//shadowdark.log(`_onRender refreshMultiSelectNodes.`);
		this.refreshMultiSelectNodes();
		//shadowdark.log(`_onRender updateNodeStatus.`);
		this.updateNodeStatus();
		//shadowdark.log(`_onRender updateGridTypeVisibility.`);
		this.updateGridTypeVisibility();
		if ((this._multiSelectedNodes ?? []).length > 1)
			this.showAlignMenu();
		this.showOrHideRemainingChoices();

		//shadowdark.log(`_onRender schedulers.`);
		if (this.editing) this.scheduleGrid();

		this.circleCanvas = this.element.querySelector(".evolution-grid-circles");
		this.circleCtx = this.circleCanvas.getContext('2d', { alpha: true });
		this.resizeCanvas(this.circleCanvas, this.circleCtx);
		//this.drawCircles();
		this.scheduleDrawCircles();

		this.staticCanvas = this.element.querySelector(".evolution-grid-lines-static");
		this.staticCtx = this.staticCanvas.getContext('2d', { alpha: true });
		this.resizeCanvas(this.staticCanvas, this.staticCtx);
		//this.drawLinesStatic();
		this.scheduleDrawStatic();

		this.canvas = this.element.querySelector(".evolution-grid-lines");
		this.ctx = this.canvas.getContext('2d', { alpha: true });
		this.resizeCanvas(this.canvas, this.ctx);
		this.scheduleDraw();

		//shadowdark.log(`_onRender end.`);
		this.#dragDrop.forEach((d) => d.bind(this.element));
	}

	/** @inheritdoc */
	async _onFirstRender(context, options) {
		await super._onFirstRender(context, options);
	}

	/** @inheritdoc */
	async render(force, options) {
		await super.render(force, options);
		await this.activateListeners();
		this.grid.style.transformOrigin = "top left";
		this.grid.style.transform = `scale(${this.gridPosition.zoom})`;
		this.grid.style.left = this.gridPosition.left + 'px';
		this.grid.style.top = this.gridPosition.top + 'px';

		this.#dragDrop.forEach((d) => d.bind(this.element))
	}

	/** @override */
	async activateListeners() {
		if (!this.element) return;
		if (this.grid)
		{
			this.grid.addEventListener("wheel", async(event) => {
				event.preventDefault();
				let dy = event.deltaY;
  				if (event.deltaMode === 1)       dy *= 16;
  				else if (event.deltaMode === 2)  dy *= this.grid.clientHeight;
                await this._doZoom(event, -dy);
			}, { passive: false });

			this.grid.addEventListener("mousedown", async(event) => {
                await this._doMouseDown(event);
			});

			this.grid.addEventListener("mouseup", async(event) => {
				event.preventDefault();
                await this._doMouseUp(event);
			}, { passive: false });

			this.grid.addEventListener("mousemove", async(event) => {
				event.preventDefault();
                await this._doMouseMove(event);
			}, { passive: false });

			this.grid.addEventListener("mouseleave", async(event) => {
				event.preventDefault();
                await this._doMouseLeave(event);
			}, { passive: false });
		}
	}

	/** @override */
	async _prepareContext(options) {
		let context = {
			editing: this.editing,
			gridLeft: this.gridPosition.left,
			gridTop: this.gridPosition.top,
			gridSize: this.gridSize,
			showEditIcon: game.user.isGM,
			selectingStartingNodes: this._selectingStartingNodes
		};

		return context;
	}

	/** @override */
	static async #onSubmit(event, form, formData) {
		
	}

	async _onClose(options) {
		await super._onClose?.(options);
		if (!this.actor)
		{
			this.type.system.grid.left = this.gridPosition.left;
			this.type.system.grid.top = this.gridPosition.top;
			this.type.system.grid.zoom = this.gridPosition.zoom;
		}
		this.updateGrid();
		if (this.actor)
		{
			this.actor.system.evolutionGrid.location = structuredClone(this.gridPosition);
			this.actor.update({"system.evolutionGrid.location": this.actor.system.evolutionGrid.location});
		}
	}

	static async #onEditEvolutionGrid(event, form, formData) {
		if (this.editing == null) this.editing = false;
		if (game.user.isGM)
		{
			this.editing = !this.editing;
			this.updateNodeStatus();
			this.updateGridTypeVisibility();
			this.render(true);
		}
	}

	// {
	// 	uuid: node.uuid,
	// 	content: talentDiv,
	// 	originalDivX: UtilitySD.parseIntOrZero(talentDiv.style.left),
	// 	originalDivY: UtilitySD.parseIntOrZero(talentDiv.style.top)
	// };

	static async #onHorizontalAlign(event, form, formData) {
		if (!this._multiSelectedNodes || this._multiSelectedNodes.length <= 1)
			return;

		let ySum = 0;
		let yCount = 0;
		for (let multiSelectedNode of this._multiSelectedNodes)
		{
			let gridTalent = this.type.system.gridTalents.find(t => t.uuid == multiSelectedNode.uuid);
			ySum += gridTalent.coordinates.y;
			yCount++;
		}
		let y = ySum / yCount;
		for (let multiSelectedNode of this._multiSelectedNodes)
		{
			let gridTalent = this.type.system.gridTalents.find(t => t.uuid == multiSelectedNode.uuid);
			gridTalent.coordinates.y = y;
			multiSelectedNode.content.style.left = y + 'px';
			multiSelectedNode.originalDivY = y;
		}
		await this.updateGrid();
		this.render(true);
	}

	static async #onVerticalAlign(event, form, formData) {
		if (!this._multiSelectedNodes || this._multiSelectedNodes.length <= 1)
			return;

		let xSum = 0;
		let xCount = 0;
		for (let multiSelectedNode of this._multiSelectedNodes)
		{
			let gridTalent = this.type.system.gridTalents.find(t => t.uuid == multiSelectedNode.uuid);
			xSum += gridTalent.coordinates.x;
			xCount++;
		}
		let x = xSum / xCount;
		for (let multiSelectedNode of this._multiSelectedNodes)
		{
			let gridTalent = this.type.system.gridTalents.find(t => t.uuid == multiSelectedNode.uuid);
			gridTalent.coordinates.x = x;
			multiSelectedNode.content.style.top = x + 'px';
			multiSelectedNode.originalDivX = x;
		}
		await this.updateGrid();
		this.render(true);
	}

	static async #onPolygonalAlign(event, form, formData) {
		if (!this._multiSelectedNodes || this._multiSelectedNodes.length <= 2)
			return;

		let points = [];
		for (let multiSelectedNode of this._multiSelectedNodes)
		{
			let gridTalent = this.type.system.gridTalents.find(t => t.uuid == multiSelectedNode.uuid);
			points.push(gridTalent.coordinates);
		}
		points = UtilitySD.polygonalAlign(points);
		for (let i = 0; i < points.length; i++)
		{
			let aligned = points[i];
			let multiSelectedNode = this._multiSelectedNodes[i];

			let gridTalent = this.type.system.gridTalents.find(t => t.uuid == multiSelectedNode.uuid);
			gridTalent.coordinates = aligned;
			multiSelectedNode.content.style.top = aligned.x + 'px';
			multiSelectedNode.content.style.left = aligned.y + 'px';
			multiSelectedNode.originalDivY = aligned.y;
			multiSelectedNode.originalDivX = aligned.x;
		}

		await this.updateGrid();
		this.render(true);
	}

	static async #onCircleAlign(event, form, formData) {
		if (!this._multiSelectedNodes || this._multiSelectedNodes.length <= 2)
			return;

		let points = [], nodes = [], c, r;
		for (let multiSelectedNode of this._multiSelectedNodes)
		{
			let gridTalent = this.type.system.gridTalents.find(t => t.uuid == multiSelectedNode.uuid);
			nodes.push(gridTalent);
			points.push({x: gridTalent.coordinates.x + (this.iconSize / 2), y: gridTalent.coordinates.y + (this.iconSize / 2)});
		}
		[points, c, r] = UtilitySD.circleAlign(points);
		for (let i = 0; i < points.length; i++)
		{
			let aligned = {x: points[i].x - (this.iconSize / 2), y: points[i].y - (this.iconSize / 2)};
			let multiSelectedNode = this._multiSelectedNodes[i];

			let gridTalent = this.type.system.gridTalents.find(t => t.uuid == multiSelectedNode.uuid);
			gridTalent.coordinates = aligned;
			multiSelectedNode.content.style.top = aligned.y + 'px';
			multiSelectedNode.content.style.left = aligned.x + 'px';
			multiSelectedNode.originalDivY = aligned.y;
			multiSelectedNode.originalDivX = aligned.x;
		}

		const circle = {
			uuid: UtilitySD.generateUUID(),
			n: points.length,
    		c,
			r,
    		theta0: Math.atan2(points[0].y - c.y, points[0].x - c.x),
    		visible: Array(points.length).fill(true),
			nodes: Array(points.length).fill(null),
		};
		this.setupCircleArcs(circle, nodes);

		this.type.system.gridCircles.push(circle);
		this.scheduleDrawCircles();
		await this.updateGrid();
		this.render(true);
	}

	static async #onCircleFit() {
		let points = [], nodes = [], angles = [], c, r;
		for (let multiSelectedNode of this._multiSelectedNodes)
		{
			let gridTalent = this.type.system.gridTalents.find(t => t.uuid == multiSelectedNode.uuid);
			nodes.push(gridTalent);
			points.push({x: gridTalent.coordinates.x + (this.iconSize / 2), y: gridTalent.coordinates.y + (this.iconSize / 2)});
		}
		[points, angles, c, r] = UtilitySD.circleFit(points);
		for (let i = 0; i < points.length; i++)
		{
			let aligned = {x: points[i].x - (this.iconSize / 2), y: points[i].y - (this.iconSize / 2)};
			let multiSelectedNode = this._multiSelectedNodes[i];

			let gridTalent = this.type.system.gridTalents.find(t => t.uuid == multiSelectedNode.uuid);
			gridTalent.coordinates = aligned;
			multiSelectedNode.content.style.top = aligned.y + 'px';
			multiSelectedNode.content.style.left = aligned.x + 'px';
			multiSelectedNode.originalDivY = aligned.y;
			multiSelectedNode.originalDivX = aligned.x;
		}

		const circle = {
			uuid: UtilitySD.generateUUID(),
			n: points.length,
    		c,
			r,
    		theta0: 0,
    		visible: Array(points.length).fill(true),
    		angles: angles,
			nodes: Array(points.length).fill(null),
		};
		this.setupCircleArcs(circle, nodes, angles);

		this.type.system.gridCircles.push(circle);
		this.scheduleDrawCircles();
		await this.updateGrid();
		this.render(true);
	}

	static async #onSquareGrid() {
		this.type.system.grid.type = 'square';
		this.render(true);
	}

	static async #onTriangularGrid() {
		this.type.system.grid.type = 'triangular';
		this.render(true);
	}

	static async #onUndo() {
		this.doUndo();
	}

	static async #onStartingNodes() {
		this._selectingStartingNodes = !this._selectingStartingNodes;
		const img = this.element.querySelector('#locationIcon');
		img.src = (this._selectingStartingNodes ? "/systems/shadowdark/assets/icons/location-position.png" : "/systems/shadowdark/assets/icons/location-icon.png");
	}

	#zooming
    async _doZoom(event, dy) {
		if (dy) {
			if (!this.#zooming)
			{
				this.#zooming = true;
				if (!this.gridPosition.zoom) this.gridPosition.zoom = 1;
				let zoomCenter = this.getGridClick(event);
				let prevZoom = this.gridPosition.zoom;
				if (dy > 0) { // Zoom In
					this.gridPosition.zoom += 0.01;
					if (this.gridPosition.zoom > 1) this.gridPosition.zoom = 1;
				} else { // Zoom Out
					this.gridPosition.zoom -= 0.01;
					if (this.gridPosition.zoom < 0.1) this.gridPosition.zoom = 0.1;
				}
				//shadowdark.log(`_doZoom New Zoom is ${this.gridPosition.zoom}`);
				this.resizeGrid(zoomCenter, prevZoom);
				this.#zooming = false;
			}
		}
	}

	elementPageTopLeft(el) {
		let x = 0, y = 0;
		for (let n = el; n; n = n.offsetParent) {
			x += n.offsetLeft - (n.scrollLeft || 0);
			y += n.offsetTop  - (n.scrollTop  || 0);
		}
		return { x, y };
	}

	getGridClick(event) {
		if (!this.gridPosition.zoom) this.gridPosition.zoom = 1;
		//const parentRect = event.currentTarget.getBoundingClientRect();
		//let x = event.clientX - parentRect.left;
  		//let y = event.clientY - parentRect.top;

		const rect = this.grid.getBoundingClientRect();
		const x = (event.clientX - rect.left) / this.gridPosition.zoom;
  		const y = (event.clientY - rect.top) / this.gridPosition.zoom;

		//const topLeft = this.elementPageTopLeft(this.grid); // page coords of canvas (no gBCR)
		//let x = event.pageX - topLeft.x;
  		//let y = event.pageY - topLeft.y;

		//x /= this.gridPosition.zoom;
		//y /= this.gridPosition.zoom;

		//shadowdark.log(`getGridClick x: ${x}, y ${y}, client: ${event.clientX} ${event.clientY}, rect: ${rect.left} ${rect.top}, zoom: ${this.gridPosition.zoom}`);

		return {x, y};
	}

	snapToGrid(coordinates, altKey) {
		if (altKey) return coordinates;

		if (this.type.system.grid.type == 'square') {
			let xRate = (coordinates.x - Math.floor(coordinates.x / this.gridSpacing) * this.gridSpacing) / this.gridSpacing;
			let yRate = (coordinates.y - Math.floor(coordinates.y / this.gridSpacing) * this.gridSpacing) / this.gridSpacing;

			coordinates.x = (Math.floor(coordinates.x / this.gridSpacing) + (xRate >= 0.5 ? 1 : 0)) * this.gridSpacing;
			coordinates.y = (Math.floor(coordinates.y / this.gridSpacing) + (yRate >= 0.5 ? 1 : 0)) * this.gridSpacing;
		} else {
			const yPaces = Math.floor(coordinates.y / this.gridSpacing);
			const xPace = 2 * this.gridSpacing / Math.sqrt(3);
			const xPaceOffset = (yPaces % 2 == 1 ? xPace / 2 : 0);
			const nextXPaceOffset = ((yPaces + 1) % 2 == 1 ? xPace / 2 : 0);
			const xPaces = Math.floor(coordinates.x / xPace);
			const closestPoints = [
				{x: xPaceOffset + xPaces * xPace, y: yPaces * this.gridSpacing},
				{x: xPaceOffset + xPace + xPaces * xPace, y: yPaces * this.gridSpacing},
				{x: nextXPaceOffset + xPaces * xPace, y: this.gridSpacing + yPaces * this.gridSpacing},
				{x: nextXPaceOffset + xPace + xPaces * xPace, y: this.gridSpacing + yPaces * this.gridSpacing},
			];
			coordinates = UtilitySD.closestPoint(closestPoints, coordinates);
		}
		return coordinates;
	}

    async _doMouseDown(event) {
		if (event.button === 0 && !event.ctrlKey && !event.shiftKey && !this._dragging) {
			//Moves the Canvas.
			const gridClick = this.getGridClick(event);
			let node = this.findNode(gridClick);;
			let line;
			if (this.editing)
			{
				if (node == null)
					line = this.findLine(gridClick);
			}

			if (this.editing && node == null && line == null && !this._dragging)
			{
				// Multiselect
				if (!this.editing) return;
				this.startMultiselect(event);
			}
			else if (this.editing && node != null && this._selectingStartingNodes)
			{
				if (!node.starting) node.starting = false;
				node.starting = !node.starting;

				const talentDiv = this.element.querySelector('div.evolutionTalent[data-id="'+node.uuid+'"]');
				if (node.starting)
					talentDiv.classList.add("starting");
				else
					talentDiv.classList.remove("starting");

				this.updateGrid();
			}
			else if (node != null && !this._selectingStartingNodes)
			{
				// Select a node for evolution.
				this.selectNode(node);
			}
		}
		else if (event.button === 0 && event.ctrlKey && !event.shiftKey && !this._dragging) {
			if (!this.editing) return;
			//Plot Lines.
			const gridClick = this.getGridClick(event);
			const node = this.findNode(gridClick)
			if (node != null)
			{
				// Creasting lines between nodes.
				if (!this.#lineNode)
					this.#lineNode = node;
				else if (this.#lineNode.uuid != node.uuid)
				{
					this.addLine(this.#lineNode, node);
					this.#lineNode = null;
				}
				this.setDebugText(`CTRL-Left Click at: ${UtilitySD.roundTo(gridClick.x, 2)}, ${UtilitySD.roundTo(gridClick.y, 2)} found node ${node.uuid}. left: ${UtilitySD.roundTo(UtilitySD.parseIntOrZero(this.gridPosition.left), 2)}, top: ${UtilitySD.roundTo(UtilitySD.parseIntOrZero(this.gridPosition.top), 2)}`);
			}
			else
				this.setDebugText(`CTRL-Left Click at: ${UtilitySD.roundTo(gridClick.x, 2)}, ${UtilitySD.roundTo(gridClick.y, 2)} found NO node`);
		}
		if (event.button === 0 && !event.ctrlKey && event.shiftKey && !this._dragging) {
		}
		else if (event.button === 2 && !event.ctrlKey && !event.shiftKey ) {
			
			const gridClick = this.getGridClick(event);
			const node = this.findNode(gridClick);
			if (node) {
				//Pop out the talent.
				const item = await fromUuid(node.itemUuid);
				if (item) {
					let itemSheet = new ItemSheetSD({document: item});
					itemSheet.render(true);
				}
			}
			else
			{
				//Moves the canvas.
				let gridLeft = UtilitySD.parseIntOrZero(this.grid.style.left);
				let gridTop = UtilitySD.parseIntOrZero(this.grid.style.top);
				this.#movingCanvas = {x: event.screenX, y: event.screenY, left : gridLeft, top: gridTop};
				this.setDebugText(`Moving Canvas Starting at : ${UtilitySD.roundTo(this.#movingCanvas.x, 2)}, top: ${UtilitySD.roundTo(this.#movingCanvas.y, 2)}`);
			}
		}
		else if (event.button === 2 && event.ctrlKey) {
			// Delete Elements
			if (!this.editing) return;
			let gridClick = this.getGridClick(event);
			//Right CTRL -> Delete Node.
			if (!this.deleteNode(gridClick) && !this.deleteLine(gridClick))
				this.toggleArcSegment(gridClick);
				
			//else
			//	this.scheduleGrid();
		}
	}

	async _doMouseUp(event) {
		if (this.#movingCanvas)
		{
			this.#movingCanvas = null;
		}
		if (this.#multiselect) {
			this.endMultiselect(event);
		}
		else if (this._multiSelectedNodes && !event.shiftKey)
		{
			this.deselectNodes();
			this.hideAlignMenu();
			this._multiSelectedNodes = null;
		}
		this._dragging = false;
	}

	async _doMouseMove(event) {
		if (this.#movingCanvas != null) {
			await this.panGrid(event);
		}
		else if (this.#multiselect) {
			if (!this.editing) return;

			const gridClick = this.getGridClick(event);
			let left = this.#multiselect.x < gridClick.x ? this.#multiselect.x : gridClick.x;
			let top = this.#multiselect.y < gridClick.y ? this.#multiselect.y : gridClick.y;
			let width = Math.abs(this.#multiselect.x - gridClick.x);
			let height = Math.abs(this.#multiselect.y - gridClick.y);
			const selectDiv = this.element.querySelector('.evolution-grid-multiselect');
			selectDiv.style.left = left + 'px';
			selectDiv.style.top = top + 'px';
			selectDiv.style.width = width + 'px';
			selectDiv.style.height = height + 'px';

			this.multiSelectNodes(left, top, width, height);

			//this.canvas = this.element.querySelector(".evolution-grid-lines");
			//this.ctx = this.canvas.getContext('2d', { alpha: true });
			this.scheduleDraw();
			this.#dragDrop.forEach((d) => d.bind(this.element))
		}
	}

	async _doMouseLeave(event) {
		//this._doMouseUp(event);
	}

	async addNewTalent(gridTalent, item) {
		await this.addElementDiv(gridTalent, item);
		this.type.system.gridTalents.push(gridTalent);
		await this.updateGrid();
	}

	async addElementDiv(gridTalent, item) {
		this.talentsGrid.innerHTML += this.getTalentDiv(gridTalent, item);
		this.#dragDrop.forEach((d) => d.bind(this.element));
	}

	getTalentDiv(gridTalent, item) {
		const dropX = gridTalent.coordinates.x;
		const dropY = gridTalent.coordinates.y;

		let showUnchosen = false;
		let showStarting = false;
		let showSelected = false;
		let showDraggable = false;

		if (!this.editing) {
			showUnchosen = !gridTalent.starting;

			if (this.actor) {
				if (this.actor.availableNodes && this.actor.availableNodes.some(n => n.uuid == gridTalent.uuid))
					showUnchosen = false;

				if (this.actor.system.evolutionGrid?.openNodes?.some(n => n.uuid == gridTalent.uuid))
				{
					showSelected = true;
					showUnchosen = false;
				}
			}
		}
		else
		{
			showStarting = gridTalent.starting
			showDraggable = true;
		}

		return	'<div style="display: grid; position: absolute; top: ' + dropY + 'px; left: ' + dropX + 'px; width: ' + this.iconSize + 'px; height: ' + this.iconSize + 'px;" '+
					'class="evolutionTalent' + (showDraggable ? ' draggable' : '')  + (showUnchosen ? ' unchosen' : '') + (showStarting ? ' starting' : '') + (showSelected ? ' selected' : '') + 
					'" data-id="' + gridTalent.uuid + '" data-item-id="' + gridTalent.itemUuid + '"  data-tooltip="' + item.name + '">'+
				'<img style="width: ' + this.iconSize + 'px; height: ' + this.iconSize + 'px;" class="evolution-talent-img" src="' + item.img + '">'+
				'</div>';
	}

	async resizeGrid(zoomCenter, prevZoom) {
		if (!this.grid) return;

		let left = UtilitySD.parseIntOrZero(this.grid.style.left);
		let top = UtilitySD.parseIntOrZero(this.grid.style.top);

		let prevSize = this.gridSize * prevZoom;
		let size = this.gridSize * this.gridPosition.zoom;

		let xRate = zoomCenter.x / this.gridSize;
		let yRate = zoomCenter.y / this.gridSize;

		let delta = prevSize - size;

		left += delta * xRate;
		top += delta * yRate;

		this.grid.style.transformOrigin = "top left";
		[top, left, this.gridPosition.zoom] = this.moveGridToBounds(top, left, this.gridPosition.zoom);
		this.grid.style.top = top + 'px';
		this.grid.style.left = left + 'px';
		//grid.style.transformOrigin = zoomCenter.x + "px " + zoomCenter.y + "px";
		this.grid.style.transform = `scale(${this.gridPosition.zoom})`;
		this.gridPosition.left = UtilitySD.parseIntOrZero(this.grid.style.left);
		this.gridPosition.top = UtilitySD.parseIntOrZero(this.grid.style.top);
		this.#dragDrop.forEach((d) => d.bind(this.element))
		this.setDebugText(`Resizing the Grid. left: ${UtilitySD.roundTo(this.gridPosition.left, 2)}, top: ${UtilitySD.roundTo(this.gridPosition.top, 2)}, zoom: ${UtilitySD.roundTo(this.gridPosition.zoom, 2)}`);
	}

	async panGrid(event) {
		const gridClick = this.getGridClick(event);
		const moveDelta = {x: event.screenX - this.#movingCanvas.x, y: event.screenY - this.#movingCanvas.y};
		const newPosition = {left: this.#movingCanvas.left + moveDelta.x, top: this.#movingCanvas.top + moveDelta.y};

		//shadowdark.log(`PanGrid: Click at ${UtilitySD.roundTo(event.screenX,2)} ${UtilitySD.roundTo(event.screenY,2)}, #movingCanvas: ${UtilitySD.roundTo(this.#movingCanvas.x,2)} ${UtilitySD.roundTo(this.#movingCanvas.y,2)}, Delta: ${UtilitySD.roundTo(moveDelta.x,2)} ${UtilitySD.roundTo(moveDelta.y,2)}. Position: ${UtilitySD.roundTo(newPosition.left,2)} ${UtilitySD.roundTo(newPosition.top,2)}`);
		[newPosition.top, newPosition.left, this.gridPosition.zoom] = this.moveGridToBounds(newPosition.top, newPosition.left, this.gridPosition.zoom);

		this.gridPosition.left = newPosition.left;
		this.gridPosition.top = newPosition.top;
		this.grid.style.left = newPosition.left + 'px';
		this.grid.style.top = newPosition.top + 'px';
		this.setDebugText(`Moving the Grid by ${UtilitySD.roundTo(moveDelta.x,2)} ${UtilitySD.roundTo(moveDelta.y,2)}. left: ${UtilitySD.roundTo(newPosition.left, 2)}, top: ${UtilitySD.roundTo(newPosition.top, 2)}, zoom: ${UtilitySD.roundTo(this.gridPosition.zoom, 2)}`);
		this.#dragDrop.forEach((d) => d.bind(this.element))
	}

	moveGridToBounds(top, left, zoom) {
		const wrapper = this.element.querySelector(".evolution-grid-wrapper");
		const wrapperRect = wrapper.getBoundingClientRect();

		const wrapperWidth = UtilitySD.parseIntOrZero(wrapperRect.width);
		const wrapperHeight = UtilitySD.parseIntOrZero(wrapperRect.height);
		const gridWidth = UtilitySD.parseIntOrZero(this.grid.style.width) * zoom;
		const gridHeight = UtilitySD.parseIntOrZero(this.grid.style.height) * zoom;
		const minLeft = wrapperWidth - gridWidth;
		const minTop = wrapperHeight - gridHeight;
		if (top < minTop) top = minTop;
		if (left < minLeft) left = minLeft;
		if (top > 0) top = 0;
		if (left > 0) left = 0;
		if (minTop > 0)
		{
			let minZoom = wrapperWidth / this.gridSize;
			if (minZoom > zoom) zoom = minZoom;
		}
		if (minLeft > 0)
		{
			let minZoom = wrapperWidth / this.gridSize;
			if (minZoom > zoom) zoom = minZoom;
		}
		//shadowdark.log(`moveGridToBounds New Zoom is ${zoom}`);
		return [top, left, zoom];
	}

	async drawTalents() {
		if (this.type.system.gridTalents) {
			let allTalents = '';
			for (let i = 0; i < this.type.system.gridTalents.length; i++)
			{
				let gridTalent = this.type.system.gridTalents[i];
				let item = await fromUuid(gridTalent.itemUuid);
				if (!item || item.type != "Talent")
				{
					this.type.system.gridTalents.splice(i, 1);
					i--;
					continue;
				}

				allTalents += this.getTalentDiv(gridTalent, item);
			}
			this.talentsGrid.innerHTML += allTalents;
			this.#dragDrop.forEach((d) => d.bind(this.element));
		}
	}

	findNode(gridClick)
	{
		return this.type.system.gridTalents.find(t =>
			gridClick.x >= t.coordinates.x && gridClick.x <= t.coordinates.x + this.iconSize &&
			gridClick.y >= t.coordinates.y && gridClick.y <= t.coordinates.y + this.iconSize
		);
	}

	deleteNode(gridClick) {
		for (let i = 0; i < this.type.system.gridTalents.length; i++)
		{
			let gridTalent = this.type.system.gridTalents[i];
			if (gridClick.x >= gridTalent.coordinates.x && gridClick.x <= gridTalent.coordinates.x + this.iconSize &&
				gridClick.y >= gridTalent.coordinates.y && gridClick.y <= gridTalent.coordinates.y + this.iconSize)
			{
				const erasedLines = [];
				for (let a = 0; a < gridTalent.lines?.length; a++)
				{
					const line = this.type.system.gridLines.find(l => l.uuid == gridTalent.lines[a]);
					if (line) {
						// Let the other node know this line is going away.
						const node1 = this.type.system.gridTalents.find(t => t.uuid == line.node1);
						const node2 = this.type.system.gridTalents.find(t => t.uuid == line.node2);
						if (node1 !== gridTalent) { node1.lines = node1.lines.filter(l => l !== line.uuid); }
						if (node2 !== gridTalent) { node2.lines = node2.lines.filter(l => l !== line.uuid); }

						line.p1 = {x: node1?.coordinates.x + this.iconSize / 2, y: node1?.coordinates.y + this.iconSize / 2};
						line.p2 = {x: node2?.coordinates.x + this.iconSize / 2, y: node2?.coordinates.y + this.iconSize / 2};

						erasedLines.push(line);
						const lineIndex = this.type.system.gridLines.indexOf(line);
						this.type.system.gridLines.splice(lineIndex, 1);
					}
				}
				if (erasedLines.length)
					this.scheduleEraseStatic(erasedLines);

				this.type.system.gridTalents.splice(i, 1);
				const el = this.element.querySelector('div.evolutionTalent[data-id="'+gridTalent.uuid+'"]');
				if (el) {
  					el.remove();
					this.#dragDrop.forEach((d) => d.bind(this.element))
					this.updateGrid();
				}
				return true;
			}
		}
		return false;
	}

	async selectNode(node) {
		if (!this.actor) return;
		const learned = this.actor.system.evolutionGrid?.openNodes?.some(n => n.uuid == node.uuid);
		const available = this.actor.availableNodes.some(n => n.uuid == node.uuid);
		if (!learned && !available) return;
		if (!learned && available && !this.remaningChoices) return;

		const item = await fromUuid(node.itemUuid);
		if (!item || item.type != "Talent") return;

		foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/select-node.hbs",
			{item, learned}
		).then(html => {
			foundry.applications.api.DialogV2.wait({
				classes: ["shadowdark", "shadowdark-dialog", "window-app", 'themed', 'theme-light'],
				window: {
					resizable: false,
					title: `${game.i18n.localize("SHADOWDARK.evolution_grid.dialog." + (learned ? "un" : "") + "learn")}`,
				},
				content: html,
				buttons: [
					{
						action: 'Yes',
						icon: "<i class=\"fa fa-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
							if (!this.actor.system.evolutionGrid?.openNodes) this.actor.system.evolutionGrid.openNodes = [];
							const foundOpenNode = this.actor.system.evolutionGrid.openNodes.find(n => n.uuid == node.uuid)
							if (foundOpenNode) {
								const nodeIndex = this.actor.system.evolutionGrid.openNodes.indexOf(foundOpenNode);
								if (nodeIndex != -1)
								{
									this.actor.system.evolutionGrid.openNodes.splice(nodeIndex, 1);
									await this.actor.update({"system.evolutionGrid.openNodes": this.actor.system.evolutionGrid.openNodes});
								}
								const items = await this.actor.getEmbeddedCollection("Item");
								if (items)
								{
									const embeddedItem = items.find(i => i.system.gridTalentId == node.uuid);
									if (embeddedItem)
										await this.actor.deleteEmbeddedDocuments("Item", [embeddedItem.id]);
								}
							} else {
								this.actor.system.evolutionGrid.openNodes.push(node);
								await this.actor.update({"system.evolutionGrid.openNodes": this.actor.system.evolutionGrid.openNodes});
								let itemObj = await shadowdark.effects.createItemWithEffect(item, this.actor);
								if (itemObj) {
									itemObj.system.gridTalentId = node.uuid;
									await this.actor.createEmbeddedDocuments("Item", [itemObj]);
								} else {
									const nodeIndex = this.actor.system.evolutionGrid.openNodes.indexOf(node);
									this.actor.system.evolutionGrid.openNodes.splice(nodeIndex, 1);
									await this.actor.update({"system.evolutionGrid.openNodes": this.actor.system.evolutionGrid.openNodes});
								}
							}
							await this.actor.recalculateHp();
							this.buildAvailableNodesList(this.type.system.gridTalents);
							this.render();
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

	startMultiselect(event) {
		let gridClick = this.getGridClick(event);
		let node = this.findNode(gridClick)
		if (node)
		{
			if (!this._multiSelectedNodes) this._multiSelectedNodes = [];

			const talentDiv = this.element.querySelector('div.evolutionTalent[data-id="'+node.uuid+'"]');
			talentDiv.classList.add("selected");

			const selectedNode = {
				uuid: node.uuid,
				content: talentDiv,
				originalDivX: UtilitySD.parseIntOrZero(talentDiv.style.left),
				originalDivY: UtilitySD.parseIntOrZero(talentDiv.style.top)
			};

			this._multiSelectedNodes.push(selectedNode);

			if (this._multiSelectedNodes.length + (this._multiSelectedNodes ?? []).length > 1)
				this.showAlignMenu();
		}
		else
		{
			this.#multiselect = gridClick;
			const multiSelectGrid = this.element.querySelector('.evolution-grid-multiselect');
			multiSelectGrid.classList.remove("hidden");
		}

		this.#dragDrop.forEach((d) => d.bind(this.element))
	}

	endMultiselect(event) {
		const el = this.element.querySelector('.evolution-grid-multiselect');

		const nodes = this.multiSelectNodes(UtilitySD.parseIntOrZero(el.style.left), UtilitySD.parseIntOrZero(el.style.top), UtilitySD.parseIntOrZero(el.style.width), UtilitySD.parseIntOrZero(el.style.height));
		if (nodes.length)
		{
			if (!this._multiSelectedNodes) this._multiSelectedNodes = [];
			for (let node of nodes)
			{
				const talentDiv = this.element.querySelector('div.evolutionTalent[data-id="'+node.uuid+'"]');
				const selectedNode = {
					uuid: node.uuid,
					content: talentDiv,
					originalDivX: UtilitySD.parseIntOrZero(talentDiv.style.left),
					originalDivY: UtilitySD.parseIntOrZero(talentDiv.style.top)
				};
				this._multiSelectedNodes.push(selectedNode);
			}
		}
		else
		{
			let gridClick = this.getGridClick(event);
			let node = this.findNode(gridClick);
			if (node && this._multiSelectedNodes)
			{
				const talentDiv = this.element.querySelector('div.evolutionTalent[data-id="'+node.uuid+'"]');
				const selectedNode = {
					uuid: node.uuid,
					content: talentDiv,
					originalDivX: UtilitySD.parseIntOrZero(talentDiv.style.left),
					originalDivY: UtilitySD.parseIntOrZero(talentDiv.style.top)
				};
				this._multiSelectedNodes.push(selectedNode);
				this.select(node);
			}
		}

		el.classList.add("hidden");
		this.#dragDrop.forEach((d) => d.bind(this.element))
		this.#multiselect = null;
	}

	multiSelectNodes(left, top, width, height) {
		const nodes = [];
		for (let gridTalent of this.type.system.gridTalents)
		{
			if (left <= gridTalent.coordinates.x && left + width >= gridTalent.coordinates.x + this.iconSize &&
				top <= gridTalent.coordinates.y && top + height >= gridTalent.coordinates.y + this.iconSize)
			{
				nodes.push(gridTalent);
				this.select(gridTalent);
			}
			else
			{
				if (this._multiSelectedNodes && this._multiSelectedNodes.some(n => n.uuid == gridTalent.uuid))
					this.select(gridTalent);
				else
					this.deselect(gridTalent);
			}
		}
		if (nodes.length + (this._multiSelectedNodes ?? []).length > 1)
			this.showAlignMenu();
		return nodes;
	}

	getAllCircleNodes(node) {
		if (!node.arcs || node.arcs.length == 0) return [node];
		const circles = [];
		for (const arc of node.arcs) {
			const circle = this.type.system.gridCircles.find(c => c.uuid == arc.circle);
			if (!circles.some(c => c.uuid == circle.uuid))
				circles.push(circle);
		}

		const nodes = [];
		for (const circle of circles) {
			for (const circleNode of circle.nodes) {
				if (!nodes.some(n => n.uuid == circleNode.uuid))
					nodes.push(circleNode);
			}
		}
		return nodes;
	}

	refreshMultiSelectNodes() {
		if (!this._multiSelectedNodes || this._multiSelectedNodes.length == 0) return;

		for(let multiSelectedNode of this._multiSelectedNodes) {
			const talentDiv = this.element.querySelector('div.evolutionTalent[data-id="'+multiSelectedNode.uuid+'"]');
			multiSelectedNode.content = talentDiv;
			talentDiv.classList.add("selected");
		}
	}

	showAlignMenu() {
		const alignMenuDiv = this.element.querySelector('.multiselect-align');
		alignMenuDiv.classList.remove("hidden");
	}

	hideAlignMenu() {
		const alignMenuDiv = this.element.querySelector('.multiselect-align');
		alignMenuDiv.classList.add("hidden");
	}

	showOrHideRemainingChoices() {
		const choicesDiv = this.element.querySelector('.evolution-grid-choices');
		if (this.remaningChoices) {
			choicesDiv.innerHTML = game.i18n.format("SHADOWDARK.evolution_grid.choices", {choices: this.remaningChoices});
			choicesDiv.classList.remove("hidden");
		}
		else {
			choicesDiv.classList.add("hidden");
		}

		if (this.editing)
			choicesDiv.classList.add("hidden");
	}

	select(gridTalent) {
		const talentDiv = this.element.querySelector('div.evolutionTalent[data-id="'+gridTalent.uuid+'"]');
		if (talentDiv)
			talentDiv.classList.add("selected");
	}

	deselect(gridTalent) {
		const talentDiv = this.element.querySelector('div.evolutionTalent[data-id="'+gridTalent.uuid+'"]');
		if (talentDiv)
			talentDiv.classList.remove("selected");
	}

	deselectNodes() {
		for (let gridTalent of this.type.system.gridTalents)
		{
			this.deselect(gridTalent);
		}
	}

	updateNodeStatus() {
		for (let gridTalent of this.type.system.gridTalents)
		{
			const talentDiv = this.element.querySelector('div.evolutionTalent[data-id="'+gridTalent.uuid+'"]');
			if (talentDiv)
			{
				if (this.editing)
					talentDiv.classList.add("draggable");
				else
					talentDiv.classList.remove("draggable");

				if (this.actor) {
					if (!this.actor.availableNodes)
						return;

					if (this.actor.availableNodes.some(n => n.uuid == gridTalent.uuid))
					{
						talentDiv.classList.remove("unchosen");
					}
				}
			}
		}
	}

	buildAvailableNodesList() {
		this.actor.availableNodes = [];
		if(!this.actor.system.evolutionGrid) this.actor.system.evolutionGrid = { openNodes: [] };
		for (let nodeTalent of this.type.system.gridTalents) {
			const learned = this.actor.system.evolutionGrid.openNodes.find(n => n.uuid == nodeTalent.uuid);
			if (nodeTalent.starting && !learned)
				this.actor.availableNodes.push(nodeTalent);
			else if (learned) {
				let neighbors = this.nodeNeighbors(nodeTalent);
				for (let neighbor of neighbors) {
					if (!this.actor.system.evolutionGrid.openNodes.some(n => n == neighbor.uuid))
						this.actor.availableNodes.push(neighbor);
				}
			}
		}
		this.actor.availableNodes = UtilitySD.uniqBy(this.actor.availableNodes, l => l.uuid);
	}

	nodeNeighbors(gridTalent) {
		let neighbors = [];
		for (let lineId of gridTalent.lines ?? []) {
			let line = this.type.system.gridLines.find(l => l.uuid == lineId);
			const node1 = this.type.system.gridTalents.find(t => t.uuid == line.node1);
			const node2 = this.type.system.gridTalents.find(t => t.uuid == line.node2);
			if (node1 == gridTalent) neighbors.push(node2);
			if (node2 == gridTalent) neighbors.push(node1);
		}

		for (let arc of gridTalent.arcs ?? []) {
			const circle = this.type.system.gridCircles.find(c => c.uuid == arc.circle);

			for (let a = 0; a < circle.nodes?.length; a++) {
				if (!circle.visible[a]) continue;
				const circleNode = circle.nodes[a];

				const node1 = this.type.system.gridTalents.find(t => t.uuid == circleNode.n1);
				const node2 = this.type.system.gridTalents.find(t => t.uuid == circleNode.n2);

				if (node1 == gridTalent) neighbors.push(node2);
				if (node2 == gridTalent) neighbors.push(node1);
			}
		}
		neighbors = UtilitySD.uniqBy(neighbors, n => n.uuid);
		return neighbors;
	}

	updateGridTypeVisibility() {
		const gridTypesDiv = this.element.querySelector('.grid-types');
		if (this.editing)
			gridTypesDiv.classList.remove("hidden");
		else
			gridTypesDiv.classList.add("hidden");
	}

	draggedLines() {
		let lineIDs= [];
		if (this._draggedTalent) {
			let gridTalent = this.type.system.gridTalents.find(t => t.uuid == this._draggedTalent.gridTalentId);
			if (gridTalent)
				lineIDs = gridTalent.lines;
		}
		
		if (this._multiSelectedNodes) {
			for (let node of this._multiSelectedNodes) {
				const nodeTalent = this.type.system.gridTalents.find(t => t.uuid === node.uuid);
				if (nodeTalent) {
					lineIDs.push(... nodeTalent.lines);
				}
			}
		}
		lineIDs = UtilitySD.uniqBy(lineIDs, l => l);
		let lines = [];
		for (let line of this.type.system.gridLines) {
			if (lineIDs.some(l => l == line.uuid))
				lines.push(line);
		}
		return lines;
	}

	deleteLine(gridClick) {
        const line = this.findLine(gridClick);
        if (line) {
			this.removeLine(line);
			return true;
		}
		else return false;
	}

	toggleArcSegment(point) {
		let [circle, i] = this.pickArcSegment(point);
		if (circle && i >= 0) {
			circle.visible[i] = !circle.visible[i];

			if (!circle.visible[i])
			{
				let isInvisible = true;
				for (let a = 0; a < circle.n; a++)
				{
					if (circle.visible[a])
					{
						isInvisible = false;
						break;
					}
				}

				if (isInvisible)
				{
					let circleIndex = this.type.system.gridCircles.indexOf(circle);
					this.type.system.gridCircles.splice(circleIndex, 1);
				}
			}

			this.scheduleDrawCircles();
			this.updateGrid();
		}
	}

	pickArcSegment(point) {
		// Use stroke-based hit test with a thicker line width
		this.circleCtx.save();
		this.circleCtx.lineWidth = this.HIT_TOLERANCE;
		for (let circle of this.type.system.gridCircles)
		{
	    	const step = (Math.PI * 2) / circle.n;
			for (let i = circle.n - 1; i >= 0; i--)
			{
				const a1 = circle.angles[i];
				const a2 = (i === circle.n - 1) ? circle.angles[0] + 2 * Math.PI : circle.angles[i + 1];

				const path = new Path2D();
				path.arc(circle.c.x, circle.c.y, circle.r, a1, a2, false);

				if (this.circleCtx.isPointInStroke(path, point.x, point.y))
				{
					this.circleCtx.restore();
					return [circle, i];
				}
			}
		}
		this.circleCtx.restore();
		return [null, -1];
	}

	resizeCanvas(canvas, ctx) {
		const dpr = 1;
		//const rect = this.grid.getBoundingClientRect();
		canvas.width = Math.max(1, Math.floor(this.gridSize * dpr));
		canvas.height = Math.max(1, Math.floor(this.gridSize * dpr));
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	drawGrid() {
		this.gridCanvas = this.element.querySelector(".evolution-grid-grid");
		this.gridCtx = this.gridCanvas.getContext('2d', { alpha: true });

		//const rect = this.grid.getBoundingClientRect();
		this.gridCanvas.width = Math.max(1, Math.floor(this.gridSize));
		this.gridCanvas.height = Math.max(1, Math.floor(this.gridSize));
		this.gridCtx.setTransform(1, 0, 0, 1, 0, 0);

		this.gridCtx.save();
		this.gridCtx.globalAlpha = 0.3;
		this.gridCtx.strokeStyle = '#000';
		this.gridCtx.lineWidth = 1;
		this.gridCtx.lineCap = 'butt';
		let kind = this.type.system.grid.type ?? 'triangular';

		const ext = Math.hypot(this.gridSize, this.gridSize); // long enough to span when rotated

		if (kind === 'square') {
			// verticals
			this.gridCtx.beginPath();
			for (let x = 0; x <= this.gridSize; x += this.gridSpacing) {
				const xPix = Math.round(x) + 0.5; // crisp 1px lines
				this.gridCtx.moveTo(xPix, 0);
				this.gridCtx.lineTo(xPix, this.gridSize);
			}
			// horizontals
			for (let y = 0; y <= this.gridSize; y += this.gridSpacing) {
				const yPix = Math.round(y) + 0.5;
				this.gridCtx.moveTo(0, yPix);
				this.gridCtx.lineTo(this.gridSize, yPix);
			}
			this.gridCtx.stroke();
		} else {
			// Triangular grid = 3 families of parallel lines at 0°, 60°, 120°
			const angles = [0, Math.PI / 3, (2 * Math.PI) / 3];
			const translations = [-0.25 * this.gridSpacing, this.gridSpacing / 2, 0];
			const offset = {x : (1 * this.gridSpacing / Math.sqrt(3)) * 0.16, y : -this.gridSpacing * 0.03};

			for (let i = 0; i < angles.length; i++) {
				const angle = angles[i];
				const xTranslation = translations[i];
				this.gridCtx.save();
				// Draw in a rotated frame so we can lay lines horizontally
				this.gridCtx.translate(offset.x + this.gridSize / 2, offset.y + this.gridSize / 2);
				this.gridCtx.rotate(angle);

				this.gridCtx.beginPath();
				// cover full height in rotated space
				let yStart = -ext + xTranslation;
				for (let y = yStart; y <= ext; y += this.gridSpacing) {
					this.gridCtx.moveTo(-ext, y);
					this.gridCtx.lineTo(ext, y);
				}
				this.gridCtx.stroke();
				this.gridCtx.restore();
			}
		}

		this.gridCtx.restore();
	}

	clearDynamic(lines) {
		if (!lines)
			this.ctx.clearRect(0, 0, this.gridSize, this.gridSize);
		else
		{
			for (const line of this.type.system.gridLines) {
				if (lines.some(l => l == line.uuid))
					this.eraseLine(line, this.ctx);
			}
		}
	}

    drawLines(lines) {
		//this.canvas = this.element.querySelector(".evolution-grid-lines");
		//this.ctx = this.canvas.getContext('2d', { alpha: true });
		//if (!lines)
		this.ctx.clearRect(0, 0, this.gridSize, this.gridSize);
		for (const line of (lines ?? this.type.system.gridLines)) {
			//shadowdark.log(`drawLines Drawing Dynamic Line. Static: ${line.static}`)
			if (!line.static)
				//shadowdark.log(`drawLines Drawing Dynamic Line.`);
				this.drawLine(line, this.ctx);
		}
    }

	drawLinesStatic(lines) {
		//this.staticCanvas = this.element.querySelector(".evolution-grid-lines-static");
		//this.staticCtx = this.staticCanvas.getContext('2d', { alpha: true });
		if (!lines)
			this.staticCtx.clearRect(0, 0, this.gridSize, this.gridSize);
		for (const line of (lines ?? this.type.system.gridLines)) {
			//shadowdark.log(`drawLinesStatic for ${line.uuid}. Static: ${line.static}`);
			if (lines || line.static)
			{
				if (!this.drawLine(line, this.staticCtx))
				{
					if (lines == null)
					{
						let lineIndex = this.type.system.gridLines.indexOf(line);
						this.type.system.gridLines.splice(lineIndex, 1);
					}
				}
			}
			//else if (paint && !line.static)
			//	this.eraseLine(line, this.staticCtx);
		}
	}

	eraseLinesStatic(lines) {
		for (const line of lines) {
			this.eraseLine(line, this.staticCtx);
		}
	}

	drawCircles() {
		this.circleCtx.clearRect(0, 0, this.gridSize, this.gridSize);
		for (let circle of this.type.system.gridCircles) {
			this.drawCircle(circle);
		}
	}

	COLORS = {
		brown: getComputedStyle(document.documentElement).getPropertyValue('--brown') || '#3b2a1a',
		white: getComputedStyle(document.documentElement).getPropertyValue('--white') || '#ffffff'
	};
	BROWN_WIDTH = 7;
	WHITE_WIDTH = 4;
	HIT_TOLERANCE = 30;
	GLOW_COLOR = "#ffd000";
    GLOW_SIZE = 20;
    GLOW_WIDTH = 20;

	drawCircle(circle) {
		this.circleCtx.lineCap = 'round';
    	const step = (Math.PI * 2) / circle.n;
		for (let i = 0; i < circle.n; i++) {
			if (!circle.visible[i]) continue;

			const node1 = this.type.system.gridTalents.find(t => t.uuid == circle.nodes[i].n1);
			const node2 = this.type.system.gridTalents.find(t => t.uuid == circle.nodes[i].n2);

			let outerGlow = false;
			let alpha = 1;

			if (!this.editing)
			{
				alpha = 0.4;
				if (this.actor)
				{
					const node1Learned = this.actor.system.evolutionGrid?.openNodes.some(n => n.uuid == node1.uuid);
					const node2Learned = this.actor.system.evolutionGrid?.openNodes.some(n => n.uuid == node2.uuid);

					if (node1Learned && node2Learned) {
						alpha = 1;
						outerGlow = true;
					}
					else {
						const node1Available = node1Learned ? false : this.actor.availableNodes.some(n => n.uuid == node1.uuid);
						const node2Available = node2Learned ? false : this.actor.availableNodes.some(n => n.uuid == node2.uuid);
						if ((node1Available && node2Learned) || (node2Available && node1Learned))
							alpha = 1;
					}
				}
			}
			else
				alpha = 1;

			const a1 = circle.angles[i];
			const a2 = (i === circle.n - 1) ? circle.angles[0] + 2 * Math.PI : circle.angles[i + 1];

			const path = new Path2D();
      		path.arc(circle.c.x, circle.c.y, circle.r, a1, a2, false);

			// glow pass
			if (outerGlow) {
			 	this.circleCtx.lineCap = 'round';
			 	this.circleCtx.shadowColor = this.GLOW_COLOR;
			 	this.circleCtx.shadowBlur  = this.GLOW_SIZE;
			 	this.circleCtx.strokeStyle = this.GLOW_COLOR;
			 	this.circleCtx.lineWidth   = this.GLOW_WIDTH;
			 	this.circleCtx.globalAlpha = alpha;
			 	this.circleCtx.stroke(path);
			 	this.circleCtx.shadowColor = null;
			 	this.circleCtx.shadowBlur  = 0;
			}

			// brown border
			this.circleCtx.lineWidth   = this.BROWN_WIDTH;
			this.circleCtx.strokeStyle = this.COLORS.brown;
			this.circleCtx.globalAlpha = alpha;
			this.circleCtx.stroke(path);

			// white core
			this.circleCtx.lineWidth   = this.WHITE_WIDTH;
			this.circleCtx.strokeStyle = this.COLORS.white;
			this.circleCtx.globalAlpha = alpha;
			this.circleCtx.stroke(path);
		}
	}

    drawLine(line, ctx) {
		const [p1, p2, node1, node2] = this.linePoints(line);
		if (p1 == null || p2 == null) return false;

		let outerGlow = false;
		let alpha = 1;

		if (!this.editing)
		{
			alpha = 0.4;
			if (this.actor)
			{
				const node1Learned = this.actor.system.evolutionGrid?.openNodes.some(n => n.uuid == node1.uuid);
				const node2Learned = this.actor.system.evolutionGrid?.openNodes.some(n => n.uuid == node2.uuid);

				if (node1Learned && node2Learned) {
					alpha = 1;
					outerGlow = true;
				}
				else {
					const node1Available = node1Learned ? false : this.actor.availableNodes.some(n => n.uuid == node1.uuid);
					const node2Available = node2Learned ? false : this.actor.availableNodes.some(n => n.uuid == node2.uuid);
					if ((node1Available && node2Learned) || (node2Available && node1Learned))
						alpha = 1;
				}
			}
		}
		else
			alpha = 1;

		// glow.
		if (outerGlow) {
			ctx.beginPath();
			ctx.globalAlpha = alpha;
			ctx.lineCap = 'round';
			ctx.shadowColor = this.GLOW_COLOR;
    		ctx.shadowBlur  = this.GLOW_SIZE;
    		ctx.strokeStyle = this.GLOW_COLOR;
    		ctx.lineWidth   = this.GLOW_WIDTH;
			ctx.moveTo(p1.x, p1.y);
			ctx.lineTo(p2.x, p2.y);
			ctx.stroke();
			ctx.shadowColor = null;
   			ctx.shadowBlur  = 0;
		}
		// brown stroke
		ctx.beginPath();
		ctx.globalAlpha = alpha;
		ctx.lineWidth = this.BROWN_WIDTH;
		ctx.strokeStyle = this.COLORS.brown;
		ctx.lineCap = 'round';
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.stroke();
		// white core
		ctx.beginPath();
		ctx.globalAlpha = alpha;
		ctx.lineWidth = this.WHITE_WIDTH;
		ctx.strokeStyle = this.COLORS.white;
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.stroke();
		return true;
    }

	eraseLine(line, ctx) {
		let [p1, p2, node1, node2] = this.linePoints(line);
		if ((p1 == null || p2 == null) && (line.p1 == null || line.p2 == null)) return;
		if (p1 == null) p1 = line.p1;
		if (p2 == null) p2 = line.p2;

		ctx.save();
		ctx.beginPath();
  		ctx.globalCompositeOperation = 'destination-out';
  		ctx.lineJoin = 'round';
		ctx.lineWidth = this.BROWN_WIDTH + 2;
		ctx.lineCap = 'round';
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.stroke();
  		ctx.restore();
	}

	eraseCircle(circle) {
		this.circleCtx.save();
  		this.circleCtx.globalCompositeOperation = 'destination-out';
  		this.circleCtx.lineJoin = 'round';
  		this.circleCtx.lineCap  = 'round';
  		this.circleCtx.lineWidth = this.BROWN_WIDTH + 2; // cover outer stroke + AA fringe
  		this.circleCtx.beginPath();
  		this.circleCtx.arc(circle.c.x, circle.c.y, circle.r, 0, Math.PI * 2, false);
  		this.circleCtx.stroke();
  		this.circleCtx.restore();
	}

	linePoints(line) {
		const node1 = this.type.system.gridTalents.find(t => t.uuid == line.node1);
		const node2 = this.type.system.gridTalents.find(t => t.uuid == line.node2);

		if (node1 == null)
		{
			// This shouldn't happen.
			shadowdark.debug(`EvolutionGridSD ERROR: Could not find node with UUID: ${line.node1}`);
		}
		if (node2 == null)
		{
			// This shouldn't happen.
			shadowdark.debug(`EvolutionGridSD ERROR: Could not find node with UUID: ${line.node2}`);
		}

		const p1 = {x: node1?.coordinates.x + this.iconSize / 2, y: node1?.coordinates.y + this.iconSize / 2};
		const p2 = {x: node2?.coordinates.x + this.iconSize / 2, y: node2?.coordinates.y + this.iconSize / 2};

		return [node1 == null ? null : p1, node2 == null ? null : p2, node1, node2];
	}

    addLine(node1, node2) {
		const p1 = {x : node1.coordinates.x + (this.iconSize / 2), y : node1.coordinates.y + (this.iconSize / 2)};
		const p2 = {x : node2.coordinates.x + (this.iconSize / 2), y : node2.coordinates.y + (this.iconSize / 2)};

		const line = {
			uuid: UtilitySD.generateUUID(),
			node1: node1.uuid,
			node2: node2.uuid,
			static: true
		};
		node1.lines.push(line.uuid);
		node2.lines.push(line.uuid);
		this.type.system.gridLines.push(line);
		this.updateGrid();
		this.scheduleDrawStatic();
		return line;
    }

    removeLine(line) {
		let node1 = this.type.system.gridTalents.find(t => t.uuid == line.node1);
		let node2 = this.type.system.gridTalents.find(t => t.uuid == line.node2);

		node1.lines = node1.lines.filter(l => l !== line.uuid);
		node2.lines = node2.lines.filter(l => l !== line.uuid);

		this.type.system.gridLines = this.type.system.gridLines.filter(l => l.uuid !== line.uuid);
		this.updateGrid();
		this.scheduleDrawStatic();
    }

    findLine(p) {
		// Prefer lines drawn later (on top)
		for (let i = this.type.system.gridLines.length - 1; i >= 0; i--){
			const line = this.type.system.gridLines[i];
			const [p1, p2, node1, node2] = this.linePoints(line);
			if (p1 == null || p2 == null) return null;

			let d;
			d = UtilitySD.pointToSegmentDistance(p, p1, p2);
			if (d <= Math.max(this.WHITE_WIDTH, this.BROWN_WIDTH)/2 + this.HIT_TOLERANCE)
				return line;
		}
		return null;
    }

	addDraggedTalentLinesToDynamicPaint(gridTalentId) {
		let lines = this.setTalentLinesStaticStatus(gridTalentId, false);

		if (this._multiSelectedNodes) {
			for (let node of this._multiSelectedNodes)
				lines.push(...this.setTalentLinesStaticStatus(node.uuid, false));
		}
		lines = UtilitySD.uniqBy(lines, l => l);
		return lines;
	}

	setTalentLinesStaticStatus(gridTalentId, status) {
		let lines = [];
		let gridTalent = this.type.system.gridTalents.find(t => t.uuid == gridTalentId);
		if (gridTalent && gridTalent.lines && Array.isArray(gridTalent.lines) && gridTalent.lines.length) {
			for (let lineId of gridTalent.lines) {
				let line = this.type.system.gridLines.find(l => l.uuid == lineId);
				if (line)
				{
					line.static = status;
					lines.push(line);
				}
			}
		}
		lines = UtilitySD.uniqBy(lines, l => l);
		return lines;
	}

	removeDraggedTalentLinesFromDynamicPaint() {
		this.setTalentLinesStaticStatus(this._draggedTalent.gridTalentId, true);

		if (this._multiSelectedNodes) {
			for (let node of this._multiSelectedNodes)
				this.setTalentLinesStaticStatus(node.uuid, true);
		}
	}

	adjustLinesToCircleCenter(c, lines) {
		for (let lineId of lines) {
			let line = this.type.system.gridLines.find(l => l.uuid == lineId);
			let node1 = this.type.system.gridTalents.find(t => t.uuid == line.node1);
			let node2 = this.type.system.gridTalents.find(t => t.uuid == line.node2);

			let l1 = {x: node1.coordinates.x + this.iconSize / 2, y: node1.coordinates.y + this.iconSize / 2};
			let l2 = {x: node2.coordinates.x + this.iconSize / 2, y: node2.coordinates.y + this.iconSize / 2};

			let a1 = Math.atan2(l1.y - c.y, l1.x - c.x);
			let a2 = Math.atan2(l2.y - c.y, l2.x - c.x);

			if (a2 < -Math.PI / 2 && a1 > Math.PI / 2) a2 += 2*Math.PI;
			if (a1 < -Math.PI / 2 && a2 > Math.PI / 2) a1 += 2*Math.PI;

			let cws = (a2 - a1) % (2*Math.PI);
			let ccws = (a1 - a2) % (2*Math.PI);
			let ccw = ccws > cws;

			let m = {x: (l1.x + l2.x) / 2, y: (l1.y + l2.y) / 2};
			let mv = {x: m.x - c.x, y: m.y - c.y};
			let nm = UtilitySD.normalize(mv);
			let r = Math.hypot(l1.x - c.x, l1.y - c.y);
			let sp = {x: c.x + nm.x * r, y: c.y + nm.y * r};
			let s = Math.hypot(sp.x - m.x, sp.y - m.y);
			line.s = s * (ccw ? -1 : 1);
		}
	}

	_rafPending = false;
	scheduleDraw(lines) {
		if (this._rafPending) return;
		this._rafPending = true;
		requestAnimationFrame(() => {
			this.drawLines(lines);
			this._rafPending = false;
		});
	}

	//_rafStaticPending = false;
	scheduleDrawStatic(lines) {
		//if (this._rafStaticPending) return;
		//this._rafStaticPending = true;
		requestAnimationFrame(() => {
			//this._rafStaticPending = false;
			this.drawLinesStatic(lines);
		});
	}

	//_rafStaticPending = false;
	scheduleDrawCircles() {
		//if (this._rafStaticPending) return;
		//this._rafStaticPending = true;
		requestAnimationFrame(() => {
			//this._rafStaticPending = false;
			this.drawCircles();
		});
	}

	//_rafStaticPending = false;
	scheduleEraseStatic(lines) {
		//if (this._rafStaticPending) return;
		//this._rafStaticPending = true;
		requestAnimationFrame(() => {
			//this._rafStaticPending = false;
			this.eraseLinesStatic(lines);
		});
	}

	//_rafGridPending = false;
	scheduleGrid() {
		//if (this._rafGridPending) return;
		//this._rafGridPending = true;
		requestAnimationFrame(() => {
			//this._rafGridPending = false;
			this.drawGrid();
		});
	}

	DISTANCE_THRESHOLD = 900;
	setupAllCircleArcs() {
		for (let circle of this.type.system.gridCircles) {
			this.setupCircleArcs(circle, null, circle.angles);
		}
		this.updateGrid();
	}

	setupCircleArcs(circle, nodes, angles) {
		const step = (Math.PI * 2) / circle.n;

		if (!circle.nodes)
		{
			circle.nodes = [];
			if (!circle.angles)
			{
				circle.angles = [];
				for (let i = 0; i < circle.n; i++) {
					const a = circle.theta0 + i * step;
					circle.angles.push(a);
				}
			}
		}

		if (angles == null && circle.angles == null)
		{
			angles = [];
			for (let i = 0; i < circle.n; i++) {
				const node = this.type.system.gridTalents.find(t => t.uuid == circle.nodes[i].n1);
				const point = {x: node.coordinates.x + (this.iconSize / 2) - circle.c.x, y: node.coordinates.y + (this.iconSize / 2) - circle.c.y};
				const a = Math.atan2(point.y, point.x);
				angles.push(a);
			}
		}
		else if (angles == null && circle.angles != null)
			angles = circle.angles;

		UtilitySD.coSort(angles, circle.nodes);
		circle.angles = angles;

		for (let i = 0; i < circle.n; i++) {
			const a0 = angles[i];
			const a1 = (i === circle.n - 1) ? angles[0] + 2 * Math.PI : angles[i+1];

			const s = a0;
			const e = a1;

			const p1 = { x: circle.c.x + circle.r * Math.cos(s), y: circle.c.y + circle.r * Math.sin(s) };
			const p2 = { x: circle.c.x + circle.r * Math.cos(e), y: circle.c.y + circle.r * Math.sin(e) };

			for (let node of nodes ?? this.type.system.gridTalents) {
				let talentCenter = {x: node.coordinates.x + (this.iconSize / 2), y: node.coordinates.y + (this.iconSize / 2)};
				let distance1 = (talentCenter.x - p1.x) * (talentCenter.x - p1.x) + (talentCenter.y - p1.y) * (talentCenter.y - p1.y);
				let distance2 = (talentCenter.x - p2.x) * (talentCenter.x - p2.x) + (talentCenter.y - p2.y) * (talentCenter.y - p2.y);

				if (distance1 <= this.DISTANCE_THRESHOLD || distance2 <= this.DISTANCE_THRESHOLD) {
					if (!node.arcs) node.arcs = [];
					if (!node.arcs.some(a => a.circle == circle.uuid && a.arc == i))
						node.arcs.push({circle: circle.uuid, arc: i});

					if (!circle.nodes[i]) circle.nodes[i] = {n1: null, n2: null};
					if (distance1 <= this.DISTANCE_THRESHOLD)
						circle.nodes[i].n1 = node.uuid;
					if (distance2 <= this.DISTANCE_THRESHOLD)
						circle.nodes[i].n2 = node.uuid;
				}
				if (node.arcs)
					node.arcs = UtilitySD.uniqBy(node.arcs, a => a.circle + '.' + a.arc);
			}
		}
	}

	setDebugText(text) {
		let debugDiv = this.element.querySelector(".evolution-grid-debug");
		if (!debugDiv) return;
		debugDiv.innerHTML = text;
	}

	async updateGrid()
	{
		const lastStep = {
			gridLines: structuredClone(this.type.system.gridLines),
			gridTalents: structuredClone(this.type.system.gridTalents),
			grid: structuredClone(this.type.system.grid),
			gridCircles: structuredClone(this.type.system.gridCircles)
		};
		this._undoSteps.push(lastStep);
		if (this._undoSteps.length > this.MAX_UNDO_STEPS)
			this._undoSteps.splice(0, 1);

		await this.type.update({
			"system.gridLines": this.type.system.gridLines,
			"system.gridTalents": this.type.system.gridTalents,
			"system.grid": this.type.system.grid,
			"system.gridCircles": this.type.system.gridCircles
		});
	}

	doUndo()
	{
		if (this._undoSteps.length < 2) return;

		this.type.system.gridLines = structuredClone(this._undoSteps[this._undoSteps.length - 2].gridLines);
		this.type.system.gridTalents = structuredClone(this._undoSteps[this._undoSteps.length - 2].gridTalents);
		this.type.system.grid = structuredClone(this._undoSteps[this._undoSteps.length - 2].grid);
		this.type.system.gridCircles = structuredClone(this._undoSteps[this._undoSteps.length - 2].gridCircles);

		this._undoSteps.splice(this._undoSteps.length - 1, 1);
		this.talentsGrid.innerHTML = '';

		this.grid.style.transformOrigin = "top left";
		this.grid.style.transform = `scale(${this.gridPosition.zoom})`;
		this.grid.style.left = this.gridPosition.left + 'px';
		this.grid.style.top = this.gridPosition.top + 'px';

		this.renderAll();
	}

	sanityCheck() {
		// Checks if each line is connected to 2 nodes.
		for (let i = 0; i < this.type.system.gridLines.length; i++)
		{
			const line = this.type.system.gridLines[i];
			const node1 = this.type.system.gridTalents.find(t => t.uuid == line.node1);
			const node2 = this.type.system.gridTalents.find(t => t.uuid == line.node2);

			if (node1 == null || node2 == null)
			{
				shadowdark.debug(`sanityCheck: No node connected to line ${line.uuid}`);
				this.type.system.gridLines.splice(i, 1);
				i--;
			}
		}

		// Check if each node contains valid lines and arcs.
		for (let i = 0; i < this.type.system.gridTalents.length; i++)
		{
			const node = this.type.system.gridTalents[i];
			for (let a = 0; a < node.lines?.length; a++)
			{
				const lineId = node.lines[a];
				const line = this.type.system.gridLines.find(l => l.uuid == lineId);
				if (line == null) {
					shadowdark.debug(`sanityCheck: node ${node.uuid} has non-existant line ${lineId}`);
					node.lines.splice(a, 1);
					a--;
				}
			}

			for (let a = 0; a < node.arcs?.length; a++)
			{
				const nodeArc = node.arcs[a];
				const circle = this.type.system.gridCircles.find(c => c.uuid == nodeArc.circle);
				if (circle == null) {
					shadowdark.debug(`sanityCheck: node ${node.uuid} has non-existant circle ${nodeArc.circle}`);
					node.arcs.splice(a, 1);
					a--
					continue;
				}

				if (nodeArc.arc < 0 || nodeArc.arc > circle.n) {
					shadowdark.debug(`sanityCheck: node ${node.uuid} has invalid arc index ${nodeArc.arc} for circle ${nodeArc.circle}`);
					node.arcs.splice(a, 1);
					a--;
				}
			}
		}

		for (let i = 0; i < this.type.system.gridCircles.length; i++)
		{
			const circle = this.type.system.gridCircles[i];
			for (let a = 0; a < circle.nodes?.length; a++)
			{
				const circleNode = circle.nodes[a];
				if (circleNode == null) {
					shadowdark.debug(`sanityCheck: Null circle node at circle ${circle.uuid}`);
					circle.nodes.splice(a, 1);
					a--;
					continue;
				}

				const node1 = this.type.system.gridTalents.find(t => t.uuid == circleNode.n1);
				const node2 = this.type.system.gridTalents.find(t => t.uuid == circleNode.n2);

				if (node1 == null || node2 == null)
				{
					shadowdark.debug(`sanityCheck: No node connected to arc at circle ${circle.uuid}`);
					circle.nodes.splice(a, 1);
					a--;
				}
			}

			if (circle.nodes?.length == 0) {
				shadowdark.debug(`sanityCheck: No nodes at all connected to circle ${circle.uuid}`);
				this.type.system.gridCircles.splice(i, 1);
			}
		}
	}
}
