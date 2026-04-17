module.exports = function(RED) {
    function StartupNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.startSpeed   = parseFloat(config.startSpeed)   || 0;
        node.preRunTime   = parseFloat(config.preRunTime)   || 0;
        node.preRunSpeed  = parseFloat(config.preRunSpeed)  || 100;
        node.rampTime     = parseFloat(config.rampTime);     if (isNaN(node.rampTime)    || node.rampTime    < 0) node.rampTime    = 30;
        node.rampDownTime = parseFloat(config.rampDownTime); if (isNaN(node.rampDownTime)|| node.rampDownTime< 0) node.rampDownTime= 0;
        node.postRunTime  = parseFloat(config.postRunTime)  || 0;
        node.postRunSpeed = parseFloat(config.postRunSpeed) || 30;

        node.phase    = 'stopped';
        node.speed    = 0;
        node.ticker   = null;
        node.phaseTimer = null;

        function send(phase, speed, running) {
            var info = { phase: phase, speed: speed, running: running };
            node.send([{ payload: speed, startup: info }, { payload: running }]);
        }

        function setStatus(phase, speed) {
            var labels = { stopped:'STOPPED', preRun:'PRE-RUN', rampUp:'RAMP UP', running:'RUNNING', rampDown:'RAMP DOWN', postRun:'POST-RUN' };
            var fills  = { stopped:'grey', preRun:'blue', rampUp:'blue', running:'green', rampDown:'yellow', postRun:'yellow' };
            node.status({ fill: fills[phase] || 'grey', shape: 'dot', text: labels[phase] + ' ' + Math.round(speed) + '%' });
        }

        function clearTimers() {
            if (node.ticker)    { clearInterval(node.ticker);   node.ticker    = null; }
            if (node.phaseTimer){ clearTimeout(node.phaseTimer); node.phaseTimer= null; }
        }

        function startRampUp() {
            node.phase = 'rampUp';
            var startSpd = node.startSpeed;
            var elapsed = 0;
            var interval = 100;
            node.ticker = setInterval(function() {
                elapsed += interval / 1000;
                if (node.rampTime <= 0) { node.speed = 100; }
                else { node.speed = startSpd + (elapsed / node.rampTime) * (100 - startSpd); }
                if (node.speed >= 100) {
                    node.speed = 100;
                    clearInterval(node.ticker); node.ticker = null;
                    node.phase = 'running';
                    send('running', 100, true);
                    setStatus('running', 100);
                    return;
                }
                send('rampUp', parseFloat(node.speed.toFixed(1)), true);
                setStatus('rampUp', node.speed);
            }, interval);
        }

        function startRampDown(cb) {
            node.phase = 'rampDown';
            var startSpd = node.speed;
            var elapsed = 0;
            var interval = 100;
            node.ticker = setInterval(function() {
                elapsed += interval / 1000;
                if (node.rampDownTime <= 0) { node.speed = 0; }
                else { node.speed = startSpd - (elapsed / node.rampDownTime) * startSpd; }
                if (node.speed <= 0) {
                    node.speed = 0;
                    clearInterval(node.ticker); node.ticker = null;
                    if (cb) cb();
                    return;
                }
                send('rampDown', parseFloat(node.speed.toFixed(1)), true);
                setStatus('rampDown', node.speed);
            }, interval);
        }

        function doStop() {
            startRampDown(function() {
                if (node.postRunTime > 0) {
                    node.phase = 'postRun';
                    node.speed = node.postRunSpeed;
                    send('postRun', node.postRunSpeed, true);
                    setStatus('postRun', node.postRunSpeed);
                    node.phaseTimer = setTimeout(function() {
                        node.phase = 'stopped'; node.speed = 0;
                        send('stopped', 0, false);
                        setStatus('stopped', 0);
                    }, node.postRunTime * 1000);
                } else {
                    node.phase = 'stopped'; node.speed = 0;
                    send('stopped', 0, false);
                    setStatus('stopped', 0);
                }
            });
        }

        node.status({ fill: 'grey', shape: 'dot', text: 'STOPPED 0%' });

        node.on('input', function(msg) {
            var cmd = Boolean(msg.payload);
            var bypass = msg.bypass === true;

            if (cmd) {
                clearTimers();
                if (bypass || node.preRunTime <= 0) {
                    startRampUp();
                } else {
                    node.phase = 'preRun'; node.speed = node.preRunSpeed;
                    send('preRun', node.preRunSpeed, true);
                    setStatus('preRun', node.preRunSpeed);
                    node.phaseTimer = setTimeout(function() { startRampUp(); }, node.preRunTime * 1000);
                }
            } else {
                if (node.phase === 'stopped') return;
                clearTimers();
                if (bypass || node.rampDownTime <= 0) {
                    node.speed = 0;
                    if (node.postRunTime > 0) {
                        node.phase = 'postRun';
                        send('postRun', node.postRunSpeed, true);
                        setStatus('postRun', node.postRunSpeed);
                        node.phaseTimer = setTimeout(function() {
                            node.phase = 'stopped'; node.speed = 0;
                            send('stopped', 0, false);
                            setStatus('stopped', 0);
                        }, node.postRunTime * 1000);
                    } else {
                        node.phase = 'stopped';
                        send('stopped', 0, false);
                        setStatus('stopped', 0);
                    }
                } else {
                    doStop();
                }
            }
        });

        node.on('close', function() {
            clearTimers();
            node.send([{ payload: 0 }, { payload: false }]);
        });
    }

    RED.nodes.registerType('startup', StartupNode);
};
