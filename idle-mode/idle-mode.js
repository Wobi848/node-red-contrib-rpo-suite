module.exports = function(RED) {
    function IdleModeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var multipliers = { 'min': 60, 'h': 3600, 'days': 86400 };
        var intRaw = parseFloat(config.exerciseInterval) || 7;
        node.exerciseInterval  = intRaw * (multipliers[config.exerciseIntervalUnit] || 86400);
        node.exerciseDuration  = parseFloat(config.exerciseDuration) || 60;
        node.persistent        = config.persistent !== false;

        var ctx = node.context();
        node.idleTime      = (node.persistent && ctx.get('idleTime'))      || 0;
        node.lastExercise  = (node.persistent && ctx.get('lastExercise'))  || null;
        node.exercising    = false;
        node.running       = false;
        node.exerciseTimer = null;

        function sendStatus(exercising) {
            var info = {
                exercising:        exercising,
                idleTime:          node.idleTime,
                exerciseInterval:  node.exerciseInterval,
                exerciseDuration:  node.exerciseDuration,
                remainingExercise: node.exercising ? node.remainingExercise : 0,
                nextExercise:      Math.max(0, node.exerciseInterval - node.idleTime),
                lastExercise:      node.lastExercise
            };
            node.send({ payload: exercising, idleMode: info });
        }

        function startExercise() {
            if (node.running || node.exercising) return;
            node.exercising = true;
            node.remainingExercise = node.exerciseDuration;
            sendStatus(true);
            node.status({ fill: 'blue', shape: 'dot', text: 'EXERCISING (' + node.exerciseDuration + 's)' });
            node.exerciseTimer = setTimeout(function() {
                node.exercising = false;
                node.idleTime = 0;
                node.lastExercise = new Date().toISOString();
                if (node.persistent) { ctx.set('idleTime', 0); ctx.set('lastExercise', node.lastExercise); }
                sendStatus(false);
                node.status({ fill: 'grey', shape: 'dot', text: 'IDLE (0s until next)' });
            }, node.exerciseDuration * 1000);
        }

        node.ticker = setInterval(function() {
            if (node.running || node.exercising) return;
            node.idleTime++;
            if (node.exercising) node.remainingExercise--;
            if (node.persistent) ctx.set('idleTime', node.idleTime);
            if (node.idleTime >= node.exerciseInterval) startExercise();
            var remaining = Math.max(0, node.exerciseInterval - node.idleTime);
            node.status({ fill: 'grey', shape: 'dot', text: 'IDLE (' + remaining + 's until exercise)' });
        }, 1000);

        node.status({ fill: 'grey', shape: 'dot', text: 'IDLE' });

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.idleTime = 0;
                if (node.persistent) ctx.set('idleTime', 0);
                return;
            }
            if (msg.exercise === true) { startExercise(); return; }

            var running = Boolean(msg.payload);
            var wasRunning = node.running;
            node.running = running;

            if (running) {
                if (node.exerciseTimer) { clearTimeout(node.exerciseTimer); node.exerciseTimer = null; node.exercising = false; }
                node.idleTime = 0;
                if (node.persistent) ctx.set('idleTime', 0);
                node.status({ fill: 'green', shape: 'dot', text: 'RUNNING (no exercise needed)' });
            }
        });

        node.on('close', function() {
            clearInterval(node.ticker);
            if (node.exerciseTimer) clearTimeout(node.exerciseTimer);
        });
    }

    RED.nodes.registerType('idle-mode', IdleModeNode);
};
