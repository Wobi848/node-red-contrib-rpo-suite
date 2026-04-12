module.exports = function(RED) {
    function AlarmNewValNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.mode      = config.mode      || 'always';
        var _tol       = parseFloat(config.tolerance);
        node.tolerance = isNaN(_tol) ? 0 : _tol;
        node.lastValue = undefined;

        node.status({ fill:'grey', shape:'ring', text:'Waiting...' });

        node.on('input', function(msg) {
            var current = msg.payload;
            var changed = false;

            if (node.mode === 'always') {
                changed = true;
            } else {
                if (node.lastValue === undefined) {
                    changed = true;
                } else if (typeof current === 'number' && typeof node.lastValue === 'number') {
                    changed = Math.abs(current - node.lastValue) > node.tolerance;
                } else if (typeof current === 'object') {
                    changed = JSON.stringify(current) !== JSON.stringify(node.lastValue);
                } else {
                    changed = current !== node.lastValue;
                }
            }

            var out2 = null;
            if (changed) {
                out2 = {
                    payload:      true,
                    alarmNewVal:  { value:current, previous:node.lastValue, changed:true, mode:node.mode }
                };
                node.lastValue = current;
                node.status({ fill:'green', shape:'dot', text:String(current) + ' (new value)' });
            } else {
                node.status({ fill:'grey', shape:'dot', text:String(current) + ' (no change)' });
            }

            node.send([msg, out2]);
        });
    }

    RED.nodes.registerType('alarm-new-val', AlarmNewValNode);
};
