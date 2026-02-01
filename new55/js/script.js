

// Инициализация Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    drawPlaceholder();
}

function drawPlaceholder() {
    // Очистка
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Сетка
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    const gridSize = 20;

    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Текст
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Используем i18n если доступен, иначе фолбек
    const text = (window.i18n && window.i18n.t) ? window.i18n.t('game.canvas_placeholder') : 'Игровое поле Canvas';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

// Слушаем изменение размера окна для адаптивности
window.addEventListener('resize', resizeCanvas);

// Слушаем изменение языка
document.addEventListener('langChanged', () => {
    drawPlaceholder();
});

// Первичная инициализация
resizeCanvas();
