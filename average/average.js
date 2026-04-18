module.exports = function(RED) {
    function AverageNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.mode = config.mode || "count";
        this.window = parseInt(config.window) || 10;
        this.windowUnit = config.windowUnit || "min";
        this.decimals = parseInt(config.decimals);

        // Set defaults
        if (this.window < 1) this.window = 1;
        if (isNaN(this.decimals) || this.decimals < 0) this.decimals = 2;
        if (this.decimals > 10) this.decimals = 10;

        // Buffer: for count mode = [value, value, ...], for time mode = [{value, timestamp}, ...]
        this.buffer = [];

        updateStatus(node);

        node.on('input', function(msg, send, done) {
            // Handle reset
            if (msg.reset === true) {
                node.buffer = [];
                updateStatus(node);
                if (done) done();
                return;
            }

            // Validate payload is numeric
            var input = parseFloat(msg.payload);
            if (isNaN(input)) {
                node.warn("Payload is not a valid number: " + msg.payload);
                node.status({ fill: "red", shape: "ring", text: "Invalid input" });
                if (done) done();
                return;
            }

            var now = Date.now();

            if (node.mode === "count") {
                // Count mode: sliding window of N values
                node.buffer.push(input);
                if (node.buffer.length > node.window) {
                    node.buffer.shift();
                }
            } else {
                // Time mode: store value with timestamp
                node.buffer.push({ value: input, timestamp: now });

                // Calculate window in milliseconds
                var windowMs = node.window;
                if (node.windowUnit === "s") {
                    windowMs = node.window * 1000;
                } else if (node.windowUnit === "min") {
                    windowMs = node.window * 60 * 1000;
                } else if (node.windowUnit === "h") {
                    windowMs = node.window * 60 * 60 * 1000;
                }

                // Remove expired entries
                var cutoff = now - windowMs;
                node.buffer = node.buffer.filter(function(entry) {
                    return entry.timestamp >= cutoff;
                });
            }

            // Calculate average, min, max
            var values = node.mode === "count"
                ? node.buffer
                : node.buffer.map(function(e) { return e.value; });

            var sum = 0;
            var min = values[0];
            var max = values[0];

            for (var i = 0; i < values.length; i++) {
                sum += values[i];
                if (values[i] < min) min = values[i];
                if (values[i] > max) max = values[i];
            }

            var average = sum / values.length;
            average = parseFloat(average.toFixed(node.decimals));
            min = parseFloat(min.toFixed(node.decimals));
            max = parseFloat(max.toFixed(node.decimals));

            msg.payload = average;
            msg.average = {
                input: input,
                output: average,
                count: values.length,
                min: min,
                max: max,
                mode: node.mode,
                window: node.window,
                decimals: node.decimals
            };

            if (node.mode === "time") {
                msg.average.windowUnit = node.windowUnit;
            }

            updateStatus(node);
            send(msg);
            if (done) done();
        });

        node.on('close', function() {
            node.buffer = [];
        });
    }

    function updateStatus(node) {
        var count = node.buffer.length;

        if (count === 0) {
            node.status({ fill: "grey", shape: "ring", text: "Waiting..." });
            return;
        }

        // Calculate current average for status
        var values = node.mode === "count"
            ? node.buffer
            : node.buffer.map(function(e) { return e.value; });

        var sum = 0;
        for (var i = 0; i < values.length; i++) {
            sum += values[i];
        }
        var average = parseFloat((sum / values.length).toFixed(node.decimals));

        if (node.mode === "count") {
            if (count < node.window) {
                node.status({
                    fill: "yellow",
                    shape: "ring",
                    text: "Ø " + average + " (" + count + "/" + node.window + ")"
                });
            } else {
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "Ø " + average + " (" + count + " values)"
                });
            }
        } else {
            var unitLabel = node.windowUnit;
            if (node.windowUnit === "min") unitLabel = "min";
            else if (node.windowUnit === "s") unitLabel = "s";
            else if (node.windowUnit === "h") unitLabel = "h";

            node.status({
                fill: "green",
                shape: "dot",
                text: "Ø " + average + " (last " + node.window + unitLabel + ", " + count + " values)"
            });
        }
    }

    RED.nodes.registerType("average", AverageNode);
}
