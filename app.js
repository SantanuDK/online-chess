// Main Application Controller
class ChessApp {
    constructor() {
        this.game = new ChessGame();
        this.connection = new WebRTCConnection();
        this.playerColor = null;
        this.selectedSquare = null;
        this.validMoves = [];

        this.initializeUI();
        this.setupEventListeners();
        this.setupConnectionHandlers();
        this.renderBoard();
    }

    initializeUI() {
        // Get DOM elements
        this.elements = {
            // Connection panel
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            connectionOptions: document.getElementById('connectionOptions'),
            createRoomBtn: document.getElementById('createRoomBtn'),
            joinRoomBtn: document.getElementById('joinRoomBtn'),

            // Create flow
            createFlow: document.getElementById('createFlow'),
            createStep: document.getElementById('createStep'),
            createStep1: document.getElementById('createStep1'),
            createStep2: document.getElementById('createStep2'),
            offerCode: document.getElementById('offerCode'),
            copyOfferBtn: document.getElementById('copyOfferBtn'),
            nextToStep2Btn: document.getElementById('nextToStep2Btn'),
            answerCodeInput: document.getElementById('answerCodeInput'),
            submitAnswerBtn: document.getElementById('submitAnswerBtn'),
            backToStep1Btn: document.getElementById('backToStep1Btn'),

            // Join flow
            joinFlow: document.getElementById('joinFlow'),
            joinStep: document.getElementById('joinStep'),
            joinStep1: document.getElementById('joinStep1'),
            joinStep2: document.getElementById('joinStep2'),
            offerCodeInput: document.getElementById('offerCodeInput'),
            submitOfferBtn: document.getElementById('submitOfferBtn'),
            answerCode: document.getElementById('answerCode'),
            copyAnswerBtn: document.getElementById('copyAnswerBtn'),
            cancelJoinBtn: document.getElementById('cancelJoinBtn'),

            resetConnectionBtn: document.getElementById('resetConnectionBtn'),

            // Game panel
            chessBoard: document.getElementById('chessBoard'),
            whitePlayerName: document.getElementById('whitePlayerName'),
            blackPlayerName: document.getElementById('blackPlayerName'),
            turnIndicator: document.getElementById('turnIndicator'),
            turnText: document.getElementById('turnText'),
            gameStatus: document.getElementById('gameStatus'),
            newGameBtn: document.getElementById('newGameBtn'),
            resignBtn: document.getElementById('resignBtn'),
            moveList: document.getElementById('moveList')
        };
    }

    setupEventListeners() {
        // Connection buttons
        this.elements.createRoomBtn.addEventListener('click', () => this.handleCreateRoom());
        this.elements.joinRoomBtn.addEventListener('click', () => this.handleJoinRoom());

        // Create flow
        this.elements.copyOfferBtn.addEventListener('click', () => this.copyToClipboard(this.elements.offerCode.value, 'Offer code copied!'));
        this.elements.nextToStep2Btn.addEventListener('click', () => this.showCreateStep2());
        this.elements.submitAnswerBtn.addEventListener('click', () => this.handleSubmitAnswer());
        this.elements.backToStep1Btn.addEventListener('click', () => this.showCreateStep1());

        // Join flow
        this.elements.submitOfferBtn.addEventListener('click', () => this.handleSubmitOffer());
        this.elements.copyAnswerBtn.addEventListener('click', () => this.copyToClipboard(this.elements.answerCode.value, 'Answer code copied!'));
        this.elements.cancelJoinBtn.addEventListener('click', () => this.resetConnection());

        this.elements.resetConnectionBtn.addEventListener('click', () => this.resetConnection());

        // Game controls
        this.elements.newGameBtn.addEventListener('click', () => this.handleNewGame());
        this.elements.resignBtn.addEventListener('click', () => this.handleResign());
    }

    setupConnectionHandlers() {
        this.connection.onMessage((data) => {
            this.handleRemoteMessage(data);
        });

        this.connection.onConnectionStateChange((state) => {
            this.updateConnectionStatus(state);
        });
    }

    async handleCreateRoom() {
        this.updateConnectionStatus('connecting');
        this.elements.connectionOptions.classList.add('hidden');
        this.elements.createFlow.classList.remove('hidden');

        try {
            const offerCode = await this.connection.createOffer();
            this.elements.offerCode.value = offerCode;
            this.playerColor = 'white';
            this.updatePlayerNames();
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
            this.resetConnection();
        }
    }

    handleJoinRoom() {
        this.elements.connectionOptions.classList.add('hidden');
        this.elements.joinFlow.classList.remove('hidden');
    }

    showCreateStep2() {
        this.elements.createStep1.classList.add('hidden');
        this.elements.createStep2.classList.remove('hidden');
        this.elements.createStep.textContent = '2';
    }

