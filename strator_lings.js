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
	Mnemonic:	strator_lings.js
	Abstract: 	Scribling objects: box, circle, oval, line, scribble and text. 

	Requires	tools.js,  symtab.js

	Author:		E. Scott Daniels
	Date:		22 Nov 2012
----------------------------------------------------------------------------------------------
*/
var strator = strator || {};			/* don't depend on order that html includes us */


/*
	This is the generic object from which all other scribblings are created making 
	needed extensions. 
*/
strator.base_ling = {
	spec: 		[ "type", "x", "y", "name" ], 	/* basic set of specifications to ensure that there is one defined */
	type:  		"base_ling",
	changed:  	false, 						/* changed lings are sent to the repeater */
	can_change:	true,						/* some lings don't get sent and thus cannot change */
	rot:  		0,							/* rotaion */
	can_edit:  	false,						/* only certain types can be edited -- default to off */
	fill:		false,
	outline:	true,
	opacity:	1,

	mk: function( )
	{
		var no;		/* new object */
	
		no = Object.create( strator.base_ling );
	
		return no;
	},


	to_str: 	function( )
	{
		var i;
		var j;
		var s;
		var a;

		s = "ling";				/* a scribbling */
		for( i = 0; i < this.spec.length; i++ )
		{
			if( this[this.spec[i]] != null )
			{
				switch( typeof( this[this.spec[i]] ) )
				{
					case "object": 						/* we assume array, may bite us someday */
						s += "; " + this.spec[i] + ":[";
						a = this[this.spec[i]];
						for( j = 0; j < a.length - 1; j++ )
						  		s += a[j].toFixed( 1 ) + ",";			/* truncate integers to 1 digit */
						s += a[j].toFixed( 1 ) + " ]";				/* last one no comma */
						break;
		
					case "string":
						s += "; " + this.spec[i] + ':"' + this[this.spec[i]] + '"';
						break;
		
					case "number":
						s += "; " + this.spec[i] + ":" + this[this.spec[i]].toFixed( 3 );
						break;

					default:
						s += "; " + this.spec[i] + ":" + this[this.spec[i]];
						break;
				}
			}
		}

		return s;
	},

	/*
		for each property that is defined in the ling's spec we check to 
		see if it exists in the hash passed in. If it is, then we 
		update the value in the object from the hash.  Anything in the 
		has that isn't in the spec is ignored. We don't allow the name 
		to be updated. 
	*/
	update: function( h )			
	{
		var i;
		var	v;
		var fill;

		if( !h )
			return;

		for( i = 0; i < this.spec.length; i++ )
		{
			if( this.spec[i] != "name"  &&  (v = h.lookup( this.spec[i] )) != null )	/* name cannot be updated */
			{
				this.changed = this.can_change;			/* something in the change list, so we'll mark this */

				switch( v )
				{
					case "true":	this[this.spec[i]] = true; break;		/* convert true/false strings to boolean */
					case "false":	this[this.spec[i]] = false; break;
					default:		this[this.spec[i]] = v; break;			/* otherwise just assign the value */
				}
			}

		}

		this.bb = null;			/* force bounding box to be recomputed next it is needed */

		/* endr IS allowed to be less than startr -- so we must NOT prevent it; we do need to convert degrees to radians */
		if( this.startr && (this.startr < 0 || this.startr > Math.PI * 2) )		/* assume degrees were specified and convert to radians */
			this.startr *= tools.DEG2RAD;
		if( this.endr && (this.endr < 0 || this.endr > Math.PI * 2) )		
			this.endr *= tools.DEG2RAD;

		if( this.opacity && this.opacity > 1  && this.opacity <= 100 )			/* must convert to 0 < o < 1 */
			this.opacity /= 100;
	},

	dup: 	function( )			/* duplicate the ling; preserves only what is in spec, except for name */
	{
		var i;
		var no;					/* new object */
		var h;
		var v;
		var i;
		var j;
		var ov;
	
		h = symtab.mk( );
		for( i = 0; i < this.spec.length; i++ )
		{
			if( this[this.spec[i]] != "name" )					/* load everything in the spec except the name */
			{
				if( typeof( (v = this[this.spec[i]]) ) == "object" )	/* we only support arrays, but weed any object out first */
				{
					if( Object.prototype.toString.call( v ) == "[object Array]" )
					{
						ov = v;
						v = [];
						for( j = 0; j < ov.length; j++ )
							v[j] = ov[j];						/* force a dup, not a pointer to the array in the object being dup'd */
					}
					else
						v = null;
				}

				if( v )
					h.save( this.spec[i], v );
			}
		}

		no = strator[this.type].mk();		/* make a base of ourself, then */
		no.update( h );						/* then update with current values defined previously in hash */
		return no;							/* and send new obj back to user */
	},

	set_grabpt:  function( x, y )				/* offset that we'll use when moving this dude */
	{
		this.drag_xoff = x - this.x;			/* grab point is maintained as an offset */
		this.drag_yoff = y - this.y;
	},

	set_colour: function( colour, olcolour )
	{
		this.colour = colour;
		this.olcolour = olcolour; 
		this.changed = this.can_change;
	},

	move:  function( x, y )					/* move the object -- works for objects anchored by a single point; line, scribble must implement their own */
	{
		this.x = x - this.drag_xoff;		/* adjust x,y anchor relative to the offset when grab point computed */
		this.y = y - this.drag_yoff;
		
		this.bb = null;
	},

	fxate:  function( )			/* some types need a final adjustment after being created -- e.g. sets proper upper left x,y for box */
	{
		this.x2 = this.y2 = null;		/* basic function just unsets x/y2 to turn off rubberband oriented paint options in some lings */
		return;
	},

	has_point:  function( x, y )			/* basic bounding box as a default */
	{
		if( this.bb == null )
			this.bb = strator.bounding_box.mk( this.x, this.y, this.x + this.w, this.y + this.h )

		return this.bb.inside( x, y, this.rot, this.x, this.y );
	},

	set_changed: function( v )
	{
		this.changed = this.can_change ? v : false;
	},

	/*
		there isn't a generic paint function; each ling that extends this must supply one.
	*/
	paint:  function( gc )
	{
		return;
	},
	
	/*
		test to see if scribbling is compeltely inside the box, partially inside the box, or has no points 
		at all inside the box described by the bounding box passed in.
		Returns:	-1 -- nothing inside
					0  -- some points are inside
					1  -- all points are inside

		This will handle simple lings (box, circle, line, etc). more complicated things like scibbles
		must provide their own function.
	*/
	bounded_by:	function( bb )
	{
		var rv = -1;		/* return value -- initially assume no point is inside */

		if( bb.inside( this.x, this.y, this.rot, this.x, this.y ) )		/* by default lings are rotated round their first point -- makes things like this easy w/out a special rx,ry pair */
			rv++;

		if( this.h != null )		/* box like */
		{
			if( bb.inside( this.x + this.w, this.y + this.h, this.rot, this.x, this.y ) )
				rv++;
		}
		else
		if( this.x2 != null )		/* two point ling */
		{
			if( bb.inside( this.x1, this.y1, this.rot, this.x1, this.y1 ) )		/* by default lings are rotated round their first point -- makes things like this easy w/out a special rx,ry pair */
				rv++;
			if( bb.inside( this.x2, this.y2, this.rot, this.x, this.y ) )	/* by default lings are rotated round their first point -- makes things like this easy w/out a special rx,ry pair */
				rv++;
		}
		else
		if( this.type == "text" )				/* we'll assume we can compute the length */
		{
			rv += bb.inside( this.x +  (this.text.length * this.size)/2, this.y - this.size, this.rot, this.x, this.y );
		}
		else
		if( this.r != null )			/* circle, just a bit trickier, but not tough */
		{
			rv = 0;					/* different approach for circle -- if all maximal points in either x or y direction are inside the bb, then we're completely in */
			if( bb.inside( this.x + this.r, this.y, 0, 0, 0 ) )		/* max x */
				rv++;
			if( bb.inside( this.x - this.r, this.y, 0, 0, 0 ) )		/* min x */
				rv++;
			if( bb.inside( this.x, this.y + this.r, 0, 0, 0 ) )		/* max y */
				rv++;
			if( bb.inside( this.x, this.y- this.r, 0, 0, 0 ) )		/* max y */
				rv++;

			rv = rv == 4 ? 1 : (rv == 0 ? -1 : 0 );			/* all points, then return 1, some points return 0, no points -1 */
		}

		return rv;
	}
}


