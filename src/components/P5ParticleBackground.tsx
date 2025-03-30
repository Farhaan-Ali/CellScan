import { useEffect, useRef, useState } from "react";
import Sketch from "react-p5";
import p5Types from "p5";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: p5Types.Color;
  targetX?: number;
  targetY?: number;
  isFollowing?: boolean;
  alpha?: number;
  age?: number;
  lifespan?: number;
}

const P5ParticleBackground: React.FC = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const particles = useRef<Particle[]>([]);
  const colors = useRef<p5Types.Color[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const isMouseMoved = useRef(false);
  const lastMouseMoveTime = useRef(0);
  const hasMoved = useRef(false);
  const isOverText = useRef(false);
  const emitCounter = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    // Create canvas
    p5.createCanvas(windowSize.width, windowSize.height).parent(canvasParentRef);
    
    // Initialize colors
    colors.current = [
      p5.color("#1EAEDB"),
      p5.color("#33C3F0"),
      p5.color("#8B5CF6"),
      p5.color("#D946EF")
    ];
    
    // Create initial particles
    const backgroundParticleCount = windowSize.width < 768 ? 20 : 40;
    particles.current = [];
    
    // Background particles
    for (let i = 0; i < backgroundParticleCount; i++) {
      const randomColor = colors.current[Math.floor(p5.random(colors.current.length))];
      particles.current.push({
        x: p5.random(windowSize.width),
        y: p5.random(windowSize.height),
        size: p5.random(4, 8),
        speedX: p5.random(-0.7, 0.7),
        speedY: p5.random(-0.7, 0.7),
        color: randomColor,
        isFollowing: false
      });
    }
  };

  const draw = (p5: p5Types) => {
    p5.clear(0, 0, 0, 0);
    
    // Update mouse position
    if (p5.mouseX > 0 && p5.mouseY > 0 && p5.mouseX < p5.width && p5.mouseY < p5.height) {
      if (
        p5.dist(mousePos.current.x, mousePos.current.y, p5.mouseX, p5.mouseY) > 3 ||
        !hasMoved.current
      ) {
        mousePos.current = { x: p5.mouseX, y: p5.mouseY };
        lastMouseMoveTime.current = p5.millis();
        isMouseMoved.current = true;
        hasMoved.current = true;
      }
    }
    
    // Check if mouse hasn't moved for a while
    const currentTime = p5.millis();
    const mouseActiveThreshold = 200; // ms
    const mouseIsActive = currentTime - lastMouseMoveTime.current < mouseActiveThreshold;
    
    // Draw connections between background particles
    p5.stroke(255, 255, 255, 15);
    for (let i = 0; i < particles.current.length; i++) {
      if (!particles.current[i].isFollowing) {
        for (let j = i + 1; j < particles.current.length; j++) {
          if (!particles.current[j].isFollowing) {
            const p1 = particles.current[i];
            const p2 = particles.current[j];
            const distance = p5.dist(p1.x, p1.y, p2.x, p2.y);
            
            if (distance < 150) {
              const alpha = p5.map(distance, 0, 150, 30, 0);
              p5.stroke(255, 255, 255, alpha);
              p5.line(p1.x, p1.y, p2.x, p2.y);
            }
          }
        }
      }
    }
    
    // Update and draw all particles
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i];
      
      if (p.isFollowing) {
        // Update cursor-originated particles
        
        // Update age and check if expired
        if (p.age !== undefined) {
          p.age++;
          
          // Fade out as particles age
          if (p.alpha && p.lifespan) {
            p.alpha = p5.map(p.age, 0, p.lifespan, 220, 0, true);
            
            // Remove expired particles
            if (p.age >= p.lifespan) {
              particles.current.splice(i, 1);
              continue;
            }
          }
        }
        
        // Slow down particles over time for natural motion
        p.speedX *= 0.98;
        p.speedY *= 0.98;
        
        // Apply a tiny bit of random movement
        p.speedX += p5.random(-0.05, 0.05);
        p.speedY += p5.random(-0.05, 0.05);
        
      } else if (!p.isFollowing) {
        // Background particles - bounce off edges
        if (p.x <= 0 || p.x >= windowSize.width) {
          p.speedX *= -1;
        }
        
        if (p.y <= 0 || p.y >= windowSize.height) {
          p.speedY *= -1;
        }
      }
      
      // Update position
      p.x += p.speedX;
      p.y += p.speedY;
      
      // Keep particles on screen
      if (p.isFollowing) {
        p.x = p5.constrain(p.x, 0, windowSize.width);
        p.y = p5.constrain(p.y, 0, windowSize.height);
      }
      
      // Draw particle
      p5.noStroke();
      
      if (p.isFollowing) {
        // Draw cursor-originated particles
        const c = p5.color(p.color.toString());
        const alpha = p.alpha || 200;
        c.setAlpha(alpha);
        p5.fill(c);
        
        // Add glow effect
        const glowAmount = p5.map(alpha, 0, 200, 0, 10);
        p5.drawingContext.shadowBlur = glowAmount;
        p5.drawingContext.shadowColor = c.toString();
        p5.circle(p.x, p.y, p.size);
        p5.drawingContext.shadowBlur = 0;
        
        // Draw small nucleus
        p5.fill(255, 255, 255, alpha * 0.7);
        p5.circle(p.x, p.y, p.size * 0.4);
      } else {
        // Draw background particles
        p5.fill(p.color);
        p5.circle(p.x, p.y, p.size);
      }
    }
    
    // Generate new particles at cursor position if mouse is active
    if (mouseIsActive && hasMoved.current) {
      // Emit counter helps control emission rate
      emitCounter.current++;
      
      // Adjust emission rate based on text overlay
      const emitRate = isOverText.current ? 6 : 3;
      
      if (emitCounter.current % emitRate === 0) {
        const randomColor = colors.current[Math.floor(p5.random(colors.current.length))];
        
        // Generate particle that originates from cursor position
        const particleCount = isOverText.current ? 1 : p5.random() < 0.3 ? 2 : 1;
        
        for (let i = 0; i < particleCount; i++) {
          // Random direction for particle to move away from cursor
          const angle = p5.random(0, p5.TWO_PI);
          const speed = p5.random(1, 3);
          
          particles.current.push({
            x: mousePos.current.x,
            y: mousePos.current.y,
            size: p5.random(3, 6),
            speedX: Math.cos(angle) * speed,
            speedY: Math.sin(angle) * speed,
            color: randomColor,
            isFollowing: true,
            alpha: p5.random(180, 220),
            age: 0,
            lifespan: p5.random(40, 80)
          });
        }
        
        // Keep particle count reasonable
        const maxParticles = 150;
        if (particles.current.length > maxParticles) {
          // Find oldest cursor particles to remove
          const followingParticles = particles.current
            .filter(p => p.isFollowing)
            .sort((a, b) => (b.age || 0) - (a.age || 0));
            
          if (followingParticles.length > 0) {
            const oldestIndex = particles.current.indexOf(followingParticles[0]);
            if (oldestIndex !== -1) {
              particles.current.splice(oldestIndex, 1);
            }
          } else {
            // Remove a background particle if no following particles
            for (let i = 0; i < particles.current.length; i++) {
              if (!particles.current[i].isFollowing) {
                particles.current.splice(i, 1);
                break;
              }
            }
          }
        }
      }
    }
  };
  
  const handleMouseMoved = (p5: p5Types) => {
    mousePos.current = { x: p5.mouseX, y: p5.mouseY };
    lastMouseMoveTime.current = p5.millis();
    isMouseMoved.current = true;
    hasMoved.current = true;
    
    // Check if mouse is over text or interactive elements
    const element = document.elementFromPoint(p5.mouseX, p5.mouseY);
    if (element) {
      const tagName = element.tagName.toLowerCase();
      const isText = tagName === 'p' || tagName === 'h1' || tagName === 'h2' || 
                    tagName === 'h3' || tagName === 'h4' || tagName === 'span' || 
                    tagName === 'a' || tagName === 'button' || tagName === 'input' ||
                    tagName === 'textarea' || element.classList.contains('text-content');
      isOverText.current = isText;
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
      <Sketch setup={setup} draw={draw} mouseMoved={handleMouseMoved} />
    </div>
  );
};

export default P5ParticleBackground; 