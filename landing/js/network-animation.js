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
    
    // Enhanced Node class for better edge-to-edge coverage
    class Node {
        constructor() {
            this.size = 2 + Math.random() * 3;
            
            // Start nodes across the full width of the container (including slightly off-screen)
            const fullWidth = canvas.width + 40; // Add small buffer
            this.x = -20 + (Math.random() * fullWidth);
            this.y = Math.random() * canvas.height;
            
            // Slower speed for more consistent flow
            this.speed = 0.05 + Math.random() * 0.15;
            this.processing = Math.random() > 0.7;
            this.connections = [];
            this.alpha = 0.2 + Math.random() * 0.3;
        }
        
        update(timeElapsed) {
            // Simple acceleration
            const speedFactor = Math.min(1 + (timeElapsed / 10000), 5);
            
            // Move right
            this.x += this.speed * speedFactor;
            
            // Loop back when off screen
            if (this.x > canvas.width + 20) {
                this.x = -20;
                this.y = Math.random() * canvas.height;
            }
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(8, 212, 203, ${this.processing ? this.alpha + 0.2 : this.alpha})`;
            ctx.fill();
        }
    }
    
    // Create nodes and connections
    function createNodes() {
        nodes = [];
        
        // Create an appropriate number of nodes for the container size
        const count = Math.max(40, Math.floor((canvas.width * canvas.height) / 3000));
        
        // Create evenly distributed nodes across the container width
        for (let i = 0; i < count; i++) {
            const node = new Node();
            
            // Explicitly position nodes from left to right edge
            node.x = -20 + ((canvas.width + 40) * (i / count));
            
            nodes.push(node);
        }
        
        // Create connections - each node connects to 3-5 others
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
            
            // Connect to 3-6 closest nodes (increased for denser connections)
            const connectionCount = 3 + Math.floor(Math.random() * 4);
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
                // Only draw if reasonable distance - increased for wider connections
                const dx = node.x - connected.x;
                const dy = node.y - connected.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < 250) { // Increased connection distance
                    const alpha = 0.5 * (1 - distance/250);
                    
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(connected.x, connected.y);
                    ctx.strokeStyle = `rgba(8, 212, 203, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                    
                    // Data packets
                    if ((node.processing || connected.processing) && node.x <= connected.x) {
                        const time = Date.now() / 1000;
                        const packetPosition = (time * 0.5) % 1;
                        const x = node.x + (connected.x - node.x) * packetPosition;
                        const y = node.y + (connected.y - node.y) * packetPosition;
                        
                        ctx.beginPath();
                        ctx.arc(x, y, 2, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(8, 212, 203, 0.8)';
                        ctx.fill();
                    }
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
