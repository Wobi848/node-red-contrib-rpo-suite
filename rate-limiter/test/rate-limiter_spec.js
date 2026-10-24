const helper = require('node-red-node-test-helper');
const node   = require('../rate-limiter.js');
helper.init(require.resolve('node-red'));

describe('rate-limiter node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should pass first value unchanged', function(done) {
    const flow = [
      { id:'n1', type:'rate-limiter', maxRate:10, unit:'per_s', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(50);
        done();
      });
      n1.receive({ payload: 50 });
    });
  });

  it('should limit large step changes', function(done) {
    const flow = [
      { id:'n1', type:'rate-limiter', maxRate:1, unit:'per_s', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      // First message sets lastOutput
      n1.receive({ payload: 0 });
      // Wait 100ms then jump to 100 → limited to 0 + 1*0.1 = 0.1
      setTimeout(() => {
        n1.receive({ payload: 100 });
        setTimeout(() => {
          msgs.length.should.equal(2);
          msgs[1].should.be.below(1.5); // limited
          done();
        }, 20);
      }, 100);
    });
  });

  describe('small steps', function () {
    it('should not stall when the step per message is below the rounding resolution', function (done) {
      const flow = [
        { id:'n1', type:'rate-limiter', maxRate:4, maxRateUnit:'per_s', decimals:0, wires:[['n2']] },
        { id:'n2', type:'helper' }
      ];
      helper.load(require('../rate-limiter.js'), flow, function () {
        var n1 = helper.getNode('n1');
        var n2 = helper.getNode('n2');
        var last;
        n2.on('input', msg => { last = msg; });
        n1.receive({ payload: 0 });
        var i = 0;
        var timer = setInterval(() => {
          n1.receive({ payload: 10 });
          if (++i === 6) {
            clearInterval(timer);
            try {
              last.payload.should.be.aboveOrEqual(1);
              last.rateLimiter.dt.should.be.above(0);
              done();
            } catch (e) { done(e); }
          }
        }, 100);
      });
    });
  });
});
