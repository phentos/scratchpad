const debug = false;

const FG_COLOR = "#000";
const BG_COLOR = "#666";
const COLOR_STATE_SYMBOLS = {
	[FG_COLOR]:'images/yin-yang.svg',
	[BG_COLOR]:'images/yang-yin.svg'
}

const penModeSelections = [
	['#flatSelect', flat, 80],
	['#dotSelect', dot, 4],
	['#fanSelect', fan, 1],
	['#circleSelect', circle, 80]
]

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

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max)
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

function handleMouseStart(event) {
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

function handleMouseWheel(event) {}

function setFlat() {}
function setCircle() {}
function setDot() {}
function setFan() {}

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

const keyEventHandlers = [
	['t', setFlat],
	['f', setFan],
	['d', setDot],
	['c', setCircle],
	['shift', invertColors]
];

function activateUIHandlers() {
	penModeSelections.forEach(([elementId, penFunction, defaultPenSize]) => {
		document.querySelector(elementId).addEventListener('change', (event) => {
			event.preventDefault();
			penMode = penFunction;
			updatePenSize(defaultPenSize);
		});
	});

	document.querySelector("#penSizeSlider").addEventListener('input', (event) => {
		event.preventDefault();
		updatePenSize(event.target.value);
	});

	document.querySelector("#invert").addEventListener('click', () => {
		invertColors();
	})

	document.querySelector('#clear').addEventListener('click', (event) => {
		event.preventDefault();
		updateCanvasSize();
		invertColors(false);
	});
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