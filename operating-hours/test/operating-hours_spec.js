const helper = require('node-red-node-test-helper');
const node   = require('../operating-hours.js');
helper.init(require.resolve('node-red'));

describe('operating-hours node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should start counting on truthy input', function(done) {
    const flow = [
      { id:'n1', type:'operating-hours', serviceInterval:1000, decimals:2, persistent:false, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.running.should.equal(true);
        msg.payload.starts.should.equal(1);
        done();
      });
      n1.receive({ payload: true });
    });
  });

  it('should stop counting on falsy input', function(done) {
    const flow = [
      { id:'n1', type:'operating-hours', serviceInterval:1000, decimals:2, persistent:false, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: true });
      n1.receive({ payload: false });
      setTimeout(() => {
        msgs.length.should.equal(2);
        msgs[0].running.should.equal(true);
        msgs[1].running.should.equal(false);
        done();
      }, 50);
    });
  });

  it('should count starts correctly', function(done) {
    const flow = [
      { id:'n1', type:'operating-hours', serviceInterval:1000, decimals:2, persistent:false, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload.starts));
      n1.receive({ payload: true });
      n1.receive({ payload: false });
      n1.receive({ payload: true });
      n1.receive({ payload: false });
      setTimeout(() => {
        msgs[msgs.length - 1].should.equal(2);
        done();
      }, 50);
    });
  });

  it('should trigger service alarm when interval reached', function(done) {
    const flow = [
      { id:'n1', type:'operating-hours', serviceInterval:0.000001, decimals:4, persistent:false, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n3 = helper.getNode('n3');
      n3.on('input', msg => {
        msg.payload.should.equal(true);
        done();
      });
      n1.receive({ payload: true });
      setTimeout(() => n1.receive({ payload: false }), 100);
    });
  });

  it('should reset all on msg.reset=true', function(done) {
    const flow = [
      { id:'n1', type:'operating-hours', serviceInterval:1000, decimals:2, persistent:false, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: true });
      n1.receive({ payload: false });
      n1.receive({ reset: true });
      setTimeout(() => {
        var last = msgs[msgs.length - 1];
        last.starts.should.equal(0);
        last.runtimeHours.should.equal(0);
        done();
      }, 50);
    });
  });

  it('should reset service alarm on msg.resetService=true', function(done) {
    const flow = [
      { id:'n1', type:'operating-hours', serviceInterval:1000, decimals:2, persistent:false, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: true });
      n1.receive({ payload: false });
      n1.receive({ resetService: true });
      setTimeout(() => {
        var last = msgs[msgs.length - 1];
        last.serviceDue.should.equal(false);
        last.runtimeHours.should.equal(0);
        done();
      }, 50);
    });
  });
});
