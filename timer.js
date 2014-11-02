// The majority of the code (not related to splitting functions or anything else
// that looks like spaghetti code) was originally written by Ian "bmn" Bennett,
// from http://www.w00ty.com/sda/timer/
//
// 
// Shoutouts to him, I probably couldn't have built everything from scratch
// - iotku

// Jslint is a huge pain to deal with, and I'm ignoring some stuff,
// but at least it helped keep things /somewhat/ readable maybe.
/*global define */
/*jslint browser:true */

function GameTimer(d) {
    "use strict"; // Someday I'll have good code
    // External Functions
    this.currentSplit = 1; /* Initialize at 1st split */
    /* [0]Name, [1]PBsplit, [2]Best Split, [3]Current Split */
    var splitsObject = Object.create(null); /* Initalize without prototype stuff that I'm apparently not using */
    splitsObject = { // Probably should use something other than null here
        "1": ["BoB", 0, 0, 0],
        "2": ["WF", 0, 0, 0],
        "3": ["CCM", 0, 0, 0],
        "4": ["BitDW", 0, 0, 0],
        "5": ["LLL", 0, 0, 0],
        "6": ["SSL", 0, 0, 0],
        "7": ["HMC", 0, 0, 0],
        "8": ["DDD", 0, 0, 0],
        "9": ["BitFS", 0, 0, 0],
        "10": ["BLJs", 0, 0, 0],
        "11": ["Done.", 0, 0, 0]
    };
    this.totalSplits = Object.keys(splitsObject).length; /* calculate from splitsObject */ /* Doesn't work in IE<9 lol... */
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
        document.getElementById("row1").className += " active-split";
        document.getElementById("prevsplit").innerHTML = "...";
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
        if (this.currently === 'stop') {
            this.start();
            return false;
        } else if (this.currently === 'done') {
            return false; //Do nothing.
        } else if (this.currently === 'play') {
            this.currently = 'pause';
            this.update(true, true);
            this.setStyle(this.currently);
        // } else if (this.currently === 'pause') {
        } else {
            this.currently = 'play';
            this.timer.start = this.now() - this.timer.realtime;
            this.update();
            this.setStyle(this.currently);
        };
    };
    
    this.reset = function () {
        if (t.currently === 'stop') {
            t.start();
            return false; // do nothing else
        };

        if (t.currently === 'play') {
            t.pause();
        };
        
        this.currently = 'reset';
        this.currentSplit = 1;
        t.split(); /* What does this even do? */
        this.genSplits(); /* reset splits */
        document.getElementById("prevsplit").innerHTML = "Ready";
        document.getElementById("prevtext").innerHTML = "";
    };

    this.split = function () {
        if (this.currently === 'pause') {
            // Unpause on split, if paused
            this.pause();
            return false;
        } else if (this.currently === 'play') {
            this.update(true, true);
            this.setTimeout(0);
            this.updateSplit(this.timer.realtime);
        } else if (this.currentSplit === this.totalSplits) {
            this.reset();
        } else if (this.timer.start === 0) {
            return this.start(0); /* 5 by default, startup delay in seconds */
        } else { /* Everything breaks if I remove this xD */
            this.timerReset();
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
        document.getElementById("difference" + this.currentSplit).style.fontWeight = "bolder";
        this.setSegmentColor(currentSegment);

        // Save if Gold split (Should be same logic as setSegmentColor())
        if (currentSegment < bestSegment || bestSegment === 0) { // If better than best segment
            splitsObject[this.currentSplit][2] = currentSegment;
        }; 

        // Setup for next split
        if (this.totalSplits !== this.currentSplit) {
            prevText.innerHTML = 'Prev Split:';
            this.currentSplit = this.currentSplit + 1;
            document.getElementById('row' + (this.currentSplit)).className += " active-split";
            document.getElementById('row' + (this.currentSplit - 1)).className = " ";
        } else {
            this.pause();
            this.currently = 'done';
            document.getElementById("row" + this.currentSplit).className = " ";

            if (this.getTotalTime() > this.getSegmentTime()) { /*Dude nice*/
                prevText.innerHTML = '<b>New Record</b>';
                for (var step = 1; step <= this.totalSplits; step++) {
                    splitsObject[step][1] = splitsObject[step][3];
                }
                this.saveSplits();
            } else if (this.getTotalTime() === 0) {
                prevText.innerHTML = '<i>First Record</i>';
                for (var step = 1; step <= this.totalSplits; step++) {
                    splitsObject[step][1] = splitsObject[step][3];
                    splitsObject[step][2] = splitsObject[step][3];
                }
                localStorage.PersonalBest = JSON.stringify(splitsObject); // save splits
            } else {
                prevText.innerHTML = '<b>No Record</b>';
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
        if (localStorage.PersonalBest) {
            splitsObject = JSON.parse(localStorage.PersonalBest);
        };
        var addtime = 0;
        document.getElementById("dattable").innerHTML = ""; // make sure table is empty
        for (var step = 1; step <= this.totalSplits; step++) { // What a mess.
            splitsObject[step][3] = 0; /* Reset current segments */
            addtime = splitsObject[step][1] + addtime; // Add each segment together to generate split times
            // variables should be used properly here. (Hard to look at / confusing)

            /* Generate table based on splitsObject */
            document.getElementById("dattable").innerHTML += '<tr id="row' + step + '">' + '<td id="splitname' + step + '"></td>' + '<td id="split' + step + '"></td>' + '<td id="difference' + step + '"></td>' + '</tr>';
            /* Insert split names */
            document.getElementById("splitname" + step).innerHTML = splitsObject[step][0];
            /* Empty string as placeholder for split times */
            document.getElementById("split" + step).innerHTML = " ";
            document.getElementById("difference" + step).innerHTML = t.realTime(addtime);
        }
        document.getElementById("prevsplit").innerHTML = "Ready";
        document.getElementById("prevtext").innerHTML = "";
        this.currently = 'stop';
        this.setStyle(this.currently);
    };

    this.saveSplits = function () {
        if (this.currently === 'play') { return false; }; // Don't run if timer is running, breaks things.
        var step = 1;
        while (step <= this.totalSplits) {
            splitsObject[step][1] = splitsObject[step][3];
            step = step + 1;
        }
        localStorage.PersonalBest = JSON.stringify(splitsObject);
    };

    this.loadSplits = function () {
        if (this.currently === 'play') { return false; }; // Don't run if timer is running, breaks things.
        splitsObject = JSON.parse(localStorage.PersonalBest);
        this.currentSplit = 1;
        this.genSplits();
        this.timerReset();
    };

    this.deleteSplits = function () {
        if (this.currently === 'play') { return false; }; // Don't run if timer is running, breaks things.
        localStorage.removeItem("PersonalBest"); // Does this work?
        for (var step = 1; step <= this.totalSplits; step++) {
            splitsObject[step][1] = 0;
            splitsObject[step][2] = 0;
        }
        this.currentSplit = 1;
        this.genSplits();
        this.timerReset();
    };

    this.timerReset = function () { //useful after stopping timer, makes sure things reset completely
            this.timer = { start: 0, now: 0, realtime: 0 };
            this.updateElements(); /* Updates the now 0 timer values. */
    };

    // Styling Functions
    this.cssChange = function (selector, property, value) {
    for (var i=0; i<document.styleSheets.length;i++) {//Loop through all styles
        try { document.styleSheets[i].insertRule(selector+ ' {'+property+':'+value+'}', document.styleSheets[i].cssRules.length);
        } catch(err) {try { document.styleSheets[i].addRule(selector, property+':'+value);} catch(err) {}}//IE
    }
    }

    this.setStyle = function (currently) { //maybe could just call this.currently directly?
        var timer = document.getElementById("timer_realtime")
        if (currently === 'stop') {
            for (var step = 1; step <= this.totalSplits; step++) {
                var difference = document.getElementById("difference"+step),
                    row = document.getElementById("row"+step)
                difference.style.color = "white";
                difference.style.fontWeight = "Normal";
            }
            document.getElementById("prevsplit").style.color = "White";
            this.cssChange('#timers .stop1', 'stop-color', 'white');
            this.cssChange('#timers .stop2', 'stop-color', 'gray');
        } else if (currently === 'play') {
            this.cssChange('#timers .stop1', 'stop-color', '#00FF68');
            this.cssChange('#timers .stop2', 'stop-color', '#00A541');
        } else if (currently === 'pause') {
            this.cssChange('#timers .stop1', 'stop-color', '#0062FF');
            this.cssChange('#timers .stop2', 'stop-color', '#0088FF');
        };
    };

    this.setSegmentColor = function (currentSegment) {
        var timerText = document.getElementById("split" + this.currentSplit),
            prevSplit = document.getElementById("prevsplit"),
            pbSegment = splitsObject[this.currentSplit][1],
            bestSegment = splitsObject[this.currentSplit][2];

        if (currentSegment < bestSegment || bestSegment === 0) { // If better than best segment
            prevSplit.style.color = "gold";
            timerText.style.color = "gold";
            if (this.getTotalTime() < this.getSegmentTime()) {
                timerText.innerHTML = '+' + timerText.innerHTML;
            }
            return false; // cheap exit to bad logic below in next if statement
        } else if (currentSegment < pbSegment) {
            prevSplit.style.color = "lime";
        } else {
            prevSplit.style.color = "red";
            prevSplit.innerHTML = '+' + prevSplit.innerHTML; // This is cheap, but works.
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
        }
        if (h < 1 && m < 1) {
            return ((t < 0) ? '-' + s : this.pad(s, 1)) + ((msd) ? '.' + this.pad(ms, msd) : '').slice(0, -1);
        }
        return ((h > 0) ? h + ':' : '') + ((t < 0) ? '-' + m : this.pad(m, 1)) + ':' + this.pad(s, 2);// + ((msd) ? '.' + this.pad(ms, msd) : '')
    };

    // Internal functions
    this.updateElements = function () {
        if (this.elements) {
            document.getElementById(this.elements.realtime).innerHTML = this.realTime(this.timer.realtime);
            document.getElementById("difference" + this.currentSplit).innerHTML = this.realTime(this.timer.realtime);
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
        var o = n + '';
        while (o.length < ct) {
            o = "0" + o;
        }
        return o;
    };

    // Set up stuff
    var self = this,
        d = d || {};

    this.timebase = {
        realtime: 60
    };
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

/* Right Click menu hijack, maybe useful if I had an actual menu */
// document.oncontextmenu = RightMouseDown; 
// document.onmousedown = mouseDown; 

// function mouseDown(e) {
//     if (e.which==3) {//righClick
//         var blazeit69 = document.getElementById("controls");
//         if (blazeit69.style.visibility != "visible") {
//             blazeit69.style.visibility = "visible";
//         } else {
//             blazeit69.style.visibility = "hidden";
//         };
//     } 
// }

// function RightMouseDown() { 
//     return false; 
// }

window.onload = function () {
    t.genSplits();
};

