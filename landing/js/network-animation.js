document.addEventListener('DOMContentLoaded', function() {
    // Basic setup for canvas
    const canvas = document.getElementById('networkFlowCanvas');
    if (!canvas) {
        console.error('Network flow canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    
    // Improved resize function for true edge-to-edge coverage
    function resizeCanvas() {
        if (!parent) return;
        
        // Get the actual full width
        const fullWidth = document.documentElement.clientWidth; // Use full document width
        canvas.width = fullWidth;
        canvas.height = parent.offsetHeight || 400;
        
        console.log('Canvas size:', canvas.width, 'x', canvas.height);
        
        // Override parent styles if needed to ensure full width
        parent.style.width = '100vw';
        parent.style.maxWidth = '100vw';
        parent.style.marginLeft = 'calc(50% - 50vw)'; // Offset any parent container padding
        parent.style.overflow = 'hidden';
        
        // Recreate nodes on resize
        if (canvas.width > 0 && canvas.height > 0) {
            createNodes();
        }
    }
    
    let nodes = [];
    const startTime = Date.now();
    
    // Node class with simplified visuals (no packet animations)
    class Node {
        constructor() {
            this.size = 2 + Math.random() * 3;
            
            // Start nodes across the full width of the container
            const fullWidth = canvas.width + 40;
            this.x = -20 + (Math.random() * fullWidth);
            this.y = Math.random() * canvas.height;
            
            // Much slower speed for more elegant flow
            this.speed = 0.01 + Math.random() * 0.04; // Reduced speed by ~75%
            this.processing = Math.random() > 0.7;
            this.connections = [];
            this.alpha = 0.2 + Math.random() * 0.3;
            
            // Subtle pulse effect instead of data packets
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.005 + Math.random() * 0.01; // Even slower pulse
        }
        
        update(timeElapsed) {
            // Minimal acceleration for more consistent movement
            const speedFactor = Math.min(1 + (timeElapsed / 30000), 2); // Slower acceleration
            
            // Move right
            this.x += this.speed * speedFactor;
            
            // Loop back when off screen
            if (this.x > canvas.width + 20) {
                this.x = -20;
                this.y = Math.random() * canvas.height;
            }
            
            // Subtle pulse effect for processing nodes
            if (this.processing) {
                this.pulsePhase += this.pulseSpeed;
            }
        }
        
        draw() {
            // Add subtle pulse to node alpha for processing nodes
            let drawAlpha = this.alpha;
            if (this.processing) {
                const pulseFactor = 0.5 + 0.5 * Math.sin(this.pulsePhase);
                drawAlpha = this.alpha + (0.2 * pulseFactor);
            }
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(8, 212, 203, ${drawAlpha})`;
            ctx.fill();
        }
    }
    
    // Create nodes and connections
    function createNodes() {
        nodes = [];
        
        // Create more nodes for denser connections and more solid shapes
        const count = Math.max(50, Math.floor((canvas.width * canvas.height) / 2500)); // Increased node count
        
        // Create evenly distributed nodes across the container width
        for (let i = 0; i < count; i++) {
            const node = new Node();
            
            // Explicitly position nodes from left to right edge
            node.x = -20 + ((canvas.width + 40) * (i / count));
            
            nodes.push(node);
        }
        
        // Create connections - each node connects to more others for solid shapes
        nodes.forEach(node => {
            node.connections = [];
            
            // Find closest nodes with preference for right-side connections
            const otherNodes = [...nodes]
                .filter(n => n !== node)
                .sort((a, b) => {
                    // Favor connections to nodes on the right
                    const rightBiasA = a.x > node.x ? -30 : 0;
                    const rightBiasB = b.x > node.x ? -30 : 0;
                    
                    const distA = Math.sqrt(Math.pow(a.x - node.x, 2) + Math.pow(a.y - node.y, 2)) + rightBiasA;
                    const distB = Math.sqrt(Math.pow(b.x - node.x, 2) + Math.pow(b.y - node.y, 2)) + rightBiasB;
                    return distA - distB;
                });
            
            // Connect to 5-9 closest nodes for denser, more solid-looking shapes
            const connectionCount = 5 + Math.floor(Math.random() * 5);
            node.connections = otherNodes.slice(0, connectionCount);
        });
        
        console.log(`Created ${nodes.length} nodes spanning the full window width ${window.innerWidth}px`);
    }
    
    // Animation loop
    function animate() {
        if (!canvas.width || !canvas.height) {
            requestAnimationFrame(animate);
            return;
        }
        
        const timeElapsed = Date.now() - startTime;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw connections
        nodes.forEach(node => {
            node.connections.forEach(connected => {
                // Only draw if reasonable distance - increased for more solid shapes
                const dx = node.x - connected.x;
                const dy = node.y - connected.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < 300) { // Increased from 250 for more connections
                    // Calculate connection opacity based on distance
                    const alpha = 0.6 * (1 - distance/300); // Higher base opacity (0.6 vs 0.5)
                    
                    // Subtly enhanced connection for processing nodes
                    let connectionAlpha = alpha;
                    if (node.processing || connected.processing) {
                        connectionAlpha *= 1.2; // Slightly brighter connections for active nodes
                    }
                    
                    // Draw connection line
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(connected.x, connected.y);
                    ctx.strokeStyle = `rgba(8, 212, 203, ${connectionAlpha})`;
                    ctx.lineWidth = 0.7; // Slightly thicker lines for more solid appearance
                    ctx.stroke();
                }
            });
        });
        
        // Update and draw nodes
        nodes.forEach(node => {
            node.update(timeElapsed);
            node.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    // Make sure we have the canvas element properly set up
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Keep canvas within its parent container
    if (canvas) {
        canvas.style.opacity = '0.3';
        canvas.style.position = 'absolute'; // Not fixed - stay in the parent
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%'; // 100% of parent width
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
    }
    
    // Initialize and start
    createNodes();
    animate();
});
