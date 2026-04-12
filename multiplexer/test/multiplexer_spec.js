const helper = require('node-red-node-test-helper');
const node   = require('../multiplexer.js');
helper.init(require.resolve('node-red'));

describe('multiplexer node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should pass ch0 value when ch0 is selected', function(done) {
    const flow = [
      { id:'n1', type:'multiplexer', channels:8, initialChannel:0, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(42);
        done();
      });
      n1.receive({ topic:'ch0', payload:42 });
    });
  });

  it('should block ch1 when ch0 is selected', function(done) {
    const flow = [
      { id:'n1', type:'multiplexer', channels:8, initialChannel:0, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var received = false;
      n2.on('input', () => { received = true; });
      n1.receive({ topic:'ch1', payload:99 });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });

  it('should switch channel via topic=select', function(done) {
    const flow = [
      { id:'n1', type:'multiplexer', channels:8, initialChannel:0, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      // Register listener first, then send
      n2.on('input', msg => {
        msg.payload.should.equal(77);
        done();
      });
      n1.receive({ topic:'ch1', payload:77 }); // store value on ch1
      n1.receive({ topic:'select', payload:1 }); // switch to ch1 (numeric index)
    });
  });
});
