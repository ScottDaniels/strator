/*
* vim: set noet ts=4 sw=4 background=dark nocindent fileformats=unix :
*
* ================================================================================================
* (c) Copyright 2012-2016 By E. Scott Daniels. All rights reserved.
*
* Redistribution and use in source and binary forms, with or without modification, are
* permitted provided that the following conditions are met:
*
* 1. Redistributions of source code must retain the above copyright notice, this list of
* conditions and the following disclaimer.
*
* 2. Redistributions in binary form must reproduce the above copyright notice, this list
* of conditions and the following disclaimer in the documentation and/or other materials
* provided with the distribution.
*
* THIS SOFTWARE IS PROVIDED BY E. Scott Daniels AS IS'' AND ANY EXPRESS OR IMPLIED
* WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
* FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL E. Scott Daniels OR
* CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
* CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
* ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
* NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
* ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
* The views and conclusions contained in the software and documentation are those of the
* authors and should not be interpreted as representing official policies, either expressed
* or implied, of E. Scott Daniels.
* ================================================================================================
*/
 /*
 ----------------------------------------------------------------------------------------------
 Mnemonic:	strator.js
 Abstract: 	An HTML-5 canvas scribbling programme which allows users to connect to 
			  a central repeater and share their scribblings in real time with minimal
			  network traffic. 
 
 Requires:
				strator_coterie.js  
				strator_doctools.js  
				strator_lings.js  
				strator_popup.js  
				strator_session.js  
				symtab.js  
				tools.js

 Author:		E. Scott Daniels
 Date:		22 Nov 2012
 ----------------------------------------------------------------------------------------------
 */

var strator = strator || {};			/* don't depend on order that html includes us */


/*
	TODO: 
		X make it obvious when we lose the session; reconnect automatically?
		X rotaion of all lings (except circle)
		X rotation of text from edit box
		X updating rotation on all user's slates
		X fix issue with dragging to select text in edit field
		X password protection or limited membership on group
		  notification of join/leave of group
		X raise/lower needs to send change to others in group
		X filled box outline
		X filled box transparency??	
		X edit boxes (rotation, fill, outline)
		X scribble lines. 
		  arrows
		  multipoint lines
		X load
		X save
		X Postscript export
		  Encapsulated postscript export
		X New pop-up scheme doesn't clear/repaint window on connect/group change etc. 
		X scribbling groups 
*/


strator.version = "v1.1/11193";

strator.PU_NONE = "";			/* popup types -- names of the outer divs that are initially hidden */
strator.PU_TXTEDIT = "textedit-popup";	
strator.PU_SOLIDEDIT = "solidedit-popup";	
strator.PU_CONF = "conf-popup";		
strator.PU_COLOUR = "colour-popup";		
strator.PU_CTL = "ctl-popup";		
strator.PU_FILE = "file-popup";		

/* document 'items' we must reference */

strator.DOC_SLATE = "main-slate";
strator.DOC_SLATE_DIV = "slate-div";
strator.DOC_CONN_STATE = "conn-state";						/* shows conn state at top */

strator.DOC_FILL = "fill-radio";							/* colour popup */
strator.DOC_OUTLINE = "outline-radio";
strator.DOC_FILLOUT = "fillout-radio";

strator.DOC_EDIT_TEXT = "newtext-edit";						/* text edit popup things */
strator.DOC_EDIT_TXTROT = "txtrotation-edit";
strator.DOC_EDIT_TXTSIZE = "txtsize-edit";
strator.DOC_EDIT_TXTSIZVAL = "txtsize-value-edit";
strator.DOC_EDIT_ACCEPT = "accept-edit";
strator.DOC_EDIT_CANCEL = "cancel-edit";

strator.DOC_DISCONN_CONN = "disconn-conn";					/* connection popup buttons */
strator.DOC_UPDATE_CONN = "update-conn";
strator.DOC_APPLY_CONN = "apply-conn";
strator.DOC_RESCALE_CONN = "rescale-conn";
strator.DOC_CANVSIZE_CONN = "canvscale-conn";
strator.DOC_RECONN_CONN = "reconn-conn";
strator.DOC_CANCEL_CONN = "cancel-conn";
strator.DOC_GMEMBERS = "gmembers-conn";						/* connection popup fields: members of the group this user belongs to */
strator.DOC_GROUPS = "groups-conn";							/* known groups */
strator.DOC_UGROUP = "group-conn";							/* current group user has joined */
strator.DOC_HOST = "host-conn";								/* host;port connected to */
strator.DOC_USER = "user-conn";								/* user name */

