this.timeConvert = function (hours, minutes, seconds, milliseconds) {
    // time to ms
    var h, min, s, ms;
    h = Math.floor(hours * 3600000);
    min = Math.abs(Math.floor((minutes * 60000)));
    s = Math.abs(Math.floor((seconds * 1000)));
    ms = milliseconds;
    time = (h + min + s + ms);
    return time;
};

this.pad = function (n, ct) {
    var o = n + '';
    while (o.length < ct) {
        o = "0" + o;
    }
    return o;
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
        h += 1; // Adding += might be a HUGE mistake here, but it seems to solve an issue with seemingly random -1 values...... 
    }

    var humanTime;
        humanTime = ((h != 0) ? h + ':' : '') + ((m != 0) ? this.pad(m,2) + ':' : '')+ this.pad(s, 2) + ((msd) ? '.' + this.pad(ms, msd) : '').slice(0, -1);
        return humanTime;
};


var self = this,
    d = d || {};

this.interval = d.interval;
if (!d.ms) {
    this.ms = [3, 3];
} else if (d.ms instanceof Array) {
    this.ms = d.ms;
} else {
    this.ms = [d.ms, d.ms];
    this.currently = 'stop';
};

this.parseTime = function (input) {
    // Lets break everything.....
    output = input.split(":")
    var count = 0;
    for (var k in output) {if (output.hasOwnProperty(k)) {++count;}}
    if (count == 3) {
        return timeConvert(output[0], output[1], output[2], 0);
    } else if (count == 2) {
        return timeConvert(0, output[0], output[1], 0);
    } else if (count == 1) {
        return timeConvert(0,0,output[0],0);
    } else {
        window.alert("You broke something, try again. \n Remember format is [hh:][mm:]ss[.ms]");
    }
};



this.currentSplit = 1; /* Initialize at 1st split */
/* [0]Split Name, [1]PBsplit, [2]Best Split, [3]Current Split */
var splitsObject = Object.create(null); /* Initalize without prototype stuff that I'm apparently not using */
splitsObject = {
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
this.totalSplits = Object.keys(splitsObject).length; /* How many splits do we have? */

var currentSplit = 0;
this.genSplits = function () {
    if (localStorage.PersonalBest) {
        splitsObject = JSON.parse(localStorage.PersonalBest);
    };
    var addtime = 0;
    document.getElementById("dattable").innerHTML = ""; // Make sure table is empty
    document.getElementById("dattable").innerHTML = '<input disabled value="Names"></input><input disabled value="Time"></input><input disabled value="Best Segment"></input><input disabled value="Segment"></input><br>';
    for (var step = 1; step <= this.totalSplits; step++) {
        splitsObject[step][3] = 0; /* Reset current segments */
        addtime = splitsObject[step][1] + addtime; // Add each segment together to generate split times
        // Generate table (Now formatted DIVs) based on splitsObject
        document.getElementById("dattable").innerHTML += '<span id="row' + step + '">' + '<input id="splitname' + step + '" value="' + splitsObject[step][0] + '" onclick="updateSplitTimes()">' + '</input>' + '<input disabled id="split' + step + '" value="' + this.realTime(addtime) + '"></input>' + '<input id="bestsegment' + step + '" value="' + this.realTime(splitsObject[step][2]) + '"></input>' + '<input id="difference' + step + '" value="' + this.realTime(splitsObject[step][1]) + '"></input>' + '</span><br>';
    }
};

saveNewSplits = function () {
    for (var step = 1; step <= this.totalSplits; step++) {
        enteredTime = document.getElementById("difference" + step).value;
        bestsegTime = document.getElementById("bestsegment" + step).value;
        console.log(this.parseTime(enteredTime))
        splitsObject[step][1] = this.parseTime(enteredTime);
        splitsObject[step][2] = this.parseTime(bestsegTime);
    };
    localStorage.PersonalBest = JSON.stringify(splitsObject);
    this.genSplits();
}

window.onload = function () {
    this.genSplits();
};