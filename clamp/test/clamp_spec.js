var helper = require("node-red-node-test-helper");
var clampNode = require("../clamp.js");

helper.init(require.resolve("node-red"));

describe("clamp Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    var flow = [{ id: "n1", type: "clamp", name: "test" }];
    helper.load(clampNode, flow, function () {
      var n1 = helper.getNode("n1");
      n1.should.have.property("name", "test");
      done();
    });
  });

  describe("Value in Range", function () {
    it("should pass through value in range unchanged", function (done) {
      var flow = [
        { id: "n1", type: "clamp", name: "test", min: 0, max: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(clampNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 42);
          msg.should.have.property("clamp");
          msg.clamp.should.have.property("clamped", false);
          msg.clamp.should.have.property("clampedAt", null);
          done();
        });
        n1.receive({ payload: 42 });
      });
    });
  });

  describe("Clamped at Max", function () {
    it("should clamp value above max", function (done) {
      var flow = [
        { id: "n1", type: "clamp", name: "test", min: 0, max: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(clampNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 100);
          msg.clamp.should.have.property("input", 120);
          msg.clamp.should.have.property("clamped", true);
          msg.clamp.should.have.property("clampedAt", "max");
          done();
        });
        n1.receive({ payload: 120 });
      });
    });
  });

  describe("Clamped at Min", function () {
    it("should clamp value below min", function (done) {
      var flow = [
        { id: "n1", type: "clamp", name: "test", min: 0, max: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(clampNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 0);
          msg.clamp.should.have.property("input", -5);
          msg.clamp.should.have.property("clamped", true);
          msg.clamp.should.have.property("clampedAt", "min");
          done();
        });
        n1.receive({ payload: -5 });
      });
    });
  });

  describe("Exact Boundary Values", function () {
    it("should pass through exact min value", function (done) {
      var flow = [
        { id: "n1", type: "clamp", name: "test", min: 0, max: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(clampNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 0);
          msg.clamp.should.have.property("clamped", false);
          done();
        });
        n1.receive({ payload: 0 });
      });
    });

    it("should pass through exact max value", function (done) {
      var flow = [
        { id: "n1", type: "clamp", name: "test", min: 0, max: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(clampNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 100);
          msg.clamp.should.have.property("clamped", false);
          done();
        });
        n1.receive({ payload: 100 });
      });
    });
  });

  describe("Negative Range", function () {
    it("should work with negative min/max", function (done) {
      var flow = [
        { id: "n1", type: "clamp", name: "test", min: -10, max: 10, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(clampNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            msg.should.have.property("payload", -10);
            msg.clamp.should.have.property("clamped", true);
          } else if (count === 2) {
            msg.should.have.property("payload", 10);
            msg.clamp.should.have.property("clamped", true);
            done();
          }
        });
        n1.receive({ payload: -15 });
        n1.receive({ payload: 15 });
      });
    });
  });

  describe("Runtime Overrides", function () {
    it("should use runtime override for min", function (done) {
      var flow = [
        { id: "n1", type: "clamp", name: "test", min: 0, max: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(clampNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 10);
          msg.clamp.should.have.property("min", 10);
          msg.clamp.should.have.property("clamped", true);
          done();
        });
        n1.receive({ payload: 5, min: 10 });
      });
    });

    it("should use runtime override for max", function (done) {
      var flow = [
        { id: "n1", type: "clamp", name: "test", min: 0, max: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(clampNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 50);
          msg.clamp.should.have.property("max", 50);
          msg.clamp.should.have.property("clamped", true);
          done();
        });
        n1.receive({ payload: 75, max: 50 });
      });
    });
  });

  describe("Decimals", function () {
    it("should round to specified decimal places", function (done) {
      var flow = [
        { id: "n1", type: "clamp", name: "test", min: 0, max: 100, decimals: 1, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(clampNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 42.4);
          done();
        });
        n1.receive({ payload: 42.356 });
      });
    });
  });

  describe("Error Handling", function () {
    it("should warn for invalid range (min >= max)", function (done) {
      var flow = [
        { id: "n1", type: "clamp", name: "test", min: 100, max: 0, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(clampNode, flow, function () {
        var n1 = helper.getNode("n1");
        n1.on("call:warn", function (call) {
          call.should.be.calledWithMatch(/Invalid range/);
          done();
        });
        n1.receive({ payload: 50 });
      });
    });

    it("should warn for non-numeric payload", function (done) {
      var flow = [
        { id: "n1", type: "clamp", name: "test", min: 0, max: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(clampNode, flow, function () {
        var n1 = helper.getNode("n1");
        n1.on("call:warn", function (call) {
          call.should.be.calledWithMatch(/not a valid number/);
          done();
        });
        n1.receive({ payload: "not a number" });
      });
    });

    it("should warn when min equals max", function (done) {
      var flow = [
        { id: "n1", type: "clamp", name: "test", min: 50, max: 50, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(clampNode, flow, function () {
        var n1 = helper.getNode("n1");
        n1.on("call:warn", function (call) {
          call.should.be.calledWithMatch(/Invalid range/);
          done();
        });
        n1.receive({ payload: 50 });
      });
    });
  });
});
