const ongoingTouches = [];
const penColor = "#000";
const vvp = window.visualViewport;

document.addEventListener("DOMContentLoaded", () => {
	activateTouchHandlers();
	activateViewportHandler();
});

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
	const eventHandlers = [
		["touchstart", handleStart],
		["touchend", handleEnd],
    ["touchcancel", handleCancel],
    ["touchmove", handleMove]
	];
	
	eventHandlers.forEach((eventHandler) => {
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
		
		ctx.beginPath();
		ctx.fillStyle = "black";
		ctx.fill();
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
			ctx.lineWidth = 4;
			ctx.strokeStyle = "#000";
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
			ctx.lineWidth = 4;
			ctx.fillStyle = "#000";
			ctx.beginPath();
			ctx.moveTo(ongoingTouches[touchIndex].pageX, ongoingTouches[touchIndex].pageY);
			ctx.lineTo(touch.pageX, touch.pageY);
			ongoingTouches.splice(touchIndex, 1);
		}
	}
}

function handleCancel(evt) {
	evt.preventDefault();
	const touches = evt.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		let idx = ongoingTouchIndexById(touches[i].identifier);
		ongoingTouches.splice(idx, 1); // remove it; we're done
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

function colorForTouch(touch) {
	return "#000";
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
