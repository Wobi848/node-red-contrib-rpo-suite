const helper = require('node-red-node-test-helper');
const node   = require('../co2-controller.js');
helper.init(require.resolve('node-red'));

describe('co2-controller node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  function makeFlow(overrides) {
    var cfg = Object.assign({ id:'n1', type:'co2-controller', minLevel:800, maxLevel:1200, alarmLevel:1500, minVentilation:20, hysteresis:50, decimals:1, wires:[['n2'],['n3']] }, overrides);
    return [cfg, { id:'n2', type:'helper' }, { id:'n3', type:'helper' }];
  }

  it('should output minVentilation below minLevel', function(done) {
    helper.load(node, makeFlow(), function() {
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(20);
        done();
      });
      helper.getNode('n1').receive({ payload: 600 });
    });
  });

  it('should output 100% above maxLevel', function(done) {
    helper.load(node, makeFlow(), function() {
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(100);
        done();
      });
      helper.getNode('n1').receive({ payload: 1300 });
    });
  });

  it('should calculate proportional ventilation at midpoint', function(done) {
    helper.load(node, makeFlow(), function() {
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        // co2=1000, range 800-1200, ratio=0.5 → 20 + 0.5*(100-20) = 60%
        msg.payload.should.be.approximately(60, 0.5);
        done();
      });
      helper.getNode('n1').receive({ payload: 1000 });
    });
  });

  it('should send alarm only on state change', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      var alarmMsgs = [];
      helper.getNode('n3').on('input', msg => alarmMsgs.push(msg.payload));
      n1.receive({ payload: 1600 }); // alarm ON
      n1.receive({ payload: 1700 }); // still alarm → no second msg
      n1.receive({ payload: 800  }); // alarm OFF
      setTimeout(() => {
        alarmMsgs.length.should.equal(2);
        alarmMsgs[0].should.equal(true);
        alarmMsgs[1].should.equal(false);
        done();
      }, 50);
    });
  });

  it('should apply override', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(35);
        msg.co2Controller.override.should.equal(35);
        done();
      });
      n1.receive({ payload: 800, override: 35 });
    });
  });

  it('should clear override', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg));
      n1.receive({ payload: 800, override: 35 });
      n1.receive({ payload: 800, clearOverride: true });
      setTimeout(() => {
        msgs[0].payload.should.equal(35);
        msgs[1].payload.should.equal(20); // back to auto: below minLevel → minVentilation
        msgs[1].co2Controller.override.should.equal(false);
        done();
      }, 50);
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

  it('should include category in co2Controller info', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.co2Controller.category.should.equal('I');
        done();
      });
      helper.getNode('n1').receive({ payload: 700 });
    });
  });
});
