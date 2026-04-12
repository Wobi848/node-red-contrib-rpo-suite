const helper = require('node-red-node-test-helper');
const node   = require('../counter.js');
helper.init(require.resolve('node-red'));

describe('counter node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should count up', function(done) {
    const flow = [
      { id:'n1', type:'counter', direction:'up', step:1, initialValue:0, min:0, max:100, onLimit:'stop', persistent:false, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var vals = [];
      n2.on('input', msg => vals.push(msg.payload));
      n1.receive({ payload: true });
      n1.receive({ payload: true });
      n1.receive({ payload: true });
      setTimeout(() => {
        vals.should.deepEqual([1,2,3]);
        done();
      }, 50);
    });
  });

  it('should stop at max', function(done) {
    const flow = [
      { id:'n1', type:'counter', direction:'up', step:1, initialValue:99, min:0, max:100, onLimit:'stop', persistent:false, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var vals = [];
      n2.on('input', msg => vals.push(msg.payload));
      n1.receive({ payload: true }); // 100
      n1.receive({ payload: true }); // still 100
      setTimeout(() => {
        vals[0].should.equal(100);
        vals[1].should.equal(100);
        done();
      }, 50);
    });
  });

  it('should reset via topic=reset', function(done) {
    const flow = [
      { id:'n1', type:'counter', direction:'up', step:1, initialValue:0, min:0, max:100, onLimit:'stop', persistent:false, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var vals = [];
      n2.on('input', msg => vals.push(msg.payload));
      n1.receive({ payload: true }); // 1
      n1.receive({ payload: true }); // 2
      n1.receive({ topic:'reset' });  // 0
      setTimeout(() => {
        vals[2].should.equal(0);
        done();
      }, 50);
    });
  });
});
