// Animated Background Canvas
const canvas = document.getElementById('chaosCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let nodes = [];
let traces = [];

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

class Node {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.baseRadius = Math.random() * 10 + 5;
        this.rings = [];

        const ringCount = Math.floor(Math.random() * 3) + 1;
        for(let i=0; i<ringCount; i++) {
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

        if(this.x < 0 || this.x > width) this.vx *= -1;
        if(this.y < 0 || this.y > height) this.vy *= -1;

        this.rings.forEach(r => r.start += r.speed);
    }

    draw() {
        ctx.strokeStyle = '#1a111a';
        ctx.fillStyle = '#1a111a';

        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        this.rings.forEach(r => {
            ctx.beginPath();
            ctx.setLineDash(r.dash);
            ctx.lineWidth = 0.5;
            ctx.arc(this.x, this.y, r.r, r.start, r.start + 4);
            ctx.stroke();
        });
        ctx.setLineDash([]);
    }
}

class Trace {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1; this.y1 = y1;
        this.x2 = x2; this.y2 = y2;
        this.life = 1.0;
        this.decay = 0.005 + Math.random() * 0.01;
    }
    update() { this.life -= this.decay; }
    draw() {
        if (this.life <= 0) return;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(26, 17, 26, ${this.life * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
    }
}

function initNodes() {
    nodes = [];
    traces = [];

    const density = 15000;
    const count = Math.floor((width * height) / density);

    for(let i=0; i<count; i++) nodes.push(new Node());
}

function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
        let connected = false;
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 150) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(26, 17, 26, 0.6)';
                ctx.lineWidth = 0.8;
                ctx.moveTo(nodes[i].x, nodes[i].y);

                if (Math.random() > 0.5) {
                    ctx.lineTo(nodes[j].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                } else {
                    ctx.lineTo(nodes[i].x, nodes[j].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                }
                ctx.stroke();
                connected = true;

                if (Math.random() < 0.01) {
                    traces.push(new Trace(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y));
                }
            }
        }

        if (!connected && Math.random() < 0.005) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(26, 17, 26, 0.2)';
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[i].x + (Math.random()-0.5)*1000, nodes[i].y + (Math.random()-0.5)*1000);
            ctx.stroke();
        }
    }
}

function animateCanvas() {
    ctx.clearRect(0, 0, width, height);

    for (let i = traces.length - 1; i >= 0; i--) {
        traces[i].update();
        traces[i].draw();
        if (traces[i].life <= 0) traces.splice(i, 1);
    }

    drawConnections();

    nodes.forEach(node => {
        node.update();
        node.draw();
    });

    requestAnimationFrame(animateCanvas);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
animateCanvas();

console.log('n9tta portfolio loaded successfully!');
