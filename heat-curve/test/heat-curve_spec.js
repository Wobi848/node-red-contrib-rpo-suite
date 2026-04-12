var helper = require("node-red-node-test-helper");
var heatCurveNode = require("../heat-curve.js");

helper.init(require.resolve("node-red"));

describe("heat-curve Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    var flow = [{ id: "n1", type: "heat-curve", name: "test" }];
    helper.load(heatCurveNode, flow, function () {
      var n1 = helper.getNode("n1");
      n1.should.have.property("name", "test");
      done();
    });
  });

  describe("Basic Calculation", function () {
    it("should calculate flow temp at 0°C outdoor with slope 1", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 40);
          msg.should.have.property("heatCurve");
          msg.heatCurve.should.have.property("outdoorTemp", 0);
          msg.heatCurve.should.have.property("flowTemp", 40);
          msg.heatCurve.should.have.property("heatingActive", true);
          done();
        });
        n1.receive({ payload: 0 });
      });
    });

    it("should calculate flow temp at negative outdoor temp", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 50);
          done();
        });
        n1.receive({ payload: -10 });
      });
    });

    it("should send heating active true on output 2", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n3 = helper.getNode("n3");
        n3.on("input", function (msg) {
          msg.should.have.property("payload", true);
          done();
        });
        n1.receive({ payload: 0 });
      });
    });
  });

  describe("Clamping", function () {
    it("should clamp to minimum flow temp", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 25, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // flowTemp = 20 + 1 × (20 - 22) = 18, clamped to 20
          msg.should.have.property("payload", 20);
          msg.heatCurve.should.have.property("clamped", true);
          msg.heatCurve.should.have.property("clampedAt", "min");
          done();
        });
        n1.receive({ payload: 22 });
      });
    });

    it("should clamp to maximum flow temp", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.5, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 75);
          msg.heatCurve.should.have.property("clamped", true);
          msg.heatCurve.should.have.property("clampedAt", "max");
          done();
        });
        n1.receive({ payload: -20 });
      });
    });
  });

  describe("Night Setback", function () {
    it("should reduce flow temp when setback active", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // flowTemp = 50 - 10 = 40
          msg.should.have.property("payload", 40);
          msg.heatCurve.should.have.property("setback", true);
          msg.heatCurve.should.have.property("flowTempBeforeSetback", 50);
          done();
        });
        n1.receive({ payload: -10, setback: true });
      });
    });

    it("should not reduce flow temp when setback inactive", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 50);
          msg.heatCurve.should.have.property("setback", false);
          done();
        });
        n1.receive({ payload: -10, setback: false });
      });
    });

    it("should override setbackDelta via msg", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // flowTemp = 50 - 15 = 35
          msg.should.have.property("payload", 35);
          msg.heatCurve.should.have.property("setbackDelta", 15);
          done();
        });
        n1.receive({ payload: -10, setback: true, setbackDelta: 15 });
      });
    });

    it("should use last outdoor temp when setback-only message received", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            // First message: outdoor -10, flowTemp = 50
            msg.should.have.property("payload", 50);
            // Send setback-only message (no payload)
            n1.receive({ setback: true });
          } else if (count === 2) {
            // Second message: uses last outdoor temp -10, flowTemp = 50 - 10 = 40
            msg.should.have.property("payload", 40);
            msg.heatCurve.should.have.property("outdoorTemp", -10);
            msg.heatCurve.should.have.property("setback", true);
            done();
          }
        });
        n1.receive({ payload: -10 });
      });
    });

    it("should keep setback state until explicitly changed", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            // First: no setback, flowTemp = 50
            msg.should.have.property("payload", 50);
            msg.heatCurve.should.have.property("setback", false);
            // Activate setback
            n1.receive({ payload: -10, setback: true });
          } else if (count === 2) {
            // Second: setback active, flowTemp = 40
            msg.should.have.property("payload", 40);
            msg.heatCurve.should.have.property("setback", true);
            // Send new temp WITHOUT setback flag - should stay active
            n1.receive({ payload: -5 });
          } else if (count === 3) {
            // Third: setback still active (sticky), flowTemp = 45 - 10 = 35
            msg.should.have.property("payload", 35);
            msg.heatCurve.should.have.property("setback", true);
            // Explicitly turn off setback
            n1.receive({ payload: -5, setback: false });
          } else if (count === 4) {
            // Fourth: setback off, flowTemp = 45
            msg.should.have.property("payload", 45);
            msg.heatCurve.should.have.property("setback", false);
            done();
          }
        });
        n1.receive({ payload: -10 });
      });
    });
  });

  describe("Summer Lockout", function () {
    it("should lock out when outdoor temp above threshold", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          (msg.payload === null).should.be.true();
          msg.heatCurve.should.have.property("heatingActive", false);
          done();
        });
        n1.receive({ payload: 20 });
      });
    });

    it("should send false on output 2 when locked out", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n3 = helper.getNode("n3");
        n3.on("input", function (msg) {
          msg.should.have.property("payload", false);
          done();
        });
        n1.receive({ payload: 20 });
      });
    });

    it("should not lock out at exactly threshold temp", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // At exactly 18°C, should still heat (<=)
          msg.should.have.property("payload", 22);
          msg.heatCurve.should.have.property("heatingActive", true);
          done();
        });
        n1.receive({ payload: 18 });
      });
    });

    it("should override summerLockout via msg", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // With summerLockout=25, outdoor 20 should still heat
          msg.heatCurve.should.have.property("heatingActive", true);
          done();
        });
        n1.receive({ payload: 20, summerLockout: 25 });
      });
    });
  });

  describe("Design Mode", function () {
    it("should calculate slope from design temps", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", mode: "design", designOutdoor: -15, designFlow: 55, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 40);
          msg.heatCurve.should.have.property("slope", 1);
          done();
        });
        n1.receive({ payload: 0 });
      });
    });

    it("should reach design flow at design outdoor temp", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", mode: "design", designOutdoor: -15, designFlow: 55, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 55);
          done();
        });
        n1.receive({ payload: -15 });
      });
    });
  });

  describe("Parallel Shift", function () {
    it("should apply positive shift", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 5, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 45);
          done();
        });
        n1.receive({ payload: 0 });
      });
    });
  });

  describe("Error Handling", function () {
    it("should warn for non-numeric payload", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.0, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        n1.on("call:warn", function (call) {
          call.should.be.calledWithMatch(/not a valid number/);
          done();
        });
        n1.receive({ payload: "not a number" });
      });
    });
  });

  describe("Decimals", function () {
    it("should round to specified decimal places", function (done) {
      var flow = [
        { id: "n1", type: "heat-curve", name: "test", slope: 1.3, roomTemp: 20, shift: 0, minFlow: 20, maxFlow: 75, setbackDelta: 10, summerLockout: 18, decimals: 2, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(heatCurveNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 39.5);
          done();
        });
        n1.receive({ payload: 5 });
      });
    });
  });
});
