var helper = require("node-red-node-test-helper");
var scaleNode = require("../scale.js");

helper.init(require.resolve("node-red"));

describe("scale Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    var flow = [{ id: "n1", type: "scale", name: "test" }];
    helper.load(scaleNode, flow, function () {
      var n1 = helper.getNode("n1");
      n1.should.have.property("name", "test");
      done();
    });
  });

  describe("Basic Scaling", function () {
    it("should scale 0-10 to 0-100 correctly", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 0, inMax: 10, outMin: 0, outMax: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 50);
          msg.should.have.property("scale");
          msg.scale.should.have.property("input", 5);
          msg.scale.should.have.property("output", 50);
          done();
        });
        n1.receive({ payload: 5 });
      });
    });

    it("should scale 4-20mA to 0-100% correctly", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 4, inMax: 20, outMin: 0, outMax: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 50);
          done();
        });
        n1.receive({ payload: 12 });
      });
    });

    it("should handle boundary values", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 0, inMax: 10, outMin: 0, outMax: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            msg.should.have.property("payload", 0);
          } else if (count === 2) {
            msg.should.have.property("payload", 100);
            done();
          }
        });
        n1.receive({ payload: 0 });
        n1.receive({ payload: 10 });
      });
    });
  });

  describe("Inverted Range", function () {
    it("should handle inverted output range", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 0, inMax: 10, outMin: 100, outMax: 0, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 50);
          done();
        });
        n1.receive({ payload: 5 });
      });
    });

    it("should scale 0 to 100 and 10 to 0 with inverted range", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 0, inMax: 10, outMin: 100, outMax: 0, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            msg.should.have.property("payload", 100);
          } else if (count === 2) {
            msg.should.have.property("payload", 0);
            done();
          }
        });
        n1.receive({ payload: 0 });
        n1.receive({ payload: 10 });
      });
    });
  });

  describe("Clamping", function () {
    it("should clamp output when input exceeds range", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 0, inMax: 10, outMin: 0, outMax: 100, clamp: true, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 100);
          msg.scale.should.have.property("clamped", true);
          done();
        });
        n1.receive({ payload: 15 });
      });
    });

    it("should clamp to lower bound", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 0, inMax: 10, outMin: 0, outMax: 100, clamp: true, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 0);
          msg.scale.should.have.property("clamped", true);
          done();
        });
        n1.receive({ payload: -5 });
      });
    });

    it("should not clamp when disabled", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 0, inMax: 10, outMin: 0, outMax: 100, clamp: false, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 150);
          msg.scale.should.have.property("clamped", false);
          done();
        });
        n1.receive({ payload: 15 });
      });
    });

    it("should clamp inverted range correctly", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 0, inMax: 10, outMin: 100, outMax: 0, clamp: true, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 0);
          msg.scale.should.have.property("clamped", true);
          done();
        });
        n1.receive({ payload: 15 });
      });
    });
  });

  describe("Decimals", function () {
    it("should round to specified decimal places", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 0, inMax: 3, outMin: 0, outMax: 100, decimals: 1, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 33.3);
          done();
        });
        n1.receive({ payload: 1 });
      });
    });

    it("should round to 0 decimal places", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 0, inMax: 3, outMin: 0, outMax: 100, decimals: 0, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 33);
          done();
        });
        n1.receive({ payload: 1 });
      });
    });
  });

  describe("Runtime Overrides", function () {
    it("should use runtime override for inMin/inMax", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 0, inMax: 10, outMin: 0, outMax: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 50);
          msg.scale.should.have.property("inMin", 4);
          msg.scale.should.have.property("inMax", 20);
          done();
        });
        n1.receive({ payload: 12, inMin: 4, inMax: 20 });
      });
    });

    it("should use runtime override for outMin/outMax", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 0, inMax: 10, outMin: 0, outMax: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 250);
          msg.scale.should.have.property("outMin", 0);
          msg.scale.should.have.property("outMax", 500);
          done();
        });
        n1.receive({ payload: 5, outMin: 0, outMax: 500 });
      });
    });
  });

  describe("Error Handling", function () {
    it("should warn for division by zero (inMin = inMax)", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 5, inMax: 5, outMin: 0, outMax: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        n1.on("call:warn", function (call) {
          call.should.be.calledWithMatch(/division by zero/);
          done();
        });
        n1.receive({ payload: 5 });
      });
    });

    it("should warn for non-numeric payload", function (done) {
      var flow = [
        { id: "n1", type: "scale", name: "test", inMin: 0, inMax: 10, outMin: 0, outMax: 100, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(scaleNode, flow, function () {
        var n1 = helper.getNode("n1");
        n1.on("call:warn", function (call) {
          call.should.be.calledWithMatch(/not a valid number/);
          done();
        });
        n1.receive({ payload: "not a number" });
      });
    });
  });
});
