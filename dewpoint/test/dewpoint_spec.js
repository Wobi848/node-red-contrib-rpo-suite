const helper = require('node-red-node-test-helper');
const node   = require('../dewpoint.js');
helper.init(require.resolve('node-red'));

describe('dewpoint node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should calculate dew point for 20°C 50%', function(done) {
    const flow = [
      { id:'n1', type:'dewpoint', topicTemp:'temp', topicRh:'rh', topicSurface:'', alarmOffset:2, decimals:1, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.be.approximately(9.3, 0.2);
        done();
      });
      n1.receive({ topic:'temp', payload: 20 });
      n1.receive({ topic:'rh',   payload: 50 });
    });
  });

  it('should trigger alarm when dew point near surface temp', function(done) {
    const flow = [
      { id:'n1', type:'dewpoint', topicTemp:'temp', topicRh:'rh', topicSurface:'', alarmOffset:5, decimals:1, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n3 = helper.getNode('n3');
      n3.on('input', msg => {
        msg.payload.should.equal(true);
        done();
      });
      n1.receive({ topic:'temp', payload: 20 });
      n1.receive({ topic:'rh',   payload: 95 }); // dew point ~19°C, margin < 5K
    });
  });

  it('should output alarm only on state change', function(done) {
    const flow = [
      { id:'n1', type:'dewpoint', topicTemp:'temp', topicRh:'rh', topicSurface:'', alarmOffset:2, decimals:1, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n3 = helper.getNode('n3');
      var alarmCount = 0;
      n3.on('input', () => alarmCount++);
      n1.receive({ topic:'temp', payload: 20 });
      n1.receive({ topic:'rh',   payload: 50 }); // no alarm
      n1.receive({ topic:'rh',   payload: 50 }); // no alarm again, no output
      setTimeout(() => { alarmCount.should.equal(0); done(); }, 50);
    });
  });

  it('should handle rh=100 (saturated)', function(done) {
    const flow = [
      { id:'n1', type:'dewpoint', topicTemp:'temp', topicRh:'rh', topicSurface:'', alarmOffset:2, decimals:1, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.be.approximately(20, 0.5);
        done();
      });
      n1.receive({ topic:'temp', payload: 20 });
      n1.receive({ topic:'rh',   payload: 100 });
    });
  });
});
