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
    console.log('HumanTime: ' + humantime);
    // return 
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

test = window.prompt()
console.log (this.parseTime(test))
