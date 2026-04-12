const helper = require('node-red-node-test-helper');
const node   = require('../gradient.js');
helper.init(require.resolve('node-red'));

describe('gradient node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should wait for second value before outputting', function(done) {
    const flow = [
      { id:'n1', type:'gradient', unit:'per_s', smoothing:1, decimals:2, alarmRate:0, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var received = false;
      n2.on('input', () => { received = true; });
      n1.receive({ payload: 10 });
      setTimeout(() => {
        received.should.equal(false);
        done();
      }, 50);
    });
  });

  it('should calculate positive gradient', function(done) {
    const flow = [
      { id:'n1', type:'gradient', unit:'per_s', smoothing:1, decimals:4, alarmRate:0, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n1.receive({ payload: 0 });
      setTimeout(() => {
        n2.on('input', msg => {
          msg.payload.should.be.above(0); // positive gradient
          msg.gradient.alarm.should.equal(false);
          done();
        });
        n1.receive({ payload: 10 });
      }, 100);
    });
  });

  it('should trigger alarm when gradient exceeds alarmRate', function(done) {
    const flow = [
      { id:'n1', type:'gradient', unit:'per_s', smoothing:1, decimals:2, alarmRate:1, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n1.receive({ payload: 0 });
      setTimeout(() => {
        n2.on('input', msg => {
          msg.gradient.alarm.should.equal(true);
          done();
        });
        n1.receive({ payload: 100 }); // huge jump → gradient >> 1/s
      }, 100);
    });
  });

  it('should reset on msg.reset=true', function(done) {
    const flow = [
      { id:'n1', type:'gradient', unit:'per_s', smoothing:1, decimals:2, alarmRate:0, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n1.receive({ payload: 10 });
      n1.receive({ reset: true });
      var received = false;
      n2.on('input', () => { received = true; });
      n1.receive({ payload: 20 }); // should be treated as first value again
      setTimeout(() => {
        received.should.equal(false);
        done();
      }, 50);
    });
  });
});
