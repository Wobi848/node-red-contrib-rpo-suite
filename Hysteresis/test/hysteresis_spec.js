const helper = require("node-red-node-test-helper");
const hysteresisNode = require("../hysteresis.js");
const assert = require("assert");

helper.init(require.resolve('node-red'));

describe('hysteresis Node', function() {

    afterEach(function(done) {
        helper.unload();
        done();
    });

    it('should be loaded', function(done) {
        const flow = [{ id: "n1", type: "hysteresis", name: "test hysteresis" }];
        helper.load(hysteresisNode, flow, function() {
            const n1 = helper.getNode("n1");
            assert.strictEqual(n1.name, 'test hysteresis');
            done();
        });
    });

    // Mode "high" tests: ON when >= setpoint, OFF when <= setpoint - hysteresis
    describe('Mode: high', function() {

        it('should output true when value >= setpoint', function(done) {
            const flow = [
                { id: "n1", type: "hysteresis", setpoint: "50", hysteresis: "5", mode: "high", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(hysteresisNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    done();
                });

                n1.receive({ payload: 50 }); // >= 50
            });
        });

        it('should output false when value <= setpoint - hysteresis', function(done) {
            const flow = [
                { id: "n1", type: "hysteresis", setpoint: "50", hysteresis: "5", mode: "high", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(hysteresisNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, false);
                    done();
                });

                n1.receive({ payload: 45 }); // <= 45 (50-5)
            });
        });

        it('should keep state when value is between thresholds', function(done) {
            const flow = [
                { id: "n1", type: "hysteresis", setpoint: "50", hysteresis: "5", mode: "high", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(hysteresisNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true); // stays true
                    done();
                });

                n1.receive({ payload: 47 }); // between 45 and 50
            });
        });

        it('should handle full hysteresis cycle', function(done) {
            const flow = [
                { id: "n1", type: "hysteresis", setpoint: "50", hysteresis: "5", mode: "high", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(hysteresisNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                const expectedResults = [
                    { value: 40, expected: false },  // <= 45 → false
                    { value: 47, expected: false },  // between → stays false
                    { value: 50, expected: true },   // >= 50 → true
                    { value: 47, expected: true },   // between → stays true
                    { value: 45, expected: false }   // <= 45 → false
                ];

                let step = 0;

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, expectedResults[step].expected,
                        `Step ${step}: value ${expectedResults[step].value} expected ${expectedResults[step].expected}, got ${msg.payload}`);
                    step++;

                    if (step < expectedResults.length) {
                        n1.receive({ payload: expectedResults[step].value });
                    } else {
                        done();
                    }
                });

                n1.receive({ payload: expectedResults[0].value });
            });
        });
    });

    // Mode "low" tests: ON when <= setpoint, OFF when >= setpoint + hysteresis
    describe('Mode: low', function() {

        it('should output true when value <= setpoint', function(done) {
            const flow = [
                { id: "n1", type: "hysteresis", setpoint: "50", hysteresis: "5", mode: "low", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(hysteresisNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    done();
                });

                n1.receive({ payload: 50 }); // <= 50
            });
        });

        it('should output false when value >= setpoint + hysteresis', function(done) {
            const flow = [
                { id: "n1", type: "hysteresis", setpoint: "50", hysteresis: "5", mode: "low", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(hysteresisNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, false);
                    done();
                });

                n1.receive({ payload: 55 }); // >= 55 (50+5)
            });
        });

        it('should handle full hysteresis cycle in low mode', function(done) {
            const flow = [
                { id: "n1", type: "hysteresis", setpoint: "50", hysteresis: "5", mode: "low", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(hysteresisNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                const expectedResults = [
                    { value: 60, expected: false },  // >= 55 → false
                    { value: 52, expected: false },  // between → stays false
                    { value: 50, expected: true },   // <= 50 → true
                    { value: 52, expected: true },   // between → stays true
                    { value: 55, expected: false }   // >= 55 → false
                ];

                let step = 0;

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, expectedResults[step].expected,
                        `Step ${step}: value ${expectedResults[step].value} expected ${expectedResults[step].expected}, got ${msg.payload}`);
                    step++;

                    if (step < expectedResults.length) {
                        n1.receive({ payload: expectedResults[step].value });
                    } else {
                        done();
                    }
                });

                n1.receive({ payload: expectedResults[0].value });
            });
        });
    });

    // Initial state tests
    describe('Initial State', function() {

        it('should use initialState = true', function(done) {
            const flow = [
                { id: "n1", type: "hysteresis", setpoint: "50", hysteresis: "5", mode: "high", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(hysteresisNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.previousState, true);
                    done();
                });

                n1.receive({ payload: 47 }); // between thresholds
            });
        });

        it('should use initialState = false', function(done) {
            const flow = [
                { id: "n1", type: "hysteresis", setpoint: "50", hysteresis: "5", mode: "high", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(hysteresisNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, false);
                    assert.strictEqual(msg.previousState, false);
                    done();
                });

                n1.receive({ payload: 47 }); // between thresholds
            });
        });

        it('should use initialState = undefined', function(done) {
            const flow = [
                { id: "n1", type: "hysteresis", setpoint: "50", hysteresis: "5", mode: "high", initialState: "undefined", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(hysteresisNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, undefined);
                    assert.strictEqual(msg.previousState, undefined);
                    done();
                });

                n1.receive({ payload: 47 }); // between thresholds
            });
        });
    });

    // Error handling tests
    describe('Error Handling', function() {

        it('should error on non-numeric input', function(done) {
            const flow = [
                { id: "n1", type: "hysteresis", setpoint: "50", hysteresis: "5", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(hysteresisNode, flow, function() {
                const n1 = helper.getNode("n1");

                n1.on("call:error", function(call) {
                    assert(call.firstArg.includes("not a valid number"));
                    done();
                });

                n1.receive({ payload: "not a number" });
            });
        });

        it('should error on NaN input', function(done) {
            const flow = [
                { id: "n1", type: "hysteresis", setpoint: "50", hysteresis: "5", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(hysteresisNode, flow, function() {
                const n1 = helper.getNode("n1");

                n1.on("call:error", function(call) {
                    assert(call.firstArg.includes("not a valid number"));
                    done();
                });

                n1.receive({ payload: NaN });
            });
        });
    });

    // Output message tests
    describe('Output Message', function() {

        it('should include all expected fields in output', function(done) {
            const flow = [
                { id: "n1", type: "hysteresis", setpoint: "50", hysteresis: "5", mode: "high", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(hysteresisNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.value, 55);
                    assert.strictEqual(msg.previousState, false);
                    assert.strictEqual(msg.setpoint, 50);
                    assert.strictEqual(msg.hysteresis, 5);
                    assert.strictEqual(msg.mode, "high");
                    done();
                });

                n1.receive({ payload: 55 });
            });
        });
    });

});
