const helper = require('node-red-node-test-helper');
const node   = require('../free-cooling.js');
helper.init(require.resolve('node-red'));

describe('free-cooling node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  function makeFlow(overrides) {
    var cfg = Object.assign({
      id:'n1', type:'free-cooling',
      minDelta:3, maxOutdoor:24, minOutdoor:8,
      topicIndoor:'indoor', topicOutdoor:'outdoor',
      decimals:1, wires:[['n2'],['n3']]
    }, overrides);
    return [cfg, { id:'n2', type:'helper' }, { id:'n3', type:'helper' }];
  }

  it('should activate when delta >= minDelta and outdoor in range', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(true);
        done();
      });
      helper.getNode('n1').receive({ topic:'indoor',  payload: 26 });
      helper.getNode('n1').receive({ topic:'outdoor', payload: 18 }); // delta=8 >= 3, 8..24 ✓
    });
  });

  it('should not activate when delta < minDelta', function(done) {
    helper.load(node, makeFlow(), function() {
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      helper.getNode('n1').receive({ topic:'indoor',  payload: 22 });
      helper.getNode('n1').receive({ topic:'outdoor', payload: 21 }); // delta=1 < 3
      setTimeout(() => {
        msgs[msgs.length - 1].should.equal(false);
        done();
      }, 50);
    });
  });

  it('should not activate when outdoor > maxOutdoor', function(done) {
    helper.load(node, makeFlow(), function() {
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      helper.getNode('n1').receive({ topic:'indoor',  payload: 30 });
      helper.getNode('n1').receive({ topic:'outdoor', payload: 26 }); // outdoor > 24
      setTimeout(() => {
        msgs[msgs.length - 1].should.equal(false);
        done();
      }, 50);
    });
  });

  it('should not activate when outdoor < minOutdoor', function(done) {
    helper.load(node, makeFlow(), function() {
      var msgs = [];
      helper.getNode('n2').on('input', msg => msgs.push(msg.payload));
      helper.getNode('n1').receive({ topic:'indoor',  payload: 22 });
      helper.getNode('n1').receive({ topic:'outdoor', payload: 5 }); // outdoor < 8
      setTimeout(() => {
        msgs[msgs.length - 1].should.equal(false);
        done();
      }, 50);
    });
  });

  it('should not output before both topics received', function(done) {
    helper.load(node, makeFlow(), function() {
      var received = false;
      helper.getNode('n2').on('input', () => { received = true; });
      helper.getNode('n1').receive({ topic:'indoor', payload: 26 });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });

  it('should send state change on Output 2 only on transition', function(done) {
    helper.load(node, makeFlow(), function() {
      var n1 = helper.getNode('n1');
      var stateMsgs = [];
      helper.getNode('n3').on('input', msg => stateMsgs.push(msg.payload));
      n1.receive({ topic:'indoor',  payload: 26 });
      n1.receive({ topic:'outdoor', payload: 18 }); // ON → state change
      n1.receive({ topic:'outdoor', payload: 16 }); // still ON → no state change
      n1.receive({ topic:'outdoor', payload: 25 }); // OFF → state change
      setTimeout(() => {
        stateMsgs.length.should.equal(2);
        stateMsgs[0].should.equal(true);
        stateMsgs[1].should.equal(false);
        done();
      }, 50);
    });
  });

  it('should include freeCooling info object', function(done) {
    helper.load(node, makeFlow(), function() {
      helper.getNode('n2').on('input', msg => {
        msg.freeCooling.should.have.property('indoor');
        msg.freeCooling.should.have.property('outdoor');
        msg.freeCooling.should.have.property('delta');
        msg.freeCooling.should.have.property('active');
        done();
      });
      helper.getNode('n1').receive({ topic:'indoor',  payload: 26 });
      helper.getNode('n1').receive({ topic:'outdoor', payload: 18 });
    });
  });

  it('should warn on non-numeric input', function(done) {
    helper.load(node, makeFlow(), function() {
      var received = false;
      helper.getNode('n2').on('input', () => { received = true; });
      helper.getNode('n1').receive({ topic:'indoor', payload: 'bad' });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });
});
