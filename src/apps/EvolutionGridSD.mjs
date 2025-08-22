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
		//this.setupAllCircleArcs();
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
			squareGrid: this.#onSquareGrid,
			triangularGrid: this.#onTriangularGrid
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
		return 10000;
	}

	get gridSpacing() {
		return 128;
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
		if (!this.editing) return;
		if (event.currentTarget.classList.contains("evolutionTalent"))
		{
			let gridClick = this.getGridClick(event);
			const gridTalentId = event.currentTarget.dataset.id;

			this._draggedTalent = {
				content: event.currentTarget,
				gridTalentId: gridTalentId,
				originalEventX: gridClick.x,
				originalEventY: gridClick.y,
				originalDivX: UtilitySD.parseIntOrZero(event.currentTarget.style.left),
				originalDivY: UtilitySD.parseIntOrZero(event.currentTarget.style.top)
			};
			this._draggedLines = this.addDraggedTalentLinesToDynamicPaint(gridTalentId);
			this.scheduleEraseStatic(this._draggedLines);

			if (this._multiSelectedNodes) {
				if (!this._multiSelectedNodes.some(n => n.uuid == gridTalentId))
					this._multiSelectedNodes = null;
			}
			this._dragging = true;
		}
	}

	/** @override */
	async _onDragOver(event) {
		if (!this.editing) return;
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

			if (gridTalent)
			{
				gridTalent.coordinates = {x: UtilitySD.parseIntOrZero(this._draggedTalent.content.style.left),
										  y: UtilitySD.parseIntOrZero(this._draggedTalent.content.style.top)};
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
				}
			}

			if (this._draggedLines)
				this.scheduleDraw(this._draggedLines);
		}
	}

	/** @override */
	async _onDrop(event) {
		//shadowdark.log(`onDrop`);
		if (!this.editing) return;
		const eventData = foundry.applications.ux.TextEditor.getDragEventData(event);
		if (!eventData) return;
		let uuid = eventData.uuid;

		let gridClick = this.getGridClick(event);
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
		this.type.update({"system.gridTalents": this.type.system.gridTalents, "system.gridLines": this.type.system.gridLines, "system.grid": this.type.system.grid});
		//shadowdark.log(`onDrop Done`);
	}

	/** @override */
	async _onRender(context, options) {
		await super._onRender(context, options);
		this.grid = this.element.querySelector(".evolution-grid");
		this.talentsGrid = this.element.querySelector(".evolution-grid-talents");
		await this.drawTalents();
		this.refreshMultiSelectNodes();
		this.updateNodesDraggableStatus();
		this.updateGridTypeVisibility();
		if ((this._multiSelectedNodes ?? []).length > 1)
			this.showAlignMenu();

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

		this.#dragDrop.forEach((d) => d.bind(this.element))
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
		this.grid.style.transform = `scale(${this.type.system.grid.zoom})`;
		this.grid.style.left = this.type.system.grid.left + 'px';
		this.grid.style.top = this.type.system.grid.top + 'px';

		this.#dragDrop.forEach((d) => d.bind(this.element))
	}

	/** @override */
	async activateListeners() {
		if (!this.element) return;
		if (this.grid)
		{
			this.grid.addEventListener("mousewheel", async(event) => {
                await this._doZoom(event);
			});

			this.grid.addEventListener("mousedown", async(event) => {
                await this._doMouseDown(event);
			});

			this.grid.addEventListener("mouseup", async(event) => {
                await this._doMouseUp(event);
			});

			this.grid.addEventListener("mousemove", async(event) => {
                await this._doMouseMove(event);
			});

			this.grid.addEventListener("mouseleave", async(event) => {
                await this._doMouseLeave(event);
			});
		}
	}

	/** @override */
	async _prepareContext(options) {
		let context = {
			editing: this.editing,
			gridLeft: this.type.system.grid.left,
			gridTop: this.type.system.grid.top,
			gridSize: this.gridSize,
			showEditIcon: game.user.isGM
		};

		return context;
	}

	/** @override */
	static async #onSubmit(event, form, formData) {
		
	}

	static async #onEditEvolutionGrid(event, form, formData) {
		if (this.editing == null) this.editing = false;
		if (game.user.isGM)
		{
			this.editing = !this.editing;
			this.updateNodesDraggableStatus();
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
		await this.type.update({"system.gridTalents": this.type.system.gridTalents});
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
		await this.type.update({"system.gridTalents": this.type.system.gridTalents});
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

		await this.type.update({"system.gridTalents": this.type.system.gridTalents});
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
			multiSelectedNode.content.style.top = aligned.x + 'px';
			multiSelectedNode.content.style.left = aligned.y + 'px';
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
    		paths: [],
			nodes: Array(points.length).fill(null),
		};
		this.setupCircleArcs(circle, nodes);

		this.type.system.gridCircles.push(circle);
		this.scheduleDrawCircles();
		await this.type.update({"system.gridTalents": this.type.system.gridTalents, "system.gridLines": this.type.system.gridLines, "system.gridCircles": this.type.system.gridCircles});
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

	#zooming
    async _doZoom(event) {
		if (event.wheelDelta) {
			if (!this.#zooming)
			{
				this.#zooming = true;
				if (!this.type.system.grid.zoom) this.type.system.grid.zoom = 1;
				let zoomCenter = this.getGridClick(event);
				let prevZoom = this.type.system.grid.zoom;
				if (event.wheelDelta > 0) { // Zoom In
					this.type.system.grid.zoom += 0.01;
					if (this.type.system.grid.zoom > 1) this.type.system.grid.zoom = 1;
				} else { // Zoom Out
					this.type.system.grid.zoom -= 0.01;
					if (this.type.system.grid.zoom < 0.1) this.type.system.grid.zoom = 0.1;
				}
				//await this.type.update({"system.grid.zoom": this.type.system.grid.zoom});
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
		if (!this.type.system.grid.zoom) this.type.system.grid.zoom = 1;
		//const parentRect = event.currentTarget.getBoundingClientRect();
		//let x = event.clientX - parentRect.left;
  		//let y = event.clientY - parentRect.top;

		const topLeft = this.elementPageTopLeft(this.grid); // page coords of canvas (no gBCR)
		let x = event.pageX - topLeft.x;
  		let y = event.pageY - topLeft.y;

		x /= this.type.system.grid.zoom;
		y /= this.type.system.grid.zoom;

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
			let gridClick = this.getGridClick(event);
			let node;
			let line;
			if (this.editing)
			{
				node = this.findNode(gridClick);
				//line = this.findLine(gridClick);
			}
			if (node == null && line == null)
			{
				let gridLeft = UtilitySD.parseIntOrZero(this.grid.style.left);
				let gridTop = UtilitySD.parseIntOrZero(this.grid.style.top);
				this.#movingCanvas = {x: event.clientX, y: event.clientY, left : gridLeft, top: gridTop};
			}
		}
		else if (event.button === 0 && event.ctrlKey && !event.shiftKey && !this._dragging) {
			if (!this.editing) return;
			//Plot Lines.
			let gridClick = this.getGridClick(event);
			let node = this.findNode(gridClick)
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
			}
		}
		if (event.button === 0 && !event.ctrlKey && event.shiftKey && !this._dragging) {
			// Multiselect
			if (!this.editing) return;
			this.startMultiselect(event);
		}
		else if (event.button === 2 && !event.ctrlKey && !event.shiftKey ) {
			//Pop out the talent.
			let gridClick = this.getGridClick(event);
			let node = this.findNode(gridClick);
			if (node) {
				let item = await fromUuid(node.itemUuid);
				if (item) {
					let itemSheet = new ItemSheetSD({document: item});
					itemSheet.render(true);
				}
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
			this.type.update({"system.gridTalents": this.type.system.gridTalents, "system.grid": this.type.system.grid});
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
		await this.type.update({"system.gridTalents": this.type.system.gridTalents, "system.grid": this.type.system.grid});
	}

	async addElementDiv(gridTalent, item) {
		this.talentsGrid.innerHTML += this.getTalentDiv(gridTalent, item);
		this.#dragDrop.forEach((d) => d.bind(this.element));
	}

	getTalentDiv(gridTalent, item) {
		const dropX = gridTalent.coordinates.x;
		const dropY = gridTalent.coordinates.y;

		return	'<div style="display: grid; position: absolute; top: ' + dropY + 'px; left: ' + dropX + 'px; width: ' + this.iconSize + 'px; height: ' + this.iconSize + 'px;" '+
				'class="evolutionTalent draggable' + (this.editing ? '' : ' unchosen') + '" data-id="' + gridTalent.uuid + '" data-item-id="' + gridTalent.itemUuid + '"  data-tooltip="' + item.name + '">'+
				'<img style="width: ' + this.iconSize + 'px; height: ' + this.iconSize + 'px;" class="evolution-talent-img" src="' + item.img + '">'+
				'</div>';
	}

	async resizeGrid(zoomCenter, prevZoom) {
		if (!this.grid) return;

		let left = UtilitySD.parseIntOrZero(this.grid.style.left);
		let top = UtilitySD.parseIntOrZero(this.grid.style.top);

		let prevSize = this.gridSize * prevZoom;
		let size = this.gridSize * this.type.system.grid.zoom;

		let xRate = zoomCenter.x / this.gridSize;
		let yRate = zoomCenter.y / this.gridSize;

		let delta = prevSize - size;

		left += delta * xRate;
		top += delta * yRate;

		this.grid.style.transformOrigin = "top left";
		[top, left, this.type.system.grid.zoom] = this.moveGridToBounds(top, left, this.type.system.grid.zoom);
		this.grid.style.top = top + 'px';
		this.grid.style.left = left + 'px';
		//grid.style.transformOrigin = zoomCenter.x + "px " + zoomCenter.y + "px";
		this.grid.style.transform = `scale(${this.type.system.grid.zoom})`;
		this.type.system.grid.left = UtilitySD.parseIntOrZero(this.grid.style.left);
		this.type.system.grid.top = UtilitySD.parseIntOrZero(this.grid.style.top);
		this.#dragDrop.forEach((d) => d.bind(this.element))
	}

	async panGrid(event) {
		const moveDelta = {x: event.clientX - this.#movingCanvas.x, y: event.clientY - this.#movingCanvas.y};
		const newPosition = {left: this.#movingCanvas.left + moveDelta.x, top: this.#movingCanvas.top + moveDelta.y};

		this.type.system.grid.left = newPosition.left;
		this.type.system.grid.top = newPosition.top;
		[newPosition.top, newPosition.left, this.type.system.grid.zoom] = this.moveGridToBounds(newPosition.top, newPosition.left, this.type.system.grid.zoom);
		this.grid.style.left = newPosition.left + 'px';
		this.grid.style.top = newPosition.top + 'px';
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
		return [top, left, zoom];
	}

	async drawTalents() {
		if (this.type.system.gridTalents) {
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

				await this.addElementDiv(gridTalent, item)
			}
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
				this.type.system.gridTalents.splice(i, 1);
				const el = this.element.querySelector('div.evolutionTalent[data-id="'+gridTalent.uuid+'"]');
				if (el) {
  					el.remove();
					this.#dragDrop.forEach((d) => d.bind(this.element))
					this.type.update({"system.gridTalents": this.type.system.gridTalents, "system.grid": this.type.system.grid});
				}
				return true;
			}
		}
		return false;
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

	updateNodesDraggableStatus() {
		for (let gridTalent of this.type.system.gridTalents)
		{
			const talentDiv = this.element.querySelector('div.evolutionTalent[data-id="'+gridTalent.uuid+'"]');
			if (talentDiv)
			{
				if (this.editing)
					talentDiv.classList.add("draggable");
				else
					talentDiv.classList.remove("draggable");
			}
		}
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
			this.type.update({"system.gridCircles": this.type.system.gridCircles});
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
				const a1 = circle.theta0 + i * step;
				const a2 = a1 + step;
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
			const xTranslations = [0, this.gridSpacing / 2, 0];
			const offset = {x : -(2 * this.gridSpacing / Math.sqrt(3)) * 0.075, y : this.gridSpacing * 0.424};

			for (let i = 0; i < angles.length; i++) {
				const angle = angles[i];
				const xTranslation = xTranslations[i];
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
				this.drawLine(line, this.staticCtx);
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

	drawCircle(circle) {
		this.circleCtx.lineCap = 'round';
    	const step = (Math.PI * 2) / circle.n;
		for (let i = 0; i < circle.n; i++) {
			if (!circle.visible[i]) continue;

			if (!this.editing)
			{
				this.circleCtx.globalAlpha = 0.4;
			}
			else
				this.circleCtx.globalAlpha = 1;

      		const a1 = circle.theta0 + i * step;
      		const a2 = a1 + step;
      		const path = new Path2D();
      		path.arc(circle.c.x, circle.c.y, circle.r, a1, a2, false);

			// brown border
			this.circleCtx.lineWidth   = this.BROWN_WIDTH;
			this.circleCtx.strokeStyle = this.COLORS.brown;
			this.circleCtx.stroke(path);

			// white core
			this.circleCtx.lineWidth   = this.WHITE_WIDTH;
			this.circleCtx.strokeStyle = this.COLORS.white;
			this.circleCtx.stroke(path);
		}
	}

    drawLine(line, ctx) {
		const [p1, p2] = this.linePoints(line);

		ctx.beginPath();
		if (!this.editing)
		{
			ctx.globalAlpha = 0.4;
		}
		else
			ctx.globalAlpha = 1;
		ctx.lineWidth = this.BROWN_WIDTH;
		ctx.strokeStyle = this.COLORS.brown;
		ctx.lineCap = 'round';
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.stroke();
		// white core
		ctx.beginPath();
		ctx.lineWidth = this.WHITE_WIDTH;
		ctx.strokeStyle = this.COLORS.white;
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.stroke();
		return;
    }

	eraseLine(line, ctx) {
		const [p1, p2] = this.linePoints(line);

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
		let node1 = this.type.system.gridTalents.find(t => t.uuid == line.node1);
		let node2 = this.type.system.gridTalents.find(t => t.uuid == line.node2);

		const p1 = {x: node1.coordinates.x + this.iconSize / 2, y: node1.coordinates.y + this.iconSize / 2};
		const p2 = {x: node2.coordinates.x + this.iconSize / 2, y: node2.coordinates.y + this.iconSize / 2};

		return [p1, p2];
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
		this.type.update({"system.gridLines": this.type.system.gridLines, "system.gridTalents": this.type.system.gridTalents});
		this.scheduleDrawStatic();
		return line;
    }

    removeLine(line) {
		let node1 = this.type.system.gridTalents.find(t => t.uuid == line.node1);
		let node2 = this.type.system.gridTalents.find(t => t.uuid == line.node2);

		node1.lines = node1.lines.filter(l => l !== line.uuid);
		node2.lines = node2.lines.filter(l => l !== line.uuid);

		this.type.system.gridLines = this.type.system.gridLines.filter(l => l.uuid !== line.uuid);
		this.type.update({"system.gridLines": this.type.system.gridLines, "system.gridTalents": this.type.system.gridTalents});
		this.scheduleDrawStatic();
    }

    findLine(p) {
		// Prefer lines drawn later (on top)
		for (let i = this.type.system.gridLines.length - 1; i >= 0; i--){
			const line = this.type.system.gridLines[i];
			const [p1, p2] = this.linePoints(line);
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
				line.static = status;
				lines.push(line);
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
			this.setupCircleArcs(circle);
		}
		this.type.update({"system.gridTalents": this.type.system.gridTalents, "system.gridCircles": this.type.system.gridCircles});
	}

	setupCircleArcs(circle, nodes) {
		if (!circle.nodes) circle.nodes = Array(circle.n).fill(null);
		const step = (Math.PI * 2) / circle.n;
		for (let i = circle.n - 1; i >= 0; i--) {
			const a0 = circle.theta0 + i * step;
			const a1 = a0 + step;

			const s = circle.theta0 + a0;
			const e = circle.theta0 + a1;

			const p1 = { x: circle.c.x + circle.r * Math.cos(s), y: circle.c.y + circle.r * Math.sin(s) };
			const p2 = { x: circle.c.x + circle.r * Math.cos(e), y: circle.c.y + circle.r * Math.sin(e) };

			for (let node of nodes ?? this.type.system.gridTalents) {
				let talentCenter = {x: node.coordinates.x + (this.iconSize / 2), y: node.coordinates.y + (this.iconSize / 2)};
				let distance1 = (talentCenter.x - p1.x) * (talentCenter.x - p1.x) + (talentCenter.y - p1.y) * (talentCenter.y - p1.y);
				let distance2 = (talentCenter.x - p2.x) * (talentCenter.x - p2.x) + (talentCenter.y - p2.y) * (talentCenter.y - p2.y);

				if (distance1 <= this.DISTANCE_THRESHOLD || distance2 <= this.DISTANCE_THRESHOLD) {
					if (!node.arcs) node.arcs = [];
					node.arcs.push({circle: circle.uuid, arc: i});
					if (!circle.nodes[i]) circle.nodes[i] = {n1: null, n2: null};
					if (distance1 <= this.DISTANCE_THRESHOLD)
						circle.nodes[i].n1 = node.uuid;
					if (distance2 <= this.DISTANCE_THRESHOLD)
						circle.nodes[i].n2 = node.uuid;
				}
			}
		}
	}
}
