module.exports = function(RED) {
    function ScaleNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.inMin = parseFloat(config.inMin);
        this.inMax = parseFloat(config.inMax);
        this.outMin = parseFloat(config.outMin);
        this.outMax = parseFloat(config.outMax);
        this.clamp = config.clamp === true || config.clamp === "true";
        this.decimals = parseInt(config.decimals);

        // Set defaults
        if (isNaN(this.inMin)) this.inMin = 0;
        if (isNaN(this.inMax)) this.inMax = 10;
        if (isNaN(this.outMin)) this.outMin = 0;
        if (isNaN(this.outMax)) this.outMax = 100;
        if (isNaN(this.decimals) || this.decimals < 0) this.decimals = 2;
        if (this.decimals > 10) this.decimals = 10;

        updateStatus(node, null, null, false);

        node.on('input', function(msg, send, done) {
            // Validate payload is numeric
            var input = parseFloat(msg.payload);
            if (isNaN(input)) {
                node.warn("Payload is not a valid number: " + msg.payload);
                node.status({ fill: "red", shape: "ring", text: "Invalid input" });
                if (done) done();
                return;
            }

            // Get range values (with runtime overrides)
            var inMin = msg.inMin !== undefined ? parseFloat(msg.inMin) : node.inMin;
            var inMax = msg.inMax !== undefined ? parseFloat(msg.inMax) : node.inMax;
            var outMin = msg.outMin !== undefined ? parseFloat(msg.outMin) : node.outMin;
            var outMax = msg.outMax !== undefined ? parseFloat(msg.outMax) : node.outMax;

            // Validate overrides
            if (isNaN(inMin)) inMin = node.inMin;
            if (isNaN(inMax)) inMax = node.inMax;
            if (isNaN(outMin)) outMin = node.outMin;
            if (isNaN(outMax)) outMax = node.outMax;

            // Check for division by zero
            if (inMin === inMax) {
                node.warn("Invalid range: inMin equals inMax (division by zero)");
                node.status({ fill: "red", shape: "ring", text: "Invalid range (inMin = inMax)" });
                if (done) done();
                return;
            }

            // Calculate scaled value
            var output = (input - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;

            // Clamp if enabled
            var clamped = false;
            if (node.clamp) {
                var min = Math.min(outMin, outMax);
                var max = Math.max(outMin, outMax);
                if (output < min) {
                    output = min;
                    clamped = true;
                } else if (output > max) {
                    output = max;
                    clamped = true;
                }
            }

            // Round to decimals
            output = parseFloat(output.toFixed(node.decimals));

            msg.payload = output;
            msg.scale = {
                input: input,
                output: output,
                inMin: inMin,
                inMax: inMax,
                outMin: outMin,
                outMax: outMax,
                clamped: clamped,
                decimals: node.decimals
            };

            updateStatus(node, input, output, clamped);
            send(msg);
            if (done) done();
        });

        node.on('close', function() {
            // Nothing to clean up
        });
    }

    function updateStatus(node, input, output, clamped) {
        if (input === null || output === null) {
            node.status({ fill: "grey", shape: "ring", text: "Waiting..." });
        } else if (clamped) {
            node.status({
                fill: "yellow",
                shape: "dot",
                text: input + " → " + output + " (clamped)"
            });
        } else {
            node.status({
                fill: "green",
                shape: "dot",
                text: input + " → " + output
            });
        }
    }

    RED.nodes.registerType("scale", ScaleNode);
}
