module.exports = function(RED) {
    function SignalGenNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.waveform  = config.waveform  || 'sine';
        node.amplitude = parseFloat(config.amplitude) || 10;
        node.offset    = parseFloat(config.offset)    || 0;
        node.period    = parseFloat(config.period)    || 60;
        if (config.periodUnit === 'min') node.period *= 60;
        node.interval  = parseInt(config.interval, 10) || 1000;
        node.decimals  = parseInt(config.decimals, 10);
        if (isNaN(node.decimals) || node.decimals < 0) node.decimals = 2;
        node.autoStart = config.autoStart !== false;

        node.running   = false;
        node.timer     = null;
        node.startTime = null;

        node.status({ fill:'grey', shape:'dot', text:'STOPPED' });
        if (node.autoStart) startGen(node);

        node.on('input', function(msg) {
            if (msg.payload === 'start')  { startGen(node); return; }
            if (msg.payload === 'stop')   { stopGen(node);  return; }
            if (msg.payload === 'reset')  { node.startTime = Date.now(); return; }
        });

        node.on('close', function() { stopGen(node); });

        function startGen(n) {
            if (n.running) return;
            n.running   = true;
            n.startTime = Date.now();
            n.timer     = setInterval(function() { tick(n); }, n.interval);
            n.status({ fill:'green', shape:'dot', text:'RUNNING ' + n.waveform });
        }

        function stopGen(n) {
            n.running = false;
            if (n.timer) { clearInterval(n.timer); n.timer = null; }
            n.status({ fill:'grey', shape:'dot', text:'STOPPED' });
        }

        function tick(n) {
            var t     = (Date.now() - n.startTime) / 1000;
            var phase = (t % n.period) / n.period;
            var val;

            switch (n.waveform) {
                case 'sine':
                    val = n.offset + n.amplitude * Math.sin(2 * Math.PI * phase);
                    break;
                case 'square':
                    val = phase < 0.5 ? n.offset + n.amplitude : n.offset - n.amplitude;
                    break;
                case 'sawtooth':
                    val = n.offset - n.amplitude + (2 * n.amplitude * phase);
                    break;
                case 'triangle':
                    val = phase < 0.5
                        ? n.offset - n.amplitude + (4 * n.amplitude * phase)
                        : n.offset + n.amplitude - (4 * n.amplitude * (phase - 0.5));
                    break;
                case 'random':
                    val = n.offset - n.amplitude + (2 * n.amplitude * Math.random());
                    break;
                default:
                    val = 0;
            }

            val = parseFloat(val.toFixed(n.decimals));
            n.status({ fill:'green', shape:'dot', text:'RUNNING ' + n.waveform + ' ' + val });
            n.send({
                payload:   val,
                signalGen: { waveform:n.waveform, value:val, phase:parseFloat(phase.toFixed(4)), amplitude:n.amplitude, offset:n.offset, period:n.period, t:parseFloat(t.toFixed(2)) }
            });
        }
    }

    RED.nodes.registerType('signal-gen', SignalGenNode);
};
