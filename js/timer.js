// The majority of the code (not related to splitting functions or anything else
// that looks like spaghetti code) was originally written by Ian "bmn" Bennett,
// from http://www.w00ty.com/sda/timer/
//
//
// Shoutouts to him, I probably couldn't have built everything from scratch
// - iotku

function GameTimer(d) {
    "use strict"; // Someday I'll have good code
    // External Functions
    this.currentSplit = 1; /* Initialize at 1st split */
    /* [0]Split Name, [1]PBsplit, [2]Best Split, [3]Current Split */
    var splitsObject = Object.create(null); /* Initalize without prototype stuff that I'm apparently not using */
    splitsObject = {
        "info": ["Game Name", "Goal", 0],
        "1": ["OK (ok)", 0, 0, 0],
    };

    this.start = function (start) {
        start = start || 0;
        this.timer = {
            start: this.now() + (start * 1000),
            now: 0,
            realtime: 0
        };
        this.updateElements();
        this.clearTimeout();
        this.setTimeout();
        this.currently = 'play';
        this.setStyle(this.currently);
        this.updateAttemptCounter();
        return this.timer.start;
    };

    this.update = function (no_timeout, clear_timeout) {
        var t = this.timer;
        t.now = this.now();
        t.realtime = t.now - t.start;
        this.updateElements();
        if (clear_timeout === true) {
            this.clearTimeout();
        }
        if (no_timeout !== true) {
            this.setTimeout();
        }
        return this.realTime(t.realtime);
    };

    this.pause = function () {
        if (this.disableControls === true) {return false;}
        if (this.currently === 'stop') {
            this.start();
            return false;
        } else if (this.currently === 'done') {
            return false;
        } else if (this.currently === 'play') {
            this.currently = 'pause';
            this.update(true, true);
            this.setStyle(this.currently);
        } else {
            this.currently = 'play';
            this.timer.start = this.now() - this.timer.realtime;
            this.update();
            this.setStyle(this.currently);
        };
    };

    this.reset = function () {
        if (this.disableControls === true) {return false;}
        if (t.currently === 'stop') {
            t.start();
            return false;
        };

        if (t.currently === 'play') {
            t.pause();
        };

        this.currently = 'reset';
        this.currentSplit = 1;
        t.split(); /* What does this even do? */
        this.genSplits(); /* reset splits */
    };

    this.split = function () {
        if (this.disableControls === true) {return false;}
        if (this.currently === 'pause') {
            this.pause(); // Unpause on split, if paused
            return false;
        } else if (this.currently === 'play') {
            this.update(true, true);
            this.setTimeout(0);
            this.updateSplit(this.timer.realtime);
        } else if (this.currentSplit === this.totalSplits && this.totalSplits != 1) {
            this.reset();
        } else if (this.timer.start === 0) {
            return this.start(0); // Startup delay in seconds
        } else {
            this.timerReset();
            this.genSplits();
        }
    };

    this.updateSplit = function (splittime) {
        var timerText = document.getElementById("split" + this.currentSplit),
            currentSegment = splittime - this.getSegmentTime(),
            bestSegment = splitsObject[this.currentSplit][2],
            prevSplit = document.getElementById("prevsplit"),
            prevText = document.getElementById("prevtext");

        // Double Tap Prevention
        if (currentSegment < 300) { return false; };

        // Add Current Segment to splitsObject
        splitsObject[this.currentSplit][3] = currentSegment;

        // Calculate Total Time Elapsed
        timerText.innerHTML = this.realTime(splittime - this.getTotalTime());

        // Calculate difference between currentSegment and PBsegment
        prevSplit.innerHTML = this.realTime(currentSegment - splitsObject[this.currentSplit][1]);

        // Set finished split time *bold* / Set color for segment and prevsplit
        document.getElementById("difference" + this.currentSplit).innerHTML = this.realTime(this.getSegmentTime());
        document.getElementById("difference" + this.currentSplit).style.fontWeight = "bolder";
        this.setSegmentColor(currentSegment);

        // Save if Gold split (Should be same logic as setSegmentColor())
        if (currentSegment < bestSegment || bestSegment === 0) { // If better than best segment
            this.saveGoldSplit(currentSegment);
        };

        // Setup for next split
        if (this.totalSplits !== this.currentSplit) {
            prevText.innerHTML = 'Prev. Segment:';
            this.currentSplit = this.currentSplit + 1;
            document.getElementById('row' + (this.currentSplit)).className += " active-split";
            document.getElementById('row' + (this.currentSplit - 1)).className = " ";
        } else {
            this.pause();
            this.currently = 'done';
            document.getElementById("row" + this.currentSplit).className = " ";
            if (this.getTotalTime() > this.getSegmentTime()) { /*Dude nice*/
                prevText.innerHTML = '<b>New Record</b>';
                this.setStyle("ahead");
                this.saveSplits();
            } else if (this.getTotalTime() === 0) {
                prevText.innerHTML = '<i>First Record</i>';
                this.setStyle("ahead");
                this.saveInitialSplits();
            } else {
                prevText.innerHTML = '<b>No Record</b>';
                this.setStyle("behind");
            }
        }
    };

    this.getTotalTime = function () {
        var totalTime = 0;
        for (var step = 0; step !== this.currentSplit; step++) {
            totalTime = splitsObject[step + 1][1] + totalTime;
        }
        return totalTime;
    };

    this.getSegmentTime = function () {
        var segmentTime = 0;
        for (var step = 0; step !== this.currentSplit; step++) {
            segmentTime = splitsObject[step + 1][3] + segmentTime;
        }
        return segmentTime;
    };

    this.genSplits = function () {
        this.disableControls = true; // Disable while generating splits (even though it should be incredibly fast.)
        this.editorEnabled = false; // It's fairly safe to assume if this function is running the editor has either been closed, or never opened.
        this.currentSplit = 1;
        if (localStorage.PersonalBest) {
            splitsObject = JSON.parse(localStorage.PersonalBest);
        };
        this.totalSplits = Object.keys(splitsObject).length - 1; /* How many splits do we have? Don't count info. */

        document.getElementById("splits-title").innerHTML = splitsObject["info"][0] + '<br>' + splitsObject["info"][1] + '<div id="attempt-counter">' + splitsObject["info"][2] + '</div>';
        document.getElementById("dattable").innerHTML = ""; // Make sure table is empty

        var addtime = 0;
        for (var step = 1; step <= this.totalSplits; step++) {
            splitsObject[step][3] = 0; /* Reset current segments */
            addtime = splitsObject[step][1] + addtime; // Add each segment together to generate split times
            // variables should be used properly here. (Hard to look at / confusing)

            // Generate table (Now formatted DIVs) based on splitsObject
            document.getElementById("dattable").innerHTML += '<span id="row' + step + '">' + '<div id="splitname' + step + '"></div>' + '<div id="split' + step + '"></div>' + '<div id="difference' + step + '"></div>' + '</span>';

            // Insert split names
            document.getElementById("splitname" + step).innerHTML = splitsObject[step][0];

            // Empty string as placeholder for split times
            document.getElementById("split" + step).innerHTML = " ";

            // Add total time upto current split
            document.getElementById("difference" + step).innerHTML = t.realTime(addtime);
        }

        this.currently = 'stop';
        this.setStyle(this.currently);
        this.disableControls = false;
    };
    
    this.updateAttemptCounter = function () {
        splitsObject["info"][2]++;
        document.getElementById("attempt-counter").innerHTML = splitsObject["info"][2];
        localStorage.PersonalBest = JSON.stringify(splitsObject);
    }

    this.saveGoldSplit = function (currentSegment) {
            // Should save if PB
            splitsObject[this.currentSplit][2] = currentSegment;

            // Load presaved splits (Shouldn't be resaved yet.)
            var tmpSplits = Object.create(null);
            tmpSplits = JSON.parse(localStorage.PersonalBest)

            // Change the old golds and save. Hopefully there's no case where the PB would save first.
            tmpSplits[this.currentSplit][2] = currentSegment;
            localStorage.PersonalBest = JSON.stringify(splitsObject);
    };

    this.saveSplits = function () {
        if (this.disableControls === true || this.currently === 'play') {return false;}
        for (var step = 1; step <= this.totalSplits; step++) {
            splitsObject[step][1] = splitsObject[step][3];
        }        
        localStorage.PersonalBest = JSON.stringify(splitsObject);
    };

    this.saveInitialSplits = function () {
        for (var step = 1; step <= this.totalSplits; step++) {
            splitsObject[step][1] = splitsObject[step][3];
            splitsObject[step][2] = splitsObject[step][3]; // Tansfer all to best split aswell, to remove initization values
        }
        localStorage.PersonalBest = JSON.stringify(splitsObject); // save splits
    };

    this.loadSplits = function () {
        if (this.disableControls === true || this.currently === 'play') {return false;}
        splitsObject = JSON.parse(localStorage.PersonalBest);
        this.currentSplit = 1;
        this.genSplits();
        this.timerReset();
    };

    this.deleteSplits = function () {
        if (this.disableControls === true || this.currently === 'play') {return false;}
        localStorage.removeItem("PersonalBest");
        for (var step = 1; step <= this.totalSplits; step++) {
            splitsObject[step][0] = step;
            splitsObject[step][1] = 0;
            splitsObject[step][2] = 0;
        }
        splitsObject["info"][0] = "No Game";
        splitsObject["info"][1] = "No Goal";
        splitsObject["info"][2] = 0;
        this.currentSplit = 1;
        this.genSplits();
        this.timerReset();
    };

    this.timerReset = function () { //useful after stopping timer, makes sure things reset completely
            this.timer = { start: 0, now: 0, realtime: 0 };
            this.updateElements(); /* Updates the now 0 timer values. */
    };

    // Split Editor
    this.genEditorSplits = function () {
        this.timerReset();
        var addtime = 0;
        document.getElementById("prevsplit").style.color = "white";
        document.getElementById("prevsplit").innerHTML = "Edit Mode.";
        // Change title/goal/attempt counter may require html restructure
        // document.getElementById("splits-title").innerHTML = '<input value="' + splitsObject["info"][0] + '<br>' + splitsObject["info"][1] + '<input id="attempt-counter" value="' + splitsObject["info"][2] + '" />';

        document.getElementById("dattable").innerHTML = ""; // Make sure table is empty
        document.getElementById("dattable").innerHTML = '<input disabled value="Names" /><input disabled value="Best" /><input disabled value="Seg" /><br>';
        for (var step = 1; step <= this.totalSplits; step++) {
            document.getElementById("dattable").innerHTML += '<span id="row' + step + '">' + '<input id="splitname' + step + '" type="text" value="' + splitsObject[step][0] + '" />' + '<input id="bestsegment' + step + '" type="text" value="' + this.editorRealTime(splitsObject[step][2]) + '">' + '<input id="difference' + step + '" type="text" value="' + this.editorRealTime(splitsObject[step][1]) + '">' + '</span>';
        }
        document.getElementById("dattable").innerHTML += '<input type="button" value="Add split" onclick="t.addSplit()"/><input type="button" value="Del split" onclick="t.removeSplit()"/><input type="button" value="Save" onclick="t.saveNewSplits()"/>&nbsp<input type="button" value="Exit" onclick="t.genSplits()"/>'
    };

    this.saveNewSplits = function () {
        var splitNames, enteredTime, bestsegTime;
        for (var step = 1; step <= this.totalSplits; step++) {
            splitNames = document.getElementById("splitname" + step).value;
            enteredTime = document.getElementById("difference" + step).value;
            bestsegTime = document.getElementById("bestsegment" + step).value;

            splitsObject[step][0] = splitNames;
            splitsObject[step][1] = this.parseTime(enteredTime);
            splitsObject[step][2] = this.parseTime(bestsegTime);
        };
        localStorage.PersonalBest = JSON.stringify(splitsObject);
        t.genSplits();
    };

    // Styling Functions
    this.cssChange = function (selector, property, value) { // http://stackoverflow.com/a/11081100
        for (var i=0; i<document.styleSheets.length;i++) { // Loop through all styles
            try { document.styleSheets[i].insertRule(selector+ ' {'+property+':'+value+'}', document.styleSheets[i].cssRules.length);
            } catch(err) {try { document.styleSheets[i].addRule(selector, property+':'+value);} catch(err) {}} // IE
        }
    }

    this.setStyle = function (currentState) {
        var timer = document.getElementById("timer_realtime")
        if (currentState === 'stop') {
            for (var step = 1; step <= this.totalSplits; step++) {
                var difference = document.getElementById("difference" + step),
                    row = document.getElementById("row" + step);
                difference.style.color = "white";
                difference.style.fontWeight = "Normal";
            }
            document.getElementById("prevsplit").style.color = "White";
            document.getElementById("prevsplit").innerHTML = "Ready";
            document.getElementById("prevtext").innerHTML = "";

            this.cssChange('#timers .stop1', 'stop-color', 'white');
            this.cssChange('#timers .stop2', 'stop-color', 'gray');
        } else if (currentState === 'play') {
            if (this.currentSplit === 1) {
                document.getElementById("row1").className += " active-split";
                document.getElementById("prevsplit").innerHTML = "...";
            }
            this.cssChange('#timers .stop1', 'stop-color', '#00FF68');
            this.cssChange('#timers .stop2', 'stop-color', '#00A541');
        } else if (currentState === 'pause') { // Same as stopped
            this.cssChange('#timers .stop1', 'stop-color', 'white');
            this.cssChange('#timers .stop2', 'stop-color', 'gray');
        } else if (currentState === 'ahead') {
            this.cssChange('#timers .stop1', 'stop-color', '#00B3FF');
            this.cssChange('#timers .stop2', 'stop-color', '#00A1E6');
        } else if (currentState === 'behind') {
            this.cssChange('#timers .stop1', 'stop-color', '#FF0000');
            this.cssChange('#timers .stop2', 'stop-color', '#E30000');
        };
    };

    this.setSegmentColor = function (currentSegment) {
        var timerText = document.getElementById("split" + this.currentSplit),
            prevSplit = document.getElementById("prevsplit"),
            pbSegment = splitsObject[this.currentSplit][1],
            bestSegment = splitsObject[this.currentSplit][2];

        if (currentSegment < bestSegment || bestSegment === 0) {
            prevSplit.style.color = "gold";
            timerText.style.color = "gold";
            if (this.getTotalTime() < this.getSegmentTime()) {
                timerText.innerHTML = '+' + timerText.innerHTML;
            }
            return false; // Exit without checking anything else, gold is gold everywhere!
        } else if (currentSegment < pbSegment) {
            prevSplit.style.color = "lime";
        } else {
            prevSplit.style.color = "red";
            prevSplit.innerHTML = '+' + prevSplit.innerHTML;
        }
        if (this.getTotalTime() > this.getSegmentTime()) {
            timerText.style.color = "lime";
        } else {
            timerText.style.color = "red";
            timerText.innerHTML = '+' + timerText.innerHTML;
        };
    };

    // Timing stuff
    this.realTime = function (t) {
        var h = Math.floor(t / 3600000),
            m = Math.abs(Math.floor((t / 60000) % 60)),
            s = Math.abs(Math.floor((t / 1000) % 60)),
            msd = this.ms[(h > 0) ? 1 : 0],
            ms = Math.abs(Math.floor((t % 1000) / (Math.pow(10, (3 - msd)))));
        if (t < 0) {
            ms -= 1;
            s -= 1;
            m -= 1;
            h += 1; // Adding += might be a HUGE mistake here, but it seems to solve an issue with seemingly random -1 values...... 
        }

        var humanTime;
        if (h == 0 && m == 0) {
            humanTime = this.pad(s, 1) + ((msd) ? '.' + this.pad(ms, msd) : '').slice(0, -1);
        } else if (h == 0 && m < 10) {
            humanTime = ((h != 0) ? h + ':' : '') + this.pad(m, 1) + ':' + this.pad(s, 2); // + ((msd) ? '.' + this.pad(ms, msd) : '');
        } else {
            humanTime = ((h != 0) ? h + ':' : '') + this.pad(m, 2) + ':' + this.pad(s, 2); // + ((msd) ? '.' + this.pad(ms, msd) : '');
        }

        if (t >= 0) { // I hate everything about this if statement.
            return humanTime;
        } else if ( t <= 0 && h == 0){
            return '-' + humanTime;
        } else if (h != 0) { // Hour adds the negative sign itself apparently.....
            return humanTime;
        }; // If this fails I'm pretty screwed.
    };


    this.timeConvert = function (hours, minutes, seconds) {
        // Convert from syntax like "00:00:00.00" to ms for use internally
        "use strict";
        var h, min, s, ms, time;
        h = Math.floor(hours * 3600000);
        min = Math.abs(Math.floor((minutes * 60000)));
        s = Math.abs(Math.floor((seconds * 1000)));
        time = (h + min + s);
        return time;
    };

    this.editorRealTime = function (t) { // This should probably be merged into this.realTime(), pretty redundant. (Is there even any differences?)
        "use strict";
        var h = Math.floor(t / 3600000),
            m = Math.abs(Math.floor((t / 60000) % 60)),
            s = Math.abs(Math.floor((t / 1000) % 60)),
            msd = this.ms[(h > 0) ? 1 : 0],
            ms = Math.abs(Math.floor((t % 1000) / (Math.pow(10, (3 - msd))))),
            humanTime = ((h !== 0) ? h + ':' : '') + this.pad(m, 2) + ':' + this.pad(s, 2) + ((msd) ? '.' + this.pad(ms, msd) : '');
        return humanTime;
    };

    this.parseTime = function (input) {
        // Lets break everything.....
        "use strict";
        var output, count;
        output = input.split(":");
        count = 0;
        for (var k in output) {if (output.hasOwnProperty(k)) {++count;}}
        if (count == 3) {
            return this.timeConvert(output[0], output[1], output[2]);
        } else if (count == 2) {
            return this.timeConvert(0, output[0], output[1]);
        } else if (count == 1) {
            return this.timeConvert(0,0,output[0]);
        } else {
            window.alert("You broke something, try again. \n Remember format is [hh:][mm:]ss[.ms]");
        }
    };

    // Internal functions
    this.updateElements = function () {
        if (this.elements) {
            document.getElementById(this.elements.realtime).textContent = this.realTime(this.timer.realtime);
            // document.getElementById("difference" + this.currentSplit).innerHTML = this.realTime(this.timer.realtime);
        }
    };

    this.now = function () {
        var t = new Date();
        return t.getTime();
    };

    this.setTimeout = function (interval) {
        var i = interval || this.interval;
        if (i) {
            this.timeout = setTimeout(function () { self.update(); }, i);
            return true;
        }
        return false;
    };

    this.clearTimeout = function () {
        if (this.interval) {
            clearTimeout(this.timeout);
            return true;
        }
        return false;
    };

    this.pad = function (n, ct) {
        var o = n.toString(); // Convert to string so it doesn't get added together
        while (o.length < ct) {
            o = "0" + o;
        }
        return o;
    };

    this.addSplit = function (selectedSplit) {
        if (this.editorEnabled === false) {return false}
        var replaceMe = this.totalSplits
        splitsObject[replaceMe + 1] = [replaceMe + 1,0,0,0];
        this.totalSplits = this.totalSplits + 1;
        this.genEditorSplits();
    }

    this.removeSplit = function () {
        if (this.editorEnabled === false) {return false}
        if (this.totalSplits === 1) {return false} // Can't have 0 splits
        delete splitsObject[this.totalSplits];
        this.totalSplits = this.totalSplits - 1;
        this.genEditorSplits();
    }

    // Set up stuff
    var disableControls = false;
    var editorEnabled = false;
    var self = this,
        d = d || {};

    this.timer = { start: 0, now: 0, realtime: 0 };
    this.elements = {
        realtime: d.elements.realtime
    };
    this.interval = d.interval;
    if (!d.ms) {
        this.ms = [3, 3];
    } else if (d.ms instanceof Array) {
        this.ms = d.ms;
    } else {
        this.ms = [d.ms, d.ms];
        this.currently = 'stop';
    }
}

var t; /* ? */
t = new GameTimer({
    elements: { realtime: 'timer_realtime' },
    interval: 10,
    ms: [2, 1]
});

// Hotkeys. onkeydown is more responsive than onkeyup
window.onkeydown = function keyPress(e) {
    var k = e.which || e.keyCode;
    if ((k === 80) || (k === 32)) {
        t.pause(); // p or space
    } else if (k === 76) {
        t.split(); // l
    } else if (k === 82) {
        t.reset(); // r
    };
};

window.onload = function () {
    t.genSplits();
};

this.openEditor = function () {
    if (t.currently == 'play' || t.currently == 'pause') {
        return false;
    } else {
        t.disableControls = true;
        t.editorEnabled = true;
        t.genEditorSplits();
    }
};

// Prompt before navigating away from page
var confirmOnPageExit = function (e) { // http://stackoverflow.com/a/1119324
    e = e || window.event;
    var message = 'Navigating away from this page will result in the timer stopping.\n\nAny unsaved splits will be discarded.';
    
    if (t.currently === "stop" || t.currently === "done") {
        // Don't notify
    } else {
        if (e) {e.returnValue = message;}
        return message;
    }
};

window.onbeforeunload = confirmOnPageExit;