const helper = require('node-red-node-test-helper');
const node   = require('../min-off-time.js');
helper.init(require.resolve('node-red'));

describe('min-off-time node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should output false on falsy input', function(done) {
    const flow = [
      { id:'n1', type:'min-off-time', minOffTime:100, minOffTimeUnit:'ms', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(false);
        done();
      });
      n1.receive({ payload: false });
    });
  });

  it('should hold output OFF when input goes true before timer', function(done) {
    this.timeout(500);
    const flow = [
      { id:'n1', type:'min-off-time', minOffTime:200, minOffTimeUnit:'ms', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: false });
      setTimeout(() => n1.receive({ payload: true }), 50); // before timer
      setTimeout(() => {
        msgs.filter(v => v === false).length.should.be.above(0);
        done();
      }, 100);
    });
  });

  it('should output true after timer when input was true', function(done) {
    this.timeout(500);
    const flow = [
      { id:'n1', type:'min-off-time', minOffTime:150, minOffTimeUnit:'ms', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: false });
      setTimeout(() => n1.receive({ payload: true }), 30);
      setTimeout(() => {
        msgs.should.containEql(true);
        done();
      }, 300);
    });
  });

  it('should output true immediately if timer already elapsed', function(done) {
    this.timeout(500);
    const flow = [
      { id:'n1', type:'min-off-time', minOffTime:50, minOffTimeUnit:'ms', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: false });
      setTimeout(() => {
        n1.receive({ payload: true }); // after timer
        setTimeout(() => {
          msgs.should.containEql(true);
          done();
        }, 30);
      }, 100);
    });
  });

  it('should bypass minimum on msg.bypassMin=true', function(done) {
    const flow = [
      { id:'n1', type:'min-off-time', minOffTime:5000, minOffTimeUnit:'ms', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: false });
      n1.receive({ payload: true, bypassMin: true });
      setTimeout(() => {
        msgs.should.containEql(true);
        done();
      }, 50);
    });
  });

  it('should force ON on msg.reset=true', function(done) {
    const flow = [
      { id:'n1', type:'min-off-time', minOffTime:5000, minOffTimeUnit:'ms', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: false });
      n1.receive({ reset: true });
      setTimeout(() => {
        msgs.should.containEql(true);
        done();
      }, 50);
    });
  });
});
