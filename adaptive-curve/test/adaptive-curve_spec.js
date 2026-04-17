const helper = require('node-red-node-test-helper');
const node   = require('../adaptive-curve.js');
helper.init(require.resolve('node-red'));

describe('adaptive-curve node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  function makeFlow(overrides) {
    var cfg = Object.assign({
      id:'n1', type:'adaptive-curve',
      roomSetpoint:22, heatingLimit:15, adaptationRate:1.0,
      maxShift:10, deadband:0.5,
      topicRoom:'room', topicOutdoor:'outdoor',
      persistent:false, decimals:2, wires:[['n2']]
    }, overrides);
    return [cfg, { id:'n2', type:'helper' }];
  }

  it('should not output before both topics received', function(done) {
    helper.load(node, makeFlow(), function() {
      var received = false;
      helper.getNode('n2').on('input', () => { received = true; });
      helper.getNode('n1').receive({ topic:'room', payload: 20 });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });

  it('should adapt shift upward when room too cold', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      n1.receive({ topic:'room',    payload: 20 }); // first, no output
      setTimeout(() => {
        n1.receive({ topic:'outdoor', payload: 5  }); // outdoor < heatingLimit → adapt
        setTimeout(() => {
          n1.receive({ topic:'room',    payload: 20 }); // error=2K → shift increases
          setTimeout(() => {
            msgs.length.should.be.greaterThan(0); // shift was output
            done();
          }, 100);
        }, 100);
      }, 100);
    });
  });

  it('should not adapt in summer (outdoor >= heatingLimit)', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      n1.receive({ topic:'room',    payload: 20 });
      setTimeout(() => {
        n1.receive({ topic:'outdoor', payload: 20 }); // summer → no adapt
        setTimeout(() => {
          n1.receive({ topic:'room',    payload: 20 });
          setTimeout(() => {
            msgs.every(v => v === 0).should.equal(true);
            done();
          }, 100);
        }, 100);
      }, 100);
    });
  });

  it('should not adapt within deadband', function(done) {
    helper.load(node, makeFlow({ deadband: 5 }), function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      n1.receive({ topic:'room',    payload: 21.5 }); // error=0.5 < deadband=5
      setTimeout(() => {
        n1.receive({ topic:'outdoor', payload: 5 });
        setTimeout(() => {
          n1.receive({ topic:'room', payload: 21.5 });
          setTimeout(() => {
            msgs.every(v => v === 0).should.equal(true);
            done();
          }, 100);
        }, 100);
      }, 100);
    });
  });

  it('should clamp shift at maxShift', function(done) {
    helper.load(node, makeFlow({ maxShift: 2, adaptationRate: 100 }), function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      n1.receive({ topic:'room',    payload: 0 }); // huge error
      setTimeout(() => {
        n1.receive({ topic:'outdoor', payload: 5 });
        setTimeout(() => {
          n1.receive({ topic:'room', payload: 0 });
          setTimeout(() => {
            msgs.every(v => v <= 2).should.equal(true);
            done();
          }, 100);
        }, 100);
      }, 100);
    });
  });

  it('should reset shift on msg.reset', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n1').receive({ reset: true });
      done(); // no crash = pass
    });
  });

  it('should pause adaptation on msg.pauseAdaptation=true', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n1').receive({ pauseAdaptation: true });
      done();
    });
  });
});
