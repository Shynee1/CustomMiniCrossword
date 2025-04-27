let puzzle, activeDir = 'across', activeIdx = null, timerSecs = 0;
let timerInterval;
let puzzleCompleted = false;
const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
};

window.onload = async () => {
  try {
    puzzle = await (await fetch('puzzle.json')).json();
    buildGrid();
    buildClues();
    startTimer();
    
    document.getElementById('toggle-dir').addEventListener('click', () => {
      if (activeIdx !== null) {
        activeDir = activeDir === 'across' ? 'down' : 'across';
        highlightFrom(activeIdx);
      }
    });

    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', dateOptions);
    //document.getElementById('date').textContent = dateString;
    
    document.getElementById('rebus').addEventListener('click', () => console.log('Rebus clicked'));
    document.getElementById('clear').addEventListener('click', () => console.log('Clear clicked'));
    document.getElementById('reveal').addEventListener('click', () => console.log('Reveal clicked'));
    document.getElementById('check').addEventListener('click', () => console.log('Check clicked'));
    
    document.addEventListener('keydown', handleKeydown);
  } catch (error) {
    console.error('Error loading puzzle:', error);
  }
};

// Handle keyboard navigation
function handleKeydown(e) {
    if (!activeIdx) return;
    
    // Arrow keys for navigation
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveInDirection(0, 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveInDirection(0, -1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveInDirection(1, 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveInDirection(-1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      moveToNextClue();
    }
}

// Function to move to the next clue
function moveToNextClue() {
    // Find the current clue index
    let currentClueIndex = -1;

    // Find the active clue in the current direction
    for (let i = 0; i < puzzle[activeDir].length; i++) {
      const clue = puzzle[activeDir][i];
      const clueIdx = clue.row * puzzle.cols + clue.col;
      const clueCells = getEntryCells(clueIdx);SVGAElement
    
      if (clueCells.includes(activeIdx)) {
        currentClueIndex = i;
        break;
      }
    }

    if (currentClueIndex !== -1) {
      // Move to the next clue in the current direction
      const nextClueIndex = (currentClueIndex + 1) % puzzle[activeDir].length;
      const nextClue = puzzle[activeDir][nextClueIndex];
      const nextClueIdx = nextClue.row * puzzle.cols + nextClue.col;
    
      // Highlight the new clue and focus on its first cell
      activeIdx = nextClueIdx;
      highlightFrom(nextClueIdx);
      document.querySelector(`input[data-idx='${nextClueIdx}']`).focus();
    }
}
  
function moveInDirection(dr, dc) {
  if (activeIdx === null) return;
  const { r, c } = idxToRC(activeIdx);
  const newR = r + dr;
  const newC = c + dc;
  
  // Check bounds and black cells
  if (newR >= 0 && newR < puzzle.rows && 
      newC >= 0 && newC < puzzle.cols && 
      !isBlackCell(newR, newC)) {
    const newIdx = newR * puzzle.cols + newC;
    highlightFrom(newIdx);
    document.querySelector(`input[data-idx='${newIdx}']`).focus();
  }
}

function buildGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${puzzle.cols},1fr)`;

  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      const idx = r * puzzle.cols + c;
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (puzzle.grid[idx].black) cell.classList.add('black');

      if (!puzzle.grid[idx].black) {
        const num = getClueNumber(r, c);
        if (num) {
          const n = document.createElement('div');
          n.className = 'number';
          n.textContent = num;
          cell.appendChild(n);
        }
        const inp = document.createElement('input');
        inp.maxLength = 1;
        inp.dataset.idx = idx;
        
        // Typing moves cursor - only when a character is entered
        inp.addEventListener('input', onInput);
        
        // Handle backspace properly
        inp.addEventListener('keydown', e => {
          if (e.key === 'Backspace') {
            if (e.target.value) {
              // If there's text, just clear the cell without moving
              e.target.value = '';
              e.preventDefault();
            } else {
              e.preventDefault();
              const cells = getEntryCells(activeIdx);
              const currentIdx = +e.target.dataset.idx;
              const pos = cells.indexOf(currentIdx);
              
              if (pos > 0) {
                const prevIdx = cells[pos - 1];
                document.querySelector(`input[data-idx='${prevIdx}']`).focus();
                highlightFrom(prevIdx);
              }
            }
          }
        });
        
        // Click selects cell
        cell.addEventListener('click', () => onCellClick(idx));
        cell.appendChild(inp);
      }
      grid.appendChild(cell);
    }
  }
  
  // Initialize the first active cell
  if (puzzle.across.length > 0) {
    const firstClue = puzzle.across[0];
    const firstIdx = firstClue.row * puzzle.cols + firstClue.col;
    setTimeout(() => {
      highlightFrom(firstIdx);
    }, 100);
  }
}

function onInput(e) {
  // Only move forward if a character was actually entered
  if (e.target.value) {
    e.target.value = e.target.value.toUpperCase();
    moveCursor(1);
    
    // Check if puzzle is complete after input
    setTimeout(checkPuzzleCompletion, 300);
  }
}

function buildClues() {
  ['across','down'].forEach(dir => {
    const ul = document.getElementById(dir + '-list'); 
    ul.innerHTML = '';
    puzzle[dir].forEach(cl => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${cl.num}.</strong> ${cl.clue}`;
      li.dataset.dir = dir; 
      li.dataset.num = cl.num;
      li.dataset.idx = cl.row * puzzle.cols + cl.col;
      li.addEventListener('click', () => {
        activeDir = dir;
        highlightFrom(cl.row * puzzle.cols + cl.col);
      });
      ul.appendChild(li);
    });
  });
}

