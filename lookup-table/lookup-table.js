module.exports = function(RED) {
    function LookupTableNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.decimals = parseInt(config.decimals, 10);
        if (isNaN(node.decimals)) node.decimals = 2;

        // Parse and sort points
        var raw = config.points;
        if (typeof raw === 'string') {
            try { raw = JSON.parse(raw); } catch(e) { raw = []; }
        }
        if (!Array.isArray(raw)) raw = [];

        // Remove duplicates (warn on them), sort by x
        var seen = {};
        var pts = [];
        raw.forEach(function(p) {
            var x = parseFloat(p.x), y = parseFloat(p.y);
            if (isNaN(x) || isNaN(y)) return;
            if (seen[x] !== undefined) { node.warn('Duplicate X value ' + x + ' skipped'); return; }
            seen[x] = true;
            pts.push({ x: x, y: y });
        });
        pts.sort(function(a, b) { return a.x - b.x; });

        if (pts.length < 2) {
            node.error('lookup-table requires at least 2 points');
            node.status({ fill: 'red', shape: 'ring', text: 'Error: need ≥2 points' });
            return;
        }

        node.points = pts;
        node.status({ fill: 'grey', shape: 'ring', text: 'Ready (' + pts.length + ' points)' });

        node.on('input', function(msg) {
            var x = parseFloat(msg.payload);
            if (isNaN(x)) { node.warn('Non-numeric input: ' + msg.payload); return; }

            var pts = node.points;
            var output, interpolated, lowerPoint, upperPoint;

            if (x <= pts[0].x) {
                output = pts[0].y;
                interpolated = false;
                lowerPoint = pts[0]; upperPoint = pts[0];
            } else if (x >= pts[pts.length - 1].x) {
                output = pts[pts.length - 1].y;
                interpolated = false;
                lowerPoint = pts[pts.length - 1]; upperPoint = pts[pts.length - 1];
            } else {
                for (var i = 0; i < pts.length - 1; i++) {
                    if (x >= pts[i].x && x <= pts[i + 1].x) {
                        lowerPoint = pts[i];
                        upperPoint = pts[i + 1];
                        var ratio = (x - pts[i].x) / (pts[i + 1].x - pts[i].x);
                        output = pts[i].y + ratio * (pts[i + 1].y - pts[i].y);
                        interpolated = true;
                        break;
                    }
                }
            }

            output = parseFloat(output.toFixed(node.decimals));
            var clamped = x < pts[0].x || x > pts[pts.length - 1].x;

            var info = {
                input:        x,
                output:       output,
                interpolated: interpolated,
                clamped:      clamped,
                lowerPoint:   lowerPoint,
                upperPoint:   upperPoint,
                decimals:     node.decimals
            };

            var out = RED.util.cloneMessage(msg);
            out.payload     = output;
            out.lookupTable = info;
            node.send(out);

            var statusText = clamped
                ? x + ' → ' + output + ' (clamped)'
                : x + ' → ' + output;
            node.status({ fill: clamped ? 'yellow' : 'green', shape: 'dot', text: statusText });
        });
    }

    RED.nodes.registerType('lookup-table', LookupTableNode);
};
