const helper = require('node-red-node-test-helper');
const node   = require('../edge-filter.js');
helper.init(require.resolve('node-red'));

describe('edge-filter node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should pass first message and block second', function(done) {
    const flow = [
      { id:'n1', type:'edge-filter', window:500, windowUnit:'ms', mode:'time', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var count = 0;
      n2.on('input', () => count++);
      n1.receive({ payload: 'first' });
      n1.receive({ payload: 'second' });
      setTimeout(() => {
        count.should.equal(1);
        done();
      }, 50);
    });
  });

  it('should pass message after window expires', function(done) {
    const flow = [
      { id:'n1', type:'edge-filter', window:100, windowUnit:'ms', mode:'time', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var count = 0;
      n2.on('input', () => count++);
      n1.receive({ payload: 'first' });
      setTimeout(() => {
        n1.receive({ payload: 'after window' });
        setTimeout(() => {
          count.should.equal(2);
          done();
        }, 30);
      }, 150);
    });
  });
});
