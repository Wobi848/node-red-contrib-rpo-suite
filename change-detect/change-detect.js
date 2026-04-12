module.exports = function(RED) {
    function ChangeDetectNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.tolerance    = parseFloat(config.tolerance) || 0;
        node.initialValue = config.initialValue !== '' && config.initialValue !== undefined ? config.initialValue : undefined;

        if (node.initialValue !== undefined) {
            var parsed = parseFloat(node.initialValue);
            node.lastValue = isNaN(parsed) ? node.initialValue : parsed;
        } else {
            node.lastValue = undefined;
        }

        if (node.lastValue === undefined) {
            node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for first value' });
        } else {
            node.status({ fill: 'grey', shape: 'dot', text: 'Initial: ' + node.lastValue });
        }

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.lastValue = undefined;
                node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for first value' });
                return;
            }

            var current = msg.payload;
            var type    = typeof current;
            var changed = false;

            if (node.lastValue === undefined) {
                changed = true;
            } else if (type === 'number') {
                changed = Math.abs(current - node.lastValue) > node.tolerance;
            } else if (type === 'object' && current !== null) {
                changed = JSON.stringify(current) !== JSON.stringify(node.lastValue);
            } else {
                changed = current !== node.lastValue;
            }

            msg.changeDetect = {
                previous:  node.lastValue,
                current:   current,
                changed:   changed,
                type:      type,
                tolerance: node.tolerance
            };

            if (changed) {
                node.lastValue = current;
                node.status({ fill: 'green', shape: 'dot', text: String(current) + ' (changed)' });
                node.send(msg);
            } else {
                node.status({ fill: 'grey', shape: 'dot', text: String(current) + ' (no change)' });
            }
        });
    }

    RED.nodes.registerType('change-detect', ChangeDetectNode);
};
