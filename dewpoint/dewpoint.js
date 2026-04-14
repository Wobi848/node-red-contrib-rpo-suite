module.exports = function(RED) {
    function DewpointNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.topicTemp    = config.topicTemp    || 'temp';
        node.topicRh      = config.topicRh      || 'rh';
        node.topicSurface = config.topicSurface || '';
        node.alarmOffset  = parseFloat(config.alarmOffset) || 2;
        node.decimals     = parseInt(config.decimals, 10);
        if (isNaN(node.decimals)) node.decimals = 1;

        node.temp        = null;
        node.rh          = null;
        node.surfaceTemp  = null;
        node.alarming    = false;

        node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for values...' });

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.temp = null; node.rh = null; node.surfaceTemp = null;
                node.alarming = false;
                node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for values...' });
                return;
            }

            var alarmOffset = (msg.alarmOffset !== undefined) ? parseFloat(msg.alarmOffset) : node.alarmOffset;
            var val = parseFloat(msg.payload);
            if (isNaN(val)) { node.warn('Non-numeric payload ignored'); return; }

            if (msg.topic === node.topicTemp) node.temp = val;
            else if (msg.topic === node.topicRh) node.rh = val;
            else if (node.topicSurface && msg.topic === node.topicSurface) node.surfaceTemp = val;

            if (node.temp === null || node.rh === null) {
                node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for values...' });
                return;
            }

            var T  = node.temp;
            var rh = Math.max(0.01, node.rh);
            var surfaceTemp = node.surfaceTemp !== null ? node.surfaceTemp : T;

            var gamma    = Math.log(rh / 100) + (17.67 * T) / (243.5 + T);
            var dewPoint = (243.5 * gamma) / (17.67 - gamma);
            var margin   = surfaceTemp - dewPoint;
            var alarm    = dewPoint >= (surfaceTemp - alarmOffset);

            var d    = node.decimals;
            var info = {
                temp:        T,
                rh:          node.rh,
                dewPoint:    parseFloat(dewPoint.toFixed(d)),
                surfaceTemp: surfaceTemp,
                margin:      parseFloat(margin.toFixed(d)),
                alarm:       alarm,
                alarmOffset: alarmOffset,
                decimals:    d
            };

            var msg1 = RED.util.cloneMessage(msg);
            msg1.payload  = info.dewPoint;
            msg1.dewPoint = info;

            var msg2 = null;
            if (alarm !== node.alarming) {
                node.alarming = alarm;
                msg2 = { payload: alarm, dewPoint: info };
            }

            node.send([msg1, msg2]);

            if (alarm) {
                node.status({ fill: 'red', shape: 'dot', text: 'ALARM DP: ' + info.dewPoint + '°C (condensation risk!)' });
            } else if (margin < alarmOffset + 2) {
                node.status({ fill: 'yellow', shape: 'dot', text: 'DP: ' + info.dewPoint + '°C (margin: ' + info.margin + 'K)' });
            } else {
                node.status({ fill: 'green', shape: 'dot', text: 'DP: ' + info.dewPoint + '°C (margin: ' + info.margin + 'K)' });
            }
        });
    }

    RED.nodes.registerType('dewpoint', DewpointNode);
};
