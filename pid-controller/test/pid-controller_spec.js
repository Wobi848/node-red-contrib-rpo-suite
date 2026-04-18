var helper = require("node-red-node-test-helper");
var pidNode = require("../pid-controller.js");

helper.init(require.resolve("node-red"));

describe("pid-controller Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    var flow = [{ id: "n1", type: "pid-controller", name: "test" }];
    helper.load(pidNode, flow, function () {
      var n1 = helper.getNode("n1");
      n1.should.have.property("name", "test");
      done();
    });
  });

  describe("P Control", function () {
    it("should calculate P-only output", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 0, Td: 0, outMin: 0, outMax: 100, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // error = 20 - 18 = 2, P = 2.0 * 2 = 4
          msg.should.have.property("payload", 4);
          msg.should.have.property("pid");
          msg.pid.should.have.property("P", 4);
          msg.pid.should.have.property("I", 0);
          msg.pid.should.have.property("D", 0);
          done();
        });
        n1.receive({ payload: 18 });
      });
    });
  });

  describe("PI Control", function () {
    it("should have Ti configured", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 1.0, Ti: 10, Td: 0, outMin: 0, outMax: 100, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // First message: P only (no dt yet), I should be 0
          msg.pid.should.have.property("P", 2);
          msg.pid.should.have.property("I", 0);
          msg.pid.should.have.property("Ti", 10);
          done();
        });
        n1.receive({ payload: 18 });
      });
    });
  });

  describe("Output Clamping", function () {
    it("should clamp to outMax", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 50, Kp: 10, Ti: 0, Td: 0, outMin: 0, outMax: 100, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // error = 50 - 10 = 40, P = 10 * 40 = 400, clamped to 100
          msg.should.have.property("payload", 100);
          msg.pid.should.have.property("clamped", true);
          msg.pid.should.have.property("clampedAt", "max");
          done();
        });
        n1.receive({ payload: 10 });
      });
    });

    it("should clamp to outMin", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 10, Ti: 0, Td: 0, outMin: 0, outMax: 100, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // error = 20 - 30 = -10, P = 10 * -10 = -100, clamped to 0
          msg.should.have.property("payload", 0);
          msg.pid.should.have.property("clamped", true);
          msg.pid.should.have.property("clampedAt", "min");
          done();
        });
        n1.receive({ payload: 30 });
      });
    });
  });

  describe("Reverse Acting", function () {
    it("should reverse error calculation", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 0, Td: 0, outMin: 0, outMax: 100, reverseActing: true, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // Reverse: error = 22 - 20 = 2, P = 2.0 * 2 = 4
          msg.should.have.property("payload", 4);
          msg.pid.should.have.property("error", 2);
          msg.pid.should.have.property("reverseActing", true);
          done();
        });
        n1.receive({ payload: 22 });
      });
    });
  });

  describe("Manual Mode", function () {
    it("should output manualValue in manual mode", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 0, Td: 0, outMin: 0, outMax: 100, manualMode: true, manualValue: 50, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 50);
          msg.pid.should.have.property("manual", true);
          done();
        });
        n1.receive({ payload: 18 });
      });
    });

    it("should switch to auto mode via msg.manual", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 0, Td: 0, outMin: 0, outMax: 100, manualMode: true, manualValue: 50, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            msg.pid.should.have.property("manual", true);
            // Switch to auto
            n1.receive({ payload: 18, manual: false });
          } else if (count === 2) {
            msg.pid.should.have.property("manual", false);
            // Should now be calculating PID
            msg.pid.should.have.property("P", 4);
            done();
          }
        });
        n1.receive({ payload: 18 });
      });
    });
  });

  describe("Setpoint Override", function () {
    it("should override setpoint via msg.setpoint", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 0, Td: 0, outMin: 0, outMax: 100, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // error = 25 - 18 = 7, P = 2.0 * 7 = 14
          msg.should.have.property("payload", 14);
          msg.pid.should.have.property("setpoint", 25);
          msg.pid.should.have.property("error", 7);
          done();
        });
        n1.receive({ payload: 18, setpoint: 25 });
      });
    });
  });

  describe("Reset", function () {
    it("should handle reset command without error", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 1.0, Ti: 10, Td: 0, outMin: 0, outMax: 100, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            // First message after reset should have I = 0 (like first message)
            msg.pid.should.have.property("I", 0);
            done();
          }
        });
        // Send reset first, then a normal message
        n1.receive({ reset: true });
        n1.receive({ payload: 18 });
      });
    });
  });

  describe("Error Handling", function () {
    it("should warn for non-numeric payload", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 1.0, Ti: 60, Td: 0, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        n1.on("call:warn", function (call) {
          call.should.be.calledWithMatch(/not a valid number/);
          done();
        });
        n1.receive({ payload: "not a number" });
      });
    });
  });

  describe("Output 2 (Status)", function () {
    it("should send status on output 2", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 0, Td: 0, outMin: 0, outMax: 100, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n3 = helper.getNode("n3");
        n3.on("input", function (msg) {
          msg.payload.should.have.property("manual", false);
          msg.payload.should.have.property("setpoint", 20);
          msg.payload.should.have.property("processValue", 18);
          msg.payload.should.have.property("error", 2);
          msg.payload.should.have.property("output", 4);
          done();
        });
        n1.receive({ payload: 18 });
      });
    });
  });

  describe("Centered Band", function () {
    it("should add 50% bias when centeredBand is enabled", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 0, Td: 0, outMin: 0, outMax: 100, centeredBand: true, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // error = 20 - 18 = 2, P = 2.0 * 2 = 4, + 50 bias = 54
          msg.should.have.property("payload", 54);
          msg.pid.should.have.property("centeredBand", true);
          done();
        });
        n1.receive({ payload: 18 });
      });
    });

    it("should output 50% at setpoint with centeredBand", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 0, Td: 0, outMin: 0, outMax: 100, centeredBand: true, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // error = 20 - 20 = 0, P = 0, + 50 bias = 50
          msg.should.have.property("payload", 50);
          done();
        });
        n1.receive({ payload: 20 });
      });
    });

    it("should output less than 50% when PV > SP with centeredBand", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 0, Td: 0, outMin: 0, outMax: 100, centeredBand: true, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // error = 20 - 22 = -2, P = 2.0 * -2 = -4, + 50 bias = 46
          msg.should.have.property("payload", 46);
          done();
        });
        n1.receive({ payload: 22 });
      });
    });
  });

  describe("Decimals", function () {
    it("should round to specified decimal places", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 1.333, Ti: 0, Td: 0, outMin: 0, outMax: 100, decimals: 2, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // error = 2, P = 1.333 * 2 = 2.666, rounded to 2.67
          msg.should.have.property("payload", 2.67);
          done();
        });
        n1.receive({ payload: 18 });
      });
    });
  });

  describe("Feed-Forward", function () {
    // Note: FF is not applied on the first cycle for stability reasons
    // Tests must send an initialization message first, then the actual test
    it("should add FF to output when enabled", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 0, Td: 0, outMin: 0, outMax: 100, ffEnable: true, ffGain: 1.0, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            // First message: FF not applied (initialization)
            msg.pid.should.have.property("FF", 0);
            // Send second message with FF
            n1.receive({ payload: 18, feedForward: 10 });
          } else if (count === 2) {
            // Second message: FF should be applied
            // error = 20 - 18 = 2, P = 4, FF = 10, total = 14
            msg.should.have.property("payload", 14);
            msg.pid.should.have.property("FF", 10);
            msg.pid.should.have.property("ffEnable", true);
            done();
          }
        });
        n1.receive({ payload: 18, feedForward: 10 });
      });
    });

    it("should not add FF when disabled", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 0, Td: 0, outMin: 0, outMax: 100, ffEnable: false, ffGain: 1.0, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // FF disabled, so just P = 4 (even on first message)
          msg.should.have.property("payload", 4);
          msg.pid.should.have.property("FF", 0);
          msg.pid.should.have.property("ffEnable", false);
          done();
        });
        n1.receive({ payload: 18, feedForward: 10 });
      });
    });

    it("should scale FF by ffGain", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 0, Td: 0, outMin: 0, outMax: 100, ffEnable: true, ffGain: 2.5, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            // First message: initialization
            n1.receive({ payload: 18, feedForward: 4 });
          } else if (count === 2) {
            // Second message: FF applied with gain
            // error = 20 - 18 = 2, P = 4, FF = 4 * 2.5 = 10, total = 14
            msg.should.have.property("payload", 14);
            msg.pid.should.have.property("FF", 10);
            msg.pid.should.have.property("ffGain", 2.5);
            done();
          }
        });
        n1.receive({ payload: 18 });
      });
    });

    it("should handle negative FF values", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 0, Td: 0, outMin: 0, outMax: 100, ffEnable: true, ffGain: 1.0, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            // First message: initialization
            n1.receive({ payload: 15, feedForward: -5 });
          } else if (count === 2) {
            // Second message: negative FF applied
            // error = 20 - 15 = 5, P = 10, FF = -5, total = 5
            msg.should.have.property("payload", 5);
            msg.pid.should.have.property("FF", -5);
            done();
          }
        });
        n1.receive({ payload: 15 });
      });
    });
  });

  describe("Tracking Mode", function () {
    // Tracking Mode forces integrator to follow external value (for cascade control)
    it("should force integrator to match tracking value", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 60, Td: 0, outMin: 0, outMax: 100, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            // First message: initialization
            n1.receive({ payload: 18, trackingValue: 75 });
          } else if (count === 2) {
            // Second message: tracking applied
            // Output should match trackingValue
            msg.should.have.property("payload", 75);
            msg.pid.should.have.property("trackingActive", true);
            msg.pid.should.have.property("tracking", 75);
            done();
          }
        });
        n1.receive({ payload: 18 });
      });
    });

    it("should report trackingActive in debug output", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 60, Td: 0, outMin: 0, outMax: 100, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            // Without tracking
            msg.pid.should.have.property("trackingActive", false);
            n1.receive({ payload: 18, trackingValue: 60 });
          } else if (count === 2) {
            // With tracking
            msg.pid.should.have.property("trackingActive", true);
            done();
          }
        });
        n1.receive({ payload: 18 });
      });
    });

    it("should clamp tracking value to output range", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 60, Td: 0, outMin: 0, outMax: 100, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            // First message: initialization
            n1.receive({ payload: 18, trackingValue: 150 }); // Above outMax
          } else if (count === 2) {
            // Should clamp to outMax
            msg.should.have.property("payload", 100);
            msg.pid.should.have.property("trackingActive", true);
            done();
          }
        });
        n1.receive({ payload: 18 });
      });
    });

    it("should not apply tracking when Ti is 0", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 0, Td: 0, outMin: 0, outMax: 100, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // Ti = 0 means no integrator, so tracking should not apply
          // Output should be P only: error = 2, P = 4
          msg.should.have.property("payload", 4);
          msg.pid.should.have.property("trackingActive", false);
          done();
        });
        n1.receive({ payload: 18, trackingValue: 75 });
      });
    });

    it("should not apply tracking in manual mode", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 60, Td: 0, outMin: 0, outMax: 100, manualMode: true, manualValue: 30, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          // Manual mode should ignore trackingValue
          msg.should.have.property("payload", 30);
          msg.pid.should.have.property("manual", true);
          msg.pid.should.have.property("trackingActive", false);
          done();
        });
        n1.receive({ payload: 18, trackingValue: 75 });
      });
    });

    it("should work with centered band mode", function (done) {
      var flow = [
        { id: "n1", type: "pid-controller", name: "test", setpoint: 20, Kp: 2.0, Ti: 60, Td: 0, outMin: 0, outMax: 100, centeredBand: true, decimals: 1, wires: [["n2"], ["n3"]] },
        { id: "n2", type: "helper" },
        { id: "n3", type: "helper" },
      ];
      helper.load(pidNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            // First message: initialization
            n1.receive({ payload: 18, trackingValue: 60 });
          } else if (count === 2) {
            // Tracking should account for centered band bias
            msg.should.have.property("payload", 60);
            msg.pid.should.have.property("trackingActive", true);
            msg.pid.should.have.property("centeredBand", true);
            done();
          }
        });
        n1.receive({ payload: 18 });
      });
    });
  });
});
