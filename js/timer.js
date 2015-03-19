// The majority of the code (not related to splitting functions or anything else
// that looks like spaghetti code) was originally written by Ian "bmn" Bennett,
// from http://www.w00ty.com/sda/timer/
//
//
// Shoutouts to him, I probably couldn't have built everything from scratch
// - iotku

function GameTimer(d) {
    "use strict"; // Someday I'll have good code
    this.currentSplit = 1; // Initialize at 1st split
    this.goldCounter = 0; // How Many gold splits?
    this.splitID = 0; // Initialize, should be set my split selection function
    var splitsList = Object.create(null);

    if (localStorage.splitsListTracker) {
        splitsList = JSON.parse(localStorage.splitsListTracker);
    }
    var splitsObject = Object.create(null);

    /* [0]Split Name, [1]PBsplit, [2]Best Split, [3]Current Split */
    var defaultSplitsObject = Object.create(null); // Load this if, no other splits
    defaultSplitsObject = {
        "info": ["Game Name", "Goal", 0],
        "1": ["1", 0, 0, 0],
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
        }
    };

    this.reset = function () {
        if (this.disableControls === true) {return false;}
        if (t.currently === 'stop') {
            t.start();
            return false;
        }

        if (t.currently === 'play') {
            t.pause();
        }

        this.currently = 'reset';
        if (this.goldCounter > 0) {if (window.confirm("Would you like to save your gold splits?")){this.saveGoldSplit();}} // Wow
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
        if (currentSegment < 300) { return false; }

        // Add Current Segment to splitsObject
        splitsObject[this.currentSplit][3] = currentSegment;

        // Calculate Total Time Elapsed
        if (splitsObject[this.currentSplit][1] !== 0) {
            timerText.textContent = this.realTime(splittime - this.getTotalTime());

            // Calculate difference between currentSegment and PBsegment
            prevSplit.textContent = this.realTime(currentSegment - splitsObject[this.currentSplit][1]);
        } else {
            timerText.textContent = "-";
            prevSplit.textContent = "-";
        }

        // Set finished split time *bold* / Set color for segment and prevsplit
        document.getElementById("difference" + this.currentSplit).textContent = this.realTime(this.getSegmentTime());
        document.getElementById("difference" + this.currentSplit).style.fontWeight = "bolder";
        this.setSegmentColor(currentSegment);

        // Incriment gold counter to know how many golds there are
        if (currentSegment < bestSegment || bestSegment === 0) { // If better than best segment
            this.goldCounter++;
        }
        // Setup for next split
        if (this.totalSplits !== this.currentSplit) {
            prevText.textContent = 'Prev. Segment:';
            this.currentSplit = this.currentSplit + 1;
            document.getElementById('row' + (this.currentSplit)).className += " active-split";
            document.getElementById('row' + (this.currentSplit - 1)).className = " ";
        } else {
            this.pause();
            this.currently = 'done';
            document.getElementById("row" + this.currentSplit).className = " ";
            // (Total Time of PB    > Total of Current Segs || No Total, so new spltits  || Last Split is empty, so we assume that the run is new, even if behind)
            if (this.getTotalTime() > this.getSegmentTime() || this.getTotalTime() === 0 || splitsObject[this.totalSplits][1] === 0) { /*Dude nice*/
                prevText.innerHTML = '<b>New Record</b>';
                this.setStyle("ahead");
                this.saveGoldSplit();
                this.goldCounter = 0; // Make sure reset doesn't cause double gold save
                this.saveSplits();
            } else {
                prevText.innerHTML = '<b>No Record</b>';
                this.setStyle("behind");
                this.saveGoldSplit();
                this.goldCounter = 0; // Make sure reset doesn't cause double gold save
            }
        }
    };

    this.unsplit = function () { // TODO: Unsplit after timer has finished.
        if (this.currently === "done") {return false;}
        document.getElementById("difference" + this.currentSplit).style.fontWeight = "Normal";
        if (splitsObject[this.currentSplit][1] !== 0) {
            document.getElementById("difference" + this.currentSplit).textContent = this.realTime(this.getTotalTime());
        }

        splitsObject[this.currentSplit][3] = 0;

        if (this.currentSplit === 1) {
            return false;
        } else { // TODO: Reuse above more efficiently?
            document.getElementById('row' + (this.currentSplit)).className = " ";
            document.getElementById('row' + (this.currentSplit - 1)).className += " active-split";
            this.currentSplit--;
            document.getElementById("difference" + this.currentSplit).style.fontWeight = "Normal";
            document.getElementById("split" + this.currentSplit).textContent = ' ';
            if (splitsObject[this.currentSplit][1] === 0) {
                document.getElementById("difference" + this.currentSplit).textContent = '-';
            } else {
                document.getElementById("difference" + this.currentSplit).textContent = this.realTime(this.getTotalTime());
            }
        }
    };

    this.skipSplit = function () {
        if (this.currentSplit === this.totalSplits || this.currently === "stop") {return false;} // can't skip last split
        splitsObject[this.currentSplit][3] = 0;
        document.getElementById("difference" + this.currentSplit).textContent = '-';
        document.getElementById("split" + this.currentSplit).style.color = "white";
        document.getElementById("split" + this.currentSplit).textContent = '-';
        this.currentSplit++;
        document.getElementById('row' + (this.currentSplit)).className += " active-split";
        document.getElementById('row' + (this.currentSplit - 1)).className = " ";
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
        // Disable while generating splits (even though it should be fast.)
        this.disableControls = true;
        // It's fairly safe to assume if this function is running the editor
        // has either been closed, or never opened.
        this.editorEnabled = false;
        this.goldCounter = 0;
        this.currentSplit = 1;
        // How many splits do we have? Don't count info.
        this.totalSplits = Object.keys(splitsObject).length - 1;

        // Cleanup my mess hopefully
        for (var step = 1; step <= this.totalSplits; step++) {
            splitsObject[step][4] = 0;
        }

        document.getElementById("splits-game-name").textContent = splitsObject.info[0];
        document.getElementById("splits-goal-name").textContent = splitsObject.info[1];
        document.getElementById("attempt-counter").textContent = splitsObject.info[2];
        document.getElementById("splits-table").innerHTML = ""; // Make sure table is empty

        // Make sure editor controls are gone (bad place for this)
        document.getElementById("editor-controls").innerHTML = "";

        // Do split magic
        var addtime = 0;
        for (step = 1; step <= this.totalSplits; step++) {
            splitsObject[this.currentSplit][3] = 0; // Reset current segments
            addtime = splitsObject[this.currentSplit][1] + addtime; // Add each segment together to generate split times
            /* variables should be used properly here. (confusing) */

            // Generate table (Now formatted DIVs) based on splitsObject
            var container = document.createElement('span');
            container.id = "row" + this.currentSplit;
            container.innerHTML = '<div id="splitname' + this.currentSplit + '"></div>' + '<div id="split' + this.currentSplit + '"></div>' + '<div id="difference' + this.currentSplit + '"></div>';
            document.getElementById("splits-table").appendChild(container);
            // Insert split names
            document.getElementById("splitname" + this.currentSplit).innerHTML = splitsObject[this.currentSplit][0];

            // Empty string as placeholder for split times
            document.getElementById("split" + this.currentSplit).innerHTML = " ";

            // Add total time upto current split
            if (splitsObject[this.currentSplit][1] === 0){
                document.getElementById("difference" + this.currentSplit).textContent = '-';
            } else {
                document.getElementById("difference" + this.currentSplit).textContent = t.realTime(addtime);
            }

            this.currentSplit++;
        }

        this.currentSplit = 1;
        this.currently = 'stop';
        this.setStyle(this.currently);
        this.disableControls = false;
    };

    this.startSplits = function () {
        //Mom's spaghetti

        // // ID (starts at 0), [0] Game Name, [1] Goal, [2?] Total Time [3?] Primary Splits
        // splitsList = {
        //     "0": ["Super Mario 64", "16 Star"],
        //     "1": ["Super Mario 64", "70 Star"],
        // };
        if (Object.keys(splitsList).length === 0) {
             if (localStorage.PersonalBest) {
                splitsObject = JSON.parse(localStorage.PersonalBest); // Migrate from previous saved splits
            } else {
                splitsObject = defaultSplitsObject; // Splits Skeleton
            }
            this.splitID = 0; // Ensure starts at first id 0
            splitsList = Object.create(null);
            splitsList[0] = [splitsObject.info[0], splitsObject.info[1]];
            localStorage.splitsListTracker = JSON.stringify(splitsList);
            localStorage["PB" + this.splitID] = JSON.stringify(splitsObject);
            this.makeDefaultSplits(0);
        } else {
            if (localStorage.splitsDefault && localStorage.splitsDefault in splitsList) {
                this.selectPB(localStorage.splitsDefault);
                return false;
            } else if (localStorage.splitsDefault) { // Remove splits default if it no longer exists
                localStorage.removeItem("splitsDefault");
            }
            this.splitSelector();
        }
    };

    this.splitSelector = function () {
        if (this.currently === 'play' || this.currently === 'pause' || this.editorEnabled === true) {return false;}
        this.currently = "menu";
        this.disableControls = true; // Disable hotkeys while on menu, gensplits reenables
        document.getElementById("split-selector").innerHTML = "";
        document.getElementById("splits-table").innerHTML = "";
        document.getElementById("split-selector").style.visibility = "visible";
        document.getElementById("container").style.visibility = "hidden";
        document.getElementById("split-selector").innerHTML = "<h1>Select Splits</h1>";

        var pbid; // Keep this outside for loop so it stays for the rest of the function
        for (pbid in splitsList) { // Gets numbers hopefully
            splitsObject = JSON.parse(localStorage["PB" + pbid]);
            document.getElementById("split-selector").innerHTML += '<span class="delete"><a href="#" onclick="t.deleteSplitFile(' + pbid + ')">X</a><div class="slide"><p>Delete&nbsp;File</p></div></span><span class="defaultSplit"><a href="#" onclick="t.makeDefaultSplits(' + pbid + ')">✓</a><div class="slide"><p>Make&nbsp;Default</p></div></span><ul onclick="t.selectPB(' + pbid + ')"><li>' + splitsObject.info[0] + '</li><li>' + splitsObject.info[1] + '</li></ul>';
        }
        // Now that the loop has run, pbid should be the last object in the element supposibly.
        var nextpbid = parseInt(pbid, 10) + 1;
        document.getElementById("split-selector").innerHTML += '<input type="button" value="New Splits Entry"  onclick="t.newSplitFile(' + nextpbid + ')"></input>';

    };

    this.newSplitFile = function (lastfile) {
        splitsObject = defaultSplitsObject; // Splits Skeleton
        this.splitID = lastfile; // Start after last id
        splitsList[this.splitID] = [splitsObject.info[0], splitsObject.info[1]];
        localStorage.splitsListTracker = JSON.stringify(splitsList);
        localStorage["PB" + this.splitID] = JSON.stringify(splitsObject);
        document.getElementById("container").style.visibility = "visible";
        document.getElementById("split-selector").innerHTML = "";
        document.getElementById("split-selector").style.visibility = "hidden";
        this.genSplits();
        this.disableControls = true;
        this.editorEnabled = true;
        this.genEditorSplits();
    };

    this.wsplitExport = function () {
        var splitInfo = "Title=" + splitsObject.info[0] + " :: " + splitsObject.info[1] + "\r\n" + "Attempts="+ splitsObject.info[2] + "\r\n" + "Offset=0\r\nSize=152,25" + "\r\n";

        var splitSplits = "",
            splitIcons = "",
            addtime = 0;
        for (var step = 1; step <= this.totalSplits; step++) {
            addtime = splitsObject[step][1] + addtime;
            splitSplits += splitsObject[step][0] + ",0," + (addtime / 1000) + "," + (splitsObject[step][1] / 1000) + "\r\n";
            splitIcons += '"",';
        }

        var wspltFile = splitInfo + splitSplits + "Icons=" + splitIcons.slice(0, - 1);

        var textFile = null,
        makeTextFile = function (text) {
            var data = new Blob([text], {type: 'application/octet-stream'});

            if (textFile !== null) {
              window.URL.revokeObjectURL(textFile);
            }

            textFile = window.URL.createObjectURL(data);
            console.log(splitsObject.info[0])
            saveAs(data, splitsObject.info[0] + " - " + splitsObject.info[1] + ".wsplit");
        };

        makeTextFile(wspltFile); // How does any of this crap work?
    };

    this.selectPB = function (pbid) {
        this.splitID = pbid;
        splitsObject = JSON.parse(localStorage["PB" + pbid]);
        document.getElementById("container").style.visibility = "visible";
        document.getElementById("split-selector").innerHTML = "";
        document.getElementById("split-selector").style.visibility = "hidden";
        this.genSplits();
        this.timerReset();
    };

    this.makeDefaultSplits = function (pbid) {
        localStorage.splitsDefault = pbid;
        this.selectPB(pbid);
    };

    this.deleteSplitFile = function (id) {
        if (confirm("WARNING!:This will irrevocably delete the selected splits, Are you SURE you want to continue?")) {/* Cancel */
        } else {
            /* OK */
            return false;
        }
        localStorage.removeItem("PB" + id);
        delete splitsList[id];
        localStorage.splitsListTracker = JSON.stringify(splitsList);
        this.startSplits();
    };

    this.updateAttemptCounter = function () {
        splitsObject.info[2]++;
        document.getElementById("attempt-counter").textContent = splitsObject.info[2];
        localStorage["PB" + this.splitID] = JSON.stringify(splitsObject);
    };

    this.saveGoldSplit = function () {
        for (var step = 1; step <= this.totalSplits; step++) {
            if (splitsObject[step][2] > splitsObject[step][3] || splitsObject[step][2] === 0) {
                if(splitsObject[step][3] !== 0) {splitsObject[step][2] = splitsObject[step][3];} // Should find a better way
            }
        }
        localStorage["PB" + this.splitID] = JSON.stringify(splitsObject); // Don't break everything, please. Thanks.
    };

    this.saveSplits = function () {
        if (this.disableControls === true || this.currently === 'play') {return false;}
        if (confirm("Would you like to save?")) {/* Cancel */
        } else {
            /* OK */
            return false;
        }
        for (var step = 1; step <= this.totalSplits; step++) {
            splitsObject[step][1] = splitsObject[step][3];
            if (splitsObject[step][2] === 0) {
                splitsObject[step][2] = splitsObject[step][3];
            }
            if (splitsObject[step][1] === 0) {
                splitsObject[step][1] = splitsObject[step][3];
            }
        }
        localStorage["PB" + this.splitID] = JSON.stringify(splitsObject);
    };

    this.loadSplits = function () {
        if (this.disableControls === true || this.currently === 'play') {return false;}
        splitsObject = JSON.parse(localStorage["PB" + this.splitID]);
        this.currentSplit = 1;
        this.genSplits();
        this.timerReset();
    };

    // Useful after stopping timer, makes sure things reset completely
    this.timerReset = function () {
            this.timer = { start: 0, now: 0, realtime: 0 };
            this.updateElements(); /* Updates the now 0 timer values. */
    };

    // Split Editor
    this.genEditorSplits = function () {
        this.timerReset();
        this.editorEnabled = true;
        var addtime = 0;
        document.getElementById("prevsplit").style.color = "white";
        document.getElementById("prevsplit").textContent = "Edit Mode.";
        document.getElementById("splits-game-name").innerHTML = '<input id="splits-game-input" value="' + splitsObject.info[0] + '"/>';
        document.getElementById("splits-goal-name").innerHTML = '<input id="splits-goal-input" value="' + splitsObject.info[1] + '"/>';
        document.getElementById("attempt-counter").innerHTML = '<input id="attempt-counter-input" value="' + splitsObject.info[2] + '"/>';
        document.getElementById("splits-table").innerHTML = ""; // Make sure table is empty
        document.getElementById("splits-table").innerHTML = '<input disabled value="Names" /><input disabled value="Best" /><input disabled value="Seg" /><br>';
        for (var step = 1; step <= this.totalSplits; step++) {
            var container = document.createElement('span');
            container.id = "row" + step;
            container.innerHTML = '<input id="splitname' + step + '" type="text" value="' + splitsObject[step][0] + '" />' + '<input id="bestsegment' + step + '" type="text" value="' + this.editorRealTime(splitsObject[step][2]) + '">' + '<input id="difference' + step + '" type="text" value="' + this.editorRealTime(splitsObject[step][1]) + '">';
            document.getElementById("splits-table").appendChild(container);
        }
            // document.getElementById("splits-table").innerHTML += '<span id="row' + step + '">' + '<input id="splitname' + step + '" type="text" value="' + splitsObject[step][0] + '" />' + '<input id="bestsegment' + step + '" type="text" value="' + this.editorRealTime(splitsObject[step][2]) + '">' + '<input id="difference' + step + '" type="text" value="' + this.editorRealTime(splitsObject[step][1]) + '">' + '</span>';
        document.getElementById("editor-controls").innerHTML = '<input type="button" value="Add split" onclick="t.addSplit()"/>&nbsp<input type="button" value="Del split" onclick="t.removeSplit()"/><input type="button" value="Save" onclick="t.saveNewSplits()"/>&nbsp<input type="button" value="Exit" onclick="t.genSplits()"/>';
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
        }
        splitsObject.info[0] = document.getElementById("splits-game-input").value;
        splitsObject.info[1] = document.getElementById("splits-goal-input").value;
        splitsObject.info[2] = document.getElementById("attempt-counter-input").value;
        localStorage["PB" + this.splitID] = JSON.stringify(splitsObject);
        splitsList[this.splitID] = [splitsObject.info[0], splitsObject.info[1]];
        localStorage.splitsListTracker = JSON.stringify(splitsList);
        t.genSplits();
    };

    // Styling Functions
    this.cssChange = function (selector, property, value) { // http://stackoverflow.com/a/11081100
        for (var i=0; i<document.styleSheets.length;i++) { // Loop through all styles
            try { document.styleSheets[i].insertRule(selector+ ' {'+property+':'+value+'}', document.styleSheets[i].cssRules.length);
                } catch(err) {try { document.styleSheets[i].addRule(selector, property+':'+value);} catch(err) {}} // IE
        }
    };

    this.setStyle = function (currentState) {
        var timer = document.getElementById("timer_realtime");
        if (currentState === 'stop') {
            for (var step = 1; step <= this.totalSplits; step++) {
                var difference = document.getElementById("difference" + step),
                    row = document.getElementById("row" + step);
                difference.style.color = "white";
                difference.style.fontWeight = "Normal";
            }
            document.getElementById("prevsplit").style.color = "White";
            document.getElementById("prevsplit").textContent = "Ready";
            document.getElementById("prevtext").textContent = "";

            this.cssChange('#timer .stop1', 'stop-color', 'white');
            this.cssChange('#timer .stop2', 'stop-color', 'gray');
        } else if (currentState === 'play') {
            if (this.currentSplit === 1) {
                document.getElementById("row1").className += " active-split";
                document.getElementById("prevsplit").textContent = "...";
            }
            this.cssChange('#timer .stop1', 'stop-color', '#00FF68');
            this.cssChange('#timer .stop2', 'stop-color', '#00A541');
        } else if (currentState === 'pause') { // Same as stopped
            this.cssChange('#timer .stop1', 'stop-color', 'white');
            this.cssChange('#timer .stop2', 'stop-color', 'gray');
        } else if (currentState === 'ahead') {
            this.cssChange('#timer .stop1', 'stop-color', '#00B3FF');
            this.cssChange('#timer .stop2', 'stop-color', '#00A1E6');
        } else if (currentState === 'behind') {
            this.cssChange('#timer .stop1', 'stop-color', '#FF0000');
            this.cssChange('#timer .stop2', 'stop-color', '#E30000');
        }
    };

    this.setSegmentColor = function (currentSegment) {
        var timerText = document.getElementById("split" + this.currentSplit),
            prevSplit = document.getElementById("prevsplit"),
            pbSegment = splitsObject[this.currentSplit][1],
            bestSegment = splitsObject[this.currentSplit][2];

        if (pbSegment === 0 && bestSegment !== 0) {
            // make sure we don't add + onto empty split
            return false;
        }

        if (currentSegment < bestSegment || bestSegment === 0) {
            prevSplit.style.color = "gold";
            timerText.style.color = "gold";
            if (this.getTotalTime() < this.getSegmentTime() && pbSegment !== 0) {
                timerText.textContent = '+' + timerText.textContent;
            }
            return false; // Exit without checking anything else, gold is gold everywhere!
        } else if (currentSegment < pbSegment) {
            prevSplit.style.color = "lime";
        } else {
            prevSplit.style.color = "red";
            prevSplit.textContent = '+' + prevSplit.textContent;
        }
        if (this.getTotalTime() > this.getSegmentTime()) {
            timerText.style.color = "lime";
        } else {
            timerText.style.color = "red";
            timerText.textContent = '+' + timerText.textContent;
        }
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
            // Adding += might be a HUGE mistake here,
            // but it seems to solve an issue with seemingly random -1 values...
            h += 1;
        }

        var humanTime;
        if (h === 0 && m === 0) {
            humanTime = this.pad(s, 1) + ((msd) ? '.' + this.pad(ms, msd) : '').slice(0, -1);
        } else if (h === 0 && m < 10) {
            humanTime = ((h !== 0) ? h + ':' : '') + this.pad(m, 1) + ':' + this.pad(s, 2); // + ((msd) ? '.' + this.pad(ms, msd) : '');
        } else {
            humanTime = ((h !== 0) ? h + ':' : '') + this.pad(m, 2) + ':' + this.pad(s, 2); // + ((msd) ? '.' + this.pad(ms, msd) : '');
        }

        if (t >= 0) { // I hate everything about this if statement.
            return humanTime;
        } else if ( t < 0 && h === 0){
            return '-' + humanTime;
        } else if (h !== 0) { // Hour adds the negative sign itself apparently...
            return humanTime;
        } // If this fails I'm pretty screwed.
    };


    this.timeConvert = function (hours, minutes, seconds) {
        // Convert from syntax like "00:00:00.00" to ms for use internally
        var h, min, s, ms, time;
        h = Math.floor(hours * 3600000);
        min = Math.abs(Math.floor((minutes * 60000)));
        s = Math.abs(Math.floor((seconds * 1000)));
        time = (h + min + s);
        return time;
    };

    // This should probably be merged into this.realTime(), pretty redundant.
    // (Is there even any differences?)
    this.editorRealTime = function (t) {
        var h = Math.floor(t / 3600000),
            m = Math.abs(Math.floor((t / 60000) % 60)),
            s = Math.abs(Math.floor((t / 1000) % 60)),
            msd = this.ms[(h > 0) ? 1 : 0],
            ms = Math.abs(Math.floor((t % 1000) / (Math.pow(10, (3 - msd))))),
            humanTime = ((h !== 0) ? h + ':' : '') + this.pad(m, 2) + ':' + this.pad(s, 2) + ((msd) ? '.' + this.pad(ms, msd) : '');
        return humanTime;
    };

    this.parseTime = function (input) {
        // Often fails silently (== 0) if invalid input
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
            // document.getElementById("difference" + this.currentSplit).textContent = this.realTime(this.timer.realtime);
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

    // Either addsplit or removesplit leaves a mess behind in the DOM when used
    // not a huge issue (I hope), but worth investigating later
    this.addSplit = function () {
        if (this.editorEnabled === false) {return false;}
        var replaceMe = this.totalSplits + 1;
        splitsObject[replaceMe] = [replaceMe,0,0,0];
        this.totalSplits = this.totalSplits + 1;
        // This should hopefully not lose all <input> data
        var container = document.createElement("span");
        container.innerHTML = '<span id="row' + replaceMe + '"><input id="splitname' + replaceMe + '" type="text" value="' + replaceMe + '"><input id="bestsegment' + replaceMe + '" type="text" value="00:00.00"><input id="difference' + replaceMe + '" type="text" value="00:00.00"></span>';
        document.getElementById("splits-table").appendChild(container);

    };

    this.removeSplit = function () {
        if (this.editorEnabled === false) {return false;}
        if (this.totalSplits === 1) {return false;} // Can't have 0 splits
        delete splitsObject[this.totalSplits];
        var removedRow = document.getElementById("row" + this.totalSplits);
        removedRow.parentNode.removeChild(removedRow);
        this.totalSplits = this.totalSplits - 1;
    };

    // Set up stuff
    var disableControls = false;
    var editorEnabled = false;
    var self = this,
        d = d || {}; // I really don't know about this.

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
    interval: 100, // How fast to update (in ms)
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
    }
};

window.onload = function () {
    t.startSplits();
};

this.openEditor = function () {
    if (t.currently == 'play' || t.currently == 'pause') {
        return false;
    } else {
        t.disableControls = true;
        t.genEditorSplits();
    }
};


// Prompt before navigating away from page
var confirmOnPageExit = function (e) { // http://stackoverflow.com/a/1119324
    e = e || window.event;
    var message = 'Navigating away from this page will result in the timer stopping.\n\nAny unsaved splits will be discarded.';

    if (t.currently === "stop" || t.currently === "done" || t.currently === 'menu') {
        // Don't notify
    } else {
        if (e) {e.returnValue = message;}
        return message;
    }
};

window.onbeforeunload = confirmOnPageExit;