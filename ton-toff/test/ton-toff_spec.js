const helper = require("node-red-node-test-helper");
const tonToffNode = require("../ton-toff.js");
const assert = require("assert");

helper.init(require.resolve('node-red'));

describe('ton-toff Node', function() {

    afterEach(function(done) {
        helper.unload();
        done();
    });

    it('should be loaded', function(done) {
        const flow = [{ id: "n1", type: "ton-toff", name: "test timer" }];
        helper.load(tonToffNode, flow, function() {
            const n1 = helper.getNode("n1");
            assert.strictEqual(n1.name, 'test timer');
            done();
        });
    });

    // On Delay tests
    describe('On Delay', function() {

        it('should delay output ON', function(done) {
            this.timeout(3000);
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "100", offDelay: "0", delayUnit: "ms", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");
                const startTime = Date.now();

                n2.on("input", function(msg) {
                    const elapsed = Date.now() - startTime;
                    assert.strictEqual(msg.payload, true);
                    assert(elapsed >= 90, "Timer fired too early: " + elapsed + "ms");
                    done();
                });

                n1.receive({ payload: true });
            });
        });

        it('should cancel on-timer when input goes false', function(done) {
            this.timeout(3000);
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "200", offDelay: "0", delayUnit: "ms", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ payload: true }); // Start on-timer

                setTimeout(function() {
                    n1.receive({ payload: false }); // Cancel on-timer, immediate off
                }, 50);

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 1);
                    assert.strictEqual(outputs[0], false);
                    done();
                }, 300);
            });
        });

        it('should output immediately with onDelay=0', function(done) {
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "0", offDelay: "0", delayUnit: "ms", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");
                const startTime = Date.now();

                n2.on("input", function(msg) {
                    const elapsed = Date.now() - startTime;
                    assert.strictEqual(msg.payload, true);
                    assert(elapsed < 50, "Should be immediate");
                    done();
                });

                n1.receive({ payload: true });
            });
        });
    });

    // Off Delay tests
    describe('Off Delay', function() {

        it('should delay output OFF', function(done) {
            this.timeout(3000);
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "0", offDelay: "100", delayUnit: "ms", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var count = 0;
                var offTime;

                n2.on("input", function(msg) {
                    count++;
                    if (count === 1) {
                        assert.strictEqual(msg.payload, true);
                        offTime = Date.now();
                        n1.receive({ payload: false });
                    } else if (count === 2) {
                        const elapsed = Date.now() - offTime;
                        assert.strictEqual(msg.payload, false);
                        assert(elapsed >= 90, "Off timer fired too early: " + elapsed + "ms");
                        done();
                    }
                });

                n1.receive({ payload: true });
            });
        });

        it('should cancel off-timer when input goes true', function(done) {
            this.timeout(3000);
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "0", offDelay: "200", delayUnit: "ms", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var outputs = [];
                n2.on("input", function(msg) {
                    outputs.push(msg.payload);
                });

                n1.receive({ payload: true }); // ON

                setTimeout(function() {
                    n1.receive({ payload: false }); // Start off-timer
                }, 20);

                setTimeout(function() {
                    n1.receive({ payload: true }); // Cancel off-timer, immediate ON
                }, 70);

                setTimeout(function() {
                    assert.strictEqual(outputs.length, 2);
                    assert.strictEqual(outputs[0], true);
                    assert.strictEqual(outputs[1], true);
                    done();
                }, 350);
            });
        });
    });

    // Delay unit tests
    describe('Delay Units', function() {

        it('should handle seconds unit', function(done) {
            this.timeout(3000);
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "0.1", offDelay: "0", delayUnit: "s", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");
                const startTime = Date.now();

                n2.on("input", function(msg) {
                    const elapsed = Date.now() - startTime;
                    assert.strictEqual(msg.payload, true);
                    assert(elapsed >= 90, "0.1s should be ~100ms, was: " + elapsed + "ms");
                    done();
                });

                n1.receive({ payload: true });
            });
        });
    });

    // Truthy/Falsy tests
    describe('Truthy/Falsy Handling', function() {

        it('should treat 0 as false', function(done) {
            this.timeout(3000);
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "0", offDelay: "50", delayUnit: "ms", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var count = 0;
                n2.on("input", function(msg) {
                    count++;
                    if (count === 2) {
                        assert.strictEqual(msg.payload, false);
                        done();
                    }
                });

                n1.receive({ payload: 1 });
                n1.receive({ payload: 0 });
            });
        });

        it('should treat "off" as false', function(done) {
            this.timeout(3000);
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "0", offDelay: "50", delayUnit: "ms", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var count = 0;
                n2.on("input", function(msg) {
                    count++;
                    if (count === 2) {
                        assert.strictEqual(msg.payload, false);
                        done();
                    }
                });

                n1.receive({ payload: "on" });
                n1.receive({ payload: "off" });
            });
        });

        it('should treat "false" string as false', function(done) {
            this.timeout(3000);
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "0", offDelay: "50", delayUnit: "ms", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var count = 0;
                n2.on("input", function(msg) {
                    count++;
                    if (count === 2) {
                        assert.strictEqual(msg.payload, false);
                        done();
                    }
                });

                n1.receive({ payload: true });
                n1.receive({ payload: "false" });
            });
        });

        it('should treat random string as true', function(done) {
            this.timeout(3000);
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "50", offDelay: "0", delayUnit: "ms", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                n2.on("input", function(msg) {
                    assert.strictEqual(msg.payload, true);
                    done();
                });

                n1.receive({ payload: "hello" });
            });
        });
    });

    // Timer continuity tests
    describe('Timer Continuity', function() {

        it('should NOT reset timer when same input is sent again', function(done) {
            this.timeout(3000);
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "150", offDelay: "0", delayUnit: "ms", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");
                const startTime = Date.now();

                n2.on("input", function(msg) {
                    const elapsed = Date.now() - startTime;
                    assert.strictEqual(msg.payload, true);
                    // Should fire ~150ms after FIRST input, not reset by second input
                    assert(elapsed >= 140, "Timer fired too early: " + elapsed + "ms");
                    assert(elapsed < 250, "Timer fired too late (was reset?): " + elapsed + "ms");
                    done();
                });

                n1.receive({ payload: true }); // Start timer
                setTimeout(function() {
                    n1.receive({ payload: true }); // Send same input - should NOT reset
                }, 75);
            });
        });
    });

    // Runtime Override tests
    describe('Runtime Override', function() {

        it('should override onDelay via msg.onDelay', function(done) {
            this.timeout(3000);
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "500", offDelay: "0", delayUnit: "ms", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");
                const startTime = Date.now();

                n2.on("input", function(msg) {
                    const elapsed = Date.now() - startTime;
                    assert.strictEqual(msg.payload, true);
                    // Should use msg.onDelay (50ms) not config (500ms)
                    assert(elapsed < 200, "Should use override delay, was: " + elapsed + "ms");
                    assert(elapsed >= 40, "Timer fired too early: " + elapsed + "ms");
                    done();
                });

                n1.receive({ payload: true, onDelay: 50 });
            });
        });

        it('should override offDelay via msg.offDelay', function(done) {
            this.timeout(3000);
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "0", offDelay: "500", delayUnit: "ms", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var count = 0;
                var offTime;

                n2.on("input", function(msg) {
                    count++;
                    if (count === 1) {
                        assert.strictEqual(msg.payload, true);
                        offTime = Date.now();
                        n1.receive({ payload: false, offDelay: 50 });
                    } else if (count === 2) {
                        const elapsed = Date.now() - offTime;
                        assert.strictEqual(msg.payload, false);
                        // Should use msg.offDelay (50ms) not config (500ms)
                        assert(elapsed < 200, "Should use override delay, was: " + elapsed + "ms");
                        assert(elapsed >= 40, "Timer fired too early: " + elapsed + "ms");
                        done();
                    }
                });

                n1.receive({ payload: true });
            });
        });

        it('should bypass onDelay with msg.bypassOn=true', function(done) {
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "500", offDelay: "0", delayUnit: "ms", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");
                const startTime = Date.now();

                n2.on("input", function(msg) {
                    const elapsed = Date.now() - startTime;
                    assert.strictEqual(msg.payload, true);
                    assert(elapsed < 50, "Should be immediate with bypass, was: " + elapsed + "ms");
                    done();
                });

                n1.receive({ payload: true, bypassOn: true });
            });
        });

        it('should bypass offDelay with msg.bypassOff=true', function(done) {
            const flow = [
                { id: "n1", type: "ton-toff", onDelay: "0", offDelay: "500", delayUnit: "ms", wires: [["n2"]] },
                { id: "n2", type: "helper" }
            ];

            helper.load(tonToffNode, flow, function() {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");

                var count = 0;
                var offTime;

                n2.on("input", function(msg) {
                    count++;
                    if (count === 1) {
                        assert.strictEqual(msg.payload, true);
                        offTime = Date.now();
                        n1.receive({ payload: false, bypassOff: true });
                    } else if (count === 2) {
                        const elapsed = Date.now() - offTime;
                        assert.strictEqual(msg.payload, false);
                        assert(elapsed < 50, "Should be immediate with bypass, was: " + elapsed + "ms");
                        done();
                    }
                });

                n1.receive({ payload: true });
            });
        });
    });

});
