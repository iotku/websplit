// 
// ------------------------
// The majority of the code (not related to splitting functions or anything else
// that looks like spaghetti code) was written by Ian "bmn" Bennett, 
// taken shamlessly from http://www.w00ty.com/sda/timer/
//
// Shoutouts to him, I probably couldn't have built this from scratch
// - iotku
/*global define */
/*jslint browser:true */

function GameTimer(d) {
    "use strict"; // Someday I'll have good code
    // External Functions
    this.currentSplit = 1; /* Initialize at 1st split */
    /* [0]Name, [1]PBsplit, [2]Best Split, [3]Current Split */
    var splitsObject = Object.create(null); /* Initalize without prototype stuff that I'm apparently not using */
    splitsObject = {
        "1": ["BoB", 98000, 15000, 0],
        "2": ["WF", 100000, 98000, 0],
        "3": ["CCM", 250000, 230000, 0],
        "4": ["DW", 60000, 55000, 0],
        "5": ["LLL", 30000, 30000, 0],
        "6": ["Yolo", 1321231, 123132, 0]
    };
    this.totalSplits = Object.keys(splitsObject).length; /* calculate from splitsObject */ /* Doesn't work in IE<9 lol... */
    /* /Split Tracking */
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
        document.getElementById("timer_realtime").style.color = "#3ACC60";
        document.getElementById("timer_realtime").className = "timer-running";
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
        var timerText = document.getElementById("timer_realtime"); // Ugh.
        if (this.currently === 'play') {
            this.currently = 'pause';
            this.update(true, true);
            timerText.style.color = "#0062FF";
            timerText.className = "timer-paused";
        } else {
            this.currently = 'play';
            this.timer.start = this.now() - this.timer.realtime;
            this.update();
            timerText.style.color = "#3ACC60";
            timerText.className = "timer-running";
        }
    };

    this.split = function () {
        if (this.currently === 'play') {
            this.update(true, true);
            this.setTimeout(0);
            this.updateSplit(this.timer.realtime);
        } else if (this.currentSplit === this.totalSplits) {
            this.reset();
        } else if (this.timer.start === 0) {
            return this.start(0); /* 5 by default */
        } else { /* Everything breaks if I remove this xD */
            this.timer = { start: 0, now: 0, realtime: 0 };
            this.updateElements(); /* Resets the timer. keep */
        }
    };
    this.updateSplit = function (splittime) {
        var timerText = document.getElementById("split" + this.currentSplit),
            currentSegment = splittime - this.getSegmentTime(),
            prevSplit = document.getElementById("prevsplit"),
            prevText = document.getElementById("prevtext");
        splitsObject[this.currentSplit][3] = currentSegment;

        timerText.innerHTML = this.realTime(splittime - this.getTotalTime());
        prevSplit.innerHTML = this.realTime(currentSegment - splitsObject[this.currentSplit][1]);

        document.getElementById("difference" + this.currentSplit).style.fontWeight = "bolder";

        // console.log('CurrentSeg: ' + currentSegment + '::' + 'pbsplit: ' + splitsObject[this.currentSplit][1])
        if (currentSegment < splitsObject[this.currentSplit][2]) {
            timerText.style.color = "Gold";
            prevSplit.style.color = "Gold";
            splitsObject[this.currentSplit][2] = currentSegment;
        } else if (currentSegment < splitsObject[this.currentSplit][1]) { // Compares against pb
            timerText.style.color = "lime";
            prevSplit.style.color = "lime";
        } else {
            timerText.style.color = "Red";
            prevSplit.style.color = "Red";
        }

        // Setup for next split
        if (this.totalSplits !== this.currentSplit) {
            prevText.innerHTML = 'Prev Split:';
            this.currentSplit = this.currentSplit + 1;
            document.getElementById('row' + (this.currentSplit)).className += " active-split";
            document.getElementById('row' + (this.currentSplit - 1)).className = " ";
        } else {
            this.pause();
            document.getElementById("row" + this.currentSplit).className = " ";

            if (this.getTotalTime() > this.getSegmentTime()) { /*Dude nice*/
                prevText.innerHTML = '<b>New Record</b>';
                var step = 1;
                while (step <= this.totalSplits) {
                    splitsObject[step][1] = splitsObject[step][3];
                    step = step + 1;
                }
                this.saveSplits();
            } else {
                prevText.innerHTML = '<b>No Record</b>';
                if (this.getTotalTime() === 0) { // Works all the time 60% of the time.... BAD 
                    prevText.innerHTML = '<i>First Record</i>';
                    var step = 1;
                    while (step <= this.totalSplits) {
                        splitsObject[step][1] = splitsObject[step][3];
                        step = step + 1;
                    }
                }
            }
        }
    };

    this.getTotalTime = function () {
        var totalTime = 0,
            step = 0;
        while (step !== this.currentSplit) {
            totalTime = splitsObject[step + 1][1] + totalTime;
            step = step + 1;
        }
        return totalTime;
    };

    this.getSegmentTime = function () {
        var segmentTime = 0,
            step = 0;
        while (step !== this.currentSplit) {
            segmentTime = splitsObject[step + 1][3] + segmentTime;
            step = step + 1;
        }
        return segmentTime;
    };

    this.reset = function () {
        if (t.currently === 'stop'){
            t.start();
            return true;
        }
        if (t.currently === 'play') {
            t.pause();
        }
        this.currentSplit = 1;
        t.split(); /* What does this even do? */
        this.genSplits(); /* reset splits */

        document.getElementById("timer_realtime").style.color = "White";
        document.getElementById("prevsplit").innerHTML = "Ready";
        document.getElementById("prevtext").innerHTML = "";
    };

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

    this.genSplits = function () {
        var step = 1,
            addtime = 0;
        document.getElementById("dattable").innerHTML = ""; // make sure table is empty
        while (step <= this.totalSplits) { // What a mess.
            splitsObject[step][3] = 0; /* Reset current segments */
            addtime = splitsObject[step][1] + addtime;

            document.getElementById("dattable").innerHTML += '<tr id="row' + step + '">' + '<td id="splitname' + step + '"></td>' + '<td id="split' + step + '"></td>' + '<td id="difference' + step + '"></td>' + '</tr>';
            document.getElementById("splitname" + step).innerHTML = splitsObject[step][0];
            document.getElementById("split" + step).innerHTML = " ";
            document.getElementById("row" + step).className = "";
            document.getElementById("difference" + step).innerHTML = t.realTime(addtime);
            document.getElementById("difference" + step).style.color = "white";
            document.getElementById("difference" + step).style.fontWeight = "Normal";

            step = step + 1;
        }
        document.getElementById("prevsplit").style.color = "White";
        document.getElementById("timer_realtime").style.color = "White";
        document.getElementById("timer_realtime").className = "timer-stopped";
        document.getElementById("prevsplit").innerHTML = "Ready";
        document.getElementById("prevtext").innerHTML = "";
        this.currently = 'stop';
    };

    this.saveSplits = function () {
        var step = 1;
        while (step <= this.totalSplits) {
            splitsObject[step][1] = splitsObject[step][3];
            step = step + 1;
        }
        localStorage.PersonalBest = JSON.stringify(splitsObject);
        console.log(JSON.stringify(splitsObject))
        console.log("saved splits");
    };

    this.loadSplits = function () {
        splitsObject = JSON.parse(localStorage.PersonalBest);
        console.log("Loaded splis");
        this.currentSplit = 1;
        this.genSplits();
        this.timer = { start: 0, now: 0, realtime: 0 };
        this.updateElements(); /* Resets the timer. keep */
    };
    // Set up stuff
    var self = this;
    var d = d || {};

    this.timebase = {
        realtime: 60,
        splittime: 60 /* Why did I do this? */
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

window.onkeyup = function keyPress(e) {
    var k = e.which || e.keyCode;
    if (k === 83) {
        t.start(); // s
    } else if ((k === 80) || (k === 32)) {
        t.pause(); // p or space
    } else if (k === 76) {
        t.split(); // l
    } else if (k === 82) {
        t.reset(); // r
    } else if (k === 67) { t.reset(); t.split(); } // c
};

window.onload = function() {
    t.genSplits();
    document.getElementById("prevsplit").innerHTML = "Ready";
};