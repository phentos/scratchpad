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

const FG_COLOR = "#000";
const BG_COLOR = "#666";
const COLOR_STATE_SYMBOLS = {
	[FG_COLOR]:'images/yin-yang.svg',
	[BG_COLOR]:'images/yang-yin.svg'
};

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
	'Shift': invertColors,
	'r': clearCanvas,
	'p': displayDownloadLinks,
	'x': displayOutputBounds
};

const strokeHistory = {};
let penColor = FG_COLOR;
let penSize = 4;
let penMode = dot;
let mouseActive = false;

const vvp = window.visualViewport;
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

document.addEventListener("DOMContentLoaded", () => {	
	activateStrokeHandlers();
	activateUIHandlers();
	activateViewportHandler();
});

// left, top, right, bottom
const outputBounds = {
	minX: Infinity,
	minY: Infinity,
	maxX: -Infinity,
	maxY: -Infinity
};

function updateOutputBounds(dx, dy, r) {
	console.log(`new bound options: dx ${dx} dy ${dy} r ${r}`);
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
		const x = (outputBounds.minX < 0) ? 0 : outputBounds.minX;
		const y = (outputBounds.minY < 0) ? 0 : outputBounds.minY;
		const width = (outputBounds.maxX > canvas.width) ? canvas.width : outputBounds.maxX - x;
		const height = (outputBounds.maxY > canvas.height) ? canvas.height : outputBounds.maxY - y;
		
		console.log(`display bounds: x=${x.toFixed(0)} y=${y.toFixed(0)} w=${width.toFixed(0)} h=${height.toFixed(0)}`);
		
		const ctxBackupColor = penColor;
		const ctxBackupLine = penSize;
		
		ctx.strokeStyle = "darkred";
		ctx.lineWidth = 1;
		
		ctx.strokeRect(x,y,width,height);
		
		ctx.strokeStyle = ctxBackupColor;
		ctx.lineWidth = ctxBackupLine;
	}
}

// TODO
function displayDownloadLinks() {
	const transparent = canvas.toDataURL();
}

function getPreviousStroke(stroke){
	try {
		if (stroke instanceof MouseEvent) { return strokeHistory['mouse']; }
		else { return strokeHistory[stroke.identifier]; }
	} catch { console.warn("getPreviousStroke didn't find anything"); }
}

function removeTouchEntry(event){
	strokeHistory[event.identifier] = null;
}

function createTouchEntry(touch){
	strokeHistory[touch.identifier] = extractPageXY(touch);
}

function createMouseEntry(mouseEvent){
	strokeHistory['mouse'] = extractPageXY(mouseEvent);
}

function removeMouseEntry(){
	strokeHistory['mouse'] = null;
}

function extractPageXY(something) {
	return { pageX:something.pageX, pageY:something.pageY };
}

function activateDebugHandlers(){
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

	document.querySelector("#penSizeSlider").addEventListener('input', (event) => {
		event.preventDefault();
		updatePenSize(Number(event.target.value));
	});

	document.querySelector("#invert").addEventListener('click', () => {
		invertColors();
	})

	document.querySelector('#clear').addEventListener('click', (event) => {
		event.preventDefault();
		clearCanvas();
		resetOutputBounds();
	});
}

function clearCanvas(){
	updateCanvasSize();
	invertColors(false);
}

function invertColors(invert=true) {
	const invertElement = document.querySelector('#invert');

	penColor = (!invert) ? FG_COLOR : (penColor === BG_COLOR) ? FG_COLOR : BG_COLOR;	
	invertElement.src = COLOR_STATE_SYMBOLS[penColor];
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
}

function activateViewportHandler() {
	updateCanvasSize();
	vvp.addEventListener("resize", updateCanvasSize);
}

function activateStrokeHandlers() {
	strokeEventHandlers.forEach(([touchEvent, handler]) => {
		canvas.addEventListener(touchEvent, (event) => {
			event.preventDefault();
			handler(event);
		});
	});
}

function handleTouchStart(event) {
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const touch = touches[i];

		if (penMode === dot | penMode === circle) { penMode(touch); }

		createTouchEntry(touch);
	}
}

function handleTouchMove(event) {	
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const touch = touches[i];
		penMode(touch);

		if (penMode !== fan) { createTouchEntry(touch); }
	}
}

function handleTouchEnd(event) {
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const touch = touches[i];

		penMode(touch);
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
	console.log(`${event.pageX}, ${event.pageY}, ${penSize}`);
	if (penMode === dot | penMode === circle) { penMode(event); }
	createMouseEntry(event);
	mouseActive = true;
}

function handleMouseMove(event) {
	if (mouseActive) {
		penMode(event);
		if (penMode !== fan) { createMouseEntry(event); }
	}
}

function handleMouseEnd(event) {
	penMode(event);
	removeMouseEntry();
	mouseActive = false;
}

function activatePenModes(){
	penModeSelections.forEach(([elementId, modeHandler]) => {
		document.querySelector(elementId).addEventListener('change', (event) => {
			event.preventDefault();
			modeHandler();
		});
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

function flat(event) {
	ctx.beginPath();

	const prev = getPreviousStroke(event);

	ctx.moveTo(prev.pageX, prev.pageY);
	
	ctx.lineTo(event.pageX, event.pageY);

	ctx.lineWidth = penSize;
	ctx.strokeStyle = penColor;

	ctx.stroke();
	updateOutputBounds(event.pageX, event.pageY, .5*penSize + 5);
}

function fan(event) {
	ctx.beginPath();

	const prev = getPreviousStroke(event);

	ctx.moveTo(prev.pageX, prev.pageY);
	ctx.lineTo(event.pageX, event.pageY);

	ctx.lineWidth = penSize;
	ctx.strokeStyle = penColor;

	ctx.stroke();
	updateOutputBounds(event.pageX, event.pageY, penSize + 5);
}

function dot(event) {
	ctx.beginPath();

	ctx.strokeStyle = penColor;
	ctx.fillStyle = penColor;

	ctx.arc(event.pageX, event.pageY, penSize, 0, 2 * Math.PI);
	ctx.fill();
	updateOutputBounds(event.pageX, event.pageY, penSize + 5);
}

function circle(event) {
	ctx.beginPath();

	ctx.strokeStyle = penColor;
	ctx.lineWidth = 1;

	ctx.arc(event.pageX, event.pageY, penSize, 0, 2 * Math.PI);
	ctx.stroke();
	updateOutputBounds(event.pageX, event.pageY, penSize + 5);
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}