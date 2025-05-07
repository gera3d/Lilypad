document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('networkFlowCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    
    // Set canvas to full size of parent
    function resizeCanvas() {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Node class to represent computing nodes
    class Node {
        constructor(x, y, size) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.originalSize = size;
            this.color = '#08D4CB';
            this.alpha = 0.2 + Math.random() * 0.3;
            this.processing = Math.random() > 0.7; // 30% of nodes are processing
            this.pulsePhase = Math.random() * Math.PI * 2; // Random starting phase
            this.pulseSpeed = 0.05 + Math.random() * 0.05; // Random pulse speed
            this.connections = [];
            // Modified to prioritize left-to-right movement
            this.movementAngle = (Math.random() * Math.PI / 2) - Math.PI / 4; // -45 to +45 degrees
            this.baseMovementSpeed = 0.3 + Math.random() * 0.5; // Slightly faster
            this.movementSpeed = this.baseMovementSpeed;
            this.type = Math.random() > 0.8 ? 'gpu' : (Math.random() > 0.5 ? 'cpu' : 'data');
        }
        
        update() {
            // Pulse effect for processing nodes
            if (this.processing) {
                this.pulsePhase += this.pulseSpeed;
                const pulseFactor = 1 + 0.3 * Math.sin(this.pulsePhase);
                this.size = this.originalSize * pulseFactor;
            }
            
            // Prioritize left-to-right movement
            this.x += Math.cos(this.movementAngle) * this.movementSpeed;
            this.y += Math.sin(this.movementAngle) * this.movementSpeed;
            
            // When node moves off screen to the right, teleport it to the left
            if (this.x > canvas.width + this.size) {
                this.x = -this.size;
                this.y = this.size + Math.random() * (canvas.height - 2 * this.size);
                // Adjust angle to keep flowing rightward
                this.movementAngle = (Math.random() * Math.PI / 2) - Math.PI / 4;
            }
            
            // Bounce off top/bottom edges only
            if (this.y < this.size || this.y > canvas.height - this.size) {
                this.movementAngle = -this.movementAngle;
                this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));
            }
        }
        
        draw() {
            // Draw node
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(8, 212, 203, ${this.processing ? this.alpha + 0.2 : this.alpha})`;
            ctx.fill();
            
            // Draw inner circle for GPU nodes
            if (this.type === 'gpu') {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(8, 212, 203, 0.3)';
                ctx.fill();
            }
            
            // Draw data icon for data nodes
            if (this.type === 'data') {
                ctx.beginPath();
                ctx.rect(this.x - this.size * 0.5, this.y - this.size * 0.3, this.size, this.size * 0.6);
                ctx.fillStyle = 'rgba(8, 212, 203, 0.3)';
                ctx.fill();
            }
        }
        
        drawConnections() {
            this.connections.forEach(node => {
                // Calculate distance for line opacity
                const distance = Math.sqrt(
                    Math.pow(this.x - node.x, 2) + Math.pow(this.y - node.y, 2)
                );
                
                // Only draw if within reasonable distance - increased to ensure connections
                if (distance < 200) {
                    // Line opacity based on distance
                    const alpha = 0.5 * (1 - distance / 200);
                    
                    // Draw connection line
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(node.x, node.y);
                    ctx.strokeStyle = `rgba(8, 212, 203, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                    
                    // If either node is processing, draw data packets - always flowing left to right
                    if (this.processing || node.processing) {
                        if (this.x <= node.x) {
                            this.drawDataPacket(node); // Flow left to right
                        } else {
                            node.drawDataPacket(this); // Ensure flow is left to right
                        }
                    }
                }
            });
        }
        
        drawDataPacket(targetNode) {
            // Calculate packet position based on time
            const time = Date.now() / 1000;
            const packetSpeed = 0.5; // Speed of packet animation
            const packetPosition = (time * packetSpeed) % 1;
            
            // Calculate packet coordinates along the line
            const x = this.x + (targetNode.x - this.x) * packetPosition;
            const y = this.y + (targetNode.y - this.y) * packetPosition;
            
            // Draw packet
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(8, 212, 203, 0.8)';
            ctx.fill();
        }
    }
    
    // Create nodes - arrange them to ensure left-to-right flow
    const numNodes = Math.floor(canvas.width * canvas.height / 7000); // Slightly higher density
    const nodes = [];
    
    // Distribute nodes across the canvas
    for (let i = 0; i < numNodes; i++) {
        const size = 3 + Math.random() * 5;
        const x = Math.random() * canvas.width;
        const y = size + Math.random() * (canvas.height - 2 * size);
        nodes.push(new Node(x, y, size));
    }
    
    // Connect nodes to ensure ALL nodes are connected
    function connectNodes() {
        // First, sort nodes by x-position
        const sortedNodes = [...nodes].sort((a, b) => a.x - b.x);
        
        // Connect each node to at least 2 other nodes
        sortedNodes.forEach((node, index) => {
            // Get candidates - prefer nodes to the right for leftward nodes
            let candidates;
            if (index < sortedNodes.length / 2) {
                // For nodes on the left half, prefer connecting to nodes on the right
                candidates = sortedNodes.filter(n => n !== node && n.x >= node.x);
                if (candidates.length < 2) {
                    // Not enough nodes to the right, include some to the left
                    const leftCandidates = sortedNodes.filter(n => n !== node && n.x < node.x);
                    candidates = [...candidates, ...leftCandidates];
                }
            } else {
                // For nodes on the right half, connect to any other node
                candidates = sortedNodes.filter(n => n !== node);
            }
            
            // Sort by distance
            candidates.sort((a, b) => {
                const distA = Math.sqrt(Math.pow(node.x - a.x, 2) + Math.pow(node.y - a.y, 2));
                const distB = Math.sqrt(Math.pow(node.x - b.x, 2) + Math.pow(node.y - b.y, 2));
                return distA - distB;
            });
            
            // Connect to 2-3 closest nodes
            const connectCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < connectCount && i < candidates.length; i++) {
                node.connections.push(candidates[i]);
            }
        });
        
        // Check for isolated nodes and connect them
        const isolated = nodes.filter(node => node.connections.length === 0);
        isolated.forEach(node => {
            const closest = nodes
                .filter(n => n !== node)
                .sort((a, b) => {
                    const distA = Math.sqrt(Math.pow(node.x - a.x, 2) + Math.pow(node.y - a.y, 2));
                    const distB = Math.sqrt(Math.pow(node.x - b.x, 2) + Math.pow(node.y - b.y, 2));
                    return distA - distB;
                })[0];
            
            if (closest) {
                node.connections.push(closest);
                closest.connections.push(node);
            }
        });
    }
    
    connectNodes();
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw all nodes
        nodes.forEach(node => {
            node.update();
        });
        
        // Draw connections first (so they appear behind nodes)
        nodes.forEach(node => {
            node.drawConnections();
        });
        
        // Then draw nodes on top
        nodes.forEach(node => {
            node.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
});
