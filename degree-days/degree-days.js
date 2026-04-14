module.exports = function(RED) {
    function DegreeDaysNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.heatingBase  = parseFloat(config.heatingBase)  || 20;
        node.heatingLimit = parseFloat(config.heatingLimit) || 12;
        node.resetDay     = parseInt(config.resetDay, 10)   || 1;
        node.persistent   = config.persistent !== false;
        node.decimals     = parseInt(config.decimals, 10);
        if (isNaN(node.decimals)) node.decimals = 1;

        node.accumulated = 0;
        node.lastResetYear = null;

        if (node.persistent) {
            var saved = node.context().get('degreeDays');
            if (saved) {
                node.accumulated    = saved.accumulated    || 0;
                node.lastResetYear  = saved.lastResetYear  || null;
            }
        }

        function dayOfYear(date) {
            var start = new Date(date.getFullYear(), 0, 0);
            var diff  = date - start;
            return Math.floor(diff / 86400000);
        }

        function saveState() {
            if (node.persistent) {
                node.context().set('degreeDays', { accumulated: node.accumulated, lastResetYear: node.lastResetYear });
            }
        }

        node.status({ fill: 'grey', shape: 'dot', text: 'Total: ' + node.accumulated + ' HGT' });

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.accumulated   = 0;
                node.lastResetYear = null;
                saveState();
                node.status({ fill: 'grey', shape: 'dot', text: 'Reset. Total: 0 HGT' });
                return;
            }

            var daily = parseFloat(msg.payload);
            if (isNaN(daily)) { node.warn('Non-numeric payload: ' + msg.payload); return; }

            var now  = new Date();
            var doy  = dayOfYear(now);
            var year = now.getFullYear();

            if (doy === node.resetDay && node.lastResetYear !== year) {
                node.accumulated   = 0;
                node.lastResetYear = year;
            }

            var heatingActive   = daily < node.heatingLimit;
            var degreeDayToday  = heatingActive ? node.heatingBase - daily : 0;
            node.accumulated   += degreeDayToday;

            var d    = node.decimals;
            var info = {
                dailyMean:       daily,
                degreeDayToday:  parseFloat(degreeDayToday.toFixed(d)),
                accumulated:     parseFloat(node.accumulated.toFixed(d)),
                heatingBase:     node.heatingBase,
                heatingLimit:    node.heatingLimit,
                heatingActive:   heatingActive,
                decimals:        d
            };

            var out = RED.util.cloneMessage(msg);
            out.payload    = info.accumulated;
            out.degreeDays = info;
            node.send(out);
            saveState();

            var text = 'Today: ' + info.degreeDayToday + ' HGT | Total: ' + info.accumulated + ' HGT';
            node.status({ fill: heatingActive ? 'green' : 'grey', shape: 'dot', text: text });
        });
    }

    RED.nodes.registerType('degree-days', DegreeDaysNode);
};
