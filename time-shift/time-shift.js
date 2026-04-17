module.exports = function(RED) {
    function TimeShiftNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var multipliers = { 's': 1, 'min': 60, 'h': 3600 };
        var delayRaw = parseFloat(config.delay); if (isNaN(delayRaw) || delayRaw <= 0) delayRaw = 60;
        node.delay    = delayRaw * (multipliers[config.delayUnit] || 1);
        node.maxBuffer = parseInt(config.maxBuffer, 10); if (isNaN(node.maxBuffer) || node.maxBuffer < 1) node.maxBuffer = 1000;
        node.decimals  = parseInt(config.decimals, 10); if (isNaN(node.decimals)) node.decimals = 2;

        node.buffer = [];

        node.status({ fill: 'grey', shape: 'ring', text: 'Buffering...' });

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.buffer = [];
                node.status({ fill: 'grey', shape: 'ring', text: 'Buffer cleared' });
                return;
            }

            var val = parseFloat(msg.payload);
            if (isNaN(val)) { node.warn('Non-numeric input: ' + msg.payload); return; }

            var delay = msg.delay !== undefined ? parseFloat(msg.delay) * (multipliers[config.delayUnit] || 1) : node.delay;
            if (isNaN(delay) || delay <= 0) delay = node.delay;

            var now = Date.now();
            node.buffer.push({ value: val, timestamp: now });

            if (node.buffer.length > node.maxBuffer) {
                node.warn('Buffer full, removing oldest entry');
                node.buffer.shift();
            }

            // Clean entries older than delay * 2
            var cutoff = now - delay * 2000;
            node.buffer = node.buffer.filter(function(e) { return e.timestamp >= cutoff; });

            // Find entry closest to (now - delay)
            var target = now - delay * 1000;
            var best = null;
            for (var i = 0; i < node.buffer.length; i++) {
                if (node.buffer[i].timestamp <= target) {
                    best = node.buffer[i];
                }
            }

            if (best === null) {
                var elapsed = delay - (now - node.buffer[0].timestamp) / 1000;
                node.status({ fill: 'grey', shape: 'ring', text: 'Buffering... (' + Math.round(Math.max(0, elapsed)) + 's remaining)' });
                return;
            }

            var delayed = parseFloat(best.value.toFixed(node.decimals));
            var actualDelay = parseFloat(((now - best.timestamp) / 1000).toFixed(1));

            var info = {
                current:     val,
                delayed:     delayed,
                delay:       delay,
                actualDelay: actualDelay,
                bufferSize:  node.buffer.length,
                decimals:    node.decimals
            };

            var out = RED.util.cloneMessage(msg);
            out.payload   = delayed;
            out.timeShift = info;
            node.send(out);

            node.status({ fill: 'green', shape: 'dot', text: 'now:' + val + ' → delayed:' + delayed + ' (' + actualDelay + 's)' });
        });
    }

    RED.nodes.registerType('time-shift', TimeShiftNode);
};
