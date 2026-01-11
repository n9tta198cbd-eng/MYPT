// ========================================
// CONFIGURATION VARIABLES
// ========================================

const CONFIG = {
    // Background
    backgroundColor: '#7F387F',          // Цвет фона
    backgroundOpacity: 0.05,             // Прозрачность фона при перерисовке (0.01-0.1)

    // Trails (Трейлы)
    trailColor: '#000000',               // Цвет трейлов
    trailOpacity: 0.8,                   // Прозрачность трейлов (0-1)
    trailWidth: 1.5,                     // Толщина трейлов
    trailFadeSpeed: 0.02,                // Скорость затухания трейлов (0.01-0.1)
    trailSpawnChance: 0.05,              // Шанс появления трейла (0-1, где 0.05 = 5%)

    // Connections (Соединения)
    connectionColor: '#000000',          // Цвет линий между нодами
    connectionOpacity: 0.6,              // Прозрачность линий (0-1)
    connectionWidth: 0.8,                // Толщина линий
    connectionDistance: 150,             // Максимальное расстояние связи между нодами

    // Nodes (Ноды)
    nodeDensity: 40000,                  // Плотность нодов (чем больше, тем меньше нодов)
    nodeMinCount: 8,                     // Минимальное количество нодов
    nodeBaseRadius: 5,                   // Базовый радиус ноды
    nodeRadiusVariation: 10,             // Вариация радиуса (+random * variation)
    nodeCenterColor: '#1a111a',          // Цвет центра ноды
    nodeRingColor: 'rgba(26, 17, 26, 0.6)', // Цвет колец ноды
    nodeRingCount: { min: 1, max: 3 },   // Количество колец на ноде
    nodeRingSpacing: 3,                  // Расстояние между кольцами

    // Movement (Движение)
    nodeSpeedX: 0.2,                     // Скорость движения по X
    nodeSpeedY: 0.2,                     // Скорость движения по Y
    ringRotationSpeed: 0.05,             // Скорость вращения колец

    // Noise Texture (Шумовая текстура)
    noiseEnabled: true,                  // Включить шум
    noiseIntensity: 30,                  // Интенсивность шума (0-100)
    noiseDensity: 0.97                   // Плотность шума (0.9-0.99, чем выше - тем меньше точек)
};

// ========================================

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
        this.baseRadius = Math.random() * CONFIG.nodeRadiusVariation + CONFIG.nodeBaseRadius;
        this.rings = [];

        const ringCount = Math.floor(Math.random() * (CONFIG.nodeRingCount.max - CONFIG.nodeRingCount.min + 1)) + CONFIG.nodeRingCount.min;
        for(let i = 0; i < ringCount; i++) {
            this.rings.push({
                r: this.baseRadius + (i * CONFIG.nodeRingSpacing),
                start: Math.random() * Math.PI * 2,
                speed: (Math.random() - 0.5) * CONFIG.ringRotationSpeed,
                dash: Math.random() > 0.5 ? [2, 4] : []
            });
        }

        this.vx = (Math.random() - 0.5) * CONFIG.nodeSpeedX;
        this.vy = (Math.random() - 0.5) * CONFIG.nodeSpeedY;
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
        ctx.fillStyle = CONFIG.nodeCenterColor;
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw rings
        this.rings.forEach(ring => {
            ctx.beginPath();
            ctx.strokeStyle = CONFIG.nodeRingColor;
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
        this.fadeSpeed = CONFIG.trailFadeSpeed;
    }

    update() {
        this.opacity -= this.fadeSpeed;
    }

    draw() {
        if (this.opacity <= 0) return;

        ctx.beginPath();
        const r = parseInt(CONFIG.trailColor.slice(1, 3), 16);
        const g = parseInt(CONFIG.trailColor.slice(3, 5), 16);
        const b = parseInt(CONFIG.trailColor.slice(5, 7), 16);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity * CONFIG.trailOpacity})`;
        ctx.lineWidth = CONFIG.trailWidth;

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
    const nodeCount = Math.max(CONFIG.nodeMinCount, Math.floor((width * height) / CONFIG.nodeDensity));

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

            if (dist < CONFIG.connectionDistance) {
                ctx.beginPath();
                const r = parseInt(CONFIG.connectionColor.slice(1, 3), 16);
                const g = parseInt(CONFIG.connectionColor.slice(3, 5), 16);
                const b = parseInt(CONFIG.connectionColor.slice(5, 7), 16);
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${CONFIG.connectionOpacity})`;
                ctx.lineWidth = CONFIG.connectionWidth;
                ctx.moveTo(nodes[i].x, nodes[i].y);

                if (Math.random() > 0.5) {
                    ctx.lineTo(nodes[j].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);

                    if (Math.random() > (1 - CONFIG.trailSpawnChance)) {
                        traces.push(new Trace(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y, 'horizontal-vertical'));
                    }
                } else {
                    ctx.lineTo(nodes[i].x, nodes[j].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);

                    if (Math.random() > (1 - CONFIG.trailSpawnChance)) {
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
    if (!CONFIG.noiseEnabled) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        if (Math.random() > CONFIG.noiseDensity) {
            const noise = Math.random() * CONFIG.noiseIntensity;
            data[i] = Math.min(255, data[i] + noise);
            data[i + 1] = Math.min(255, data[i + 1] + noise);
            data[i + 2] = Math.min(255, data[i + 2] + noise);
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

// Animation loop
function animate() {
    // Fill with background color
    const r = parseInt(CONFIG.backgroundColor.slice(1, 3), 16);
    const g = parseInt(CONFIG.backgroundColor.slice(3, 5), 16);
    const b = parseInt(CONFIG.backgroundColor.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${CONFIG.backgroundOpacity})`;
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
ctx.fillStyle = CONFIG.backgroundColor;
ctx.fillRect(0, 0, width, height);

// Add initial noise texture
drawNoiseTexture();

animate();
