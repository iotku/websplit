// The majority of the code (not related to splitting functions or anything else
// that looks like spaghetti code) was originally written by Ian "bmn" Bennett,
// from http://www.w00ty.com/sda/timer/
//
//
// Shoutouts to him, I probably couldn't have built everything from scratch
// - iotku

// I want these available to every function now that I'm seperating things
var splitsObject = Object.create(null);
var splitsList = Object.create(null);
var splitID = 0;

function option (option) {
    // Options that should be user modifyable sometime in the future
    self = this;

    this.useWebsockets = false; // Use Websocket interface?
    this.startDelayAmount = 0;  // How many *seconds* of delay (TODO: Verify :: Is this taken into account everywhere?)
    this.maxSplits = 10;        // Max splits to display at once :: Not yet implemented.

    // Main timer
    this.playColor1 = "#00FF68";
    this.playColor2 = "#00A541";

    this.pauseColor1 = "white"
    this.pauseColor2 = "gray"

    this.ahaedColor1 = "#00B3FF"
    this.ahaedColor2 = "#00A1E6"

    this.behindColor1 = "#FF0000"
    this.behindColor2 = "#E30000"

    // Segment Colors
    this.goldSplitColor = "gold"
    this.aheadSplitColor = "lime";
    this.aheadSplitBehindTotalSegment = "#CC0000" // Eww, find better name?

    this.behindSplitColor = "red"
    this.behindSplitAheadTotalSegmentColor = "#00CC00" // Eww, find better name?
}

