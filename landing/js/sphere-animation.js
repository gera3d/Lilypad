class SphereAnimation {
    constructor(canvasId) {
        // Check if canvas exists before initializing
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn('Canvas element not found:', canvasId);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.lineDistance = 50;
        this.radius = 120;
        this.baseRadius = 120;
        this.pulseFactor = 0;
        this.pulseSpeed = 0.02;
        this.rotationSpeed = 0.002;
        this.particleCount = 150;
        this.center = { x: 0, y: 0 };
        this.mousePosition = { x: 0, y: 0 };
        this.isMouseOver = false;
        this.rotationAngle = 0;
        
        this.init();
        this.animate();
        this.addEventListeners();
    }
    
    init() {
        this.resize();
        this.createParticles();
    }
    
    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.offsetWidth;
        this.canvas.height = parent.offsetHeight;
        this.center.x = this.canvas.width / 2;
        this.center.y = this.canvas.height / 2;
    }
    
    createParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            // Create points on a sphere using spherical coordinates
            const phi = Math.acos(-1 + (2 * i) / this.particleCount);
            const theta = Math.sqrt(this.particleCount * Math.PI) * phi;
            
            const particle = {
                x: this.radius * Math.cos(theta) * Math.sin(phi),
                y: this.radius * Math.sin(theta) * Math.sin(phi),
                z: this.radius * Math.cos(phi),
                size: Math.random() * 2 + 1,
                color: '#08D4CB', // Teal color from your brand
                originalX: this.radius * Math.cos(theta) * Math.sin(phi),
                originalY: this.radius * Math.sin(theta) * Math.sin(phi),
                originalZ: this.radius * Math.cos(phi)
            };
            
            this.particles.push(particle);
        }
    }
    
    addEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePosition.x = e.clientX - rect.left;
            this.mousePosition.y = e.clientY - rect.top;
            this.isMouseOver = true;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isMouseOver = false;
        });
    }
    
    drawParticles() {
        // Update the pulsating effect
        this.pulseFactor += this.pulseSpeed;
        const pulseDelta = Math.sin(this.pulseFactor) * 15;
        this.radius = this.baseRadius + pulseDelta;
        
        // Rotate the sphere
        this.rotationAngle += this.rotationSpeed;
        
        // Draw connections first (behind particles)
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(8, 212, 203, 0.15)';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            
            // Apply rotation to each particle
            const rotatedX = p1.originalX * Math.cos(this.rotationAngle) - p1.originalZ * Math.sin(this.rotationAngle);
            const rotatedZ = p1.originalX * Math.sin(this.rotationAngle) + p1.originalZ * Math.cos(this.rotationAngle);
            
            p1.x = rotatedX * (this.radius / this.baseRadius);
            p1.z = rotatedZ * (this.radius / this.baseRadius);
            p1.y = p1.originalY * (this.radius / this.baseRadius);
            
            // Get 2D screen position
            const screenX = this.center.x + p1.x;
            const screenY = this.center.y + p1.y;
            
            // Draw connecting lines between nearby particles
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const distance = Math.sqrt(
                    Math.pow(p1.x - p2.x, 2) + 
                    Math.pow(p1.y - p2.y, 2) + 
                    Math.pow(p1.z - p2.z, 2)
                );
                
                if (distance < this.lineDistance) {
                    const opacity = 0.2 * (1 - distance / this.lineDistance);
                    this.ctx.strokeStyle = `rgba(8, 212, 203, ${opacity})`;
                    
                    const screenX2 = this.center.x + p2.x;
                    const screenY2 = this.center.y + p2.y;
                    
                    this.ctx.moveTo(screenX, screenY);
                    this.ctx.lineTo(screenX2, screenY2);
                }
            }
        }
        this.ctx.stroke();
        
        // Now draw the particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            // Calculate size based on z-position for depth effect
            const sizeModifier = (p.z + this.radius) / (2 * this.radius);
            let adjustedSize = p.size * sizeModifier * 1.5;
            
            // Calculate opacity based on z-position
            let opacity = sizeModifier * 0.8 + 0.2;
            
            const screenX = this.center.x + p.x;
            const screenY = this.center.y + p.y;
            
            // Draw the particle
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, adjustedSize, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(8, 212, 203, ${opacity})`;
            this.ctx.fill();
        }
        
        // Add a subtle glow effect
        const gradient = this.ctx.createRadialGradient(
            this.center.x, this.center.y, 10,
            this.center.x, this.center.y, this.radius * 1.2
        );
        gradient.addColorStop(0, 'rgba(8, 212, 203, 0.1)');
        gradient.addColorStop(0.5, 'rgba(8, 212, 203, 0.05)');
        gradient.addColorStop(1, 'rgba(8, 212, 203, 0)');
        
        this.ctx.beginPath();
        this.ctx.arc(this.center.x, this.center.y, this.radius * 1.2, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw dark background with slight transparency
        this.ctx.fillStyle = 'rgba(22, 25, 31, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawParticles();
        
        requestAnimationFrame(() => this.animate());
    }
}

// Make initialization safer
document.addEventListener('DOMContentLoaded', () => {
    // Wait until everything is fully loaded
    window.addEventListener('load', () => {
        if (document.getElementById('sphereCanvas')) {
            try {
                const sphereAnimation = new SphereAnimation('sphereCanvas');
            } catch (e) {
                console.error('Error initializing sphere animation:', e);
                // Fallback to static version if animation fails
                const canvas = document.getElementById('sphereCanvas');
                if (canvas && canvas.parentElement) {
                    const fallbackImg = document.createElement('img');
                    fallbackImg.src = "https://lilypad.tech/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo-ball.8036e673.png&w=640&q=75";
                    fallbackImg.alt = "Lilypad Logo";
                    fallbackImg.className = "w-48 h-48 object-contain";
                    canvas.parentElement.replaceChild(fallbackImg, canvas);
                }
            }
        }
    });
});
