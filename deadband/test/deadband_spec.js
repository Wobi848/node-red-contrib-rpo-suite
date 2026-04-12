const helper = require("node-red-node-test-helper");
const deadbandNode = require("../deadband.js");
const assert = require("assert");

helper.init(require.resolve('node-red'));

describe('deadband Node', function() {

    afterEach(function(done) {
        helper.unload();
        done();
    });

    it('should be loaded', function(done) {
        const flow = [{ id: "n1", type: "deadband", name: "test deadband" }];
        helper.load(deadbandNode, flow, function() {
            const n1 = helper.getNode("n1");
            assert.strictEqual(n1.name, 'test deadband');
            done();
        });
    });

    // Basic functionality
    describe('Basic Filtering', function() {

        it('should pass first value through', function(done) {
            const flow = [
                { id: "n1", type: "deadband", deadband: "0.5", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(deadbandNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, 20.0);
                    done();
                });

                n1.receive({ payload: 20.0 });
            });
        });

        it('should block value within deadband', function(done) {
            const flow = [
                { id: "n1", type: "deadband", deadband: "0.5", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(deadbandNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ payload: 20.0 }); // First - passes
                n1.receive({ payload: 20.3 }); // Within deadband - blocked

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 1);
                    assert.strictEqual(outputs[0], 20.0);
                    done();
                }, 50);
            });
        });

        it('should pass value exceeding deadband', function(done) {
            const flow = [
                { id: "n1", type: "deadband", deadband: "0.5", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(deadbandNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ payload: 20.0 }); // First - passes
                n1.receive({ payload: 20.6 }); // Exceeds deadband - passes

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 2);
                    assert.strictEqual(outputs[0], 20.0);
                    assert.strictEqual(outputs[1], 20.6);
                    done();
                }, 50);
            });
        });

        it('should update reference after passing value', function(done) {
            const flow = [
                { id: "n1", type: "deadband", deadband: "0.5", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(deadbandNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ payload: 20.0 }); // Ref = 20.0
                n1.receive({ payload: 20.6 }); // Passes, Ref = 20.6
                n1.receive({ payload: 20.8 }); // Δ0.2 from 20.6 - blocked
                n1.receive({ payload: 21.2 }); // Δ0.6 from 20.6 - passes

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 3);
                    assert.strictEqual(outputs[0], 20.0);
                    assert.strictEqual(outputs[1], 20.6);
                    assert.strictEqual(outputs[2], 21.2);
                    done();
                }, 50);
            });
        });

        it('should handle negative changes', function(done) {
            const flow = [
                { id: "n1", type: "deadband", deadband: "0.5", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(deadbandNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ payload: 20.0 }); // Ref = 20.0
                n1.receive({ payload: 19.3 }); // Δ0.7 (negative) - passes

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 2);
                    assert.strictEqual(outputs[1], 19.3);
                    done();
                }, 50);
            });
        });
    });

    // Initial value
    describe('Initial Value', function() {

        it('should use initial value as reference', function(done) {
            const flow = [
                { id: "n1", type: "deadband", deadband: "0.5", initialValue: "20.0", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(deadbandNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ payload: 20.3 }); // Within deadband of initial - blocked
                n1.receive({ payload: 20.6 }); // Exceeds deadband - passes

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 1);
                    assert.strictEqual(outputs[0], 20.6);
                    done();
                }, 50);
            });
        });
    });

    // Runtime override
    describe('Runtime Override', function() {

        it('should override deadband via msg.deadband', function(done) {
            const flow = [
                { id: "n1", type: "deadband", deadband: "0.5", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(deadbandNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ payload: 20.0 }); // Ref = 20.0
                n1.receive({ payload: 20.3, deadband: 0.2 }); // Δ0.3 >= 0.2 - passes with override

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 2);
                    assert.strictEqual(outputs[1], 20.3);
                    done();
                }, 50);
            });
        });

        it('should reset reference with msg.reset', function(done) {
            const flow = [
                { id: "n1", type: "deadband", deadband: "0.5", initialValue: "20.0", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(deadbandNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ payload: 20.3 }); // Blocked (within deadband of 20.0)
                n1.receive({ reset: true }); // Reset
                n1.receive({ payload: 20.3 }); // Now passes (first after reset)

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 1);
                    assert.strictEqual(outputs[0], 20.3);
                    done();
                }, 50);
            });
        });
    });

    // Edge cases
    describe('Edge Cases', function() {

        it('should ignore non-numeric payloads', function(done) {
            const flow = [
                { id: "n1", type: "deadband", deadband: "0.5", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(deadbandNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ payload: "hello" });
                n1.receive({ payload: null });
                n1.receive({ payload: 20.0 }); // First numeric - passes

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 1);
                    assert.strictEqual(outputs[0], 20.0);
                    done();
                }, 50);
            });
        });

        it('should handle deadband of zero', function(done) {
            const flow = [
                { id: "n1", type: "deadband", deadband: "0", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(deadbandNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ payload: 20.0 }); // Passes
                n1.receive({ payload: 20.0 }); // Same value - blocked (Δ0 not >= 0)
                n1.receive({ payload: 20.001 }); // Any change - passes

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 2);
                    assert.strictEqual(outputs[0], 20.0);
                    assert.strictEqual(outputs[1], 20.001);
                    done();
                }, 50);
            });
        });

        it('should pass exact deadband value', function(done) {
            const flow = [
                { id: "n1", type: "deadband", deadband: "0.5", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(deadbandNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ payload: 20.0 }); // Ref = 20.0
                n1.receive({ payload: 20.5 }); // Δ0.5 exactly - passes

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 2);
                    assert.strictEqual(outputs[1], 20.5);
                    done();
                }, 50);
            });
        });
    });

});