strator.DOC_SEDIT_FILL = "fill-soledit-radio";				/* solid edit things -- radio buttons for outline/fill combinations */
strator.DOC_SEDIT_OUTLINE = "outline-soledit-radio";
strator.DOC_SEDIT_FILLOUT = "fillout-soledit-radio";
strator.DOC_SEDIT_ROT = "rotation-soledit";					/* text entry */
strator.DOC_SEDIT_STARTD = "circstart-soledit";
strator.DOC_SEDIT_ENDD = "circend-soledit";
strator.DOC_SEDIT_OPAC = "opac-soledit";					/* slider */
strator.DOC_SEDIT_OPACVAL = "opacval-soledit";				/* current value based on slider */
strator.DOC_SEDIT_ACCEPT = "accept-soledit";				/* buttons */
strator.DOC_SEDIT_CANCEL = "cancel-soledit";
strator.DOC_SEDIT_ROTDIV = "rotdiv-splidedit";				/* divisions hidden dependening on type */
strator.DOC_SEDIT_CIRCDIV = "circdiv-splidedit";
strator.DOC_SEDIT_PAINTDIV = "paintdiv-splidedit";

strator.DOC_CTL_DEFTXTSIZE = "def-tsize-slider";
strator.DOC_CTL_TSIZE = "def-tsize-value";

strator.DOC_STATE_FILL = "fill-state"
strator.DOC_STATE_OUTLINE = "outline-state"

strator.NONE = 0;					/* action modes and scribbling types */
strator.BOX = 1;
strator.LINE = 2;
strator.DELETE = 3;
strator.MOVE = 4;
strator.RECOLOUR = 5;
strator.COPY = 6;
strator.CIRCLE = 7;
strator.TEXT = 8;
strator.EDIT = 9;
strator.RAISE = 10;
strator.LOWER = 11;
strator.ROTATE = 12;
strator.OVAL = 13;
strator.SCRIBBLE = 14;
strator.ERASE = 15;
strator.GROUP = 16;

strator.MUP	= 0;					/* mouse state */
strator.MDOWN = 1;

strator.bounding_box = {
	mk:  function( x1, y1, x2, y2 )
	{
		no = Object.create( strator.bounding_box );
		no.ulx = x1 > x2 ? x2 : x1;
		no.uly = y1 > y2 ? y2 : y1;
		no.h = Math.abs( y1 - y2 );
		no.w = Math.abs( x1 - x2 );

		return no;
	},

	/*
		return true if the point (px,py) is in the box; if rotation is not 0, compute the point rotated 
		'back' to normal (-rot) round rx,ry and then check the point in the box.  (rx,ry is the
		point round which the ling has been rotated.) 
	*/
	inside: function( px, py, rot, rx, ry )
	{
		var pt;

		if( rot != null && rot != 0 )
		{
			pt = tools.rotate_pt( px, py, rx, ry, -rot );
			px = pt[0];
			py = pt[1];		/* test with the rotated point */ 			
		}

		return px >= this.ulx   &&  px <= (this.ulx + this.w)  &&  py >= this.uly  &&  py <= (this.uly + this.h);
	}
}

/*
	Create the url for the scribble based on the spot that served up this page.
	http://stackoverflow.com/questions/10406930/how-to-construct-a-websocket-uri-relative-to-the-page-uri
*/
function Scribble_url( port ) {
    var l = window.location;
    return ((l.protocol === "https:") ? "wss://" : "ws://") + l.hostname + ":" + port;
}

/* --------------------------- main stuff and driver -------------------------- */

