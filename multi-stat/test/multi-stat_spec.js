const helper = require("node-red-node-test-helper");
const multiStatNode = require("../multi-stat.js");
const assert = require("assert");

helper.init(require.resolve('node-red'));

describe('multi-stat Node', function() {

    afterEach(function(done) {
        helper.unload();
        done();
    });

    it('should be loaded', function(done) {
        const flow = [{ id: "n1", type: "multi-stat", name: "test multi-stat" }];
        helper.load(multiStatNode, flow, function() {
            const n1 = helper.getNode("n1");
            assert.strictEqual(n1.name, 'test multi-stat');
            done();
        });
    });

    // Basic functionality
    describe('Basic Statistics', function() {

        it('should output stats for single topic', function(done) {
            const flow = [
                { id: "n1", type: "multi-stat", decimals: "2", minTopics: "1", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(multiStatNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload.min, 21.5);
                    assert.strictEqual(msg.payload.max, 21.5);
                    assert.strictEqual(msg.payload.avg, 21.5);
                    assert.strictEqual(msg.payload.count, 1);
                    assert.strictEqual(msg.payload.values.room1, 21.5);
                    done();
                });

                n1.receive({ topic: "room1", payload: 21.5 });
            });
        });

        it('should calculate min/max/avg for multiple topics', function(done) {
            const flow = [
                { id: "n1", type: "multi-stat", decimals: "2", minTopics: "1", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(multiStatNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var count = 0;
                n2.on("input", function(msg) {
                    count++;
                    if (count === 3) {
                        assert.strictEqual(msg.payload.min, 19.8);
                        assert.strictEqual(msg.payload.max, 23.1);
                        assert.strictEqual(msg.payload.avg, 21.47);
                        assert.strictEqual(msg.payload.count, 3);
                        done();
                    }
                });

                n1.receive({ topic: "room1", payload: 21.5 });
                n1.receive({ topic: "room2", payload: 19.8 });
                n1.receive({ topic: "room3", payload: 23.1 });
            });
        });

        it('should update existing topic value', function(done) {
            const flow = [
                { id: "n1", type: "multi-stat", decimals: "2", minTopics: "1", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(multiStatNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var count = 0;
                n2.on("input", function(msg) {
                    count++;
                    if (count === 3) {
                        // room1 updated from 20 to 25
                        assert.strictEqual(msg.payload.values.room1, 25);
                        assert.strictEqual(msg.payload.min, 22);
                        assert.strictEqual(msg.payload.max, 25);
                        assert.strictEqual(msg.payload.count, 2);
                        done();
                    }
                });

                n1.receive({ topic: "room1", payload: 20 });
                n1.receive({ topic: "room2", payload: 22 });
                n1.receive({ topic: "room1", payload: 25 }); // Update room1
            });
        });
    });

    // minTopics
    describe('Min Topics', function() {

        it('should wait until minTopics is reached', function(done) {
            const flow = [
                { id: "n1", type: "multi-stat", decimals: "2", minTopics: "3", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(multiStatNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ topic: "room1", payload: 20 }); // 1/3 - no output
                n1.receive({ topic: "room2", payload: 22 }); // 2/3 - no output
                n1.receive({ topic: "room3", payload: 24 }); // 3/3 - output!

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 1);
                    assert.strictEqual(outputs[0].count, 3);
                    done();
                }, 50);
            });
        });
    });

    // Reset and Remove
    describe('Reset and Remove', function() {

        it('should reset all values', function(done) {
            const flow = [
                { id: "n1", type: "multi-stat", decimals: "2", minTopics: "1", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(multiStatNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var count = 0;
                n2.on("input", function(msg) {
                    count++;
                    if (count === 3) {
                        // After reset, only room3 should exist
                        assert.strictEqual(msg.payload.count, 1);
                        assert.strictEqual(msg.payload.values.room3, 30);
                        done();
                    }
                });

                n1.receive({ topic: "room1", payload: 20 });
                n1.receive({ topic: "room2", payload: 22 });
                n1.receive({ reset: true });
                n1.receive({ topic: "room3", payload: 30 });
            });
        });

        it('should remove single topic', function(done) {
            const flow = [
                { id: "n1", type: "multi-stat", decimals: "2", minTopics: "1", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(multiStatNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var lastOutput;
                n2.on("input", function(msg) {
                    lastOutput = msg.payload;
                });

                n1.receive({ topic: "room1", payload: 20 });
                n1.receive({ topic: "room2", payload: 22 });
                n1.receive({ topic: "room1", remove: true });

                setTimeout(function() {
                    assert.strictEqual(lastOutput.count, 1);
                    assert.strictEqual(lastOutput.values.room1, undefined);
                    assert.strictEqual(lastOutput.values.room2, 22);
                    done();
                }, 50);
            });
        });
    });

    // Error handling
    describe('Error Handling', function() {

        it('should warn when topic is missing', function(done) {
            const flow = [
                { id: "n1", type: "multi-stat", decimals: "2", minTopics: "1", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(multiStatNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg);
                });

                n1.receive({ payload: 20 }); // No topic

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 0);
                    done();
                }, 50);
            });
        });

        it('should warn when payload is not a number', function(done) {
            const flow = [
                { id: "n1", type: "multi-stat", decimals: "2", minTopics: "1", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(multiStatNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg);
                });

                n1.receive({ topic: "room1", payload: "hello" });

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 0);
                    done();
                }, 50);
            });
        });
    });

    // Decimals
    describe('Decimals', function() {

        it('should round to configured decimals', function(done) {
            const flow = [
                { id: "n1", type: "multi-stat", decimals: "1", minTopics: "1", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(multiStatNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var count = 0;
                n2.on("input", function(msg) {
                    count++;
                    if (count === 3) {
                        // avg of 21.5, 19.8, 23.1 = 21.466... → rounded to 21.5
                        assert.strictEqual(msg.payload.avg, 21.5);
                        done();
                    }
                });

                n1.receive({ topic: "room1", payload: 21.5 });
                n1.receive({ topic: "room2", payload: 19.8 });
                n1.receive({ topic: "room3", payload: 23.1 });
            });
        });
    });

});
