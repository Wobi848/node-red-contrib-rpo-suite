var helper = require("node-red-node-test-helper");
var differenceNode = require("../difference.js");

helper.init(require.resolve("node-red"));

describe("difference Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    var flow = [{ id: "n1", type: "difference", name: "test" }];
    helper.load(differenceNode, flow, function () {
      var n1 = helper.getNode("n1");
      n1.should.have.property("name", "test");
      done();
    });
  });

  describe("Basic Subtraction", function () {
    it("should calculate A - B correctly", function (done) {
      var flow = [
        { id: "n1", type: "difference", name: "test", topicA: "a", topicB: "b", wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(differenceNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 6.3);
          msg.should.have.property("inputs");
          msg.inputs.should.have.property("result", 6.3);
          done();
        });
        n1.receive({ topic: "a", payload: 24.5 });
        n1.receive({ topic: "b", payload: 18.2 });
      });
    });

    it("should handle negative results", function (done) {
      var flow = [
        { id: "n1", type: "difference", name: "test", topicA: "a", topicB: "b", wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(differenceNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", -10);
          done();
        });
        n1.receive({ topic: "a", payload: 5 });
        n1.receive({ topic: "b", payload: 15 });
      });
    });
  });

  describe("Absolute Mode", function () {
    it("should output absolute value when enabled", function (done) {
      var flow = [
        { id: "n1", type: "difference", name: "test", topicA: "a", topicB: "b", absolute: true, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(differenceNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 10);
          msg.inputs.should.have.property("absolute", true);
          done();
        });
        n1.receive({ topic: "a", payload: 5 });
        n1.receive({ topic: "b", payload: 15 });
      });
    });
  });

  describe("Decimals", function () {
    it("should round to specified decimal places", function (done) {
      var flow = [
        { id: "n1", type: "difference", name: "test", topicA: "a", topicB: "b", decimals: 1, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(differenceNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 0.3);
          done();
        });
        n1.receive({ topic: "a", payload: 1 });
        n1.receive({ topic: "b", payload: 0.666 });
      });
    });

    it("should round to 0 decimal places", function (done) {
      var flow = [
        { id: "n1", type: "difference", name: "test", topicA: "a", topicB: "b", decimals: 0, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(differenceNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 6);
          done();
        });
        n1.receive({ topic: "a", payload: 24.5 });
        n1.receive({ topic: "b", payload: 18.2 });
      });
    });
  });

  describe("Reset", function () {
    it("should reset both values on msg.reset", function (done) {
      var flow = [
        { id: "n1", type: "difference", name: "test", topicA: "a", topicB: "b", wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(differenceNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            msg.should.have.property("payload", 10);
            // Reset and send new values
            n1.receive({ reset: true });
            n1.receive({ topic: "a", payload: 100 });
            n1.receive({ topic: "b", payload: 50 });
          } else if (count === 2) {
            msg.should.have.property("payload", 50);
            done();
          }
        });
        n1.receive({ topic: "a", payload: 20 });
        n1.receive({ topic: "b", payload: 10 });
      });
    });
  });

  describe("Custom Topics", function () {
    it("should use custom topic names", function (done) {
      var flow = [
        { id: "n1", type: "difference", name: "test", topicA: "temp1", topicB: "temp2", wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(differenceNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 5);
          msg.inputs.a.should.have.property("topic", "temp1");
          msg.inputs.b.should.have.property("topic", "temp2");
          done();
        });
        n1.receive({ topic: "temp1", payload: 25 });
        n1.receive({ topic: "temp2", payload: 20 });
      });
    });
  });

  describe("Error Handling", function () {
    it("should warn for unknown topic", function (done) {
      var flow = [
        { id: "n1", type: "difference", name: "test", topicA: "a", topicB: "b", wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(differenceNode, flow, function () {
        var n1 = helper.getNode("n1");
        n1.on("call:warn", function (call) {
          call.should.be.calledWithMatch(/not configured/);
          done();
        });
        n1.receive({ topic: "unknown", payload: 10 });
      });
    });

    it("should warn for non-numeric payload", function (done) {
      var flow = [
        { id: "n1", type: "difference", name: "test", topicA: "a", topicB: "b", wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(differenceNode, flow, function () {
        var n1 = helper.getNode("n1");
        n1.on("call:warn", function (call) {
          call.should.be.calledWithMatch(/not a valid number/);
          done();
        });
        n1.receive({ topic: "a", payload: "not a number" });
      });
    });
  });

  describe("Waiting State", function () {
    it("should not output until both values received", function (done) {
      var flow = [
        { id: "n1", type: "difference", name: "test", topicA: "a", topicB: "b", wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(differenceNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var received = false;
        n2.on("input", function () {
          received = true;
        });
        n1.receive({ topic: "a", payload: 10 });
        setTimeout(function () {
          received.should.be.false();
          done();
        }, 50);
      });
    });
  });

  describe("Continuous Updates", function () {
    it("should output on every update after both values known", function (done) {
      var flow = [
        { id: "n1", type: "difference", name: "test", topicA: "a", topicB: "b", wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(differenceNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 1) {
            msg.should.have.property("payload", 10);
          } else if (count === 2) {
            msg.should.have.property("payload", 15);
            done();
          }
        });
        n1.receive({ topic: "a", payload: 20 });
        n1.receive({ topic: "b", payload: 10 });
        n1.receive({ topic: "a", payload: 25 });
      });
    });
  });
});
