type NumberRange = {
    min: number;
    max: number;
};

type Card = number[][];

function generateCard(): Card {
    const numbers: (number)[][] = [];
    const rowRanges: NumberRange[] = [
        { min: 1, max: 15 },   // B: First row
        { min: 16, max: 30 },  // I: Second row
        { min: 31, max: 45 },  // N: Third row
        { min: 46, max: 60 },  // G: Fourth row
        { min: 61, max: 75 }   // O: Fifth row
    ];

    for (let i = 0; i < 5; i++) {
        numbers[i] = [];
        let usedNumbers: number[] = [];
        for (let j = 0; j < 5; j++) {
            let number: number;
            do {
                const range = rowRanges[i];
                number = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            } while (usedNumbers.includes(number)); // Check to avoid duplication within the same row
            numbers[i][j] = number;
            usedNumbers.push(number);
        }
    }
    numbers[2][2] = 0;
    return numbers;
}

function checkForWin(card: Card, calledNumbers: number[]): boolean {
    // Check horizontal lines
    for (let i = 0; i < 5; i++) {
        if (card[i].every(num => calledNumbers.includes(num) || num === 0)) {
            return true;
        }
    }

    // Check vertical lines
    for (let j = 0; j < 5; j++) {
        if (card.every(row => calledNumbers.includes(row[j]) || row[j] === 0)) {
            return true;
        }
    }

    // Check diagonal (top-left to bottom-right)
    let diagonalWin1 = true;
    for (let i = 0; i < 5; i++) {
        if (!calledNumbers.includes(card[i][i]) && card[i][i] !== 0) {
            diagonalWin1 = false;
            break;
        }
    }
    if (diagonalWin1) return true;

    // Check diagonal (top-right to bottom-left)
    let diagonalWin2 = true;
    for (let i = 0; i < 5; i++) {
        if (!calledNumbers.includes(card[i][4 - i]) && card[i][4 - i] !== 0) {
            diagonalWin2 = false;
            break;
        }
    }
    if (diagonalWin2) return true;

    return false;
}

const generateDistinctNumbers = (count: number): number[] => {
    const numbers = Array.from({ length: count }, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers;
};

export {
    generateCard,
    checkForWin,
    generateDistinctNumbers
    
};