    showCreateStep1() {
        this.elements.createStep2.classList.add('hidden');
        this.elements.createStep1.classList.remove('hidden');
        this.elements.createStep.textContent = '1';
    }

    async handleSubmitAnswer() {
        const answerCode = this.elements.answerCodeInput.value.trim();
        if (!answerCode) {
            alert('Please paste the answer code');
            return;
        }

        try {
            await this.connection.processAnswer(answerCode);
            this.elements.createFlow.classList.add('hidden');
            this.elements.resetConnectionBtn.classList.remove('hidden');
            this.updateConnectionStatus('connecting');
        } catch (error) {
            console.error('Error processing answer:', error);
            alert('Invalid answer code. Please check and try again.');
        }
    }

    async handleSubmitOffer() {
        const offerCode = this.elements.offerCodeInput.value.trim();
        if (!offerCode) {
            alert('Please paste the offer code');
            return;
        }

        this.updateConnectionStatus('connecting');

        try {
            const answerCode = await this.connection.createAnswer(offerCode);
            this.elements.answerCode.value = answerCode;
            this.elements.joinStep1.classList.add('hidden');
            this.elements.joinStep2.classList.remove('hidden');
            this.elements.joinStep.textContent = '2';
            this.playerColor = 'black';
            this.updatePlayerNames();
        } catch (error) {
            console.error('Error creating answer:', error);
            alert('Invalid offer code. Please check and try again.');
            this.updateConnectionStatus('disconnected');
        }
    }

    resetConnection() {
        this.connection.close();
        this.connection = new WebRTCConnection();
        this.setupConnectionHandlers();

        this.elements.connectionOptions.classList.remove('hidden');
        this.elements.createFlow.classList.add('hidden');
        this.elements.joinFlow.classList.add('hidden');
        this.elements.resetConnectionBtn.classList.add('hidden');

        this.elements.createStep1.classList.remove('hidden');
        this.elements.createStep2.classList.add('hidden');
        this.elements.joinStep1.classList.remove('hidden');
        this.elements.joinStep2.classList.add('hidden');

        this.elements.offerCode.value = '';
        this.elements.answerCodeInput.value = '';
        this.elements.offerCodeInput.value = '';
        this.elements.answerCode.value = '';

        this.elements.createStep.textContent = '1';
        this.elements.joinStep.textContent = '1';

        this.updateConnectionStatus('disconnected');
        this.playerColor = null;
        this.updatePlayerNames();
    }

    updateConnectionStatus(status) {
        this.elements.statusIndicator.className = 'status-indicator';

        switch (status) {
            case 'connected':
                this.elements.statusIndicator.classList.add('connected');
                this.elements.statusText.textContent = 'Connected';
                this.elements.newGameBtn.disabled = false;
                this.elements.resignBtn.disabled = false;
                break;
            case 'connecting':
                this.elements.statusIndicator.classList.add('connecting');
                this.elements.statusText.textContent = 'Connecting...';
                break;
            case 'disconnected':
            case 'error':
                this.elements.statusText.textContent = 'Not Connected';
                this.elements.newGameBtn.disabled = true;
                this.elements.resignBtn.disabled = true;
                break;
        }
    }

    updatePlayerNames() {
        if (this.playerColor === 'white') {
            this.elements.whitePlayerName.textContent = 'You';
            this.elements.blackPlayerName.textContent = 'Opponent';
        } else if (this.playerColor === 'black') {
            this.elements.whitePlayerName.textContent = 'Opponent';
            this.elements.blackPlayerName.textContent = 'You';
        } else {
            this.elements.whitePlayerName.textContent = 'White';
            this.elements.blackPlayerName.textContent = 'Black';
        }
    }

