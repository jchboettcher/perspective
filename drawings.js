const getDrawing = (id, pts) => (
  s => {
    const col = id == 1 ? s.color(255,0,0) : s.color(0,0,255);
    let tempPts = [];

    s.setup = () => {
      s.createCanvas(s.windowHeight/2, s.windowHeight/2);
    }
    
    // s.windowResized = () => {
    //   s.resizeCanvas(s.windowHeight/2, s.windowHeight/2);
    // }

    const getCoords = () => ({
      x: s.constrain(s.mouseX, 1, s.width-2)-s.width/2,
      y: s.constrain(s.mouseY, 1, s.height-2)-s.height/2,
    })

    s.mousePressed = () => {
      if (s.mouseX > 0 && s.mouseX < s.width-1 && s.mouseY > 0 && s.mouseY < s.height-1) {
        startDrawing = id;
        tempPts = [getCoords()];
      }
    }

    s.mouseDragged = () => {
      if (startDrawing == id) {
        tempPts.push(getCoords());
      }
    }

    s.mouseReleased = () => {
      startDrawing = 0;
      if (tempPts.length > 2) {
        pts.length = 0;
        for (let pt of tempPts) {
          pts.push(pt);
        }
      }
    }
    
    s.draw = () => {
      s.background(255);
      s.strokeWeight(2);
      s.noFill();
      s.stroke(0);
      s.rect(0,0,s.width,s.height);
      s.translate(s.width/2,s.height/2);
      s.stroke(col);
      s.beginShape();
      for (const {x,y} of tempPts) {
        s.vertex(x,y);
      }
      s.endShape(s.CLOSE);
      // for (const {x,y} of hull) {
      //   s.point(x,y);
      // }
    }
  }
)

