document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('networkFlowCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    // Handle window resize
    window.addEventListener('resize', function() {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
    });
    
    // Network nodes class
    class Node {
        constructor(x, y, radius) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.originalRadius = radius;
            this.speed = 0.2 + Math.random() * 0.3;
            this.connectionRadius = 80;
            this.pulseAmount = 0;
            this.pulseSpeed = 0.01 + Math.random() * 0.02;
            this.pulseDirection = Math.random() > 0.5 ? 1 : -1;
            this.opacity = 0.5 + Math.random() * 0.5;
        }
        
        update() {
            // Move from left to right with wrapping
            this.x += this.speed;
            if (this.x - this.radius > width) {
                this.x = -this.radius;
                this.y = Math.random() * height;
            }
            
            // Gentle pulsing effect
            this.pulseAmount += this.pulseSpeed * this.pulseDirection;
            if (this.pulseAmount > 1 || this.pulseAmount < 0) {
                this.pulseDirection *= -1;
            }
            
            // Update radius with pulse
            this.radius = this.originalRadius * (1 + this.pulseAmount * 0.2);
        }
        
        draw() {
            // Draw node with gradient for glow effect
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
            gradient.addColorStop(0, `rgba(8, 212, 203, ${this.opacity * 0.8})`);
            gradient.addColorStop(1, 'rgba(8, 212, 203, 0)');
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(8, 212, 203, ${this.opacity})`;
            ctx.fill();
        }
        
        // Draw connections to nearby nodes
        connect(nodes) {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (node === this) continue;
                
                const distance = Math.hypot(this.x - node.x, this.y - node.y);
                
                if (distance < this.connectionRadius) {
                    // Draw connection line
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(node.x, node.y);
                    const opacity = (1 - distance / this.connectionRadius) * 0.4;
                    ctx.strokeStyle = `rgba(8, 212, 203, ${opacity})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                    
                    // Data packet effect - small dot moving along the connection
                    const packetPosition = (Date.now() % 2000) / 2000; // 0-1 position
                    const packetX = this.x + (node.x - this.x) * packetPosition;
                    const packetY = this.y + (node.y - this.y) * packetPosition;
                    
                    ctx.beginPath();
                    ctx.arc(packetX, packetY, 1.2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 2})`;
                    ctx.fill();
                }
            }
        }
    }
    
    // Create nodes
    const nodeCount = Math.floor(width * height / 15000); // Adjust density based on screen size
    const nodes = [];
    
    for (let i = 0; i < nodeCount; i++) {
        const radius = 2 + Math.random() * 3;
        // Distribute nodes across entire canvas, with some off-screen to the left
        const x = Math.random() * width * 1.5 - width * 0.5;
        const y = Math.random() * height;
        nodes.push(new Node(x, y, radius));
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].update();
            nodes[i].draw();
        }
        
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].connect(nodes);
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
});
