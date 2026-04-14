module.exports = function(RED) {
    function FrostProtectionNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.mode           = config.mode || 'binary';
        node.frostThreshold = parseFloat(config.frostThreshold) || -5;
        node.hysteresis     = parseFloat(config.hysteresis) || 2;
        node.minTemp        = parseFloat(config.minTemp) || -15;
        node.topicOutdoor   = config.topicOutdoor || 'outdoor';
        node.topicSupply    = config.topicSupply  || 'supply';
        node.decimals       = parseInt(config.decimals, 10);
        if (isNaN(node.decimals)) node.decimals = 1;

        node.outdoor  = null;
        node.supply   = null;
        node.active   = false;
        node.alarming = false;
        node.override = undefined;

        node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for temp...' });

        node.on('input', function(msg) {
            if (msg.override === true)  { node.override = true;  }
            else if (msg.override === false) { node.override = false; }
            else if (msg.clearOverride) { node.override = undefined; }

            var val = parseFloat(msg.payload);
            if (!isNaN(val)) {
                if (msg.topic === node.topicOutdoor) node.outdoor = val;
                else if (msg.topic === node.topicSupply) node.supply = val;
            }

            if (node.outdoor === null && node.override === undefined) {
                node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for temp...' });
                return;
            }

            var temp = node.outdoor;
            if (node.supply !== null && node.supply < temp) temp = node.supply;

            var output, alarm;

            if (node.override !== undefined) {
                alarm  = node.override;
                output = node.mode === 'proportional' ? (node.override ? 100 : 0) : node.override;
            } else if (node.mode === 'proportional') {
                var ratio = (node.frostThreshold - temp) / (node.frostThreshold - node.minTemp);
                var pct   = Math.max(0, Math.min(100, ratio * 100));
                output = parseFloat(pct.toFixed(node.decimals));
                alarm  = pct > 0;
                node.active = alarm;
            } else {
                if (!node.active && temp < node.frostThreshold) node.active = true;
                else if (node.active && temp > node.frostThreshold + node.hysteresis) node.active = false;
                alarm  = node.active;
                output = alarm;
            }

            var info = {
                outdoor:        node.outdoor,
                supply:         node.supply,
                active:         alarm,
                mode:           node.mode,
                frostThreshold: node.frostThreshold,
                hysteresis:     node.hysteresis,
                output:         output,
                alarm:          alarm,
                override:       node.override !== undefined ? node.override : false
            };

            var msg1 = RED.util.cloneMessage(msg);
            msg1.payload         = output;
            msg1.frostProtection = info;

            var msg2 = null;
            if (alarm !== node.alarming) {
                node.alarming = alarm;
                msg2 = { payload: alarm, frostProtection: info };
            }

            node.send([msg1, msg2]);

            if (node.override !== undefined) {
                node.status({ fill: 'yellow', shape: 'dot', text: 'OVERRIDE ' + (node.override ? 'ON' : 'OFF') });
            } else if (alarm) {
                node.status({ fill: 'red', shape: 'dot', text: temp + '°C → ON (frost protection active)' });
            } else {
                node.status({ fill: 'green', shape: 'dot', text: temp + '°C → OFF (ok)' });
            }
        });
    }

    RED.nodes.registerType('frost-protection', FrostProtectionNode);
};
