const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const BLOCK_SIZE = 20;
const COLS = 12;
const ROWS = 20;

// テトリミノの形状定義
const TETROMINOS = {
    'I': [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
    'J': [[1,0,0], [1,1,1], [0,0,0]],
    'L': [[0,0,1], [1,1,1], [0,0,0]],
    'O': [[1,1], [1,1]],
    'S': [[0,1,1], [1,1,0], [0,0,0]],
    'T': [[0,1,0], [1,1,1], [0,0,0]],
    'Z': [[1,1,0], [0,1,1], [0,0,0]]
};

const COLORS = {
    'I': 'cyan',
    'J': 'blue',
    'L': 'orange',
    'O': 'yellow',
    'S': 'green',
    'T': 'purple',
    'Z': 'red'
};

const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('hold');
const holdContext = holdCanvas.getContext('2d');

// グローバル変数の初期化を修正
let bag = [];
let board = null;
let piece = null;
let nextPieces = [];
let holdPiece = null;
let canHold = true;
let dropCounter = 0;
let lastTime = 0;
let score = 0;

function createBoard() {
    return Array(ROWS).fill().map(() => Array(COLS).fill(0));
}

function generateBag() {
    const pieces = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    return pieces.sort(() => Math.random() - 0.5);
}

// getRandomPiece関数を修正
function getRandomPiece() {
    if (bag.length === 0) {
        bag = generateBag();
    }
    const tetromino = bag.pop();
    return {
        pos: {x: Math.floor(COLS/2) - 1, y: 0},
        matrix: TETROMINOS[tetromino],
        color: COLORS[tetromino],
        type: tetromino
    };
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawPiece();
    drawNext();
    drawHold();
}

function drawBoard() {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                context.fillStyle = value;
                context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        });
    });
}

function drawPiece() {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                context.fillStyle = piece.color;
                context.fillRect(
                    (piece.pos.x + x) * BLOCK_SIZE,
                    (piece.pos.y + y) * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
            }
        });
    });
}

function drawNext() {
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    nextPieces.forEach((piece, index) => {
        drawPieceAt(nextContext, piece.matrix, piece.color, 
            {x: 1, y: index * 4 + 1}, 15);
    });
}

function drawHold() {
    holdContext.fillStyle = '#000';
    holdContext.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
    
    if (holdPiece) {
        drawPieceAt(holdContext, holdPiece.matrix, holdPiece.color, 
            {x: 1, y: 1}, 15);
    }
}

function drawPieceAt(ctx, matrix, color, pos, size) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = color;
                ctx.fillRect(
                    (pos.x + x) * size,
                    (pos.y + y) * size,
                    size - 1,
                    size - 1
                );
            }
        });
    });
}

function merge() {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[piece.pos.y + y][piece.pos.x + x] = piece.color;
            }
        });
    });
}

function collision() {
    const matrix = piece.matrix;
    const pos = piece.pos;
    
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] && (
                board[y + pos.y] === undefined ||
                board[y + pos.y][x + pos.x] === undefined ||
                board[y + pos.y][x + pos.x])) {
                return true;
            }
        }
    }
    return false;
}

function moveDown() {
    piece.pos.y++;
    if (collision()) {
        piece.pos.y--;
        merge();
        if (isGameOver()) {
            alert('Game Over! Score: ' + score);
            board = createBoard();
            score = 0;
            document.getElementById('score').textContent = score;
            nextPieces = [getRandomPiece(), getRandomPiece(), getRandomPiece()];
            holdPiece = null;
            piece = getNextPiece();
            return;
        }
        clearLines();
        piece = getNextPiece();
        canHold = true;
    }
}

function moveHorizontally(dir) {
    piece.pos.x += dir;
    if (collision()) {
        piece.pos.x -= dir;
    }
}

function rotate() {
    const matrix = piece.matrix;
    const newMatrix = matrix[0].map((_, i) => 
        matrix.map(row => row[i]).reverse()
    );
    const originalPos = piece.pos.x;
    
    piece.matrix = newMatrix;
    
    // 壁蹴り処理を追加
    let offset = 0;
    while (collision()) {
        piece.pos.x += offset;
        offset = -(offset + (offset >= 0 ? 1 : -1));
        if (Math.abs(offset) > 2) {
            piece.matrix = matrix;
            piece.pos.x = originalPos;
            return;
        }
    }
}

function clearLines() {
    outer: for (let y = board.length - 1; y >= 0; y--) {
        for (let x = 0; x < board[y].length; x++) {
            if (!board[y][x]) continue outer;
        }
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
        score += 100;
        document.getElementById('score').textContent = score;
    }
}

function getNextPiece() {
    const next = nextPieces.shift();
    nextPieces.push(getRandomPiece());
    return next;
}

function hold() {
    if (!canHold) return;
    
    if (holdPiece === null) {
        holdPiece = {
            matrix: piece.matrix,
            color: piece.color,
            type: piece.type  // type情報を追加
        };
        piece = getNextPiece();
    } else {
        const temp = {
            matrix: piece.matrix,
            color: piece.color,
            type: piece.type  // type情報を追加
        };
        piece = {
            pos: {x: 5, y: 0},
            matrix: holdPiece.matrix,
            color: holdPiece.color,
            type: holdPiece.type  // type情報を追加
        };
        holdPiece = temp;
    }
    
    canHold = false;
}

function isGameOver() {
    return board[0].some(cell => cell !== 0) || board[1].some(cell => cell !== 0);
}

// 初期化処理を修正
function initGame() {
    // ゲームの状態を初期化
    board = createBoard();
    bag = generateBag();
    
    // 次のピースを初期化
    nextPieces = [];
    for (let i = 0; i < 3; i++) {
        nextPieces.push(getRandomPiece());
    }
    
    // 現在のピースを初期化
    piece = getRandomPiece();
    
    // その他の状態をリセット
    score = 0;
    holdPiece = null;
    canHold = true;
    dropCounter = 0;
    lastTime = 0;
    
    // UIの更新
    document.getElementById('score').textContent = '0';
}

// モバイルコントロール用の関数を修正
function initMobileControls() {
    const controls = {
        'btn-left': () => moveHorizontally(-1),
        'btn-right': () => moveHorizontally(1),
        'btn-down': () => moveDown(),
        'btn-rotate': () => rotate(),
        'btn-hold': () => hold(),
        'btn-harddrop': () => hardDrop(),
    };

    Object.entries(controls).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('mousedown', handler);
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handler();
            });
        }
    });
}

// ハードドロップ機能を追加
function hardDrop() {
    while (!collision()) {
        piece.pos.y++;
    }
    piece.pos.y--;
    moveDown();
}

// イベントリスナーとゲーム開始処理を修正
window.addEventListener('load', () => {
    initGame();
    initMobileControls();
    
    // キーボードイベントの設定
    document.addEventListener('keydown', event => {
        switch (event.key) {
            case 'ArrowLeft':
                moveHorizontally(-1);
                break;
            case 'ArrowRight':
                moveHorizontally(1);
                break;
            case 'ArrowDown':
                moveDown();
                break;
            case 'ArrowUp':
                rotate();
                break;
            case 'c':
            case 'C':
                hold();
                break;
            case ' ': // スペースキー
                hardDrop();
                break;
        }
    });

    // ゲームループを開始
    lastTime = performance.now();
    requestAnimationFrame(update);
});

// メインのupdateループを修正
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    
    if (dropCounter > 1000) {
        moveDown();
        dropCounter = 0;
    }
    
    draw();
    requestAnimationFrame(update);
}
