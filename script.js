document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    const turnInfo = document.getElementById('turn-info');
    const messageArea = document.getElementById('message-area');
    const newGameBtn = document.getElementById('new-game-btn');

    let board = []; // 2D array to represent the board: board[row][col]
    let currentPlayer = 'white'; // or 'black'
    let selectedPiece = null; // Now stores { code: 'wP', row: r, col: c }
    let gameActive = true;

    const initialBoardSetup = [
        ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'], // Black pieces
        ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'], // Black pawns
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'], // White pawns
        ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']  // White pieces
    ];

    // --- Initialize Board Data ---
    function initializeBoardData() {
        board = JSON.parse(JSON.stringify(initialBoardSetup)); // Deep copy
        currentPlayer = 'white';
        selectedPiece = null;
        gameActive = true;
        updateTurnInfo();
        messageArea.textContent = '';
    }

    // --- Render Board UI ---
    function renderBoard() {
        chessboard.innerHTML = ''; // Clear previous board
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = r;
                square.dataset.col = c;

                // Highlight selected piece's square
                if (selectedPiece && selectedPiece.row === r && selectedPiece.col === c) {
                    square.classList.add('selected-square'); // Add this class
                }

                const pieceCode = board[r][c];
                if (pieceCode) {
                    const pieceElement = document.createElement('span');
                    pieceElement.classList.add('piece');
                    pieceElement.textContent = getPieceSymbol(pieceCode);
                    pieceElement.style.color = pieceCode.startsWith('w') ? '#f0f0f0' : '#333'; // Adjusted white piece color for visibility on dark squares
                    square.appendChild(pieceElement);
                }
                square.addEventListener('click', () => onSquareClick(r, c));
                chessboard.appendChild(square);
            }
        }
    }

    // --- Piece Symbols ---
    function getPieceSymbol(pieceCode) {
        if (!pieceCode) return '';
        const type = pieceCode.substring(1); // P, R, N, B, Q, K
        // Simple Unicode characters for pieces
        switch (type) {
            case 'P': return pieceCode.startsWith('w') ? '♙' : '♟';
            case 'R': return pieceCode.startsWith('w') ? '♖' : '♜';
            case 'N': return pieceCode.startsWith('w') ? '♘' : '♞';
            case 'B': return pieceCode.startsWith('w') ? '♗' : '♝';
            case 'Q': return pieceCode.startsWith('w') ? '♕' : '♛';
            case 'K': return pieceCode.startsWith('w') ? '♔' : '♚';
            default: return '';
        }
    }

    // --- Game Logic ---
