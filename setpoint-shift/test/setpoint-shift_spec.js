const helper = require('node-red-node-test-helper');
const node   = require('../setpoint-shift.js');
helper.init(require.resolve('node-red'));

describe('setpoint-shift node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  // outdoorRef=15, outdoorMin=-10, setpointBase=20, setpointMax=70
  function makeFlow(overrides) {
    var cfg = Object.assign({
      id:'n1', type:'setpoint-shift',
      outdoorRef:15, outdoorMin:-10, setpointBase:20, setpointMax:70,
      limitLow:'', limitHigh:'', decimals:1, wires:[['n2']]
    }, overrides);
    return [cfg, { id:'n2', type:'helper' }];
  }

  it('should return setpointBase at outdoor >= outdoorRef', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(20);
        done();
      });
      helper.getNode('n1').receive({ payload: 20 }); // above ref
    });
  });

  it('should return setpointMax at outdoor <= outdoorMin', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(70);
        done();
      });
      helper.getNode('n1').receive({ payload: -15 }); // below min
    });
  });

  it('should interpolate at midpoint outdoor', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        // outdoor=2.5, midpoint between -10 and 15 → ratio=0.5 → SP=45
        msg.payload.should.be.approximately(45, 0.5);
        done();
      });
      helper.getNode('n1').receive({ payload: 2.5 });
    });
  });

  it('should return setpointBase exactly at outdoorRef', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(20);
        done();
      });
      helper.getNode('n1').receive({ payload: 15 });
    });
  });

  it('should apply limitHigh clamp', function(done) {
    helper.load(node, makeFlow({ limitHigh: 50, limitLow: '' }), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(50); // clamped from 70
        done();
      });
      helper.getNode('n1').receive({ payload: -15 }); // would be 70 → clamped to 50
    });
  });

  it('should apply limitLow clamp', function(done) {
    helper.load(node, makeFlow({ limitLow: 25, limitHigh: '' }), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(25); // clamped from 20
        done();
      });
      helper.getNode('n1').receive({ payload: 20 }); // would be 20 → clamped to 25
    });
  });

  it('should include setpointShift info object', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.setpointShift.should.have.property('outdoor');
        msg.setpointShift.should.have.property('setpoint');
        msg.setpointShift.should.have.property('outdoorRef');
        done();
      });
      helper.getNode('n1').receive({ payload: 10 });
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
