const helper = require('node-red-node-test-helper');
const node   = require('../time-shift.js');
helper.init(require.resolve('node-red'));

describe('time-shift node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should not output before delay elapsed', function(done) {
    const flow = [
      { id:'n1', type:'time-shift', delay:5, delayUnit:'s', maxBuffer:1000, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var received = false;
      helper.getNode('n2').on('input', () => { received = true; });
      helper.getNode('n1').receive({ payload: 20 });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });

  it('should output delayed value after delay', function(done) {
    const flow = [
      { id:'n1', type:'time-shift', delay:0.1, delayUnit:'s', maxBuffer:1000, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: 20 });
      setTimeout(() => {
        n1.receive({ payload: 25 }); // should output 20 (from 100ms ago)
        setTimeout(() => {
          msgs.length.should.be.greaterThan(0);
          msgs[0].should.equal(20);
          done();
        }, 20);
      }, 150);
    });
  });

  it('should clear buffer on reset', function(done) {
    const flow = [
      { id:'n1', type:'time-shift', delay:0.1, delayUnit:'s', maxBuffer:1000, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      n1.receive({ payload: 20 });
      n1.receive({ reset: true });
      var received = false;
      helper.getNode('n2').on('input', () => { received = true; });
      setTimeout(() => {
        n1.receive({ payload: 25 }); // buffer was cleared → no output yet
        setTimeout(() => { received.should.equal(false); done(); }, 50);
      }, 150);
    });
  });

  it('should warn on non-numeric input', function(done) {
    const flow = [
      { id:'n1', type:'time-shift', delay:1, delayUnit:'s', maxBuffer:1000, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var received = false;
      helper.getNode('n2').on('input', () => { received = true; });
      helper.getNode('n1').receive({ payload: 'bad' });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });
});
