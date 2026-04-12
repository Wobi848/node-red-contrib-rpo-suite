module.exports = function(RED) {
    function CounterNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.direction    = config.direction || 'up';
        node.step         = parseFloat(config.step) || 1;
        var _init         = parseFloat(config.initialValue);
        node.initialValue = isNaN(_init) ? 0 : _init;
        var _min          = parseFloat(config.min);
        var _max          = parseFloat(config.max);
        node.min          = isNaN(_min) ? 0   : _min;
        node.max          = isNaN(_max) ? 100 : _max;
        node.onLimit      = config.onLimit    || 'stop';
        node.persistent   = config.persistent === true;

        if (node.persistent) {
            var stored = node.context().get('count');
            node.count = (stored !== undefined) ? stored : node.initialValue;
        } else {
            node.count = node.initialValue;
        }

        updateStatus(node);

        node.on('input', function(msg) {
            var dir  = node.direction;
            var step = msg.step !== undefined ? parseFloat(msg.step) : node.step;

            if (msg.topic === 'reset') {
                node.count = node.initialValue;
                if (node.persistent) node.context().set('count', node.count);
                updateStatus(node);
                sendOutput(node, msg, false, null);
                return;
            }

            if (msg.topic === 'set') {
                var target = parseFloat(msg.payload);
                if (isNaN(target)) { node.warn('Set value is not a number'); return; }
                node.count = target;
                if (node.persistent) node.context().set('count', node.count);
                updateStatus(node);
                sendOutput(node, msg, false, null);
                return;
            }

            if (msg.topic === 'up')   dir = 'up';
            if (msg.topic === 'down') dir = 'down';

            if (!msg.payload) return; // falsy → ignore

            var delta = dir === 'up' ? step : -step;
            var next  = node.count + delta;
            var atLimit = false, limitType = null;

            if (dir === 'up' && next > node.max) {
                if (node.onLimit === 'stop')  { next = node.max; atLimit = true; limitType = 'max'; }
                if (node.onLimit === 'wrap')  { next = node.min; }
                if (node.onLimit === 'alarm') { next = node.max; atLimit = true; limitType = 'max'; }
            } else if (dir === 'down' && next < node.min) {
                if (node.onLimit === 'stop')  { next = node.min; atLimit = true; limitType = 'min'; }
                if (node.onLimit === 'wrap')  { next = node.max; }
                if (node.onLimit === 'alarm') { next = node.min; atLimit = true; limitType = 'min'; }
            }

            node.count = parseFloat(next.toFixed(10));
            if (node.persistent) node.context().set('count', node.count);

            updateStatus(node);
            sendOutput(node, msg, atLimit, limitType);
        });

        function sendOutput(n, msg, atLimit, limitType) {
            msg.payload = n.count;
            msg.counter = { count:n.count, direction:n.direction, step:n.step, min:n.min, max:n.max, atLimit:atLimit, limitType:limitType };
            n.send(msg);
        }

        function updateStatus(n) {
            var alarm = n.onLimit === 'alarm' && (n.count >= n.max || n.count <= n.min);
            var arrow = n.direction === 'up' ? '↑' : '↓';
            if (alarm) {
                n.status({ fill:'red',    shape:'dot', text:'Count: '+n.count+' ALARM' });
            } else if (n.count >= n.max || n.count <= n.min) {
                n.status({ fill:'yellow', shape:'dot', text:'Count: '+n.count+' (at limit)' });
            } else {
                n.status({ fill:'green',  shape:'dot', text:'Count: '+n.count+' '+arrow });
            }
        }
    }

    RED.nodes.registerType('counter', CounterNode);
};
