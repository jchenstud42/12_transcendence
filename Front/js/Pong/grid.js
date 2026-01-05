const PONG_WIDTH = 800;
const PONG_HEIGHT = 600;
let gridCanvas = null;
let gridCtx = null;
function initializeGrid() {
    if (gridCanvas)
        return; // Already initialized
    const pong_menu = document.getElementById("pong-menu");
    if (!pong_menu) {
        console.error("pong-menu element not found");
        return;
    }
    // Create separate canvas for the grid
    gridCanvas = document.createElement('canvas');
    gridCanvas.id = 'canvas-grid';
    gridCanvas.width = PONG_WIDTH;
    gridCanvas.height = PONG_HEIGHT;
    gridCanvas.style.position = 'absolute';
    gridCanvas.style.width = 'var(--game-width)';
    gridCanvas.style.height = 'var(--game-height)';
    gridCanvas.style.top = '0';
    gridCanvas.style.left = '0';
    gridCanvas.classList.add('hidden');
    pong_menu.appendChild(gridCanvas);
    gridCtx = gridCanvas.getContext('2d');
    if (!gridCtx) {
        console.error("Failed to get canvas context");
        return;
    }
}
// Draw grid on the separate grid canvas
export function drawGrid() {
    initializeGrid();
    if (!gridCtx)
        return;
    const GRID_SIZE = 50; // 50 pixels per square
    gridCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // Light gray grid
    gridCtx.lineWidth = 1;
    // Draw vertical lines
    for (let x = 0; x <= PONG_WIDTH; x += GRID_SIZE) {
        gridCtx.beginPath();
        gridCtx.moveTo(x, 0);
        gridCtx.lineTo(x, PONG_HEIGHT);
        gridCtx.stroke();
    }
    // Draw horizontal lines
    for (let y = 0; y <= PONG_HEIGHT; y += GRID_SIZE) {
        gridCtx.beginPath();
        gridCtx.moveTo(0, y);
        gridCtx.lineTo(PONG_WIDTH, y);
        gridCtx.stroke();
    }
}
export function showGrid() {
    initializeGrid();
    if (gridCanvas) {
        gridCanvas.classList.remove('hidden');
    }
}
export function hideGrid() {
    initializeGrid();
    if (gridCanvas) {
        gridCanvas.classList.add('hidden');
    }
}