/*
	---------------------------------------------------------------------------------------------------------------------------------- scribbling 'constructors'. Yes, we  could create them as functions (e.g. strator.mk_box = function() {...}) rather than objects, but 
	that prevents us from using the following 'generic' construct method: 	object = strator[type].mk() where type is 
	one of our scribbling types (box, line, circle...). 

	Inheritance from the base_ling object is accomplished by creating a base object, and then adding the functions that are unique
	to the desired type, or overriding the generic functions supplied in the base. It also adds the spec list and sets the default
	values if values are not supplied as parms. 

*/


strator.box = {
	spec: [ "type", "name", "x", "y", "h", "w", "rot", "olcolour", "colour", "fill", "outline", "opacity" ],		
	type: "box",

	mk: function( x, y, w, h, colour, olcolour, fill, outline )
	{
		var no = strator.base_ling.mk();

		no.x = x || 0;
		no.y = y || 0;
		no.h = h || 10;					/* we compute h/w during fixate as so that for all paints after rubberbanding no additional thought needed */
		no.w = w || 10;					/* if any x,y,h,w are 0 we'll assign the default which might not be what is desired */
		no.colour = colour || "blue";
		no.olcolour = olcolour || "blue";
		no.fill = fill != null ? fill : false;				/* cannot use x = something || true  if something might be false (set with a value)*/
		no.outline = outline != null ? outline : true		/* default only if outline wasn't supplied */
		no.can_edit = true;		//strator.PU_SOLIDEDIT;					/* boxes are edited with the solid edit popup div */

		no.type = this.type;			/* extend generic ling with box specific stuff that is shared by all boxes */
		no.spec = this.spec;
		no.paint = this.paint;			
		no.fixate = this.fixate;

		return no;
	},

	paint: function( gc )
	{
		if( this.x2 != null )		/* allow rubberbanding to set x2/y2 -- compute new h/w and paint here */
		{
			if( this.x < this.x2 )
				var ulx = this.x;
			else
				var ulx = this.x2;
			if( this.y > this.y2 )
				var uly = this.y2;
			else
				var uly = this.y;

			this.w =  Math.abs( this.x - this.x2);
			this.h =  Math.abs( this.y - this.y2);

			if( this.fill )
				gc.strokeStyle = this.colour;
			else
				gc.strokeStyle = this.olcolour;
			gc.strokeRect( ulx, uly, this.w, this.h );		/* rubberbanding always strokes */

			return;
		}

		if( (this.rot || 0) != 0 )
		{
			gc.save();
			
			gc.translate( this.x, this.y )
			gc.rotate( -this.rot * tools.DEG2RAD );
			if( this.fill )
			{
				gc.globalAlpha = this.opacity != null ? this.opacity : 1;
				gc.fillStyle = this.colour;
				gc.fillRect( 0, 0, this.w, this.h );
				gc.globalAlpha = 1;
			}

			if( this.outline )
			{
				gc.strokeStyle = this.olcolour;
				gc.strokeRect( 0, 0, this.w, this.h );
			}

			gc.restore();

			return;
		}

		if( this.fill )
		{
			gc.globalAlpha = this.opacity != null ? this.opacity : 1;
			gc.fillStyle = this.colour;
			gc.fillRect( this.x, this.y, this.w, this.h );
			gc.globalAlpha = 1;
		}

		if( this.outline )
		{
			gc.strokeStyle = this.olcolour;
			gc.strokeRect( this.x, this.y, this.w, this.h );
		}
	},

	fixate: function( )				/* called at the end of 'creation' to fix things up (ulx/uly set properly if x,y turn out not to be ul corner */
	{
		this.x =  this.x > this.x2 ? this.x2 : this.x;
		this.y =  this.y > this.y2 ? this.y2 : this.y;
		this.x2 = this.y2 = null;						/* ditch these now so that paint uses h/w and doesn't constantly compute them */
		this.bb = null;					/* just in case */
		return;
	},
}

