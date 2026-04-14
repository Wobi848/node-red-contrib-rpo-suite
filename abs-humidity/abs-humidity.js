module.exports = function(RED) {
    function AbsHumidityNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.topicTemp = config.topicTemp || 'temp';
        node.topicRh   = config.topicRh   || 'rh';
        node.pressure  = parseFloat(config.pressure) || 1013.25;
        node.decimals  = parseInt(config.decimals, 10);
        if (isNaN(node.decimals)) node.decimals = 2;

        node.temp = null;
        node.rh   = null;

        node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for values...' });

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.temp = null;
                node.rh   = null;
                node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for values...' });
                return;
            }

            var pressure = (msg.pressure !== undefined) ? parseFloat(msg.pressure) : node.pressure;
            var val = parseFloat(msg.payload);
            if (isNaN(val)) { node.warn('Non-numeric payload ignored'); return; }

            if (msg.topic === node.topicTemp) node.temp = val;
            else if (msg.topic === node.topicRh) node.rh = val;

            if (node.temp === null || node.rh === null) {
                var waiting = node.temp === null ? 'temp' : 'rh';
                node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for ' + waiting + '...' });
                return;
            }

            if (node.rh < 0 || node.rh > 100) { node.warn('rh out of range (0-100): ' + node.rh); return; }

            var T  = node.temp;
            var rh = node.rh;

            var satPressure  = 6.112 * Math.exp((17.67 * T) / (T + 243.5));
            var partialPressure = (rh / 100) * satPressure;
            var absHum = 621.97 * partialPressure / (pressure - partialPressure);

            var gamma    = Math.log(rh / 100) + (17.67 * T) / (243.5 + T);
            var dewPoint = (243.5 * gamma) / (17.67 - gamma);

            var d = node.decimals;
            var info = {
                temp:        T,
                rh:          rh,
                absHumidity: parseFloat(absHum.toFixed(d)),
                dewPoint:    parseFloat(dewPoint.toFixed(d)),
                satPressure: parseFloat(satPressure.toFixed(d)),
                pressure:    pressure,
                unit:        'g/kg',
                decimals:    d
            };

            var out = RED.util.cloneMessage(msg);
            out.payload     = info.absHumidity;
            out.absHumidity = info;
            node.send(out);
            node.status({ fill: 'green', shape: 'dot', text: T + '°C ' + rh + '% → ' + info.absHumidity + ' g/kg' });
        });
    }

    RED.nodes.registerType('abs-humidity', AbsHumidityNode);
};
