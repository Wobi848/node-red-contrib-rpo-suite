const helper = require('node-red-node-test-helper');
const node   = require('../enthalpy.js');
helper.init(require.resolve('node-red'));

describe('enthalpy node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should calculate enthalpy in single mode (20°C 50%)', function(done) {
    const flow = [
      { id:'n1', type:'enthalpy', mode:'single', topicTempIn:'temp', topicRhIn:'rh', decimals:1, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.be.approximately(38.8, 1);
        done();
      });
      n1.receive({ topic:'temp', payload: 20 });
      n1.receive({ topic:'rh',   payload: 50 });
    });
  });

  it('should recommend WRG ON when indoor enthalpy > outdoor', function(done) {
    const flow = [
      { id:'n1', type:'enthalpy', mode:'compare', topicTempIn:'tempIn', topicRhIn:'rhIn', topicTempOut:'tempOut', topicRhOut:'rhOut', decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(true); // indoor > outdoor → WRG ON
        done();
      });
      n1.receive({ topic:'tempIn',  payload: 22 });
      n1.receive({ topic:'rhIn',    payload: 55 });
      n1.receive({ topic:'tempOut', payload: 5  });
      n1.receive({ topic:'rhOut',   payload: 80 });
    });
  });

  it('should recommend WRG OFF when outdoor enthalpy > indoor', function(done) {
    const flow = [
      { id:'n1', type:'enthalpy', mode:'compare', topicTempIn:'tempIn', topicRhIn:'rhIn', topicTempOut:'tempOut', topicRhOut:'rhOut', decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(false); // outdoor > indoor → WRG OFF
        done();
      });
      n1.receive({ topic:'tempIn',  payload: 5  });
      n1.receive({ topic:'rhIn',    payload: 80 });
      n1.receive({ topic:'tempOut', payload: 35 });
      n1.receive({ topic:'rhOut',   payload: 60 });
    });
  });

  it('should not output before all values in compare mode', function(done) {
    const flow = [
      { id:'n1', type:'enthalpy', mode:'compare', topicTempIn:'tempIn', topicRhIn:'rhIn', topicTempOut:'tempOut', topicRhOut:'rhOut', decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var received = false;
      n2.on('input', () => { received = true; });
      n1.receive({ topic:'tempIn', payload: 22 });
      n1.receive({ topic:'rhIn',   payload: 55 });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });
});
