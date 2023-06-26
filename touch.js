const debug = false;

const touchEventHandlers = [
	["touchstart", handleStart],
	["touchend", handleEnd],
	["touchcancel", handleCancel],
	["touchmove", handleMove]
];

const touchHistory = {};

let penColor = "black";
let penSize = 4;
let penMode = round;
let brushOrigin;

const vvp = window.visualViewport;
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

document.addEventListener("DOMContentLoaded", () => {
	if (debug) { activateDebugHandlers(); }
	activateTouchHandlers();
	activateUIHandlers();
	activateViewportHandler();
});

function activateUIHandlers() {
	document.querySelector("#penSizeSlider").addEventListener('input', (event) => {
		event.preventDefault();
		updatePenSize(event.target.value);
	});

	document.querySelector("#flatSelect").addEventListener('input', (event) => {
		event.preventDefault();
		penMode = flat;
		updatePenSize(20);
	});

	document.querySelector("#roundSelect").addEventListener('input', (event) => {
		event.preventDefault();
		penMode = round;
		updatePenSize(4);
	});

	document.querySelector("#fanSelect").addEventListener('input', (event) => {
		event.preventDefault();
		penMode = fan;
		updatePenSize(1);
	});

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

		if (penMode === round) { penMode(touch); }

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

function round(touch) {
	ctx.beginPath();
	ctx.strokeStyle = penColor;

	ctx.arc(touch.pageX, touch.pageY, penSize, 0, 2 * Math.PI);

	ctx.fill();
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