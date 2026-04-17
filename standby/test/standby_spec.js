const helper = require('node-red-node-test-helper');
const node   = require('../standby.js');
helper.init(require.resolve('node-red'));

describe('standby node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  function makeFlow(overrides) {
    var cfg = Object.assign({ id:'n1', type:'standby', comfortSetpoint:22, standbyOffset:-4, frostSetpoint:8, initialMode:'comfort', wires:[['n2'],['n3']] }, overrides);
    return [cfg, { id:'n2', type:'helper' }, { id:'n3', type:'helper' }];
  }

  it('should output comfort setpoint in comfort mode', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(22);
        done();
      });
      helper.getNode('n1').receive({ mode: 'comfort' });
    });
  });

  it('should output standby setpoint (comfort + offset)', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(18);
        done();
      });
      helper.getNode('n1').receive({ mode: 'standby' });
    });
  });

  it('should output frost setpoint', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(8);
        done();
      });
      helper.getNode('n1').receive({ mode: 'frost' });
    });
  });

  it('should switch mode via msg.topic', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(18);
        done();
      });
      helper.getNode('n1').receive({ topic: 'standby' });
    });
  });

  it('should send Output 2 only on mode change', function(done) {
    helper.load(node, makeFlow({ initialMode: 'comfort' }), function() {
      var n1 = helper.getNode('n1');
      var modeMsgs = [];
      helper.getNode('n3').on('input', msg => modeMsgs.push(msg.payload));
      n1.receive({ mode: 'comfort' }); // same → no Output 2
      n1.receive({ mode: 'standby' }); // change → Output 2
      n1.receive({ mode: 'standby' }); // same → no Output 2
      setTimeout(() => {
        modeMsgs.length.should.equal(1);
        modeMsgs[0].should.equal('standby');
        done();
      }, 50);
    });
  });

  it('should warn on invalid mode', function(done) {
    helper.load(node, makeFlow(), function() {
      var received = false;
      helper.getNode('n2').on('input', msg => {
        // should output current mode (comfort=22) since invalid is ignored
        if (msg.payload === 22) received = true;
      });
      helper.getNode('n1').receive({ mode: 'invalid' });
      setTimeout(() => { received.should.equal(true); done(); }, 50);
    });
  });
});