function editor (editor) {
    // Split Editor
    this.genEditorSplits = function () {
        console.log(splitsObject)
        t.timerReset();
        t.editorEnabled = true;
        var addtime = 0;
        // Hide regular splits
        document.getElementById("splits").style.display = "none";
        
        document.getElementById("prevsplit").style.color = "white";
        document.getElementById("prevsplit").textContent = "Edit Mode.";
        document.getElementById("splits-game-name").innerHTML = '<input id="splits-game-input" value="' + splitsObject.info[0] + '"/>';
        document.getElementById("splits-goal-name").innerHTML = '<input id="splits-goal-input" value="' + splitsObject.info[1] + '"/>';
        document.getElementById("attempt-counter").innerHTML = '<input id="attempt-counter-input" value="' + splitsObject.info[2] + '"/>';

        // Show editor
        document.getElementById("splits-editor").style.display = "block";
        document.getElementById("splits-editor-table").style.display = "table";
        document.getElementById("splits-editor-table").innerHTML = ""; // Make sure table is empty
        document.getElementById("splits-editor-table").innerHTML = '<input disabled value="Names" /><input disabled value="Best" /><input disabled value="Seg" /><br>';
        
        // Generate input boxes for each split
        for (var step = 1; step <= t.totalSplits; step++) {
            var container = document.createElement('span');
            container.id = "editor-row" + step;
            container.innerHTML = '<input id="editor-splitname' + step + '" type="text" value="' + splitsObject[step][0] + '" />' + '<input id="editor-bestsegment' + step + '" type="text" value="' + t.realTime(splitsObject[step][2], true) + '">' + '<input id="editor-difference' + step + '" type="text" value="' + t.realTime(splitsObject[step][1], true) + '"><br/><p class="editor-split-controls"><a class="btn-addSplit" onclick="editor.addSplit(' +step+ ')">+</a> / <a class="btn-removeSplit" onclick="editor.removeSplit(' + step + ')">-</a> / <a class="btn-moveSplitUp" onclick="editor.moveSplitUp(' + step + ')">^</a> / <a class="btn-moveSplitDown" onclick="editor.moveSplitDown(' + step + ')">V</a></p>';
            document.getElementById("splits-editor-table").appendChild(container);
        }
        document.getElementById("editor-controls").innerHTML = '<input type="button" value="Add split" onclick="editor.addSplit()"/>&nbsp<input type="button" value="Del split" onclick="editor.removeSplit()"/><input type="button" value="Save" onclick="editor.saveNewSplits()"/>&nbsp<input type="button" value="Exit" onclick="t.genSplits()"/>';
    };

    this.saveNewSplits = function () {
        var splitNames, enteredTime, bestsegTime;
        for (var step = 1; step <= this.totalSplits; step++) {
            splitNames = document.getElementById("editor-splitname" + step).value;
            enteredTime = document.getElementById("editor-difference" + step).value;
            bestsegTime = document.getElementById("editor-bestsegment" + step).value;
            splitsObject[step][0] = splitNames;
            splitsObject[step][1] = t.parseTime(enteredTime);
            splitsObject[step][2] = t.parseTime(bestsegTime);
        }
        splitsObject.info[0] = document.getElementById("splits-game-input").value;
        splitsObject.info[1] = document.getElementById("splits-goal-input").value;
        splitsObject.info[2] = document.getElementById("attempt-counter-input").value;
        localStorage["PB" + t.splitID] = JSON.stringify(splitsObject);
        splitsList[splitID] = [splitsObject.info[0], splitsObject.info[1]];
        localStorage.splitsListTracker = JSON.stringify(splitsList);
        t.genSplits();
    };

    this.addSplit = function (split) {
    // Either addsplit or removesplit leaves a mess behind in the DOM when used
    // not a huge issue (I hope), but worth investigating later
        if (t.editorEnabled === false) {return false;}
        var replaceMe = split + 1 || t.totalSplits + 1;
        var tmpSplitObject = Object.create(null);
        tmpSplitObject.info = splitsObject.info;
        
        for (i = 1; i <= replaceMe - 1; i++){
            tmpSplitObject[i] = splitsObject[i]
        }
        
        tmpSplitObject[replaceMe -1] = splitsObject[replaceMe -1]
        tmpSplitObject[replaceMe] = [replaceMe,0,0,0];
        
        for (i = replaceMe; i <= this.totalSplits; i++){
            tmpSplitObject[i + 1] = splitsObject[i]
        }

        // There's probably a much better way to change the IDs, but for now this works
        // and doesn't seem to be very slow
        for (i = split + 1; i <= t.totalSplits; i++) {
            document.getElementById("editor-row" + i).id = "editor-row-tmp" + (i + 1);
            document.getElementById("editor-splitname" + i).id = "editor-splitname-tmp" + (i + 1);
            document.getElementById("editor-difference" + i).id = "editor-difference-tmp" + (i + 1);
            document.getElementById("editor-bestsegment" + i).id = "editor-bestsegment-tmp" + (i + 1);
        }

        var splitRow = document.getElementById("editor-row-tmp" + (replaceMe + 1));
        var container = document.createElement("span");
        container.id = "editor-row" + replaceMe;
        container.innerHTML = '<input id="editor-splitname' + replaceMe + '" type="text" value="' + replaceMe + '"><input id="editor-bestsegment' + replaceMe + '" type="text" value="00:00.00"><input id="editor-difference' + replaceMe + '" type="text" value="00:00.00"><br/><p class="editor-split-controls"><a class="btn-addSplit" onclick="editor.addSplit(' + replaceMe + ')">+</a> / <a class="btn-removeSplit" onclick="editor.removeSplit(' + replaceMe + ')">-</a> / <a class="btn-moveSplitUp" onclick="editor.moveSplitUp(' + replaceMe + ')">^</a> / <a class="btn-moveSplitDown" onclick="editor.moveSplitDown(' + replaceMe + ')">V</a></p>';

        document.getElementById("splits-editor-table").insertBefore(container, splitRow);
        
        this.editorUpdateSplitButtons(); // make sure split buttons are current, even though it seemed to work fine without this.
        t.totalSplits++;
        
        for (i = split + 2; i <= this.totalSplits; i++) {
            document.getElementById("editor-row-tmp" + i).id = ("editor-row" + i); 
            document.getElementById("editor-splitname-tmp" + i).id = ("editor-splitname" + i); 
            document.getElementById("editor-difference-tmp" + i).id = ("editor-difference" + i); 
            document.getElementById("editor-bestsegment-tmp" + i).id = ("editor-bestsegment" + i); 
        }
        
        splitsObject = tmpSplitObject;

        if (!split) {
            // Scroll to bottom automatically
            var objDiv = document.getElementById("splits-editor");
            objDiv.scrollTop = objDiv.scrollHeight;
        }
    };

    this.removeSplit = function (split) {
        if (this.editorEnabled === false) {return false;}
        if (this.totalSplits === 1) {return false;} // Can't have 0 splits
        splitToDelete = split || t.totalSplits;
        if (!split || split == t.totalSplits) {
            delete splitsObject[splitToDelete];
            var removedRow = document.getElementById("editor-row" + splitToDelete);
            removedRow.parentNode.removeChild(removedRow);
            t.totalSplits = t.totalSplits - 1;
        } else {
            var removedRow = document.getElementById("editor-row" + splitToDelete);
            removedRow.parentNode.removeChild(removedRow);
            t.totalSplits = t.totalSplits - 1;
            
            delete splitsObject[split];
            splitsObject[split] = splitsObject[split+1];
            if (split == t.totalSplits){
                delete splitsObject[split + 1];
            }
            
            for (i = split + 1; i <= t.totalSplits; i++) {
                splitsObject[i] = splitsObject[i + 1];
                delete splitsObject[i + 1];
            }
            // There's probably a much better way to change the IDs, but for now this works
            // and doesn't seem to be very slow

            for (i = split; i <= t.totalSplits; i++) {
                document.getElementById("editor-row" + (i+1)).id = "editor-row-tmp" + (i);
                document.getElementById("editor-splitname" + (i+1)).id = "editor-splitname-tmp" + (i);
                document.getElementById("editor-difference" + (i+1)).id = "editor-difference-tmp" + (i);
                document.getElementById("editor-bestsegment" + (i+1)).id = "editor-bestsegment-tmp" + (i);
            }
            
            for (i = split; i <= t.totalSplits; i++) {
                document.getElementById("editor-row-tmp" + i).id = "editor-row" + i;
                document.getElementById("editor-splitname-tmp" + i).id = "editor-splitname" + i;
                document.getElementById("editor-difference-tmp" + i).id = "editor-difference" + i;
                document.getElementById("editor-bestsegment-tmp" + i).id = "editor-bestsegment" + i;
            }
        }
        this.editorUpdateSplitButtons();

    };

    this.moveSplitUp = function (split) {
        // Functional, but could probbaly be refactored to be more readable
        // Also uses a different order for swapping than moveSplitdown, which 
        // could be confusing
        if (split == 1) {return false;}
        var swap1, swap2;

        swap1 = splitsObject[split];
        swap2 = splitsObject[split-1];

        splitsObject[split-1] = swap1;
        splitsObject[split] = swap2;
        // document.getElementById("editor-row" + split).insert(document.getElementById("editor-row" + (split -1))); // Use insertBefore?
        var div1 = document.getElementById("editor-row" + split);
        var div2 = document.getElementById("editor-row" + (split -1));
        var container = document.getElementById("editor-row" + split);
        document.getElementById("splits-editor-table").insertBefore(container, div2)

        div1.id = "editor-row" + (split - 1);
        div2.id = "editor-row" + (split);
        
        var splitname1 = document.getElementById("editor-splitname" + (split - 1));
        var difference1 = document.getElementById("editor-difference" + (split - 1));
        var bestsegment1 = document.getElementById("editor-bestsegment" + (split - 1));
        
        var splitname2 = document.getElementById("editor-splitname" + split);
        var difference2 = document.getElementById("editor-difference" + split);
        var bestsegment2 = document.getElementById("editor-bestsegment" + split);

        splitname1.id = "editor-splitname" + split;
        splitname2.id = "editor-splitname" + (split - 1);

        difference1.id = "editor-difference" + split;
        difference2.id = "editor-difference" + (split - 1)

        bestsegment1.id = "editor-bestsegment" + split;
        bestsegment2.id = "editor-bestsegment" + (split - 1)

        this.editorUpdateSplitButtons();
    }

    this.moveSplitDown = function (split) {
        // Functional, but could probbaly be refactored to be more readable
        if (split == this.totalSplits) { return false;}
        var swap1, swap2;

        swap1 = splitsObject[split];
        swap2 = splitsObject[split+1];

        splitsObject[split+1] = swap1;
        splitsObject[split] = swap2;

        var div1 = document.getElementById("editor-row" + split);
        var div2 = document.getElementById("editor-row" + (split + 1));
        var container = document.getElementById("editor-row" + (split +1));
        document.getElementById("splits-editor-table").insertBefore(container, div1)

        div1.id = "editor-row" + (split + 1);
        div2.id = "editor-row" + (split);
        
        var splitname1 = document.getElementById("editor-splitname" + (split + 1));
        var difference1 = document.getElementById("editor-difference" + (split + 1));
        var bestsegment1 = document.getElementById("editor-bestsegment" + (split + 1));
        
        var splitname2 = document.getElementById("editor-splitname" + split);
        var difference2 = document.getElementById("editor-difference" + split);
        var bestsegment2 = document.getElementById("editor-bestsegment" + split);

        splitname1.id = "editor-splitname" + split;
        splitname2.id = "editor-splitname" + (split + 1);

        difference1.id = "editor-difference" + split;
        difference2.id = "editor-difference" + (split + 1)

        bestsegment1.id = "editor-bestsegment" + split;
        bestsegment2.id = "editor-bestsegment" + (split + 1);

        this.editorUpdateSplitButtons();
    }

    this.editorUpdateSplitButtons = function () {
        // TODO: Replace innerHTML with something else, it's pretty slow.
        var changeButtons = document.getElementsByClassName('editor-split-controls');
        for (var i = 0; i <= changeButtons.length - 1; i++) {
            changeButtons[i].innerHTML = '<a class="btn-addSplit" onclick="editor.addSplit(' + (i + 1) + ')">+</a> / <a class="btn-removeSplit" onclick="editor.removeSplit(' + (i + 1) + ')">-</a> / <a class="btn-moveSplitUp" onclick="editor.moveSplitUp(' + (i + 1) + ')">^</a> / <a class="btn-moveSplitDown" onclick="editor-bestsegment.moveSplitDown(' + (i + 1) + ')">V</a>'
        };
    }

}

