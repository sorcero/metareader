/* -*- Mode: Javascript; Character-encoding: utf-8; -*- */

/* ###################### metabook/root.js ###################### */

/* Copyright (C) 2009-2015 beingmeta, inc.
   This file implements a Javascript/DHTML web application for reading
   large structured documents (sBooks).

   For more information on sbooks, visit www.sbooks.net
   For more information on knodules, visit www.knodules.net
   For more information about beingmeta, visit www.beingmeta.com

   This library uses the FDJT (www.fdjt.org) toolkit.

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

   Use and redistribution (especially embedding in other
   CC licensed content) is permitted under the terms of the
   Creative Commons "Attribution-NonCommercial" license:

   http://creativecommons.org/licenses/by-nc/3.0/ 

   Other uses may be allowed based on prior agreement with
   beingmeta, inc.  Inquiries can be addressed to:

   licensing@beingmeta.com

   Enjoy!

*/
/* jshint browser: true */

/* Initialize these here, even though they should always be
   initialized before hand.  This will cause various code checkers to
   not generate unbound variable warnings when called on individual
   files. */
//var fdjt=((typeof fdjt !== "undefined")?(fdjt):({}));
//var Knodule=((typeof Knodule !== "undefined")?(Knodule):({}));
//var iScroll=((typeof iScroll !== "undefined")?(iScroll):({}));
//var fdjtMap=fdjt.Map;

