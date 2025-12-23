// Chess Game Logic
class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentTurn = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.isGameOver = false;
        this.winner = null;
    }

    initializeBoard() {
        // Initialize 8x8 board with pieces
        const board = Array(8).fill(null).map(() => Array(8).fill(null));

        // Piece representation: { type: 'pawn'|'rook'|'knight'|'bishop'|'queen'|'king', color: 'white'|'black' }
        const pieceOrder = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

        // Set up black pieces
        for (let i = 0; i < 8; i++) {
            board[0][i] = { type: pieceOrder[i], color: 'black' };
            board[1][i] = { type: 'pawn', color: 'black' };
        }

        // Set up white pieces
        for (let i = 0; i < 8; i++) {
            board[6][i] = { type: 'pawn', color: 'white' };
            board[7][i] = { type: pieceOrder[i], color: 'white' };
        }

        return board;
    }

    getPieceSymbol(piece) {
        if (!piece) return '';

        const symbols = {
            white: {
                king: '♔',
                queen: '♕',
                rook: '♖',
                bishop: '♗',
                knight: '♘',
                pawn: '♙'
            },
            black: {
                king: '♚',
                queen: '♛',
                rook: '♜',
                bishop: '♝',
                knight: '♞',
                pawn: '♟'
            }
        };

        return symbols[piece.color][piece.type];
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece || piece.color !== this.currentTurn) return false;

        const targetPiece = this.board[toRow][toCol];
        if (targetPiece && targetPiece.color === piece.color) return false;

        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        const rowDir = toRow - fromRow;
        const colDir = toCol - fromCol;

        switch (piece.type) {
            case 'pawn':
                return this.isValidPawnMove(piece, fromRow, fromCol, toRow, toCol, rowDir, colDir, targetPiece);
            case 'rook':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol, rowDiff, colDiff);
            case 'knight':
                return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
            case 'bishop':
                return this.isValidBishopMove(fromRow, fromCol, toRow, toCol, rowDiff, colDiff);
            case 'queen':
                return this.isValidQueenMove(fromRow, fromCol, toRow, toCol, rowDiff, colDiff);
            case 'king':
                return rowDiff <= 1 && colDiff <= 1;
            default:
                return false;
        }
    }

    isValidPawnMove(piece, fromRow, fromCol, toRow, toCol, rowDir, colDir, targetPiece) {
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;

        // Move forward one square
        if (colDir === 0 && rowDir === direction && !targetPiece) {
            return true;
        }

        // Move forward two squares from starting position
        if (colDir === 0 && rowDir === 2 * direction && fromRow === startRow && !targetPiece) {
            const middleRow = fromRow + direction;
            if (!this.board[middleRow][fromCol]) {
                return true;
            }
        }

        // Capture diagonally
        if (Math.abs(colDir) === 1 && rowDir === direction && targetPiece) {
            return true;
        }

        return false;
    }

    isValidRookMove(fromRow, fromCol, toRow, toCol, rowDiff, colDiff) {
        if (rowDiff !== 0 && colDiff !== 0) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }

    isValidBishopMove(fromRow, fromCol, toRow, toCol, rowDiff, colDiff) {
        if (rowDiff !== colDiff) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }

    isValidQueenMove(fromRow, fromCol, toRow, toCol, rowDiff, colDiff) {
        if (rowDiff !== 0 && colDiff !== 0 && rowDiff !== colDiff) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }

    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
        const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;

        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.board[currentRow][currentCol]) {
                return false;
            }
            currentRow += rowStep;
            currentCol += colStep;
        }

        return true;
    }

    getValidMoves(row, col) {
        const validMoves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.isValidMove(row, col, r, c)) {
                    validMoves.push({ row: r, col: c });
                }
            }
        }
        return validMoves;
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        if (!this.isValidMove(fromRow, fromCol, toRow, toCol)) {
            return false;
        }

        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];

        // Make the move
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.board[toRow][toCol] = { type: 'queen', color: piece.color };
        }

        // Record move
        const moveNotation = this.getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece);
        this.moveHistory.push(moveNotation);

        // Switch turn
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';

        // Check for game over
        this.checkGameOver();

        return true;
    }

    getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece) {
        const files = 'abcdefgh';
        const ranks = '87654321';

        const pieceSymbol = piece.type === 'pawn' ? '' : this.getPieceSymbol(piece);
        const fromSquare = files[fromCol] + ranks[fromRow];
        const toSquare = files[toCol] + ranks[toRow];
        const capture = capturedPiece ? 'x' : '-';

        return `${pieceSymbol}${fromSquare}${capture}${toSquare}`;
    }

    isKingInCheck(color) {
        // Find king position
        let kingRow, kingCol;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.type === 'king' && piece.color === color) {
                    kingRow = r;
                    kingCol = c;
                    break;
                }
            }
        }

        // Check if any opponent piece can capture the king
        const opponentColor = color === 'white' ? 'black' : 'white';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === opponentColor) {
                    if (this.isValidMove(r, c, kingRow, kingCol)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    hasValidMoves(color) {
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.board[fromRow][fromCol];
                if (piece && piece.color === color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    checkGameOver() {
        const inCheck = this.isKingInCheck(this.currentTurn);
        const hasValidMoves = this.hasValidMoves(this.currentTurn);

        if (!hasValidMoves) {
            this.isGameOver = true;
            if (inCheck) {
                // Checkmate
                this.winner = this.currentTurn === 'white' ? 'black' : 'white';
            } else {
                // Stalemate
                this.winner = 'draw';
            }
        }
    }

    getGameState() {
        return {
            board: this.board,
            currentTurn: this.currentTurn,
            moveHistory: this.moveHistory,
            isGameOver: this.isGameOver,
            winner: this.winner,
            inCheck: this.isKingInCheck(this.currentTurn)
        };
    }

    loadGameState(state) {
        this.board = state.board;
        this.currentTurn = state.currentTurn;
        this.moveHistory = state.moveHistory;
        this.isGameOver = state.isGameOver;
        this.winner = state.winner;
    }

    reset() {
        this.board = this.initializeBoard();
        this.currentTurn = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.isGameOver = false;
        this.winner = null;
    }
}
