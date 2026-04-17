module.exports = function(RED) {
    function SequencerNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.channels   = Math.max(2, Math.min(8, parseInt(config.channels, 10) || 3));
        node.hysteresis = parseFloat(config.hysteresis) || 5;
        node.minOnTime  = parseFloat(config.minOnTime)  || 60;
        node.minOffTime = parseFloat(config.minOffTime) || 60;
        node.wearLevel  = config.wearLevel !== false;

        node.states    = new Array(node.channels).fill(false);
        node.runtimes  = new Array(node.channels).fill(0);
        node.lastChange= new Array(node.channels).fill(0);
        node.demand    = 0;

        var ctx = node.context();
        var saved = ctx.get('runtimes');
        if (Array.isArray(saved) && saved.length === node.channels) node.runtimes = saved;

        // Runtime tick
        node.ticker = setInterval(function() {
            var now = Date.now();
            node.states.forEach(function(on, i) {
                if (on) node.runtimes[i] += 1;
            });
            ctx.set('runtimes', node.runtimes);
        }, 1000);

        node.status({ fill: 'grey', shape: 'ring', text: 'Waiting...' });

        function requiredChannels(demand) {
            if (demand <= 0) return 0;
            if (demand >= 100) return node.channels;
            var step = 100 / node.channels;
            return Math.ceil(demand / step);
        }

        function applyDemand(demand, forceChannels) {
            var now = Date.now();
            var needed = forceChannels !== undefined ? forceChannels.filter(Boolean).length : requiredChannels(demand);
            var current = node.states.filter(Boolean).length;



            if (forceChannels !== undefined) {
                node.states = forceChannels.slice(0, node.channels);
            } else if (needed > current) {
                // Turn on channels with least runtime first
                var order = node.states.map(function(on, i) { return { i: i, on: on, rt: node.runtimes[i] }; })
                    .filter(function(c) { return !c.on; })
                    .sort(function(a, b) { return node.wearLevel ? a.rt - b.rt : a.i - b.i; });
                var toAdd = needed - current;
                order.slice(0, toAdd).forEach(function(c) {
                    if ((now - node.lastChange[c.i]) / 1000 >= node.minOffTime) {
                        node.states[c.i] = true;
                        node.lastChange[c.i] = now;
                    }
                });
            } else {
                // Turn off channels with most runtime first
                var order2 = node.states.map(function(on, i) { return { i: i, on: on, rt: node.runtimes[i] }; })
                    .filter(function(c) { return c.on; })
                    .sort(function(a, b) { return node.wearLevel ? b.rt - a.rt : b.i - a.i; });
                var toRemove = current - needed;
                order2.slice(0, toRemove).forEach(function(c) {
                    if ((now - node.lastChange[c.i]) / 1000 >= node.minOnTime) {
                        node.states[c.i] = false;
                        node.lastChange[c.i] = now;
                    }
                });
            }

            var activeCount = node.states.filter(Boolean).length;
            var info = {
                demand:         demand,
                activeChannels: activeCount,
                channels:       node.states.slice(),
                runtimes:       node.runtimes.map(function(r) { return parseFloat((r / 3600).toFixed(2)); }),
                wearLevel:      node.wearLevel
            };

            node.send({ payload: node.states.slice(), sequencer: info });
            node.status({ fill: activeCount > 0 ? 'green' : 'grey', shape: 'dot',
                text: demand + '% → ' + activeCount + '/' + node.channels + ' [' + node.states.map(function(s) { return s ? 'ON' : 'OFF'; }).join(',') + ']' });
        }

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.runtimes = new Array(node.channels).fill(0);
                ctx.set('runtimes', node.runtimes);
                node.states = new Array(node.channels).fill(false);
                node.send({ payload: node.states.slice(), sequencer: { demand: 0, activeChannels: 0, channels: node.states.slice(), runtimes: node.runtimes, wearLevel: node.wearLevel } });
                node.status({ fill: 'grey', shape: 'dot', text: 'Reset' });
                return;
            }
            if (Array.isArray(msg.forceChannel)) {
                applyDemand(node.demand, msg.forceChannel);
                return;
            }
            var demand;
            if (typeof msg.payload === 'boolean') {
                demand = msg.payload ? 100 : 0;
            } else {
                demand = parseFloat(msg.payload);
                if (isNaN(demand)) { node.warn('Non-numeric demand: ' + msg.payload); return; }
                demand = Math.max(0, Math.min(100, demand));
            }
            // Hysteresis
            var delta = demand - node.demand;
            if (Math.abs(delta) < node.hysteresis && demand !== 0 && demand !== 100) return;
            node.demand = demand;
            applyDemand(demand);
        });

        node.on('close', function() {
            clearInterval(node.ticker);
            ctx.set('runtimes', node.runtimes);
        });
    }

    RED.nodes.registerType('sequencer', SequencerNode);
};
