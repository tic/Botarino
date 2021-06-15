// Cracker Barrel Triangle Game Solver

const OPEN_SPOT = 5;

// Format:
// Index into moveGuide with the pin number you're on.
// The resulting array contains a list of pins which can be jumped to.
// Each entry is an array with 2 items: 1st, the pin we can jump to. 2nd, the pin which we have to jump over to get there.
const moveGuide = [
    [[3, 1], [5, 2]],
    [[6, 3], [8, 4]],
    [[7, 4], [9, 5]],
    [[0, 1], [5, 4], [10, 6], [12, 7]],
    [[11, 7], [13, 8]],
    [[0, 2], [3, 4], [12, 8], [14, 9]],
    [[1, 3], [8, 7]],
    [[2, 4], [9, 8]],
    [[1, 4], [6, 7]],
    [[2, 5], [7, 8]],
    [[3, 6], [12, 11]],
    [[4, 7], [13, 12]],
    [[3, 7], [5, 8], [10, 11], [14, 13]],
    [[4, 8], [11, 12]],
    [[5, 9], [12, 13]],
]

const generateBoard = open => {
    let b = [...Array(15)].map(() => 1);
    b[open] = 0;
    return b;
}

const stringifyBoard = boardState => {
    const m = pin => boardState[pin] ? `X` : `_`;

    return [
        ``,
        `     ${m(0)}`,
        `    ${m(1)} ${m(2)}`,
        `   ${m(3)} ${m(4)} ${m(5)}`,
        `  ${m(6)} ${m(7)} ${m(8)} ${m(9)}`,
        ` ${m(10)} ${m(11)} ${m(12)} ${m(13)} ${m(14)}`,
        ``,
    ].join("\n");
}

const stepDiagram = ([_, history]) => {
    let boardState = board.concat([]);
    let stateString = stringifyBoard(boardState);
    for(let i = 0; i < history.length; i++) {
        doMove(boardState, history[i]);
        stateString += stringifyBoard(boardState);
    }
    return stateString;
}

const getMoves = boardState => {
    // Format of move results: [ [src, dest, via], ...]
    let results = [];
    for(let src = 0; src < 15; src++) {
        if(!boardState[src]) continue;
        let options = moveGuide[src];
        for(let x = 0; x < options.length; x++) {
            let [dest, via] = options[x];
            // If the destination is empty and the hop over is occupied
            if(!boardState[dest] && boardState[via]) results.push([src, dest, via]);
        }
    }
    return results;
}

const doMove = (boardState, [src, dest, via]) => {
    boardState[src] = 0;
    boardState[dest] = 1;
    boardState[via] = 0;
}

const score = boardState => boardState.reduce((acc, cur) => acc + cur);

const reportResult = (method, [board, history]) => `Using ${method}:\nAchieved a score of ${score(board)} in ${history.length} moves.\nBoard state:\n${stringifyBoard(board)}`;

// Game solver which naively takes the first available move every time.
const alwaysFirstMove = boardState => {
    let history = [], moves = getMoves(boardState);
    while(moves.length > 0) {
        doMove(boardState, moves[0]);
        history.push(moves[0]);
        moves = getMoves(boardState);
    }

    return [boardState, history];
}

// Game solver which recursively tests all available moves and selects the best one.
const stableRecursiveOptimizer = (state, history) => {
    let moves = getMoves(state);
    // If there are no moves left to make, this tree has ended.
    if(moves.length === 0) return [state, history];

    // If there are moves left, create a new execution branch for each one.
    // Parameters are deep copied because each branch is unique.
    return outcomes = moves.map(mv => {
        let nextState = state.concat([]);
        doMove(nextState, mv);
        return stableRecursiveOptimizer(nextState, history.concat([mv]));

    // Return the outcome which was the most successful.
    }).reduce((acc, cur) => score(acc[0]) <= score(cur[0]) ? acc : cur);
}

const unstableRecursiveOptimizer = (state, history) => {
    let moves = getMoves(state);
    if(moves.length === 0) return [state, history];
    let outcomes = moves.map(mv => {
        let nextState = state.concat([]);
        doMove(nextState, mv);
        return unstableRecursiveOptimizer(nextState, history.concat([mv]));
    }).reduce((acc, cur) => {
        //console.log(acc, cur);
        if(acc.length > 0) {
            if(!cur) console.log(acc, cur);
            let cs = score(acc[0][0]), ts = score(cur[0]);
            //console.log("scores", cs, ts);
            if(ts < cs) return [cur];
            if(ts === cs) acc.push(cur);
        } else {
            //console.log("first push");
            acc.push(cur);
        }
        return acc;
    }, []);
    return outcomes[parseInt(parseInt(Math.random() * 100) / 100 * outcomes.length)];
}


module.exports = {
    generateBoard,
    stringifyBoard,
    stepDiagram,
    reportResult,
    alwaysFirstMove,
    stableRecursiveOptimizer,
    unstableRecursiveOptimizer,
}
// console.log(stringifyBoard(board));
//
// let afm = alwaysFirstMove(board.concat([]));
// console.log(reportResult("alwaysFirstMove", afm));
//
// let ro = unstableRecursiveOptimizer(board.concat([]), []);
// console.log(reportResult("unstableRecursiveOptimizer", ro));
// console.log(stepDiagram(ro));
