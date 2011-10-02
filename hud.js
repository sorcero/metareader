/* -*- Mode: Javascript; Character-encoding: utf-8; -*- */

var codex_hud_id="$Id$";
var codex_hud_version=parseInt("$Revision$".slice(10,-1));

/* Copyright (C) 2009-2011 beingmeta, inc.
   This file implements a Javascript/DHTML UI for reading
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

var CodexMode=
    (function(){
	// The foot HUD
	var sbookHead=false; var head_height=false;
	// The foot HUD
	var sbookFoot=false; var foot_height=false;
	// The HELP HUD, and its margins
	var sbookHelp=false; var help_top=false; var help_bottom=false;
	// The BOX HUD (contains scrollable content) and its margins
	var box_top=false; var box_bottom=false;
	// This is the HUD where all glosses are displayed
	var sbookGlossesHUD=false;
	// This is the HUD for tag searching
	var sbookSearchHUD=false;
	// How long to let messages flash up
	var message_timeout=5000;
	// Whether to call displaySync on mode changes
	var display_sync=false;
	
	var addClass=fdjtDOM.addClass;
	var dropClass=fdjtDOM.dropClass;
	var hasClass=fdjtDOM.hasClass;

	// This will contain the interactive input console (for debugging)
	var input_console;

	function initHUD(){
	    if (fdjtID("CODEXHUD")) return;
	    else {
		Codex.HUD=CodexHUD=fdjtDOM("div#CODEXHUD");
		CodexHUD.codexui=true;
		CodexHUD.innerHTML=sbook_hudtext;
		fdjtDOM.prepend(document.body,fdjtID("HUMANE"),CodexHUD);}
	    // Setup flyleaf
	    var flyleaf=fdjtID("CODEXFLYLEAF");
	    flyleaf.innerHTML=sbook_flyleaftext;
	    // Setup settings
	    var settings=fdjtID("CODEXSETTINGS");
	    settings.innerHTML=sbook_settingstext;
	    // Setup help text
	    var help=fdjtID("CODEXHELP");
	    help.innerHTML=sbook_helptext;
	    // Initialize search UI
	    var search=fdjtID("CODEXSEARCH");
	    search.innerHTML=sbook_searchbox;
	    Codex.empty_cloud=
		new fdjtUI.Completions(fdjtID("CODEXSEARCHCLOUD"));
	    // Setup addgloss prototype
	    var addgloss=fdjtID("CODEXADDGLOSSPROTOTYPE");
	    addgloss.innerHTML=sbook_addgloss;

	    if (Codex.hidehelp) Codex.setConfig("hidehelp");

	    fdjtID("SBOOK_RETURN_TO").value=location.href;

	    // Iniitialize the ABOUT tab
	    

	    // Initialize gloss UI
	    var glosses=fdjtID("CODEXALLGLOSSES");
	    Codex.UI.setupSummaryDiv(glosses);
	    Codex.glosses.addEffect("maker",function(f,p,v){
		Codex.sourcekb.ref(v).oninit
		(Codex.UI.addGlossSource,"newsource");});
	    Codex.glosses.addEffect("sources",function(f,p,v){
		Codex.sourcekb.ref(v).oninit
		(Codex.UI.addGlossSource,"newsource");});

	    function initUI4Item(item){
		if (document.getElementById(item.frag)) {
		    Codex.UI.addToSlice(item,glosses,false);
		    var glossmark=Codex.UI.addGlossmark(item.frag); {
			if (glossmark) {
			    var curglosses=glossmark.glosses;
			    curglosses.push(item._id);}
			if (item.tstamp>Codex.syncstamp)
			    Codex.syncstamp=item.tstamp;
			var pic=((fdjtKB.ref(item.maker)).pic)||
			    ((fdjtKB.ref(item.feed)).pic);
			if (pic) {
			    var img=fdjtDOM.getFirstChild(glossmark,"IMG.big");
			    if (img) img.src=pic;}}
		    if (item.tags) addTag2UI(item.tags,true);}}
	    Codex.glosses.addInit(initUI4Item);

	    function addTag2UI(tag,forsearch){
		if (!(tag)) return;
		else if (tag instanceof Array) {
		    var i=0; var lim=tag.length;
		    while (i<lim) addTag2UI(tag[i++],forsearch||false);
		    return;}
		else if (!(Codex.gloss_cloud)) {
		    var queue=Codex.cloud_queue;
		    if (!(queue)) queue=Codex.cloud_queue=[];
		    queue.push(tag);
		    if (forsearch) {
			var squeue=Codex.search_cloud_queue;
			if (!(squeue)) squeue=Codex.search_cloud_queue=[];
			squeue.push(tag);}}
		else {
		    var gloss_cloud=Codex.glossCloud();
		    var search_cloud=Codex.fullCloud();
		    var gloss_tag=gloss_cloud.getByValue(tag,".completion");
		    if (!((gloss_tag)&&(gloss_tag.length))) {
			if (!((typeof tag === 'string')&&
			      (!(Codex.knodule.probe(tag))))) {
			    gloss_tag=Knodule.HTML(tag,Codex.knodule,false,true);
			    fdjtDOM(fdjtID("CODEXGLOSSTAGS"),gloss_tag," ");
			    gloss_cloud.addCompletion(gloss_tag);}}
		    var search_tag=
			((forsearch)&&
			 (search_cloud.getByValue(tag,".completion")));
		    if ((forsearch)&&(!((search_tag)&&(search_tag.length)))) {
			search_tag=Knodule.HTML(tag,Codex.knodule,false,true);
			fdjtDOM(fdjtID("CODEXSEARCHTAGS"),search_tag," ");
			search_cloud.addCompletion(search_tag);}}}
	    Codex.addTag2UI=addTag2UI;
	    
	    var console=fdjtID("CODEXCONSOLE");
	    input_console=fdjtDOM.getChild(console,"TEXTAREA");
	    input_button=fdjtDOM.getChild(console,"span.button");
	    input_button.onclick=consolebutton_click;
	    input_console.onkeypress=consoleinput_keypress;

	    sbookFoot=fdjtID("CODEXFOOT");
	    sbookHead=fdjtID("CODEXHEAD");
	    sbookHelp=fdjtID("CODEXHELP");
	    fillinFlyleaf();
	    resizeHUD();
	    Codex.scrollers={};
	    // updateScroller("CODEXGLOSSCLOUD");
	    updateScroller("CODEXSEARCHCLOUD");}
	Codex.initHUD=initHUD;
	
	function fixStaticRefs(string){
	  if (Codex.graphics==="http://static.beingmeta.com/graphics/")
	    return string;
	  else return string.replace
		 (/http:\/\/static.beingmeta.com\/graphics\//g,
		  Codex.graphics);}

	function resizeHUD(){
	    var vh=fdjtDOM.viewHeight();
	    var vw=fdjtDOM.viewWidth();
	    var hf=fdjtID("CODEXFOOT");
	    var fh=fdjtDOM.getGeometry(hf).height;
	    // fdjtLog("resizeHUD vh=%o vw=%o fh=%o",vh,vw,fh);
	    if (!(Codex.nativescroll)) hf.style.top=(vh-fh)+'px';}

	/* This is used for viewport-based browser, where the HUD moves
	   to be aligned with the viewport */
	
	var sbook_sync_off=false;
	var sbook_sync_height=false;
	
	function getBounds(elt){
	    var style=fdjtDOM.getStyle(elt);
	    return { top: fdjtDOM.parsePX(style.marginTop)||0+
		     fdjtDOM.parsePX(style.borderTop)||0+
		     fdjtDOM.parsePX(style.paddingTop)||0,
		     bottom: fdjtDOM.parsePX(style.marginBottom)||0+
		     fdjtDOM.parsePX(style.borderBottom)||0+
		     fdjtDOM.parsePX(style.paddingBottom)||0};}
	fdjtDOM.getBounds=getBounds;
	
	/* Creating the HUD */
	
	function setupTOC(root_info){
	    var navhud=createNavHUD("div#CODEXTOC.hudpanel",root_info);
	    var toc_button=fdjtID("CODEXTOCBUTTON");
	    toc_button.style.visibility='';
	    Codex.TOC=navhud;
	    fdjtDOM.replace("CODEXTOC",navhud);
	    var flytoc=createStaticTOC("div#CODEXFLYTOC",root_info);
	    Codex.Flytoc=flytoc;
	    fdjtDOM(fdjtID("FLYTOC"),flytoc);}
	Codex.setupTOC=setupTOC;

	function createNavHUD(eltspec,root_info){
	    var toc_div=CodexTOC(root_info,0,false,"CODEXTOC4",
				 ((root_info.sub.length>1)));
	    var div=fdjtDOM(eltspec||"div#CODEXTOC.hudpanel",toc_div);
	    Codex.UI.addHandlers(div,"toc");
	    return div;}

	function createStaticTOC(eltspec,root_info){
	    var toc_div=CodexTOC(root_info,0,false,"CODEXFLYTOC4");
	    var div=fdjtDOM(eltspec||"div#CODEXFLYTOC",toc_div);
	    Codex.UI.addHandlers(div,"toc");
	    return div;}

	/* HUD animation */

	function setHUD(flag,clearmode){
	    if (typeof clearmode === 'undefined') clearmode=true;
	    // clearmode=((Codex.mode!=='scanning')&&(Codex.mode!=='tocscan'));
	    if (Codex.Trace.gestures)
		fdjtLog("setHUD %o mode=%o hudup=%o bc=%o hc=%o",
			flag,Codex.mode,Codex.hudup,
			document.body.className,
			CodexHUD.className);
	    if (flag) {
		Codex.hudup=true;
		addClass(document.body,"hudup");}
	    else {
		Codex.hudup=false;
		Codex.scrolling=false;
		if (clearmode) {
		    var wait=false;
		    dropClass(CodexHUD,"flyleaf");
		    dropClass(CodexHUD,"full");
		    dropClass(CodexHUD,CodexMode_pat);
		    Codex.mode=false;}
		dropClass(document.body,"hudup");}}
	Codex.setHUD=setHUD;

	/* Mode controls */
	
	var CodexMode_pat=/\b((device)|(sbookapp)|(help)|(scanning)|(tocscan)|(search)|(searchresults)|(toc)|(glosses)|(allglosses)|(context)|(flytoc)|(about)|(console)|(minimal)|(addgloss)|(editexcerpt)|(gotoloc)|(gotopage))\b/g;
	var codexflyleafMode_pat=/\b((device)|(sbookapp)|(flytoc)|(allglosses)|(about)|(console))\b/g;
	var sbook_mode_scrollers=
	    {allglosses: "CODEXALLGLOSSES",
	     searchresults: "CODEXSEARCHRESULTS",
	     search: "CODEXSEARCHCLOUD",
	     // addgloss: "CODEXGLOSSCLOUD",
	     console: "CODEXCONSOLE",
	     sbookapp: "MANAGEAPP",
	     flytoc: "CODEXFLYTOC",
	     about: "APPABOUT"};
	var sbook_mode_foci=
	    {gotopage: "CODEXPAGEINPUT",
	     gotoloc: "CODEXLOCINPUT",
	     search: "CODEXSEARCHINPUT",
	     addgloss: "CODEXGLOSSINPUT"};
	
	var sbook_mode_help={
	    addgloss: "#CODEXADDGLOSSHELP",
	    toc: "#CODEXTOCHELP",
	    tocscan: "#CODEXTOCSCANHELP",
	    scanning: "#CODEXSCANNINGHELP"};

	function CodexMode(mode){
	    var oldmode=Codex.mode;
	    if (typeof mode === 'undefined') return oldmode;
	    if (mode==='last') mode=Codex.last_mode||'help';
	    if (mode==='none') mode=false;
	    if (Codex.Trace.mode)
		fdjtLog("CodexMode %o, cur=%o dbc=%o",
			mode,Codex.mode,document.body.className);
	    if ((Codex.mode==='help')&&(!(mode))) mode=Codex.last_mode;
	    if (mode) {
		if (mode!=="scanning") Codex.scanning=false;
		if ((mode==="scanning")||(mode==="tocscan"))
		    addClass(document.body,"sbookscanning");
		else dropClass(document.body,"sbookscanning");
		if (mode===Codex.mode) {}
		else if (mode===true) {
		    /* True just puts up the HUD with no mode info */
		    if (sbook_mode_foci[Codex.mode]) {
			var input=fdjtID(sbook_mode_foci[Codex.mode]);
			input.blur();}
		    Codex.mode=false;
		    Codex.last_mode=true;}
		else if (typeof mode !== 'string') 
		    throw new Error('mode arg not a string');
		else {
		    if (sbook_mode_foci[Codex.mode]) {
			var input=fdjtID(sbook_mode_foci[Codex.mode]);
			input.blur();}
		    if (sbook_mode_help[mode])
			fdjtLog.Humane(sbook_mode_help[mode]);
		    Codex.mode=mode;
		    if (Codex.mode!=='help') Codex.last_mode=Codex.mode;}
		// If we're switching to the inner app but the iframe
		//  hasn't been initialized, we do it now.
		if ((mode==="sbookapp")&&(!(fdjtID("MANAGEAPP").src)))
		    sbookSetupFlyleaf();
		// Update Codex.scrolling which is the scrolling
		// element in the HUD for this mode
		if (!(typeof mode === 'string'))
		    Codex.scrolling=false;
		else if (sbook_mode_scrollers[mode]) 
		    Codex.scrolling=(sbook_mode_scrollers[mode]);
		else Codex.scrolling=false;
		// Actually change the class on the HUD object
		if (mode===true) {
		    fdjtDOM.swapClass(CodexHUD,CodexMode_pat,"minimal");
		    dropClass(CodexHUD,"flyleaf");}
		else {
		    if (mode.search(codexflyleafMode_pat)<0)
			dropClass(CodexHUD,"flyleaf");
		    fdjtDOM.swapClass(CodexHUD,CodexMode_pat,mode);}
		// Update the body scanning mode
		if ((mode==="scanning")||(mode==="tocscan"))
		    addClass(document.body,"sbookscanning");
		else dropClass(document.body,"sbookscanning");
		// Update the 'flyleaf' meta mode
		if ((mode)&&(typeof mode === 'string')) {
		    if (mode.search(codexflyleafMode_pat)===0)
			addClass(CodexHUD,"flyleaf");
		    else dropClass(CodexHUD,"flyleaf");
		    fdjtID("CODEXBUTTON").className=mode;}
		// Help mode (on the hud) actually dims the body
		if (mode==="help")
		    addClass(document.body,"dimmed");
		else dropClass(document.body,"dimmed");
		// Scanning is a funny mode in that the HUD is down
		//  for it.  We handle all of this stuff here.
		if ((mode==='scanning')||(mode==='tocscan')) {
		    if (mode!==oldmode) {
			Codex.hudup=false;
			dropClass(CodexHUD,"flyleaf");
			dropClass(CodexHUD,"full");
			dropClass(document.body,"hudup");}}
		// And if we're not scanning, we just raise the hud
		else setHUD(true);
		// This updates scroller dimensions, we delay it
		//  because apparently, on some browsers, the DOM
		//  needs to catch up with CSS
		if (Codex.scrolling) {
		  var scroller=fdjtID(Codex.scrolling);
		  setTimeout(function(){updateScroller(scroller);},
			     100);}
		// If we're scanning all glosses, we sync the glosses
		//  with the current book location.
		if ((mode==="allglosses")&&
		    (Codex.curinfo)&&(Codex.curinfo.first)) {
		    Codex.UI.scrollGlosses(
			Codex.curinfo.first,fdjtID("CODEXALLGLOSSES"));}
		// We autofocus any input element appropriate to the
		// mode
		if (sbook_mode_foci[mode]) {
		  var input=fdjtID(sbook_mode_foci[mode]);
		  if (input) input.focus();}
		// Moving the focus back to the body lets keys work
		else document.body.focus();
		if (display_sync) Codex.displaySync();}
	    else {
		// Clearing the mode is a lot simpler, in part because
		//  setHUD clears most of the classes when it brings
		//  the HUD down.
		if (Codex.mode!=='help') Codex.last_mode=Codex.mode;
		document.body.focus();
		dropClass(document.body,"dimmed");
		dropClass(document.body,"sbookscanning");
		setHUD(false);
		if (display_sync) Codex.displaySync();}}

	function fadeUpHUD(){
	    fdjtLog("Setting properties");
	    CodexHUD.style.opacity=0.001;
	    setTimeout(function(){
		fdjtLog("Changing opacity");
		CodexHUD.style.opacity=1.00;
		setTimeout(function(){
		    fdjtLog("Clearing setup");
		    CodexHUD.style.opacity='';},
			   1500);},
		       1500);}
	Codex.fadeUpHUD=fadeUpHUD;

	function updateScroller(elt){
	    if (typeof elt === 'string') elt=fdjtID(elt);
	    var c=elt.parentNode; var cc=c.parentNode;
	    // Remove all constraint
	    c.style.height=''; c.style.overflow='visible';
	    // Compute bounds to get height
	    var cstyle=fdjtDOM.getStyle(c);
	    var ccstyle=fdjtDOM.getStyle(cc);
	    var cbounds=
		fdjtDOM.parsePX(cstyle.borderTopWidth)+
		fdjtDOM.parsePX(cstyle.borderBottomWidth)+
		fdjtDOM.parsePX(cstyle.paddingTop)+
		fdjtDOM.parsePX(cstyle.paddingBottom)+
		fdjtDOM.parsePX(cstyle.marginTop)+
		fdjtDOM.parsePX(cstyle.marginBottom);
	    var ccbounds=
		fdjtDOM.parsePX(ccstyle.borderTopWidth)+
		fdjtDOM.parsePX(ccstyle.borderBottomWidth)+
		fdjtDOM.parsePX(ccstyle.paddingTop)+
		fdjtDOM.parsePX(ccstyle.paddingBottom)+
		fdjtDOM.parsePX(ccstyle.marginTop)+
		fdjtDOM.parsePX(ccstyle.marginBottom);
	    if (Codex.scrolldivs) {
		c.style.height=
		    ((cc.offsetHeight-(ccbounds+cbounds))-c.offsetTop)+'px';
	    	c.style.overflow='';}
	    else {
		if ((!(Codex.scrollers))||(!(elt.id))) return;
		if (Codex.Trace.scroll) {
		    fdjtLog("cco=%o ct=%o nh=%o",
			    cc.offsetHeight,c.offsetTop,
			    cc.offsetHeight-c.offsetTop);}
		c.style.height=
		    ((cc.offsetHeight-(ccbounds+cbounds))-c.offsetTop)+'px';
		c.style.overflow='hidden';
		if ((Codex.scrollers[elt.id])&&
		    (Codex.scrollers[elt.id].element===elt))
		    Codex.scrollers[elt.id].refresh();
		else Codex.scrollers[elt.id]=new iScroll(elt);}
	    if (Codex.Trace.scroll) {
		fdjtLog("updateScroller %o %o %o ch=%o h=%o",
			elt,c,cc,cc.offsetHeight-c.offsetTop,elt.offsetHeight);
		fdjtLog("updateScroller e=%o,c=%o,cc=%o",
			fdjtDOM.getStyle(elt).overflow,
			fdjtDOM.getStyle(c).overflow,
			fdjtDOM.getStyle(cc).overflow);
		if ((!(Codex.nativescroll))&&
		    (elt.id)&&(Codex.scrollers)&&
		    (Codex.scrollers[elt.id])) {
		    var scroller=Codex.scrollers[elt.id];
		    fdjtLog("e=%o w=%o wo=%o,%o wc=%o,%o i=%o,%o o=%o,%o d=%o,%o m=%o,%o",
			    scroller.element,scroller.wrapper,
			    scroller.wrapper.offsetWidth,
			    scroller.wrapper.offsetHeight,
			    scroller.wrapper.clientWidth,
			    scroller.wrapper.clientHeight,
			    elt.offsetWidth,elt.offsetHeight,
			    scroller.scrollerWidth,scroller.scrollerHeight,
			    scroller.scrollWidth,scroller.scrollHeight,
			    scroller.maxScrollX,scroller.maxScrollY);}}}
	Codex.UI.updateScroller=updateScroller;

	function CodexHUDToggle(mode,keephud){
	    if (!(Codex.mode)) CodexMode(mode);
	    else if (mode===Codex.mode)
		if (keephud) CodexMode(true); else CodexMode(false);
	    else if ((mode==='flyleaf')&&
		     (Codex.mode.search(codexflyleafMode_pat)===0))
		if (keephud) CodexMode(true); else CodexMode(false);
	    else CodexMode(mode);}
	CodexMode.toggle=CodexHUDToggle;

	Codex.dropHUD=function(){return CodexMode(false);}
	Codex.toggleHUD=function(evt){
	    evt=evt||event;
	    if ((evt)&&(fdjtUI.isClickable(fdjtUI.T(evt)))) return;
	    fdjtLog("toggle HUD %o hudup=%o",evt,Codex.hudup);
	    if (Codex.hudup) setHUD(false,false);
	    else setHUD(true);};
	
	/* The App HUD */
	
	function fillinFlyleaf(){
	    var hidehelp=fdjtID("SBOOKHIDEHELP");
	    var dohidehelp=fdjtState.getCookie("sbookhidehelp");
	    if (!(hidehelp)) {}
	    else if (dohidehelp==='no') hidehelp.checked=false;
	    else if (dohidehelp) hidehelp.checked=true;
	    else hidehelp.checked=false;
	    if (hidehelp)
		hidehelp.onchange=function(evt){
		    if (hidehelp.checked)
			fdjtState.setCookie("sbookhidehelp",true,false,"/");
		    else fdjtState.setCookie("sbookhidehelp","no",false,"/");};
	    var refuris=document.getElementsByName("REFURI");
	    if (refuris) {
		var i=0; var len=refuris.length;
		while (i<len)
		    if (refuris[i].value==='fillin')
			refuris[i++].value=Codex.refuri;
		else i++;}
	    fillinAboutInfo();
	    /* Get various external APPLINK uris */
	    var offlineuri=fdjtDOM.getLink("codex.offline")||altLink("offline");
	    var epuburi=fdjtDOM.getLink("codex.epub")||altLink("ebub");
	    var mobiuri=fdjtDOM.getLink("codex.mobi")||altLink("mobi");
	    var zipuri=fdjtDOM.getLink("codex.mobi")||altLink("mobi");
	    if (offlineuri) {
		var elts=document.getElementsByName("SBOOKOFFLINELINK");
		var i=0; while (i<elts.length) {
		    var elt=elts[i++];
		    if (offlineuri!=='none') elt.href=offlineuri;
		    else {
			elt.href=false;
			addClass(elt,"deadlink");
			elt.title='this sBook is not available offline';}}}
	    if (epuburi) {
		var elts=document.getElementsByName("SBOOKEPUBLINK");
		var i=0; while (i<elts.length) {
		    var elt=elts[i++];
		    if (epuburi!=='none') elt.href=epuburi;
		    else {
			elt.href=false;
			addClass(elt,"deadlink");
			elt.title='this sBook is not available as an ePub';}}}
	    if (mobiuri) {
		var elts=document.getElementsByName("SBOOKMOBILINK");
		var i=0; while (i<elts.length) {
		    var elt=elts[i++];
		    if (mobiuri!=='none') elt.href=mobiuri;
		    else {
			elt.href=false;
			addClass(elt,"deadlink");
			elt.title='this sBook is not available as a MOBIpocket format eBook';}}}
	    if (zipuri) {
		var elts=document.getElementsByName("SBOOKZIPLINK");
		var i=0; while (i<elts.length) {
		    var elt=elts[i++];
		    if (zipuri!=='none') elt.href=zipuri;
		    else {
			elt.href=false;
			addClass(elt,"deadlink");
			elt.title='this sBook is not available as a ZIP bundle';}}}
	    initManageIFrame();
	    /* If the book is offline, don't bother showing the link to the offline
	       version. */
	    if (Codex.offline) addClass(document.body,"sbookoffline");}

	function altLink(type,uri){
	    uri=uri||Codex.refuri;
	    if (uri.search("http://")===0)
		return "http://offline."+uri.slice(7);
	    else if (uri.search("https://")===0)
		return "https://offline."+uri.slice(8);
	    else return false;}

	function _sbookFillTemplate(template,spec,content){
	    if (!(content)) return;
	    var elt=fdjtDOM.$(spec,template);
	    if ((elt)&&(elt.length>0)) elt=elt[0];
	    else return;
	    if (typeof content === 'string')
	      elt.innerHTML=content;
	    else if (content.cloneNode)
		fdjtDOM.replace(elt,content.cloneNode(true));
	    else fdjtDOM(elt,content);}

	function fillinAboutInfo(){
	    var about=fdjtID("APPABOUT");
	    var bookabout=fdjtID("SBOOKABOUTPAGE");
	    var authorabout=fdjtID("SBOOKAUTHORPAGE");
	    if (bookabout) fdjtDOM(about,bookabout);
	    else {
		var title=
		    fdjtID("SBOOKTITLE")||
		    fdjtDOM.getMeta("codex.title")||
		    fdjtDOM.getMeta("TITLE")||
		    fdjtDOM.getMeta("DC.title")||
		    document.title;
		var byline=
		    fdjtID("SBOOKBYLINE")||fdjtID("SBOOKAUTHOR")||
		    fdjtDOM.getMeta("codex.byline")||fdjtDOM.getMeta("BYLINE")||
		    fdjtDOM.getMeta("codex.author")||fdjtDOM.getMeta("AUTHOR");
		var copyright=
		    fdjtID("SBOOKCOPYRIGHT")||
		    fdjtDOM.getMeta("codex.copyright")||fdjtDOM.getMeta("COPYRIGHT")||
		    fdjtDOM.getMeta("RIGHTS");
		var publisher=
		    fdjtID("SBOOKPUBLISHER")||
		    fdjtDOM.getMeta("codex.publisher")||
		    fdjtDOM.getMeta("PUBLISHER");
		var description=
		    fdjtID("SBOOKDESCRIPTION")||
		    fdjtDOM.getMeta("codex.description")||
		    fdjtDOM.getMeta("DESCRIPTION");
		var digitized=
		    fdjtID("SBOOKDIGITIZED")||
		    fdjtDOM.getMeta("codex.digitized")||
		    fdjtDOM.getMeta("DIGITIZED");
		var sbookified=fdjtID("SBOOKIFIED")||fdjtDOM.getMeta("SBOOKIFIED");
		_sbookFillTemplate(about,".title",title);
		_sbookFillTemplate(about,".byline",byline);
		_sbookFillTemplate(about,".publisher",publisher);
		_sbookFillTemplate(about,".copyright",copyright);
		_sbookFillTemplate(about,".description",description);
		_sbookFillTemplate(about,".digitized",digitized);
		_sbookFillTemplate(about,".sbookified",sbookified);
		_sbookFillTemplate(about,".about",fdjtID("SBOOKABOUT"));
		var cover=fdjtDOM.getLink("cover");
		if (cover) {
		    var cover_elt=fdjtDOM.$(".cover",about)[0];
		    if (cover_elt) fdjtDOM(cover_elt,fdjtDOM.Image(cover));}}
	    if (authorabout) fdjtDOM(about,authorabout);}

	function initManageIFrame(){
	    var query=document.location.search||"?";
	    var refuri=Codex.refuri;
	    var appuri="https://"+Codex.server+"/flyleaf"+query;
	    if (query.search("REFURI=")<0)
		appuri=appuri+"&REFURI="+encodeURIComponent(refuri);
	    if (query.search("TOPURI=")<0)
		appuri=appuri+"&TOPURI="+
		encodeURIComponent(document.location.href);
	    if (document.title) {
		appuri=appuri+"&DOCTITLE="+encodeURIComponent(document.title);}
	    fdjtID("MANAGEAPP").src=appuri;}

	CodexMode.selectApp=function(){
	    /* initManageIFrame(); */
	    if (Codex.mode==='sbookapp') CodexMode(false);
	    else CodexMode('sbookapp');}

	/* Scanning */

	function CodexScan(elt,src){
	    var cxt=false;
	    var body=document.body;
	    var pelt=Codex.scanning;
	    if (Codex.Trace.mode)
		fdjtLog("CodexScan() %o (src=%o) mode=%o scn=%o/%o",
			elt,src,Codex.mode,Codex.scanning,Codex.target);
	    // Save the source HUD element for the preview (when provided)
	    if (Codex.scanning!==src) {
		var clone=src.cloneNode(true);
		clone.id="CODEXSCAN";
		fdjtDOM.replace("CODEXSCAN",clone);
		if (Codex.nextSlice(src))
		    dropClass("CODEXHUD","scanend");
		else addClass("CODEXHUD","scanend");
		if (Codex.prevSlice(src))
		    dropClass("CODEXHUD","scanstart");
		else addClass("CODEXHUD","scanstart");
		Codex.scanning=src;}
	    else {}
	    Codex.setTarget(elt);
	    Codex.GoTo(elt);
	    CodexMode("scanning");}
	Codex.Scan=CodexScan;

	Codex.addConfig("uisize",function(name,value){
	    fdjtDOM.swapClass(CodexHUD,/codexuifont\w+/,"codexuifont"+value);});
	Codex.addConfig("showconsole",function(name,value){
	    if (value) addClass(CodexHUD,"codexshowconsole");
	    else dropClass(CodexHUD,"codexshowconsole");});
	Codex.addConfig("animatepages",function(name,value){
	    if (value) addClass(Codex.page,"codexanimate");
	    else dropClass(Codex.page,"codexanimate");});
	Codex.addConfig("animatehud",function(name,value){
	    if (value) addClass(Codex.HUD,"codexanimate");
	    else dropClass(Codex.HUD,"codexanimate");});

	/* Settings apply/save handlers */

	function getSettings(){
	    var result={};
	    var settings=fdjtID("CODEXSETTINGS");
	    var pageview=fdjtDOM.getInputValues(settings,"CODEXPAGEVIEW");
	    result.pageview=
		((pageview)&&(pageview.length)&&(true))||false;
	    var bodysize=fdjtDOM.getInputValues(settings,"CODEXBODYSIZE");
	    if ((bodysize)&&(bodysize.length))
		result.bodysize=bodysize[0];
	    var bodystyle=fdjtDOM.getInputValues(settings,"CODEXBODYSTYLE");
	    if ((bodystyle)&&(bodystyle.length))
		result.bodystyle=bodystyle[0];
	    var uisize=fdjtDOM.getInputValues(settings,"CODEXUISIZE");
	    if ((uisize)&&(uisize.length))
		result.uisize=uisize[0];
	    var hidesplash=fdjtDOM.getInputValues(settings,"CODEXHIDESPLASH");
	    result.hidesplash=
		((hidesplash)&&(hidesplash.length)&&(true))||false;
	    var showconsole=fdjtDOM.getInputValues(settings,"CODEXSHOWCONSOLE");
	    result.showconsole=
		((showconsole)&&(showconsole.length)&&(true))||false;
	    return result;}

	Codex.UI.applySettings=function(){
	  Codex.setConfig(getSettings());};
	Codex.UI.saveSettings=function(){
	  Codex.saveConfig(getSettings());};
	
	/* Console methods */
	function console_eval(){
	    fdjtLog("Executing %s",input_console.value);
	    var result=eval(input_console.value);
	    var string_result=
		((result.nodeType)?
		 (fdjtString("%o",result)):
		 (fdjtString("%j",result)));
	    fdjtLog("Result is %s",string_result);}
	function consolebutton_click(evt){console_eval();}
	function consoleinput_keypress(evt){
	    evt=evt||event;
	    var target=fdjtUI.T(evt);
	    if (evt.keyCode===13) {
		if (!(evt.ctrlKey)) {
		    fdjtUI.cancel(evt);
		    console_eval();
		    if (evt.shiftKey) input_console.value="";}}}

	/* Button methods */

	function LoginButton_ontap(evt){
	    evt=evt||event||null;
	    if (Codex.mode==="sbookapp") CodexMode(false);
	    else CodexMode("sbookapp");
	    evt.cancelBubble=true;}

	return CodexMode;})();

fdjt_versions.decl("codex",codex_hud_version);
fdjt_versions.decl("codex/hud",codex_hud_version);

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "cd ..; make" ***
   ;;;  End: ***
*/