strator.text = {
	spec: [ "type", "text", "name", "x", "y", "font", "size", "rot", "colour" ],		/* text specs; shared */
	type: "text",

	mk: function( x, y, font, size, colour, text )
	{
		var no = strator.base_ling.mk();

		no.x = x || 0;
		no.y = y || 0;
		no.colour = colour || "#00ff00";
		no.size = size || 14;
		no.font = font || "sans-serif";
		if( text == null || typeof( text ) == "string" )
			no.text = text || "";
		else
			no.text = text.toString( );
		no.can_edit = true;	//strator.PU_TXTEDIT;

		no.type = this.type;						/* extend with text things that are shared */
		no.spec = this.spec;
		no.add = this.add;
		no.has_point = this.has_point;
		no.paint = this.paint;
		return no;
	},

	add: function( what )		/* add a string to the end of the current text */
	{
		this.text += what;
	},
	
	paint: function( gc )
	{
		gc.fillStyle = this.colour;
		gc.font = this.size + "px " + this.font;
		if( (this.rot || 0) == 0  )
		{
			gc.fillText( this.text, this.x, this.y );
		}
		else
		{
			var deg2rad = Math.PI/180;
			gc.save();
			
			gc.translate( this.x, this.y )
			gc.rotate( -this.rot * deg2rad );
			gc.fillText( this.text, 0, 0 );
			gc.restore();
		}
	},
	
	has_point: function( x, y )
	{
		if( this.bb == null )
			this.bb = strator.bounding_box.mk( this.x, this.y - this.size, this.x + (this.text.length * this.size)/2, this.y + this.size )

		return this.bb.inside( x, y, this.rot, this.x, this.y  );
	},
}

