import React from 'react';
import './conn4_styles.css';

function Cell(props) {
    return (
        <div className="cell">
            <div className="piece" style={props.color} />
        </div>
    );
}

function Button(props) {
    let className = props.disabled ? "button dead" : "button live";
    return (
        <button className={className} disabled={props.disabled} onClick={() => props.buttonClick()}>
            &#9759;
        </button>
    )
}

class Column extends React.Component {
    renderCell(cell, key) {
        let colorStyle = this.props.colors[cell];
        return <Cell color={colorStyle} key={key} />;
    }

    render() {
        let callback = (cell, j) => {
            return this.renderCell(cell, [this.props.columnIndex, j])
        };
        return(
            <div className="board-column">
                <Button disabled={this.props.disabledButton} buttonClick={() => this.props.buttonClick()}/>
                {this.props.columnCells.map(callback)}
            </div>
        )
    }
}

class Board extends React.Component {
    render() {
        let renderedBoard = this.props.boardState.map((column, i) => {
            return <Column columnCells={column}
                           key={i}
                           columnIndex={i}
                           disabledButton={this.props.nextCells[i] < 0}
                           colors={this.props.colors}
                           buttonClick={() => this.props.buttonClick(i)}/>;
        });

        return (
            <div className="board">
                {renderedBoard}
            </div>
        );
    }
}

class Conn4 extends React.Component {
    constructor(props) {
        super();
        this.boardColumns = props.columns; //width
        this.boardRows = props.rows; //height
        this.winCondition = props.winCondition; //Connect... what?
        let boardState = new Array(this.boardColumns).fill('');
        boardState = boardState.map((col, i) => {
           return new Array(this.boardRows).fill('E');
        });

        this.state = {
            boardState: boardState,
            nextCells: new Array(this.boardColumns).fill(this.boardRows - 1),
            currentPlayer: 'R',
            winningPlayer: null,
            moveNumber: 1
        };
        this.colors = {
            E: {
                background: "#ffffff"
            },
            R: {
                background: "#ff2222"
            },
            B: {
                background: "#000000"
            }
        };
    }

    solveBoard(boardState, nextCells) {
        // Don't evaluate if there aren't enough pieces yet
        if (this.state.moveNumber < this.winCondition * 2 - 1)
            return null;

        // Will be set on empty cell. Doesn't apply to diagonals
        let ignoreColumn = new Array(this.boardColumns).fill(false);

        // Ignore vertical portions of crawl
        let verticalBypasses = nextCells.map((nextCell, i) => {
            return this.boardRows - nextCell <= this.winCondition;
        });

        // The last cells to check
        let verticalBound = this.winCondition - 1;
        let horizontalBound = this.boardColumns - this.winCondition;
        let backwardDiagonalBound = this.winCondition - 1;


        let crawlCells = function(row, column, color, direction, recurseCounter) {
            // return {
            //         win: false,
            //         row: row,
            //         column: column
            //     };
            let currentColor = boardState[column][row];
            if (currentColor === 'E') {
                if (direction.columnDelta === 1 && direction.rowDelta === 0)
                    ignoreColumn[column] = true;
                verticalBypasses[column] = true;
                return {
                    win: false,
                    row: row,
                    column: column,
                    color: currentColor

                };
            }

            if (!color) {
                return crawlCells(row + direction.rowDelta, column + direction.columnDelta, currentColor, direction, recurseCounter - 1);
            }

            if (color === currentColor) {
                if (recurseCounter === 0) {
                    return {
                        win: true,
                        row: row,
                        column: column,
                        color: currentColor
                    }
                }

                return crawlCells(row + direction.rowDelta, column + direction.columnDelta, currentColor, direction, recurseCounter - 1);
            }
            else {
                return {
                    win: false,
                    row: row,
                    column: column,
                    color: currentColor
                }
            }
        };

        for(let currentRow=this.boardRows - 1; currentRow >= 0; currentRow--) {

            let nextHorizontal = 0;
            for (let currentColumn = 0; currentColumn < this.boardColumns; currentColumn++) {
                if (!ignoreColumn[currentColumn]){
                    if (!verticalBypasses[currentColumn] && currentRow > verticalBound) {
                        let verticalResult = crawlCells(currentRow, currentColumn, null, {rowDelta: -1, columnDelta: 0}, this.winCondition - 1);
                        if (verticalResult.win) {
                            return verticalResult.color;
                        }

                    }
                    if (currentColumn <= horizontalBound && currentColumn >= nextHorizontal) {
                        let horizontalResult = crawlCells(currentRow, currentColumn, null, {rowDelta: 0, columnDelta: 1}, this.winCondition - 1);
                        if (horizontalResult.win) {
                            return horizontalResult.color;
                        }
                        nextHorizontal = horizontalResult.column;
                    }

                    if (currentRow > verticalBound) {
                        if (currentColumn <= horizontalBound) {
                            let forwardDiagonalResult = crawlCells(currentRow, currentColumn, null, {rowDelta: -1, columnDelta: 1}, this.winCondition - 1);
                            if (forwardDiagonalResult.win) {
                                return forwardDiagonalResult.color;
                            }
                        }

                        if (currentColumn >= backwardDiagonalBound) {
                            let backwardDiagonalResult = crawlCells(currentRow, currentColumn, null, {rowDelta: -1, columnDelta: -1}, this.winCondition - 1);
                            if (backwardDiagonalResult.win) {
                                return backwardDiagonalResult.color;
                            }
                        }
                    }

                }
            }
        }

        return null;
    }

    dropPiece(column) {
        let nextCells = this.state.nextCells.slice();
        let nextCell = nextCells[column];
        let boardState = this.state.boardState.slice();
        boardState[column][nextCell] = this.state.currentPlayer;
        nextCells[column] = nextCell - 1;
        let currentPlayer = this.state.currentPlayer === 'R' ? 'B' : 'R';
        let winningPlayer = this.solveBoard(boardState, nextCells);
        this.setState({
            boardState: boardState,
            nextCells: nextCells,
            currentPlayer: currentPlayer,
            winningPlayer: winningPlayer,
            moveNumber: this.state.moveNumber + 1
        });
    }



    render() {
        return (<div>
            <Board boardState={this.state.boardState}
                      nextCells={this.state.nextCells}
                      colors={this.colors}
                      buttonClick={(col) => this.dropPiece(col)}
        />
        {this.state.winningPlayer && <h1>{this.state.winningPlayer}</h1>}</div>)
    }
}

export default Conn4;
