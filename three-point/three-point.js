module.exports = function(RED) {
    function ThreePointNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.runtime  = parseFloat(config.runtime);  if (isNaN(node.runtime)  || node.runtime  <= 0) node.runtime  = 120;
        node.deadband = parseFloat(config.deadband); if (isNaN(node.deadband) || node.deadband < 0)  node.deadband = 2;
        node.minPulse = parseFloat(config.minPulse); if (isNaN(node.minPulse) || node.minPulse < 0)  node.minPulse = 1;
        node.initPos  = parseFloat(config.initPos);  if (isNaN(node.initPos))                         node.initPos  = 50;

        node.position = node.initPos;
        node.timer    = null;
        node.moving   = false;

        node.status({ fill: 'grey', shape: 'dot', text: 'AT SETPOINT ' + node.position + '%' });

        function stopMovement(sendFalse) {
            if (node.timer) { clearTimeout(node.timer); node.timer = null; }
            node.moving = false;
            if (sendFalse) node.send([{ payload: false }, { payload: false }]);
        }

        function move(setpoint) {
            var diff = setpoint - node.position;
            if (Math.abs(diff) < node.deadband) {
                node.status({ fill: 'green', shape: 'dot', text: 'DEADBAND (diff: ' + Math.abs(diff).toFixed(1) + '%)' });
                return;
            }

            var direction  = diff > 0 ? 'open' : 'close';
            var pulseTime  = Math.abs(diff) / 100 * node.runtime;
            if (pulseTime < node.minPulse) pulseTime = node.minPulse;

            var info = {
                setpoint:   setpoint,
                position:   node.position,
                difference: parseFloat(diff.toFixed(1)),
                direction:  direction,
                pulseTime:  parseFloat(pulseTime.toFixed(1)),
                runtime:    node.runtime,
                deadband:   node.deadband,
                moving:     true
            };

            stopMovement(false);
            node.moving = true;

            if (direction === 'open') {
                node.send([{ payload: true, threePoint: info }, { payload: false, threePoint: info }]);
                node.status({ fill: 'blue', shape: 'dot', text: 'OPENING → ' + setpoint + '% (' + info.pulseTime + 's)' });
            } else {
                node.send([{ payload: false, threePoint: info }, { payload: true, threePoint: info }]);
                node.status({ fill: 'blue', shape: 'ring', text: 'CLOSING → ' + setpoint + '% (' + info.pulseTime + 's)' });
            }

            node.timer = setTimeout(function() {
                node.position = Math.max(0, Math.min(100, node.position + diff));
                node.moving   = false;
                node.timer    = null;
                node.send([{ payload: false }, { payload: false }]);
                node.status({ fill: 'green', shape: 'dot', text: 'AT SETPOINT ' + node.position.toFixed(1) + '%' });
            }, pulseTime * 1000);
        }

        node.on('input', function(msg) {
            if (msg.reset === true) {
                stopMovement(true);
                node.position = node.initPos;
                node.status({ fill: 'grey', shape: 'dot', text: 'RESET → ' + node.position + '%' });
                return;
            }
            if (msg.stop === true) {
                stopMovement(true);
                node.status({ fill: 'grey', shape: 'dot', text: 'STOPPED @ ' + node.position.toFixed(1) + '%' });
                return;
            }
            if (msg.open === true) {
                move(100);
                return;
            }
            if (msg.close === true) {
                move(0);
                return;
            }
            var sp = parseFloat(msg.payload);
            if (isNaN(sp)) { node.warn('Non-numeric setpoint: ' + msg.payload); return; }
            sp = Math.max(0, Math.min(100, sp));
            move(sp);
        });

        node.on('close', function() {
            stopMovement(true);
        });
    }

    RED.nodes.registerType('three-point', ThreePointNode);
};
