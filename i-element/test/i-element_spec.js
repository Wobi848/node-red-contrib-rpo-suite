const helper = require('node-red-node-test-helper');
const node   = require('../i-element.js');
helper.init(require.resolve('node-red'));

describe('i-element node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  function makeFlow(overrides) {
    var cfg = Object.assign({ id:'n1', type:'i-element', Ti:60, TiUnit:'s', outMin:0, outMax:100, decimals:2, wires:[['n2']] }, overrides);
    return [cfg, { id:'n2', type:'helper' }];
  }

  it('should not output on first message (no dt)', function(done) {
    helper.load(node, makeFlow(), function() {
      var received = false;
      helper.getNode('n2').on('input', () => { received = true; });
      helper.getNode('n1').receive({ payload: 5 });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });

  it('should integrate over time', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: 60 }); // first → no output
      setTimeout(() => {
        n1.receive({ payload: 60 }); // dt≈0.1s → 60*0.1/60 ≈ 0.1
        setTimeout(() => {
          msgs.length.should.equal(1);
          msgs[0].should.be.approximately(0.1, 0.05);
          done();
        }, 20);
      }, 100);
    });
  });

  it('should clamp at outMax', function(done) {
    helper.load(node, makeFlow({ outMax: 1 }), function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg));
      n1.receive({ payload: 1000 });
      setTimeout(() => {
        n1.receive({ payload: 1000 }); // huge integral → clamped
        setTimeout(() => {
          msgs[0].payload.should.equal(1);
          msgs[0].iElement.clamped.should.equal(true);
          done();
        }, 20);
      }, 200);
    });
  });

  it('should reset integral to 0', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      n1.receive({ payload: 5 });
      n1.receive({ reset: true });
      var received = false;
      helper.getNode('n2').on('input', () => { received = true; });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });

  it('should warn on non-numeric input', function(done) {
    helper.load(node, makeFlow(), function() {
      var received = false;
      helper.getNode('n2').on('input', () => { received = true; });
      helper.getNode('n1').receive({ payload: 'bad' });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });
});
