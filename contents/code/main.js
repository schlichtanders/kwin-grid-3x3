///////////////////////
// initialization
///////////////////////

const infoMode = true;
const debugMode = false;
function info(...args) {
    if (infoMode) { console.info("grid-3x3:", ...args); }
}
function debug(...args) {
    if (debugMode) { console.info("grid-3x3:", ...args); }
}
info("initializing");


///////////////////////
// pretty print client properties
///////////////////////

// stringify client object
function properties(client) {
    return JSON.stringify(client, undefined, 2);
}

info(1);

// stringify client caption
function caption(client) {
    return client ? client.caption : client;
}


///////////////////////
// bookkeeping
///////////////////////

var grid_width = 3;
var grid_height = 3;

// init with full grid so that any keypress will reset the grid
var gridsubset_x_begin = 1;
var gridsubset_x_end = grid_width;
var gridsubset_y_begin = 1;
var gridsubset_y_end = grid_height;

var time_previous = 0;
var timediff_max_seconds = 10;

var time_previous_activated = 0;

workspace.clientAdded.connect(onActivated);
workspace.clientActivated.connect(onActivated);

function onActivated(client) {
    if (!client) return;
    info("activated", caption(client));
    time_previous_activated = Date.now();
}


///////////////////////
// logic
///////////////////////

// 7 => {y: 1}, 4 => {y: 2}, 1 => {y: 3}
// in order to have the same y order as the screen (top => down)
let num_to_grid = {
    1: { x: 1, y: 3 },
    2: { x: 2, y: 3 },
    3: { x: 3, y: 3 },
    4: { x: 1, y: 2 },
    5: { x: 2, y: 2 },
    6: { x: 3, y: 2 },
    7: { x: 1, y: 1 },
    8: { x: 2, y: 1 },
    9: { x: 3, y: 1 }
};


function update_grid_subset(x, y) {
    // space based condition
    let is_within_grid = (
        (gridsubset_x_begin <= x) && (x <= gridsubset_x_end)
        && (gridsubset_y_begin <= y) && (y <= gridsubset_y_end)
    );

    // time based condition
    let time_now = Date.now();
    let timediff_seconds = (time_now - time_previous) / 1000;
    time_previous = time_now;
    let is_out_of_time = timediff_seconds > timediff_max_seconds;

    // client switch condition
    let timediff_activated_seconds = (time_now - time_previous_activated) / 1000;
    let new_client_was_activated = timediff_activated_seconds < timediff_max_seconds;
    if (new_client_was_activated) {
        // this will now become the current client and hence we reset the timestamp
        time_previous_activated = 0;
    }

    info("x", x, "y", y, "is_within_grid", is_within_grid, "is_out_of_time", is_out_of_time, "new_client_was_activated", new_client_was_activated)
    debug("gridsubset_x_begin", gridsubset_x_begin)
    debug("gridsubset_x_end", gridsubset_x_end)
    debug("gridsubset_y_begin", gridsubset_y_begin)
    debug("gridsubset_y_end", gridsubset_y_end)

    if (is_within_grid || is_out_of_time || new_client_was_activated) {
        // if the to be added point is already within the current selection,
        // or too much time passed by,
        // or a new clientwindow was put into focus,
        // then reset the current selection to the new point
        gridsubset_x_begin = x;
        gridsubset_x_end = x;
        gridsubset_y_begin = y;
        gridsubset_y_end = y;

    } else {
        // if not, we add the point and everything inbetween to the current selection
        gridsubset_x_begin = Math.min(gridsubset_x_begin, x);
        gridsubset_x_end = Math.max(gridsubset_x_end, x);
        gridsubset_y_begin = Math.min(gridsubset_y_begin, y);
        gridsubset_y_end = Math.max(gridsubset_y_end, y);
    }
}

function get_screen_geometry() {
    return workspace.clientArea(
        KWin.PlacementArea,
        workspace.activeScreen,
        workspace.currentDesktop
    );
}

function new_window_geometry() {
    let screen = get_screen_geometry();

    let x_begin = Math.floor((gridsubset_x_begin - 1) / grid_width * screen.width);
    let x_end = Math.floor(gridsubset_x_end / grid_width * screen.width);
    let y_begin = Math.floor((gridsubset_y_begin - 1) / grid_height * screen.height);
    let y_end = Math.floor(gridsubset_y_end / grid_height * screen.height);

    return {
        x: x_begin,
        y: y_begin,
        width: x_end - x_begin,
        height: y_end - y_begin,
    };
}


///////////////////////
// shortcuts
///////////////////////

function resize_active_client(num) {
    let { x, y } = num_to_grid[num];
    update_grid_subset(x, y);
    workspace.activeClient.frameGeometry = new_window_geometry();
    info("new_window_geometry", workspace.activeClient.frameGeometry);
}

let shortcut_prefix = "grid 3x3 quick tile: ";
for (let num = 1; num <= 9; num++) {
    let result = registerShortcut(
        shortcut_prefix + num,
        shortcut_prefix + num,
        "Meta+Num+" + num,
        function () { resize_active_client(num); }
    );
    info("registering shortcut", num, "result:", result);
}