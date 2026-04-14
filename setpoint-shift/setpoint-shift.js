module.exports = function(RED) {
    function SetpointShiftNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.outdoorRef   = parseFloat(config.outdoorRef)   || 15;
        node.outdoorMin   = parseFloat(config.outdoorMin)   || -10;
        node.setpointBase = parseFloat(config.setpointBase) || 20;
        node.setpointMax  = parseFloat(config.setpointMax)  || 70;
        node.limitLow     = parseFloat(config.limitLow);
        if (isNaN(node.limitLow)) node.limitLow = null;
        node.limitHigh    = parseFloat(config.limitHigh);
        if (isNaN(node.limitHigh)) node.limitHigh = null;
        node.decimals     = parseInt(config.decimals, 10);
        if (isNaN(node.decimals)) node.decimals = 1;

        node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for outdoor temp...' });

        node.on('input', function(msg) {
            var outdoor = parseFloat(msg.payload);
            if (isNaN(outdoor)) { node.warn('Non-numeric outdoor temperature: ' + msg.payload); return; }

            var setpoint;
            if (outdoor >= node.outdoorRef) {
                setpoint = node.setpointBase;
            } else if (outdoor <= node.outdoorMin) {
                setpoint = node.setpointMax;
            } else {
                var ratio = (node.outdoorRef - outdoor) / (node.outdoorRef - node.outdoorMin);
                setpoint = node.setpointBase + ratio * (node.setpointMax - node.setpointBase);
            }

            if (node.limitLow  !== null) setpoint = Math.max(node.limitLow,  setpoint);
            if (node.limitHigh !== null) setpoint = Math.min(node.limitHigh, setpoint);

            setpoint = parseFloat(setpoint.toFixed(node.decimals));

            var info = {
                outdoor:      outdoor,
                setpoint:     setpoint,
                outdoorRef:   node.outdoorRef,
                outdoorMin:   node.outdoorMin,
                setpointBase: node.setpointBase,
                setpointMax:  node.setpointMax
            };

            var out = RED.util.cloneMessage(msg);
            out.payload           = setpoint;
            out.setpointShift     = info;

            node.send(out);

            node.status({ fill: 'green', shape: 'dot', text: outdoor + '°C → SP ' + setpoint + '°C' });
        });
    }

    RED.nodes.registerType('setpoint-shift', SetpointShiftNode);
};
