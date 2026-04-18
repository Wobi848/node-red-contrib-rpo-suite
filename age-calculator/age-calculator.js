module.exports = function(RED) {
    function AgeCalculatorNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Config values
        this.birthdate = config.birthdate;
        this.outputYears = config.outputYears !== false;
        this.outputMonths = config.outputMonths !== false;
        this.outputWeeks = config.outputWeeks !== false;
        this.outputDays = config.outputDays !== false;
        this.outputHours = config.outputHours !== false;
        this.outputMinutes = config.outputMinutes !== false;
        this.outputSeconds = config.outputSeconds !== false;
        this.outputReadable = config.outputReadable !== false;
        this.outputTimestamp = config.outputTimestamp !== false;

        node.on('input', function(msg, send, done) {
            // Use msg.payload as birthdate if provided, otherwise use config
            var birthdateStr = msg.payload || node.birthdate;

            if (!birthdateStr) {
                node.error("No birth date provided", msg);
                if (done) done();
                return;
            }

            // Support German date format DD.MM.YYYY and DD.MM.YYYY HH:MM[:SS]
            var parsedDate = birthdateStr;
            var germanDateMatch = birthdateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
            if (germanDateMatch) {
                var day = germanDateMatch[1].padStart(2, '0');
                var month = germanDateMatch[2].padStart(2, '0');
                var year = germanDateMatch[3];
                var hour = germanDateMatch[4] ? germanDateMatch[4].padStart(2, '0') : '00';
                var min = germanDateMatch[5] ? germanDateMatch[5].padStart(2, '0') : '00';
                var sec = germanDateMatch[6] ? germanDateMatch[6].padStart(2, '0') : '00';
                parsedDate = year + '-' + month + '-' + day + 'T' + hour + ':' + min + ':' + sec;
            }

            // Support ISO format with space: YYYY-MM-DD HH:MM[:SS]
            var isoSpaceMatch = birthdateStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
            if (isoSpaceMatch) {
                var isoYear = isoSpaceMatch[1];
                var isoMonth = isoSpaceMatch[2];
                var isoDay = isoSpaceMatch[3];
                var isoHour = isoSpaceMatch[4].padStart(2, '0');
                var isoMin = isoSpaceMatch[5];
                var isoSec = isoSpaceMatch[6] ? isoSpaceMatch[6] : '00';
                parsedDate = isoYear + '-' + isoMonth + '-' + isoDay + 'T' + isoHour + ':' + isoMin + ':' + isoSec;
            }

            var birthDate = new Date(parsedDate);

            if (isNaN(birthDate.getTime())) {
                node.error("Invalid date format: " + birthdateStr, msg);
                if (done) done();
                return;
            }

            var now = new Date();
            var diffMs = now - birthDate;

            if (diffMs < 0) {
                node.error("Birth date is in the future", msg);
                if (done) done();
                return;
            }

            // Calculate all units (total)
            var totalSeconds = Math.floor(diffMs / 1000);
            var totalMinutes = Math.floor(totalSeconds / 60);
            var totalHours = Math.floor(totalMinutes / 60);
            var totalDays = Math.floor(totalHours / 24);
            var totalWeeks = Math.floor(totalDays / 7);
            var totalMonths = Math.floor(totalDays / 30.44);
            var totalYears = Math.floor(totalDays / 365.25);

            // Calculate breakdown (remaining units for readable format)
            var remainingMonths = Math.floor((totalDays % 365.25) / 30.44);
            var remainingDays = Math.floor((totalDays % 365.25) % 30.44);
            var remainingHours = totalHours % 24;
            var remainingMinutes = totalMinutes % 60;
            var remainingSeconds = totalSeconds % 60;

            // Build result object based on selected checkboxes or msg.outputFields override
            var fields = msg.outputFields || {};
            var outYears = (fields.years !== undefined) ? fields.years : node.outputYears;
            var outMonths = (fields.months !== undefined) ? fields.months : node.outputMonths;
            var outWeeks = (fields.weeks !== undefined) ? fields.weeks : node.outputWeeks;
            var outDays = (fields.days !== undefined) ? fields.days : node.outputDays;
            var outHours = (fields.hours !== undefined) ? fields.hours : node.outputHours;
            var outMinutes = (fields.minutes !== undefined) ? fields.minutes : node.outputMinutes;
            var outSeconds = (fields.seconds !== undefined) ? fields.seconds : node.outputSeconds;
            var outReadable = (fields.readable !== undefined) ? fields.readable : node.outputReadable;
            var outTimestamp = (fields.timestamp !== undefined) ? fields.timestamp : node.outputTimestamp;

            var result = {};

            if (outYears) result.years = totalYears;
            if (outMonths) result.months = totalMonths;
            if (outWeeks) result.weeks = totalWeeks;
            if (outDays) result.days = totalDays;
            if (outHours) result.hours = totalHours;
            if (outMinutes) result.minutes = totalMinutes;
            if (outSeconds) result.seconds = totalSeconds;

            if (outReadable) {
                var readableParts = [];
                if (totalYears > 0) readableParts.push(totalYears + (totalYears === 1 ? " year" : " years"));
                if (remainingMonths > 0) readableParts.push(remainingMonths + (remainingMonths === 1 ? " month" : " months"));
                if (remainingDays > 0) readableParts.push(remainingDays + (remainingDays === 1 ? " day" : " days"));
                if (remainingHours > 0) readableParts.push(remainingHours + (remainingHours === 1 ? " hour" : " hours"));
                if (remainingMinutes > 0) readableParts.push(remainingMinutes + (remainingMinutes === 1 ? " minute" : " minutes"));
                if (remainingSeconds > 0) readableParts.push(remainingSeconds + (remainingSeconds === 1 ? " second" : " seconds"));
                result.readable = readableParts.join(", ") || "0 seconds";
            }

            if (outTimestamp) {
                result.timestamp = birthDate.getTime();
            }

            // Always include birthdate and calculated timestamp
            result.birthdate = birthdateStr;
            result.calculated = now.toISOString();

            msg.payload = result;
            send(msg);
            if (done) done();
        });
    }

    RED.nodes.registerType("age-calculator", AgeCalculatorNode);
}
