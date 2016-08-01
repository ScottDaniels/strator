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
	Mnemonic:	strator_doctools.js

	Abstract: 	Generic document oriented functions. Mostly for strator, but might be 
				useful elsewhere. 
				These provide 'class methods' -- not meant to be instanced, yet we exploit one of the nasty
				features of the language and use this to hold global vars even though there's not "really"
				an instance of the object. 

	Date:		22 December 2012

	Author:		E. Scott Daniels
*/

doctools = {
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

	obj_text: function( oname, msg, colour, bgcolour )		/* simple write to document with optional colour */
	{
		var o;

		if( (o = document.getElementById( oname )) != null )
		{
			o.innerHTML = msg;
			if( colour != null )
				o.style.color = colour;

			if( bgcolour != null )
				o.style["background-color"] = bgcolour;
		}
	},

	/*
		move a drawing object (e.g. div or image)
		it seems backwards to check for the grab point here, but we don't get an event, or I'm too daft
		to figure out how to get an event, when the callback (mouse down) is defined in the html.  
		So, on mouse down we just id the object to move when we see some motion.
		Regardless, check to see that things are valid, and if so move the object based on the 
		current mouse position.  
	*/
	obj_move: function( e )
	{
		var	offset;

		if( doctools.selected != null  )  //&&  doctools.mdown )
		{
			if( doctools.offset == null )			/* snag the grab point difference relative to the ul corner compute once; good until button released */
			{
				offset = doctools.get_obj_ulxy( doctools.selected );
				doctools.offset = [];
				doctools.offset[0] =  (window.pageXOffset + e.clientX) - offset[0];  
				doctools.offset[1] =  (window.pageYOffset + e.clientY) - offset[1];

				if( doctools.maxgrab_y > 0  &&  doctools.offset[1] > doctools.maxgrab_y )			/* prevent motion unless grab was within parameter supplied in HTML */
				{
					doctools.obj_mouseup( );			/* not good, reset things */
					return;
				}
			}

			doctools.selected.style.left = (e.clientX + window.pageXOffset)  - doctools.offset[0] + "px";		/* ajust now for scroll and window placement */
			doctools.selected.style.top  = (e.clientY + window.pageYOffset)  - doctools.offset[1] + "px";
		}
		//e.preventDefault();
	},

	/*
		"Attach" this function to a document object that can be clicked on and moved round. 
		Example:
			<div id="file-popup"  class="popup" style="left: 400px; top: 200px" onmousedown='javascript: doctools.obj_mousedown( "file-popup", 15  );' >
		"file-poup" is obviously the ID, and 15 is the max distance from the top edge of the object that is
		permitted as a grab point -- 15 works nicely to grab on the top 'frame' of an obj, but not allow a grab in the middle. Use
		0, to allow a grab anywhere. 
		When the left mouse button is clicked on the object this function is invoked and attaches 
		a motion and mouse release listener to the object (saving the html from having to add three listeners, and 
		keeping the listener population at a minmum).  If there are text fields in the object, and you want to have them
		'selectable' by dragging the mouse over them with the button pressed, you need to set the grab limit to stop before the 
		first field.  This is best done, imho, by setting it to be about the top border area of the bounding box: 15 works well and 
		that is the default if its not provided. 
	*/

	/*
		clicked on a doc object
	*/
	obj_mousedown: function( oid, maxgrab_y )
	{
		if( oid == null )			/* shouldn't happen, but be parinoid */
			return;

		doctools.offset = null;
		doctools.maxgrab_y = maxgrab_y != null ? maxgrab_y :  15;
		doctools.mdown = true;
		doctools.selected = document.getElementById( oid );						/* we can only move one thing at a time, so I think it's safe to mark the selected globally */
		doctools.selected.addEventListener( 'mousemove',  doctools.obj_move, true );
		doctools.selected.addEventListener( 'mouseup',  doctools.obj_mouseup, true );
	},

	/*
		released mouse button (also called to reset things if mouse down wasn't on a decent spot.
	*/
	obj_mouseup: function(  )
	{
		
		//doctools.mdown = false;
		doctools.offset = null

		if( doctools.selected != null )
		{
			doctools.selected.mousemove = null;
			doctools.selected.removeEventListener( "mousemove", doctools.obj_move );
			doctools.selected.removeEventListener( "mouseup", doctools.obj_mouseup );
		}

		doctools.selected = null;
	},

	/*	simple wrapper functions to add listeners. They  verify the existance of id 
		making user code simpler
	*/
	set_keypress: function( id, callback )
	{
		var obj;
	
		if( (obj = document.getElementById( id )) != null )
			obj.addEventListener( "keypress", callback, false );
	},
	set_onclick: function( id, callback )
	{
		var obj;
	
		if( (obj = document.getElementById( id )) != null )
			obj.addEventListener( "click", callback, false );
else
console.log( "unable to register click listener for: ", id );
	},

	set_change: function( id, callback )
	{
		var obj;
	
		if( (obj = document.getElementById( id )) != null )
			obj.addEventListener( "change", callback, false );
	},
	
	set_input: function( id, callback )
	{
		var obj;
	
		if( (obj = document.getElementById( id )) != null )
			obj.addEventListener( "input", callback, false );
	},

	set_value: function( id, v )		/* find obj and set value if there */
	{
		var obj;
	
		if( (obj = document.getElementById( id )) != null )
			obj.value = v;
	}
}
