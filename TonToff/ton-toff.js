module.exports = function(RED) {
    function TonToffNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Parse configured delays
        var unit = config.delayUnit || "s";
        this.configOnDelay = parseDelay(config.onDelay, unit);
        this.configOffDelay = parseDelay(config.offDelay, unit);
        this.delayUnit = unit;

        this.timer = null;
        this.statusInterval = null;
        this.timerStart = null;
        this.timerDuration = null;
        this.timerTarget = null;
        this.inputState = false;
        this.outputState = false;
        this.initialized = false;

        updateStatus(node);

        node.on('input', function(msg, send, done) {
            var value = toBoolean(msg.payload);
            var previousInput = node.inputState;
            node.inputState = value;

            // Only react on change (or first input)
            if (!node.initialized || value !== previousInput) {
                // Clear any running timer only when state changes
                clearTimers(node);
                node.initialized = true;

                if (value === true) {
                    // Input became truthy
                    var onDelay = node.configOnDelay;

                    // Runtime override via msg
                    if (msg.onDelay !== undefined) {
                        onDelay = parseDelay(msg.onDelay, node.delayUnit);
                    }

                    // Bypass: immediate without delay
                    if (msg.bypassOn === true) {
                        onDelay = 0;
                    }

                    if (onDelay > 0) {
                        startTimer(node, "on", onDelay, function() {
                            node.outputState = true;
                            updateStatus(node);
                            msg.payload = true;
                            send(msg);
                        });
                    } else {
                        node.outputState = true;
                        updateStatus(node);
                        msg.payload = true;
                        send(msg);
                    }
                } else {
                    // Input became falsy
                    var offDelay = node.configOffDelay;

                    // Runtime override via msg
                    if (msg.offDelay !== undefined) {
                        offDelay = parseDelay(msg.offDelay, node.delayUnit);
                    }

                    // Bypass: immediate without delay
                    if (msg.bypassOff === true) {
                        offDelay = 0;
                    }

                    if (offDelay > 0) {
                        startTimer(node, "off", offDelay, function() {
                            node.outputState = false;
                            updateStatus(node);
                            msg.payload = false;
                            send(msg);
                        });
                    } else {
                        node.outputState = false;
                        updateStatus(node);
                        msg.payload = false;
                        send(msg);
                    }
                }
            }

            if (done) done();
        });

        node.on('close', function() {
            clearTimers(node);
        });
    }

    function toBoolean(val) {
        if (val === false || val === 0 || val === "" ||
            val === null || val === undefined || Number.isNaN(val)) {
            return false;
        }
        if (typeof val === "string") {
            var lower = val.toLowerCase().trim();
            if (lower === "false" || lower === "0" || lower === "off") {
                return false;
            }
        }
        return true;
    }

    function parseDelay(value, unit) {
        var delay = parseFloat(value) || 0;
        switch (unit) {
            case "s": return delay * 1000;
            case "min": return delay * 60000;
            default: return delay;
        }
    }

    function clearTimers(node) {
        if (node.timer) {
            clearTimeout(node.timer);
            node.timer = null;
        }
        if (node.statusInterval) {
            clearInterval(node.statusInterval);
            node.statusInterval = null;
        }
        node.timerStart = null;
        node.timerDuration = null;
        node.timerTarget = null;
    }

    function startTimer(node, target, duration, callback) {
        node.timerStart = Date.now();
        node.timerDuration = duration;
        node.timerTarget = target;

        updateStatus(node);

        node.statusInterval = setInterval(function() {
            updateStatus(node);
        }, 1000);

        node.timer = setTimeout(function() {
            clearTimers(node);
            callback();
        }, duration);
    }

    function updateStatus(node) {
        var fill, shape, text;

        if (node.timerStart && node.timerDuration) {
            var elapsed = Date.now() - node.timerStart;
            var remaining = Math.max(0, node.timerDuration - elapsed);
            var seconds = Math.ceil(remaining / 1000);
            var targetText = node.timerTarget === "on" ? "ON" : "OFF";

            fill = "yellow";
            shape = "ring";
            text = "⏳ " + targetText + " in " + seconds + "s...";
        } else if (!node.initialized) {
            fill = "grey";
            shape = "ring";
            text = "Idle";
        } else if (node.outputState) {
            fill = "green";
            shape = "dot";
            text = "ON";
        } else {
            fill = "grey";
            shape = "dot";
            text = "OFF";
        }

        node.status({ fill: fill, shape: shape, text: text });
    }

    RED.nodes.registerType("ton-toff", TonToffNode);
}
