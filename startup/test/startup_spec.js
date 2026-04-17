const helper = require('node-red-node-test-helper');
const node   = require('../startup.js');
helper.init(require.resolve('node-red'));

describe('startup node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should start ramp and reach 100%', function(done) {
    const flow = [
      { id:'n1', type:'startup', startSpeed:0, preRunTime:0, preRunSpeed:100, rampTime:0.1, rampDownTime:0, postRunTime:0, postRunSpeed:30, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      helper.getNode('n1').receive({ payload: true });
      setTimeout(() => {
        msgs.should.containEql(100);
        done();
      }, 300);
    });
  });

  it('should stop and output 0 on false', function(done) {
    const flow = [
      { id:'n1', type:'startup', startSpeed:0, preRunTime:0, preRunSpeed:100, rampTime:0.05, rampDownTime:0, postRunTime:0, postRunSpeed:30, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: true });
      setTimeout(() => {
        n1.receive({ payload: false });
        setTimeout(() => {
          msgs.should.containEql(0);
          done();
        }, 100);
      }, 200);
    });
  });

  it('should bypass ramp on msg.bypass', function(done) {
    const flow = [
      { id:'n1', type:'startup', startSpeed:0, preRunTime:5, preRunSpeed:100, rampTime:30, rampDownTime:0, postRunTime:0, postRunSpeed:30, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' }, { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg));
      helper.getNode('n1').receive({ payload: true, bypass: true });
      setTimeout(() => {
        // With bypass, should immediately start ramp (skip prerun)
        msgs.length.should.be.greaterThan(0);
        done();
      }, 400);
    });
  });
});
