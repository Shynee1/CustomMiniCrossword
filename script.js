let puzzle, activeDir = 'across', activeIdx = null, timerSecs = 0;
let timerInterval;
let puzzleCompleted = false;
let answerGrid = [];
const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
};

window.onload = async () => {
  try {
    puzzle = await (await fetch('puzzle.json')).json();
    console.log(puzzle);
    
    buildAnswerGrid();
    buildPuzzleGrid();
    buildClues();
    startTimer();
    
    document.getElementById('toggle-dir').addEventListener('click', () => {
      if (activeIdx !== null) {
        activeDir = activeDir === 'across' ? 'down' : 'across';
        highlightFrom(activeIdx);
      }
    });

    const now = new Date();
    let dateString = now.toLocaleDateString('en-US', dateOptions);
    if (puzzle.date && puzzle.date !== ""){
      dateString = puzzle.date;
    }

    document.getElementById('date').textContent = dateString;

    let authorString = `By ${puzzle.author}`;
    if (puzzle.editor && puzzle.editor !== "")
      authorString += ` ● Edited by ${puzzle.editor}`

    document.getElementById('creator').textContent = authorString;
    
    document.getElementById('rebus').addEventListener('click', () => console.log('Rebus clicked'));
    document.getElementById('clear').addEventListener('click', clearPuzzle);
    document.getElementById('reveal').addEventListener('click', revealSquare);
    document.getElementById('check').addEventListener('click', checkSquare);
    document.getElementById('pause').addEventListener('click', handlePause);
    
    document.addEventListener('keydown', handleKeydown);
  } catch (error) {
    console.error('Error loading puzzle:', error);
  }
};

function buildAnswerGrid() {
  answerGrid = Array(puzzle.rows).fill().map(() => Array(puzzle.cols).fill(''));

  for (let row = 0; row < puzzle.rows; row++){
    let rowStringIdx = 0;
    for (let col = 0; col < puzzle.cols; col++) {

      if (isBlackCell(row, col)) continue;

      const entry = puzzle.across[row];

      if (rowStringIdx >= entry.answer.length) continue;

      answerGrid[row][col] = entry.answer.charAt(rowStringIdx);
      rowStringIdx++;
    }
  }
}

function findPositionForClue(direction, index) {
  const clue = puzzle[direction][index];
  const clueNum = getClueNumberFromIndex(direction, index);
  
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      const num = getClueNumber(r, c);
      if (num === clueNum) {
        return { row: r, col: c };
      }
    }
  }
  
  return { row: 0, col: 0 };
}

function getClueNumberFromIndex(direction, index) {
  let acrossCount = 0;
  let downCount = 0;
  let clueNumbers = [];
  
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (isBlackCell(r, c)) continue;

      const startAcross = c === 0 || isBlackCell(r, c-1);
      const startDown = r === 0 || isBlackCell(r-1, c);
      
      if (startAcross || startDown) {
        const clueNumber = clueNumbers.length + 1;
        clueNumbers.push(clueNumber);
        
        if (startAcross) acrossCount++;
        if (startDown) downCount++;
        
        if (direction === 'across' && startAcross && acrossCount === index + 1) {
          return clueNumber;
        }
        
        if (direction === 'down' && startDown && downCount === index + 1) {
          return clueNumber;
        }
      }
    }
  }
  
  return null;
}

function clearPuzzle(e) {
  clearHighlighting();

  document.querySelectorAll('input')
    .forEach(c => c.value = "");
}

function checkSquare(e) {
  const input = document.querySelector(`input[data-idx='${activeIdx}']`);
  const {r, c} = idxToRC(activeIdx);
  const expected = answerGrid[r][c];
  
  if (input.value && input.value === expected)
    input.classList.add('correct');
  else 
    input.classList.add('incorrect');
}

function revealSquare(e) {
  const input = document.querySelector(`input[data-idx='${activeIdx}']`);
  const {r, c} = idxToRC(activeIdx);
  const answer = answerGrid[r][c];

  if (input.classList.contains('incorrect'))
      input.classList.remove('incorrect');

  input.value = answer;
  input.classList.add('correct');

  setTimeout(checkPuzzleCompletion, 300);
}

function clearHighlighting(e) {
  document.querySelectorAll('.cell.selected, .cell.active')
    .forEach(c => c.classList.remove('selected','active'));
  
  document.querySelectorAll('#across-list li, #down-list li')
    .forEach(li => li.classList.remove('active', 'highlighted'));
}

function handlePause(e) {
  if (!timerInterval) {
    // Restart timer
    startTimer();
  
    const existingOverlay = document.querySelector('.pause-overlay');
    if (existingOverlay) {
      document.body.removeChild(existingOverlay);
    }
  } else {
    // Pause the timer
    clearInterval(timerInterval);
    timerInterval = null;
    
    // Create pause overlay
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const messageBox = document.createElement('div');
    messageBox.className = 'popup-message';
    
    const heading = document.createElement('h2');
    heading.textContent = 'Timer Paused';
    
    const timeMsg = document.createElement('p');
    const m = Math.floor(timerSecs / 60), s = String(timerSecs % 60).padStart(2, '0');
    timeMsg.textContent = `Puzzle stopped at ${m}:${s}`;
    
    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'Continue';
    continueBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      startTimer();
    });

    messageBox.appendChild(heading);
    messageBox.appendChild(timeMsg);
    messageBox.appendChild(continueBtn);
    overlay.appendChild(messageBox);
    document.body.appendChild(overlay);
  }
}

