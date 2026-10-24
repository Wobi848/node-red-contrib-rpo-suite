const helper = require('node-red-node-test-helper');
const node   = require('../pwm.js');
helper.init(require.resolve('node-red'));

describe('pwm node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should output 1 for 100% duty cycle', function(done) {
    const flow = [
      { id:'n1', type:'pwm', period:1, periodUnit:'s', invert:false, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(1);
        done();
      });
      n1.receive({ payload: 100 });
    });
  });

  it('should output 0 for 0% after being at 100%', function(done) {
    const flow = [
      { id:'n1', type:'pwm', period:1, periodUnit:'s', invert:false, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      var msgs = [];
      n2.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: 100 }); // → 1
      n1.receive({ payload: 0 });   // → 0
      setTimeout(() => {
        msgs.should.containEql(0);
        done();
      }, 50);
    });
  });

  it('should clamp duty cycle 150% to 100% and output 1', function(done) {
    const flow = [
      { id:'n1', type:'pwm', period:1, periodUnit:'s', invert:false, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(1);
        done();
      });
      n1.receive({ payload: 150 });
    });
  });

  describe('frequent input updates', function () {
    it('should still switch off within the period when the input is resent often', function (done) {
      this.timeout(3000);
      const flow = [
        { id:'n1', type:'pwm', period:400, periodUnit:'ms', invert:false, wires:[['n2']] },
        { id:'n2', type:'helper' }
      ];
      helper.load(require('../pwm.js'), flow, function () {
        var n1 = helper.getNode('n1');
        var n2 = helper.getNode('n2');
        var outputs = [];
        n2.on('input', msg => outputs.push(msg.payload));
        var timer = setInterval(() => n1.receive({ payload: 50 }), 50);
        setTimeout(() => {
          clearInterval(timer);
          try {
            outputs.should.containEql(1);
            outputs.should.containEql(0);
            done();
          } catch (e) { done(e); }
        }, 900);
      });
    });
  });
});
