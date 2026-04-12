const helper = require('node-red-node-test-helper');
const node   = require('../formula.js');
helper.init(require.resolve('node-red'));

describe('formula node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should evaluate a + b', function(done) {
    const flow = [
      { id:'n1', type:'formula', formula:'a + b', minVars:2, decimals:4, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(30);
        done();
      });
      n1.receive({ topic:'a', payload:10 });
      n1.receive({ topic:'b', payload:20 });
    });
  });

  it('should use inline constants: a * 1.5 + 100', function(done) {
    const flow = [
      { id:'n1', type:'formula', formula:'a * 1.5 + 100', minVars:1, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(130);
        done();
      });
      n1.receive({ topic:'a', payload:20 });
    });
  });

  it('should support power operator ^', function(done) {
    const flow = [
      { id:'n1', type:'formula', formula:'a^2 + b^2', minVars:2, decimals:4, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(25); // 3^2 + 4^2 = 9+16 = 25
        done();
      });
      n1.receive({ topic:'a', payload:3 });
      n1.receive({ topic:'b', payload:4 });
    });
  });

  it('should support math functions: sqrt(a^2 + b^2)', function(done) {
    const flow = [
      { id:'n1', type:'formula', formula:'sqrt(a^2 + b^2)', minVars:2, decimals:4, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(5); // sqrt(9+16) = 5
        done();
      });
      n1.receive({ topic:'a', payload:3 });
      n1.receive({ topic:'b', payload:4 });
    });
  });

  it('should not output before minVars reached', function(done) {
    const flow = [
      { id:'n1', type:'formula', formula:'a + b + c', minVars:3, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var received = false;
      n2.on('input', () => { received = true; });
      n1.receive({ topic:'a', payload:1 });
      n1.receive({ topic:'b', payload:2 });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });

  it('should reset state on msg.reset=true', function(done) {
    const flow = [
      { id:'n1', type:'formula', formula:'a + b', minVars:2, decimals:2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ topic:'a', payload:100 });
      n1.receive({ topic:'b', payload:200 }); // → outputs 300
      n1.receive({ reset: true });             // → clears state
      n1.receive({ topic:'a', payload:1 });    // → only a, no output
      setTimeout(() => {
        msgs.length.should.equal(1);  // only the 300 before reset
        msgs[0].should.equal(300);
        done();
      }, 50);
    });
  });

  it('should use pi constant', function(done) {
    const flow = [
      { id:'n1', type:'formula', formula:'r^2 * pi', minVars:1, decimals:4, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        var expected = parseFloat((Math.PI * 4).toFixed(4));
        msg.payload.should.equal(expected);
        done();
      });
      n1.receive({ topic:'r', payload:2 });
    });
  });
});
