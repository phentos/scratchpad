const ongoingTouches = [];

document.addEventListener("DOMContentLoaded", () => {
	startup();
});

function startup() {
  // createCanvas();
  activateTouchHandlers();
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
		ctx.fillStyle = "#000";
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

function handleEnd(evt) {
	evt.preventDefault();
	
	const el = document.getElementById("canvas");
	const ctx = el.getContext("2d");
	const touches = evt.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		const color = colorForTouch(touches[i]);
		let idx = ongoingTouchIndexById(touches[i].identifier);

		if (idx >= 0) {
			ctx.lineWidth = 4;
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
			ctx.lineTo(touches[i].pageX, touches[i].pageY);
			ongoingTouches.splice(idx, 1); // remove it; we're done
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