// Modify onSquareClick and related functions
function onSquareClick(row, col) {
    if (!gameActive) {
        messageArea.textContent = "Game over. Please start a new game.";
        return;
    }

    const clickedPieceCode = board[row][col];

    if (selectedPiece) {
        if (selectedPiece.row === row && selectedPiece.col === col) {
            selectedPiece = null;
            messageArea.textContent = '';
            renderBoard();
            return;
        }

        if (isValidMove(selectedPiece.code, selectedPiece.row, selectedPiece.col, row, col)) {
            const originalBoardState = JSON.parse(JSON.stringify(board)); // For reverting if self-check
            const pieceToMove = selectedPiece.code;
            const fromRow = selectedPiece.row;
            const fromCol = selectedPiece.col;

            // Simulate the move on the main board
            board[row][col] = pieceToMove;
            board[fromRow][fromCol] = '';

            const playerMakingTheMove = currentPlayer;

            // Check if this move puts THE MOVING PLAYER'S king in check
            if (isKingInCheck(playerMakingTheMove)) {
                board = originalBoardState; // Revert move
                messageArea.textContent = 'Invalid move: Your king would be in check.';
                // selectedPiece remains, allowing the player to try a different move
            } else {
                // Move is legal
                selectedPiece = null; // Deselect piece
                switchPlayer(); // currentPlayer is now the other player

                // Check game status for the new current player
                const legalMoves = getAllLegalMoves(currentPlayer);
                const kingInCheckStatus = isKingInCheck(currentPlayer);

                if (kingInCheckStatus && legalMoves.length === 0) {
                    messageArea.textContent = `Checkmate! ${playerMakingTheMove} wins.`;
                    gameActive = false;
                } else if (!kingInCheckStatus && legalMoves.length === 0) {
                    messageArea.textContent = "Stalemate! It's a draw.";
                    gameActive = false;
                } else if (kingInCheckStatus) {
                    messageArea.textContent = 'Check!';
                } else {
                    messageArea.textContent = ''; // Clear previous messages like 'Check!'
                }
            }
        } else {
            // Invalid move or trying to select another of the current player's pieces
            const targetPieceOwner = clickedPieceCode ? clickedPieceCode.charAt(0) : null;
            const selectedPieceOwner = selectedPiece.code.charAt(0);

            if (clickedPieceCode && targetPieceOwner === selectedPieceOwner) {
                // Clicked another of the current player's pieces - switch selection
                selectedPiece = { code: clickedPieceCode, row: row, col: col };
                messageArea.textContent = `Selected ${getPieceSymbol(clickedPieceCode)}. Click a destination square.`;
            } else {
                // Invalid move
                messageArea.textContent = 'Invalid move.';
                selectedPiece = null; // Deselect on invalid move attempt
            }
        }
    } else if (clickedPieceCode) {
        // No piece selected, try to select one
        const pieceOwner = clickedPieceCode.charAt(0); // 'w' or 'b'
        if ((currentPlayer === 'white' && pieceOwner === 'w') || (currentPlayer === 'black' && pieceOwner === 'b')) {
            selectedPiece = { code: clickedPieceCode, row: row, col: col };
            messageArea.textContent = `Selected ${getPieceSymbol(clickedPieceCode)}. Click a destination square.`;
        } else {
            messageArea.textContent = "Cannot select opponent's piece.";
        }
    }
    renderBoard(); // Re-render the board after any action
}