strator.circle = {
	spec: [ "type", "name", "x", "y", "r", "fill", "outline", "olcolour", "colour", "opacity", "startr", "endr" ],		/* change specifications that make it a box */
	type: "circle",

	mk: function( x, y, r, colour, olcolour, fill, outline )
	{
		var no = strator.base_ling.mk();

		no.x = x || 0;
		no.y = y || 0;
		no.colour = colour || "#00ff00";
		no.olcolour = olcolour || "#00ff00";
		no.r = r || 10;
		no.startr = 0;										/* start/end degrees can be edited */
		no.endr = Math.PI * 2;
		no.fill = fill != null ? fill : false;				/* cannot use x = something || true  if something might be false (set with a value) */
		no.outline = outline != null ? outline : true		/* default only if outline wasn't supplied */
		no.can_edit = true;		//strator.PU_SOLIDEDIT;

		no.spec = this.spec;
		no.type = this.type;
		no.paint = this.paint;					/* circle method extensions */
		no.fixate = this.fixate;
		no.has_point = this.has_point;
		return no;
	},

	paint: function( gc )
	{
		if( this.x2 != null )				/* ruberbanding */
		{
			this.r = Math.sqrt( ((this.x - this.x2) * (this.x - this.x2)) + ((this.y - this.y2) * (this.y - this.y2)) );
			if( this.fill )
				gc.strokeStyle = this.colour;			/* always just stroking for rubbering */
			else
				gc.strokeStyle = this.olcolour;			/* always just stroking for rubbering */
			gc.beginPath();
			gc.arc( this.x, this.y, this.r, this.startr, this.endr );
			gc.stroke( );

			return;	
		}

		if( this.fill )
		{
			gc.globalAlpha = this.opacity || 1;
			gc.fillStyle = this.colour;
			gc.beginPath();
			gc.arc( this.x, this.y, this.r, this.startr, this.endr );
			gc.fill( );
			gc.globalAlpha = 1;
		}
		
		if( this.outline )
		{
			gc.strokeStyle = this.olcolour;
			gc.beginPath();
			gc.arc( this.x, this.y, this.r, this.startr, this.endr );
			gc.stroke( );
		}
	},
	
	fixate:  function( )
	{
		this.x2 = this.y2 = null;
		return;
	},

	has_point:  function( x, y )			/* compute dist from circle center to point -- if less than radius then we have the point */
	{
		return  Math.sqrt(  ((x - this.x) * (x - this.x)) + ((y - this.y) * (y - this.y)) )  <= this.r; 
	},
}
	

