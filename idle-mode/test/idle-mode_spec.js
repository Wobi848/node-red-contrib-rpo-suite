const helper = require('node-red-node-test-helper');
const node   = require('../idle-mode.js');
helper.init(require.resolve('node-red'));

describe('idle-mode node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should trigger exercise on msg.exercise=true', function(done) {
    const flow = [
      { id:'n1', type:'idle-mode', exerciseInterval:7, exerciseIntervalUnit:'days', exerciseDuration:0.1, persistent:false, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(true);
        done();
      });
      helper.getNode('n1').receive({ exercise: true });
    });
  });

  it('should stop exercise after duration', function(done) {
    const flow = [
      { id:'n1', type:'idle-mode', exerciseInterval:7, exerciseIntervalUnit:'days', exerciseDuration:0.1, persistent:false, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      helper.getNode('n1').receive({ exercise: true });
      setTimeout(() => {
        msgs.should.containEql(false); // exercise ended
        done();
      }, 300);
    });
  });

  it('should not exercise when equipment is running', function(done) {
    const flow = [
      { id:'n1', type:'idle-mode', exerciseInterval:7, exerciseIntervalUnit:'days', exerciseDuration:60, persistent:false, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      helper.getNode('n1').receive({ payload: true }); // running
      var exerciseStarted = false;
      helper.getNode('n2').on('input', msg => { if (msg.payload === true) exerciseStarted = true; });
      helper.getNode('n1').receive({ exercise: true }); // should skip
      setTimeout(() => { exerciseStarted.should.equal(false); done(); }, 50);
    });
  });

  it('should reset idle timer on msg.reset', function(done) {
    const flow = [
      { id:'n1', type:'idle-mode', exerciseInterval:7, exerciseIntervalUnit:'days', exerciseDuration:60, persistent:false, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      helper.getNode('n1').receive({ reset: true });
      done(); // no crash = pass
    });
  });

  describe('exercise countdown', function () {
    it('should count down the remaining exercise time', function (done) {
      this.timeout(4000);
      const flow = [{ id:'n1', type:'idle-mode', exerciseInterval:7, exerciseIntervalUnit:'days', exerciseDuration:10, persistent:false, wires:[['n2']] }, { id:'n2', type:'helper' }];
      helper.load(require('../idle-mode.js'), flow, function () {
        var n1 = helper.getNode('n1');
        n1.receive({ exercise: true });
        setTimeout(() => {
          try { n1.remainingExercise.should.be.below(10); done(); } catch (e) { done(e); }
        }, 2300);
      });
    });
  });
});
