module.exports = function(RED) {
    function DeadbandNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.deadband = parseFloat(config.deadband) || 0;
        this.initialValue = config.initialValue;
        this.referenceValue = null;
        this.initialized = false;

        // Set initial reference value if configured
        if (this.initialValue !== undefined && this.initialValue !== "") {
            var parsed = parseFloat(this.initialValue);
            if (!isNaN(parsed)) {
                this.referenceValue = parsed;
                this.initialized = true;
            }
        }

        updateStatus(node);

        node.on('input', function(msg, send, done) {
            // Handle reset first (before checking payload)
            if (msg.reset === true) {
                node.referenceValue = null;
                node.initialized = false;
                updateStatus(node);
                if (done) done();
                return;
            }

            var value = parseFloat(msg.payload);

            // Check if payload is a valid number
            if (isNaN(value)) {
                if (done) done();
                return;
            }

            // Get deadband (runtime override or config)
            var deadband = node.deadband;
            if (msg.deadband !== undefined) {
                var overrideDeadband = parseFloat(msg.deadband);
                if (!isNaN(overrideDeadband)) {
                    deadband = overrideDeadband;
                }
            }

            // First value always passes through
            if (!node.initialized || node.referenceValue === null) {
                node.referenceValue = value;
                node.initialized = true;
                updateStatusPassed(node, value);
                send(msg);
                if (done) done();
                return;
            }

            // Calculate difference
            var diff = Math.abs(value - node.referenceValue);

            if (diff > deadband || (diff === deadband && diff > 0)) {
                // Change exceeds deadband - pass through
                node.referenceValue = value;
                updateStatusPassed(node, value);
                send(msg);
            } else {
                // Change within deadband - block
                updateStatusBlocked(node, value, diff);
            }

            if (done) done();
        });

        node.on('close', function() {
            // Cleanup
        });
    }

    function updateStatus(node) {
        if (node.initialized && node.referenceValue !== null) {
            node.status({ fill: "green", shape: "dot", text: "Ref: " + formatNumber(node.referenceValue) });
        } else {
            node.status({ fill: "grey", shape: "ring", text: "Idle" });
        }
    }

    function updateStatusPassed(node, value) {
        node.status({ fill: "green", shape: "dot", text: "✓ " + formatNumber(value) });
    }

    function updateStatusBlocked(node, value, diff) {
        node.status({ fill: "yellow", shape: "ring", text: "✗ " + formatNumber(value) + " (Δ" + formatNumber(diff) + ")" });
    }

    function formatNumber(num) {
        if (Number.isInteger(num)) {
            return num.toString();
        }
        return num.toFixed(2);
    }

    RED.nodes.registerType("deadband", DeadbandNode);
}
