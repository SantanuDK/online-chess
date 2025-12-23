// Chess Game Logic with Complete Rules
class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentTurn = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.isGameOver = false;
        this.winner = null;

        // Track piece movements for castling
        this.pieceHasMoved = {
            whiteKing: false,
            blackKing: false,
            whiteRookA: false,
            whiteRookH: false,
            blackRookA: false,
            blackRookH: false
        };

        // Track en passant opportunity
        this.enPassantTarget = null; // { row, col } of the square where en passant capture can occur
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

    isValidMove(fromRow, fromCol, toRow, toCol, checkForCheck = true) {
        const piece = this.board[fromRow][fromCol];
        if (!piece || piece.color !== this.currentTurn) return false;

        const targetPiece = this.board[toRow][toCol];
        if (targetPiece && targetPiece.color === piece.color) return false;

        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        const rowDir = toRow - fromRow;
        const colDir = toCol - fromCol;

        let isValid = false;

        switch (piece.type) {
            case 'pawn':
                isValid = this.isValidPawnMove(piece, fromRow, fromCol, toRow, toCol, rowDir, colDir, targetPiece);
                break;
            case 'rook':
                isValid = this.isValidRookMove(fromRow, fromCol, toRow, toCol, rowDiff, colDiff);
                break;
            case 'knight':
                isValid = (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
                break;
            case 'bishop':
                isValid = this.isValidBishopMove(fromRow, fromCol, toRow, toCol, rowDiff, colDiff);
                break;
            case 'queen':
                isValid = this.isValidQueenMove(fromRow, fromCol, toRow, toCol, rowDiff, colDiff);
                break;
            case 'king':
                isValid = this.isValidKingMove(piece, fromRow, fromCol, toRow, toCol, rowDiff, colDiff);
                break;
            default:
                isValid = false;
        }

        if (!isValid) return false;

        // Check if this move would leave the king in check
        if (checkForCheck && this.wouldLeaveKingInCheck(fromRow, fromCol, toRow, toCol)) {
            return false;
        }

        return true;
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

        // En passant capture
        if (Math.abs(colDir) === 1 && rowDir === direction && !targetPiece) {
            if (this.enPassantTarget &&
                this.enPassantTarget.row === toRow &&
                this.enPassantTarget.col === toCol) {
                return true;
            }
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

    isValidKingMove(piece, fromRow, fromCol, toRow, toCol, rowDiff, colDiff) {
        // Normal king move (one square in any direction)
        if (rowDiff <= 1 && colDiff <= 1) {
            return true;
        }

        // Castling
        if (rowDiff === 0 && colDiff === 2) {
            return this.canCastle(piece.color, fromRow, fromCol, toRow, toCol);
        }

        return false;
    }

    canCastle(color, fromRow, fromCol, toRow, toCol) {
        // Check if king has moved
        const kingKey = color === 'white' ? 'whiteKing' : 'blackKing';
        if (this.pieceHasMoved[kingKey]) return false;

        // Check if king is in check
        if (this.isKingInCheck(color)) return false;

        const isKingside = toCol > fromCol;
        const rookCol = isKingside ? 7 : 0;
        const rookKey = color === 'white'
            ? (isKingside ? 'whiteRookH' : 'whiteRookA')
            : (isKingside ? 'blackRookH' : 'blackRookA');

        // Check if rook has moved
        if (this.pieceHasMoved[rookKey]) return false;

        // Check if rook is still there
        const rook = this.board[fromRow][rookCol];
        if (!rook || rook.type !== 'rook' || rook.color !== color) return false;

        // Check if path is clear
        const step = isKingside ? 1 : -1;
        const endCol = isKingside ? 6 : 2;

        for (let col = fromCol + step; col !== rookCol; col += step) {
            if (this.board[fromRow][col]) return false;
        }

        // Check if king passes through or ends in check
        for (let col = fromCol; col !== endCol + step; col += step) {
            if (this.isSquareUnderAttack(fromRow, col, color)) {
                return false;
            }
        }

        return true;
    }

    isSquareUnderAttack(row, col, colorOfPieceOnSquare) {
        const opponentColor = colorOfPieceOnSquare === 'white' ? 'black' : 'white';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === opponentColor) {
                    // Check if this piece can attack the square (don't check for check recursively)
                    const savedTurn = this.currentTurn;
                    this.currentTurn = opponentColor;
                    const canAttack = this.isValidMove(r, c, row, col, false);
                    this.currentTurn = savedTurn;
                    if (canAttack) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    wouldLeaveKingInCheck(fromRow, fromCol, toRow, toCol) {
        // Make a temporary move
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        const wasEnPassant = piece.type === 'pawn' &&
            this.enPassantTarget &&
            this.enPassantTarget.row === toRow &&
            this.enPassantTarget.col === toCol;
        let capturedPawn = null;

        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Handle en passant capture
        if (wasEnPassant) {
            const capturedPawnRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            capturedPawn = this.board[capturedPawnRow][toCol];
            this.board[capturedPawnRow][toCol] = null;
        }

        // Check if king is in check
        const inCheck = this.isKingInCheck(piece.color);

        // Undo the move
        this.board[fromRow][fromCol] = piece;
        this.board[toRow][toCol] = capturedPiece;
        if (wasEnPassant) {
            const capturedPawnRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            this.board[capturedPawnRow][toCol] = capturedPawn;
        }

        return inCheck;
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

        // Check for en passant capture
        const isEnPassant = piece.type === 'pawn' &&
            this.enPassantTarget &&
            this.enPassantTarget.row === toRow &&
            this.enPassantTarget.col === toCol;

        // Check for castling
        const isCastling = piece.type === 'king' && Math.abs(toCol - fromCol) === 2;

        // Make the move
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Handle en passant capture
        if (isEnPassant) {
            const capturedPawnRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            this.board[capturedPawnRow][toCol] = null;
        }

        // Handle castling - move the rook
        if (isCastling) {
            const isKingside = toCol > fromCol;
            const rookFromCol = isKingside ? 7 : 0;
            const rookToCol = isKingside ? 5 : 3;
            const rook = this.board[fromRow][rookFromCol];
            this.board[fromRow][rookToCol] = rook;
            this.board[fromRow][rookFromCol] = null;
        }

        // Update en passant target
        if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
            const enPassantRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            this.enPassantTarget = { row: enPassantRow, col: toCol };
        } else {
            this.enPassantTarget = null;
        }

        // Track piece movements for castling
        if (piece.type === 'king') {
            this.pieceHasMoved[piece.color === 'white' ? 'whiteKing' : 'blackKing'] = true;
        } else if (piece.type === 'rook') {
            if (piece.color === 'white') {
                if (fromCol === 0) this.pieceHasMoved.whiteRookA = true;
                if (fromCol === 7) this.pieceHasMoved.whiteRookH = true;
            } else {
                if (fromCol === 0) this.pieceHasMoved.blackRookA = true;
                if (fromCol === 7) this.pieceHasMoved.blackRookH = true;
            }
        }

        // Pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.board[toRow][toCol] = { type: 'queen', color: piece.color };
        }

        // Record move
        const moveNotation = this.getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece, isCastling, isEnPassant);
        this.moveHistory.push(moveNotation);

        // Switch turn
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';

        // Check for game over
        this.checkGameOver();

        return true;
    }

    getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece, isCastling, isEnPassant) {
        const files = 'abcdefgh';
        const ranks = '87654321';

        if (isCastling) {
            return toCol > fromCol ? 'O-O' : 'O-O-O';
        }

        const pieceSymbol = piece.type === 'pawn' ? '' : this.getPieceSymbol(piece);
        const fromSquare = files[fromCol] + ranks[fromRow];
        const toSquare = files[toCol] + ranks[toRow];
        const capture = (capturedPiece || isEnPassant) ? 'x' : '-';

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

        return this.isSquareUnderAttack(kingRow, kingCol, color);
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
            inCheck: this.isKingInCheck(this.currentTurn),
            enPassantTarget: this.enPassantTarget,
            pieceHasMoved: { ...this.pieceHasMoved }
        };
    }

    loadGameState(state) {
        this.board = state.board;
        this.currentTurn = state.currentTurn;
        this.moveHistory = state.moveHistory;
        this.isGameOver = state.isGameOver;
        this.winner = state.winner;
        this.enPassantTarget = state.enPassantTarget;
        this.pieceHasMoved = { ...state.pieceHasMoved };
    }

    reset() {
        this.board = this.initializeBoard();
        this.currentTurn = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.isGameOver = false;
        this.winner = null;
        this.enPassantTarget = null;
        this.pieceHasMoved = {
            whiteKing: false,
            blackKing: false,
            whiteRookA: false,
            whiteRookH: false,
            blackRookA: false,
            blackRookH: false
        };
    }
}
