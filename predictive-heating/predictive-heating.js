module.exports = function(RED) {
    function PredictiveHeatingNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.weightCurrent = parseFloat(config.weightCurrent) || 4;
        this.weightDay0    = parseFloat(config.weightDay0)    || 2;
        this.weightDay1    = parseFloat(config.weightDay1)    || 1;
        this.weightDay2    = parseFloat(config.weightDay2)    || 0.5;
        this.uvMaxOffset   = parseFloat(config.uvMaxOffset)   || 2;

        node.status({ fill: "grey", shape: "ring", text: "Idle" });

        node.on('input', function(msg, send, done) {
            var atCurrent = parseFloat(msg.at_current);

            // Validate required inputs
            if (isNaN(atCurrent)) {
                node.warn("msg.at_current is required and must be a number");
                if (done) done();
                return;
            }

            // Forecast: use msg value if present, otherwise use stored context, fallback to atCurrent
            var avgDay0 = parseFloat(msg.avg_day0);
            var avgDay1 = parseFloat(msg.avg_day1);
            var avgDay2 = parseFloat(msg.avg_day2);
            var uvDay0  = parseFloat(msg.uv_day0);
            var uvDay1  = parseFloat(msg.uv_day1);

            if (!isNaN(avgDay0)) node.context().set('avg_day0', avgDay0);
            else avgDay0 = node.context().get('avg_day0') || atCurrent;

            if (!isNaN(avgDay1)) node.context().set('avg_day1', avgDay1);
            else avgDay1 = node.context().get('avg_day1') || atCurrent;

            if (!isNaN(avgDay2)) node.context().set('avg_day2', avgDay2);
            else avgDay2 = node.context().get('avg_day2') || atCurrent;

            if (!isNaN(uvDay0)) node.context().set('uv_day0', uvDay0);
            else uvDay0 = node.context().get('uv_day0') || 0;

            if (!isNaN(uvDay1)) node.context().set('uv_day1', uvDay1);
            else uvDay1 = node.context().get('uv_day1') || 0;

            // 1. Weighted predictive AT
            var totalWeight = node.weightCurrent + node.weightDay0 + node.weightDay1 + node.weightDay2;
            var atPred = (
                atCurrent * node.weightCurrent +
                avgDay0   * node.weightDay0 +
                avgDay1   * node.weightDay1 +
                avgDay2   * node.weightDay2
            ) / totalWeight;

            // 2. Solar UV correction (positive — high UV = warmer in reality)
            var solarOffset = 0;
            if (!isNaN(uvDay0) && !isNaN(uvDay1)) {
                var uvAvg = (uvDay0 + uvDay1) / 2;
                solarOffset = (uvAvg / 12) * node.uvMaxOffset;
                solarOffset = Math.max(0, Math.min(node.uvMaxOffset, solarOffset));
                atPred = atPred + solarOffset;
            }

            // Round results
            var atFinal    = Math.round(atPred * 10) / 10;
            var correction = Math.round((atFinal - atCurrent) * 10) / 10;
            var solOff     = Math.round(solarOffset * 10) / 10;

            // Determine mode based on forecast trend
            var delta = atPred - solarOffset - atCurrent;
            var mode;
            if (delta > 0.5) mode = "warming";
            else if (delta < -0.5) mode = "cooling";
            else mode = "stable";

            msg.payload = {
                at_predictive: atFinal,
                correction:    correction,
                solar_offset:  solOff,
                mode:          mode
            };

            // Status
            var fill = mode === "cooling" ? "blue" : mode === "warming" ? "yellow" : "green";
            node.status({
                fill: fill,
                shape: "dot",
                text: "AT " + atCurrent + " → " + atFinal + "°C (" + mode + ")"
            });

            send(msg);
            if (done) done();
        });
    }

    RED.nodes.registerType("predictive-heating", PredictiveHeatingNode);
}
