import { useEffect, useRef, useState } from "react";
import Sketch from "react-p5";
import p5Types from "p5";

interface Organelle {
  x: number;
  y: number;
  size: number;
  color: p5Types.Color;
  type: "nucleus" | "mitochondria" | "vesicle" | "ribosome";
  rotation: number;
  rotationSpeed: number;
  offsetX: number;
  offsetY: number;
}

interface Molecule {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: p5Types.Color;
  lifespan: number;
}

interface Cell {
  x: number;
  y: number;
  radius: number;
  noiseOffset: number;
  color: p5Types.Color;
  type: "normal" | "cancer";
  id: string;
  organelles: Organelle[];
  irregularity: number; // Higher for cancer cells
}

const CellSimulation: React.FC<{ width: number; height: number; interactive?: boolean }> = ({ 
  width = 400, 
  height = 400,
  interactive = true
}) => {
  const cells = useRef<Cell[]>([]);
  const molecules = useRef<Molecule[]>([]);
  const colors = useRef<{[key: string]: p5Types.Color}>({});
  const centerX = useRef(width / 2);
  const centerY = useRef(height / 2);
  const mousePos = useRef({ x: 0, y: 0 });
  const pulseTime = useRef(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const gridOpacity = useRef(40);
  const scanLinePos = useRef(0);
  const scanTime = useRef(0);
  const scanAngle = useRef(0);

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(width, height).parent(canvasParentRef);
    p5.angleMode(p5.RADIANS);
    
    // Create color palette
    colors.current = {
      grid: p5.color(29, 174, 219, 20),
      scanLine: p5.color(255, 50, 50, 100),
      scanText: p5.color(29, 174, 219, 255),
      normal: p5.color(51, 195, 240, 100),
      cancer: p5.color(217, 70, 239, 100),
      normalStroke: p5.color(51, 195, 240, 150),
      cancerStroke: p5.color(217, 70, 239, 150),
      nucleus: p5.color(139, 92, 246, 200),
      mitochondria: p5.color(217, 70, 239, 180),
      vesicle: p5.color(45, 212, 191, 180),
      ribosome: p5.color(251, 146, 60, 200),
      molecules: p5.color(255, 255, 255, 150)
    };
    
    // Generate a mix of normal and cancer cells
    cells.current = [];
    const cellCount = 5; // Total number of cells
    const cancerCellCount = 2; // Number of cancer cells
    
    // Generate cancer cells
    for (let i = 0; i < cancerCellCount; i++) {
      const radius = p5.random(40, 65);
      const angle = p5.random(p5.TWO_PI);
      const dist = p5.random(10, width/2 - radius - 20);
      
      cells.current.push(createCell(
        p5,
        centerX.current + p5.cos(angle) * dist,
        centerY.current + p5.sin(angle) * dist,
        radius,
        "cancer",
        `C${i+1}-${p5.nf(p5.random(1000, 9999), 0, 0)}`
      ));
    }
    
    // Generate normal cells
    for (let i = 0; i < cellCount - cancerCellCount; i++) {
      const radius = p5.random(30, 50);
      const angle = p5.random(p5.TWO_PI);
      const dist = p5.random(10, width/2 - radius - 20);
      
      cells.current.push(createCell(
        p5,
        centerX.current + p5.cos(angle) * dist,
        centerY.current + p5.sin(angle) * dist,
        radius,
        "normal",
        `N${i+1}-${p5.nf(p5.random(1000, 9999), 0, 0)}`
      ));
    }
    
    // Initialize molecules
    molecules.current = [];
  };
  
  const createCell = (p5: p5Types, x: number, y: number, radius: number, type: "normal" | "cancer", id: string): Cell => {
    const cell: Cell = {
      x,
      y,
      radius,
      noiseOffset: p5.random(0, 100),
      color: type === "normal" ? colors.current.normal : colors.current.cancer,
      type,
      id,
      organelles: [],
      irregularity: type === "normal" ? p5.random(0.05, 0.15) : p5.random(0.3, 0.5)
    };
    
    // Create organelles for the cell
    const nucleusSize = radius * (type === "normal" ? 0.4 : 0.5); // Cancer cells have larger nuclei
    
    // Add nucleus - slightly off-center for cancer cells
    const nucleusOffsetX = type === "normal" ? 0 : p5.random(-radius * 0.1, radius * 0.1);
    const nucleusOffsetY = type === "normal" ? 0 : p5.random(-radius * 0.1, radius * 0.1);
    
    cell.organelles.push({
      x: nucleusOffsetX,
      y: nucleusOffsetY,
      size: nucleusSize,
      color: colors.current.nucleus,
      type: "nucleus",
      rotation: 0,
      rotationSpeed: 0,
      offsetX: type === "normal" ? 0 : p5.random(-1, 1),
      offsetY: type === "normal" ? 0 : p5.random(-1, 1)
    });
    
    // Add other organelles
    const organelleCount = Math.floor(p5.map(radius, 30, 65, 4, 10));
    
    for (let i = 0; i < organelleCount; i++) {
      const distFromCenter = p5.random(radius * 0.2, radius * 0.8);
      const angle = p5.random(p5.TWO_PI);
      const types = ["mitochondria", "vesicle", "ribosome"] as const;
      const organelleType = types[Math.floor(p5.random(types.length))];
      
      cell.organelles.push({
        x: p5.cos(angle) * distFromCenter,
        y: p5.sin(angle) * distFromCenter,
        size: organelleType === "mitochondria" ? p5.random(8, 15) : p5.random(3, 8),
        color: colors.current[organelleType],
        type: organelleType,
        rotation: p5.random(p5.TWO_PI),
        rotationSpeed: p5.random(-0.01, 0.01),
        offsetX: p5.random(-2, 2),
        offsetY: p5.random(-2, 2)
      });
    }
    
    return cell;
  };

  const draw = (p5: p5Types) => {
    p5.clear(0, 0, 0, 0);
    
    // Draw grid background to simulate medical scan
    drawGrid(p5);
    
    // Update pulse time and scan animation
    pulseTime.current = (pulseTime.current + 0.02) % p5.TWO_PI;
    scanTime.current = (scanTime.current + 0.005) % 1;
    scanAngle.current = (scanAngle.current + 0.02) % p5.TWO_PI;
    
    // Rotate scanning beam around the center
    const scanRadius = Math.min(width, height) * 0.45;
    const scanX1 = centerX.current;
    const scanY1 = centerY.current;
    const scanX2 = centerX.current + Math.cos(scanAngle.current) * scanRadius;
    const scanY2 = centerY.current + Math.sin(scanAngle.current) * scanRadius;
    
    // Draw scanning line
    // p5.stroke(colors.current.scanLine);
    // p5.strokeWeight(10);
    // p5.line(scanX1, scanY1, scanX2, scanY2);
    
    // Draw scanning circle
    // p5.noFill();
    // p5.stroke(colors.current.scanLine);
    // p5.strokeWeight(1);
    // p5.circle(centerX.current, centerY.current, scanRadius * 2);
    
    // // Add scan glow at the beam end
    // p5.fill(colors.current.scanLine);
    // p5.noStroke();
    // p5.circle(scanX2, scanY2, 6);
    
    // Draw horizontal scan line that spans the entire scanning circle
    // Use the same scan radius as the circular beam to ensure it covers the entire inner area
    const horizontalScanY = centerY.current + Math.sin(scanTime.current * p5.TWO_PI) * scanRadius;
    p5.stroke(colors.current.scanLine);
    p5.strokeWeight(2);
    p5.line(0, horizontalScanY, width, horizontalScanY);
    
    // Generate new molecules occasionally
    if (p5.random() < 0.1) {
      const angle = p5.random(p5.TWO_PI);
      const dist = p5.random(width * 0.4);
      
      molecules.current.push({
        x: centerX.current + p5.cos(angle) * dist,
        y: centerY.current + p5.sin(angle) * dist,
        size: p5.random(1, 3),
        speedX: p5.random(-0.5, 0.5),
        speedY: p5.random(-0.5, 0.5),
        color: p5.color(
          p5.random(200, 255),
          p5.random(200, 255),
          p5.random(200, 255),
          p5.random(100, 200)
        ),
        lifespan: p5.random(30, 90)
      });
    }
    
    // Update and draw molecules
    updateMolecules(p5);
    
    // Draw cells
    drawCells(p5);
    
    // Draw scan information (technical details)
    drawScanInfo(p5);
    
    // If interactive, handle mouse hover effects
    if (interactive && hovered) {
      handleInteraction(p5);
    }
  };
  
  const drawGrid = (p5: p5Types) => {
    p5.stroke(colors.current.grid);
    p5.strokeWeight(1);
    
    // Draw vertical lines
    const gridSpacing = 20;
    for (let x = 0; x < width; x += gridSpacing) {
      p5.line(x, 0, x, height);
    }
    
    // Draw horizontal lines
    for (let y = 0; y < height; y += gridSpacing) {
      p5.line(0, y, width, y);
    }
    
    // Draw coordinate markers
    p5.noStroke();
    p5.fill(colors.current.scanText);
    p5.textSize(8);
    
    for (let x = gridSpacing; x < width; x += gridSpacing * 5) {
      p5.text(x + "px", x + 2, 10);
    }
    
    for (let y = gridSpacing; y < height; y += gridSpacing * 5) {
      p5.text(y + "px", 2, y + 10);
    }
  };
  
  const drawCells = (p5: p5Types) => {
    const pulseScale = 1 + p5.sin(pulseTime.current) * 0.02;
    
    for (const cell of cells.current) {
      // Apply a scaling factor for pulsing effect
      const cellPulseScale = pulseScale * (cell.type === "cancer" ? 1 + p5.sin(pulseTime.current * 1.5) * 0.01 : 1);
      
      p5.push();
      p5.translate(cell.x, cell.y);
      
      // Draw cell membrane with perlin noise deformation (more irregular for cancer cells)
      drawCellMembrane(p5, cell, cellPulseScale);
      
      // Draw cytoplasm
      p5.fill(cell.color);
      p5.noStroke();
      
      if (cell.type === "normal") {
        // Normal cells are more circular
        p5.circle(0, 0, cell.radius * 1.8 * cellPulseScale);
      } else {
        // Cancer cells have more irregular cytoplasm
        p5.beginShape();
        for (let i = 0; i < 50; i++) {
          const angle = p5.map(i, 0, 50, 0, p5.TWO_PI);
          const noise = p5.noise(p5.cos(angle) * 0.5 + cell.noiseOffset, p5.sin(angle) * 0.5 + cell.noiseOffset, 0);
          const r = cell.radius * 0.9 * cellPulseScale * (1 + (noise - 0.5) * cell.irregularity);
          const x = p5.cos(angle) * r;
          const y = p5.sin(angle) * r;
          p5.vertex(x, y);
        }
        p5.endShape(p5.CLOSE);
      }
      
      // Draw organelles
      drawOrganelles(p5, cell, cellPulseScale);
      
      // Draw cell ID and measurements
      p5.fill(cell.type === "normal" ? colors.current.normalStroke : colors.current.cancerStroke);
      p5.textSize(8);
      p5.textAlign(p5.CENTER);
      p5.text(cell.id, 0, -cell.radius - 5);
      p5.textSize(7);
      p5.text(`${(cell.radius * 2).toFixed(1)}µm`, 0, -cell.radius - 15);
      
      if (cell.type === "cancer") {
        p5.fill(255, 100, 100, 200);
        p5.textSize(6);
        p5.text("ABNORMAL", 0, cell.radius + 15);
      }
      
      p5.pop();
    }
  };
  
  const drawCellMembrane = (p5: p5Types, cell: Cell, pulseScale: number) => {
    const membranePoints = 120;
    const noiseScale = cell.type === "normal" ? 0.3 : 0.7;
    const noiseAmount = cell.type === "normal" ? 0.1 : cell.irregularity;
    
    // Draw the cell membrane with noise
    p5.noFill();
    p5.stroke(cell.type === "normal" ? colors.current.normalStroke : colors.current.cancerStroke);
    p5.strokeWeight(2);
    
    p5.beginShape();
    for (let i = 0; i < membranePoints; i++) {
      const angle = p5.map(i, 0, membranePoints, 0, p5.TWO_PI);
      const noiseValue = p5.noise(
        p5.cos(angle) * noiseScale + cell.noiseOffset,
        p5.sin(angle) * noiseScale + cell.noiseOffset
      );
      
      const radiusNoise = p5.map(noiseValue, 0, 1, 1 - noiseAmount, 1 + noiseAmount);
      const radius = cell.radius * radiusNoise * pulseScale;
      
      const x = p5.cos(angle) * radius;
      const y = p5.sin(angle) * radius;
      
      p5.vertex(x, y);
    }
    p5.endShape(p5.CLOSE);
  };
  
  const drawOrganelles = (p5: p5Types, cell: Cell, pulseScale: number) => {
    for (const o of cell.organelles) {
      // Update organelle properties
      o.rotation += o.rotationSpeed;
      
      // Add subtle movement using oscillation
      const offsetX = o.offsetX * p5.sin(pulseTime.current * 0.7);
      const offsetY = o.offsetY * p5.cos(pulseTime.current * 0.5);
      
      p5.push();
      p5.translate(o.x + offsetX, o.y + offsetY);
      p5.rotate(o.rotation);
      
      p5.noStroke();
      p5.fill(o.color);
      
      if (o.type === "nucleus") {
        // Draw nucleus (more irregular for cancer cells)
        if (cell.type === "normal") {
          p5.circle(0, 0, o.size * pulseScale);
        } else {
          // Cancer cell nuclei are more irregular
          p5.beginShape();
          for (let i = 0; i < 50; i++) {
            const angle = p5.map(i, 0, 50, 0, p5.TWO_PI);
            const noise = p5.noise(p5.cos(angle) * 0.6 + cell.noiseOffset + 10, 
                                  p5.sin(angle) * 0.6 + cell.noiseOffset + 10, 0);
            const r = o.size * 0.5 * pulseScale * (1 + (noise - 0.5) * cell.irregularity * 1.5);
            const x = p5.cos(angle) * r;
            const y = p5.sin(angle) * r;
            p5.vertex(x, y);
          }
          p5.endShape(p5.CLOSE);
        }
        
        // Draw nucleus membrane
        p5.noFill();
        p5.stroke(o.color);
        p5.strokeWeight(1);
        p5.circle(0, 0, o.size * 1.05 * pulseScale);
        
        // Draw chromatin inside nucleus (more cluttered in cancer cells)
        p5.noStroke();
        p5.fill(o.color);
        const chromatinCount = cell.type === "normal" ? 8 : 12;
        
        for (let j = 0; j < chromatinCount; j++) {
          const angle = j * p5.TWO_PI / chromatinCount;
          const radius = o.size * (cell.type === "normal" ? 0.3 : 0.35) * pulseScale;
          const chromatinSize = cell.type === "normal" ? 
                             o.size * 0.25 * pulseScale : 
                             o.size * 0.3 * pulseScale * p5.random(0.7, 1.3); // Varied sizes for cancer
          
          p5.circle(
            p5.cos(angle) * radius,
            p5.sin(angle) * radius,
            chromatinSize
          );
        }
      } else if (o.type === "mitochondria") {
        // Draw mitochondrion (oval with internal structure)
        p5.ellipse(0, 0, o.size * 2.2 * pulseScale, o.size * pulseScale);
        
        // Draw cristae
        p5.stroke(p5.red(o.color), p5.green(o.color), p5.blue(o.color), 100);
        p5.strokeWeight(1);
        for (let j = -o.size; j < o.size; j += 4) {
          p5.line(j, -o.size * 0.4, j, o.size * 0.4);
        }
      } else if (o.type === "vesicle") {
        // Draw vesicle (circle)
        p5.circle(0, 0, o.size * pulseScale);
      } else if (o.type === "ribosome") {
        // Draw ribosome (small dot)
        p5.circle(0, 0, o.size * pulseScale);
      }
      
      p5.pop();
    }
  };
  
  const updateMolecules = (p5: p5Types) => {
    for (let i = molecules.current.length - 1; i >= 0; i--) {
      const m = molecules.current[i];
      
      // Update position
      m.x += m.speedX;
      m.y += m.speedY;
      
      // Update lifespan
      m.lifespan--;
      
      // Remove dead molecules
      if (m.lifespan <= 0) {
        molecules.current.splice(i, 1);
        continue;
      }
      
      // Draw molecule
      const alpha = p5.map(m.lifespan, 0, 60, 0, p5.alpha(m.color));
      p5.fill(p5.red(m.color), p5.green(m.color), p5.blue(m.color), alpha);
      p5.noStroke();
      p5.circle(m.x, m.y, m.size);
    }
  };
  
  const drawScanInfo = (p5: p5Types) => {
    // Draw scan information in the corners
    p5.fill(colors.current.scanText);
    p5.noStroke();
    
    // Top left - Scan metadata
    p5.textSize(8);
    p5.textAlign(p5.LEFT);
    p5.text("CELL SCAN v2.4.1", 10, 15);
    p5.text("MODE: HIGH RESOLUTION", 10, 25);
    p5.text(`SCALE: 1px = 0.25µm`, 10, 35);
    
    // Top right - Date and scan ID
    p5.textAlign(p5.RIGHT);
    const date = new Date().toISOString().slice(0, 10);
    p5.text(`DATE: ${date}`, width - 10, 15);
    p5.text(`SCAN ID: XC-${Math.floor(Math.random() * 9000 + 1000)}`, width - 10, 25);
    p5.text(`NORMAL CELLS: ${cells.current.filter(c => c.type === "normal").length}`, width - 10, 35);
    p5.text(`ABNORMAL CELLS: ${cells.current.filter(c => c.type === "cancer").length}`, width - 10, 45);
    
    // Bottom left - Technical parameters
    p5.textAlign(p5.LEFT);
    p5.text(`MAG: 400x`, 10, height - 35);
    p5.text(`RESOLUTION: ${width}x${height}`, 10, height - 25);
    p5.text(`CONTRAST: +1.5`, 10, height - 15);
    
    // Bottom right - Sample info
    p5.textAlign(p5.RIGHT);
    p5.text(`SAMPLE TYPE: TISSUE BIOPSY`, width - 10, height - 25);
    p5.text(`ANALYSIS STATUS: IN PROGRESS`, width - 10, height - 15);
  };
  
  const handleInteraction = (p5: p5Types) => {
    // Calculate vector from center to mouse
    const mouseXRel = mousePos.current.x;
    const mouseYRel = mousePos.current.y;
    
    // Find the closest cell to the mouse
    let closestCell: Cell | null = null;
    let minDistance = Number.MAX_VALUE;
    
    for (const cell of cells.current) {
      const distance = p5.dist(cell.x, cell.y, mouseXRel, mouseYRel);
      if (distance < minDistance) {
        minDistance = distance;
        closestCell = cell;
      }
    }
    
    // If mouse is close to a cell, highlight it and show info
    if (closestCell && minDistance < closestCell.radius * 1.5) {
      // Draw highlight around cell
      p5.push();
      p5.translate(closestCell.x, closestCell.y);
      p5.noFill();
      p5.stroke(255, 255, 100, 100);
      p5.strokeWeight(2);
      p5.circle(0, 0, closestCell.radius * 2.2);
      
      // Draw measurement lines
      p5.stroke(255, 255, 100, 150);
      p5.strokeWeight(1);
      p5.line(-closestCell.radius, 0, closestCell.radius, 0);
      p5.line(0, -closestCell.radius, 0, closestCell.radius);
      
      // Draw diameter text
      p5.fill(255, 255, 100);
      p5.noStroke();
      p5.textAlign(p5.CENTER);
      p5.textSize(10);
      p5.text(`Ø ${(closestCell.radius * 2).toFixed(1)}µm`, 0, closestCell.radius + 30);
      
      // Draw cell type and ID
        p5.textSize(10);
      p5.text(`Type: ${closestCell.type === "normal" ? "NORMAL" : "ABNORMAL MORPHOLOGY"}`, 0, -closestCell.radius - 30);
      p5.textSize(9);
      p5.text(`Nuclear ratio: ${(closestCell.organelles[0].size / (closestCell.radius * 2)).toFixed(2)}`, 0, -closestCell.radius - 45);
      
      // Generate some molecules toward cell when highlighted
      if (p5.random() < 0.2) {
        molecules.current.push({
          x: closestCell.x + p5.random(-closestCell.radius, closestCell.radius),
          y: closestCell.y + p5.random(-closestCell.radius, closestCell.radius),
          size: p5.random(1, 3),
          speedX: p5.random(-1, 1),
          speedY: p5.random(-1, 1),
          color: p5.color(255, 255, 100, p5.random(100, 150)),
          lifespan: p5.random(20, 40)
        });
      }
      
      p5.pop();
    }
  };
  
  const handleMouseMoved = (p5: p5Types) => {
    mousePos.current = { x: p5.mouseX, y: p5.mouseY };
  };
  
  useEffect(() => {
    const handleMouseEnter = () => setHovered(true);
    const handleMouseLeave = () => setHovered(false);
    
    if (canvasRef.current && interactive) {
      canvasRef.current.addEventListener('mouseenter', handleMouseEnter);
      canvasRef.current.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      if (canvasRef.current && interactive) {
        canvasRef.current.removeEventListener('mouseenter', handleMouseEnter);
        canvasRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [interactive]);

  return (
    <div 
      ref={canvasRef} 
      className="relative cursor-pointer transition-all duration-300"
      style={{ width, height }}
    >
      <Sketch setup={setup} draw={draw} mouseMoved={handleMouseMoved} />
    </div>
  );
};

export default CellSimulation;
