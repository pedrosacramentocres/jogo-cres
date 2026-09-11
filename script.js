import * as THREE from 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r156/build/three.module.js';

const container = document.getElementById('scene-container');
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

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xc7d2fe, 8, 12);

const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 4.8, 8.0);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(4, 8, 6);
directionalLight.castShadow = true;
scene.add(directionalLight);

const boardGroup = new THREE.Group();
scene.add(boardGroup);

const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x2d1f4d, roughness: 0.6, metalness: 0.1 });
const gridMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.2 });
const xMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x22114c, metalness: 0.6, roughness: 0.4 });
const oMaterial = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0x552b00, metalness: 0.4, roughness: 0.45 });

const base = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.2, 5.8), baseMaterial);
base.position.y = -1.1;
base.receiveShadow = true;
boardGroup.add(base);

const grid = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.08, 5.3), gridMaterial);
grid.position.y = -0.95;
grid.receiveShadow = true;
boardGroup.add(grid);

const lineMaterial = new THREE.MeshStandardMaterial({ color: 0x4b007e, roughness: 0.8 });
for (let i = -1; i <= 1; i++) {
  const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 4.8), lineMaterial);
  vertical.position.set(i * 1.6, -0.93, 0);
  boardGroup.add(vertical);

  const horizontal = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.03, 0.08), lineMaterial);
  horizontal.position.set(0, -0.93, i * 1.6);
  boardGroup.add(horizontal);
}

const markers = new Map();
const markerPositions = [
  [-2, 0, -2], [0, 0, -2], [2, 0, -2],
  [-2, 0, 0], [0, 0, 0], [2, 0, 0],
  [-2, 0, 2], [0, 0, 2], [2, 0, 2]
];

function makeMarker(type, index) {
  const position = new THREE.Vector3(...markerPositions[index]);
  const markerGroup = new THREE.Group();
  markerGroup.position.copy(position);
  markerGroup.userData.index = index;

  if (type === 'X') {
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 1.65), xMaterial);
    left.rotation.z = Math.PI / 4;
    left.position.set(-0.28, 0, 0);

    const right = left.clone();
    right.rotation.z = -Math.PI / 4;
    right.position.set(0.28, 0, 0);

    markerGroup.add(left, right);
  } else {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.10, 12, 36), oMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0;
    markerGroup.add(ring);
  }

  markerGroup.scale.setScalar(0.8);
  markerGroup.userData.type = type;
  boardGroup.add(markerGroup);
  markers.set(index, markerGroup);
}

function updateCellDisplay(index, symbol) {
  if (markers.has(index)) {
    boardGroup.remove(markers.get(index));
    markers.delete(index);
  }

  if (symbol) {
    makeMarker(symbol, index);
  }
}

function handleMove(index) {
  if (!playing || board[index]) {
    return;
  }

  board[index] = currentPlayer;
  updateCellDisplay(index, currentPlayer);

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

    if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
      return currentBoard[a];
    }
  }

  return null;
}

function restartGame() {
  board = Array(9).fill('');
  currentPlayer = 'X';
  playing = true;

  for (const marker of markers.values()) {
    boardGroup.remove(marker);
  }

  markers.clear();
  status.textContent = 'Vez do jogador X';
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function pointerPositionForClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

renderer.domElement.addEventListener('click', (event) => {
  pointerPositionForClick(event);
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(boardGroup.children, true);
  if (!hits.length) {
    return;
  }

  const hit = hits[0];
  let index = hit.object.userData.index;

  if (index === undefined && hit.object.parent?.userData?.index !== undefined) {
    index = hit.object.parent.userData.index;
  }

  if (index !== undefined) {
    handleMove(index);
  }
});

restartButton.addEventListener('click', restartGame);

for (let i = 0; i < 9; i++) {
  const cell = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.08, 1.35),
    new THREE.MeshStandardMaterial({ color: 0x1f2937, transparent: true, opacity: 0.22 })
  );
  cell.position.set(markerPositions[i][0], -0.84, markerPositions[i][2]);
  cell.userData.index = i;
  boardGroup.add(cell);
}

const clock = new THREE.Clock();
function animate() {
  const elapsed = clock.getElapsedTime();
  boardGroup.rotation.y = Math.sin(elapsed * 0.55) * 0.25;
  boardGroup.position.y = Math.sin(elapsed * 1.1) * 0.04;
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

animate();
renderer.setAnimationLoop(animate);