function debugMsg(text) {
    var currentTime = new Date();
    var container = document.createElement('span');
    container.innerHTML = currentTime.getHours() + ":" + t.pad(currentTime.getMinutes(), 2) + ":" + t.pad(currentTime.getSeconds(), 2) + ": " + text + '<br>';
    document.getElementById("debug-output").appendChild(container);

    // Scroll to bottom automatically?
    var objDiv = document.getElementById("debug-output");
    objDiv.scrollTop = objDiv.scrollHeight;
}

function webSocket(f){
    var websocketURL = 'ws://localhost:8080/';
    ws = new WebSocket(websocketURL);
    
    ws.onopen = function() {
        debugMsg("Connected to " + websocketURL);
        document.getElementById("websock-status").textContent = "Connected to " + websocketURL;
    };

    this.closeSocket = function () {
        // Should autorespawn
        ws.close();
    };

    ws.onmessage = function(event) {
      switch (event.data) {
          case "start": t.split(); break;
          case "reset": t.reset(); break;
          case "unsplit": t.unsplit(); break;
          case "skipsplit": t.skipSplit(); break;
          default: t.split(t.parseTime(event.data)); break;
        }
      debugMsg("Recived: " + event.data);
    };

    ws.onerror = function (error) {
      debugMsg('WebSocket Error ' + error);
    };
     ws.onclose = function(){
        //try to reconnect in 5 seconds
        debugMsg("Connection Lost!");
        document.getElementById("websock-status").textContent = "Not Connected.";
        setTimeout(function(){webSocket();}, 5000);};
    var self = this,
    d = d || {}; // I really don't know about this.
}

