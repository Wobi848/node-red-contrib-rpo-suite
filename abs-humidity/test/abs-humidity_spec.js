const helper = require('node-red-node-test-helper');
const node   = require('../abs-humidity.js');
helper.init(require.resolve('node-red'));

describe('abs-humidity node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should calculate abs humidity for 20°C 50%', function(done) {
    const flow = [
      { id:'n1', type:'abs-humidity', topicTemp:'temp', topicRh:'rh', pressure:1013.25, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.be.approximately(7.24, 0.1);
        msg.absHumidity.dewPoint.should.be.approximately(9.27, 0.1);
        done();
      });
      n1.receive({ topic:'temp', payload: 20 });
      n1.receive({ topic:'rh',   payload: 50 });
    });
  });

  it('should not output before both values received', function(done) {
    const flow = [
      { id:'n1', type:'abs-humidity', topicTemp:'temp', topicRh:'rh', pressure:1013.25, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var received = false;
      n2.on('input', () => { received = true; });
      n1.receive({ topic:'temp', payload: 20 });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });

  it('should warn on rh > 100', function(done) {
    const flow = [
      { id:'n1', type:'abs-humidity', topicTemp:'temp', topicRh:'rh', pressure:1013.25, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var received = false;
      n2.on('input', () => { received = true; });
      n1.receive({ topic:'temp', payload: 20 });
      n1.receive({ topic:'rh',   payload: 110 });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });

  it('should reset on msg.reset=true', function(done) {
    const flow = [
      { id:'n1', type:'abs-humidity', topicTemp:'temp', topicRh:'rh', pressure:1013.25, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var count = 0;
      n2.on('input', () => count++);
      n1.receive({ topic:'temp', payload: 20 });
      n1.receive({ topic:'rh',   payload: 50 }); // outputs
      n1.receive({ reset: true });
      n1.receive({ topic:'temp', payload: 25 });  // only temp, no output
      setTimeout(() => { count.should.equal(1); done(); }, 50);
    });
  });

  it('should use pressure override', function(done) {
    const flow = [
      { id:'n1', type:'abs-humidity', topicTemp:'temp', topicRh:'rh', pressure:1013.25, decimals:4, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.absHumidity.pressure));
      n1.receive({ topic:'temp', payload: 20 });
      n1.receive({ topic:'rh', payload: 50, pressure: 900 });
      setTimeout(() => { msgs[0].should.equal(900); done(); }, 50);
    });
  });
});
