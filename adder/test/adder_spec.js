const helper = require('node-red-node-test-helper');
const node   = require('../adder.js');
helper.init(require.resolve('node-red'));

describe('adder node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should sum two topic values', function(done) {
    const flow = [
      { id:'n1', type:'adder', topics:'a,b', mode:'sum', minTopics:2, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(30);
        done();
      });
      n1.receive({ topic:'a', payload:10 });
      n1.receive({ topic:'b', payload:20 });
    });
  });

  it('should not output before minTopics are filled', function(done) {
    const flow = [
      { id:'n1', type:'adder', topics:'a,b', mode:'sum', minTopics:2, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var received = false;
      n2.on('input', () => { received = true; });
      n1.receive({ topic:'a', payload:10 });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });
});
