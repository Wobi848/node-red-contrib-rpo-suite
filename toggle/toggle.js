module.exports = function(RED) {
    function ToggleNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.initialState = config.initialState === 'true' || config.initialState === true;
        node.persistent   = config.persistent === true;

        if (node.persistent) {
            var stored = node.context().get('state');
            node.state       = (stored !== undefined) ? stored : node.initialState;
            node.toggleCount = node.context().get('toggleCount') || 0;
        } else {
            node.state       = node.initialState;
            node.toggleCount = 0;
        }

        updateStatus(node);

        node.on('input', function(msg) {
            var previous = node.state;

            if (msg.reset === true) {
                node.state       = node.initialState;
                node.toggleCount = 0;
                if (node.persistent) {
                    node.context().set('state', node.state);
                    node.context().set('toggleCount', node.toggleCount);
                }
            } else if (msg.set !== undefined) {
                node.state = (msg.set === true || msg.set === 'true');
                if (node.persistent) node.context().set('state', node.state);
            } else {
                if (!msg.payload) return; // falsy input → ignore silently
                node.state = !node.state;
                node.toggleCount++;
                if (node.persistent) {
                    node.context().set('state', node.state);
                    node.context().set('toggleCount', node.toggleCount);
                }
            }

            msg.payload = node.state;
            msg.toggle  = {
                state:       node.state,
                previous:    previous,
                toggleCount: node.toggleCount
            };

            updateStatus(node);
            node.send(msg);
        });

        function updateStatus(n) {
            if (n.state) {
                n.status({ fill: 'green', shape: 'dot', text: 'ON (toggles: ' + n.toggleCount + ')' });
            } else {
                n.status({ fill: 'grey',  shape: 'dot', text: 'OFF (toggles: ' + n.toggleCount + ')' });
            }
        }
    }

    RED.nodes.registerType('toggle', ToggleNode);
};
