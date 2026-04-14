module.exports = function(RED) {
    function HeatQuantityNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.topicFlow   = config.topicFlow   || 'flow';
        node.topicSupply = config.topicSupply || 'supply';
        node.topicReturn = config.topicReturn || 'return';
        node.medium      = config.medium      || 'water';
        node.persistent  = config.persistent !== false;
        node.decimals    = parseInt(config.decimals, 10);
        if (isNaN(node.decimals)) node.decimals = 2;

        var factors = { water: 1.163, glycol30: 1.100, glycol50: 1.050 };
        node.factor = factors[node.medium] || 1.163;

        node.flow       = null;
        node.supplyTemp = null;
        node.returnTemp = null;
        node.energyKwh  = 0;
        node.lastTime   = null;

        if (node.persistent) {
            var saved = node.context().get('heatQuantity');
            if (saved) node.energyKwh = saved.energyKwh || 0;
        }

        function saveState() {
            if (node.persistent) node.context().set('heatQuantity', { energyKwh: node.energyKwh });
        }

        node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for values...' });

        node.on('input', function(msg) {
            if (msg.resetEnergy === true) {
                node.energyKwh = 0;
                node.lastTime  = null;
                saveState();
                node.status({ fill: 'grey', shape: 'dot', text: 'Energy reset. 0 kWh' });
                return;
            }

            var val = parseFloat(msg.payload);
            if (isNaN(val)) { node.warn('Non-numeric payload ignored'); return; }

            if (msg.topic === node.topicFlow)   node.flow       = val;
            else if (msg.topic === node.topicSupply) node.supplyTemp = val;
            else if (msg.topic === node.topicReturn) node.returnTemp = val;

            if (node.flow === null || node.supplyTemp === null || node.returnTemp === null) {
                node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for values...' });
                return;
            }

            var deltaT = node.supplyTemp - node.returnTemp;
            if (deltaT < 0) { node.warn('Negative ΔT: supply < return (cooling mode?)'); }

            var power = node.flow * node.factor * deltaT;
            var now   = Date.now();
            var dt    = 0;

            if (node.lastTime !== null) {
                dt = (now - node.lastTime) / 3600000;
                node.energyKwh += power * dt;
            }
            node.lastTime = now;

            var d    = node.decimals;
            var info = {
                flow:       node.flow,
                supplyTemp: node.supplyTemp,
                returnTemp: node.returnTemp,
                deltaT:     parseFloat(deltaT.toFixed(d)),
                power:      parseFloat(power.toFixed(d)),
                energyKwh:  parseFloat(node.energyKwh.toFixed(d)),
                medium:     node.medium,
                factor:     node.factor,
                dt:         parseFloat((dt * 3600).toFixed(0)),
                decimals:   d
            };

            var out = RED.util.cloneMessage(msg);
            out.payload      = info.power;
            out.heatQuantity = info;
            node.send(out);
            saveState();
            node.status({ fill: 'green', shape: 'dot', text: info.power + ' kW | Total: ' + info.energyKwh + ' kWh' });
        });
    }

    RED.nodes.registerType('heat-quantity', HeatQuantityNode);
};
