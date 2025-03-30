import { useRef } from "react";
import Sketch from "react-p5";
import p5Types from "p5";
import { motion } from "framer-motion";

interface DNANode {
  x: number;
  y: number;
  color: string;
  connected: boolean;
}

const DNAHelix = () => {
  const dna1 = useRef<DNANode[]>([]);
  const dna2 = useRef<DNANode[]>([]);
  const nodeCount = 15;
  const radius = 150;
  const colors = ["#1EAEDB", "#33C3F0", "#8B5CF6", "#D946EF"];

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    const size = Math.min(400, window.innerWidth * 0.8);
    p5.createCanvas(size, size).parent(canvasParentRef);
    p5.frameRate(30);
    
    // Initialize DNA nodes
    for (let i = 0; i < nodeCount; i++) {
      dna1.current.push({
        x: 0,
        y: 0,
        color: colors[Math.floor(p5.random(0, colors.length))],
        connected: i % 2 === 0
      });
      
      dna2.current.push({
        x: 0,
        y: 0,
        color: colors[Math.floor(p5.random(0, colors.length))],
        connected: i % 2 === 1
      });
    }
  };

  const draw = (p5: p5Types) => {
    p5.clear(0,0,0,0);
    
    const centerX = p5.width / 2;
    const centerY = p5.height / 2;
    const timeOffset = p5.frameCount * 0.02;
    
    // Update DNA node positions
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * p5.TWO_PI + timeOffset;
      const offset = (i / nodeCount) * p5.TWO_PI;
      
      // Calculate positions for double helix
      dna1.current[i].x = centerX + p5.cos(angle) * (radius * 0.35);
      dna1.current[i].y = centerY + p5.sin(angle) * (radius * 0.35) + offset * 13;
      
      dna2.current[i].x = centerX - p5.cos(angle) * (radius * 0.35);
      dna2.current[i].y = centerY + p5.sin(angle) * (radius * 0.35) + offset * 13;
    }
    
    // Draw connections (backbone)
    p5.stroke(255, 30);
    p5.strokeWeight(2);
    
    for (let i = 0; i < nodeCount - 1; i++) {
      p5.line(dna1.current[i].x, dna1.current[i].y, dna1.current[i + 1].x, dna1.current[i + 1].y);
      p5.line(dna2.current[i].x, dna2.current[i].y, dna2.current[i + 1].x, dna2.current[i + 1].y);
    }
    
    // Draw connections between strands (base pairs)
    p5.strokeWeight(3);
    for (let i = 0; i < nodeCount; i++) {
      if (dna1.current[i].connected) {
        const color = p5.color(dna1.current[i].color);
        color.setAlpha(100);
        p5.stroke(color);
        p5.line(dna1.current[i].x, dna1.current[i].y, dna2.current[i].x, dna2.current[i].y);
      }
    }
    
    // Draw nodes
    p5.noStroke();
    for (let i = 0; i < nodeCount; i++) {
      // First strand
      p5.fill(dna1.current[i].color + 'CC');
      p5.circle(dna1.current[i].x, dna1.current[i].y, 12);
      
      // Glow effect
      p5.fill(dna1.current[i].color + '44');
      p5.circle(dna1.current[i].x, dna1.current[i].y, 18);
      
      // Second strand
      p5.fill(dna2.current[i].color + 'CC');
      p5.circle(dna2.current[i].x, dna2.current[i].y, 12);
      
      // Glow effect
      p5.fill(dna2.current[i].color + '44');
      p5.circle(dna2.current[i].x, dna2.current[i].y, 18);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="h-full w-full"
    >
      <Sketch setup={setup} draw={draw} mousePressed={() => {}} mouseReleased={() => {}} mouseClicked={() => {}} mouseWheel={() => {}} />
    </motion.div>
  );
};

export default DNAHelix;
