const helper = require('node-red-node-test-helper');
const node   = require('../degree-days.js');
helper.init(require.resolve('node-red'));

describe('degree-days node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should accumulate degree days below heating limit', function(done) {
    const flow = [
      { id:'n1', type:'degree-days', heatingBase:20, heatingLimit:12, resetDay:1, persistent:false, decimals:1, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: 5 });  // today = 15
      n1.receive({ payload: 10 }); // today = 10
      setTimeout(() => {
        msgs[0].should.equal(15);
        msgs[1].should.equal(25);
        done();
      }, 50);
    });
  });

  it('should not accumulate above heating limit', function(done) {
    const flow = [
      { id:'n1', type:'degree-days', heatingBase:20, heatingLimit:12, resetDay:1, persistent:false, decimals:1, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(0);
        msg.degreeDays.degreeDayToday.should.equal(0);
        msg.degreeDays.heatingActive.should.equal(false);
        done();
      });
      n1.receive({ payload: 15 }); // above limit
    });
  });

  it('should reset on msg.reset=true', function(done) {
    const flow = [
      { id:'n1', type:'degree-days', heatingBase:20, heatingLimit:12, resetDay:1, persistent:false, decimals:1, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: 5 }); // acc = 15
      n1.receive({ reset: true });
      n1.receive({ payload: 5 }); // acc = 15 again
      setTimeout(() => {
        msgs[0].should.equal(15);
        msgs[1].should.equal(15);
        done();
      }, 50);
    });
  });

  it('should warn on non-numeric input', function(done) {
    const flow = [
      { id:'n1', type:'degree-days', heatingBase:20, heatingLimit:12, resetDay:1, persistent:false, decimals:1, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var received = false;
      n2.on('input', () => { received = true; });
      n1.receive({ payload: 'not-a-number' });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });
});
