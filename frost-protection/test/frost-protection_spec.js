const helper = require('node-red-node-test-helper');
const node   = require('../frost-protection.js');
helper.init(require.resolve('node-red'));

describe('frost-protection node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should activate in binary mode below threshold', function(done) {
    const flow = [
      { id:'n1', type:'frost-protection', mode:'binary', frostThreshold:-5, hysteresis:2, minTemp:-15, topicOutdoor:'outdoor', topicSupply:'supply', decimals:1, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(true);
        done();
      });
      n1.receive({ topic:'outdoor', payload: -8 });
    });
  });

  it('should deactivate in binary mode above threshold + hysteresis', function(done) {
    const flow = [
      { id:'n1', type:'frost-protection', mode:'binary', frostThreshold:-5, hysteresis:2, minTemp:-15, topicOutdoor:'outdoor', topicSupply:'supply', decimals:1, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ topic:'outdoor', payload: -8 }); // ON
      n1.receive({ topic:'outdoor', payload: -2 }); // above -5+2=-3 → OFF
      setTimeout(() => {
        msgs[0].should.equal(true);
        msgs[1].should.equal(false);
        done();
      }, 50);
    });
  });

  it('should calculate proportional output', function(done) {
    const flow = [
      { id:'n1', type:'frost-protection', mode:'proportional', frostThreshold:-5, hysteresis:2, minTemp:-15, topicOutdoor:'outdoor', topicSupply:'supply', decimals:1, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.be.approximately(50, 1); // (-5 - (-10)) / (-5 - (-15)) = 5/10 = 50%
        done();
      });
      n1.receive({ topic:'outdoor', payload: -10 });
    });
  });

  it('should use supply temp when colder than outdoor', function(done) {
    const flow = [
      { id:'n1', type:'frost-protection', mode:'binary', frostThreshold:-5, hysteresis:2, minTemp:-15, topicOutdoor:'outdoor', topicSupply:'supply', decimals:1, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(true); // supply is colder → frost
        done();
      });
      n1.receive({ topic:'outdoor', payload: 0 });
      n1.receive({ topic:'supply',  payload: -8 }); // supply colder → triggers
    });
  });

  it('should handle msg.override=true', function(done) {
    const flow = [
      { id:'n1', type:'frost-protection', mode:'binary', frostThreshold:-5, hysteresis:2, minTemp:-15, topicOutdoor:'outdoor', topicSupply:'supply', decimals:1, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(true);
        done();
      });
      n1.receive({ topic:'outdoor', payload: 10, override: true }); // warm but forced ON
    });
  });
});
