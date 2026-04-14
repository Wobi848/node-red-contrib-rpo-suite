module.exports = function(RED) {
    function EnthalpyNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.mode        = config.mode || 'single';
        node.topicTempIn  = config.topicTempIn  || 'tempIn';
        node.topicRhIn    = config.topicRhIn    || 'rhIn';
        node.topicTempOut = config.topicTempOut || 'tempOut';
        node.topicRhOut   = config.topicRhOut   || 'rhOut';
        node.decimals     = parseInt(config.decimals, 10);
        if (isNaN(node.decimals)) node.decimals = 2;

        node.tempIn  = null; node.rhIn  = null;
        node.tempOut = null; node.rhOut = null;

        node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for values...' });

        function calcEnthalpy(T, rh) {
            var satP = 6.112 * Math.exp((17.67 * T) / (T + 243.5));
            var partP = (rh / 100) * satP;
            var x = 0.622 * partP / (1013.25 - partP);
            var h = 1.006 * T + x * (2501 + 1.86 * T);
            return { enthalpy: h, absHumidity: x * 1000 };
        }

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.tempIn = null; node.rhIn = null;
                node.tempOut = null; node.rhOut = null;
                node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for values...' });
                return;
            }

            var val = parseFloat(msg.payload);
            if (isNaN(val)) { node.warn('Non-numeric payload ignored'); return; }

            var t = msg.topic;
            if (node.mode === 'single') {
                if (t === node.topicTempIn)  node.tempIn = val;
                else if (t === node.topicRhIn) node.rhIn = val;
                if (node.tempIn === null || node.rhIn === null) { node.status({ fill: 'grey', shape: 'ring', text: 'Waiting...' }); return; }
                var res = calcEnthalpy(node.tempIn, node.rhIn);
                var h   = parseFloat(res.enthalpy.toFixed(node.decimals));
                var info = { temp: node.tempIn, rh: node.rhIn, absHumidity: parseFloat((res.absHumidity).toFixed(node.decimals)), enthalpy: h, unit: 'kJ/kg' };
                var out = RED.util.cloneMessage(msg);
                out.payload  = h;
                out.enthalpy = info;
                node.send(out);
                node.status({ fill: 'green', shape: 'dot', text: h + ' kJ/kg' });
            } else {
                if (t === node.topicTempIn)  node.tempIn  = val;
                else if (t === node.topicRhIn)  node.rhIn  = val;
                else if (t === node.topicTempOut) node.tempOut = val;
                else if (t === node.topicRhOut)  node.rhOut  = val;
                if (node.tempIn === null || node.rhIn === null || node.tempOut === null || node.rhOut === null) {
                    node.status({ fill: 'grey', shape: 'ring', text: 'Waiting...' }); return;
                }
                var resIn  = calcEnthalpy(node.tempIn,  node.rhIn);
                var resOut = calcEnthalpy(node.tempOut, node.rhOut);
                var hIn    = parseFloat(resIn.enthalpy.toFixed(node.decimals));
                var hOut   = parseFloat(resOut.enthalpy.toFixed(node.decimals));
                var useHR  = hIn > hOut;
                var info2  = {
                    indoor:  { temp: node.tempIn,  rh: node.rhIn,  enthalpy: hIn },
                    outdoor: { temp: node.tempOut, rh: node.rhOut, enthalpy: hOut },
                    delta:   parseFloat((hIn - hOut).toFixed(node.decimals)),
                    useHeatRecovery: useHR,
                    unit: 'kJ/kg'
                };
                var out2 = RED.util.cloneMessage(msg);
                out2.payload  = useHR;
                out2.enthalpy = info2;
                node.send(out2);
                node.status({ fill: 'green', shape: 'dot', text: 'IN:' + hIn + ' OUT:' + hOut + ' → WRG ' + (useHR ? 'ON' : 'OFF') });
            }
        });
    }

    RED.nodes.registerType('enthalpy', EnthalpyNode);
};
