const ongoingTouches = [];

let penColor = "#000";
let penWidth = 4;

const vvp = window.visualViewport;

document.addEventListener("DOMContentLoaded", () => {
	activateTouchHandlers();
	activateUIHandlers();
	activateViewportHandler();
});

function activateUIHandlers() {  
  document.querySelector("#penSizeSlider").addEventListener('input', (event) => {
    updatePenSize(event.target.value);
  })
}

function updatePenSize(value) {
  penWidth = Math.max(value, 1);
}

function updateCanvasSize() {
  const canvas = getCanvas();
  
  canvas.setAttribute('width', vvp.width);
  canvas.setAttribute('height', vvp.height);
}

function activateViewportHandler() {
  updateCanvasSize();
  vvp.addEventListener("resize", updateCanvasSize);
}

function activateTouchHandlers() {
	const touchEventHandlers = [
		["touchstart", handleStart],
		["touchend", handleEnd],
    ["touchcancel", handleCancel],
    ["touchmove", handleMove]
	];
	
	touchEventHandlers.forEach((eventHandler) => {
		getCanvas().addEventListener(eventHandler[0], eventHandler[1]);
	});
}

function handleStart(event) {
	event.preventDefault();

	const touches = event.changedTouches;
	const ctx = getCanvasContext();

	for (let i = 0; i < touches.length; i++) {
		let touch = touches[i];
		
		ongoingTouches.push(copyTouch(touch));
	};
}

function handleMove(event) {
	event.preventDefault();
	
	const touches = event.changedTouches;
	const ctx = getCanvasContext();

	for (let i = 0; i < touches.length; i++) {
		const touchIndex = ongoingTouchIndexById(touches[i].identifier);

		if (touchIndex != -1) {
		  const touch = touches[i];
		  
			ctx.beginPath();
			ctx.moveTo(ongoingTouches[touchIndex].pageX, ongoingTouches[touchIndex].pageY);
			ctx.lineTo(touch.pageX, touch.pageY);
			ctx.lineWidth = penWidth;
			ctx.strokeStyle = penColor;
			ctx.stroke();

		  // not splicing draws from origin to all moves,
		  // potential feature!
			ongoingTouches.splice(touchIndex, 1, copyTouch(touch));
		}
	}
}

function handleEnd(event) {
	event.preventDefault();
	
	const ctx = getCanvasContext();
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
	  let touch = touches[i];

		let touchIndex = ongoingTouchIndexById(touch.identifier);

		if (touchIndex != -1) {
			ctx.lineWidth = penWidth;
			ctx.fillStyle = penColor;
			ctx.beginPath();
			ctx.moveTo(ongoingTouches[touchIndex].pageX, ongoingTouches[touchIndex].pageY);
			ctx.lineTo(touch.pageX, touch.pageY);
			ongoingTouches.splice(touchIndex, 1);
		}
	}
}

function handleCancel(event) {
	event.preventDefault();
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		let touchIndex = ongoingTouchIndexById(touches[i].identifier);
		ongoingTouches.splice(touchIndex, 1); // remove it; we're done
	}
}

function ongoingTouchIndexById(idToFind) {
	for (let i = 0; i < ongoingTouches.length; i++) {
		if (ongoingTouches[i].identifier === idToFind) {
			return i;
		}
	}
	
	return -1; // not found
}

function copyTouch({ identifier, pageX, pageY }) {
  return { identifier, pageX, pageY };
}

function getCanvas(){
	return document.querySelector('#canvas');
}

function getCanvasContext(){
	return getCanvas().getContext('2d');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}