const helper = require('node-red-node-test-helper');
const node   = require('../lookup-table.js');
helper.init(require.resolve('node-red'));

describe('lookup-table node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  function makeFlow(points, decimals) {
    return [
      { id:'n1', type:'lookup-table', points: JSON.stringify(points), decimals: decimals || 2, wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
  }

  it('should interpolate at midpoint', function(done) {
    helper.load(node, makeFlow([{x:0,y:0},{x:10,y:50},{x:20,y:100}]), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(25);
        msg.lookupTable.interpolated.should.equal(true);
        done();
      });
      helper.getNode('n1').receive({ payload: 5 });
    });
  });

  it('should return exact point value', function(done) {
    helper.load(node, makeFlow([{x:0,y:0},{x:10,y:50},{x:20,y:100}]), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(50);
        done();
      });
      helper.getNode('n1').receive({ payload: 10 });
    });
  });

  it('should clamp below range', function(done) {
    helper.load(node, makeFlow([{x:0,y:0},{x:10,y:100}]), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(0);
        msg.lookupTable.clamped.should.equal(true);
        done();
      });
      helper.getNode('n1').receive({ payload: -5 });
    });
  });

  it('should clamp above range', function(done) {
    helper.load(node, makeFlow([{x:0,y:0},{x:10,y:100}]), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.equal(100);
        msg.lookupTable.clamped.should.equal(true);
        done();
      });
      helper.getNode('n1').receive({ payload: 25 });
    });
  });

  it('should interpolate valve curve correctly', function(done) {
    helper.load(node, makeFlow([{x:0,y:0},{x:25,y:10},{x:50,y:40},{x:75,y:80},{x:100,y:100}], 1), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.be.approximately(25, 1); // x=37 between x=25(y=10) and x=50(y=40)
        done();
      });
      helper.getNode('n1').receive({ payload: 37 });
    });
  });

  it('should round to decimals', function(done) {
    helper.load(node, makeFlow([{x:0,y:0},{x:3,y:10}], 1), function() {
      helper.getNode('n2').on('input', msg => {
        msg.payload.should.be.approximately(3.3, 0.1);
        done();
      });
      helper.getNode('n1').receive({ payload: 1 });
    });
  });

  it('should warn on non-numeric input', function(done) {
    helper.load(node, makeFlow([{x:0,y:0},{x:10,y:100}]), function() {
      var received = false;
      helper.getNode('n2').on('input', () => { received = true; });
      helper.getNode('n1').receive({ payload: 'bad' });
      setTimeout(() => { received.should.equal(false); done(); }, 50);
    });
  });
});
