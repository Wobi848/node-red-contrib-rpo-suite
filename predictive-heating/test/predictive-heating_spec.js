var helper = require("node-red-node-test-helper");
var node = require("../predictive-heating.js");

helper.init(require.resolve("node-red"));

describe("predictive-heating Node", function() {
    before(function(done) { helper.startServer(done); });
    after(function(done) { helper.stopServer(done); });
    afterEach(function() { return helper.unload(); });

    function buildFlow(config) {
        return [
            { id: "n1", type: "predictive-heating", name: "test", wires: [["n2"]], weightCurrent: 4, weightDay0: 2, weightDay1: 1, weightDay2: 0.5, uvMaxOffset: 2, ...config },
            { id: "n2", type: "helper" }
        ];
    }

    it("should be loaded", function(done) {
        helper.load(node, buildFlow({}), function() {
            var n1 = helper.getNode("n1");
            n1.should.have.property("name", "test");
            done();
        });
    });

    it("should warn when at_current is missing", function(done) {
        helper.load(node, buildFlow({}), function() {
            var n1 = helper.getNode("n1");
            n1.on("call:warn", function() { done(); });
            n1.receive({ payload: {} });
        });
    });

    it("should output at_predictive equal to at_current when no forecast (stable)", function(done) {
        helper.load(node, buildFlow({}), function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.payload.should.have.property("at_predictive", 5);
                msg.payload.should.have.property("mode", "stable");
                done();
            });
            n1.receive({ at_current: 5 });
        });
    });

    it("should correct downward when cold front is coming", function(done) {
        helper.load(node, buildFlow({}), function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.payload.at_predictive.should.be.below(5);
                msg.payload.should.have.property("mode", "cooling");
                done();
            });
            n1.receive({ at_current: 5, avg_day0: 0, avg_day1: -5, avg_day2: -8 });
        });
    });

    it("should correct upward when warming front is coming", function(done) {
        helper.load(node, buildFlow({}), function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.payload.at_predictive.should.be.above(5);
                msg.payload.should.have.property("mode", "warming");
                done();
            });
            n1.receive({ at_current: 5, avg_day0: 15, avg_day1: 20, avg_day2: 22 });
        });
    });

    it("should apply positive solar offset when UV is high", function(done) {
        helper.load(node, buildFlow({}), function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.payload.solar_offset.should.be.above(0);
                done();
            });
            n1.receive({ at_current: 5, uv_day0: 12, uv_day1: 12 });
        });
    });

    it("should have zero solar offset when UV is 0", function(done) {
        helper.load(node, buildFlow({}), function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.payload.solar_offset.should.equal(0);
                done();
            });
            n1.receive({ at_current: 5, uv_day0: 0, uv_day1: 0 });
        });
    });

    it("should output correction field", function(done) {
        helper.load(node, buildFlow({}), function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.payload.should.have.property("correction");
                done();
            });
            n1.receive({ at_current: 5, avg_day0: 3, avg_day1: 2, avg_day2: 1 });
        });
    });
});
