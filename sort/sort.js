module.exports = function(RED) {
    function SortNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.order = config.order || 'asc';
        node.type  = config.mode || config.type || 'numeric';
        node.topN  = parseInt(config.topN, 10) || 0;

        node.status({ fill:'grey', shape:'dot', text:'Ready' });

        node.on('input', function(msg) {
            if (!Array.isArray(msg.payload)) {
                node.warn('Input is not an array');
                return;
            }

            var order = msg.order !== undefined ? msg.order : node.order;
            var topN  = msg.topN  !== undefined ? parseInt(msg.topN, 10) : node.topN;
            var input = msg.payload.slice();

            var indices = input.map(function(_, i){ return i; });
            var type    = node.type;

            indices.sort(function(a, b) {
                var va = input[a], vb = input[b];
                var cmp;
                if (type === 'numeric') {
                    cmp = parseFloat(va) - parseFloat(vb);
                    if (isNaN(cmp)) cmp = String(va).localeCompare(String(vb));
                } else {
                    cmp = String(va).localeCompare(String(vb));
                }
                return order === 'desc' ? -cmp : cmp;
            });

            var sorted  = indices.map(function(i){ return input[i]; });
            var origIdx = indices.slice();

            if (topN > 0 && topN < sorted.length) {
                sorted  = sorted.slice(0, topN);
                origIdx = origIdx.slice(0, topN);
            }

            msg.payload         = sorted;
            msg.originalIndices = origIdx;
            msg.sort            = { input:input, output:sorted, order:order, type:type, topN:topN, originalIndices:origIdx };

            var preview = sorted.length <= 4 ? '['+sorted.join(',')+']' : '['+sorted.slice(0,3).join(',')+',...]';
            node.status({ fill:'green', shape:'dot', text:preview + ' ('+sorted.length+' values, '+order+')' });
            node.send(msg);
        });
    }

    RED.nodes.registerType('sorter', SortNode);
};
