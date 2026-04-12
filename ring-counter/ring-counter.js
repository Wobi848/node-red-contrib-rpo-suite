module.exports = function(RED) {
    function RingCounterNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.count        = parseInt(config.size, 10) || parseInt(config.count, 10) || 3;
        node.initialIndex = parseInt(config.initialIndex, 10) || 0;
        node.persistent   = config.persistent === true;

        if (node.persistent) {
            var stored = node.context().get('index');
            node.index     = (stored !== undefined) ? stored : node.initialIndex;
            node.stepCount = node.context().get('stepCount') || 0;
        } else {
            node.index     = node.initialIndex;
            node.stepCount = 0;
        }

        updateStatus(node);

        node.on('input', function(msg) {
            var previous = node.index;

            var topic = msg.topic || '';
            if (topic === 'reset' || msg.reset === true) {
                node.index     = node.initialIndex;
                node.stepCount = 0;
            } else if (topic === 'set') {
                var target = parseInt(msg.payload, 10);
                if (isNaN(target) || target < 0 || target >= node.count) {
                    node.warn('Set index out of range: ' + msg.payload);
                    return;
                }
                node.index = target;
            } else if (topic === 'retreat' || msg.retreat === true) {
                node.index = (node.index - 1 + node.count) % node.count;
                node.stepCount++;
            } else {
                // advance (default) — topic='advance' or any truthy payload
                node.index = (node.index + 1) % node.count;
                node.stepCount++;
            }

            if (node.persistent) {
                node.context().set('index',     node.index);
                node.context().set('stepCount', node.stepCount);
            }

            msg.payload      = node.index;
            msg.ringCounter  = { index:node.index, count:node.count, previous:previous, stepCount:node.stepCount };
            updateStatus(node);
            node.send(msg);
        });

        function updateStatus(n) {
            n.status({ fill:'green', shape:'dot', text:'Index: '+n.index+' / '+n.count+' (steps: '+n.stepCount+')' });
        }
    }

    RED.nodes.registerType('ring-counter', RingCounterNode);
};
