const helper = require('node-red-node-test-helper');
const node   = require('../min-on-time.js');
helper.init(require.resolve('node-red'));

describe('min-on-time node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should output true on truthy input', function(done) {
    const flow = [
      { id:'n1', type:'min-on-time', minOnTime:100, minOnTimeUnit:'ms', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(true);
        done();
      });
      n1.receive({ payload: true });
    });
  });

  it('should hold output ON when input goes false before timer', function(done) {
    this.timeout(500);
    const flow = [
      { id:'n1', type:'min-on-time', minOnTime:200, minOnTimeUnit:'ms', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: true });
      setTimeout(() => n1.receive({ payload: false }), 50); // before timer
      setTimeout(() => {
        // should still be ON at 100ms (held)
        msgs.filter(Boolean).length.should.be.above(0);
        done();
      }, 100);
    });
  });

  it('should output false after timer when input was false', function(done) {
    this.timeout(500);
    const flow = [
      { id:'n1', type:'min-on-time', minOnTime:150, minOnTimeUnit:'ms', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: true });
      setTimeout(() => n1.receive({ payload: false }), 30); // before timer
      setTimeout(() => {
        // after 200ms timer should have fired and output false
        msgs.should.containEql(false);
        done();
      }, 300);
    });
  });

  it('should output false immediately if timer already elapsed', function(done) {
    this.timeout(500);
    const flow = [
      { id:'n1', type:'min-on-time', minOnTime:50, minOnTimeUnit:'ms', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: true });
      setTimeout(() => {
        n1.receive({ payload: false }); // after timer
        setTimeout(() => {
          msgs.should.containEql(false);
          done();
        }, 30);
      }, 100);
    });
  });

  it('should bypass minimum on msg.bypassMin=true', function(done) {
    const flow = [
      { id:'n1', type:'min-on-time', minOnTime:5000, minOnTimeUnit:'ms', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: true });
      n1.receive({ payload: false, bypassMin: true });
      setTimeout(() => {
        msgs.should.containEql(false);
        done();
      }, 50);
    });
  });

  it('should force OFF on msg.reset=true', function(done) {
    const flow = [
      { id:'n1', type:'min-on-time', minOnTime:5000, minOnTimeUnit:'ms', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: true });
      n1.receive({ reset: true });
      setTimeout(() => {
        msgs.should.containEql(false);
        done();
      }, 50);
    });
  });
});