function handleKeydown(e) {
    if (!activeIdx) return;
  
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

function moveToNextClue() {
    let currentClueIndex = -1;
    
    // Find the active clue in the current direction
    const entriesInCurrentDirection = puzzle[activeDir];
    
    for (let i = 0; i < entriesInCurrentDirection.length; i++) {
      const position = findPositionForClue(activeDir, i);
      const clueIdx = position.row * puzzle.cols + position.col;
      const clueCells = getEntryCells(clueIdx);
    
      if (clueCells.includes(activeIdx)) {
        currentClueIndex = i;
        break;
      }
    }

    if (currentClueIndex !== -1) {
      // Move to the next clue in the current direction
      const nextClueIndex = (currentClueIndex + 1) % entriesInCurrentDirection.length;
      const nextPosition = findPositionForClue(activeDir, nextClueIndex);
      const nextClueIdx = nextPosition.row * puzzle.cols + nextPosition.col;
    
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

function buildPuzzleGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${puzzle.cols},1fr)`;

  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      const idx = rcToIdx(r, c);
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (puzzle.grid[idx].black){
        cell.classList.add('black');
      } 
      else {
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
        
        inp.addEventListener('input', onInput);
        
        // Handle backspace properly
        inp.addEventListener('keydown', e => {
          if (e.key === 'Backspace') {
            if (e.target.value && !e.target.classList.contains('correct')) {
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
        
        cell.addEventListener('click', () => onCellClick(idx));
        cell.appendChild(inp);
      }
      grid.appendChild(cell);
    }
  }
  
  // Initialize the first active cell
  if (puzzle.across.length > 0) {
    const firstPosition = findPositionForClue('across', 0);
    const firstIdx = firstPosition.row * puzzle.cols + firstPosition.col;
    setTimeout(() => {
      highlightFrom(firstIdx);
    }, 100);
  }
}

function onInput(e) {
  // Only move forward if a character was actually entered
  if (e.target.value) {
    if (e.target.classList.contains('incorrect'))
      e.target.classList.remove('incorrect');
    
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
    
    puzzle[dir].forEach((clue, index) => {
      const position = findPositionForClue(dir, index);
      const clueNum = getClueNumberFromIndex(dir, index);
      
      const li = document.createElement('li');
      li.innerHTML = `<strong>${clueNum}.</strong> ${clue.clue}`;
      li.dataset.dir = dir; 
      li.dataset.num = clueNum;
      li.dataset.idx = position.row * puzzle.cols + position.col;
      
      li.addEventListener('click', () => {
        activeDir = dir;
        highlightFrom(parseInt(li.dataset.idx));
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

  document.querySelector(`input[data-idx='${idx}']`).focus();
}

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
  clearHighlighting();

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
  
  // Find the clue that contains this cell
  const entries = puzzle[activeDir];
  
  for (let i = 0; i < entries.length; i++) {
    const position = findPositionForClue(activeDir, i);
    const clueIdx = position.row * puzzle.cols + position.col;
    const clueCells = getEntryCells(clueIdx);
    
    if (clueCells.includes(idx)) {
      // This is our active clue
      const clueNum = getClueNumberFromIndex(activeDir, i);
      const clueElement = document.querySelector(`#${activeDir}-list li[data-num='${clueNum}']`);
      if (clueElement) {
        clueElement.classList.add('active');
        
        // Scroll the clue into view if needed
        clueElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      break;
    }
  }
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
  const idx = rcToIdx(r, c);
  return puzzle.grid[idx].black;
}

function getClueNumber(r, c) {
  // We need to determine if this cell starts an across or down entry
  if (isBlackCell(r, c)) return null;
  
  const startAcross = c === 0 || isBlackCell(r, c-1);
  const startDown = r === 0 || isBlackCell(r-1, c);
  
  if (!startAcross && !startDown) return null;
  
  // Count all the clue numbers up to this point
  let clueNumber = 1;
  for (let rr = 0; rr < puzzle.rows; rr++) {
    for (let cc = 0; cc < puzzle.cols; cc++) {
      if (rr === r && cc === c) return clueNumber;
      
      if (!isBlackCell(rr, cc)) {
        const sa = cc === 0 || isBlackCell(rr, cc-1);
        const sd = rr === 0 || isBlackCell(rr-1, cc);
        if (sa || sd) clueNumber++;
      }
    }
  }
  return null;
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
    for (let c = 0; c < puzzle.cols; c++) {
  
      if (isBlackCell(r, c)) continue;

      const idx = rcToIdx(r, c);
      const input = document.querySelector(`input[data-idx='${idx}']`);
      const expectedValue = answerGrid[r][c];
      
      if (!input || input.value !== expectedValue) {
        return false;
      }
    }
  }
  
  showVictoryScreen();
  return true;
}

function showVictoryScreen() {
  puzzleCompleted = true;
  
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  
  const messageBox = document.createElement('div');
  messageBox.className = 'popup-message';
  
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

  if (puzzle.highlight_prom_text)
    highlightPromposal();
}

function highlightPromposal() {
  let promStartingPos = 4;
  
  activeDir = 'down';
  clearHighlighting();

  const promCell = document.querySelector(`input[data-idx='${promStartingPos}']`).parentElement;
  promCell.classList.add('selected');

  // Highlight all cells in prom
  const cells = getEntryCells(promStartingPos);
  cells.forEach(i => {
    const cellElement = document.querySelector(`input[data-idx='${i}']`).parentElement;
    cellElement.classList.add('selected');
  });
}

function rcToIdx(r, c) {
  return r * puzzle.cols + c;
}

function idxToRC(idx) {
  return { r: Math.floor(idx / puzzle.cols), c: idx % puzzle.cols };
}