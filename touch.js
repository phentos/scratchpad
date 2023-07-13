/*
		Scratchpad
		A mildly esoteric drawing webapp meant to enable exploration of artistic expression in geometric ways.
		Copyright (C) 2023 Korey Ray

		This program is free software: you can redistribute it and/or modify
		it under the terms of the GNU General Public License as published by
		the Free Software Foundation, either version 3 of the License, or
		(at your option) any later version.

		This program is distributed in the hope that it will be useful,
		but WITHOUT ANY WARRANTY; without even the implied warranty of
		MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
		GNU General Public License for more details.

		You should have received a copy of the GNU General Public License
		along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const debug = true;

const BG_COLOR = "#666";
const FG_COLOR = "#000";

let inversionActive = false;

const INVERSION_STATE_SYMBOLS = {
	false:'images/yin-yang.svg',
	true:'images/yang-yin.svg'
};

const INVERSION_STATE_COMPOSITORS = {
	false: 'source-over',
	true: 'destination-out'
}

function toggleInversion(reset=false) {
	const invertElement = document.querySelector('#invert');

	inversionActive = (reset) ? false : !inversionActive;

	ctx.globalCompositeOperation = INVERSION_STATE_COMPOSITORS[inversionActive];
	invertElement.src = INVERSION_STATE_SYMBOLS[inversionActive];
}

const penModeSelections = [
	['#flatSelect', setFlat],
	['#dotSelect', setDot],
	['#fanSelect', setFan],
	['#circleSelect', setCircle]
];

const strokeEventHandlers = [
	["mousedown", handleMouseStart],
	["mousemove", handleMouseMove],
	["mouseup", handleMouseEnd],
	["wheel", handleMouseWheel],

	["touchstart", handleTouchStart],
	["touchend", handleTouchEnd],
	["touchcancel", handleTouchCancel],
	["touchmove", handleTouchMove]
];

const keyEventHandlers = {
	't': setFlat,
	'f': setFan,
	'd': setDot,
	'c': setCircle,
	'Shift': toggleInversion,
	'r': clearCanvas,
	'x': displayOutputBounds
};

const strokeHistory = {};
const penColor = FG_COLOR;
let penSize = 4;
let penMode = dot;
let mouseActive = false;

const vvp = window.visualViewport;
const windowBounds = {width:vvp.width, height:vvp.height};

let canvas;
let ctx;
let mutator;
let mutatorCtx;

document.addEventListener("DOMContentLoaded", () => {	
	activateCanvasHandlers();
	activateStrokeHandlers();
	activateUIHandlers();
	activateViewportHandler();	
});

function activateCanvasHandlers() {
	canvas = document.querySelector('#canvas');
	ctx = canvas.getContext('2d');

	mutator = document.querySelector('#mutator');
	mutatorCtx = mutator.getContext('2d');
}

// left, top, right, bottom
const outputBounds = {
	minX: Infinity,
	minY: Infinity,
	maxX: -Infinity,
	maxY: -Infinity
};

function positionToPortion(e) {
	const elementBounds = e.target.getBoundingClientRect();
	const xShare = (e.clientX - elementBounds.left) / elementBounds.left;
	const yShare = (e.clientY - elementBounds.top) / elementBounds.top;

	return {x: xShare, y: yShare};
}

function updateMutator(e) {
	const mutateShares = positionToPortion(e);

	mutatePenProperties(mutateShares);
	paintMutator();
}

function paintMutator() {
	if (debug) { console.log("painted mutator"); }
}

function updateOutputBounds(event) {
	const dx = event.pageX;
	const dy = event.pageY;
	const r = (penMode === flat) ? .5 * penSize + 5 : penSize + 5;

	outputBounds.minX = Math.min(outputBounds.minX, dx - r);
	outputBounds.minY = Math.min(outputBounds.minY, dy - r);
	outputBounds.maxX = Math.max(outputBounds.maxX, dx + r);
	outputBounds.maxY = Math.max(outputBounds.maxY, dy + r);
}

function resetOutputBounds() {
	outputBounds.minX = Infinity;
	outputBounds.minY = Infinity;
	outputBounds.maxX = -Infinity;
	outputBounds.maxY = -Infinity;
}

function displayOutputBounds() {
	if (debug) {
		const x = outputBounds.minX;
		const y = outputBounds.minY;
		const width = outputBounds.maxX - x;
		const height = outputBounds.maxY - y;

		console.log(`display bounds: x=${x.toFixed(0)} y=${y.toFixed(0)} w=${width.toFixed(0)} h=${height.toFixed(0)}`);

		const ctxBackupColor = penColor;
		const ctxBackupLine = penSize;

		ctx.strokeStyle = "darkred";
		ctx.lineWidth = 1;

		// ctx.strokeRect(x,y,width,height);
		ctx.strokeRect(outputBounds.minX,outputBounds.minY, width, height);

		ctx.strokeStyle = ctxBackupColor;
		ctx.lineWidth = ctxBackupLine;
	}
}

function downloadCanvasImageCropped() {
	const x = outputBounds.minX;
	const y = outputBounds.minY;
	const width = outputBounds.maxX - x;
	const height = outputBounds.maxY - y;

	const outputCanvas = document.createElement('canvas');
	outputCanvas.width = width;
	outputCanvas.height = height;

	const outputCtx = outputCanvas.getContext('2d');

	if (!inversionActive) {
		outputCtx.fillStyle = BG_COLOR;
		outputCtx.fillRect(0, 0, width, height);	
	}
	
	outputCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

	return outputCanvas.toDataURL();
}

function getPreviousStroke(stroke) {
	try {
		if (stroke instanceof MouseEvent) { return strokeHistory['mouse']; }
		else { return strokeHistory[stroke.identifier]; }
	} catch { console.warn("getPreviousStroke didn't find anything"); }
}

function removeTouchEntry(event) {
	strokeHistory[event.identifier] = null;
}

function createTouchEntry(touch) {
	strokeHistory[touch.identifier] = extractPageXY(touch);
}

function createMouseEntry(mouseEvent) {
	strokeHistory['mouse'] = extractPageXY(mouseEvent);
}

function removeMouseEntry() {
	strokeHistory['mouse'] = null;
}

function extractPageXY(something) {
	return { pageX:something.pageX, pageY:something.pageY };
}

function activateDebugHandlers() {
	window.onbeforeunload = function() {
		return 'Page reloading';
	}
}

// TODO
function handleMouseWheel(event) {}

function activateKeyboard() {
	window.addEventListener('keydown', (event) => {
		const keyHandler = keyEventHandlers[event.key];
		if (keyHandler) { keyHandler(); }
	});
}

// refactor me
function activateUIHandlers() {
	activatePenModes();
	activateKeyboard();
	activateMutator();

	document.querySelector("#penSizeSlider").addEventListener('input', (event) => {
		event.preventDefault();
		updatePenSize(Number(event.target.value));
	});

	document.querySelector("#invert").addEventListener('click', () => {
		toggleInversion();
	})

	document.querySelector('#clear').addEventListener('click', (event) => {
		event.preventDefault();
		clearCanvas();
	});

	document.querySelector('#download').addEventListener('click', (event) => {
		event.target.href = downloadCanvasImageCropped();
	})

	window.addEventListener('contextmenu', (event) => { event.preventDefault(); });
}

function clearCanvas() {
	updateCanvasSize();
	toggleInversion(true);
	resetOutputBounds();
}

function updatePenSize(val) {
	penSize = (val > 0) ? val : 1;
	document.querySelector('#penSizeSlider').value = penSize;
}

function updatePenMode(newModeName) {
	document.querySelector(`#${newModeName}Select`).checked = true;
}

// currently this clears the canvas during resize
// need to save current/override clear
function updateCanvasSize() {
	canvas.setAttribute('width', vvp.width);
	canvas.setAttribute('height', vvp.height);
	windowBounds.width = vvp.width;
	windowBounds.height = vvp.height;
}

function activateViewportHandler() {
	updateCanvasSize();
	vvp.addEventListener("resize", () => {
		if (vvp.height !== windowBounds.height & vvp.width !== windowBounds.width) { 
			updateCanvasSize(); 
		}
	});
}

function activateStrokeHandlers() {
	strokeEventHandlers.forEach(([touchEvent, handler]) => {
		canvas.addEventListener(touchEvent, (event) => {
			event.preventDefault();
			handler(event);
		});
	});
}

function startStroke(event) {
	if (penMode === dot | penMode === circle) { 
		penMode(event); 
		updateOutputBounds(event);
	}
}

function continueStroke(event) {
	penMode(event);
	updateOutputBounds(event);
}

function endStroke(event) {
	penMode(event);
	updateOutputBounds(event);
}

function handleTouchStart(event) {
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const touch = touches[i];		

		startStroke(touch);
		createTouchEntry(touch);
	}
}

function handleTouchMove(event) {	
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const touch = touches[i];

		continueStroke(touch);
		if (penMode !== fan) { createTouchEntry(touch); } 
	}
}

function handleTouchEnd(event) {
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const touch = touches[i];

		endStroke(touch);
		removeTouchEntry(touch);
	}
}

function handleTouchCancel(event) {
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const touch = touches[i];

		removeTouchEntry(touch);
	}
}

function handleMouseStart(event) {
	if (debug) { console.log(`${event.pageX}, ${event.pageY}, ${penSize}`); }
	startStroke(event);

	createMouseEntry(event);
	mouseActive = true;
}

function handleMouseMove(event) {
	if (mouseActive) {
		continueStroke(event);

		if (penMode !== fan) { createMouseEntry(event); }
	}
}

function handleMouseEnd(event) {
	endStroke(event);

	removeMouseEntry();
	mouseActive = false;
}

function activatePenModes() {
	penModeSelections.forEach(([elementId, modeHandler]) => {
		document.querySelector(elementId).addEventListener('change', (event) => {
			event.preventDefault();
			modeHandler();
		});
	});
}

function activateMutator() {
	mutator.addEventListener('mousedown', (e) => {
		updateMutator(e);
		mouseActive = true;
	});

	mutator.addEventListener('mousemove', (e) => {
		if (mouseActive) { updateMutator(e); }
	});

	mutator.addEventListener('mouseup', (e) => {
		mouseActive = false;
	});
}

/* refactor me */
/* BEGIN PEN MODE ACTIVATORS */
function setFlat() {
	penMode = flat;
	updatePenSize(80);
	updatePenMode('flat');
}

