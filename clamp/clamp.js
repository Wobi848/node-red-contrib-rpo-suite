module.exports = function(RED) {
    function ClampNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.min = parseFloat(config.min);
        this.max = parseFloat(config.max);
        this.decimals = parseInt(config.decimals);

        // Set defaults
        if (isNaN(this.min)) this.min = 0;
        if (isNaN(this.max)) this.max = 100;
        if (isNaN(this.decimals) || this.decimals < 0) this.decimals = 2;
        if (this.decimals > 10) this.decimals = 10;

        updateStatus(node, null, null, false, null);

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
            var min = msg.min !== undefined ? parseFloat(msg.min) : node.min;
            var max = msg.max !== undefined ? parseFloat(msg.max) : node.max;

            // Validate overrides
            if (isNaN(min)) min = node.min;
            if (isNaN(max)) max = node.max;

            // Check for invalid range
            if (min >= max) {
                node.warn("Invalid range: min (" + min + ") must be less than max (" + max + ")");
                node.status({ fill: "red", shape: "ring", text: "Invalid range (min >= max)" });
                if (done) done();
                return;
            }

            // Clamp the value
            var output = input;
            var clamped = false;
            var clampedAt = null;

            if (input < min) {
                output = min;
                clamped = true;
                clampedAt = "min";
            } else if (input > max) {
                output = max;
                clamped = true;
                clampedAt = "max";
            }

            // Round to decimals
            output = parseFloat(output.toFixed(node.decimals));

            msg.payload = output;
            msg.clamp = {
                input: input,
                output: output,
                min: min,
                max: max,
                clamped: clamped,
                clampedAt: clampedAt
            };

            updateStatus(node, input, output, clamped, clampedAt);
            send(msg);
            if (done) done();
        });

        node.on('close', function() {
            // Nothing to clean up
        });
    }

    function updateStatus(node, input, output, clamped, clampedAt) {
        if (input === null || output === null) {
            node.status({ fill: "grey", shape: "ring", text: "Waiting..." });
        } else if (clamped) {
            node.status({
                fill: "yellow",
                shape: "dot",
                text: output + " (clamped, was " + input + ")"
            });
        } else {
            node.status({
                fill: "green",
                shape: "dot",
                text: output + " (in range)"
            });
        }
    }

    RED.nodes.registerType("clamp", ClampNode);
}