/* cheating with oval until ellipse is implemented in browsers */
strator.oval = {
	spec: [ "type", "name", "x", "y", "h", "w", "r", "rot", "xscale", "yscale", "fill", "olcolour", "colour", "outline", "opacity" ],		/* h/w for bounding box at the moment */
	type: "oval",

	mk: function( x, y, r, colour, olcolour, fill, outline )
	{
		var no = strator.base_ling.mk();


		no.x = x || 0;
		no.y = y || 0;
		no.colour = colour || "#00ff00";
		no.olcolour = olcolour || "#00ff00";
		no.r = r || 10;
		no.fill = fill != null ? fill : false;				/* cannot use x = something || true  if something might be false (set with a value) */
		no.outline = outline != null ? outline : true		/* default only if outline wasn't supplied */
		no.can_edit = true;  //strator.PU_SOLIDEDIT;

		no.spec = this.spec;
		no.type = this.type;
		no.fixate = this.fixate;					/* extend base scribbling */
		no.has_point = this.has_point;
		no.paint = this.paint;
		no.bounded_by = this.bounded_by;
		

		return no;
	},

	fixate:  function( )				/* called at the end of 'creation' to fix things up (ulx/uly set properly if x,y turn out not to be ul corner */
	{
		this.x =  (this.x > this.x2 ? this.x2 : this.x) + this.w/2;			/* center point */
		this.y =  (this.y > this.y2 ? this.y2 : this.y) + this.h/2;

		this.x2 = this.y2 = null;						/* ditch these now so that paint uses h/w and doesn't constantly compute them */
		this.bb = null;					/* just in case */

		if( this.w > this.h )
		{
			this.yscale = 1;
			this.xscale = this.w/this.h
			this.r = (this.w/2)/this.xscale;
		}
		else
		{
			this.xscale = 1;
			this.yscale = this.h/this.w
			this.r = (this.h/2)/this.yscale;
		}

		return;
	},

	paint:  function( gc )
	{
		if( this.x2 != null )		/* allow rubberbanding to set x2/y2 -- compute new h/w and paint here */
		{
			if( this.x < this.x2 )
				var ulx = this.x;
			else
				var ulx = this.x2;
			if( this.y > this.y2 )
				var uly = this.y2;
			else
				var uly = this.y;

			this.w =  Math.abs( this.x - this.x2);
			this.h =  Math.abs( this.y - this.y2);

			gc.strokeStyle = this.olcolour;
			gc.strokeRect( ulx, uly, this.w, this.h );		/* rubberbanding always strokes */

			return;
		}

		gc.save( );
		gc.translate( this.x, this.y );
		if( this.rot )
			gc.rotate( -this.rot * tools.DEG2RAD );

		gc.scale( this.xscale, this.yscale );

		if( this.fill )
		{
			gc.globalAlpha = this.opacity || 1;
			gc.fillStyle = this.colour;
			gc.beginPath();
			gc.arc( 0, 0, this.r, 0, Math.PI * 2 );
			gc.fill( );
			gc.globalAlpha = 1;
		}
		
		if( this.outline )
		{
			gc.strokeStyle = this.olcolour;
			gc.beginPath();
			gc.arc( 0, 0, this.r, 0, Math.PI * 2 );
			gc.stroke( );
		}
		gc.restore();
	},

	/* 
		if oval is completely bounded by bb return 1. If any part of oval lies in bb
		return 0, and return -1 if no points are in bb. 
	*/
	bounded_by:	function( bb )
	{
		var rv = -1;

		if( bb.inside( this.x - (this.w/2), this.y - (this.h/2), this.rot, this.x, this.y ) )		
			rv++;
		if( bb.inside( this.x + (this.w/2), this.y + (this.h/2), this.rot, this.x, this.y ) )		
			rv++;

		return rv;
	},

	has_point:  function( x, y )		/* for now we'll use the bounding box, but x,y is center not ul */
	{
		if( this.bb == null )
			this.bb = strator.bounding_box.mk( this.x - (this.w/2), this.y - (this.h/2), this.x + (this.w/2), this.y + (this.h/2) );

		return this.bb.inside( x, y, this.rot, this.x, this.y );
	},
}

