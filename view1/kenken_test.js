'use strict';

describe('KenKenApp module', function () {

    var scope;
    var log = {};
    var filter = {};
    var interval = {};

    var kenkenCtrl;


    beforeEach(module('KenKenApp'));

    beforeEach(inject(function ($controller, $rootScope, $log, $interval, $filter) {
        scope = $rootScope.$new();
        log = $log;
        filter = $filter;
        interval = $interval;

        kenkenCtrl = $controller('KenKenCtrl', {$scope: scope}, {$log: log}, {$filter: filter}, {$interval: interval});
        kenkenCtrl.$scope = scope;
    }));

    describe('KenKen controller', function () {

        it('should be defined', function () {
            //spec body
            expect(kenkenCtrl).toBeDefined();
        });

        it('$scope should be defined', function() {
            expect(kenkenCtrl.$scope).toBeDefined();
        })

        it('should create a new game of 4x4', function() {
    //        expect(scope).equals(kenkenCtrl.$scope);
            kenkenCtrl.$scope.newGame(4);
            expect(scope.game.rows).toBe(4)
            expect(scope.game.solving).toBe(false);
        });

        it('range(len) should return empty array of size 8', function(){
            var len = 8;
            var a = scope.range(len);
            expect(a.length == len);
            for(var i = 0; i < len; i++ ) {
                expect(a[i]).toBeUndefined();
            }
        });

        it('cellWidth should return 100% divided by # of cells', function() {
            scope.newGame(4);
            expect(scope.cellWidth()).toBe("25%");
            scope.newGame(7);
            expect(scope.cellWidth()).toBe("14%");
        });

        it('createNewCage should work', function() {
            var len = 4;
            scope.newGame(len);

            // init the row[] col[] array for 1,1
            var row = Array(len);
            row[1] = {"content": "", "cage": -1};
            row.row = 1;
            scope.onClick(null, row, 1);

            // this should throw an alert since there is no operand
            scope.createNewCage('=');
            expect(scope.game.cells[1][1].content).toBe("");

            // now it should work with the operand
            scope.operand = 33;
            scope.createNewCage('=');
            expect(scope.game.cells[1][1].content).toBe("33=");
            expect(scope.game.cells[1][1].cage).toBe(1);
            expect(scope.game.cells[1][1].top).toBe(true);
            expect(scope.game.cells[1][1].bottom).toBe(true);
            expect(scope.game.cells[1][1].left).toBe(true);
            expect(scope.game.cells[1][1].right).toBe(true);

        });

        it('fails correctly with too many operands for operator =', function() {
            var len = 4;
            scope.newGame(len);

            // init the row[] col[] array for 1,1
            var row = Array(len);
            row.row = 1;
            row[1] = {"content": "", "cage": -1};
            scope.onClick(null, row, 1);
            row[2] = {"content": "", "cage": -1};
            scope.onClick(null, row, 2);

            // now it should work with the operand
            scope.operand = 33;
            scope.createNewCage('=');
            expect(scope.game.cells[1][1].content).toBe("33=");
            expect(scope.game.cells[1][1].cage).toBe(0);
            expect(scope.game.cells[1][1].top).toBe(true);
            expect(scope.game.cells[1][1].bottom).toBe(true);
            expect(scope.game.cells[1][1].left).toBe(true);
            expect(scope.game.cells[1][1].right).toBe(false);

            expect(scope.game.cells[1][2].cage).toBe(0);
            expect(scope.game.cells[1][2].top).toBe(true);
            expect(scope.game.cells[1][2].bottom).toBe(true);
            expect(scope.game.cells[1][2].left).toBe(false);
            expect(scope.game.cells[1][2].right).toBe(true);

            expect(scope.showOneCell()).toBe(false);
            expect(scope.game.solving).toBe(false);

        } );

        it('solves a saved game2 correctly', inject(function($injector) {
            // Set up the mock http service responses
            var $httpBackend = $injector.get('$httpBackend');
            // backend definition common for all tests
            $httpBackend.when('GET', 'games/game2').respond(
                {
                    "rows": 7,
                    "cages": [
                        {
                            "operand": "6",
                            "operator": "-",
                            "cells": [
                                {
                                    "row": 0,
                                    "col": 0
                                },
                                {
                                    "row": 0,
                                    "col": 1
                                }
                            ]
                        },
                        {
                            "operand": "6",
                            "operator": "+",
                            "cells": [
                                {
                                    "row": 1,
                                    "col": 0
                                },
                                {
                                    "row": 1,
                                    "col": 1
                                }
                            ]
                        },
                        {
                            "operand": "6",
                            "operator": "x",
                            "cells": [
                                {
                                    "row": 5,
                                    "col": 5
                                },
                                {
                                    "row": 5,
                                    "col": 6
                                }
                            ]
                        },
                        {
                            "operand": "6",
                            "operator": "=",
                            "cells": [
                                {
                                    "row": 2,
                                    "col": 3
                                }
                            ]
                        },
                        {
                            "operand": "1",
                            "operator": "=",
                            "cells": [
                                {
                                    "row": 3,
                                    "col": 2
                                }
                            ]
                        },
                        {
                            "operand": "1",
                            "operator": "-",
                            "cells": [
                                {
                                    "row": 3,
                                    "col": 1
                                },
                                {
                                    "row": 4,
                                    "col": 1
                                }
                            ]
                        },
                        {
                            "operand": "12",
                            "operator": "+",
                            "cells": [
                                {
                                    "row": 6,
                                    "col": 5
                                },
                                {
                                    "row": 6,
                                    "col": 6
                                }
                            ]
                        },
                        {
                            "operand": "12",
                            "operator": "+",
                            "cells": [
                                {
                                    "row": 6,
                                    "col": 0
                                },
                                {
                                    "row": 6,
                                    "col": 1
                                },
                                {
                                    "row": 6,
                                    "col": 2
                                }
                            ]
                        },
                        {
                            "operand": "15",
                            "operator": "x",
                            "cells": [
                                {
                                    "row": 0,
                                    "col": 6
                                },
                                {
                                    "row": 1,
                                    "col": 6
                                },
                                {
                                    "row": 2,
                                    "col": 6
                                }
                            ]
                        },
                        {
                            "operand": "13",
                            "operator": "+",
                            "cells": [
                                {
                                    "row": 0,
                                    "col": 5
                                },
                                {
                                    "row": 1,
                                    "col": 5
                                },
                                {
                                    "row": 2,
                                    "col": 5
                                }
                            ]
                        },
                        {
                            "operand": "36",
                            "operator": "x",
                            "cells": [
                                {
                                    "row": 0,
                                    "col": 2
                                },
                                {
                                    "row": 0,
                                    "col": 3
                                },
                                {
                                    "row": 0,
                                    "col": 4
                                }
                            ]
                        },
                        {
                            "operand": "84",
                            "operator": "x",
                            "cells": [
                                {
                                    "row": 1,
                                    "col": 2
                                },
                                {
                                    "row": 1,
                                    "col": 3
                                },
                                {
                                    "row": 2,
                                    "col": 2
                                }
                            ]
                        },
                        {
                            "operand": "2",
                            "operator": "-",
                            "cells": [
                                {
                                    "row": 1,
                                    "col": 4
                                },
                                {
                                    "row": 2,
                                    "col": 4
                                }
                            ]
                        },
                        {
                            "operand": "15",
                            "operator": "+",
                            "cells": [
                                {
                                    "row": 3,
                                    "col": 3
                                },
                                {
                                    "row": 3,
                                    "col": 4
                                },
                                {
                                    "row": 3,
                                    "col": 5
                                }
                            ]
                        },
                        {
                            "operand": "24",
                            "operator": "x",
                            "cells": [
                                {
                                    "row": 3,
                                    "col": 6
                                },
                                {
                                    "row": 4,
                                    "col": 5
                                },
                                {
                                    "row": 4,
                                    "col": 6
                                }
                            ]
                        },
                        {
                            "operand": "7",
                            "operator": "=",
                            "cells": [
                                {
                                    "row": 4,
                                    "col": 4
                                }
                            ]
                        },
                        {
                            "operand": "10",
                            "operator": "x",
                            "cells": [
                                {
                                    "row": 4,
                                    "col": 3
                                },
                                {
                                    "row": 5,
                                    "col": 3
                                },
                                {
                                    "row": 5,
                                    "col": 4
                                }
                            ]
                        },
                        {
                            "operand": "3",
                            "operator": "%",
                            "cells": [
                                {
                                    "row": 6,
                                    "col": 3
                                },
                                {
                                    "row": 6,
                                    "col": 4
                                }
                            ]
                        },
                        {
                            "operand": "2",
                            "operator": "-",
                            "cells": [
                                {
                                    "row": 4,
                                    "col": 2
                                },
                                {
                                    "row": 5,
                                    "col": 2
                                }
                            ]
                        },
                        {
                            "operand": "9",
                            "operator": "+",
                            "cells": [
                                {
                                    "row": 4,
                                    "col": 0
                                },
                                {
                                    "row": 5,
                                    "col": 0
                                },
                                {
                                    "row": 5,
                                    "col": 1
                                }
                            ]
                        },
                        {
                            "operand": "10",
                            "operator": "+",
                            "cells": [
                                {
                                    "row": 2,
                                    "col": 0
                                },
                                {
                                    "row": 2,
                                    "col": 1
                                },
                                {
                                    "row": 3,
                                    "col": 0
                                }
                            ]
                        }
                    ]

                }
            );

            $httpBackend.expectGET('games/game2');
            scope.getGame('game2');
            $httpBackend.flush();
            expect(scope.solvePuzzleButDontShowSolution()).toBe(true);
            scope.showOneCell();
            expect(scope.game.cells[0][0].value).toBe(7);
            scope.showOneCell();
            scope.showOneCell();
            scope.showOneCell();
            scope.showOneCell();
            scope.showOneCell();
            scope.showOneCell();
            scope.showOneCell();
            scope.showOneCell();
            scope.showOneCell();
            scope.showOneCell();
            scope.showOneCell();
            scope.showOneCell();
            scope.showOneCell();
            expect(scope.game.cells[1][6].value).toBe(3);

        }));

    });
});