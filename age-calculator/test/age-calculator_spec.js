const helper = require("node-red-node-test-helper");
const ageCalculatorNode = require("../age-calculator.js");
const assert = require("assert");

helper.init(require.resolve('node-red'));

describe('age-calculator Node', function() {

    afterEach(function(done) {
        helper.unload();
        done();
    });

    it('should be loaded', function(done) {
        const flow = [{ id: "n1", type: "age-calculator", name: "test name" }];
        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");
            assert.strictEqual(n1.name, 'test name');
            done();
        });
    });

    it('should calculate age from msg.payload', function(done) {
        const flow = [
            { id: "n1", type: "age-calculator", outputDays: true, wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];

        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            n2.on("input", function(msg) {
                assert.strictEqual(typeof msg.payload.days, 'number');
                assert(msg.payload.days > 0, 'Days should be positive');
                done();
            });

            // Use a date from 100 days ago
            const testDate = new Date();
            testDate.setDate(testDate.getDate() - 100);
            n1.receive({ payload: testDate.toISOString().split('T')[0] });
        });
    });

    it('should calculate age from config birthdate', function(done) {
        const flow = [
            { id: "n1", type: "age-calculator", birthdate: "2000-01-01", outputYears: true, wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];

        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            n2.on("input", function(msg) {
                assert.strictEqual(typeof msg.payload.years, 'number');
                assert(msg.payload.years >= 25, 'Should be at least 25 years');
                done();
            });

            n1.receive({ payload: "" }); // Empty payload, use config
        });
    });

    it('should return all fields when all checkboxes are enabled', function(done) {
        const flow = [
            {
                id: "n1",
                type: "age-calculator",
                outputYears: true,
                outputMonths: true,
                outputWeeks: true,
                outputDays: true,
                outputHours: true,
                outputMinutes: true,
                outputSeconds: true,
                outputReadable: true,
                wires: [["n2"]]
            },
            { id: "n2", type: "helper" }
        ];

        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            n2.on("input", function(msg) {
                assert.strictEqual(typeof msg.payload, 'object');
                assert('years' in msg.payload);
                assert('months' in msg.payload);
                assert('weeks' in msg.payload);
                assert('days' in msg.payload);
                assert('hours' in msg.payload);
                assert('minutes' in msg.payload);
                assert('seconds' in msg.payload);
                assert('readable' in msg.payload);
                assert('birthdate' in msg.payload);
                assert('calculated' in msg.payload);
                done();
            });

            n1.receive({ payload: "1990-05-15" });
        });
    });

    it('should override output fields via msg.outputFields', function(done) {
        const flow = [
            {
                id: "n1",
                type: "age-calculator",
                outputYears: true,
                outputMonths: true,
                outputWeeks: true,
                outputDays: true,
                outputHours: true,
                outputMinutes: true,
                outputSeconds: true,
                outputReadable: true,
                outputTimestamp: true,
                wires: [["n2"]]
            },
            { id: "n2", type: "helper" }
        ];

        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            n2.on("input", function(msg) {
                assert.strictEqual(typeof msg.payload, 'object');
                assert('years' in msg.payload, 'Should have years');
                assert('readable' in msg.payload, 'Should have readable');
                assert(!('months' in msg.payload), 'Should not have months');
                assert(!('days' in msg.payload), 'Should not have days');
                assert(!('hours' in msg.payload), 'Should not have hours');
                done();
            });

            // Override: only years and readable
            n1.receive({
                payload: "01.01.2000",
                outputFields: { years: true, months: false, weeks: false, days: false, hours: false, minutes: false, seconds: false, readable: true, timestamp: false }
            });
        });
    });

    it('should only return selected fields', function(done) {
        const flow = [
            {
                id: "n1",
                type: "age-calculator",
                outputYears: true,
                outputMonths: false,
                outputWeeks: false,
                outputDays: true,
                outputHours: false,
                outputMinutes: false,
                outputSeconds: false,
                outputReadable: false,
                wires: [["n2"]]
            },
            { id: "n2", type: "helper" }
        ];

        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            n2.on("input", function(msg) {
                assert.strictEqual(typeof msg.payload, 'object');
                assert('years' in msg.payload, 'Should have years');
                assert('days' in msg.payload, 'Should have days');
                assert(!('months' in msg.payload), 'Should not have months');
                assert(!('weeks' in msg.payload), 'Should not have weeks');
                assert(!('hours' in msg.payload), 'Should not have hours');
                assert(!('readable' in msg.payload), 'Should not have readable');
                done();
            });

            n1.receive({ payload: "1990-05-15" });
        });
    });

    it('should handle invalid date format', function(done) {
        const flow = [
            { id: "n1", type: "age-calculator", wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];

        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");

            n1.on("call:error", function(call) {
                assert(call.firstArg.includes("Invalid date"));
                done();
            });

            n1.receive({ payload: "not-a-date" });
        });
    });

    it('should handle future date', function(done) {
        const flow = [
            { id: "n1", type: "age-calculator", wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];

        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");

            n1.on("call:error", function(call) {
                assert(call.firstArg.includes("future"));
                done();
            });

            n1.receive({ payload: "2099-01-01" });
        });
    });

    it('should handle missing birthdate', function(done) {
        const flow = [
            { id: "n1", type: "age-calculator", birthdate: "", wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];

        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");

            n1.on("call:error", function(call) {
                assert(call.firstArg.includes("No birth date"));
                done();
            });

            n1.receive({ payload: "" });
        });
    });

    it('should support German date format DD.MM.YYYY', function(done) {
        const flow = [
            { id: "n1", type: "age-calculator", outputYears: true, wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];

        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            n2.on("input", function(msg) {
                assert.strictEqual(typeof msg.payload.years, 'number');
                assert(msg.payload.years >= 25, 'Should be at least 25 years for date 01.01.2000');
                done();
            });

            n1.receive({ payload: "01.01.2000" });
        });
    });

    it('should support ISO date format with time YYYY-MM-DD HH:MM', function(done) {
        const flow = [
            { id: "n1", type: "age-calculator", outputYears: true, wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];

        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            n2.on("input", function(msg) {
                assert.strictEqual(typeof msg.payload.years, 'number');
                assert(msg.payload.years >= 33, 'Should be at least 33 years for date 1991-09-12 06:05');
                done();
            });

            n1.receive({ payload: "1991-09-12 06:05" });
        });
    });

    it('should support German date format with time DD.MM.YYYY HH:MM', function(done) {
        const flow = [
            { id: "n1", type: "age-calculator", outputYears: true, wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];

        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            n2.on("input", function(msg) {
                assert.strictEqual(typeof msg.payload.years, 'number');
                assert(msg.payload.years >= 33, 'Should be at least 33 years for date 12.09.1991 06:05');
                done();
            });

            n1.receive({ payload: "12.09.1991 06:05" });
        });
    });

    it('should return timestamp when enabled', function(done) {
        const flow = [
            { id: "n1", type: "age-calculator", outputTimestamp: true, wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];

        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            n2.on("input", function(msg) {
                assert.strictEqual(typeof msg.payload.timestamp, 'number');
                // Timestamp for 2000-01-01 should be around 946684800000
                assert(msg.payload.timestamp > 946000000000, 'Timestamp should be valid');
                done();
            });

            n1.receive({ payload: "01.01.2000" });
        });
    });

    it('should return readable format when enabled', function(done) {
        const flow = [
            { id: "n1", type: "age-calculator", outputReadable: true, wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];

        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            n2.on("input", function(msg) {
                assert.strictEqual(typeof msg.payload.readable, 'string');
                assert(msg.payload.readable.includes('years'), 'Should contain "years"');
                done();
            });

            n1.receive({ payload: "01.01.2000" });
        });
    });

    it('should calculate correct days for known date', function(done) {
        const flow = [
            { id: "n1", type: "age-calculator", outputDays: true, wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];

        helper.load(ageCalculatorNode, flow, function() {
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            // Calculate expected days
            const birthDate = new Date("2020-01-01");
            const now = new Date();
            const expectedDays = Math.floor((now - birthDate) / (1000 * 60 * 60 * 24));

            n2.on("input", function(msg) {
                // Allow 1 day tolerance for timezone differences
                assert(Math.abs(msg.payload.days - expectedDays) <= 1,
                    `Expected ~${expectedDays} days, got ${msg.payload.days}`);
                done();
            });

            n1.receive({ payload: "2020-01-01" });
        });
    });

});
