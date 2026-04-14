const helper = require('node-red-node-test-helper');
const node   = require('../three-point.js');
helper.init(require.resolve('node-red'));

describe('three-point node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should send open pulse when setpoint > position', function(done) {
    const flow = [
      { id:'n1', type:'three-point', runtime:0.1, deadband:2, minPulse:0.01, initPos:0, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n2 = helper.getNode('n2');
      var n3 = helper.getNode('n3');
      var openMsg = null, closeMsg = null;
      n2.on('input', msg => { openMsg = msg; });
      n3.on('input', msg => { closeMsg = msg; });
      helper.getNode('n1').receive({ payload: 50 });
      setTimeout(() => {
        openMsg.payload.should.equal(true);
        (closeMsg === null || closeMsg.payload === false).should.equal(true);
        done();
      }, 20);
    });
  });

  it('should send close pulse when setpoint < position', function(done) {
    const flow = [
      { id:'n1', type:'three-point', runtime:0.1, deadband:2, minPulse:0.01, initPos:100, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n2 = helper.getNode('n2');
      var n3 = helper.getNode('n3');
      var closeMsg = null;
      n3.on('input', msg => { closeMsg = msg; });
      helper.getNode('n1').receive({ payload: 50 });
      setTimeout(() => {
        closeMsg.payload.should.equal(true);
        done();
      }, 20);
    });
  });

  it('should not move when within deadband', function(done) {
    const flow = [
      { id:'n1', type:'three-point', runtime:120, deadband:5, minPulse:1, initPos:50, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var received = false;
      helper.getNode('n2').on('input', () => { received = true; });
      helper.getNode('n3').on('input', () => { received = true; });
      helper.getNode('n1').receive({ payload: 52 }); // diff=2 < deadband=5
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });

  it('should stop movement on msg.stop', function(done) {
    const flow = [
      { id:'n1', type:'three-point', runtime:10, deadband:2, minPulse:0.01, initPos:0, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: 80 }); // start moving
      n1.receive({ stop: true });  // stop
      setTimeout(() => {
        msgs.some(v => v === false).should.equal(true); // stop sent false
        done();
      }, 50);
    });
  });

  it('should reset position on msg.reset', function(done) {
    const flow = [
      { id:'n1', type:'three-point', runtime:0.1, deadband:2, minPulse:0.01, initPos:30, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      n1.receive({ reset: true });
      // after reset, position should be back to initPos=30
      // next move from 30 to 80 → open
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: 80 });
      setTimeout(() => {
        msgs.some(v => v === true).should.equal(true);
        done();
      }, 20);
    });
  });

  it('should drive fully open on msg.open=true', function(done) {
    const flow = [
      { id:'n1', type:'three-point', runtime:0.1, deadband:2, minPulse:0.01, initPos:50, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var openMsg = null;
      helper.getNode('n2').on('input', msg => { openMsg = msg; });
      helper.getNode('n1').receive({ open: true });
      setTimeout(() => {
        openMsg.payload.should.equal(true);
        done();
      }, 20);
    });
  });

  it('should update position after pulse completes', function(done) {
    const flow = [
      { id:'n1', type:'three-point', runtime:0.1, deadband:2, minPulse:0.01, initPos:0, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: 50 }); // pulseTime = 50/100 * 0.1s = 50ms
      setTimeout(() => {
        // should have received true then false
        msgs.should.containEql(false);
        done();
      }, 150);
    });
  });
});
