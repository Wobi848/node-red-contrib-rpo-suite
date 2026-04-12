const helper = require('node-red-node-test-helper');
const node   = require('../sort.js');
helper.init(require.resolve('node-red'));

describe('sort node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should sort numbers ascending', function(done) {
    const flow = [
      { id:'n1', type:'sorter', mode:'numeric', order:'asc', topN:0, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.deepEqual([1,2,3,5]);
        done();
      });
      n1.receive({ payload: [3,1,5,2] });
    });
  });

  it('should return top 2 descending', function(done) {
    const flow = [
      { id:'n1', type:'sorter', mode:'numeric', order:'desc', topN:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.deepEqual([5,3]);
        done();
      });
      n1.receive({ payload: [3,1,5,2] });
    });
  });
});
