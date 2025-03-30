import { useState } from "react";
import Sketch from "react-p5";
import p5Types from "p5";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

type SketchMode = "circles" | "waves" | "flowfield" | "interactive";

const P5Demo = () => {
  const [mode, setMode] = useState<SketchMode>("circles");
  const [particleCount, setParticleCount] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [colorIntensity, setColorIntensity] = useState(100);
  
  // For flow field
  let flowfield: number[][] = [];
  let particles: any[] = [];
  let zoff = 0;
  
  // For interactive mode
  let trail: { x: number; y: number }[] = [];
  
  const setupCircles = (p5: p5Types) => {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: p5.random(p5.width),
        y: p5.random(p5.height),
        size: p5.random(5, 15),
        speedX: p5.random(-2, 2) * speed,
        speedY: p5.random(-2, 2) * speed,
        color: p5.color(
          p5.random(255) * (colorIntensity / 100),
          p5.random(255) * (colorIntensity / 100),
          p5.random(255) * (colorIntensity / 100)
        ),
      });
    }
  };
  
  const setupWaves = () => {
    // No specific setup needed for waves
  };
  
  const setupFlowfield = (p5: p5Types) => {
    const scale = 20;
    const cols = Math.floor(p5.width / scale);
    const rows = Math.floor(p5.height / scale);
    
    flowfield = Array(cols).fill(0).map(() => Array(rows).fill(0));
    
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        pos: p5.createVector(p5.random(p5.width), p5.random(p5.height)),
        prevPos: p5.createVector(0, 0),
        vel: p5.createVector(0, 0),
        acc: p5.createVector(0, 0),
        maxSpeed: 4 * speed,
        color: p5.color(
          p5.random(255) * (colorIntensity / 100),
          p5.random(255) * (colorIntensity / 100),
          p5.random(255) * (colorIntensity / 100),
          50
        ),
      });
    }
  };
  
  const setupInteractive = () => {
    trail = [];
  };
  
  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(window.innerWidth - 400, window.innerHeight - 100).parent(canvasParentRef);
    
    // Initialize based on selected mode
    if (mode === "circles") setupCircles(p5);
    else if (mode === "waves") setupWaves();
    else if (mode === "flowfield") setupFlowfield(p5);
    else if (mode === "interactive") setupInteractive();
  };
  
  const draw = (p5: p5Types) => {
    p5.background(20, 20, 30, 10);
    
    if (mode === "circles") drawCircles(p5);
    else if (mode === "waves") drawWaves(p5);
    else if (mode === "flowfield") drawFlowfield(p5);
    else if (mode === "interactive") drawInteractive(p5);
  };
  
  const drawCircles = (p5: p5Types) => {
    p5.noStroke();
    
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      
      p.x += p.speedX;
      p.y += p.speedY;
      
      // Bounce off edges
      if (p.x <= 0 || p.x >= p5.width) {
        p.speedX *= -1;
      }
      if (p.y <= 0 || p.y >= p5.height) {
        p.speedY *= -1;
      }
      
      p5.fill(p.color);
      p5.circle(p.x, p.y, p.size);
    }
  };
  
  const drawWaves = (p5: p5Types) => {
    p5.noFill();
    
    for (let j = 0; j < 5; j++) {
      p5.beginShape();
      p5.stroke(
        p5.map(j, 0, 5, 50, 255) * (colorIntensity / 100),
        p5.map(j, 0, 5, 100, 200) * (colorIntensity / 100),
        255 * (colorIntensity / 100),
        150
      );
      p5.strokeWeight(2);
      
      for (let i = 0; i < p5.width; i += 5) {
        const angle = p5.frameCount * 0.02 * speed + i * 0.1;
        const y = p5.map(p5.sin(angle), -1, 1, 200, p5.height - 200);
        p5.vertex(i, y + j * 20);
      }
      
      p5.endShape();
    }
  };
  
  const drawFlowfield = (p5: p5Types) => {
    const scale = 20;
    const cols = Math.floor(p5.width / scale);
    const rows = Math.floor(p5.height / scale);
    
    let xoff = 0;
    for (let i = 0; i < cols; i++) {
      let yoff = 0;
      for (let j = 0; j < rows; j++) {
        const angle = p5.noise(xoff, yoff, zoff) * p5.TWO_PI * 2;
        flowfield[i][j] = angle;
        yoff += 0.1;
      }
      xoff += 0.1;
    }
    zoff += 0.01 * speed;
    
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      
      // Find force from flowfield
      const x = Math.floor(p.pos.x / scale);
      const y = Math.floor(p.pos.y / scale);
      
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        const angle = flowfield[x][y];
        const force = p5.createVector(p5.cos(angle), p5.sin(angle));
        force.mult(0.1 * speed);
        p.acc.add(force);
      }
      
      p.vel.add(p.acc);
      p.vel.limit(p.maxSpeed);
      p.prevPos.x = p.pos.x;
      p.prevPos.y = p.pos.y;
      p.pos.add(p.vel);
      p.acc.mult(0);
      
      // Wrap around edges
      if (p.pos.x < 0) { p.pos.x = p5.width; p.prevPos.x = p.pos.x; }
      if (p.pos.x > p5.width) { p.pos.x = 0; p.prevPos.x = p.pos.x; }
      if (p.pos.y < 0) { p.pos.y = p5.height; p.prevPos.y = p.pos.y; }
      if (p.pos.y > p5.height) { p.pos.y = 0; p.prevPos.y = p.pos.y; }
      
      // Draw particle
      p5.stroke(p.color);
      p5.strokeWeight(1);
      p5.line(p.prevPos.x, p.prevPos.y, p.pos.x, p.pos.y);
    }
  };
  
  const drawInteractive = (p5: p5Types) => {
    // Add mouse position to trail when mouse is moving
    if (p5.mouseIsPressed && p5.mouseX > 0 && p5.mouseY > 0 && p5.mouseX < p5.width && p5.mouseY < p5.height) {
      trail.push({ x: p5.mouseX, y: p5.mouseY });
      
      // Limit trail length
      if (trail.length > 100) {
        trail.shift();
      }
    }
    
    // Draw trail
    p5.noFill();
    p5.beginShape();
    for (let i = 0; i < trail.length; i++) {
      const alpha = p5.map(i, 0, trail.length, 50, 255);
      const size = p5.map(i, 0, trail.length, 2, 20);
      
      p5.fill(
        p5.map(i, 0, trail.length, 50, 255) * (colorIntensity / 100),
        100 * (colorIntensity / 100),
        p5.map(i, 0, trail.length, 200, 50) * (colorIntensity / 100),
        alpha
      );
      p5.noStroke();
      p5.circle(trail[i].x, trail[i].y, size);
    }
    p5.endShape();
    
    // Draw instructions
    p5.fill(255);
    p5.textSize(16);
    p5.text("Click and drag to draw!", 20, 30);
  };
  
  const resetSketch = (p5: p5Types) => {
    p5.background(20, 20, 30);
    
    if (mode === "circles") setupCircles(p5);
    else if (mode === "waves") setupWaves();
    else if (mode === "flowfield") setupFlowfield(p5);
    else if (mode === "interactive") setupInteractive();
  };
  
  const windowResized = (p5: p5Types) => {
    p5.resizeCanvas(window.innerWidth - 400, window.innerHeight - 100);
    resetSketch(p5);
  };
  
  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <div className="flex flex-col w-full">
        <header className="p-4 bg-gray-800">
          <h1 className="text-2xl font-bold">P5.js Demo</h1>
          <p className="text-gray-400">Explore the creative capabilities of p5.js</p>
        </header>
        
        <div className="flex flex-1">
          <div className="flex-1 relative p-4">
            <Sketch 
              setup={setup} 
              draw={draw} 
              windowResized={windowResized} 
            />
          </div>
          
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-96 bg-gray-800 p-6 overflow-y-auto"
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Visualization Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={mode}
                  onValueChange={(value) => setMode(value as SketchMode)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a visualization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circles">Bouncing Circles</SelectItem>
                    <SelectItem value="waves">Wave Patterns</SelectItem>
                    <SelectItem value="flowfield">Flow Field</SelectItem>
                    <SelectItem value="interactive">Interactive Drawing</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="particles">Particle Count: {particleCount}</Label>
                  <Slider
                    id="particles"
                    min={10}
                    max={500}
                    step={10}
                    value={[particleCount]}
                    onValueChange={(value) => setParticleCount(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="speed">Speed: {speed.toFixed(1)}x</Label>
                  <Slider
                    id="speed"
                    min={0.1}
                    max={3}
                    step={0.1}
                    value={[speed]}
                    onValueChange={(value) => setSpeed(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="color">Color Intensity: {colorIntensity}%</Label>
                  <Slider
                    id="color"
                    min={10}
                    max={100}
                    step={5}
                    value={[colorIntensity]}
                    onValueChange={(value) => setColorIntensity(value[0])}
                  />
                </div>
                
                <Button
                  className="w-full mt-4"
                  onClick={() => {
                    const canvas = document.querySelector("canvas");
                    if (canvas) {
                      const p5Instance = (canvas as any).__p5_instance;
                      if (p5Instance) {
                        resetSketch(p5Instance);
                      }
                    }
                  }}
                >
                  Reset Visualization
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>About P5.js</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-3">
                  p5.js is a JavaScript library for creative coding, making coding accessible for artists,
                  designers, educators, and beginners.
                </p>
                <p className="text-sm text-gray-400">
                  It has a full set of drawing functionality. However, you're not limited
                  to your drawing canvas. You can think of your whole browser page as your sketch,
                  including HTML5 objects that you can create and manipulate with p5.js code.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default P5Demo; 