strator.line = {
	spec:  [ "name", "type", "x1", "y1", "x2", "y2", "rot", "olcolour" ],		/* allows these to be shared by all line objects */
	type: "line",

	mk: function( x1, y1, x2, y2, colour )
	{
		var no = strator.base_ling.mk();

		no.x1 = x1 || 0;
		no.y1 = y1 || 0;
		no.x2 = x2 || 20;
		no.y2 = y2 || 20;
		no.rot = 0;
		no.olcolour = colour || "white";

		no.spec = this.spec;
		no.type = this.type;

		no.paint = this.paint;
		no.fixate = this.fixate;
		no.has_point = this.has_point;
		no.set_grabpt = this.set_grabpt;
		no.move = this.move;

		return no;
	},

	paint:  function( gc )		/* if rotation is set we actually change the x2,y2 point based on rotation and set rot back to 0 -- easier to do has_point w/o rot */
	{
		var pt;

		if( (this.rot ||0) != 0 )
		{
			pt = tools.rotate_pt( this.x2, this.y2, this.x1, this.y1, this.rot );
			this.x2 = pt[0];
			this.y2 = pt[1];
			
			this.bb = null;					/* force a new one now that line has shifted */
			this.rot = 0;
			this.changed = true;			/* force a resend at this point */
		}

		gc.strokeStyle = this.olcolour;
		gc.beginPath();
		gc.moveTo( this.x1, this.y1 );
		gc.lineTo( this.x2, this.y2 );
		gc.stroke( );
	},

	fixate:  function( )				/* must override default whitch ditches x2/y2 */
	{
		return;
	},

	has_point:  function( x, y )		/* no easy bounding box for a line... we allow some grace around the line for selection */
	{
		if( this.bb == null )
			this.bb =  strator.bounding_box.mk( this.x1, this.y1, this.x2, this.y2 );


		if( Math.abs(this.x1 - this.x2) < 5 )		/* close to vertical -- undefined slope */
		{
			if( x >= this.x1 - 5  &&  x <= this.x1 + 5  )
			{
				if( this.y1 < this.y2 && y >= this.y1 && y <= this.y2 )
					return true;
				if( y >= this.y2 && y < this.y1 )
					return true;
			}

			return false
		}

		if( ! this.bb.inside( x, y ) )
			return false;				/* quick test to detect pointer far away from line */

		var tolerance = 4;
		var lslope = tools.slope( this.x1, this.y1, this.x2, this.y2 );		/* slope of this line */
		var pslope = tools.slope( this.x1, this.y1, x, y );
		if( lslope == pslope )							/* likely only if slope is 0 */
			return true;

		if( lslope > 0 )				/* compare using tolerance based on lower left corner of bounding box */
		{
			if( tools.slope( this.bb.ulx + tolerance, this.bb.uly + this.bb.h, x, y ) >= lslope )		/* slope from lower point to x,y should be same or larger if above lower bound */
				if( tools.slope( this.bb.ulx, this.bb.uly + this.bb.h - tolerance, x, y ) <= lslope )   /* and from upper point to x,y should be same or smaller if below upper bound */
					return true;												/* x,y is within tolerance */
			return false;
		}

		/* negative slope, using upper left as anchor point */
		if( tools.slope( this.bb.ulx, this.bb.uly + tolerance, x, y ) >= lslope )			/* slope from lower point should be same or larger */
			if( tools.slope( this.bb.ulx + tolerance, this.bb.uly, x, y ) <= lslope )		/* and slope from upper point to x,y should be same or smaller */
				return true;

		return false;
	},

	set_grabpt:  function( x, y )				/* offset that we'll use when moving this dude */
	{
		this.drag_x1off = x - this.x1;	/* grab point is maintained as an offset */
		this.drag_y1off = y - this.y1;
		this.drag_x2off = x - this.x2;	/* grab point is maintained as an offset */
		this.drag_y2off = y - this.y2;
	},

	move:  function( x, y )
	{
		this.x1 = x - this.drag_x1off;
		this.y1 = y - this.drag_y1off;
		this.x2 = x - this.drag_x2off;
		this.y2 = y - this.drag_y2off;
		this.bb = null;
	},
}

