const debug = false;
const ongoingTouches = [];

document.addEventListener("DOMContentLoaded", () => {
  startup();    
});

function startup() {
  const canvasElement = getCanvas();
  canvasElement.addEventListener("touchstart", handleStart);
  canvasElement.addEventListener("touchend", handleEnd);
  canvasElement.addEventListener("touchcancel", handleCancel);
  canvasElement.addEventListener("touchmove", handleMove);
  log("Initialized.");
}

function handleStart(evt) {
  evt.preventDefault();
  log("touchstart.");
  
  const canvasContext = getCanvas().getContext("2d");
  const touches = evt.changedTouches;

  for (let i = 0; i < touches.length; i++) {
    let touch = touches[i];
    log(`touchstart: ${touch}.`);
    ongoingTouches.push(copyTouch(touch));
    const color = "#000";
    log(`color of touch with id ${touch.identifier} = ${color}`);
    canvasContext.beginPath();
    // canvasContext.arc(touch.pageX, touch.pageY, 4, 0, 2 * Math.PI, false); // a circle at the start
    canvasContext.fillStyle = color;
    canvasContext.fill();
  };
}

function handleMove(evt) {
  evt.preventDefault();
  const el = document.getElementById("canvas");
  const ctx = el.getContext("2d");
  const touches = evt.changedTouches;

  for (let i = 0; i < touches.length; i++) {
    const color = colorForTouch(touches[i]);
    const idx = ongoingTouchIndexById(touches[i].identifier);

    if (idx >= 0) {
      log(`continuing touch ${idx}`);
      ctx.beginPath();
      log(
        `ctx.moveTo( ${ongoingTouches[idx].pageX}, ${ongoingTouches[idx].pageY} );`
      );
      ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
      log(`ctx.lineTo( ${touches[i].pageX}, ${touches[i].pageY} );`);
      ctx.lineTo(touches[i].pageX, touches[i].pageY);
      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      ctx.stroke();

      ongoingTouches.splice(idx, 1, copyTouch(touches[i])); // swap in the new touch record
    } else {
      log("can't figure out which touch to continue");
    }
  }
}

function handleEnd(evt) {
  evt.preventDefault();
  log("touchend");
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
      ctx.fillRect(touches[i].pageX - 4, touches[i].pageY - 4, 8, 8); // and a square at the end
      ongoingTouches.splice(idx, 1); // remove it; we're done
    } else {
      log("can't figure out which touch to end");
    }
  }
}

function handleCancel(evt) {
  evt.preventDefault();
  log("touchcancel.");
  const touches = evt.changedTouches;

  for (let i = 0; i < touches.length; i++) {
    let idx = ongoingTouchIndexById(touches[i].identifier);
    ongoingTouches.splice(idx, 1); // remove it; we're done
  }
}

function copyTouch({ identifier, pageX, pageY }) {
  return { identifier, pageX, pageY };
}

function ongoingTouchIndexById(idToFind) {
  for (let i = 0; i < ongoingTouches.length; i++) {
    const id = ongoingTouches[i].identifier;

    if (id === idToFind) {
      return i;
    }
  }
  return -1; // not found
}

function colorForTouch(touch) {
  return "#000";
}


function log(text) {
  if (debug) { console.log(text); }
}

function getCanvas(){
  return document.querySelector('#canvas');
}

function getCanvasContext(){
  return getCanvas().getContext('2d');
}