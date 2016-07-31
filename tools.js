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
	Mnemonic:	tools.js
	Abstract: 	Generic tools like converting string to numeric things (int/float) rotation etc.
				Might be useful outside of strator. 

				Biscuits -- cookies, but they might not always be.  local storage seems dodgy
				so biscuits are implemented as cookies, but might change in future to local
				storage (as that is what is really needed).  The name was selected so as not
				to imply that they are really cookies should biscuits become local storage
				and the javascript really need a cookie after it does. 

				The biscuit management functions assume that short term biscuits (those with zero
				expiration) are to expire at the end of the browsing session and are also 
				unique to the tab.  This allows the biscuits to persist in the view of the 
				javascript code if the page is reloaded in the same tab, but not if it's 
				(re)loaded in a different tab.  Strator makes use of this for tracking the 
				host:port and blackboard that the user is attached to.  It tracks the user name
				in a biscuit that expires with some positive time so that the user name is maintained
				even across tabs and sessions. 


	Author:		E. Scott Daniels
	Date:		28 Dec 2012
----------------------------------------------------------------------------------------------
*/

/* --- these are 'in the clear' on purpose -------------------------- */
/* if this isn't supported natively, add a function to do it */
if(typeof Object.create !== "function")
{
    Object.create = function( obj )
    {
        function F() {}
        F.prototype = obj;
        return new F();
    }
}

/* ----------------- end --------------------------------------------- */


var tools = tools || { };

/*
	no such thing as a constant in JS -- what's up with that?
*/
tools.DEG2RAD = Math.PI/180;
tools.RAD2DEG = 180/Math.PI;

/*
	prompt user for where to "download" file. stuff is a buffer of newline 
	separated things to save in the file. 
*/
tools.save2file = function( stuff )
{
	var u = "data:application/octet-stream," + encodeURIComponent( stuff );
	newWindow=window.open( u, "Save 'Strator scribblings to file" );
}

/*
	split a string on seperator and save as an array converting integers to int and decimal values to float
*/
tools.str2array = function( str, sep )
{
	var v;
	var	i;
	var	na = [];			/* new array */

	sep = sep || ",";
	str = str.replace( /[]]$/, "" );	/* ditch lead/trail [ and ] -- this won't properly handle nested arrays */
	str = str.replace( /^[[]/, "" );	

	v = str.split( sep );
	for( i = 0; i < v.length; i++ )
		na.push( tools.str2thing( v[i] ) );				/* push the right thing: int, float, string */

	return na;
};

