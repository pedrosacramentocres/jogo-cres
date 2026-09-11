const cells = Array.from(document.querySelectorAll('.cell'));
const status = document.getElementById('status');
const restartButton = document.getElementById('restart');

let board = Array(9).fill('');
let currentPlayer = 'X';
let playing = true;

const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

function handleMove(event) {
  const cell = event.target;
  const index = Number(cell.dataset.index);

  if (!playing || board[index]) {
    return;
  }

  board[index] = currentPlayer;
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer.toLowerCase());

  const win = findWinner(board);

  if (win) {
    status.textContent = `Jogador ${win} venceu!`;
    playing = false;
    return;
  }

  if (board.every(Boolean)) {
    status.textContent = 'Empate!';
    playing = false;
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  status.textContent = `Vez do jogador ${currentPlayer}`;
}

function findWinner(currentBoard) {
  for (const combo of winningCombinations) {
    const [a, b, c] = combo;

    if (
      currentBoard[a] &&
      currentBoard[a] === currentBoard[b] &&
      currentBoard[a] === currentBoard[c]
    ) {
      return currentBoard[a];
    }
  }

  return null;
}

function restartGame() {
  board = Array(9).fill('');
  currentPlayer = 'X';
  playing = true;

  cells.forEach((cell) => {
    cell.textContent = '';
    cell.classList.remove('x', 'o');
  });

  status.textContent = 'Vez do jogador X';
}

cells.forEach((cell) => {
  cell.addEventListener('click', handleMove);
});

restartButton.addEventListener('click', restartGame);
