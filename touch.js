const debug = true;

const FG_COLOR = "#000";
const BG_COLOR = "#666";
const COLOR_STATE_SYMBOLS = {
	[FG_COLOR]:'images/yin-yang.svg',
	[BG_COLOR]:'images/yang-yin.svg'
}

const touchEventHandlers = [
	["touchstart", handleStart],
	["touchend", handleEnd],
	["touchcancel", handleCancel],
	["touchmove", handleMove]
];

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
	document.querySelector("#penSizeSlider").addEventListener('input', (event) => {
		event.preventDefault();
		updatePenSize(event.target.value);
	});
	
	document.querySelector("#invert").addEventListener('click', () => {
		penColor = (penColor === BG_COLOR) ? FG_COLOR : BG_COLOR;
		document.querySelector('#invert').src = COLOR_STATE_SYMBOLS[penColor];
	})
	
	penModeSelections.forEach(([elementId, penFunction, defaultPenSize]) => {
		document.querySelector(elementId).addEventListener('change', (event) => {
			event.preventDefault();
			penMode = penFunction;
			updatePenSize(defaultPenSize);
		});
	})

	document.querySelector('#clear').addEventListener('click', (event) => {
		event.preventDefault();
		updateCanvasSize();
	});
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

function handleStart(event) {
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const touch = touches[i];

		if (penMode !== fan) { penMode(touch); }

		addTouchEntry(touch);
	}
}

function handleMove(event) {	
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		penMode(touches[i]);
	}
}

function handleEnd(event) {
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const touch = touches[i];
		
		penMode(touch);
		removeTouchEntry(touch);
	}
}

function handleCancel(event) {
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
	const prev = getPreviousTouchState(touch);
	addTouchEntry(touch);
	
	ctx.beginPath();
	ctx.moveTo(prev.pageX, prev.pageY);
	ctx.lineTo(touch.pageX, touch.pageY);

	ctx.lineWidth = (touch.force === 0) ? penSize : penSize * (1+touch.force);
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
	addTouchEntry(touch);
	ctx.beginPath();
	ctx.strokeStyle = penColor;
	ctx.fillStyle = penColor;

	ctx.arc(touch.pageX, touch.pageY, penSize, 0, 2 * Math.PI);
	ctx.fill();
}

function circle(touch) {
	addTouchEntry(touch);
	ctx.beginPath();
	ctx.strokeStyle = penColor;
	ctx.fillStyle = penColor;

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
	touchHistory[touch.identifier] = { pageX:touch.pageX, pageY:touch.pageY }
}

function activateDebugHandlers(){
	window.onbeforeunload = function() {
		return 'Page reloading';
	}
}