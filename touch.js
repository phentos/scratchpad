const ongoingTouches = [];

let penColor = "black";
let penWidth = 4;
let penMode = flat;

const vvp = window.visualViewport;

document.addEventListener("DOMContentLoaded", () => {
	activateTouchHandlers();
	activateUIHandlers();
	activateViewportHandler();
});

function activateUIHandlers() {  
  document.querySelector("#penSizeSlider").addEventListener('input', (event) => {
    updatePenSize(event.target.value);
  });
  
  document.querySelector("#flatSelect").addEventListener('input', () => {
  	penMode = flat;
  });
  
  document.querySelector("#roundSelect").addEventListener('input', () => {
  	penMode = round;
  });
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

function flat(touch, touchIndex) {
	const ctx = getCanvasContext();
	
	ctx.beginPath();
	ctx.moveTo(ongoingTouches[touchIndex].pageX, ongoingTouches[touchIndex].pageY);
	ctx.lineTo(touch.pageX, touch.pageY);
	ctx.lineWidth = penWidth;
	ctx.strokeStyle = penColor;
	ctx.stroke();
}

function round(touch) {
	const ctx = getCanvasContext();

	ctx.beginPath();
	ctx.strokeStyle = penColor;
	
	ctx.arc(touch.pageX, touch.pageY, penWidth, 0, 2 * Math.pi);
	
	ctx.fill();
	ctx.stroke();
}

function handleStart(event) {
	event.preventDefault();

	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const touch = touches[i];
		
		if (penMode === round) { penMode(touch); }
		
		ongoingTouches.push(copyTouch(touch));
	}
}

function handleMove(event) {
	event.preventDefault();
	
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const touchIndex = ongoingTouchIndexById(touches[i].identifier);

		if (touchIndex !== -1) {
		  const touch = touches[i];
		  
		  penMode(touch, touchIndex);

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
	  const touch = touches[i];

		const touchIndex = ongoingTouchIndexById(touch.identifier);

		if (touchIndex !== -1) {
			penMode(touch, touchIndex);
			
			ongoingTouches.splice(touchIndex, 1);
		}
	}
}

function handleCancel(event) {
	event.preventDefault();
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const touchIndex = ongoingTouchIndexById(touches[i].identifier);
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