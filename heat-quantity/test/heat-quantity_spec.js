const helper = require('node-red-node-test-helper');
const node   = require('../heat-quantity.js');
helper.init(require.resolve('node-red'));

describe('heat-quantity node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should calculate power: 2.5m3/h, dT=20K → ~58.15kW', function(done) {
    const flow = [
      { id:'n1', type:'heat-quantity', topicFlow:'flow', topicSupply:'supply', topicReturn:'return', medium:'water', persistent:false, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.be.approximately(58.15, 0.5);
        msg.heatQuantity.deltaT.should.equal(20);
        done();
      });
      n1.receive({ topic:'flow',   payload: 2.5 });
      n1.receive({ topic:'supply', payload: 70  });
      n1.receive({ topic:'return', payload: 50  });
    });
  });

  it('should use glycol30 factor (1.100)', function(done) {
    const flow = [
      { id:'n1', type:'heat-quantity', topicFlow:'flow', topicSupply:'supply', topicReturn:'return', medium:'glycol30', persistent:false, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.heatQuantity.factor.should.equal(1.1);
        msg.payload.should.be.approximately(11.0, 0.1); // 1.0 * 1.1 * 10
        done();
      });
      n1.receive({ topic:'flow',   payload: 1.0 });
      n1.receive({ topic:'supply', payload: 45  });
      n1.receive({ topic:'return', payload: 35  });
    });
  });

  it('should not output before all topics received', function(done) {
    const flow = [
      { id:'n1', type:'heat-quantity', topicFlow:'flow', topicSupply:'supply', topicReturn:'return', medium:'water', persistent:false, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var received = false;
      n2.on('input', () => { received = true; });
      n1.receive({ topic:'flow', payload: 2.5 });
      n1.receive({ topic:'supply', payload: 70 });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });

  it('should reset energy on msg.resetEnergy=true', function(done) {
    const flow = [
      { id:'n1', type:'heat-quantity', topicFlow:'flow', topicSupply:'supply', topicReturn:'return', medium:'water', persistent:false, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.heatQuantity.energyKwh));
      n1.receive({ topic:'flow',   payload: 2.5 });
      n1.receive({ topic:'supply', payload: 70  });
      n1.receive({ topic:'return', payload: 50  });
      n1.receive({ resetEnergy: true });
      n1.receive({ topic:'flow',   payload: 2.5 });
      setTimeout(() => {
        msgs[0].should.equal(0); // first output no dt
        done();
      }, 50);
    });
  });
});
