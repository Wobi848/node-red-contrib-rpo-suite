const helper = require("node-red-node-test-helper");
const srLatchNode = require("../sr-latch.js");
const assert = require("assert");

helper.init(require.resolve('node-red'));

describe('sr-latch Node', function() {

    afterEach(function(done) {
        helper.unload();
        done();
    });

    it('should be loaded', function(done) {
        const flow = [{ id: "n1", type: "sr-latch", name: "test latch" }];
        helper.load(srLatchNode, flow, function() {
            const n1 = helper.getNode("n1");
            assert.strictEqual(n1.name, 'test latch');
            done();
        });
    });

    // Set tests
    describe('Set Action', function() {

        it('should set state with topic "set"', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.action, "set");
                    assert.strictEqual(msg.previousState, false);
                    done();
                });

                n1.receive({ topic: "set" });
            });
        });

        it('should set state with payload true', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.action, "set");
                    done();
                });

                n1.receive({ payload: true });
            });
        });

        it('should set state with payload 1', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.action, "set");
                    done();
                });

                n1.receive({ payload: 1 });
            });
        });

        it('should set state with payload "on"', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.action, "set");
                    done();
                });

                n1.receive({ payload: "on" });
            });
        });
    });

    // Reset tests
    describe('Reset Action', function() {

        it('should reset state with topic "reset"', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, false);
                    assert.strictEqual(msg.action, "reset");
                    assert.strictEqual(msg.previousState, true);
                    done();
                });

                n1.receive({ topic: "reset" });
            });
        });

        it('should reset state with payload false', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, false);
                    assert.strictEqual(msg.action, "reset");
                    done();
                });

                n1.receive({ payload: false });
            });
        });

        it('should reset state with payload 0', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, false);
                    assert.strictEqual(msg.action, "reset");
                    done();
                });

                n1.receive({ payload: 0 });
            });
        });

        it('should reset state with payload "off"', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, false);
                    assert.strictEqual(msg.action, "reset");
                    done();
                });

                n1.receive({ payload: "off" });
            });
        });
    });

    // Toggle tests
    describe('Toggle Action', function() {

        it('should toggle from false to true', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.action, "toggle");
                    assert.strictEqual(msg.previousState, false);
                    done();
                });

                n1.receive({ topic: "toggle" });
            });
        });

        it('should toggle from true to false', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, false);
                    assert.strictEqual(msg.action, "toggle");
                    assert.strictEqual(msg.previousState, true);
                    done();
                });

                n1.receive({ payload: "toggle" });
            });
        });

        it('should toggle multiple times', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var count = 0;
                var states = [];

                n2.on("input", function(msg) {
                    count++;
                    states.push(msg.payload);
                    if (count === 3) {
                        assert.deepStrictEqual(states, [true, false, true]);
                        done();
                    }
                });

                n1.receive({ topic: "toggle" });
                n1.receive({ topic: "toggle" });
                n1.receive({ topic: "toggle" });
            });
        });
    });

    // Output mode tests
    describe('Output Mode', function() {

        it('should not output when state does not change (change mode)', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "true", outputMode: "change", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var received = false;
                n2.on("input", function(msg) {
                    received = true;
                });

                n1.receive({ payload: true }); // Already true, no change

                setTimeout(function() {
                    assert.strictEqual(received, false);
                    done();
                }, 50);
            });
        });

        it('should output when state does not change (always mode)', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "true", outputMode: "always", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.action, "set");
                    done();
                });

                n1.receive({ payload: true }); // Already true, but always mode outputs
            });
        });
    });

    // Topic priority tests
    describe('Topic Priority', function() {

        it('should prioritize topic over payload', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    // Topic says "set" but payload says "reset" - topic wins
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.action, "set");
                    done();
                });

                n1.receive({ topic: "set", payload: "reset" });
            });
        });
    });

    // Error handling
    describe('Error Handling', function() {

        it('should error on invalid input', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");

                n1.on("call:error", function(call) {
                    assert(call.firstArg.includes("Invalid input"));
                    done();
                });

                n1.receive({ payload: "invalid" });
            });
        });

        it('should error on number other than 0/1', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");

                n1.on("call:error", function(call) {
                    assert(call.firstArg.includes("Invalid input"));
                    done();
                });

                n1.receive({ payload: 42 });
            });
        });
    });

    // State persistence tests
    describe('State Persistence', function() {

        it('should retain state after multiple operations', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var count = 0;
                n2.on("input", function(msg) {
                    count++;
                    if (count === 1) {
                        assert.strictEqual(msg.payload, true); // set
                    } else if (count === 2) {
                        assert.strictEqual(msg.payload, false); // reset
                    } else if (count === 3) {
                        assert.strictEqual(msg.payload, true); // set again
                        done();
                    }
                });

                n1.receive({ topic: "set" });
                n1.receive({ topic: "reset" });
                n1.receive({ topic: "set" });
            });
        });
    });

    // Initial state tests
    describe('Initial State', function() {

        it('should start with initial state true', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "true", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    // Reset from true initial state
                    assert.strictEqual(msg.payload, false);
                    assert.strictEqual(msg.previousState, true);
                    done();
                });

                n1.receive({ topic: "reset" });
            });
        });

        it('should start with initial state false', function(done) {
            const flow = [
                { id: "n1", type: "sr-latch", initialState: "false", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(srLatchNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    // Set from false initial state
                    assert.strictEqual(msg.payload, true);
                    assert.strictEqual(msg.previousState, false);
                    done();
                });

                n1.receive({ topic: "set" });
            });
        });
    });

});
