const canvas = document.getElementById('chaosCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let nodes = [];
let traces = [];

// Node class with animated rings
class Node {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.baseRadius = Math.random() * 10 + 5;
        this.rings = [];

        const ringCount = Math.floor(Math.random() * 3) + 1;
        for(let i = 0; i < ringCount; i++) {
            this.rings.push({
                r: this.baseRadius + (i * 3),
                start: Math.random() * Math.PI * 2,
                speed: (Math.random() - 0.5) * 0.05,
                dash: Math.random() > 0.5 ? [2, 4] : []
            });
        }

        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        this.rings.forEach(ring => {
            ring.start += ring.speed;
        });
    }

    draw() {
        // Draw center dot
        ctx.beginPath();
        ctx.fillStyle = '#1a111a';
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw rings
        this.rings.forEach(ring => {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(26, 17, 26, 0.6)';
            ctx.lineWidth = 1;
            if (ring.dash.length > 0) {
                ctx.setLineDash(ring.dash);
            }
            ctx.arc(this.x, this.y, ring.r, ring.start, ring.start + Math.PI * 1.5);
            ctx.stroke();
            ctx.setLineDash([]);
        });
    }
}

// Trace class for fading connection lines
class Trace {
    constructor(x1, y1, x2, y2, type) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.type = type;
        this.opacity = 1;
        this.fadeSpeed = 0.02;
    }

    update() {
        this.opacity -= this.fadeSpeed;
    }

    draw() {
        if (this.opacity <= 0) return;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 0, 0, ${this.opacity * 0.8})`;
        ctx.lineWidth = 1.5;

        ctx.moveTo(this.x1, this.y1);

        if (this.type === 'horizontal-vertical') {
            ctx.lineTo(this.x2, this.y1);
            ctx.lineTo(this.x2, this.y2);
        } else if (this.type === 'vertical-horizontal') {
            ctx.lineTo(this.x1, this.y2);
            ctx.lineTo(this.x2, this.y2);
        } else {
            ctx.lineTo(this.x2, this.y2);
        }

        ctx.stroke();
    }
}

// Resize canvas to fit window
function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    initNodes();
}

// Initialize nodes based on screen size
function initNodes() {
    nodes = [];
    const nodeCount = Math.max(8, Math.floor((width * height) / 40000));

    for (let i = 0; i < nodeCount; i++) {
        nodes.push(new Node());
    }
}

// Draw right-angle connections between nearby nodes
function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.lineWidth = 0.8;
                ctx.moveTo(nodes[i].x, nodes[i].y);

                if (Math.random() > 0.5) {
                    ctx.lineTo(nodes[j].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);

                    if (Math.random() > 0.95) {
                        traces.push(new Trace(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y, 'horizontal-vertical'));
                    }
                } else {
                    ctx.lineTo(nodes[i].x, nodes[j].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);

                    if (Math.random() > 0.95) {
                        traces.push(new Trace(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y, 'vertical-horizontal'));
                    }
                }

                ctx.stroke();
            }
        }
    }
}

// Add noise texture to background
function drawNoiseTexture() {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        if (Math.random() > 0.97) {
            const noise = Math.random() * 30;
            data[i] = Math.min(255, data[i] + noise);
            data[i + 1] = Math.min(255, data[i + 1] + noise);
            data[i + 2] = Math.min(255, data[i + 2] + noise);
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

// Animation loop
function animate() {
    // Fill with purple background (#7F387F)
    ctx.fillStyle = 'rgba(127, 56, 127, 0.05)';
    ctx.fillRect(0, 0, width, height);

    // Update and draw traces
    traces = traces.filter(trace => {
        trace.update();
        trace.draw();
        return trace.opacity > 0;
    });

    // Draw connections
    drawConnections();

    // Update and draw nodes
    nodes.forEach(node => {
        node.update();
        node.draw();
    });

    requestAnimationFrame(animate);
}

// Initialize
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Fill initial background
ctx.fillStyle = '#7F387F';
ctx.fillRect(0, 0, width, height);

// Add initial noise texture
drawNoiseTexture();

animate();
