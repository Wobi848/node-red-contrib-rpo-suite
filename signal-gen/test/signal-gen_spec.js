const helper = require('node-red-node-test-helper');
const node   = require('../signal-gen.js');
helper.init(require.resolve('node-red'));

describe('signal-gen node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should start and emit numeric values', function(done) {
    const flow = [
      { id:'n1', type:'signal-gen', waveform:'sine', frequency:1, amplitude:1, offset:0, intervalMs:50, autoStart:false, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.be.a.Number();
        n1.receive({ payload: 'stop' });
        done();
      });
      n1.receive({ payload: 'start' });
    });
  });

  it('should stop emitting after stop command', function(done) {
    const flow = [
      { id:'n1', type:'signal-gen', waveform:'square', frequency:1, amplitude:1, offset:0, intervalMs:30, autoStart:false, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      n1.receive({ payload: 'start' });
      setTimeout(() => {
        n1.receive({ payload: 'stop' });
        done();
      }, 80);
    });
  });
});
