const helper = require("node-red-node-test-helper");
const pulseEdgeNode = require("../pulse-edge.js");
const assert = require("assert");

helper.init(require.resolve('node-red'));

describe('pulse-edge Node', function() {

    afterEach(function(done) {
        helper.unload();
        done();
    });

    it('should be loaded', function(done) {
        const flow = [{ id: "n1", type: "pulse-edge", name: "test pulse" }];
        helper.load(pulseEdgeNode, flow, function() {
            const n1 = helper.getNode("n1");
            assert.strictEqual(n1.name, 'test pulse');
            done();
        });
    });

    // Rising edge tests
    describe('Mode: rising', function() {

        it('should output on rising edge', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "rising", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.edge, "rising");
                    done();
                });

                n1.receive({ payload: true }); // false → true = rising
            });
        });

        it('should not output on falling edge in rising mode', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "rising", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var received = false;
                n2.on("input", function(msg) {
                    received = true;
                });

                n1.receive({ payload: false }); // true → false = falling (ignored)

                setTimeout(function() {
                    assert.strictEqual(received, false);
                    done();
                }, 50);
            });
        });

        it('should not output when no change', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "rising", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var received = false;
                n2.on("input", function(msg) {
                    received = true;
                });

                n1.receive({ payload: true }); // true → true = no change

                setTimeout(function() {
                    assert.strictEqual(received, false);
                    done();
                }, 50);
            });
        });
    });

    // Falling edge tests
    describe('Mode: falling', function() {

        it('should output on falling edge', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "falling", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.edge, "falling");
                    done();
                });

                n1.receive({ payload: false }); // true → false = falling
            });
        });

        it('should not output on rising edge in falling mode', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "falling", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var received = false;
                n2.on("input", function(msg) {
                    received = true;
                });

                n1.receive({ payload: true }); // false → true = rising (ignored)

                setTimeout(function() {
                    assert.strictEqual(received, false);
                    done();
                }, 50);
            });
        });
    });

    // Both edges tests
    describe('Mode: both', function() {

        it('should output on rising edge', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "both", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.edge, "rising");
                    done();
                });

                n1.receive({ payload: true });
            });
        });

        it('should output on falling edge', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "both", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.edge, "falling");
                    done();
                });

                n1.receive({ payload: false });
            });
        });

        it('should output on both edges in sequence', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "both", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var count = 0;
                var edges = [];

                n2.on("input", function(msg) {
                    count++;
                    edges.push(msg.edge);
                    if (count === 2) {
                        assert.strictEqual(edges[0], "rising");
                        assert.strictEqual(edges[1], "falling");
                        done();
                    }
                });

                n1.receive({ payload: true });  // rising
                n1.receive({ payload: false }); // falling
            });
        });
    });

    // Initial state tests
    describe('Initial State', function() {

        it('should not output on first message when initialState is undefined', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "rising", initialState: "undefined", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var received = false;
                n2.on("input", function(msg) {
                    received = true;
                });

                n1.receive({ payload: true }); // first message, just sets state

                setTimeout(function() {
                    assert.strictEqual(received, false);
                    done();
                }, 50);
            });
        });

        it('should output on second message after undefined initialState', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "rising", initialState: "undefined", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.edge, "rising");
                    done();
                });

                n1.receive({ payload: false }); // sets state to false
                n1.receive({ payload: true });  // false → true = rising
            });
        });
    });

    // Error handling
    describe('Error Handling', function() {

        it('should error on non-boolean input', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "rising", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");

                n1.on("call:error", function(call) {
                    assert(call.firstArg.includes("not a boolean"));
                    done();
                });

                n1.receive({ payload: "not a boolean" });
            });
        });

        it('should error on invalid number input', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "rising", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");

                n1.on("call:error", function(call) {
                    assert(call.firstArg.includes("not a boolean or 0/1"));
                    done();
                });

                n1.receive({ payload: 123 });
            });
        });
    });

    // Number 0/1 support
    describe('Number 0/1 Support', function() {

        it('should accept 0 as false', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "falling", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.edge, "falling");
                    done();
                });

                n1.receive({ payload: 0 }); // true → 0 (false) = falling
            });
        });

        it('should accept 1 as true', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "rising", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.edge, "rising");
                    done();
                });

                n1.receive({ payload: 1 }); // false → 1 (true) = rising
            });
        });
    });

    // Output message tests
    describe('Output Message', function() {

        it('should include all expected fields in output', function(done) {
            const flow = [
                { id: "n1", type: "pulse-edge", mode: "rising", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(pulseEdgeNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.edge, "rising");
                    assert.strictEqual(msg.previousState, false);
                    done();
                });

                n1.receive({ payload: true });
            });
        });
    });

});
