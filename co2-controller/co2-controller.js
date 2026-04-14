module.exports = function(RED) {
    function Co2ControllerNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.minLevel       = parseFloat(config.minLevel)       || 800;
        node.maxLevel       = parseFloat(config.maxLevel)       || 1200;
        node.alarmLevel     = parseFloat(config.alarmLevel)     || 1500;
        node.minVentilation = parseFloat(config.minVentilation) || 20;
        node.hysteresis     = parseFloat(config.hysteresis)     || 50;
        node.decimals       = parseInt(config.decimals, 10);
        if (isNaN(node.decimals)) node.decimals = 1;

        node.alarming  = false;
        node.override  = undefined;

        node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for CO2...' });

        function getCategory(co2) {
            if (co2 >= node.alarmLevel) return 'alarm';
            if (co2 >= 1200) return 'III';
            if (co2 >= 1000) return 'II';
            return 'I';
        }

        node.on('input', function(msg) {
            if (msg.clearOverride === true) { node.override = undefined; }
            if (msg.override !== undefined) { node.override = parseFloat(msg.override); }

            var co2 = parseFloat(msg.payload);
            if (isNaN(co2)) { node.warn('Non-numeric CO2 value: ' + msg.payload); return; }

            var ventilation;
            if (node.override !== undefined) {
                ventilation = Math.max(0, Math.min(100, node.override));
            } else if (co2 <= node.minLevel) {
                ventilation = node.minVentilation;
            } else if (co2 >= node.maxLevel) {
                ventilation = 100;
            } else {
                var ratio = (co2 - node.minLevel) / (node.maxLevel - node.minLevel);
                ventilation = node.minVentilation + ratio * (100 - node.minVentilation);
            }

            ventilation = parseFloat(ventilation.toFixed(node.decimals));
            var alarm   = co2 >= node.alarmLevel;
            var category = getCategory(co2);

            var info = {
                co2:          co2,
                ventilation:  ventilation,
                minLevel:     node.minLevel,
                maxLevel:     node.maxLevel,
                alarmLevel:   node.alarmLevel,
                alarm:        alarm,
                category:     category,
                override:     node.override !== undefined ? node.override : false
            };

            var msg1 = RED.util.cloneMessage(msg);
            msg1.payload        = ventilation;
            msg1.co2Controller  = info;

            var msg2 = null;
            if (alarm !== node.alarming) {
                node.alarming = alarm;
                msg2 = { payload: alarm, co2Controller: info };
            }

            node.send([msg1, msg2]);

            if (node.override !== undefined) {
                node.status({ fill: 'yellow', shape: 'dot', text: 'OVERRIDE ' + ventilation + '%' });
            } else if (alarm) {
                node.status({ fill: 'red', shape: 'dot', text: co2 + 'ppm ALARM → 100%' });
            } else {
                var fill = category === 'I' ? 'green' : category === 'II' ? 'yellow' : 'orange';
                node.status({ fill: fill, shape: 'dot', text: co2 + 'ppm → ' + ventilation + '% (Cat ' + category + ')' });
            }
        });
    }

    RED.nodes.registerType('co2-controller', Co2ControllerNode);
};