// isValidMove and individual piece move functions (Pawn, Rook, Knight, Bishop, Queen, King) remain the same for now
// ... (isValidMove, isValidPawnMove, isValidRookMove, etc. as they are) ...
function isValidMove(pieceCode, startRow, startCol, endRow, endCol) {
        const pieceType = pieceCode.substring(1); // P, R, N, B, Q, K
        const pieceColor = pieceCode.charAt(0); // 'w' or 'b'

        // Target square cannot be outside the board (redundant if UI prevents but good for logic)
        if (endRow < 0 || endRow > 7 || endCol < 0 || endCol > 7) {
            return false;
        }

        // Cannot move to a square occupied by your own piece
        const targetPieceCode = board[endRow][endCol];
        if (targetPieceCode) {
            const targetPieceColor = targetPieceCode.charAt(0);
            if (targetPieceColor === pieceColor) {
                return false;
            }
        }

        switch (pieceType) {
            case 'P':
                return isValidPawnMove(pieceColor, startRow, startCol, endRow, endCol);
            case 'R':
                return isValidRookMove(pieceColor, startRow, startCol, endRow, endCol); // New
            case 'N':
                return isValidKnightMove(pieceColor, startRow, startCol, endRow, endCol);
            case 'B':
                return isValidBishopMove(pieceColor, startRow, startCol, endRow, endCol); // New
            case 'Q':
                return isValidQueenMove(pieceColor, startRow, startCol, endRow, endCol);
            case 'K':
                return isValidKingMove(pieceColor, startRow, startCol, endRow, endCol); // New
            default:
                return false;
        }
    }

    // (isValidPawnMove, isValidRookMove, isValidKnightMove, isValidBishopMove, isValidQueenMove functions should remain)

    function isValidPawnMove(color, startRow, startCol, endRow, endCol) {
        const direction = (color === 'w') ? -1 : 1; // White moves up (row index decreases), Black moves down
        const oneStep = startRow + direction;
        const twoSteps = startRow + 2 * direction;

        // 1. Standard one-step forward move
        if (endRow === oneStep && endCol === startCol && board[endRow][endCol] === '') {
            return true;
        }

        // 2. Initial two-step forward move
        const initialRow = (color === 'w') ? 6 : 1;
        if (startRow === initialRow && endRow === twoSteps && endCol === startCol &&
            board[oneStep][endCol] === '' && board[endRow][endCol] === '') {
            return true;
        }

        // 3. Capture move (diagonal)
        if (endRow === oneStep && Math.abs(endCol - startCol) === 1) {
            const targetPieceCode = board[endRow][endCol];
            if (targetPieceCode && targetPieceCode.charAt(0) !== color) {
                return true; // Capture an opponent's piece
            }
            // En passant will be handled here later
        }

        return false;
    }

    function isValidRookMove(color, startRow, startCol, endRow, endCol) {
        // Must move horizontally or vertically
        if (startRow !== endRow && startCol !== endCol) {
            return false;
        }

        // Check for obstructions
        if (startRow === endRow) { // Horizontal move
            const step = (endCol > startCol) ? 1 : -1;
            for (let c = startCol + step; c !== endCol; c += step) {
                if (board[startRow][c] !== '') {
                    return false; // Obstruction
                }
            }
        } else { // Vertical move
            const step = (endRow > startRow) ? 1 : -1;
            for (let r = startRow + step; r !== endRow; r += step) {
                if (board[r][startCol] !== '') {
                    return false; // Obstruction
                }
            }
        }
        return true;
    }

    function isValidKnightMove(color, startRow, startCol, endRow, endCol) {
        const rowDiff = Math.abs(endRow - startRow);
        const colDiff = Math.abs(endCol - startCol);

        // Knight moves in an L-shape: 2 squares in one direction, 1 in the other
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
        // Knights can jump, so no obstruction check needed for the path itself.
        // The check for landing on own piece is already in isValidMove.
    }

    function isValidBishopMove(color, startRow, startCol, endRow, endCol) {
        // Must move diagonally
        if (Math.abs(endRow - startRow) !== Math.abs(endCol - startCol)) {
            return false;
        }

        // Check for obstructions
        const rowStep = (endRow > startRow) ? 1 : -1;
        const colStep = (endCol > startCol) ? 1 : -1;
        let r = startRow + rowStep;
        let c = startCol + colStep;
        while (r !== endRow) { // Path leading up to the end square
            if (board[r][c] !== '') {
                return false; // Obstruction
            }
            r += rowStep;
            c += colStep;
        }
        return true;
    }

    function isValidQueenMove(color, startRow, startCol, endRow, endCol) {
        // Queen moves like a rook or a bishop
        // Check if it's a valid rook move (horizontal/vertical) OR a valid bishop move (diagonal)
        // We can reuse the logic, but need to be careful about how they are structured.
        // For simplicity here, we'll check conditions directly.

        const rowDiff = Math.abs(endRow - startRow);
        const colDiff = Math.abs(endCol - startCol);

        if (startRow === endRow || startCol === endCol) { // Horizontal or Vertical (like a Rook)
            return isValidRookMove(color, startRow, startCol, endRow, endCol);
        } else if (rowDiff === colDiff) { // Diagonal (like a Bishop)
            return isValidBishopMove(color, startRow, startCol, endRow, endCol);
        }

        return false; // Not a valid queen move
    }

    function isValidKingMove(color, startRow, startCol, endRow, endCol) {
        const rowDiff = Math.abs(endRow - startRow);
        const colDiff = Math.abs(endCol - startCol);

        // King moves one square in any direction
        if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0)) { // (rowDiff + colDiff > 0) ensures it actually moved
            // Basic move is valid.
            // Later, add check: !isSquareUnderAttack(endRow, endCol, opponentColor)
            return true;
        }

        // Castling will be handled here later as a special type of king move.

        return false;
    }

    // --- Turn Management ---

    // NEW FUNCTIONS FOR CHECK DETECTION:

    function findKing(kingColor) {
        const kingPieceCode = kingColor.charAt(0) + 'K';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === kingPieceCode) {
                    return { row: r, col: c };
                }
            }
        }
        return null; // Should not happen in a normal game
    }

    function isKingInCheck(kingColor) {
        const kingPos = findKing(kingColor);
        if (!kingPos) return false; // King not found (shouldn't occur)

        const attackerColor = (kingColor === 'white') ? 'black' : 'white';
        return isSquareUnderAttack(kingPos.row, kingPos.col, attackerColor);
    }

    function isSquareUnderAttack(targetRow, targetCol, attackerColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const pieceCode = board[r][c];
                if (pieceCode && pieceCode.charAt(0) === attackerColor) {
                    // Check if this piece can attack the target square
                    // This needs to use the specific attack patterns, not just isValidMove,
                    // because isValidMove also checks if the target is occupied by an ally.
                    // For attack check, we only care if the piece *could* move there if it were empty or enemy.

                    const pieceType = pieceCode.substring(1);
                    // const pieceColor = pieceCode.charAt(0); // Already attackerColor

                    // Temporarily clear the target square for obstruction checking by sliding pieces,
                    // unless the attacking piece is a knight (which jumps) or a king (which only cares about immediate adjacency).
                    // This is a simplification; a more robust way is for isValid[Piece]Move to have a flag.
                    // For now, isValidMove itself checks for not landing on own piece, which is fine.

                    // Special handling for pawn attacks (diagonal)
                    if (pieceType === 'P') {
                        const direction = (attackerColor === 'w') ? -1 : 1;
                        if (r + direction === targetRow && Math.abs(c - targetCol) === 1) {
                            return true; // Pawn attacks diagonally
                        }
                    } else {
                        // For other pieces, use their existing isValidMove logic.
                        // isValidMove already checks if the target is not one of its own pieces.
                        // If the target square *is* the king we're checking, that's an attack.
                        if (isValidMove(pieceCode, r, c, targetRow, targetCol)) {
                             // We need to ensure that isValidMove doesn't get confused by the king being on the target square.
                             // The existing isValidMove should be fine:
                             // - it checks target is not same color (king is different color from attacker)
                             // - it checks path is clear (for sliders)
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    // NEW FUNCTIONS FOR CHECKMATE/STALEMATE:

    function generatePossibleMovesForPiece(pieceCode, startRow, startCol) {
        const moves = [];
        for (let endRow = 0; endRow < 8; endRow++) {
            for (let endCol = 0; endCol < 8; endCol++) {
                // Check basic validity; self-check is handled by getAllLegalMoves
                if (isValidMove(pieceCode, startRow, startCol, endRow, endCol)) {
                    moves.push({
                        from: { row: startRow, col: startCol },
                        to: { row: endRow, col: endCol },
                        pieceCode: pieceCode // Include pieceCode for simulation
                    });
                }
            }
        }
        return moves;
    }

    function getAllLegalMoves(playerColor) {
        const legalMoves = [];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const pieceCode = board[r][c];
                if (pieceCode && pieceCode.charAt(0) === playerColor.charAt(0)) {
                    const pseudoLegalMoves = generatePossibleMovesForPiece(pieceCode, r, c);

                    for (const move of pseudoLegalMoves) {
                        const originalPieceAtTarget = board[move.to.row][move.to.col];
                        // const originalPieceAtSource = board[move.from.row][move.from.col]; // This is move.pieceCode

                        board[move.to.row][move.to.col] = move.pieceCode;
                        board[move.from.row][move.from.col] = '';

                        if (!isKingInCheck(playerColor)) {
                            legalMoves.push(move);
                        }

                        board[move.from.row][move.from.col] = move.pieceCode; // Revert source
                        board[move.to.row][move.to.col] = originalPieceAtTarget; // Revert target
                    }
                }
            }
        }
        return legalMoves;
    }

    function switchPlayer() {
        currentPlayer = (currentPlayer === 'white') ? 'black' : 'white';
        updateTurnInfo();
    }

    function updateTurnInfo() {
        turnInfo.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`;
    }

    // --- Event Listeners ---
    newGameBtn.addEventListener('click', () => {
        initializeBoardData();
        renderBoard();
    });

    // --- Initial Game Setup ---
    initializeBoardData();
    renderBoard();
});
