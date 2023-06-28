const debug = false;

const FG_COLOR = "#000";
const BG_COLOR = "#666";
const COLOR_STATE_SYMBOLS = {
	[FG_COLOR]:'images/yin-yang.svg',
	[BG_COLOR]:'images/yang-yin.svg'
}

const touchEventHandlers = [
	["touchstart", handleTouchStart],
	["touchend", handleTouchEnd],
	["touchcancel", handleTouchCancel],
	["touchmove", handleTouchMove]
];

// const mouseEventHandlers = [
// 	["mousedown", handleMouseStart],
// 	["mouseup", handleMouseEnd],
// 	["wheel", handleMouseWheel]
// ];

// const keyEventHandlers = [
// 	['t', setFlat],
// 	['f', setFan],
// 	['d', setDot],
// 	['c', setCircle],
// 	['shift', invertColors]
// ];

const penModeSelections = [
	['#flatSelect', flat, 80],
	['#dotSelect', dot, 4],
	['#fanSelect', fan, 1],
	['#circleSelect', circle, 80]
]

const touchHistory = {};
let penColor = FG_COLOR;
let penSize = 4;
let penMode = dot;

const vvp = window.visualViewport;
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

document.addEventListener("DOMContentLoaded", () => {
	activateTouchHandlers();
	activateUIHandlers();
	activateViewportHandler();
});

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

function activateTouchHandlers() {
	touchEventHandlers.forEach(([touchEvent, handler]) => {
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

		if (penMode === dot) { penMode(touch); }

		addTouchEntry(touch);
	}
}

function handleTouchMove(event) {	
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const touch = touches[i];
		penMode(touch);

		if (penMode !== fan) { addTouchEntry(touch); }
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

function flat(touch) {
	ctx.beginPath();

	const prev = getPreviousTouchState(touch);

	ctx.moveTo(prev.pageX, prev.pageY);
	ctx.lineTo(touch.pageX, touch.pageY);

	ctx.lineWidth = penSize;
	ctx.strokeStyle = penColor;

	ctx.stroke();
}

function fan(touch) {
	ctx.beginPath();

	const prev = getPreviousTouchState(touch);

	ctx.moveTo(prev.pageX, prev.pageY);
	ctx.lineTo(touch.pageX, touch.pageY);

	ctx.lineWidth = penSize;
	ctx.strokeStyle = penColor;

	ctx.stroke();
}

function dot(touch) {
	ctx.beginPath();

	ctx.strokeStyle = penColor;
	ctx.fillStyle = penColor;

	ctx.arc(touch.pageX, touch.pageY, penSize, 0, 2 * Math.PI);
	ctx.fill();
}

function circle(touch) {
	ctx.beginPath();

	ctx.strokeStyle = penColor;
	ctx.lineWidth = 1;

	ctx.arc(touch.pageX, touch.pageY, penSize, 0, 2 * Math.PI);
	ctx.stroke();
}

function isActiveTouch(touch){
	return Object.hasOwn(touchHistory, touch.identifier);
}

function getPreviousTouchState(touch){
	if (isActiveTouch(touch)) { return touchHistory[touch.identifier]; }
	else { console.warn("getPreviousTouchState didn't find a touch"); }
}

function removeTouchEntry(touch){
	delete touchHistory[touch.identifier];
}

function addTouchEntry(touch){
	touchHistory[touch.identifier] = extractPageXY(touch);
}

function extractPageXY(something) {
	return {pageX:something.pageX, pageY:something.pageY};
}

function activateDebugHandlers(){
	window.onbeforeunload = function() {
		return 'Page reloading';
	}
}

function isMouseEvent(event) {
	return event instanceof MouseEvent;
}
