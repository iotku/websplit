this.timeConvert = function (hours, minutes, seconds, milliseconds) {
    // time to ms
    var h, min, s, ms;
    h = Math.floor(hours * 3600000);
    min = Math.abs(Math.floor((minutes * 60000)));
    s = Math.abs(Math.floor((seconds * 1000)));
    ms = milliseconds;
    time = (h + min + s + ms);
    this.realTime(time);
    return time;
};

this.pad = function (n, ct) {
    var o = n + '';
    while (o.length < ct) {
        o = "0" + o;
    }
    return o;
};

this.realTime = function (timeInMs) {
    var h = Math.floor(timeInMs / 3600000),
        m = Math.abs(Math.floor((timeInMs / 60000) % 60)),
        s = Math.abs(Math.floor((timeInMs / 1000) % 60)),
        msd = [3, 3];
        ms = Math.abs(Math.floor((timeInMs % 1000) / (Math.pow(10, (3 - msd)))));

    humantime = ((h != 0) ? h + ':' : '') + this.pad(m, 2) + ':' + this.pad(s, 2);
    return humantime; 
};


this.parseTime = function (input) {
    // Lets break everything.....
    output = input.split(":")
    console.log(output)
    var count = 0;
    for (var k in output) {if (output.hasOwnProperty(k)) {++count;}}
    // WHY DOES THIS WORK FOR MS ALSO???!?!?!?
    // for ()
    if (count == 3) {
        return timeConvert(output[0], output[1], output[2], 0);
    } else if (count == 2) {
        return timeConvert(0, output[0], output[1], 0);
    } else if (count == 1) {
        return timeConvert(0,0,output[0],0);
    } else {
        return "You broke something, try again. \n Remember format is [hh:][mm:]ss[.ms]"
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

this.genSplits = function () {
    if (localStorage.PersonalBest) {
        splitsObject = JSON.parse(localStorage.PersonalBest);
    };
    var addtime = 0;
    document.getElementById("dattable").innerHTML = ""; // Make sure table is empty
    for (var step = 1; step <= this.totalSplits; step++) {
        splitsObject[step][3] = 0; /* Reset current segments */
        addtime = splitsObject[step][1] + addtime; // Add each segment together to generate split times
        // variables should be used properly here. (Hard to look at / confusing)

        // Generate table (Now formatted DIVs) based on splitsObject
        document.getElementById("dattable").innerHTML += '<span id="row' + step + '">' + '<input id="splitname' + step + '" type="text" value="' + splitsObject[step][0] + '">' + '</input>' + '<input disabled id="split' + step + '" type="text" value="' + this.realTime(addtime) + '"></input>' + '<input id="difference' + step + '" type="text" value="' + this.realTime(splitsObject[step][1]) + '"></input>' + '</span><br>';

        // Insert split names
        document.getElementById("splitname" + step).innerHTML = splitsObject[step][0];

        // Empty string as placeholder for split times
        document.getElementById("split" + step).innerHTML = " ";

        // Add total time upto current split
        document.getElementById("difference" + step).innerHTML = this.realTime(addtime);
    }
};

window.onload = function () {
    this.genSplits();
};