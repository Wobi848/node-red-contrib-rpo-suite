const helper = require('node-red-node-test-helper');
const node   = require('../sequencer.js');
helper.init(require.resolve('node-red'));

describe('sequencer node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  function makeFlow(overrides) {
    var cfg = Object.assign({ id:'n1', type:'sequencer', channels:4, hysteresis:0, minOnTime:0, minOffTime:0, wearLevel:true, wires:[['n2']] }, overrides);
    return [cfg, { id:'n2', type:'helper' }];
  }

  it('should activate 0 channels at 0% demand', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.sequencer.activeChannels.should.equal(0);
        done();
      });
      helper.getNode('n1').receive({ payload: 0 });
    });
  });

  it('should activate all channels at 100% demand', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.sequencer.activeChannels.should.equal(4);
        done();
      });
      helper.getNode('n1').receive({ payload: 100 });
    });
  });

  it('should activate 2 of 4 channels at 50% demand', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.sequencer.activeChannels.should.equal(2);
        done();
      });
      helper.getNode('n1').receive({ payload: 50 });
    });
  });

  it('should reset runtimes on msg.reset', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg));
      n1.receive({ payload: 100 });
      n1.receive({ reset: true });
      setTimeout(() => {
        var last = msgs[msgs.length-1];
        last.sequencer.activeChannels.should.equal(0);
        last.sequencer.runtimes.every(r => r === 0).should.equal(true);
        done();
      }, 50);
    });
  });

  it('should force channels via msg.forceChannel', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.deepEqual([true, false, true, false]);
        done();
      });
      helper.getNode('n1').receive({ forceChannel: [true, false, true, false] });
    });
  });

  it('should activate all on boolean true', function(done) {
    helper.load(node, makeFlow({ channels: 2 }), function() {
      helper.getNode('n2').on('input', msg => {
        msg.sequencer.activeChannels.should.equal(2);
        done();
      });
      helper.getNode('n1').receive({ payload: true });
    });
  });

  describe("Config zero values", function () {
    it("should keep an explicit 0 instead of falling back to the default", function (done) {
      var flow = [{ id: "n1", type: "sequencer", name: "test", hysteresis: 0, minOnTime: 0, minOffTime: 0 }];
      helper.load(require("../sequencer.js"), flow, function () {
        var n1 = helper.getNode("n1");
        n1.should.have.property("hysteresis", 0);
        n1.should.have.property("minOnTime", 0);
        n1.should.have.property("minOffTime", 0);
        done();
      });
    });
  });

  describe('blocked channels', function () {
    it('should switch a channel on later when it was blocked by the minimum off time', function (done) {
      this.timeout(5000);
      const flow = [
        { id:'n1', type:'sequencer', channels:2, hysteresis:0, minOnTime:0, minOffTime:1, wearLevel:false, wires:[['n2']] },
        { id:'n2', type:'helper' }
      ];
      helper.load(require('../sequencer.js'), flow, function () {
        var n1 = helper.getNode('n1');
        var n2 = helper.getNode('n2');
        // Outputs: 1) both on, 2) both off, 3) still off (blocked), 4) both on after the retry
        var outputs = [];
        n2.on('input', msg => {
          outputs.push(msg.payload);
          if (outputs.length === 4) {
            try { outputs[2].should.eql([false, false]); outputs[3].should.eql([true, true]); done(); } catch (e) { done(e); }
          }
        });
        n1.receive({ payload: 100 });
        n1.receive({ payload: 0 });
        n1.receive({ payload: 100 }); // blocked by minOffTime 1 s
      });
    });
  });
});
