const ongoingTouches = [];

let penColor = "black";
let penSize = 4;
let penMode = round;
let brushOrigin;

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
    updatePenSize(event.target.value);
  });
  
  document.querySelector("#flatSelect").addEventListener('input', () => {
  	penMode = flat;
  	penSize = 20;
  });
  
  document.querySelector("#roundSelect").addEventListener('input', () => {
  	penMode = round;
  });
  
  document.querySelector("#fanSelect").addEventListener('input', () => {
  	penMode = fan;
  	penSize = 40;
  });
  
  document.querySelector('#clear').addEventListener('input', () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
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
	const touchEventHandlers = [
		["touchstart", handleStart],
		["touchend", handleEnd],
    ["touchcancel", handleCancel],
    ["touchmove", handleMove]
	];
	
	touchEventHandlers.forEach((eventHandler) => {
		canvas.addEventListener(eventHandler[0], (event) => {
			event.preventDefault();
			eventHandler[1](event);
		});
	});
}

function handleStart(event) {
	const touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const touch = touches[i];
		
		if (penMode === round) { penMode(touch); }
		
		ongoingTouches.push(copyTouch(touch));
	}
}

function handleMove(event) {	
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function updatePenSize(val) {
	penSize = (val > 0) ? val : 1;
}

function flat(touch, touchIndex) {	
	ctx.beginPath();
	ctx.moveTo(ongoingTouches[touchIndex].pageX, ongoingTouches[touchIndex].pageY);
	ctx.lineTo(touch.pageX, touch.pageY);
	
	ctx.lineWidth = (touch.force === 0) ? penSize : penSize * (1+touch.force);
	ctx.strokeStyle = penColor;
	ctx.stroke();
	
	// not splicing draws from origin to all moves,
	// potential feature!
	ongoingTouches.splice(touchIndex, 1, copyTouch(touch));
}

// fan currently behaves identically to flat
function fan(touch, touchIndex) {
	ctx.beginPath();
	ctx.moveTo(brushOrigin[0], brushOrigin[1]);
	ctx.lineTo(touch.pageX, touch.pageY);
	ctx.lineWidth = penSize;
	ctx.strokeStyle = penColor;
	ctx.stroke();
	
	ongoingTouches.splice(touchIndex, 1, copyTouch(touch));
}

function round(touch) {
	ctx.beginPath();
	ctx.strokeStyle = penColor;
	
	ctx.arc(touch.pageX, touch.pageY, penSize, 0, 2 * Math.PI);
	
	ctx.fill();
	ctx.stroke();
}