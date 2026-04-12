module.exports = function(RED) {
    function LimitCounterNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.threshold  = parseFloat(config.threshold) || 0;
        node.limit      = parseInt(config.limit, 10)   || 3;
        var _hy         = parseFloat(config.hysteresis);
        node.hysteresis = isNaN(_hy) ? 0 : _hy;
        node.persistent = config.persistent === true;

        if (node.persistent) {
            node.count         = node.context().get('count') || 0;
            node.aboveThreshold = node.context().get('aboveThreshold') || false;
        } else {
            node.count          = 0;
            node.aboveThreshold = false;
        }

        updateStatus(node);

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.count          = 0;
                node.aboveThreshold = false;
                if (node.persistent) {
                    node.context().set('count', 0);
                    node.context().set('aboveThreshold', false);
                }
                updateStatus(node);
                sendOutputs(node, msg);
                return;
            }

            var val = parseFloat(msg.payload);
            if (isNaN(val)) { node.warn('Input is not a number: ' + msg.payload); return; }

            var wasAbove = node.aboveThreshold;
            var isAbove  = val >= node.threshold;
            // Hysteresis: to go from above to below, must drop below (threshold - hysteresis)
            if (wasAbove && val >= (node.threshold - node.hysteresis)) {
                isAbove = true;
            }
            node.aboveThreshold = isAbove;

            // Rising edge detection
            if (!wasAbove && isAbove) {
                node.count++;
                if (node.persistent) node.context().set('count', node.count);
            }

            if (node.persistent) node.context().set('aboveThreshold', node.aboveThreshold);

            updateStatus(node);
            sendOutputs(node, msg);
        });

        function sendOutputs(n, msg) {
            var alarm = n.count >= n.limit;
            var out1  = Object.assign({}, msg, {
                payload:      n.count,
                limitCounter: {
                    count:      n.count,
                    limit:      n.limit,
                    threshold:  n.threshold,
                    hysteresis: n.hysteresis,
                    alarm:      alarm,
                    lastValue:  parseFloat(msg.payload) || 0
                }
            });
            var out2 = { payload: alarm };
            n.send([out1, out2]);
        }

        function updateStatus(n) {
            var alarm = n.count >= n.limit;
            if (alarm) {
                n.status({ fill:'red',    shape:'dot', text:'ALARM Count: '+n.count+'/'+n.limit });
            } else if (n.count > 0) {
                n.status({ fill:'yellow', shape:'dot', text:'Count: '+n.count+'/'+n.limit+' (threshold: '+n.threshold+')' });
            } else {
                n.status({ fill:'green',  shape:'dot', text:'Count: 0/'+n.limit+' (threshold: '+n.threshold+')' });
            }
        }
    }

    RED.nodes.registerType('limit-counter', LimitCounterNode);
};
