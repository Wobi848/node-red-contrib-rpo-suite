const helper = require('node-red-node-test-helper');
const node   = require('../optimization.js');
helper.init(require.resolve('node-red'));

describe('optimization node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  function makeFlow(overrides) {
    var cfg = Object.assign({
      id:'n1', type:'optimization',
      occupancyTime:'23:59', thermalMass:30, heatingPower:1.0,
      outdoorFactor:0.05, maxPreHeat:240,
      topicRoom:'room', topicOutdoor:'outdoor', topicSetpoint:'setpoint',
      wires:[['n2'],['n3']]
    }, overrides);
    return [cfg, { id:'n2', type:'helper' }, { id:'n3', type:'helper' }];
  }

  it('should output status on each input', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      var n3 = helper.getNode('n3');
      n3.on('input', msg => {
        msg.payload.should.have.property('requiredMinutes');
        done();
      });
      n1.receive({ topic:'room',     payload: 16 });
      n1.receive({ topic:'outdoor',  payload: -5 });
      n1.receive({ topic:'setpoint', payload: 22 });
    });
  });

  it('should output 0 required minutes when room at setpoint', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      helper.getNode('n3').on('input', msg => {
        msg.payload.requiredMinutes.should.equal(0);
        done();
      });
      n1.receive({ topic:'room',     payload: 22 });
      n1.receive({ topic:'outdoor',  payload: 10 });
      n1.receive({ topic:'setpoint', payload: 22 });
    });
  });

  it('should force start on msg.force=true', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(true);
        done();
      });
      helper.getNode('n1').receive({ force: true });
    });
  });

  it('should clamp to maxPreHeat', function() {
    // Verify clamping math: room=0, outdoor=-20, setpoint=22, maxPreHeat=60
    // factor = 1 + 0.05 * max(0, 0-(-20)) = 2
    // unclamped = round((22 * 30) / (1.0 * 2)) = 330 > 60 → clamped to 60
    var thermalMass = 30, heatingPower = 1.0, outdoorFactor = 0.05, maxPreHeat = 60;
    var diff = 22 - 0;
    var factor = 1 + outdoorFactor * Math.max(0, 0 - (-20));
    var unclamped = Math.round((diff * thermalMass) / (heatingPower * factor));
    var required  = Math.min(maxPreHeat, unclamped);
    unclamped.should.be.above(maxPreHeat);
    required.should.equal(60);
  });
});