function onCellClick(idx) {
  // If clicking the same cell, toggle direction but keep cell selected
  if (activeIdx === idx) {
    activeDir = activeDir === 'across' ? 'down' : 'across';
  } else {
    // If clicking a new cell, switch to that cell
    activeIdx = idx;
  }
  
  highlightFrom(idx);
  
  // Always focus on the clicked cell input field
  document.querySelector(`input[data-idx='${idx}']`).focus();
}

// Update the moveCursor function to respect the active direction
function moveCursor(delta) {
  if (activeIdx === null) return;
  const cells = getEntryCells(activeIdx);
  const activeInput = document.activeElement;
  const currentIdx = +activeInput.dataset.idx;
  const pos = cells.indexOf(currentIdx);
  const newPos = pos + delta;
  if (newPos >= 0 && newPos < cells.length) {
    const nextIdx = cells[newPos];
    document.querySelector(`input[data-idx='${nextIdx}']`).focus();
    highlightFrom(nextIdx);
  } else if (delta > 0 && newPos >= cells.length) {
    moveToNextClue();
  }
  
}

function highlightFrom(idx) {
  // Remove previous highlighting from cells
  document.querySelectorAll('.cell.selected, .cell.active')
    .forEach(c => c.classList.remove('selected','active'));
  
  // Remove active classes from clues
  document.querySelectorAll('#across-list li, #down-list li')
    .forEach(li => li.classList.remove('active', 'highlighted'));

  // Highlight the selected cell
  const selCell = document.querySelector(`input[data-idx='${idx}']`).parentElement;
  selCell.classList.add('selected');

  // Highlight other cells in the entry
  const cells = getEntryCells(idx);
  cells.forEach(i => {
    if (i !== idx) {
      const cellElement = document.querySelector(`input[data-idx='${i}']`).parentElement;
      cellElement.classList.add('active');
    }
  });
  
  activeIdx = idx;
  
  // Find the current clue and highlight it
  const { r, c } = idxToRC(idx);
  
  // Highlight the active clue
  let foundClue = false;
  
  // First, find the specific clue that contains this cell
  puzzle[activeDir].forEach(clue => {
    let clueIdx = clue.row * puzzle.cols + clue.col;
    let clueCells = getEntryCells(clueIdx);
    
    if (clueCells.includes(idx)) {
      // This is our active clue
      const clueElement = document.querySelector(`#${activeDir}-list li[data-num='${clue.num}']`);
      if (clueElement) {
        clueElement.classList.add('active');
        foundClue = true;
        
        // Scroll the clue into view if needed
        clueElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  });
  
  // Highlight the other direction's clue as "highlighted"
  const otherDir = activeDir === 'across' ? 'down' : 'across';
  puzzle[otherDir].forEach(clue => {
    let clueIdx = clue.row * puzzle.cols + clue.col;
    let clueCells = getEntryCells(clueIdx);
    
    if (clueCells.includes(idx)) {
      // This intersects with our active cell
      const clueElement = document.querySelector(`#${otherDir}-list li[data-num='${clue.num}']`);
      if (clueElement) {
        clueElement.classList.add('highlighted');
      }
    }
  });
}

function getEntryCells(startIdx) {
  const { r, c } = idxToRC(startIdx);
  // step back to entry start
  let rr = r, cc = c;
  while (rr >= 0 && cc >= 0 && !isBlackCell(rr, cc)) {
    if (activeDir === 'across') cc--; else rr--;
  }
  if (activeDir === 'across') cc++; else rr++;

  // collect full entry
  const cells = [];
  while (rr < puzzle.rows && cc < puzzle.cols && !isBlackCell(rr, cc)) {
    cells.push(rr * puzzle.cols + cc);
    if (activeDir === 'across') cc++; else rr++;
  }
  return cells;
}

function isBlackCell(r, c) {
  if (r < 0 || c < 0 || r >= puzzle.rows || c >= puzzle.cols) return true;
  const idx = r * puzzle.cols + c;
  return puzzle.grid[idx].black;
}


function getClueNumber(r,c) {
  const a = puzzle.across.find(cl=>cl.row===r&&cl.col===c);
  if (a) return a.num;
  const d = puzzle.down.find(cl=>cl.row===r&&cl.col===c);
  return d ? d.num : null;
}

function startTimer() {
    const el = document.getElementById('timer');
    timerInterval = setInterval(() => {
      if (!puzzleCompleted) {
        timerSecs++;
        const m = Math.floor(timerSecs / 60), s = String(timerSecs % 60).padStart(2, '0');
        el.firstChild.textContent = `${m}:${s}`;
      }
    }, 1000);
  }

  function checkPuzzleCompletion() {
    if (puzzleCompleted) return false;
    
    for (let r = 0; r < puzzle.rows; r++) {
      let wordIndex = 0;
      for (let c = 0; c < puzzle.cols; c++) {
        const idx = r * puzzle.cols + c;
        
        // Skip black cells
        if (puzzle.grid[idx].black) continue;
        
        // Get input element
        const inputEl = document.querySelector(`input[data-idx='${idx}']`);

        let expectedValue = puzzle.across[r].answer.charAt(wordIndex);
        wordIndex++;
        
        // Check if input exists and has a value
        if (!inputEl || !inputEl.value || inputEl.value !== expectedValue || inputEl.value.trim() === '') {
          return false; // Found an empty cell, puzzle not complete
        }
      }
    }
    
    showVictoryScreen();
    return true;
  }

function showVictoryScreen() {
  // Set puzzle as completed to stop the timer
  puzzleCompleted = true;
  
  const overlay = document.createElement('div');
  overlay.className = 'victory-overlay';
  
  const messageBox = document.createElement('div');
  messageBox.className = 'victory-message';
  
  const heading = document.createElement('h2');
  heading.textContent = 'Congratulations!';
  
  const timeMsg = document.createElement('p');
  const m = Math.floor(timerSecs / 60), s = String(timerSecs % 60).padStart(2, '0');
  timeMsg.textContent = `You completed the puzzle in ${m}:${s}`;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  messageBox.appendChild(heading);
  messageBox.appendChild(timeMsg);
  messageBox.appendChild(closeBtn);
  overlay.appendChild(messageBox);
  document.body.appendChild(overlay);

  highlightPromposal();
}

function highlightPromposal() {
  const promStartingPos = 4;
  activeDir = 'down';
  
  // Remove previous highlighting from cells
  document.querySelectorAll('.cell.selected, .cell.active')
    .forEach(c => c.classList.remove('selected','active'));
  
  // Remove active classes from clues
  document.querySelectorAll('#across-list li, #down-list li')
    .forEach(li => li.classList.remove('active', 'highlighted'));

  const promCell = document.querySelector(`input[data-idx='${promStartingPos}']`).parentCell;
  promCell.classList.add('selected');

  // Highlight all cells in prom
  const cells = getEntryCells(promStartingPos);
  cells.forEach(i => {
    if (i !== promStartingPos) {
      const cellElement = document.querySelector(`input[data-idx='${i}']`).parentElement;
      cellElement.classList.add('selected');
    }
  });
}


function idxToRC(idx) {
  return { r: Math.floor(idx / puzzle.cols), c: idx % puzzle.cols };
}