/*
	free-hand scribbling anchored at x,y
*/
strator.scribble = {
	spec: [ "type", "name", "x", "y", "olcolour", "opacity", "chain" ],		/* should be shared by all scribbles */
	type: "scribble",

	mk: function( x, y, olcolour, fill, outline )
	{
		var i;
		var no = strator.base_ling.mk();


		no.x = x || 0;
		no.y = y || 0;
		no.olcolour = olcolour || "#00ff00";
		no.chain = [];										/* list of points that define the scribble */
		no.fill = false;
		no.outline = true;

		no.lastx = x;				/* for lineseg paint when creating so we update as they scribble */
		no.lasty = y;
		no.last_captured = false;

		no.type = this.type;					/* extend with constants from this object */
		no.spec = this.spec;

		no.has_point = this.has_point;
		no.paint = this.paint;
		no.fixate = this.fixate;
		no.move = this.move
		no.set_grabpt = this.set_grabpt;
		no.bounded_by = this.bounded_by;
	
		return no;
	},

	paint: function( gc )
	{
		gc.strokeStyle = this.olcolour;			/* these regardless of 'mode' */
		gc.beginPath();
		gc.moveTo( this.x, this.y );

		if( this.x2 != null )				/* active scribbling in procgress (rubberbanding) when x2 exists */
		{
			var dmx;							/* delta movement calculation */
			var dmy;

			this.last_captured = false;								/* if creation stopps w/o capturing last point, we capture in fixate */
			for( i = 0; i < this.chain.length; i += 2)
				gc.lineTo( this.chain[i], this.chain[i+1] );		/* draw evertything up to current point */

			dmx = this.lastx - this.x2;
			dmy = this.lasty - this.y2;
			if( Math.sqrt( (dmx * dmx) + (dmy * dmy) ) > 5 )	/* capture points only when mouse has moved more than just a few px */
			{
				this.chain.push( this.x2 );
				this.chain.push( this.y2 );
				this.lastx = this.x2;
				this.lasty = this.y2;
				this.last_captured = true
			}

			gc.lineTo( this.x2, this.y2 );		/* stroke to current mouse position */
			gc.stroke( );
			return;
		}

		for( i = 0; i < this.chain.length; i += 2)
			gc.lineTo( this.chain[i], this.chain[i+1] );		
		gc.stroke( );
	},

	has_point:  function( x, y )
	{
		var	i;

		if( ! this.chain ) 
			return false;

		if( this.bb == null )
		{
			var maxx = 0;
			var maxy = 0;
			var minx = 900000000;
			var miny = 900000000;

			for( i = 0; i < this.chain.length; i += 2 )
			{	
				if( this.chain[i] < minx )
					minx = this.chain[i];
				if( this.chain[i] > maxx )
					maxx = this.chain[i];

				if( this.chain[i+1] < miny )
					miny = this.chain[i+1];
				if( this.chain[i+1] > maxy )
					maxy = this.chain[i+1];
			}

			this.bb = strator.bounding_box.mk( minx, miny, maxx, maxy );		/* used for simple test */
		}

		if( this.bb.inside( x, y, this.rot, this.x, this.y ) )			/* if it's inside the overarching box, look further */
		{
			for( i = 0; i < this.chain.length; i += 2 )
			{
				if( x > this.chain[i] - 5  && x < this.chain[i] + 5 &&  y > this.chain[i+1] - 5 && y < this.chain[i+1] + 5 )		/* close to one of our points */
					return true;
			} 
		}

		return false;
	},
	
	fixate:  function()
	{
		if( ! this.last_captured )
		{
			this.chain.push( this.x2 );
			this.chain.push( this.y2 );			/* capture release point if needed */
		}
		this.x2 = this.y2 = null;				/* turn 'off' rubberbanding */

		return;
	},

	set_grabpt:  function( x, y )			/* point where mouse was for moving */
	{
		var i;

		this.grab_chain = [];

		this.offsetx = x - this.x;				/* standard offset of x,y from grab point */
		this.offsety = y - this.y;

		for( i = 0; i < this.chain.length; i += 2 )		/* must capture offset for all points in the chain */
		{
			this.grab_chain[i] = x - this.chain[i];
			this.grab_chain[i+1] = y - this.chain[i+1];
		}
	},

	move:  function( x, y )					/* move all points relative to x, y */
	{
		var i;

		this.x = x - this.offsetx; 
		this.y = y - this.offsety; 

		for( i = 0; i < this.chain.length; i += 2 )
		{
			this.chain[i] = x - this.grab_chain[i];
			this.chain[i+1] = y - this.grab_chain[i+1];
		}

		this.bb = null;
	},

	bounded_by:	function( bb )
	{
		var i;
		var	count = 0;

		for( i = 0; i < this.chain.length; i += 2 )
			if( bb.inside( this.chain[i], this.chain[i+1], 0, 0, 0 ) )
				count += 2;

		return count > 0 ? (count == this.chain.length ? 1 : 0) : 0; 
	}
}


