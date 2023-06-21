export class ScratchPad {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.context = canvasElement.getContext('2d');
    this.ongoingTouches = [];
    this.penColor = "#000";
    this.penWidth = 4;
    this.startup();
  }
  
  startup() {    
    const eventHandlers = [
      ["touchstart", this.handleStart],
      ["touchend", this.handleEnd],
      ["touchcancel", this.handleCancel],
      ["touchmove", this.handleMove]
    ];
    
    eventHandlers.forEach((eventHandler) => {
      this.canvas.addEventListener(eventHandler[0], eventHandler[1]);
    });
  }
  
  handleStart(event) {
    event.preventDefault();   
    
    const touches = event.changedTouches;
  
    for (let i = 0; i < touches.length; i++) {
      let touch = touches[i];
      
      this.ongoingTouches.push(touch);
      
      this.context.beginPath();
      this.context.fillStyle = this.penColor;
      this.context.fill();
    };
  }
  
  handleMove(event) {
    event.preventDefault();
    
    const touches = event.changedTouches;
    
    for (let i = 0; i < touches.length; i++) {
      const touchIndex = this.ongoingTouchIndexById(touches[i].identifier);
      if (touchIndex != -1) {
        this.context.fillStyle = this.penColor;
        this.context.lineWidth = this.penWidth;
        this.context.beginPath();
        this.context.moveTo(
          this.ongoingTouches[touchIndex].pageX,
          this.ongoingTouches[touchIndex].pageY
        );
        this.context.lineTo(
          touches[i].pageX,
          touches[i].pageY
        );
        this.ongoingTouches.splice(touchIndex, 1);
      }
    }
  }
  
  handleCancel(event) {
    event.preventDefault();
    const touches = event.changedTouches;
    
    for (let i = 0; i < touches.length; i++) {
      const touchIndex = this.ongoingTouchIndexById(touches[i].identifier);
      this.ongoingTouches.splice(touchIndex, 1);
    }
  }
  
  ongoingTouchIndexById(id){
    for (let i = 0; i < this.ongoingTouches.length; i++) {
      if (ongoingTouches[i].identifier === id) { return i; }
    }
    
    return -1;
  }
}