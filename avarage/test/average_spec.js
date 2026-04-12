var helper = require("node-red-node-test-helper");
var averageNode = require("../average.js");

helper.init(require.resolve("node-red"));

describe("average Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    var flow = [{ id: "n1", type: "average", name: "test" }];
    helper.load(averageNode, flow, function () {
      var n1 = helper.getNode("n1");
      n1.should.have.property("name", "test");
      done();
    });
  });

  describe("Count Mode Basic", function () {
    it("should calculate average of single value", function (done) {
      var flow = [
        { id: "n1", type: "average", name: "test", mode: "count", window: 10, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(averageNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          msg.should.have.property("payload", 10);
          msg.should.have.property("average");
          msg.average.should.have.property("count", 1);
          done();
        });
        n1.receive({ payload: 10 });
      });
    });

    it("should calculate average of multiple values", function (done) {
      var flow = [
        { id: "n1", type: "average", name: "test", mode: "count", window: 10, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(averageNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 3) {
            msg.should.have.property("payload", 20); // (10+20+30)/3
            msg.average.should.have.property("count", 3);
            done();
          }
        });
        n1.receive({ payload: 10 });
        n1.receive({ payload: 20 });
        n1.receive({ payload: 30 });
      });
    });
  });

  describe("Count Mode Sliding Window", function () {
    it("should slide window when full", function (done) {
      var flow = [
        { id: "n1", type: "average", name: "test", mode: "count", window: 3, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(averageNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 4) {
            // Window should be [20, 30, 40], average = 30
            msg.should.have.property("payload", 30);
            msg.average.should.have.property("count", 3);
            msg.average.should.have.property("min", 20);
            msg.average.should.have.property("max", 40);
            done();
          }
        });
        n1.receive({ payload: 10 });
        n1.receive({ payload: 20 });
        n1.receive({ payload: 30 });
        n1.receive({ payload: 40 });
      });
    });
  });

  describe("Time Mode Basic", function () {
    it("should calculate average in time mode", function (done) {
      var flow = [
        { id: "n1", type: "average", name: "test", mode: "time", window: 10, windowUnit: "s", wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(averageNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 2) {
            msg.should.have.property("payload", 15); // (10+20)/2
            msg.average.should.have.property("count", 2);
            msg.average.should.have.property("mode", "time");
            done();
          }
        });
        n1.receive({ payload: 10 });
        n1.receive({ payload: 20 });
      });
    });
  });

  describe("Min/Max in Output", function () {
    it("should include min and max in output", function (done) {
      var flow = [
        { id: "n1", type: "average", name: "test", mode: "count", window: 10, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(averageNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 3) {
            msg.average.should.have.property("min", 5);
            msg.average.should.have.property("max", 25);
            done();
          }
        });
        n1.receive({ payload: 10 });
        n1.receive({ payload: 5 });
        n1.receive({ payload: 25 });
      });
    });
  });

  describe("Reset", function () {
    it("should reset buffer on msg.reset", function (done) {
      var flow = [
        { id: "n1", type: "average", name: "test", mode: "count", window: 10, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(averageNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 3) {
            // After reset, should only have value 100
            msg.should.have.property("payload", 100);
            msg.average.should.have.property("count", 1);
            done();
          }
        });
        n1.receive({ payload: 10 });
        n1.receive({ payload: 20 });
        n1.receive({ reset: true });
        n1.receive({ payload: 100 });
      });
    });
  });

  describe("Decimals", function () {
    it("should round to specified decimal places", function (done) {
      var flow = [
        { id: "n1", type: "average", name: "test", mode: "count", window: 10, decimals: 1, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(averageNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 3) {
            // (10+20+30)/3 = 20.0
            msg.should.have.property("payload", 20);
            done();
          }
        });
        n1.receive({ payload: 10 });
        n1.receive({ payload: 20 });
        n1.receive({ payload: 30 });
      });
    });

    it("should handle non-round averages", function (done) {
      var flow = [
        { id: "n1", type: "average", name: "test", mode: "count", window: 10, decimals: 2, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(averageNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 3) {
            // (10+20+33)/3 = 21.0
            msg.should.have.property("payload", 21);
            done();
          }
        });
        n1.receive({ payload: 10 });
        n1.receive({ payload: 20 });
        n1.receive({ payload: 33 });
      });
    });
  });

  describe("Error Handling", function () {
    it("should warn for non-numeric payload", function (done) {
      var flow = [
        { id: "n1", type: "average", name: "test", mode: "count", window: 10, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(averageNode, flow, function () {
        var n1 = helper.getNode("n1");
        n1.on("call:warn", function (call) {
          call.should.be.calledWithMatch(/not a valid number/);
          done();
        });
        n1.receive({ payload: "not a number" });
      });
    });
  });

  describe("Single Value Buffer", function () {
    it("should work with window of 1", function (done) {
      var flow = [
        { id: "n1", type: "average", name: "test", mode: "count", window: 1, wires: [["n2"]] },
        { id: "n2", type: "helper" },
      ];
      helper.load(averageNode, flow, function () {
        var n1 = helper.getNode("n1");
        var n2 = helper.getNode("n2");
        var count = 0;
        n2.on("input", function (msg) {
          count++;
          if (count === 2) {
            // Window of 1, should only contain last value
            msg.should.have.property("payload", 20);
            msg.average.should.have.property("count", 1);
            done();
          }
        });
        n1.receive({ payload: 10 });
        n1.receive({ payload: 20 });
      });
    });
  });
});
