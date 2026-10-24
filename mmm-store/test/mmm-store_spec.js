const helper = require('node-red-node-test-helper');
const node   = require('../mmm-store.js');
helper.init(require.resolve('node-red'));

describe('mmm-store node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should compute min, max, avg correctly', function(done) {
    const flow = [
      { id:'n1', type:'mmm-store', windowSize:0, persistent:false, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => {
        msgs.push(msg);
        if (msgs.length === 3) {
          var s = msgs[2].payload; // node sends stats object as payload
          s.min.should.equal(1);
          s.max.should.equal(3);
          s.avg.should.equal(2);
          done();
        }
      });
      n1.receive({ payload: 1 });
      n1.receive({ payload: 3 });
      n1.receive({ payload: 2 });
    });
  });

  it('should reset on msg.reset=true', function(done) {
    const flow = [
      { id:'n1', type:'mmm-store', windowSize:0, persistent:false, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n1.receive({ payload: 100 });
      n1.receive({ reset: true });
      n2.on('input', msg => {
        msg.payload.count.should.equal(1);
        msg.payload.avg.should.equal(5);
        done();
      });
      n1.receive({ payload: 5 });
    });
  });

  describe('persistent zero values', function () {
    it('should keep a stored minimum of 0 after a restart', function (done) {
      // Helper node created before n1: writes the state n1 would have stored before a restart
      function seedModule(RED) {
        RED.nodes.registerType('seed-context', function (config) {
          RED.nodes.createNode(this, config);
          var ctx = helper._context.get('n1', undefined);
          ctx.set('min', 0); ctx.set('max', 4); ctx.set('avg', 2); ctx.set('count', 2);
        });
      }
      const flow = [
        { id:'s1', type:'seed-context' },
        { id:'n1', type:'mmm-store', persistent:true, wires:[['n2']] },
        { id:'n2', type:'helper' }
      ];
      helper.load([seedModule, require('../mmm-store.js')], flow, function () {
        var n2 = helper.getNode('n2');
        n2.on('input', msg => {
          try {
            msg.payload.min.should.equal(0);
            msg.payload.count.should.equal(3);
            done();
          } catch (e) { done(e); }
        });
        helper.getNode('n1').receive({ payload: 7 });
      });
    });
  });
});
