let startDrawing = 0;
let p1 = [];
let p2 = [];

const combined = s => {
  let camera;
  let show1 = [];
  let show2 = [];
  let coords = [];
  s.orbitControl = function(sensitivityX, sensitivityY) {
    this._assert3d('orbitControl');
    p5._validateParameters('orbitControl', arguments);
    if (startDrawing != 0) return;

    // If the mouse is not in bounds of the canvas, disable all behaviors:
    const mouseInCanvas =
      this.mouseX < this.width &&
      this.mouseX > 0 &&
      this.mouseY < this.height &&
      this.mouseY > 0;
    if (!mouseInCanvas) return;
  
    if (typeof sensitivityX === 'undefined') {
      sensitivityX = 1;
    }
    if (typeof sensitivityY === 'undefined') {
      sensitivityY = sensitivityX;
    }
  
    const scaleFactor = this.height < this.width ? this.height : this.width;
    const cam = this._renderer._curCamera;
  
    if (this.mouseIsPressed && this.mouseButton === this.LEFT) {
      const deltaTheta =
        -sensitivityX * (this.mouseX - this.pmouseX) / scaleFactor;
      const deltaPhi =
        sensitivityY * (this.mouseY - this.pmouseY) / scaleFactor;
      cam._orbit(deltaTheta, deltaPhi, 0);
    }
    return this;
  };
  
  s.setup = () => {
    s.createCanvas(s.windowWidth-s.windowHeight/2, s.windowHeight, s.WEBGL);
    s.normalMaterial();
    camera = s.createCamera();
    camera.ortho(-s.width/2,s.width/2,-s.height/2,s.height/2,0,s.height);
    camera.setPosition(0,0,s.height);
    camera.lookAt(0,0,s.height/2);
  }

  const numAngles = 100;
  const getBounds = pts => {
    const bounds = [];
    for (let i = 0; i < numAngles; i++) {
      const alpha = s.PI/numAngles*i
      let topmost = s.height;
      let bottommost = -s.height;
      for (let {x,y} of pts) {
        yr = x * Math.sin(alpha) + y * Math.cos(alpha);
        if (yr < topmost) topmost = yr;
        if (yr > bottommost) bottommost = yr;
      }
      bounds.push(Math.max(bottommost-topmost,0.001));
    }
    return bounds;
  }

  let bestAngle = 0;
  const getNewPoints = () => {
    const boundAngles1 = getBounds(p1);
    const boundAngles2 = getBounds(p2);
    let maxScale = 0;
    for (let i = 0; i < numAngles; i++) {
      let scale = boundAngles1[i]/boundAngles2[i];
      if (scale > 1) scale = 1/scale;
      if (scale > maxScale) {
        maxScale = scale;
        bestAngle = s.PI/numAngles*i;
      }
    }
    const rotate = ({x,y}) => ({
      x: x * Math.cos(bestAngle) - y * Math.sin(bestAngle),
      y: x * Math.sin(bestAngle) + y * Math.cos(bestAngle),
    });
    const rotated1 = p1.map(rotate);
    const rotated2 = p2.map(rotate);
    const boundedRect = pts => {
      let left = s.width;
      let right = -s.width;
      let top = s.height;
      let bottom = -s.height;
      for (let {x,y} of pts) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
      return {left,right,top,bottom};
    };
    const bounds1 = boundedRect(rotated1);
    const bounds2 = boundedRect(rotated2);
    const translate = ({left,right,top,bottom}) => ({x,y}) => ({
      x: x-(right+left)/2,
      y: y-(bottom+top)/2,
    });
    const translated1 = rotated1.map(translate(bounds1));
    const translated2 = rotated2.map(translate(bounds2));
    const scale = sc => ({x,y}) => ({
      x: sc*x, y: sc*y,
    });
    const sc = (bounds1.bottom-bounds1.top) / (bounds2.bottom-bounds2.top);
    let scaled1 = translated1;
    let scaled2 = translated2;
    if (sc > 1) {
      scaled1 = translated1.map(scale(1/sc));
      console.log(1/sc);
    } else {
      scaled2 = translated2.map(scale(sc));
      console.log(sc);
    }
    show1 = scaled1;
    show2 = scaled2;
    return {pts1: scaled1, pts2: scaled2};
  }

  const getCoords = () => {
    const {pts1, pts2} = getNewPoints();
    const n1 = pts1.length;
    const n2 = pts2.length;
    const lines = []
    for (let i = 0; i < n1; i++) {
      const {x:x1,y:y1} = pts1[i];
      const {x:x2,y:y2} = pts1[(i+1)%n1];
      for (let j = 0; j < n2; j++) {
        const {x:z1,y:y3} = pts2[j];
        const {x:z2,y:y4} = pts2[(j+1)%n2];
        let pt1 = {x:x1,y:y1,z:(z2-z1)/(y4-y3)*(y1-y3)+z1};
        let pt2 = {x:x2,y:y2,z:(z2-z1)/(y4-y3)*(y2-y3)+z1};
        let pt3 = {x:(x2-x1)/(y2-y1)*(y3-y1)+x1,y:y3,z:z1};
        let pt4 = {x:(x2-x1)/(y2-y1)*(y4-y1)+x1,y:y4,z:z2};
        for (let i in [0,1,2,3]) {
          let {x,y,z} = [pt1,pt2,pt3,pt4][i];
          if (isNaN(x) || isNaN(y) || isNaN(z)) {
            console.log(i,x,y,z);
          }
        }
        if (pt1.x > pt2.x) {
          const temp = pt1;
          pt1 = pt2;
          pt2 = temp;
        }
        if (pt3.x > pt4.x) {
          const temp = pt3;
          pt3 = pt4;
          pt4 = temp;
        }
        if (pt3.x < pt1.x) {
          if (pt4.x >= pt1.x) {
            if (pt4.x >= pt2.x) {
              lines.push({pt1, pt2});
            } else {
              lines.push({pt1, pt2:pt4});
            }
          }
        } else if (pt3.x < pt2.x) {
          if (pt4.x < pt2.x) {
            lines.push({pt1:pt3, pt2:pt4});
          } else {
            lines.push({pt1:pt3, pt2});
          }
        }
      }
    }
    return lines;
  }

  s.keyPressed = () => {
    coords = getCoords();
  }
  
  s.draw = () => {
    s.background(255);
    s.orbitControl(1.3,1.3);
    s.stroke(0);
    s.strokeWeight(2);
    s.noFill();
    s.translate(0,0,s.height/2);
    s.rotateZ(-bestAngle);
    // s.sphere(s.height/2)
    // if (show1.length > 2 && show2.length > 2) {
    if (coords.length > 0) {
      for (let {pt1,pt2} of coords) {
        const {x:x1,y:y1,z:z1} = pt1;
        const {x:x2,y:y2,z:z2} = pt2;
        s.line(x1, y1, z1, x2, y2, z2);
      }
      // s.stroke(255,0,0);
      // s.beginShape();
      // // for (const {x,y} of p1) {
      // for (let i = 0; i < show1.length; i++) {
      //   const {x,y} = show1[i];
      //   s.vertex(x,y);
      // }
      // s.endShape(s.CLOSE);
      // s.stroke(0,0,255);
      // s.beginShape();
      // // for (const {x,y} of p1) {
      // for (let i = 0; i < show2.length; i++) {
      //   const {x,y} = show2[i];
      //   s.vertex(0,y,x);
      // }
      // s.endShape(s.CLOSE);
      // s.strokeWeight(3);
      // s.stroke(255,0,0);
      // for (let i = 0; i < show1.length; i++) {
      //   const {x,y} = show1[i];
      //   s.point(x,y);
      // }
      // s.stroke(0,0,255);
      // for (let i = 0; i < show2.length; i++) {
      //   const {x,y} = show2[i];
      //   s.point(0,y,x);
      // }
      // // for (let i = 0; i < p1.length; i++) {
      // //   const {x,y} = p1[i];
      // //   s.point(x,y,i*0);
      // // }
    }
  }
}