/*
	If it acts like a ling, it must be a ling, unless it quacks.
	We create this like any other ling, but it has an additional property 
	that when given a list of lings any action applied to this is also
	applied to the group. 
*/
strator.group = {
	spec: [ "type", "name", "x", "y", "h", "w", "rot", "olcolour", "colour", "fill", "outline", "opacity" ],		/* do NOT include glist */
	type: "group",

	mk: function( x, y )
	{
		var no = strator.base_ling.mk();

		no.x = x || 0;
		no.y = y || 0;
		no.h = 0;					/* we compute h/w during fixate as so that for all paints after rubberbanding no additional thought needed */
		no.w = 0;					
		no.colour = "#0000ff"; 
		no.olcolour = "#ffffff"; 
		no.fill = true;
		no.outline = false
		no.can_edit = false;		
		no.opacity = 0.10;
		no.glist = [];

		no.can_change = false;			/* groups not allowed to be flagged as changed so they don't get sent round */
		no.type = this.type;			/* extend generic ling with box specific stuff that is shared by all boxes */
		no.spec = this.spec;
		no.paint = this.paint;			
		no.fixate = this.fixate;
		no.move = this.move;
		no.set_grabpt = this.set_grabpt;
		no.set_changed = this.set_changed;
		no.set_colour = this.set_colour;
		no.super_dup = no.dup;				/* the "super class" dup function we want to invoke from our extension of dup */
		no.dup = this.dup;

		return no;
	},

	paint: function( gc )
	{
		if( this.x2 != null )		/* allow rubberbanding to set x2/y2 -- compute new h/w and paint here */
		{
			if( this.x < this.x2 )
				var ulx = this.x;
			else
				var ulx = this.x2;
			if( this.y > this.y2 )
				var uly = this.y2;
			else
				var uly = this.y;

			this.w =  Math.abs( this.x - this.x2);
			this.h =  Math.abs( this.y - this.y2);

			if( this.fill )
				gc.strokeStyle = this.colour;
			else
				gc.strokeStyle = this.olcolour;
			gc.strokeRect( ulx, uly, this.w, this.h );		/* rubberbanding always strokes */

			return;
		}

		gc.globalAlpha = this.opacity != null ? this.opacity : 1;		/* group is always filled */
		gc.fillStyle = this.colour;
		gc.fillRect( this.x, this.y, this.w, this.h );
		gc.globalAlpha = 1;

		gc.strokeStyle = "white";				/* add corners */
		gc.beginPath();
		gc.moveTo( this.x, this.y+10 );
		gc.lineTo( this.x, this.y );
		gc.lineTo( this.x+10, this.y );

		gc.strokeStyle = "white";
		gc.moveTo( this.x + this.w -10, this.y + this.h );
		gc.lineTo( this.x + this.w, this.y + this.h );
		gc.lineTo( this.x + this.w, this.y + this.h-10 );
		gc.stroke();
	},

	fixate: function( )				/* called at the end of 'creation' to fix things up (ulx/uly set properly if x,y turn out not to be ul corner */
	{
		this.x =  this.x > this.x2 ? this.x2 : this.x;
		this.y =  this.y > this.y2 ? this.y2 : this.y;
		this.x2 = this.y2 = null;						/* ditch these now so that paint uses h/w and doesn't constantly compute them */
		
		this.bb = strator.bounding_box.mk( this.x, this.y, this.x + this.w, this.y + this.h ); 	/* must set bb at fixate */
		return this.bb;
	},

	set_changed: function( v )
	{
		var i;
		for( i = 0; i < this.glist.length; i++ )
			this.glist[i].set_changed( v );

		this.changed = false;			/* group can never change since we don't send it anywhere */
	},

	set_colour: function( colour, olcolour )
	{
		var i;
		for( i = 0; i < this.glist.length; i++ )
			this.glist[i].set_colour( colour, olcolour );
	},

	set_grabpt:  function( x, y )				/* offset that we'll use when moving this dude -- must set for all grouped objects */
	{
		var i;

		this.drag_xoff = x - this.x;			/* grab point is maintained as an offset */
		this.drag_yoff = y - this.y;

		for( i = 0; i < this.glist.length; i++ )
			this.glist[i].set_grabpt( x, y );
	},

	move:  function( x, y )					/* drive the move function for each grouped object in addtion to our shadow */
	{
		var i;

		this.x = x - this.drag_xoff;		/* adjust x,y anchor relative to the offset when grab point computed */
		this.y = y - this.drag_yoff;

		for( i = 0; i < this.glist.length; i++ )
			this.glist[i].move( x, y );
		
		this.bb = null;
	},

	/* 
		use the base_ling dup function to do the mundane stuff, and we just need to extend to force a dup of the objects in glist 
		This is why glist is NOT included in the spec list (base dup would copy it and it would be wrong). 
		The return is an array of objects that the caller is expected to know how to deail with (pushing them onto the 
		coterie we hope, and using the last in the list as the 'move' object if this is an interactive dup. 
	*/
	dup:	function( )					
	{
		var no;			/* the new group object */
		var dgo;		/* duplicated group scribbling object */
		var	i;
		var	rlist = [];		/* return list */

		no = this.super_dup( );

		for( i = 0; i < this.glist.length; i++ )		/* dup each scribbling we reference */
		{
			dgo = this.glist[i].dup( );
			rlist.push( dgo );					/* list to return which will include no as the last object */
			no.glist.push( dgo );				/* add to the group */
		}

		rlist.push( no );			/* finally add the new object */

		return rlist;
	}

}
