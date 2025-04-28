# NYT Mini Crossword Clone

A fully functional clone of the New York Times Mini Crossword puzzle application with customizable puzzles and a familiar interface. This project was originally created as a promposal for my girlfriend! The final answer in my custom puzzle spells out "PROM?"

![NYT Mini Crossword Clone](https://github.com/Shynee1/CustomMiniCrossword/blob/main/assets/Crossword_UI.png)

## 🎮 Demo

You can try the demo [here](https://nytcrossword.netlify.com)

## ✨ Features

- **Authentic NYT Experience**: Replicates the look and feel of the official NYT Mini Crossword interface
- **Customizable Puzzles**: Load your own custom puzzles with any grid size and layout
- **Interactive Grid**: Dynamic highlighting of active cells and clues
- **Keyboard Navigation**: Full keyboard support with arrow keys for navigation
- **Auto-advance Input**: The cursor automatically advances to the next cell when a letter is entered
- **Timer**: Tracks solving time with pause functionality
- **Victory Screen**: Celebrates puzzle completion with time statistics

## 🛠️ Technical Details

### Technologies Used
- HTML5
- CSS3
- Vanilla JavaScript (no frameworks)

### Puzzle Data Format

The puzzle data is stored in a JSON file with the following structure:

```json
{
  "rows": 5,
  "cols": 5,
  "grid": [
    {"black": true}, {"black": false}, ...
  ],
  "across": [
    {"num": 1, "row": 0, "col": 0, "clue": "Your clue here", "answer": "ANSWER"},
    ...
  ],
  "down": [
    {"num": 1, "row": 0, "col": 0, "clue": "Your clue here", "answer": "ANSWER"},
    ...
  ]
}
```

## 🚀 Getting Started

### Prerequisites
- Any modern web browser
- A text editor for customizing puzzles

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/nyt-mini-crossword-clone.git
   ```
2. Navigate to the project directory:
   ```
   cd nyt-mini-crossword-clone
   ```
3. Open `index.html` in your browser or serve the files using a local server.

### Creating Custom Puzzles

1. Open `puzzle.json` in your text editor
2. Follow the data structure format above
3. Customize the grid size by changing the `rows` and `cols` values
4. Define black cells in the `grid` array
5. Create your own clues and answers in the `across` and `down` arrays
6. Save and reload the page to play your custom puzzle

## 🎨 Customization Options

### Grid Size
Edit the `rows` and `cols` values in `puzzle.json` to create puzzles of any size.

### Theme
You can modify the colors and styling in `style.css`:
- Change the selection color (currently `#ffda00`)
- Modify the active cell color (currently `#a7d8ff`)
- Adjust font sizes and styles

## 🙏 Acknowledgements

- New York Times Games for inspiration
- The crossword community for testing and feedback