var metaBook={
    mode: false,hudup: false,scrolling: false,query: false,
    head: false,target: false,glosstarget: false,location: false,
    root: false,start: false,HUD: false,locsync: false,
    user: false, loggedin: false, cxthelp: false,
    _setup: false,_user_setup: false,_gloss_setup: false,_social_setup: false,
    // Whether we have a real connection to the server
    connected: false,
    // Keeping track of paginated context
    curpage: false,curoff: false,curinfo: false, curbottom: false,
    // For tracking UI state
    last_mode: false, last_heartmode: "about", demo: false,
    // How long it takes a gesture to go from tap to hold
    taptapmsecs: 500, holdmsecs: 250, edgeclick: 50, pagesize: 250,
    dontanimate: false, nativeselect: false,
    // Ignore swipes shorter than this:
    minswipe: 7,
    // Control audio effects
    uisound: false, readsound: false,
    glossmodes: /(addtag)|(addoutlet)|(editdetail)|(hamburger)|(attach)/,
    // Various device properties which can effect behaviors
    fullheight: false, fullwidth: false, handheld: false,
    updatehash: true, iscroll: false,
    // This tracks missing node identifiers
    missing_nodes: [],
    // Whether to cache layouts locally; the value is a threshold
    // (in milliseconds) for when to cache
    cache_layout_thresh: 2500,
    // Ask about updating layouts which took longer than this
    //  many milliseconds to generate
    long_layout_thresh: 5000,
    // Whether to force new layouts
    forcelayout: false,
    // Whether layout is temporarily frozen, for example during text
    // input (on tablets, there may be extraneous resizes when the
    // on-screen keyboard appears)
    freezelayout: false,
    // Whether to locally store user information for offline availability
    persist: false,
    // Whether to locally save glosses, etc for offline availability,
    cacheglosses: false,
    // Which properties of the metaBook object to save
    saveprops: ["sources","outlets","layers","sync","nodeid","state"],
    // Whether to store glosses, etc for offline access and improved
    // performance.  This is no longer used, replaced by the two values
    // above.
    keepdata: false,
    // Dominant interaction mode
    mouse: true, touch: false, kbd: false,
    // Whether there is a keyboard
    keyboard: true,
    // This is a table for iScroll scrollers, when used
    scrollers: {},
    // This is a table for pager objects, by ID and mode
    pagers: {},
    // Restrictions on excerpts
    min_excerpt: 3, max_excerpt: false,
    // These are the UUIDs of locally stored glosses which are queued
    //  to be saved when possible (online and connected).
    queued: [],
    // These are weights assigned to search tags
    tagweights: false, tagmaxweight: 0, tagminweight: 200000000,
    // This is the base URI for this document, also known as the REFURI
    // A document (for instance an anthology or collection) may include
    // several refuri's, but this is the default.
    refuri: false,
    // These are the refuris used in this document
    refuris: [],
    // This is the document URI, which is usually the same as the REFURI.
    docuri: false,
    // This is the unique signed DOC+USER identifier used by myCopy
    // social DRM
    mycopyid: false, 
    // This is the time of the last update
    syncstamp: false,
    // Gloss sync settings (in milleseconds)
    update_interval: 30*1000, // Interval between checks
    update_timeout: 30*1000,    // Timeout on requests
    update_pause: 30*60*1000,   // Interval to sleep on error or timeout
    // State sync settings (in milliseconds):
    sync_interval: 60*1000, // Interval between sync checks
    sync_timeout: 10000,    // Timeout on sync requests
    sync_pause: 15*60*1000, // Interval to sleep on error or timeout
    // Various handlers, settings, and status information for the
    // metaBook interface
    UI: {
        // This maps device types into sets of node->event handlers
        handlers: {mouse: {}, touch: {}, kbd: {}, ios: {}}},
    Debug: {},
    /* This is where HTML source strings for UI components are placed */
    HTML: {},
    /* This is where we store pointers into the DOM, CSS, and TapHold objects */
    DOM: {}, CSS: {}, TapHold: {},
    /* XTARGETS are procedures linked to fragment ids */
    xtargets: {},
    // Where various event timestamps are stored
    Timeline: {},
    // Word/phrase indexing structures
    allterms: [], prefixes: {},
    // These are prefixes or Regexps for URLs which should be opened "in the book"
    //  when they're linked in glosses
    openinbook: ["https://www.youtube.com/"],
    // These are elements, indexed by URL, whose content is being
    // loaded to cache locally
    srcloading: {}, glossdata: {},
    // These are functions to be called when everythings has been loaded
    //  to initialize local references to common metaBook functions
    inits: [],
    default_config: {
        layout: 'bypage',forcelayout: false,
        bodysize: 'normal',bodyfamily: 'serif',
        bodycontrast: 'high', justify: false,
        linespacing: 'normal',
        uisize: 'normal',dyslexical: false,
        animatecontent: true,animatehud: true,
        hidesplash: false,keyboardhelp: true,
        holdmsecs: 150,wandermsecs: 1500,
        syncinterval: 60,glossupdate: 5*60,
        locsync: 15, cacheglosses: true,
        soundeffects: false, buzzeffects: false,
        showconsole: false,
        controlc: false},
    // What to trace, for debugging
    Trace: {
        startup: 0,       // Whether to trace startup
        config: 0,        // Whether to trace config setup/modification/etc
        mode: false,      // Whether to trace mode changes
        nav: false,       // Whether to trace book navigation
        domscan: 0,       // How much to trace initial DOM scanning
        search: 0,        // How much to trace searches
        clouds: 0,        // How much to trace cloud generation
        target: false,    // Whether to trace target changes
        toc: false,       // Whether we're debugging TOC tracking
        storage: 0,       // How much to trace offline persistence
        network: 0,       // How much to trace server interaction
        state: 0,         // Whether to trace state synchronization
        savegloss: 0,     // When glosses are saved to the server
        glosses: 0,       // How much we're tracing gloss processing
        addgloss: 0,      // Note whenever a gloss post completes
        glossdata: 0,     // Whether to trace caching/retrieval of glossdata
        layout: 0,        // How much to trace document layout
        knodules: 0,      // How much to trace knodule processing
        flips: false,     // Whether to trace page flips (movement by pages)
        messages: false,  // Whether to trace inter-window messages
        glossing: false,  // Whether to trace gloss adding or edition
        selection: false, // Whether to trace text selection events
        iscroll: false,   // Whether to trace HUD scrolling with iScroll
        highlight: 0,     // Whether to trace highlighting
        indexing: 0,      // How much to trace document indexing
        gestures: 2}      // How much to trace gestures
};

if (typeof mB === 'undefined') mB=metaBook;

fdjt.DOM.noautofontadjust=true;


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "cd ..; make" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
