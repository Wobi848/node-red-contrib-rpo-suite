const helper = require('node-red-node-test-helper');
const node   = require('../limit-counter.js');
helper.init(require.resolve('node-red'));

describe('limit-counter node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should count rising edge crossings', function(done) {
    const flow = [
      { id:'n1', type:'limit-counter', threshold:10, hysteresis:1, alarmCount:3, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var counts = [];
      n2.on('input', msg => counts.push(msg.payload));
      // below → above (count 1) → below → above (count 2) → below → above (count 3)
      n1.receive({ payload: 5  });  // below
      n1.receive({ payload: 15 });  // above → count 1
      n1.receive({ payload: 5  });  // below
      n1.receive({ payload: 15 });  // above → count 2
      n1.receive({ payload: 5  });  // below
      n1.receive({ payload: 15 });  // above → count 3
      setTimeout(() => {
        counts.should.containEql(3);
        done();
      }, 50);
    });
  });

  it('should reset on msg.reset=true', function(done) {
    const flow = [
      { id:'n1', type:'limit-counter', threshold:10, hysteresis:1, alarmCount:3, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n1.receive({ payload: 15 }); // count 1
      n1.receive({ reset: true });
      var counts = [];
      n2.on('input', msg => counts.push(msg.payload));
      n1.receive({ payload: 5  }); // below
      n1.receive({ payload: 15 }); // count 1 again after reset
      setTimeout(() => {
        counts[counts.length-1].should.equal(1);
        done();
      }, 50);
    });
  });
});
