module.exports = function(RED) {
    function MMMStoreNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.decimals   = parseInt(config.decimals, 10);
        if (isNaN(node.decimals) || node.decimals < 0) node.decimals = 2;
        node.persistent = config.persistent !== false;

        if (node.persistent) {
            // Stored values can be 0, so only missing values fall back
            node.min   = stored('min', null);
            node.max   = stored('max', null);
            node.avg   = stored('avg', null);
            node.count = stored('count', 0);
        } else {
            node.min = null; node.max = null; node.avg = null; node.count = 0;
        }

        function stored(key, fallback) {
            var v = node.context().get(key);
            return (v === undefined || v === null) ? fallback : v;
        }
        updateStatus(node);
        node.on('input', function(msg, send, done) {
            if (msg.reset === true) {
                node.min = null; node.max = null; node.avg = null; node.count = 0;
                if (node.persistent) {
                    node.context().set('min', null); node.context().set('max', null);
                    node.context().set('avg', null); node.context().set('count', 0);
                }
                node.status({ fill:'grey', shape:'ring', text:'Reset – waiting for values' });
                done();
                return;
            }

            var val = parseFloat(msg.payload);
            if (isNaN(val)) { node.warn('Input is not a number: ' + msg.payload); done(); return; }

            node.count++;
            if (node.min === null || val < node.min) node.min = val;
            if (node.max === null || val > node.max) node.max = val;
            // Welford running average
            node.avg = node.avg === null ? val : node.avg + (val - node.avg) / node.count;

            if (node.persistent) {
                node.context().set('min',   node.min);
                node.context().set('max',   node.max);
                node.context().set('avg',   node.avg);
                node.context().set('count', node.count);
            }

            var avgRounded = parseFloat(node.avg.toFixed(node.decimals));
            var stats = { min:node.min, max:node.max, avg:avgRounded, count:node.count, last:val, decimals:node.decimals };

            msg.payload  = stats;
            msg.mmmStore = stats;
            updateStatus(node);
            send(msg);
            done();
        });

        function updateStatus(n) {
            if (n.count === 0) {
                n.status({ fill:'grey', shape:'ring', text:'Waiting for values' });
            } else {
                var a = parseFloat(n.avg.toFixed(n.decimals));
                n.status({ fill:'green', shape:'dot', text:'min:'+n.min+' max:'+n.max+' avg:'+a+' ('+n.count+')' });
            }
        }
    }

    RED.nodes.registerType('mmm-store', MMMStoreNode);
};