function GameTimer(d) {
    /* User configurable settings */
    
    /* Timer variables (do not change unless you're sure) */
    this.currentSplit = 1; // Initialize at 1st split
    this.goldCounter = 0;  // How Many gold splits?
    this.splitID = 0;      // Initialize, should be set by split selection function
    this.startTime = 0;    // Keep track of inital start time for unsplit. (TODO: change to somethign more meaningful, and modify comment to mention that it saves the offset, including after pausing)

    if (localStorage.splitsListTracker) {
        splitsList = JSON.parse(localStorage.splitsListTracker);
    }

    /* [0]Split Name, [1]PBsplit, [2]Best Split, [3]Current Split */
    var defaultSplitsObject = Object.create(null); // Load this if, no other splits
    defaultSplitsObject = {
        "info": ["Game Name", "Goal", 0],
        "1": ["1", 0, 0, 0],
    };

    this.start = function (start) {
        pref = performance.now();
        start = start || 0;
        this.timer = {
            start: pref + (start * 1000),
            now: 0,
            realtime: 0
        };
        this.startTime = this.timer.start;
        this.updateElements();
        this.clearTimeout();
        this.setTimeout();

        this.setState("play");
        this.updateAttemptCounter();
        
        return this.timer.start;
    };

    this.update = function (no_timeout, clear_timeout) {
        var t = this.timer;
        t.now = performance.now();
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
        if (this.currently === 'play') {
            this.setState("pause");
            this.update(true, true);
        } else if (this.currently === 'stop') {
            this.start();
            return false;
        } else if (this.currently === 'done') {
            return false;
        } else {
            this.setState("play");
            var timeOffset = this.now() - this.timer.realtime;
            this.timer.start = timeOffset;
            this.update();
            this.startTime = timeOffset; // For unsplitting after timer stops
        }
    };

    this.reset = function () {
        if (this.disableControls === true) {return false;}
        if (t.currently === 'stop') {
            t.start();
            return false;
        } else if (t.currently === 'play') {
            t.pause();
        }

        this.currently = 'reset';
        if (this.goldCounter > 0) {if (window.confirm("Would you like to save your gold splits?")){this.saveGoldSplit();}} // Wow
        this.currentSplit = 1;
        t.split(); /* What does this even do? */
        this.genSplits(); /* reset splits */
    };

    this.split = function (splitTime) {
        var actualTime = this.timer.realtime;
        if (this.disableControls === true) {return false;}
        splittime = splitTime || actualTime;
        if (this.currently === 'pause') {
            this.pause(); // Unpause on split, if paused
            return false;
        } else if (this.currently === 'play') {
            this.update(true, true);
            this.setTimeout(0);
            this.updateSplit(splittime);
        } else if (this.currentSplit === this.totalSplits && this.totalSplits != 1) {
            this.reset();
        } else if (this.timer.start === 0) {
            return this.start(option.startDelayAmount); // Startup delay in seconds
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

        if (this.totalSplits === this.currentSplit) {
            // Stop timer and match time with last split
            this.pause();
            this.currently = 'done';
            document.getElementById("timer_realtime").textContent = this.realTime(splittime);
        }

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
        this.resizeSplitColumn();

        // Increment gold counter to know how many golds there are
        if (currentSegment < bestSegment || bestSegment === 0) { // If better than best segment
            this.goldCounter++;
        }
        // Setup for next split
        if (this.totalSplits !== this.currentSplit) {
            prevText.textContent = 'Prev. Segment:';
            this.currentSplit = this.currentSplit + 1;
            document.getElementById('row' + (this.currentSplit)).className += " active-split";
            document.getElementById('row' + (this.currentSplit - 1)).className = " ";
            
            // advance visible splits when truncated 
            if (this.currentSplit > 5 && this.totalSplits > 10) {// Don't start until half way thru visible splits
                if ((this.totalSplits - this.currentSplit) >= 5) {
                document.getElementById("row" + (this.currentSplit + 4)).style.display = "table-row";
                document.getElementById("row" + (this.currentSplit - 5)).style.display = "none";
                }
            }
        } else {
            document.getElementById("row" + this.currentSplit).className = " ";
            // (Total Time of PB    > Total of Current Segs || No Total, so new splits  || Last Split is empty, so we assume that the run is new, even if behind)
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

    this.unsplit = function () {
        if (this.disableControls === true || this.currentSplit === 1) { return false; }

        document.getElementById("difference" + this.currentSplit).style.fontWeight = "Normal";

        if (this.currently === "done" && this.currentSplit === this.totalSplits) {
            this.setState("play");
            this.timer.start = this.startTime;
            this.update();

            // Decrement gold split counter if unsplitting a gold split
            if (splitsObject[this.currentSplit][3] < splitsObject[this.currentSplit][2]) {
            goldCounter--;
            }

            // Reset current (Still last) split
            splitsObject[this.currentSplit][3] = 0;
            
            document.getElementById('row' + this.currentSplit).className += " active-split";
            document.getElementById("split" + this.currentSplit).textContent = ' ';
            document.getElementById("difference" + this.currentSplit).textContent = this.realTime(this.getTotalTime());
            return false;
        }


        // Decrement gold split counter if unsplitting a gold split
        if (splitsObject[this.currentSplit - 1][3] < splitsObject[this.currentSplit -1][2]) {
            goldCounter--;
        }

        // Reset Previous split before switching to it
        splitsObject[this.currentSplit - 1][3] = 0;

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

        if (this.currentSplit >= 5 && this.totalSplits > option.maxSplits && (this.totalSplits - this.currentSplit) > 5) {// Don't start until half way thru visible splits, currently hard-coded to 10 splits
            document.getElementById("row" + (this.currentSplit - 4)).style.display = "table-row";
            document.getElementById("row" + (this.currentSplit + 5)).style.display = "none";
        }
    };

    this.skipSplit = function () {
        if (this.currentSplit === this.totalSplits || this.currently === "stop") {return false;} // can't skip last split
        splitsObject[this.currentSplit][3] = 0;
        document.getElementById("difference" + this.currentSplit).textContent = '-';
        document.getElementById("split" + this.currentSplit).style.color = "white";
        document.getElementById("split" + this.currentSplit).textContent = '-';

        if (this.currentSplit == 1) { document.getElementById("prevtext").textContent = "Prev. Segment:"; }
        document.getElementById("prevsplit").style.color = "white";
        document.getElementById("prevsplit").textContent = '-';
        
        this.currentSplit++;
        document.getElementById('row' + (this.currentSplit)).className += " active-split";
        document.getElementById('row' + (this.currentSplit - 1)).className = " ";
        // advance visible splits when truncated 
        if (this.currentSplit > 5 && this.totalSplits > 10) {// Don't start until half way thru visible splits
            if ((this.totalSplits - this.currentSplit) >= 5) {
            document.getElementById("row" + (this.currentSplit + 4)).style.display = "table-row";
            document.getElementById("row" + (this.currentSplit - 5)).style.display = "none";
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
        // Disable while generating splits (even though it should be fast.)
        this.disableControls = true;
        // Show controls after hiding them for the split menu
        document.getElementById("controls").style.display = "block"; 
        // It's fairly safe to assume if this function is running the editor
        // has either been closed, or never opened.
        document.getElementById("splits-editor").style.display = "none";
        document.getElementById("splits-editor-table").style.display = "none";
        document.getElementById("splits-table").style.display = "table"; // Make sure table is empty
        document.getElementById("splits").style.display = "block"; // Make sure table is empty


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
        this.resizeSplits();
        this.setState("stop");
        this.disableControls = false;
    };

    this.setState = function (state) {
        this.currently = state;
        this.setStyle(state);
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
        this.setState("menu");
        this.disableControls = true; // Disable hotkeys while on menu, gensplits re-enables
        document.getElementById("split-selector").innerHTML = "";
        document.getElementById("splits-table").innerHTML = "";
        document.getElementById("controls").style.display = "none";
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
        t.genSplits();
        t.disableControls = true;
        t.editorEnabled = true;
        editor.genEditorSplits();
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
        this.disableControls = true;
        if (confirm("Would you like to save?")) {/* Cancel */
        } else {
            /* OK */
            this.disableControls = "false";
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
        this.disableControls = "false";
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
            this.cssChange('#timer .stop1', 'stop-color', option.playColor1);
            this.cssChange('#timer .stop2', 'stop-color', option.playColor2);
        } else if (currentState === 'pause') {
            this.cssChange('#timer .stop1', 'stop-color', option.pauseColor1);
            this.cssChange('#timer .stop2', 'stop-color', option.pauseColor2);
        } else if (currentState === 'ahead') {
            this.cssChange('#timer .stop1', 'stop-color', option.ahaedColor1);
            this.cssChange('#timer .stop2', 'stop-color', option.ahaedColor2);
        } else if (currentState === 'behind') {
            this.cssChange('#timer .stop1', 'stop-color', option.behindColor1);
            this.cssChange('#timer .stop2', 'stop-color', option.behindColor2);
        }
    };

    this.setSegmentColor = function (currentSegment) {
        var timerText = document.getElementById("split" + this.currentSplit),
            prevSplit = document.getElementById("prevsplit"),
            pbSegment = splitsObject[this.currentSplit][1],
            bestSegment = splitsObject[this.currentSplit][2];

        if (pbSegment === 0 && bestSegment !== 0) {
            return false;
        }

        if (currentSegment < bestSegment || bestSegment === 0) {
            prevSplit.style.color = option.goldSplitColor;
            timerText.style.color = option.goldSplitColor;
            if (this.getTotalTime() < this.getSegmentTime() && pbSegment !== 0) {
                timerText.textContent = '+' + timerText.textContent;
            }
            return false; // Exit without checking anything else, gold is gold everywhere!
        } else if (currentSegment <= pbSegment && this.getSegmentTime() <= this.getTotalTime()) {
            // Ahead Split + Ahead Total Time
            prevSplit.style.color = option.aheadSplitColor;
            timerText.style.color = option.aheadSplitColor;
        } else if (currentSegment <= pbSegment && this.getSegmentTime() >= this.getTotalTime()) {
            // Ahead Split, But not ahead total time
            prevSplit.style.color = option.aheadSplitColor;
            timerText.style.color = option.aheadSplitBehindTotalSegment;
            timerText.textContent = '+' + timerText.textContent;
        } else if (currentSegment >= pbSegment && this.getSegmentTime() >= this.getTotalTime()) {
            // Behind Split, and behind total time.
            prevSplit.style.color = option.behindSplitColor;
            timerText.style.color = option.behindSplitColor;
            timerText.textContent = '+' + timerText.textContent;
            prevSplit.textContent = '+' + prevSplit.textContent;
        } else if (currentSegment >= pbSegment && this.getSegmentTime() <= this.getTotalTime()) {
            // Behind Split, but ahead total time
            prevSplit.style.color = option.behindSplitColor;
            timerText.style.color = option.behindSplitAheadTotalSegmentColor;
            prevSplit.textContent = '+' + prevSplit.textContent;
        } else { // Hopefully, all our bases are covered....
            // Make obvious something went wrong somehow.
            prevSplit.style.color = "yellow";
            timerText.style.color = "yellow";
            prevSplit.textContent = '?' + prevSplit.textContent;
            timerText.textContent = '?' + timerText.textContent;
        }
    };

    // Timing stuff
    this.realTime = function (time, isEditor) {
        var h = Math.floor(time / 3600000),
            m = Math.abs(Math.floor((time / 60000) % 60)),
            s = Math.abs(Math.floor((time / 1000) % 60)),
            msd = this.ms[(h > 0) ? 1 : 0],
            ms = Math.abs(Math.floor((time % 1000) / (Math.pow(10, (3 - msd)))));
        if (time < 0) {
            ms -= 1;
            s -= 1;
            m -= 1;
            // Adding += might be a HUGE mistake here,
            // but it seems to solve an issue with seemingly random -1 values...
            h += 1;
        }
        
        // I think msd was supposed to avoid this mess somehow (a value to set to show how much to truicate?)
        if (isEditor === true) {
            humanTime = ((h !== 0) ? h + ':' : '') + this.pad(m, 2) + ':' + this.pad(s, 2) + ((msd) ? '.' + this.pad(ms, msd) : '');
            return humanTime;
        }

        var humanTime;
        if (h === 0 && m === 0) {
            humanTime = this.pad(s, 1) + ((msd) ? '.' + this.pad(ms, msd) : '').slice(0, -1);
        } else if (h === 0 && m < 10) {
            humanTime = ((h !== 0) ? h + ':' : '') + this.pad(m, 1) + ':' + this.pad(s, 2); // + ((msd) ? '.' + this.pad(ms, msd) : '');
        } else {
            humanTime = ((h !== 0) ? h + ':' : '') + this.pad(m, 2) + ':' + this.pad(s, 2); // + ((msd) ? '.' + this.pad(ms, msd) : '');
        }

        if (time >= 0) { // I hate everything about this if statement.
            return humanTime;
        } else if ( time < 0 && h === 0){
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
        var t = performance.now();
        return t;
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

    this.resizeSplitColumn = function () {
        split = document.getElementById("split" + this.currentSplit);
        diff = document.getElementById("difference" + this.currentSplit);

        difflen = diff.clientWidth;
        splitlen = split.clientWidth;

        // Calculate room left for splitname
        // While functional, 
        left = 215 - (difflen + splitlen);
        for (var i = this.totalSplits; i >= 1; i--) {
            document.getElementById("splitname" + i).style.maxWidth = (left - 12) + "px";
            document.getElementById("splitname" + i).style.minWidth = (left - 12) + "px";
        }
    };

    this.padSplits = function () {
        if (this.totalSplits < option.maxSplits) {
            lastSplit = document.getElementById("row" + this.totalSplits);
            for (i = 0; i < (option.maxSplits - this.totalSplits); i++) {
                var container = document.createElement('span');
                container.className = "pad";
                container.innerHTML = '<div>&nbsp;</div>' + '<div></div>' + '<div></div>';
                document.getElementById("splits-table").insertBefore(container, lastSplit);
            }
        }
    };

    this.resizeSplits = function () {
        this.resizeSplitColumn();

        // Get the height of rows which seems to differ slightly by browser for some reason
        // And enforce height to be the exact same as the maxSplits amount
        var rowHeight = (document.getElementById('row1').clientHeight * option.maxSplits) + "px";
        document.getElementById("splits").style.minHeight = rowHeight;
        document.getElementById("splits").style.maxHeight = rowHeight;
        this.padSplits();

        if (this.totalSplits > option.maxSplits) {
            for (var i = this.totalSplits - 1; i >= option.maxSplits; i--) {
                document.getElementById("row" + i).style.display = "none";
            }
        }
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
        this.setState("stop");
    }
}

// Load options to be used for the timer, currently related to styling
var option;
option = new option();

var t;
t = new GameTimer({
    elements: { realtime: 'timer_realtime' },
    interval: 100, // How fast to update (in ms)
    ms: [2, 1]
});

var editor;
editor = new editor();

if (option.useWebsockets === true) {
    var websock;
    websock = new webSocket();
}

// Hotkeys. onkeydown is more responsive than onkeyup
window.onkeydown = function keyPress(e) {
    var k = e.which || e.keyCode;
    if ((k === 80) || (k === 32)) {
        t.pause(); // p or space
    } else if (k === 76) {
        t.split(); // l
    } else if (k === 82) {
        t.reset(); // r
    } else if (k === 69) {
            openEditor();
    }
};

window.onload = function () {
    if (option.useWebsockets === false) {
        document.getElementById("websock-status").style.display = "none";
        document.getElementById("websock-controls").style.display = "none";
    }
    
    t.startSplits();
};

this.openEditor = function () {
    if (t.currently == 'play' || t.currently == 'pause' || t.editorEnabled == true) {
        return false;
    } else {
        t.disableControls = true;
        editor.genEditorSplits();
    }
};

function onUpdateReady() {
    if (window.confirm("WebSplit has been updated. Would you like to refresh to load the new version?")) { 
        Location.reload()
    }
}

window.applicationCache.addEventListener('updateready', onUpdateReady);
if(window.applicationCache.status === window.applicationCache.UPDATEREADY) {
  onUpdateReady();
}

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