    copyToClipboard(text, message) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = event.target.textContent;
            event.target.textContent = '✓ Copied!';
            setTimeout(() => {
                event.target.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
        });
    }

    renderBoard() {
        this.elements.chessBoard.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square';
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = this.game.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'piece';
                    pieceElement.textContent = this.game.getPieceSymbol(piece);
                    square.appendChild(pieceElement);
                }

                square.addEventListener('click', () => this.handleSquareClick(row, col));

                this.elements.chessBoard.appendChild(square);
            }
        }

        this.updateGameStatus();
        this.updateMoveHistory();
    }

    handleSquareClick(row, col) {
        // Only allow moves if it's the player's turn and game is not over
        if (this.game.isGameOver) return;
        if (this.playerColor && this.game.currentTurn !== this.playerColor) return;

        const piece = this.game.board[row][col];

        // If a square is already selected
        if (this.selectedSquare !== null) {
            const [selectedRow, selectedCol] = this.selectedSquare;

            // Try to make a move
            if (this.game.makeMove(selectedRow, selectedCol, row, col)) {
                this.selectedSquare = null;
                this.validMoves = [];
                this.renderBoard();

                // Send move to opponent
                this.sendMove(selectedRow, selectedCol, row, col);
            } else if (piece && piece.color === this.game.currentTurn) {
                // Select a different piece
                this.selectedSquare = [row, col];
                this.validMoves = this.game.getValidMoves(row, col);
                this.highlightSquares();
            } else {
                // Deselect
                this.selectedSquare = null;
                this.validMoves = [];
                this.highlightSquares();
            }
        } else {
            // Select a piece
            if (piece && piece.color === this.game.currentTurn) {
                this.selectedSquare = [row, col];
                this.validMoves = this.game.getValidMoves(row, col);
                this.highlightSquares();
            }
        }
    }

    highlightSquares() {
        const squares = this.elements.chessBoard.querySelectorAll('.square');
        squares.forEach(square => {
            square.classList.remove('selected', 'valid-move', 'has-piece');
        });

        if (this.selectedSquare) {
            const [row, col] = this.selectedSquare;
            const selectedSquare = this.elements.chessBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            selectedSquare.classList.add('selected');

            this.validMoves.forEach(move => {
                const validSquare = this.elements.chessBoard.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
                validSquare.classList.add('valid-move');
                if (this.game.board[move.row][move.col]) {
                    validSquare.classList.add('has-piece');
                }
            });
        }
    }

    updateGameStatus() {
        const state = this.game.getGameState();
        this.elements.gameStatus.className = 'game-status';

        if (state.isGameOver) {
            if (state.winner === 'draw') {
                this.elements.gameStatus.textContent = 'Stalemate - Draw!';
                this.elements.gameStatus.classList.add('stalemate');
            } else {
                this.elements.gameStatus.textContent = `Checkmate! ${state.winner.charAt(0).toUpperCase() + state.winner.slice(1)} wins!`;
                this.elements.gameStatus.classList.add('checkmate');
            }
        } else if (state.inCheck) {
            this.elements.gameStatus.textContent = `${state.currentTurn.charAt(0).toUpperCase() + state.currentTurn.slice(1)} is in check!`;
            this.elements.gameStatus.classList.add('check');
        } else {
            this.elements.gameStatus.textContent = '';
        }

        this.elements.turnText.textContent = `${state.currentTurn.charAt(0).toUpperCase() + state.currentTurn.slice(1)}'s Turn`;
    }

    updateMoveHistory() {
        this.elements.moveList.innerHTML = '';
        this.game.moveHistory.forEach((move, index) => {
            const moveItem = document.createElement('div');
            moveItem.className = 'move-item';
            moveItem.textContent = `${index + 1}. ${move}`;
            this.elements.moveList.appendChild(moveItem);
        });

        // Scroll to bottom
        this.elements.moveList.scrollTop = this.elements.moveList.scrollHeight;
    }

    sendMove(fromRow, fromCol, toRow, toCol) {
        if (this.connection.isConnected()) {
            this.connection.sendMessage({
                type: 'move',
                from: { row: fromRow, col: fromCol },
                to: { row: toRow, col: toCol }
            });
        }
    }

    handleRemoteMessage(data) {
        switch (data.type) {
            case 'move':
                this.handleRemoteMove(data.from, data.to);
                break;
            case 'newGame':
                this.handleRemoteNewGame();
                break;
            case 'resign':
                this.handleRemoteResign();
                break;
        }
    }

    handleRemoteMove(from, to) {
        if (this.game.makeMove(from.row, from.col, to.row, to.col)) {
            this.renderBoard();
        }
    }

    handleNewGame() {
        if (confirm('Start a new game?')) {
            this.game.reset();
            this.selectedSquare = null;
            this.validMoves = [];
            this.renderBoard();

            if (this.connection.isConnected()) {
                this.connection.sendMessage({ type: 'newGame' });
            }
        }
    }

    handleRemoteNewGame() {
        if (confirm('Opponent wants to start a new game. Accept?')) {
            this.game.reset();
            this.selectedSquare = null;
            this.validMoves = [];
            this.renderBoard();
        }
    }

    handleResign() {
        if (confirm('Are you sure you want to resign?')) {
            const winner = this.playerColor === 'white' ? 'black' : 'white';
            this.game.isGameOver = true;
            this.game.winner = winner;
            this.renderBoard();

            if (this.connection.isConnected()) {
                this.connection.sendMessage({ type: 'resign' });
            }
        }
    }

    handleRemoteResign() {
        alert('Opponent has resigned. You win!');
        const winner = this.playerColor;
        this.game.isGameOver = true;
        this.game.winner = winner;
        this.renderBoard();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChessApp();
});