strator.driver = {
	mk:	function( scribble_r_port, user )
	{
		var o;						/* generic object reference */
		var no;						/* new object */
		var i;
		var co;
		var	h;
		var w;
	
		no = Object.create( strator.driver );				/* bulid new object, then initialise */
		no.st_x = 0;											/* pt at start of operation */
		no.st_y = 0;
		no.dmodel = strator.BOX;								/* mode selected for left mouse button (action, drawing type etc.) */
		no.dmoder = strator.ERASE;								/* mode selected for right mouse button (action, drawing type etc.) */
		no.mbmode = strator.MUP;										/* mouse button mode */
		no.clicks = 0;											/* 1st or 2nd click indicator */
		no.slate = document.getElementById( strator.DOC_SLATE );		/* dig out the HTML5 canvas */
		no.gc = no.slate.getContext( "2d" );					/* graphics context */

		no.set_scale( strator.DOC_SLATE_DIV, strator.DOC_SLATE, strator.DOC_CANVSIZE_CONN );

		no.rubber_band = null;									/* rubberbanding object */
		no.dragging = null;										/* dragging object */
		no.fill_things = false;									/* current fill state */
		no.outline_things = true;								/* current outline state */
		no.colour = "cyan"										/* initial fill colour */
		no.olcolour = "cyan"									/* initial outline colour */
		no.txtsize = 14;
		no.font = "sans-serif";
		no.last_cursor = "default"								/* last cursor to detect need to change */

		no.clique = strator.coterie.mk( );						/* the scribblings manager */
		addr = Scribble_url( scribble_r_port )
		no.session = strator.session.mk( addr, user, no );			/* create session and add this as listener (supplies cb_msg function) */
		no.session.conn( );							/* start connection -- session listener functions not defined as closures */	


		/* create pop-up objects to manage the various pop-up menus */
		no.conf_pu = strator.conf_popup.mk( strator.PU_CONF, no.session );		/* configuration popup manager */
		no.colour_pu = strator.colour_popup.mk( strator.PU_COLOUR, no );		/* colour popup manager */ 
		no.ctl_pu = strator.ctl_popup.mk( strator.PU_CTL, no );
		no.tedit_pu = strator.tedit_popup.mk( strator.PU_TXTEDIT, function() { no.paint() } );
		no.sedit_pu = strator.sedit_popup.mk( strator.PU_SOLIDEDIT, function() { no.paint( ) } );
		no.file_pu = strator.file_popup.mk( strator.PU_FILE, function( data ) { no.clique.load( data ); no.paint(); }, function( ) { no.clique.save(); } );

		/* top row of buttons */
		doctools.set_onclick( "file-button", 		function( e ) { no.file_pu.toggle( ); } );
		doctools.set_onclick( "open-conn-button", function( e ) { no.conf_pu.toggle( ); } );
		doctools.set_onclick( "open-ctl-button", 	function( e ) { no.ctl_pu.toggle(  ); } );
		doctools.set_onclick( "open-colour-button", function( e ) { no.colour_pu.toggle( ); } );
		doctools.set_onclick( "clear-button", 	function( e ) { no.clear_slate( no ); } );
		doctools.set_onclick( "dump-button", 		function( e ) { no.clique.dump( ); } );

		//document.getElementById('sendraw-conn').addEventListener( "click", function( e ) { no.send_raw(  ); }, false );

		/* for now these MUST be out here -- some day I'll figure out the necessary closure to move them to the popup */
		document.getElementById( strator.DOC_RESCALE_CONN ).addEventListener( "click", function( e ) { no.set_scale( strator.DOC_SLATE_DIV, strator.DOC_SLATE, strator.DOC_CANVSIZE_CONN ); no.paint( ); }, false );

		document.getElementById( strator.DOC_CANVSIZE_CONN ).addEventListener( "input", 
			function( e ) { 
				no.adjust_scale( strator.DOC_SLATE_DIV, strator.DOC_SLATE, e.target.value ); 
				no.paint( ); 
			}, false );

		doctools.set_input( strator.DOC_CTL_DEFTXTSIZE, 
			function( e ) 
			{ 
				no.txtsize = this.value; 
				doctools.obj_text( strator.DOC_CTL_TSIZE, this.value );
			} );

		/* ---- end these must be here an not in popups */

		no.show_state( );

		/* add callback functions that are driven for mouse events we need (down, up and movement) */
		no.slate.addEventListener( "mousemove", 				/* motion listener */
			function( e )
			{
				var x = ((e.clientX + window.pageXOffset) - no.slate_offset[0])/no.scale_x;		/* ajust now for scroll and window placement */
				var y = ((e.clientY + window.pageYOffset) - no.slate_offset[1])/no.scale_y;
				var	cursor = no.last_cursor;
				var action;

				e.preventDefault();				/* these are needed else chrome doesn't leave cursor set when button is down */
				e.stopPropagation();
				e.returnValue = false;

				if( no.dragging != null )		/* depend on no.dragging not no.dmodel as we can drag for both copy and move modes! */
				{
					no.dragging.move( ((e.clientX + (window.pageXOffset) - no.slate_offset[0]))/no.scale_x, ((e.clientY + window.pageYOffset) - no.slate_offset[1])/no.scale_y );
					no.paint( );
				}
				else
				{
					if( no.rubber_band != null )
					{
						no.rubber_band.x2 = x; 		/* move the corner to new location */
						no.rubber_band.y2 = y;
						no.paint( );
					}
					else
					{
						if( e.which <= 1 )					/* set action based on button pressed */
							action = no.dmodel;				/* left button */
						else
							action = no.dmoder;				/* right/middle both map to this */

						cursor = "default";
						switch( action )
						{
							case strator.EDIT:
								var ob = no.clique.under_foot( x, y );
								if( ob != null && ob.can_edit )
									cursor = "crosshair";					/* only change for things that can be edited */
								break;

							case strator.ERASE:							/* erase what the cursor bumps into while mouse button is down */
								if( no.clicks > 0 )						/* mouse is down -- delete what's under us at present */
								{
									if( no.clique.delete_under( x, y, true ) )
										no.paint( );

									cursor = "crosshair";
								}
								else
								{
									if( no.clique.under_foot( x, y ) != null )
										cursor = "crosshair";
									else
										cursor = "default";
								}
								break;

							case strator.MOVE:
							case strator.ROTATE:
							case strator.RAISE:
							case strator.LOWER:
							case strator.RECOLOUR:
							case strator.DELETE:
							case strator.COPY:
								if( no.clique.under_foot( x, y ) != null )
									cursor = no.dmodel == strator.MOVE ? "move" : "crosshair";
								break;
						}
					}
				}

				if( no.last_cursor != cursor )
					no.slate.style.cursor = cursor;
				no.last_cursor = cursor;
			},
 		false );				/* end of motion listener */

		no.slate.addEventListener( "mousedown", 
			function( e )		/* single click actions (delete, edit, text, etc) trigger on press so as to work on tablet like devices */
			{
				var cursor = no.last_cursor;
				var clone;
				var action = strator.NONE;
				var	obj;
				var	i;

				e.preventDefault();				/* these are needed else chrome doesn't leave cursor set when button is down */
				e.stopPropagation();
				e.returnValue = false;

				no.mbmode = strator.MDOWN;

				if( e.which == 1 )
					action = no.dmodel;				/* left button */
				else
					action = no.dmoder;				/* right/middle both map to this */

				strator.ld_x = ((e.clientX + window.pageXOffset) - no.slate_offset[0])/no.scale_x;		/* last down point */
				strator.ld_y = ((e.clientY + window.pageYOffset) - no.slate_offset[1])/no.scale_y;

				if( no.dragging != null || no.rubber_band != null )		/* already rubbering/no.dragging, just punt and let release do the real work (AFTER capturing ld point) */
					return;

				no.st_x = ((e.clientX + window.pageXOffset) - no.slate_offset[0])/no.scale_x;		/* set click 0 (start) points (with scroll and window offsets factored in */
				no.st_y = ((e.clientY + window.pageYOffset) - no.slate_offset[1])/no.scale_y;

				switch( action )
				{
					case strator.BOX:
						if( no.rubber_band == null )
						{
							cursor = "crosshair"
							no.rubber_band = strator.box.mk( no.st_x, no.st_y, 1, 1, no.colour, no.olcolour, no.fill_things, no.outline_things )
							no.clique.add( no.rubber_band );
						}
						break;

					case strator.COPY:
						if( (no.dragging = no.clique.under_foot( no.st_x, no.st_y )) != null )		/* if on something */
						{
							clone = no.dragging.dup();				/* dup it, add it and then make it the no.dragging target */
							if( Object.prototype.toString.call( clone ) == "[object Array]" )		/* we dup'd a group */
							{
								for( i = 0; i < clone.length; i++ )			/* add them all to the clique and select the last as the moveable scribbling */
									no.clique.add( clone[i] );
								no.dragging = clone[i-1];
							}
							else
							{
								no.clique.add( clone );					/* regular scribbling selected, add and drag it */
								no.dragging = clone; 
							}

							no.dragging.set_grabpt( no.st_x, no.st_y );	/* point used to drag the object */
							no.dragging.hold_opacity = no.dragging.opacity || 1;
							cursor = "crosshair"
						}
						break;


					case strator.CIRCLE:
						if( no.rubber_band == null )
						{
							cursor = "crosshair"
							no.rubber_band = strator.circle.mk( no.st_x, no.st_y, 1, no.colour, no.olcolour, no.fill_things, no.outline_things );
							no.clique.add( no.rubber_band );
						}
						break;

					case strator.DELETE:
						no.clique.delete_under( no.st_x, no.st_y, true );		
						break;

					case strator.EDIT:
						if( (obj = no.clique.under_foot( no.st_x, no.st_y )) != null )
						{
							if( obj.can_edit )
							{
								//obj.can_edit.show( no.popup_target );
								switch( obj.type )
								{
									case "text":
										no.tedit_pu.show( obj );
										break;

									default:
										no.sedit_pu.show( obj );
										break;
								}
							}
							else
								no.popup_target = null;
						}
						break;

					case strator.ERASE:
						no.clicks = 1;					/* triggers motion to delete what we bump into */
						no.clique.delete_under( no.st_x, no.st_y, true );		/* delete what was under, allows single click action too */
						cursor = "crosshair";
						break;

					case strator.GROUP:
						if( no.rubber_band == null )
						{
							cursor = "crosshair"
							no.rubber_band = strator.group.mk( no.st_x, no.st_y );
							no.clique.add( no.rubber_band );
						}
						break;

					case strator.LINE:
						if( no.rubber_band == null )
						{
							cursor = "crosshair"
							no.rubber_band = strator.line.mk( no.st_x, no.st_y, no.st_x, no.st_y, no.olcolour );
							no.clique.add( no.rubber_band );
						}
						break;

					case strator.MOVE:
						if( (no.dragging = no.clique.under_foot( no.st_x, no.st_y )) != null )
						{
							no.dragging.hold_opacity = no.dragging.opacity || 1;
							no.dragging.set_grabpt( no.st_x, no.st_y );				/* point used to drag the object relative to mouse on click */
							no.dragging.opacity = 0.5;
							no.dragging.bb = null;
							cursor = "crosshair"
						}
						break;

					case strator.OVAL:
						if( no.rubber_band == null )
						{
							cursor = "crosshair"
							no.rubber_band = strator.oval.mk( no.st_x, no.st_y, 1, no.colour, no.olcolour, no.fill_things, no.outline_things );
							no.clique.add( no.rubber_band );
						}
						break;

					case strator.SCRIBBLE:
						if( no.rubber_band == null )
						{
							cursor = "crosshair"
							no.rubber_band = strator.scribble.mk( no.st_x, no.st_y, no.olcolour );
							no.clique.add( no.rubber_band );
						}
						break;

					case strator.LOWER:					/* raise/lower must send coterie commands to affect the ling's position in the coterie list rather than sending ling update */
						if( e.shiftKey )
						{
							if( (name = no.clique.lower_tobot( no.st_x, no.st_y )) != null )		/* push it all the way to the bottom */
								no.session.send( "request; cmd:lower2bot; name:" + name	);
						}
						else
						{
							if( (name = no.clique.lower_under( no.st_x, no.st_y )) != null )
								no.session.send( "request; cmd:lower; name:" + name	);
						}
						break;

					case strator.RAISE:
						if( e.shiftKey )
						{
							if( (name = no.clique.raise_totop( no.st_x, no.st_y )) != null )		/* raise it clear to the top */
								no.session.send( "request; cmd:raise2top; name:" + name	);
						}
						else	
						{
							if( (name = no.clique.raise_under( no.st_x, no.st_y )) != null )
								no.session.send( "request; cmd:raise; name:" + name	);
						}
						break;

					case strator.RECOLOUR:
						var target;
						if( (target = no.clique.under_foot( no.st_x, no.st_y )) != null )
						{
							target.set_colour( no.colour, no.olcolour );
							//target.olcolour = no.olcolour;
							//target.set_changed( true );
						}
						break;

					/* "natural" rotation on the canvas is such that -deg/rad is anticlock; however we reverse that when we paint so a pos value moves n deg from East in anticlock */
					case strator.ROTATE:		
						if( (ob = no.clique.under_foot( no.st_x, no.st_y )) != null )
						{
							if( ob.rot == null )
								ob.rot = 0;

							if( e.altKey )
								ob.rot = 0;
							else
							{
								if( e.ctrlKey )
								{
									ob.rot += 45;
								}
								else
								{
									if( e.shiftKey )
										ob.rot -= 5;
									else
										ob.rot += 5;
								}
							}
							while( ob.rot < -360 )
								ob.rot += 360;
							while( ob.rot > 360 )
								ob.rot -= 360;
					
							ob.set_changed( true );
							if( no.clique.under_foot( no.st_x, no.st_y ) != null )
								cursor = "crosshair";
							else
								cursor = "default";
						}

						break;

					case strator.TEXT:			/* must cause a pop-up to show and associate the new object with it */
						obj = strator.text.mk( no.st_x, no.st_y, no.font, no.txtsize, no.colour, "" );
						no.clique.add( obj );
						no.tedit_pu.show( obj );
						break;
					
					default: 
						cursor = "default"
						break;
				}

				if( no.last_cursor != cursor )
					no.slate.style.cursor = cursor;
				no.last_cursor = cursor;
				no.paint();				

				return false;
			},
		false );						/* end mousedown callback */

		no.slate.addEventListener( 'mouseup', 
			function( e )							/* only two click, or click-hold+drag-release, atcions need to be handled here */
			{
				var ob;
				var name;
				var	ex;
				var	ey
				var cursor;
				var action;
				var bb;

				ex = ((window.pageXOffset + e.clientX) - no.slate_offset[0])/no.scale_x;	/* adjust for scroll and object offset */
				ey = ((window.pageYOffset + e.clientY) - no.slate_offset[1])/no.scale_y;
				same_pt = ex == strator.ld_x && ey == strator.ld_y;							/* release event at same point as press event (a click) */
				cursor = no.last_cursor;

				e.preventDefault();				/* these are needed else chrome doesn't leave cursor set when button is down */
				e.stopPropagation();
				e.returnValue = false;

				no.mbmode = strator.MUP;
				if( e.which == 1 )
					action = no.dmodel;				/* left button */
				else
					action = no.dmoder;				/* right/middle both map to this */

				if( no.clicks > 0 || ! same_pt )		/* second down/up, or up at end of dragging/rubberbanding */
				{
					if( no.rubber_band != null )		
					{
						no.rubber_band.set_changed( true );						/* force send now that it's done being created */

						if( typeof( no.rubber_band.fixate ) == "function" )
						{
							if( (bb = no.rubber_band.fixate()) != null )		/* fix up -- e.g. box needs to compute ul corner etc, group returns bounding box */
							{
								var glist;

								no.rubber_band.changed = false;
								if( (glist = no.clique.list_inside( bb )) != null )	/* capture a list of all lings inside of the bb */
									no.rubber_band.glist = glist;			/* assign the list */
								else
									no.clique.delete_last( );				/* nothing caputred, ditch the box */
							}
						}

						no.rubber_band = null;
					}

					if( no.dragging != null )
					{
						no.dragging.opacity = no.dragging.hold_opacity || 1;
						no.dragging.set_changed( true );
						no.dragging = null;
					}

					no.slate.style.cursor = "default";

					no.paint( );
					no.clicks = 0;
					return;
				}

				/* if we get here, this is a down/up on the same point and is the first 'click' */
				no.clicks = 0;					/* we'll assume most things are single click actions and default to 0 */
				switch( action )				/* first click/release -- set cursor for create obj, do action for one click things like no.colour and erase */
				{
					case strator.LINE:
					case strator.BOX:
					case strator.COPY:
					case strator.CIRCLE:
					case strator.MOVE:
					case strator.SCRIBBLE:
						cursor = "crosshair";		
						no.clicks = 1;
						break;

					//case strator.DELETE:		/* all of these handled by default case *?
					//case strator.EDIT:
					//case strator.RECOLOUR:
					//case strator.ROTATE:		
					//case strator.TEXT:
					default:			/* move etc. fall into here so no error, just back out */
						cursor = "default";		
						no.clicks = 0;
						return;
				}

				no.paint( );

				if( no.last_cursor != cursor )
					no.slate.style.cursor = cursor;
				no.last_cursor = cursor;

				return false;
			},

		false );								/* end click release callback */

		no.slate_offset = this.get_obj_ulxy( no.slate );
		no.slate.oncontextmenu = function () { return false; }		/* turn of right click default in the blackboard */
		no.paint( );

		return no;
	},

	/*
		set the size and scale of the canvas based on the current division size
		names are: dname -- division that contains the canvas, cname - canvas itself
	*/
	set_scale: function( dname, cname, slider )
	{
		var dob;
		var	h;
		var	w;

		dob = document.getElementById( dname );		/* base canvas size on the current division dimensions */
		h = dob.clientHeight;
		while( (w = h * 1.8) > dob.clientWidth )	/* set to a 1.8:1 ratio */
			h -= 2;

		this.slate.height = h;						/* apply computed dimensions to the canvas in the document */
		this.slate.width = w;

		this.clear_w = 1350;							/* logical width and height for a 1.8:1 ratio (9:5) for clearing */
		this.clear_h = 750;

		this.scale_x = w/this.clear_w;					/* scale values -- need to keep to convert real points from mouse events */
		this.scale_y = h/this.clear_h;

		this.scale_svalue = (100 * this.scale_y).toFixed( 0 );			/* slider setting, truncate value to integer */
		doctools.set_value( slider, this.scale_svalue );

		this.gc.scale( 1, 1 );								/* seems we need to reset then change */
		this.gc.scale( this.scale_x, this.scale_y );		/* apply scale to the gc */
	},

	adjust_scale: function( dname, cname, factor )		/* invoked when slider is moved to adjust the canvas size and scale */
	{
		var h;
		var w;

		if( factor == this.scale_svalue )		/* no change; browser shows movement, but doesn't equate to 10% of scale */
			return;

		if( factor < 10 )						/* we don't shrink to nothing */
			factor = 10;
		else
			if( factor > 100 )					/* and envoforce sane limit -- mostly because FF buggers sliders at the moment */
				factor = 100;
		factor /= 100;
		this.slate.height =  this.clear_h * factor;		/* compute height based on factor */
		this.slate.width = this.slate.height * 1.8;		/* then width based on height */

		this.scale_x = this.slate.width/this.clear_w;	/* scale values -- need for conversion of real points from mouse events */
		this.scale_y = this.slate.height/this.clear_h;

		this.scale_svalue = factor;						/* keep so we can detect a no-change state (slider moved, but browser returns same value as before) */

		this.gc.scale( 1, 1 );								/* seems we need to reset then change */
		this.gc.scale( this.scale_x, this.scale_y );		/* apply scale to the gc */
	},

	send_raw: function( )
	{
		var ob = document.getElementById( "raw-conn" );
		if( ob != null )
		{
			//console.log( "send raw>>> " + ob.value );
			this.session.send( ob.value );
		}
	},

	clear_slate: function( sd )				/* driven when clear button is pressed - causes all of the scribblings to be removed and  a clear to be sent to others */
	{
		sd.session.send( "request; cmd: clear"	);
		sd.clique.drop_all();
		sd.gc.clearRect( 0, 0, sd.clear_w, sd.clear_h );
	},

	get_obj_ulxy: function( obj )		/* crap needed to xlate event x,y to x,y within an object */
	{
		var xy = [];            // point to return

		xy[0] = xy[1] = 0;
		while( obj != null && obj.tagName != 'BODY' )
   		{         
			xy[0] += obj.offsetLeft;
			xy[1] += obj.offsetTop;
			obj = obj.offsetParent;
		}

		return xy;
	},

	/* session listener interface functions: pre/post update and message callback */
	pre_update: function( ) 
	{ 
		this.clique.push(); 
	}, 			

	post_update: function( refresh ) 			/* driven after a connection and/or changes; refresh is true if things changed */
	{
		if( refresh )										/* and session.refresh() should be invoked -- gives us a chance to setup/cleanup first */	
		{
			this.clique.drop();			/* drop what would have been pushed */
			this.session.refresh();		/* now it's safe to refresh, session doesn't do this automatically so we can take action if needed */
		}
		else
			this.clique.pop();			/* no need to refresh, must restore lings pushed by pre-update */
	
		this.paint( );
	},

	cb_msg: function( msg )							/* session invokes this with message */
	{
		var tag;

		var h = tools.str2hash( msg ); 			/* convert message to a hash once, and pass hash round */

		//console.log( "cb_msg got: " + msg );
		if( h.lookup( "mtype" ) == "request" )		/* we handle some requests in the driver and don't let cliques at them */
		{
			switch( h.lookup( "cmd" ) )
			{
				case "refresh":					/* send a list of lings to the repeater with the given tag */
					if( (tag = h.lookup( "tag" )) != null )
						this.clique.send_refresh( this.session, tag );
					break;

				case "update-groups":								/* a new list of groups */
					this.session.groups = h.lookup( "value" );
					this.session.groups = this.session.groups.replace( / /g, "<br />" );
					if( (o = document.getElementById( strator.DOC_GROUPS)) != null )
						o.innerHTML = this.session.groups;	
					return;					
					break;

				case "update-users":		/* a new user list for our current group */
					this.session.members = h.lookup( "value" );
					this.session.members = this.session.members.replace( / /g, "<br />" );
					if( (o = document.getElementById( strator.DOC_GMEMBERS)) != null )
						o.innerHTML = this.session.members;	
					return;					
					break;

			}
		}

		if( this.clique != null )	/* if we get this far, the ckique gets the message and we paint */
		{
			this.clique.msg( h );
			this.paint( );
		}
	},

	paint: function( )
	{
		//this.gc.clearRect( 0, 0, this.slate.width, this.slate.height );
		this.gc.clearRect( 0, 0, this.clear_w, this.clear_h );
		this.clique.paint( this.gc, this.session );
	},

	show_state: function(  )
	{
		var state;

		if( (state = document.getElementById( strator.DOC_STATE_FILL )) != null )
		{
			state.style.color = this.colour;
			state.style.background = this.colour;
			state.innerText = state.textContent = "XXX";
		}

		if( (state = document.getElementById( strator.DOC_STATE_OUTLINE )) != null )
		{
			state.style.color = this.olcolour;
			state.style.background = this.olcolour;
			state.innerText = state.textContent = "XXX";
		}
	},
};

strator.splash = {
	paint: function( )
	{
		var i;
		var gc;
		var c = document.getElementById( strator.DOC_SLATE );	/* splash on the canvas */
		var title = "'Strator!"

		if( c != null )
		{
			gc = c.getContext( "2d" );
			gc.font = "60px sans-serif"
			gc.save( );
			gc.translate( 300, 400 );
			var deg2rad = Math.PI/180;
			for( i = 10; i <= 90; i += 10 )
			{
				gc.save( );
				var blue = 100-i;
				gc.fillStyle = "#0090" + i;
				gc.rotate( -i * deg2rad );
				gc.fillText( title, 40, 40+i );
				gc.restore( );
			}

			gc.fillStyle = "#00e0a0";
			gc.fillText( title, 40, 40 );
			gc.fillStyle = "#a09000";
			gc.font = "14px sans-serif"
			if( strator.version )
				gc.fillText( strator.version, 105, 58 );		/* version */
			gc.restore();
		}
	}
};
