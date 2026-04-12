const helper = require('node-red-node-test-helper');
const node   = require('../alarm-new-val.js');
helper.init(require.resolve('node-red'));

describe('alarm-new-val node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should pass value to output 1', function(done) {
    const flow = [
      { id:'n1', type:'alarm-new-val', mode:'always', pulseMs:100, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(42);
        done();
      });
      n1.receive({ payload: 42 });
    });
  });

  it('should emit true pulse on output 2', function(done) {
    const flow = [
      { id:'n1', type:'alarm-new-val', mode:'always', pulseMs:100, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n3 = helper.getNode('n3');
      n3.on('input', msg => {
        if (msg.payload === true) done();
      });
      n1.receive({ payload: 42 });
    });
  });

  it('should not emit on output 2 in changed mode when value is same', function(done) {
    const flow = [
      { id:'n1', type:'alarm-new-val', mode:'changed', pulseMs:100, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n3 = helper.getNode('n3');
      var pulses = 0;
      n3.on('input', msg => { if (msg.payload === true) pulses++; });
      n1.receive({ payload: 5 }); // first → pulse
      n1.receive({ payload: 5 }); // same → no pulse
      setTimeout(() => {
        pulses.should.equal(1);
        done();
      }, 50);
    });
  });
});