function setCircle() {
	penMode = circle;
	updatePenSize(80);
	updatePenMode('circle');
}

function setDot() {
	penMode = dot;
	updatePenSize(4);
	updatePenMode('dot');
}

function setFan() {
	penMode = fan;
	updatePenSize(1);
	updatePenMode('fan');
}
/* END PEN MODE ACTIVATORS */

/*
flat: penSize(width), dashes
dot: penSize(radius), random offset magnitude
circle: penSize(radius), dashes
fan: start/end point random offset magnitude, dashes
*/

let randomOffsetMagnitude = 0;
let dashPattern;

function mutatePenProperties(xyValues) {
	if (debug) { console.log(`mutate pen with: ${Object.entries(xyValues)}`); }
}

function offsetRandom(magnitude) {
	let offsetProduct = Math.random();
	
	if (Math.random() > 0.5) { offsetProduct = offsetProduct - 1; }
	
	return offsetProduct * magnitude;
}



function flat(event) {
	ctx.beginPath();

	const prev = getPreviousStroke(event);

	ctx.moveTo(prev.pageX, prev.pageY);

	ctx.lineTo(event.pageX, event.pageY);

	ctx.lineWidth = penSize;
	ctx.strokeStyle = penColor;

	ctx.stroke();
}

function fan(event) {
	ctx.beginPath();

	const prev = getPreviousStroke(event);

	ctx.moveTo(prev.pageX, prev.pageY);
	ctx.lineTo(event.pageX, event.pageY);

	ctx.lineWidth = penSize;
	ctx.strokeStyle = penColor;

	ctx.stroke();
}

function dot(event) {
	ctx.beginPath();

	ctx.strokeStyle = penColor;
	ctx.fillStyle = penColor;

	ctx.arc(event.pageX, event.pageY, penSize, 0, 2 * Math.PI);
	ctx.fill();
}

function circle(event) {
	ctx.beginPath();

	ctx.strokeStyle = penColor;
	ctx.lineWidth = 1;

	ctx.arc(event.pageX, event.pageY, penSize, 0, 2 * Math.PI);
	ctx.stroke();
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
