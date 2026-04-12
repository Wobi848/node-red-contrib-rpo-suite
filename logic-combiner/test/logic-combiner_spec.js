const helper = require("node-red-node-test-helper");
const logicCombinerNode = require("../logic-combiner.js");
const assert = require("assert");

helper.init(require.resolve('node-red'));

describe('logic-combiner Node', function() {

    afterEach(function(done) {
        helper.unload();
        done();
    });

    it('should be loaded', function(done) {
        const flow = [{ id: "n1", type: "logic-combiner", name: "test combiner" }];
        helper.load(logicCombinerNode, flow, function() {
            const n1 = helper.getNode("n1");
            assert.strictEqual(n1.name, 'test combiner');
            done();
        });
    });

    // AND Tests
    describe('AND Operator', function() {

        it('should output true when all inputs are true (all AND)', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "AND" },
                        { topic: "b", label: "B", invert: false, operator: "AND" }
                    ],
                    minTopics: "2",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    done();
                });

                n1.receive({ topic: "a", payload: true });
                n1.receive({ topic: "b", payload: true });
            });
        });

        it('should output false when any input is false (all AND)', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "AND" },
                        { topic: "b", label: "B", invert: false, operator: "AND" }
                    ],
                    minTopics: "2",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, false);
                    done();
                });

                n1.receive({ topic: "a", payload: true });
                n1.receive({ topic: "b", payload: false });
            });
        });
    });

    // OR Tests
    describe('OR Operator', function() {

        it('should output true when any input is true (all OR)', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "OR" },
                        { topic: "b", label: "B", invert: false, operator: "OR" }
                    ],
                    minTopics: "2",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    done();
                });

                n1.receive({ topic: "a", payload: false });
                n1.receive({ topic: "b", payload: true });
            });
        });

        it('should output false when all inputs are false (all OR)', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "OR" },
                        { topic: "b", label: "B", invert: false, operator: "OR" }
                    ],
                    minTopics: "2",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, false);
                    done();
                });

                n1.receive({ topic: "a", payload: false });
                n1.receive({ topic: "b", payload: false });
            });
        });
    });

    // Mixed Operators Tests
    describe('Mixed Operators', function() {

        it('should calculate (true AND true) OR false = true', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "AND" },
                        { topic: "b", label: "B", invert: false, operator: "AND" },
                        { topic: "c", label: "C", invert: false, operator: "OR" }
                    ],
                    minTopics: "3",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    // (true AND true) OR false = true OR false = true
                    assert.strictEqual(msg.payload, true);
                    done();
                });

                n1.receive({ topic: "a", payload: true });
                n1.receive({ topic: "b", payload: true });
                n1.receive({ topic: "c", payload: false });
            });
        });

        it('should calculate (true AND false) OR true = true', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "AND" },
                        { topic: "b", label: "B", invert: false, operator: "AND" },
                        { topic: "c", label: "C", invert: false, operator: "OR" }
                    ],
                    minTopics: "3",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    // (true AND false) OR true = false OR true = true
                    assert.strictEqual(msg.payload, true);
                    done();
                });

                n1.receive({ topic: "a", payload: true });
                n1.receive({ topic: "b", payload: false });
                n1.receive({ topic: "c", payload: true });
            });
        });

        it('should calculate (true AND false) OR false = false', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "AND" },
                        { topic: "b", label: "B", invert: false, operator: "AND" },
                        { topic: "c", label: "C", invert: false, operator: "OR" }
                    ],
                    minTopics: "3",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    // (true AND false) OR false = false OR false = false
                    assert.strictEqual(msg.payload, false);
                    done();
                });

                n1.receive({ topic: "a", payload: true });
                n1.receive({ topic: "b", payload: false });
                n1.receive({ topic: "c", payload: false });
            });
        });

        it('should calculate (false OR true) AND true = true', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "OR" },
                        { topic: "b", label: "B", invert: false, operator: "OR" },
                        { topic: "c", label: "C", invert: false, operator: "AND" }
                    ],
                    minTopics: "3",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    // (false OR true) AND true = true AND true = true
                    assert.strictEqual(msg.payload, true);
                    done();
                });

                n1.receive({ topic: "a", payload: false });
                n1.receive({ topic: "b", payload: true });
                n1.receive({ topic: "c", payload: true });
            });
        });
    });

    // Inversion Tests
    describe('Inversion', function() {

        it('should invert input when configured', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "AND" },
                        { topic: "b", label: "B", invert: true, operator: "AND" }
                    ],
                    minTopics: "2",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    // a=true, b=false inverted to true → AND = true
                    assert.strictEqual(msg.payload, true);
                    done();
                });

                n1.receive({ topic: "a", payload: true });
                n1.receive({ topic: "b", payload: false }); // Will be inverted to true
            });
        });

        it('should combine inversion with OR operator', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "AND" },
                        { topic: "b", label: "B", invert: true, operator: "OR" }
                    ],
                    minTopics: "2",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    // a=false, b=true inverted to false → false OR false = false
                    assert.strictEqual(msg.payload, false);
                    done();
                });

                n1.receive({ topic: "a", payload: false });
                n1.receive({ topic: "b", payload: true }); // Inverted to false
            });
        });
    });

    // MinTopics
    describe('MinTopics', function() {

        it('should wait until minTopics is reached', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "AND" },
                        { topic: "b", label: "B", invert: false, operator: "AND" },
                        { topic: "c", label: "C", invert: false, operator: "AND" }
                    ],
                    minTopics: "3",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ topic: "a", payload: true }); // 1/3 - no output
                n1.receive({ topic: "b", payload: true }); // 2/3 - no output
                n1.receive({ topic: "c", payload: true }); // 3/3 - output!

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 1);
                    assert.strictEqual(outputs[0], true);
                    done();
                }, 50);
            });
        });
    });

    // Truthy/Falsy
    describe('Truthy/Falsy Handling', function() {

        it('should treat "off" as false', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "AND" },
                        { topic: "b", label: "B", invert: false, operator: "AND" }
                    ],
                    minTopics: "2",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, false);
                    done();
                });

                n1.receive({ topic: "a", payload: true });
                n1.receive({ topic: "b", payload: "off" });
            });
        });

        it('should treat "on" as true', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "AND" },
                        { topic: "b", label: "B", invert: false, operator: "AND" }
                    ],
                    minTopics: "2",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    done();
                });

                n1.receive({ topic: "a", payload: "on" });
                n1.receive({ topic: "b", payload: 1 });
            });
        });
    });

    // Reset
    describe('Reset', function() {

        it('should reset all values', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "AND" },
                        { topic: "b", label: "B", invert: false, operator: "AND" }
                    ],
                    minTopics: "2",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ topic: "a", payload: true });
                n1.receive({ topic: "b", payload: true }); // Output 1
                n1.receive({ reset: true }); // Reset
                n1.receive({ topic: "a", payload: true }); // 1/2 - no output
                n1.receive({ topic: "b", payload: false }); // Output 2

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 2);
                    assert.strictEqual(outputs[0], true);
                    assert.strictEqual(outputs[1], false);
                    done();
                }, 50);
            });
        });
    });

    // Unknown topic
    describe('Error Handling', function() {

        it('should warn for unknown topic', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "AND" }
                    ],
                    minTopics: "1",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg);
                });

                n1.receive({ topic: "unknown", payload: true }); // Unknown - ignored

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 0);
                    done();
                }, 50);
            });
        });
    });

    // Initial Value
    describe('Initial Value', function() {

        it('should use initial value for topics', function(done) {
            const flow = [
                {
                    id: "n1", type: "logic-combiner",
                    topics: [
                        { topic: "a", label: "A", invert: false, operator: "AND" },
                        { topic: "b", label: "B", invert: false, operator: "AND" }
                    ],
                    minTopics: "2",
                    initialValue: "true",
                    wires: [["n2"]]
                },
                { id: "n2", type: "helper" }
            ];

            helper.load(logicCombinerNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    // a=false (new value), b=true (initial) → AND = false
                    assert.strictEqual(msg.payload, false);
                    done();
                });

                // Only send one topic - the other should use initial value
                n1.receive({ topic: "a", payload: false });
            });
        });
    });

});
