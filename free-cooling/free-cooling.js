module.exports = function(RED) {
    function FreeCoolingNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.minDelta    = parseFloat(config.minDelta)    || 3;
        node.maxOutdoor  = parseFloat(config.maxOutdoor)  || 24;
        node.minOutdoor  = parseFloat(config.minOutdoor)  || 8;
        node.topicIndoor  = config.topicIndoor  || 'indoor';
        node.topicOutdoor = config.topicOutdoor || 'outdoor';
        node.decimals    = parseInt(config.decimals, 10);
        if (isNaN(node.decimals)) node.decimals = 1;

        node.indoor  = undefined;
        node.outdoor = undefined;
        node.active  = false;

        node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for temperatures...' });

        node.on('input', function(msg) {
            var val = parseFloat(msg.payload);
            if (isNaN(val)) { node.warn('Non-numeric temperature: ' + msg.payload); return; }

            if (msg.topic === node.topicIndoor)  node.indoor  = val;
            if (msg.topic === node.topicOutdoor) node.outdoor = val;

            if (node.indoor === undefined || node.outdoor === undefined) return;

            var delta    = parseFloat((node.indoor - node.outdoor).toFixed(node.decimals));
            var active   = (delta >= node.minDelta) &&
                           (node.outdoor <= node.maxOutdoor) &&
                           (node.outdoor >= node.minOutdoor);

            var info = {
                indoor:     node.indoor,
                outdoor:    node.outdoor,
                delta:      delta,
                minDelta:   node.minDelta,
                maxOutdoor: node.maxOutdoor,
                minOutdoor: node.minOutdoor,
                active:     active
            };

            var msg1 = RED.util.cloneMessage(msg);
            msg1.payload    = active;
            msg1.freeCooling = info;

            var msg2 = null;
            if (active !== node.active) {
                node.active = active;
                msg2 = { payload: active, freeCooling: info };
            }

            node.send([msg1, msg2]);

            var fill = active ? 'blue' : 'green';
            var text = active
                ? 'FREE COOLING ON (ΔT=' + delta + 'K)'
                : 'OFF (ΔT=' + delta + 'K, out=' + node.outdoor + '°C)';
            node.status({ fill: fill, shape: 'dot', text: text });
        });
    }

    RED.nodes.registerType('free-cooling', FreeCoolingNode);
};
