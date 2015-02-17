'use strict';

// Declare app level module which depends on views, and components
angular.module('KenKenApp', ['ngRoute'])


.controller('KenKenCtrl', ['$scope', '$log', '$http', '$filter', '$interval',
    function($scope, $log, $http, $filter, $interval) {
    $scope.$log = $log;

    var emptyGame = function(rows) {
        return {"rows": rows, "cells": [], "cages": []};
    }

    // create a new game of size x size
    $scope.newGame = function (size) {
        $scope.game = {};
        $scope.game.rows = size;  // number of rows/columns
        $scope.game.cells = Array(size);  // value of cells
        $scope.game.cages = [];  // cages have operator, operand, and cells
        $scope.game.values = Array(); // 1,2,3...size
        for (var i = 1; i <= size; i++) {
            $scope.game.values.push(i);
        }
        updateCellsFromCages();
        resetCellValues();
        $scope.game.solving = false; // are we solving the puzzle now?
        gameSolved = false;

    }

    // get the size of the game - height or width are the same
    var getGameSize = function() {
        return $scope.game.rows;
    }

    // retrieve a saved game from the server
    $scope.getGame = function (game) {
        var url = 'games/' + game;
        // reset the game before loading or the binding gets messed up
        $scope.game = emptyGame(0);
        $http.get(url).success(function (data) {
            $scope.game = data;
            $scope.game.values = Array(); // 1,2,3...size
            for (var i = 1; i <= getGameSize(); i++) {
                $scope.game.values.push(i);
            }
            updateCellsFromCages();
            resetCellValues();
            $scope.game.solving = false; // are we solving the puzzle now?
            gameSolved = false;
        });

    }

    $scope.saveGame = function() {
        var json = JSON.stringify($scope.game);
        $log.log(json);
    }

    // helper function to return an array of size n for ng-repeat
    $scope.range = function (n) {
        return new Array(n);
    };

    $scope.cellWidth = function () {
        return Math.round(100 / getGameSize()) + '%';
    }

    // set the cell at row/col to the selected value of isSelected
    var setSelected = function(row,col,isSelected) {
        $scope.game.cells[row][col].selected = isSelected;
    }

    // set all the cell values to undefined
    var resetCellValues = function() {
        for (var row = 0; row < getGameSize(); row++) {
            for (var col = 0; col < getGameSize(); col++) {
                $scope.game.cells[row][col].value = undefined;
            }
        }
    }

    // go through each cage and update the cell with the correct operator and value info
    var updateCellsFromCages = function () {
        // reset all cells
        selectedCells = [];
        var cells = []; // assign to $scope.game.cells once finished

        // for each row and column, create a cells object
        for (var row = 0; row < getGameSize(); row++) {
            cells[row] = [];
            cells[row].row = row;
            for (var col = 0; col < getGameSize(); col++) {
                cells[row][col] = {"content": "", "cage": -1};
            }
        }

        /* for each cage */
        var cages = $scope.game.cages;
        for (var i = 0; i < cages.length; i++) {
            updateCellsFromCage(cages[i], i, cells);
        }

        $scope.game.cells = cells;

    };

    // change the properties of each cell in a cage for things like top borders, isInCage, etc.
    var updateCellsFromCage = function(cage, cageNum, cells) {
        // validate
        if ( !cage.operand ) {
            alert("No or invalid operand value was specified for the cage.");
            return false;
        }
        if ( !cage.operator  ) {
            alert("No operator type was specified for the cage.");
            return false;
        }
        if ( cage.cells.length == 0 ) {
            alert("No cells selected in cage in updateCellsFromCage()");
            return false;
        }
        if ( !cells || cells.length < 1 ) {
            alert("Cells are invalid in updateCellsFromCage()");
            return false;
        }
        // for the top left cell (first) in the cage add the operator
        var cell = cage.cells[0];
        var text = cage.operand + cage.operator;
        var row = cell.row;
        var col = cell.col;
        cells[row][col].content = text;

        // start by setting all the borders black for each cell in the cage
        for (var j = 0; j < cage.cells.length; j++) {
            var row = cage.cells[j].row;
            var col = cage.cells[j].col;
            cells[row][col]["top"] = true;
            cells[row][col]["bottom"] = true;
            cells[row][col]["left"] = true;
            cells[row][col]["right"] = true;

            // also set the isInCage to true
            cells[row][col].cage = cageNum;
        }

        // now go thru each cell and check for adjacent ones
        for (var j = 0; j < cage.cells.length; j++) {
            var cell = cage.cells[j];

            // go thru all the other cells in the cage after this one to check for adjacent
            for (var k = j + 1; k < cage.cells.length; k++) {
                var nextCell = cage.cells[k];
                if (nextCell.row == cell.row && nextCell.col == (cell.col + 1)) {
                    // found a cell to the right - remove border between them
                    cells[cell.row][cell.col]["right"] = false;
                    cells[nextCell.row][nextCell.col]["left"] = false;
                }
                if (nextCell.row == cell.row && nextCell.col == (cell.col - 1)) {
                    // found a cell to the left - remove border between them
                    cells[cell.row][cell.col]["left"] = false;
                    cells[nextCell.row][nextCell.col]["right"] = false;
                }
                if (nextCell.col == cell.col && nextCell.row == (cell.row + 1)) {
                    // found a cell to the bottom - remove border between them
                    cells[cell.row][cell.col]["bottom"] = false;
                    cells[nextCell.row][nextCell.col]["top"] = false;
                }
                if (nextCell.col == cell.col && nextCell.row == (cell.row - 1)) {
                    // found a cell to the top - remove border between them
                    cells[cell.row][cell.col]["top"] = false;
                    cells[nextCell.row][nextCell.col]["bottom"] = false;
                }
            }

        }
        return true;
    }

    // go thru each cell and check for adjacent ones - throw alert if a problem
    // TODO check for two disjoint sets of adjacent cells
    // returns true if OK, false if not
    var checkForAdjacentCells = function (cage) {
        if ( cage.cells.length <= 1 ) {
            // OK if just one
            return true;
        }
        for (var j = 0; j < cage.cells.length; j++) {
            var cell = cage.cells[j];
            var foundOne = false;

            // go thru all the other cells in the cage after this one to check for adjacent
            for (var k = 0; !foundOne && k < cage.cells.length; k++) {
                var nextCell = cage.cells[k];
                if (nextCell.row == cell.row && nextCell.col == (cell.col + 1)) {
                    // found a cell to the right
                    foundOne = true;
                }
                if (nextCell.row == cell.row && nextCell.col == (cell.col - 1)) {
                    // found a cell to the left
                    foundOne = true;
                }
                if (nextCell.col == cell.col && nextCell.row == (cell.row + 1)) {
                    // found a cell to the bottom
                    foundOne = true;
                }
                if (nextCell.col == cell.col && nextCell.row == (cell.row - 1)) {
                    // found a cell to the top
                    foundOne = true;
                }
            }

            if ( !foundOne ) {
                alert("Cell ["+(cell.row+1)+"]["+(cell.col+1)+"] is not adjacent to any other cells.");
                return false;
            }
        }
        return true;
    }

    // track the cells clicked on
    var selectedCells = [];

    $scope.onClick = function (event, row, col) {
        // check to see if this cell is already in a cage
        if ( row[col].cage >= 0 ) {
            // ask if they want to delete the clicked cage
            // TODO - replace with a nicer modal dialog
            if ( confirm('You clicked on a cell in an existing cage.  Do you want to remove the existing cage?') ) {
                // find the current cage
                // remove cage and reset cell selection
                removeCage(row[col].cage);
            } else {
                // just ignore the click
                return;
            }
        }

        // toggle the cell selection
        // TODO also toggle the allowed operator buttons
        selectCell(row.row,col);
    };

    var selectCell = function(row,col) {
        // search thru the selectedCells to see if it's already selected
        for (var i=0; i<selectedCells.length; i++) {
            var cell = selectedCells[i];
            if ( cell.row === row && cell.col === col ) {
                // unselect the cell
                setSelected(row,col,false);
                // remove it from the selected array
                selectedCells.splice(i,1);
                return;
            }
        }
        selectedCells.push({"row":row, "col": col});
        setSelected(row,col,true);
    }

    // scope variables for the cage creation form
    $scope.operand = "";
//    $scope.operator = "=";

    // create a new cage using the scope variables and selected cells
    $scope.createNewCage = function(operator) {
        //  make sure at least one cell is selected
        if ( selectedCells.length == 0 ) {
            alert("Please click on at least one cell in the game");
            return;
        }

        // TODO validate that the right number of cells is selected for operator

        // get the selected cells and operand/operator and create a cage
        var cage = {};
        cage.operand = $scope.operand;
        cage.operator = operator;
//        cage.operator = $scope.operator;

        // sort the cage cells by row and then column to get the top left first
        selectedCells = $filter('orderBy')(selectedCells, ["row","col"]);
        cage.cells = selectedCells;

        // make sure the cells are adjacent
        if ( !checkForAdjacentCells(cage) ) {
            return;
        }

        // now add it to the game
        var cageNum = $scope.game.cages.push(cage)-1;

        if ( updateCellsFromCage(cage, cageNum, $scope.game.cells) ) {
            // remove the selections
            unSelectCells();
        }
    }

    // sort the cages by row then column
    var sortCages = function() {
        $scope.game.cages = $filter('orderBy')($scope.game.cages, function(cage){
            return cage.cells[0].row;
        });
    }

    var removeCage = function(cageNum) {
        // first reset all the cells in the cage
        var cage = $scope.game.cages[cageNum];
        var cells = $scope.game.cells;
        for (var j = 0; j < cage.cells.length; j++) {
            var row = cage.cells[j].row;
            var col = cage.cells[j].col;
            cells[row][col].top = false;
            cells[row][col].bottom = false;
            cells[row][col].right = false;
            cells[row][col].left = false;
            cells[row][col].cage = -1;
            cells[row][col].content = "";
        }

        // now remove the cage
        $scope.game.cages.splice(cageNum, 1);
    }

    var unSelectCells = function() {
        // reset the selection back to normal
        for (var i=0; i<selectedCells.length; i++) {
            var cell = selectedCells[i];
            setSelected(cell.row,cell.col,false);
        }
        selectedCells = [];
    }


    // methods related to solving the game
    var undefined;
    var cur_x;
    var cur_y;
    var curGrid = {
        values: [],
        indexes: [],
        get: function(cell) { return this.values[cell.row][cell.col]; },
        getRowCol: function(row,col) { return this.values[row][col]; },
        getIndex: function(x, y) { return this.indexes[y][x]; },
        set: function(value, index, x, y) { this.values[y][x] = value; this.indexes[y][x] = index; }
    };
    var colSelection;
    var rowSelection;

    var gameSolved = false;  // has the game been solved?
    var showGuesses = false; // show the current guesses when solving
    var stop; // save the $interval ID

    // solve the puzzle and update the grid with the guesses periodically
    $scope.solvePuzzle = function () {
        if ( !initGridSolving() )
            return false;

        // call this every 5 ms to update the display with current guess
        showGuesses = true;
        stop = $interval(intervalFunction, 5);
        return true;
    }

    // solve the puzzle if needed and show the next uncovered cell
    $scope.showOneCell = function() {
        if ( gameSolved ) {
            showNextCellValue();
            return true;
        }

        if ( $scope.game.solving ) {
            // turn off interval and stop solving
            $interval.cancel(stop);
            stop = undefined;
            $scope.game.solving = false;
            return false;
        }

        if ( !initGridSolving() )
            return false;

        // call this every 5 ms to update the display with current guess
        showGuesses = false;
        $scope.game.solving = true;
        stop = $interval(intervalFunction, 5);
        return true;
//            var ret = solvePuzzleButDontShowSolution();

    }

    var showNextCellValue = function () {
        // display the next undefined cell
        for (var row = 0; row < getGameSize(); row++) {
            for (var col = 0; col < getGameSize(); col++) {
                if ( $scope.game.cells[row][col].value == undefined ) {
                    $scope.game.cells[row][col].value = curGrid.getRowCol(row, col);
                    return true;
                }
            }
        }
        return true;

    }

    // setup the variables to start solving the puzzle
    // return true if everything is OK and false if not
    var initGridSolving = function() {
        gameSolved = false;

        // TODO make sure all the cells are in a cage

        // double check for valid number of cells for each operator
        if ( !checkEachCageForCellCount() ) {
            return false;
        }

        // now sort the cages by row to make the algo a little faster
        sortCages();

        resetCellValues();

        // init curGrid
        cur_x = 0;
        cur_y = 0;
        curGrid.values = [];
        curGrid.indexes = [];
        colSelection = [];
        rowSelection = [];
        for (var y = 0; y < getGameSize(); y++) {
            rowSelection[y] = [];
            for (var i = 0; i < getGameSize(); i++)
                rowSelection[y][i] = true;
            curGrid.values[y] = [];
            curGrid.indexes[y] = [];
            for (var x = 0; x < getGameSize(); x++) {
                if (y == 0) {
                    colSelection[x] = [];
                    for (var j = 0; j < getGameSize(); j++)
                        colSelection[x][j] = true;
                }
                curGrid.values[y][x] = undefined;
                curGrid.indexes[y][x] = undefined;
            }
        }
        return true;
    }

    // this is called by the $interval callback so we can update the cells with the current guess
    var intervalFunction = function() {
        // try the next 1000 iterations to see if they work
        var i = 1000;
        while (i-- && !gameSolved) {
            if (checkNextIteration()) {
                gameSolved = true;
                break;
            }
        }
        if ( gameSolved ) {
            // turn off interval
            $interval.cancel(stop);
            stop = undefined;
            $scope.game.solving = false;
            if ( !showGuesses ) {
                showNextCellValue();
            }
        }

        if ( showGuesses ) {
            fillInGuess();
        }
    }

    // solve the puzzle but don't show the solution yet
    //  return true if solved and false if not
    $scope.solvePuzzleButDontShowSolution = function() {
        if ( !initGridSolving() )
            return false;
        var i = 1000000;
        while (i-- && !gameSolved) {
            if (checkNextIteration()) {
                gameSolved = true;
                return true;
            }
        }
        alert("Could not solve puzzle");
        return false;
    }

    // fill in the solutions for each cell from curGrid
    var fillInGuess = function() {
        for (var row = 0; row < getGameSize(); row++) {
            for (var col = 0; col < getGameSize(); col++) {
                $scope.game.cells[row][col].value = curGrid.getRowCol(row,col);
            }
        }

    }

    // see if the current permutation is OK and go forward or back off depending
    var checkNextIteration = function() {

        var curIndex = curGrid.getIndex(cur_x, cur_y);
        if (curIndex != undefined) {
            colSelection[cur_x][curIndex] = true;
            rowSelection[cur_y][curIndex] = true;
        }

        var nextIndex = curIndex;

        if (nextIndex == undefined)
            nextIndex = 0;
        else
            nextIndex++;

        while (nextIndex < getGameSize() && !(colSelection[cur_x][nextIndex] && rowSelection[cur_y][nextIndex])) {
            nextIndex++;
        }

        if (nextIndex < getGameSize()) {
            curGrid.set($scope.game.values[nextIndex], nextIndex, cur_x, cur_y);
            if (validate(curGrid)) {

                colSelection[cur_x][nextIndex] = false;
                rowSelection[cur_y][nextIndex] = false;

                cur_x++;
                if (cur_x >= getGameSize()) {
                    cur_x = 0;
                    cur_y++;
                    if (cur_y >= getGameSize()) {
                        cur_x = getGameSize() - 1;
                        cur_y = getGameSize() - 1;
                        return true;
                    }
                }
            }
        }
        else {
            curGrid.set(undefined, undefined, cur_x, cur_y);
            cur_x--;
            if (cur_x < 0) {
                cur_x = getGameSize() - 1;
                cur_y--;
                if (cur_y < 0) {
                    cur_x = 0;
                    cur_y = 0;
                }
            }
        }
    }

    // make sure each cage has the right number of cells for the operator
    //  return true if OK and false if not
    var checkEachCageForCellCount = function() {
        for (var i = 0; i < $scope.game.cages.length; i++) {
            var cage = $scope.game.cages[i];
            switch (cage.operator) {
                case '=':
                    if ( cage.cells.length != 1 ) {
                        alert("Cage with = should have only one cell");
                        return false;
                    }
                    break;
                case '+':
                    if ( cage.cells.length < 2 ) {
                        alert("Cage with + should have more than one cell");
                        return false;
                    }
                    break;
                case '-':
                    if ( cage.cells.length != 2 ) {
                        alert("Cage with - should have only 2 cells");
                        return false;
                    }
                    break;
                case 'x':
                    if ( cage.cells.length < 2 ) {
                        alert("Cage with x should have more than one cell");
                        return false;
                    }
                    break;
                case '%':
                    if ( cage.cells.length != 2 ) {
                        alert("Cage with % should have only one cell");
                        return false;
                    }
                    break;
                default:
                    alert("Strange operator for a cage: " + cage.operator);
                    return false;
            }
        }
        return true;
    }


    // make sure each cage works with this combination of rows and columns
    var validate = function(curGrid) {
        for (var i = 0; i < $scope.game.cages.length; i++) {
            var cage = $scope.game.cages[i];

            if (!validateCage(cage, curGrid)) {
                return false;
            }
        }

        // if you get here, all the rules are valid or else there are undefined cells
        return true;
    }

    var validateCage = function(cage, curGrid) {

        switch (cage.operator) {
            case '=':
                var cell = cage.cells[0];
                var val = curGrid.get(cell);
                if (val == undefined) {
                    return true;
                }
                if (val != cage.operand) {
                    return false;
                }
                break;
            case '+':
                var sum = 0;
                for (var j = 0; j < cage.cells.length; j++) {
                    var cell = cage.cells[j];
                    var val = curGrid.get(cell);
                    if (val == undefined) {
                        return true;
                    }
                    sum += val;
                }
                if (sum != cage.operand) {
                    return false;
                }
                break;
            case '-':
                var val1 = curGrid.get(cage.cells[0]);
                if (val1 == undefined) {
                    return true;
                }
                var val2 = curGrid.get(cage.cells[1]);
                if (val2 == undefined) {
                    return true;
                }
                var diff = val1 - val2;
                diff = Math.abs(diff);
                if (diff != cage.operand) {
                    return false;
                }
                break;
            case 'x':
                var prod = 1;
                for (var j = 0; j < cage.cells.length; j++) {
                    var cell = cage.cells[j];
                    var val = curGrid.get(cell);
                    if (val == undefined) {
                        return true;
                    }
                    prod *= val;
                }
                if (prod != cage.operand) {
                    return false;
                }
                break;
            case '%':
                var div = 0;
                var val1 = curGrid.get(cage.cells[0]);
                if (val1 == undefined) {
                    return true;
                }
                var val2 = curGrid.get(cage.cells[1]);
                if (val2 == undefined) {
                    return true;
                }
                if (val1 > val2) {
                    div = val1 / val2;
                    // check the remainder to make sure there is none
                    if (val1 % val2 != 0) {
                        return false;
                    }
                } else {
                    div = val2 / val1;
                    if (val2 % val1 != 0) {
                        return false;
                    }
                }
                if (div != cage.operand) {
                    return false;
                }
                break;
            default:
                alert("Strange operator for a cage: " + cage.operator);
        } // switch

        return true;
    }

    // get started with 7x7 - needs to be defined AFTER all functions it uses
    $scope.newGame(7);

}]);