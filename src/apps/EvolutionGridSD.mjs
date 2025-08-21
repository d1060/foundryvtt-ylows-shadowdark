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
	#lastLineClickTimestamp

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
		if (!this.type.system.grid) this.type.system.grid = {zoom: 1, left: -(this.gridSize/2-400), top: -(this.gridSize/2-400), type: 'triangular'};
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
				dragend: this._onDragEnd.bind(this),
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

			if (gridTalent.lines.length > 0) this.scheduleDraw();
		}
	}

	async _onDragEnd(event) {
		if (!this.editing) return;
		if (this._draggedTalent)
		{
			const gridTalentId = this._draggedTalent.content.dataset.id;
			const gridTalent = this.type.system.gridTalents.find(t => t.uuid === gridTalentId);
			if (gridTalent)
			{
				gridTalent.coordinates = {x: UtilitySD.parseIntOrZero(this._draggedTalent.content.style.left),
										  y: UtilitySD.parseIntOrZero(this._draggedTalent.content.style.top)};
			}

			if (this._multiSelectedNodes) {
				for (let node of this._multiSelectedNodes) {
					const nodeTalent = this.type.system.gridTalents.find(t => t.uuid === node.uuid);
					if (nodeTalent)
					{
						nodeTalent.coordinates = {x: UtilitySD.parseIntOrZero(node.content.style.left),
												  y: UtilitySD.parseIntOrZero(node.content.style.top)};
					}
				}
			}
		}
		this._draggedTalent = null;
		this._dragging = false;
		this.#movingCanvas = null;
		await this.type.update({"system.gridTalents": this.type.system.gridTalents, "system.grid": this.type.system.grid});
	}

	/** @override */
	async _onDrop(event) {
		if (!this.editing) return;
		const eventData = foundry.applications.ux.TextEditor.getDragEventData(event);
		if (!eventData) return;
		let uuid = eventData.uuid;

		let gridClick = this.getGridClick(event);
		let snappedGridClick = this.snapToGrid(gridClick);

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
				lines: []
			};

			await this.addNewTalent(gridTalent, item);
		}
		else
		{
			const div = event.target.closest('div');
			let gridTalentId = div.dataset.id;
			let gridTalent = this.type.system.gridTalents.find(t => t.uuid == gridTalentId);
			if (gridTalent)
				gridTalent.coordinates = {x: dropCoordinates.x, y: dropCoordinates.y};
			div.style.left = dropCoordinates.x + 'px';
			div.style.top = dropCoordinates.y + 'px';

			if (this._multiSelectedNodes) {
				const dropSnapDelta = {x: snappedGridClick.x - gridClick.x, y: snappedGridClick.y - gridClick.y};
				for (let node of this._multiSelectedNodes) {
					if (node.uuid === gridTalentId) continue;
					node.content.style.left = UtilitySD.parseIntOrZero(node.content.style.left) + dropSnapDelta.x + 'px';
					node.content.style.top = UtilitySD.parseIntOrZero(node.content.style.top) + dropSnapDelta.y + 'px';

					const nodeTalent = this.type.system.gridTalents.find(t => t.uuid === node.uuid);
					if (nodeTalent)
					{
						let dropCoordinates = this.snapToGrid({x: nodeTalent.coordinates.x + dropSnapDelta.x, y: nodeTalent.coordinates.y + dropSnapDelta.y});
						nodeTalent.coordinates = {x: dropCoordinates.x, y: dropCoordinates.y};
					}
				}
			}
			this.scheduleDraw();
		}
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
		this.canvas = this.element.querySelector(".evolution-grid-lines");
		this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
		this.resizeCanvas();
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

		let points = [], lines = [], c;
		for (let multiSelectedNode of this._multiSelectedNodes)
		{
			let gridTalent = this.type.system.gridTalents.find(t => t.uuid == multiSelectedNode.uuid);
			points.push(gridTalent.coordinates);
			for (let lineId of gridTalent.lines)
			{
				for (let otherMultiSelectedNode of this._multiSelectedNodes) {
					if (otherMultiSelectedNode == multiSelectedNode) continue;
					let otherGridTalent = this.type.system.gridTalents.find(t => t.uuid == otherMultiSelectedNode.uuid);
					let foundMatch = false;
					for (let otherLineId of otherGridTalent.lines) {
						if (lineId === otherLineId)
						{
							lines.push(lineId);
							foundMatch = true;
							break;
						}
					}
					if (foundMatch)
						break;
				}
			}
		}
		[points, c] = UtilitySD.circleAlign(points);
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
		lines = UtilitySD.uniqBy(lines, l => l);
		//this.adjustLinesToCircleCenter(c, lines);

		await this.type.update({"system.gridTalents": this.type.system.gridTalents, "system.gridLines": this.type.system.gridLines});
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

	snapToGrid(coordinates) {
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
			// if (!node && line)
			// {
			// 	if (!this.editing) return;
			// 	let dt = 1000;
			// 	if (this.#lastLineClickTimestamp)
			// 	{
			// 		dt = event.timeStamp - this.#lastLineClickTimestamp;
			// 	}
			// 	this.#lastLineClickTimestamp = event.timeStamp;
			// 	if (dt <= 500)
			// 	{
			// 		line.s = 0;
			// 		this.type.update({"system.gridLines": this.type.system.gridLines});
			// 	}
			// 	else
			// 	{
			// 		this._draggingLine = line;
			// 		line.s = this.updateSagittaFromPointer(this._draggingLine, gridClick);
			// 	}
			// 	this.drawLines();
			// }
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
			if (!this.deleteNode(gridClick))
				this.deleteLine(gridClick)
			else
				this.scheduleGrid();
		}
	}

	async _doMouseUp(event) {
		if (this.#movingCanvas)
		{
			this.#movingCanvas = null;
			this.type.update({"system.gridTalents": this.type.system.gridTalents, "system.grid": this.type.system.grid});
		}
		//if (this._draggingLine)
		//{
		//	this._draggingLine = null;
		//	this.type.update({"system.gridLines": this.type.system.gridLines});
		//}
		if (this.#multiselect) {
			this.endMultiselect(event);
		}
		else if (this._multiSelectedNodes)
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
		// else if (this._draggingLine) {
		// 	if (!this.editing) return;
		// 	const gridClick = this.getGridClick(event);
		// 	this._draggingLine.s = this.updateSagittaFromPointer(this._draggingLine, gridClick);
		// 	this.drawLines();
		// }
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
			//this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
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
				'class="evolutionTalent draggable" data-id="' + gridTalent.uuid + '" data-item-id="' + gridTalent.itemUuid + '"  data-tooltip="' + item.name + '">'+
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

	async renderElements() {
		this.scheduleDraw();
		await this.drawTalents();
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
		this.#multiselect = gridClick;
		const multiSelectGrid = this.element.querySelector('.evolution-grid-multiselect');
		multiSelectGrid.classList.remove("hidden");

		//this.drawGrid();
		//this.canvas = this.element.querySelector(".evolution-grid-lines");
		//this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
		this.scheduleDraw();
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

	deleteLine(gridClick) {
        const line = this.findLine(gridClick);
        if (line) {
			this.removeLine(line);
		}
	}

	//_draggingLine
    circleFromChordSagitta(p1, p2, s) {
		const dx = p1.x - p2.x, dy = p1.y - p2.y;
		const c = Math.hypot(dx, dy);
		if (c < 1e-6) return null;
		const R = (s === 0) ? Infinity : ( (c*c)/(8*Math.abs(s)) + Math.abs(s)/2 );
		if (!isFinite(R)) return { straight:true };
		const M = {x:(p1.x+p2.x)/2, y:(p1.y+p2.y)/2};
		const u = UtilitySD.normalize({x:p2.x-p1.x, y:p2.y-p1.y});
		const n = UtilitySD.perp(u);
		const h = R - Math.abs(s);
		const sign = (s>=0)?1:-1;
		const C = { x: M.x + n.x * h * sign, y: M.y + n.y * h * sign };
		// Angles
		let a1 = Math.atan2(p1.y - C.y, p1.x - C.x);
		let a2 = Math.atan2(p2.y - C.y, p2.x - C.x);
		// Choose the minor arc whose midpoint bulges toward +sign * n (sagitta side)
		// Candidate 1: CCW minor if ccw sweep <= PI, else CW minor
		let ccwSweep = ( (a2 - a1) % (2*Math.PI) + 2*Math.PI ) % (2*Math.PI); // [0,2π)
		let anticwForMinor = ccwSweep <= Math.PI; // CCW gives minor arc
		// mid angle for that choice
		let sweepLen = anticwForMinor ? ccwSweep : (2*Math.PI - ccwSweep);
		let aMid = anticwForMinor ? (a1 + sweepLen/2) : (a1 - sweepLen/2);
		const M_arc = { x: C.x + Math.cos(aMid)*R, y: C.y + Math.sin(aMid)*R };
		const uPerp = n; // direction of positive sagitta
		const v = { x: M_arc.x - ((p1.x+p2.x)/2), y: M_arc.y - ((p1.y+p2.y)/2) };
		const side = v.x*uPerp.x + v.y*uPerp.y; // >0 means bulging toward +n
		// If bulge side doesn't match s sign, flip direction to major-vs-minor counterpart (still stays <= π)
		if ((side >= 0 ? 1 : -1) !== sign){ anticwForMinor = !anticwForMinor; }

		return { straight:false, cx:C.x, cy:C.y, r:R, a1, a2, anticlockwise: !anticwForMinor ? false : true };
    }

    updateSagittaFromPointer(line, ptr) {
		const [p1, p2, s] = this.linePoints(line);
		const M = {x:(p1.x+p2.x)/2, y:(p1.y+p2.y)/2};
		const u = UtilitySD.normalize({x:p2.x-p1.x, y:p2.y-p1.y});
		const n = UtilitySD.perp(u);
		const v = {x:ptr.x - M.x, y:ptr.y - M.y};
		return -(v.x*n.x + v.y*n.y); // signed
    }

    // Sampling-based distance from point to an arc (for picking)
    pointToArcDistance(p, params) {
		if (params.straight) return UtilitySD.pointToSegmentDistance(p, params.p1, params.p2);
		const {cx, cy, r} = params;
		// Generate a short polyline along the chosen arc
		const steps = 24; // enough for smooth picking
		const pts = this.arcPolyline(params, steps);
		let minD = Infinity;
		for (let i=0;i<pts.length-1;i++){
			const d = UtilitySD.pointToSegmentDistance(p, pts[i], pts[i+1]);
			if (d < minD)
				minD = d;
		}
		return minD;
    }

    arcPolyline(params, steps) {
		let {cx, cy, r, a1, a2, anticlockwise} = params;
		// Determine minor-arc sweep length
		//let ccwSweep = (a2 - a1) / steps;
		//let ccwSweep = ( (a2 - a1) % (2 * Math.PI) + 2 * Math.PI ) % (2 * Math.PI);
		//let sweep = ( (anticlockwise && ccwSweep <= Math.PI) || (!anticlockwise && ccwSweep > Math.PI) ) ? ccwSweep : (2 * Math.PI - ccwSweep);
		let sweep = a2 - a1;
		//const dir = anticlockwise ? -1 : 1;
		const pts = [];
		for (let i = 0; i <= steps; i++){
			const t = i / steps;
			const ang = a1 + t * sweep;
			pts.push({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r });
		}
		return pts;
    }

	resizeCanvas() {
		const dpr = 1;
		//const rect = this.grid.getBoundingClientRect();
		this.canvas.width = Math.max(1, Math.floor(this.gridSize * dpr));
		this.canvas.height = Math.max(1, Math.floor(this.gridSize * dpr));
		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

	drawGrid() {
		this.gridCanvas = this.element.querySelector(".evolution-grid-grid");
		this.gridCtx = this.gridCanvas.getContext('2d', { alpha: true, desynchronized: true });

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

    drawLines() {
		this.canvas = this.element.querySelector(".evolution-grid-lines");
		this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
		this.ctx.clearRect(0, 0, this.gridSize, this.gridSize);
		for (const line of this.type.system.gridLines) {
			this.drawLine(line);
		}
    }

	COLORS = {
		brown: getComputedStyle(document.documentElement).getPropertyValue('--brown') || '#3b2a1a',
		white: getComputedStyle(document.documentElement).getPropertyValue('--white') || '#ffffff'
	};
	BROWN_WIDTH = 7;
	WHITE_WIDTH = 4;
	HIT_TOLERANCE =30;

    drawLine(line) {
		const [p1, p2, s] = this.linePoints(line);

		//if (Math.abs(s) < 0.5) { // straight
			// brown border
			this.ctx.beginPath();
			this.ctx.lineWidth = this.BROWN_WIDTH;
			this.ctx.strokeStyle = this.COLORS.brown;
			this.ctx.lineCap = 'round';
			this.ctx.moveTo(p1.x, p1.y);
			this.ctx.lineTo(p2.x, p2.y);
			this.ctx.stroke();
			// white core
			this.ctx.beginPath();
			this.ctx.lineWidth = this.WHITE_WIDTH;
			this.ctx.strokeStyle = this.COLORS.white;
			this.ctx.moveTo(p1.x, p1.y);
			this.ctx.lineTo(p2.x, p2.y);
			this.ctx.stroke();
			return;
		/*}

		const params = this.circleFromChordSagitta(p1, p2, s);
		if (!params || params.straight){ // fallback straight
			this.ctx.beginPath();
			this.ctx.lineWidth = this.BROWN_WIDTH;
			this.ctx.strokeStyle = this.COLORS.brown;
			this.ctx.lineCap='round';
			this.ctx.moveTo(p1.x,p1.y);
			this.ctx.lineTo(p2.x,p2.y);
			this.ctx.stroke();
			this.ctx.beginPath();
			this.ctx.lineWidth = this.WHITE_WIDTH;
			this.ctx.strokeStyle = this.COLORS.white;
			this.ctx.moveTo(p1.x,p1.y);
			this.ctx.lineTo(p2.x,p2.y);
			this.ctx.stroke();
			return;
		}

		// Brown border
		this.ctx.beginPath();
		this.ctx.lineWidth = this.BROWN_WIDTH;
		this.ctx.strokeStyle = this.COLORS.brown;
		this.ctx.lineCap = 'round';
		this.ctx.arc(params.cx, params.cy, params.r, params.a1, params.a2, params.anticlockwise);
		this.ctx.stroke();
		// White core
		this.ctx.beginPath();
		this.ctx.lineWidth = this.WHITE_WIDTH;
		this.ctx.strokeStyle = this.COLORS.white;
		this.ctx.arc(params.cx, params.cy, params.r, params.a1, params.a2, params.anticlockwise);
		this.ctx.stroke();

		// cache for picking
		line._renderCache = params;
		line._renderCache.p1 = p1;
		line._renderCache.p2 = p2;*/
    }

	linePoints(line) {
		let node1 = this.type.system.gridTalents.find(t => t.uuid == line.node1);
		let node2 = this.type.system.gridTalents.find(t => t.uuid == line.node2);

		const p1 = {x: node1.coordinates.x + this.iconSize / 2, y: node1.coordinates.y + this.iconSize / 2};
		const p2 = {x: node2.coordinates.x + this.iconSize / 2, y: node2.coordinates.y + this.iconSize / 2};

		return [p1, p2, line.s];
	}

    addLine(node1, node2) {
		const p1 = {x : node1.coordinates.x + (this.iconSize / 2), y : node1.coordinates.y + (this.iconSize / 2)};
		const p2 = {x : node2.coordinates.x + (this.iconSize / 2), y : node2.coordinates.y + (this.iconSize / 2)};

		const line = {
			uuid: UtilitySD.generateUUID(),
			node1: node1.uuid,
			node2: node2.uuid,
			s: 0
		};
		node1.lines.push(line.uuid);
		node2.lines.push(line.uuid);
		this.type.system.gridLines.push(line);
		this.type.update({"system.gridLines": this.type.system.gridLines, "system.gridTalents": this.type.system.gridTalents});
		this.scheduleDraw();
		return line;
    }

    removeLine(line) {
		let node1 = this.type.system.gridTalents.find(t => t.uuid == line.node1);
		let node2 = this.type.system.gridTalents.find(t => t.uuid == line.node2);

		node1.lines = node1.lines.filter(l => l !== line.uuid);
		node2.lines = node2.lines.filter(l => l !== line.uuid);

		this.type.system.gridLines = this.type.system.gridLines.filter(l => l.uuid !== line.uuid);
		this.type.update({"system.gridLines": this.type.system.gridLines, "system.gridTalents": this.type.system.gridTalents});
		this.scheduleDraw();
    }

    findLine(p) {
		// Prefer lines drawn later (on top)
		for (let i = this.type.system.gridLines.length - 1; i >= 0; i--){
			const line = this.type.system.gridLines[i];
			const [p1, p2, s] = this.linePoints(line);
			let d;
			//if (Math.abs(line.s) < 0.5){
				d = UtilitySD.pointToSegmentDistance(p, p1, p2);
			//} else {
			//	const params = line._renderCache || this.circleFromChordSagitta(p1, p2, s);
			//	d = this.pointToArcDistance(p, params);
			//}
			//shadowdark.log(`d = ${d}`);
			if (d <= Math.max(this.WHITE_WIDTH, this.BROWN_WIDTH)/2 + this.HIT_TOLERANCE)
				return line;
		}
		return null;
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
	scheduleDraw() {
		if (this._rafPending) return;
		this._rafPending = true;
		requestAnimationFrame(() => {
			this._rafPending = false;
			this.drawLines();
		});
	}

	_rafGridPending = false;
	scheduleGrid() {
		if (this._rafGridPending) return;
		this._rafGridPending = true;
		requestAnimationFrame(() => {
			this._rafGridPending = false;
			this.drawGrid();
		});
	}
}
