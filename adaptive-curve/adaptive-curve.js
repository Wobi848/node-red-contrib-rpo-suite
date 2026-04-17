module.exports = function(RED) {
    function AdaptiveCurveNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.roomSetpoint   = parseFloat(config.roomSetpoint)   || 22;
        node.heatingLimit   = parseFloat(config.heatingLimit)   || 15;
        node.adaptationRate = parseFloat(config.adaptationRate) || 0.01;
        node.maxShift       = parseFloat(config.maxShift)       || 10;
        node.deadband       = parseFloat(config.deadband)       || 0.5;
        node.topicRoom      = config.topicRoom    || 'room';
        node.topicOutdoor   = config.topicOutdoor || 'outdoor';
        node.persistent     = config.persistent !== false;
        node.decimals       = parseInt(config.decimals, 10); if (isNaN(node.decimals)) node.decimals = 2;

        var ctx = node.context();
        node.shift    = (node.persistent && ctx.get('shift')) || 0;
        node.roomTemp = undefined;
        node.outdoor  = undefined;
        node.lastTime = null;
        node.paused   = false;

        node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for temperatures...' });

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.shift = 0;
                if (node.persistent) ctx.set('shift', 0);
                node.status({ fill: 'grey', shape: 'dot', text: 'Reset → shift=0' });
                return;
            }
            if (msg.shift !== undefined) {
                node.shift = Math.max(-node.maxShift, Math.min(node.maxShift, parseFloat(msg.shift) || 0));
                if (node.persistent) ctx.set('shift', node.shift);
                node.status({ fill: 'blue', shape: 'dot', text: 'Set shift=' + node.shift });
                return;
            }
            if (msg.pauseAdaptation !== undefined) {
                node.paused = Boolean(msg.pauseAdaptation);
                return;
            }

            if (msg.topic === node.topicRoom)    node.roomTemp = parseFloat(msg.payload);
            if (msg.topic === node.topicOutdoor) node.outdoor  = parseFloat(msg.payload);

            var roomSetpoint = msg.roomSetpoint !== undefined ? parseFloat(msg.roomSetpoint) : node.roomSetpoint;
            if (isNaN(roomSetpoint)) roomSetpoint = node.roomSetpoint;

            if (node.roomTemp === undefined || node.outdoor === undefined) return;

            var now = Date.now();
            var adapting = false;

            if (!node.paused && node.outdoor < node.heatingLimit && node.lastTime !== null) {
                var dtMin = (now - node.lastTime) / 60000;
                var error = roomSetpoint - node.roomTemp;
                if (Math.abs(error) > node.deadband) {
                    node.shift += error * node.adaptationRate * dtMin;
                    node.shift = Math.max(-node.maxShift, Math.min(node.maxShift, node.shift));
                    if (node.persistent) ctx.set('shift', node.shift);
                    adapting = true;
                }
            }
            node.lastTime = now;

            var result = parseFloat(node.shift.toFixed(node.decimals));
            var error2 = parseFloat((roomSetpoint - node.roomTemp).toFixed(node.decimals));

            var info = {
                roomTemp:       node.roomTemp,
                roomSetpoint:   roomSetpoint,
                outdoor:        node.outdoor,
                error:          error2,
                shift:          result,
                adapting:       adapting,
                adaptationRate: node.adaptationRate,
                maxShift:       node.maxShift,
                deadband:       node.deadband,
                heatingLimit:   node.heatingLimit,
                decimals:       node.decimals
            };

            var out = RED.util.cloneMessage(msg);
            out.payload       = result;
            out.adaptiveCurve = info;
            node.send(out);

            if (node.outdoor >= node.heatingLimit) {
                node.status({ fill: 'grey', shape: 'dot', text: 'Summer mode (no adapt)' });
            } else if (adapting) {
                node.status({ fill: 'blue', shape: 'dot', text: 'Adapting: shift=' + result + 'K (err ' + error2 + 'K)' });
            } else {
                node.status({ fill: 'green', shape: 'dot', text: 'Stable: shift=' + result + 'K (room ' + node.roomTemp + '°C)' });
            }
        });
    }

    RED.nodes.registerType('adaptive-curve', AdaptiveCurveNode);
};
