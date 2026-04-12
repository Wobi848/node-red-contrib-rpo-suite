const helper = require('node-red-node-test-helper');
const node   = require('../ring-counter.js');
helper.init(require.resolve('node-red'));

describe('ring-counter node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should advance index and wrap around', function(done) {
    const flow = [
      { id:'n1', type:'ring-counter', size:3, initialIndex:0, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var vals = [];
      n2.on('input', msg => vals.push(msg.payload));
      n1.receive({ topic:'advance' });  // 1
      n1.receive({ topic:'advance' });  // 2
      n1.receive({ topic:'advance' });  // 0 (wrap)
      setTimeout(() => {
        vals.should.deepEqual([1,2,0]);
        done();
      }, 50);
    });
  });

  it('should set index via topic=set', function(done) {
    const flow = [
      { id:'n1', type:'ring-counter', size:5, initialIndex:0, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(3);
        done();
      });
      n1.receive({ topic:'set', payload:3 });
    });
  });
});
