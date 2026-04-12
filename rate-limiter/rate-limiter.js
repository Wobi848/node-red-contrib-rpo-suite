module.exports = function(RED) {
    function RateLimiterNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var rRaw  = parseFloat(config.maxRate);
        node.maxRate  = isNaN(rRaw) ? 1.0 : rRaw;
        var rUnit = config.maxRateUnit || 'per_s';
        node.maxRatePerS = rUnit === 'per_min' ? node.maxRate / 60 : rUnit === 'per_h' ? node.maxRate / 3600 : node.maxRate;

        node.decimals   = parseInt(config.decimals, 10);
        if (isNaN(node.decimals) || node.decimals < 0) node.decimals = 2;

        node.lastOutput = undefined;
        node.lastTime   = undefined;

        node.status({ fill:'grey', shape:'ring', text:'Waiting...' });

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.lastOutput = undefined;
                node.lastTime   = undefined;
                node.status({ fill:'grey', shape:'ring', text:'Waiting...' });
                return;
            }

            var x = parseFloat(msg.payload);
            if (isNaN(x)) { node.warn('Input is not a number: ' + msg.payload); return; }

            var maxRatePerS = (msg.maxRate !== undefined) ? parseFloat(msg.maxRate) : node.maxRatePerS;

            var now = Date.now();
            var output, limited;

            if (node.lastOutput === undefined) {
                output  = x;
                limited = false;
            } else {
                var dt    = (now - node.lastTime) / 1000;
                var maxDelta = maxRatePerS * dt;
                var delta    = x - node.lastOutput;
                if (Math.abs(delta) > maxDelta) {
                    output  = node.lastOutput + (delta > 0 ? 1 : -1) * maxDelta;
                    limited = true;
                } else {
                    output  = x;
                    limited = false;
                }
            }

            output          = parseFloat(output.toFixed(node.decimals));
            node.lastOutput = output;
            node.lastTime   = now;

            msg.payload     = output;
            msg.rateLimiter = {
                input:      x,
                output:     output,
                lastOutput: node.lastOutput,
                maxRate:    node.maxRate,
                dt:         node.lastTime ? Math.round((now - now) * 100) / 100 : 0,
                limited:    limited,
                decimals:   node.decimals
            };

            if (limited) {
                node.status({ fill:'yellow', shape:'dot', text:output + ' → ' + x + ' (limited)' });
            } else {
                node.status({ fill:'green',  shape:'dot', text:output + ' (at target)' });
            }
            node.send(msg);
        });
    }

    RED.nodes.registerType('rate-limiter', RateLimiterNode);
};
