const helper = require('node-red-node-test-helper');
const node   = require('../debounce.js');
helper.init(require.resolve('node-red'));

describe('debounce node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should forward only last message in trailing mode', function(done) {
    const flow = [
      { id:'n1', type:'debounce', debounceTime:100, mode:'trailing', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: 1 });
      n1.receive({ payload: 2 });
      n1.receive({ payload: 3 });
      setTimeout(() => {
        msgs.should.deepEqual([3]);
        done();
      }, 200);
    });
  });

  it('should forward first message in leading mode', function(done) {
    const flow = [
      { id:'n1', type:'debounce', debounceTime:100, mode:'leading', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: 1 });
      n1.receive({ payload: 2 });
      n1.receive({ payload: 3 });
      setTimeout(() => {
        msgs[0].should.equal(1);
        done();
      }, 50);
    });
  });
});
