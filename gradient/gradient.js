module.exports = function(RED) {
    function GradientNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.unit      = config.unit      || 'per_min';
        node.smoothing = parseInt(config.smoothing, 10) || 1;
        if (node.smoothing < 1) node.smoothing = 1;
        node.decimals  = parseInt(config.decimals, 10);
        if (isNaN(node.decimals) || node.decimals < 0) node.decimals = 2;
        var _ar        = parseFloat(config.alarmRate);
        node.alarmRate = isNaN(_ar) ? 0 : _ar;

        node.lastValue  = undefined;
        node.lastTime   = undefined;
        node.gradBuffer = [];

        node.status({ fill:'grey', shape:'ring', text:'Waiting for second value...' });

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.lastValue  = undefined;
                node.lastTime   = undefined;
                node.gradBuffer = [];
                node.status({ fill:'grey', shape:'ring', text:'Waiting for second value...' });
                return;
            }

            var x = parseFloat(msg.payload);
            if (isNaN(x)) { node.warn('Input is not a number: ' + msg.payload); return; }

            var now = Date.now();

            if (node.lastValue === undefined || node.lastTime === undefined) {
                node.lastValue = x;
                node.lastTime  = now;
                node.status({ fill:'grey', shape:'ring', text:'Waiting for second value...' });
                return;
            }

            var dt = (now - node.lastTime) / 1000;
            if (dt === 0) { node.warn('dt is 0, skipping'); return; }

            var gradPerS = (x - node.lastValue) / dt;
            var gradOut;

            switch (node.unit) {
                case 'per_min': gradOut = gradPerS * 60;   break;
                case 'per_h':   gradOut = gradPerS * 3600; break;
                default:        gradOut = gradPerS;
            }

            node.gradBuffer.push(gradOut);
            if (node.gradBuffer.length > node.smoothing) node.gradBuffer.shift();
            var smoothed = node.gradBuffer.reduce(function(a,b){ return a+b; }, 0) / node.gradBuffer.length;

            node.lastValue = x;
            node.lastTime  = now;

            gradOut  = parseFloat(gradOut.toFixed(node.decimals));
            smoothed = parseFloat(smoothed.toFixed(node.decimals));
            var alarm = node.alarmRate > 0 && Math.abs(smoothed) > node.alarmRate;

            msg.payload  = smoothed;
            msg.gradient = {
                current:   x,
                previous:  node.lastValue,
                gradient:  gradOut,
                unit:      node.unit,
                dt:        parseFloat(dt.toFixed(3)),
                smoothed:  smoothed,
                alarm:     alarm,
                alarmRate: node.alarmRate,
                decimals:  node.decimals
            };

            var unitStr = node.unit.replace('per_', '/');
            if (alarm) {
                node.status({ fill:'red',    shape:'dot', text:smoothed + ' ' + unitStr + ' (ALARM!)' });
            } else if (smoothed > 0) {
                node.status({ fill:'green',  shape:'dot', text:'+' + smoothed + ' ' + unitStr + ' (rising)' });
            } else {
                node.status({ fill:'yellow', shape:'dot', text:smoothed + ' ' + unitStr + ' (falling)' });
            }

            node.send(msg);
        });
    }

    RED.nodes.registerType('gradient', GradientNode);
};
