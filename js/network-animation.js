document.addEventListener('DOMContentLoaded', function() {
    // Basic setup for canvas
    const canvas = document.getElementById('networkFlowCanvas');
    if (!canvas) {
        console.error('Network flow canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    
    // Repositioned canvas to push network animation down
    function resizeCanvas() {
        if (!parent) return;
        
        // Create canvas with standard dimensions
        const fullWidth = document.documentElement.clientWidth;
        const fullHeight = parent.offsetHeight; // Standard height without extra padding
        
        canvas.width = fullWidth;
        canvas.height = fullHeight;
        
        // Position canvas exactly within its container (not above)
        canvas.style.position = 'absolute';
        canvas.style.top = '0'; // Start at top of container instead of above
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        // Allow overflow for visible connections
        parent.style.overflow = 'hidden';
        
        // Recreate nodes on resize
        if (canvas.width > 0 && canvas.height > 0) {
            createNodes();
        }
    }
    
    let nodes = [];
    const startTime = Date.now();
    
    // Edge safety constants
    const EDGE_MARGIN = {
        TOP: 200,    // Extensive top margin to prevent cutoff
        BOTTOM: 80,  
        LEFT: 80,
        RIGHT: 80
    };
    
    // Node class with strict edge avoidance
    class Node {
        constructor() {
            this.size = 2 + Math.random() * 3;
            
            // Start nodes with extra padding at the top
            const topPadding = 120; // Extra padding at top to prevent clipping
            const sidePadding = 40;  // Standard padding for sides
            
            // Generate positions to ensure better top coverage
            this.x = -sidePadding + (Math.random() * (canvas.width + sidePadding*2));
            
            // Apply stronger bias to keep nodes away from the very top
            const topBias = Math.random();
            if (topBias < 0.7) {
                // 70% of nodes positioned well below the top edge
                this.y = topPadding + (Math.random() * (canvas.height - topPadding));
            } else {
                // 30% of nodes can be in top region but still with padding
                this.y = topPadding/2 + (Math.random() * topPadding);
            }
            
            this.speed = 0.01 + Math.random() * 0.04;
            this.processing = Math.random() > 0.6; // Increase processing nodes
            this.connections = [];
            
            // Increased base opacity for better visibility
            this.alpha = 0.35 + Math.random() * 0.4;
            
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.005 + Math.random() * 0.01;
        }
        
        update(timeElapsed) {
            // Minimal acceleration for more consistent movement
            const speedFactor = Math.min(1 + (timeElapsed / 30000), 2);
            
            // Move right
            this.x += this.speed * speedFactor;
            
            // Loop back when off screen - ensure coverage of bottom left
            if (this.x > canvas.width + 40) {
                this.x = -40;
                // Distribute across full height when recycling
                this.y = -40 + (Math.random() * (canvas.height + 80));
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
        
        // Create even more nodes for better coverage
        const count = Math.max(100, Math.floor((canvas.width * canvas.height) / 2000));
        
        // Create nodes with better distribution
        for (let i = 0; i < count; i++) {
            const node = new Node();
            
            // Ensure we have good initial distribution including bottom left
            if (i < count * 0.3) {
                // 30% of nodes in bottom half
                node.y = canvas.height/2 + (Math.random() * canvas.height/2);
                // 15% of those focused on bottom left
                if (i < count * 0.15) {
                    node.x = Math.random() * (canvas.width/2);
                }
            }
            
            nodes.push(node);
        }
        
        // Create connections with better visual density
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
            
            // Connect to 6-10 closest nodes for denser connections
            const connectionCount = 6 + Math.floor(Math.random() * 5);
            node.connections = otherNodes.slice(0, connectionCount);
        });
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
    
    // Set up the canvas with proper positioning
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Initialize and start
    createNodes();
    animate();
});
