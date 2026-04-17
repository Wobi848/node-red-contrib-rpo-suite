const helper = require('node-red-node-test-helper');
const node   = require('../priority.js');
helper.init(require.resolve('node-red'));

describe('priority node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  const topics = JSON.stringify([
    { topic:'manual', label:'Hand',   priority:1 },
    { topic:'remote', label:'Remote', priority:2 },
    { topic:'auto',   label:'Auto',   priority:3 }
  ]);

  function makeFlow() {
    return [
      { id:'n1', type:'priority', topics: topics, defaultValue: null, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
  }

  it('should output auto when only auto active', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(22);
        msg.priority.winner.should.equal('auto');
        done();
      });
      helper.getNode('n1').receive({ topic:'auto', payload: 22 });
    });
  });

  it('should prefer higher priority (lower number)', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg));
      n1.receive({ topic:'auto',   payload: 22 });
      n1.receive({ topic:'remote', payload: 24 });
      setTimeout(() => {
        msgs[msgs.length-1].payload.should.equal(24);
        msgs[msgs.length-1].priority.winner.should.equal('remote');
        done();
      }, 50);
    });
  });

  it('should prefer manual over remote and auto', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg));
      n1.receive({ topic:'auto',   payload: 22 });
      n1.receive({ topic:'remote', payload: 24 });
      n1.receive({ topic:'manual', payload: 20 });
      setTimeout(() => {
        msgs[msgs.length-1].payload.should.equal(20);
        msgs[msgs.length-1].priority.winner.should.equal('manual');
        done();
      }, 50);
    });
  });

  it('should fall back when manual goes null', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg));
      n1.receive({ topic:'auto',   payload: 22 });
      n1.receive({ topic:'manual', payload: 20 });
      n1.receive({ topic:'manual', payload: null }); // deactivate manual
      setTimeout(() => {
        msgs[msgs.length-1].payload.should.equal(22);
        msgs[msgs.length-1].priority.winner.should.equal('auto');
        done();
      }, 50);
    });
  });

  it('should output defaultValue when no active inputs', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        (msg.payload === null).should.equal(true);
        done();
      });
      helper.getNode('n1').receive({ topic:'auto', payload: null });
    });
  });

  it('should reset on msg.reset', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      var count = 0;
      helper.getNode('n2').on('input', () => { count++; });
      n1.receive({ topic:'auto', payload: 22 }); // 1 output
      n1.receive({ reset: true });               // no output
      setTimeout(() => { count.should.equal(1); done(); }, 50);
    });
  });

  it('should warn on unknown topic', function(done) {
    helper.load(node, makeFlow(), function() {
      var received = false;
      helper.getNode('n2').on('input', () => { received = true; });
      helper.getNode('n1').receive({ topic:'unknown', payload: 5 });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });
});