/*
	atoi() atof() functionality. returns the proper object or the orinal string if it seems not to be a number
*/
tools.str2thing = function( str )		/* convert a string to int/float if it makes sense, [ a, b, c ] to array, else leave as string */
{
	if( /^[ \t]*[-+]*[0-9]+/.test( str ) )				/* number of some sort */
	{
		if( /\./.test( str ) )					/* number with decimal -- assume float */
			return parseFloat( str );
		else
			return parseInt( str );
	}
	else
		if( /^[[]/.test( str ) )				/* assume [ a, b, c ] is an array */
			return tools.str2array( str );

	if( typeof( str ) == "string" )
	{
		str = str.replace( /^"/, "" );
		return str.replace( /"$/, "" );
	}

	return str;
}

tools.str2hash = function( str )		/* split a ling definition string into a hash */
{										/* expected format:   mtype; parm:value; parm:value...  */
	var i;
	var stuff;
	var pv;
	var h;

	stuff = str.split( /\s*;\s*/ );			/* doesn't handle ; in the values */
	
	h = symtab.mk( );
	h.save( "mtype",  stuff[0] );

	for( i = 1; i < stuff.length; i++ )
	{
		pv = stuff[i].split( /\s*:\s*/, 2 );		/* TODO -- this might not be splitting on first : but on last which is wrong */
		if( pv[1] != null )							/* it will be null if msg ended in ; */
			h.save( pv[0], tools.str2thing( pv[1] ) );		/* convert int, float, array, or remove lead/trail quotes */
	}

	return h;
};

tools.slope = function( x1, y1, x2, y2 )
{
	if( x1 - x2 == 0 )
		return null;

	return -((y1 - y2) / (x1 - x2)); 		/* slope is inverted because y=0 is at bloody top of canvas */
}

/*
	rotate point x,y around the rotaion point rx,ry  angle degrees
	We'll use this to determine whether a point is in a bounding box for 
	a ling that's been rotated. 
*/
tools.rotate_pt = function( x, y, rx, ry, angle )
{
	var rad;         /* number of radians to rotate */
	var radius;      /* radius of rotation */
	var newang;      /* rotated angle in radians */
	var a;
	var b;           /* vars to calculate the radius */
	var	point;

	angle *= -1;				/* invert user supplied angle -- their view of the world is anticlock from East, real world is clock from East */

	point = [ x, y ];			/* default -- no rotation */

	a = x - rx ;       /* adjust for center point of rotaion offset from 0,0 */
	b = y - ry ;

	if( a == 0  &&  b == 0 )   		/* absolutely no rotation */
		return point;

	rad = angle * tools.DEG2RAD;   /* convert degrees to radians */
	radius = Math.sqrt( ((a * a) + (b * b)) );	/* radius from rotation point to x,y */

	if( b < 0 && a >= 0 )								/* if in quad 4 then */
		newang = rad + Math.asin( b / radius );			/* use asin to calc angle */
		else
			if( b >= 0 )										/* if in quads 1 or 2 use acos */
				newang = rad + Math.acos( a / radius);
			else												/* quad 3 and tangent is used */
				newang = rad + Math.PI + Math.atan( b / a );

	point[0] = (Math.cos( newang ) * radius) + rx;        /* rotate the point */
	point[1] = (Math.sin( newang ) * radius) + ry;

	return point; 
};


/* biscuit managment. we'll parse cookies into a symtab and keep them there so that we don't
   go to all that work with each cookie lookup that might be done
*/
tools.fetch_biscuits = function( )		/* create a hash of cookies for easier access */
{
	var oreos;		/* split list of cookies */
	var i;
	var kvp;		/* key value pair */
	var tknm;		/* tabbed key */

	if( !window.name )		/* tab cookies based on a window name that should persist across reload */
	{
		dt = new Date();
		window.name = "tc" + dt.getTime().toString() +  (Math.floor( Math.random() * 10000 )).toString( 16 );		/* random identifier */
	}

	tools.biscuits = symtab.mk( );			/* regular cookies */
	tools.tbiscuits = symtab.mk( );			/* tab specific cookies */

	oreos = document.cookie.split( /; */ );
	for( i = 0; i < oreos.length -1; i++ )
	{
		kvp = oreos[i].split( '=' );
		tknm = kvp[0].split( '__' );

		if( tknm[0] == window.name )
			tools.tbiscuits.save( tknm[1], unescape( kvp[1] ) );
		else
			tools.biscuits.save( kvp[0], unescape( kvp[1] ) );
	}
}

/* expiry is number of days to expire in */
tools.set_biscuit = function( name, value, expiry )
{
	var dto = new Date();

	if( !tools.biscuits )				/* ensure biscuit map and windowname are set */
		tools.fetch_biscuits( );

	dto.setDate( dto.getDate() + expiry );
	if( !expiry )
	{
		name = window.name + "__" + name;
		tools.tbiscuits.save( name, value );		/* save in the tabbed (local) hash */
		expiry = null;
	}
	else
	{
		tools.biscuits.save( name, value );		/* keep in hash for quicker look up if we dig it again */
	}

	document.cookie= name + "=" + escape( value ) + ";path=/" + ( expiry == null ? "" : ";expires=" + dto.toUTCString() );

}

/*
	search the tabbed hash (local) first, and if not found search the global cookie hash for name
	if global is true, the local hash search is skipped.
*/
tools.get_biscuit = function( name, global )
{
	if( !tools.biscuits )
		tools.fetch_biscuits();

	if( !global &&  (v = tools.tbiscuits.lookup( name )) != null )	/* return tabbed (local) value if there */
		return v;
			
	return tools.biscuits.lookup( name );		/* no local value, or specifically requested global value */
}

/* 
	deletes the local (tab) copy first leaving a global copy unchanged unless the local copy
	does not exist, or all is true. 
*/
tools.delete_biscuit = function( name, all )			
{
	var lname;

	if( tools.tbiscuits.del( name ) )		/* there was a local name */
	{
		lname = window.name + "__" + name;
		document.cookie= lname + '=' + escape( "" ) + ";path=/" + ( expiry == null ? "" : ";maxage=0" );

		if( !all )
			return;
	}
		
	if( tools.biscuits.del( name ) )		/* delete the global one and reset in real cookie space */
		document.cookie= name + '=' + escape( "" ) + ";path=/" + ( expiry == null ? "" : ";maxage=0" );
}

/*
	basic popup manager. used as a parent class when extended to initialise fields in the popup
	before display. divid is the document id of the division to popup/hide. target is the name
	of the object that is affected by changes within the popup and the target of accept. 
	target can be null at creation and added later (for the edit popup where the object that is 
	being edited isn't known until it's clicked on).
*/
tools.basic_popup = function( divid, target )
{
		if( divid )
			this.div = document.getElementById( divid );
		else
			this.div = null;

		this.target = target;
};

	tools.basic_popup.prototype.setup =	function()		/* called just before showing; returns object to get focus */
	{
		/* expected to be extended when needed */
		return null;
	};

	tools.basic_popup.prototype.takedown = function( accept )	/* called just after hiding -- accept is true if tearing down because of accept button */
	{
		/* expected to be extended when needed */
		return;
	}

	tools.basic_popup.prototype.show = function( rt_target )		/* rt_target is the real-time target for things like edits */
	{
		var gets_focus;

		gets_focus = this.setup( rt_target );
		if( this.div )
			this.div.style.display = "block";

		if( gets_focus != null )
			gets_focus.focus();
	}

	tools.basic_popup.prototype.hide = function( accept )
	{
		if( this.div )
			this.div.style.display = "none";
		this.takedown( accept );
	}

	tools.basic_popup.prototype.accept = function( hide )
	{
		if( this.target )
			this.target.update( this.changes );
		this.changes = null;
		
		if( hide )
			this.hide( true );
	}	

	tools.basic_popup.prototype.cancel = function( hide )				
	{
		this.changes = null;
		if( hide )
			this.hide( false );
	}

	tools.basic_popup.prototype.toggle = function( )
	{
		if( this.div )
		{
			switch( this.div.style.display )
			{
				case "none":
				case "":				/* none set in css ends up with blank */
					this.show( );
					break;

				default: 
					this.cancel( true );
			}
		}
	}
	
	/*
		capture a change of type and if refresh_id is given find it and update it 
		with the value of this (probably updating a human readable rep of a slider
		position).
		if quote is true, then we'll quote the string before saving it.
		this is probably attached to a listener.
	*/
	tools.basic_popup.prototype.capture_change = function( type, value, refresh_id, quote )
	{
		if( this.changes == null ) 
			this.changes = symtab.mk(); 
	
		if( quote )
			value = '"' + value + '"';

		this.changes.save( type, value );

		if( refresh_id )
		{
			var dob;
	
			if( (dob = document.getElementById( refresh_id )) != null )
			{
				if( typeof( value ) == "string" )
					dob.innerHTML = value; 
				else
					dob.innerHTML = value.name ? value.name : "???"; 
			}
		}
	}
