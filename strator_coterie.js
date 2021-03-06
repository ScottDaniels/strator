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
	Mnemonic:	strator_coterie.js
	Abstract: 	The coterie is used to manage a set of scribblings. Scribblings are 
				assumed to have  these functions:
        			bounded_by(bb)	(return true if the ling is completely inside of the given bounding box)
        			dup()			(return a dupliate ling)
        			fixate()		(make final adjustments after rubberbanding at creation or moving)
        			has_point(x,y)	(return true if the point is inside or on the edge of the ling)
        			mk				(return a newly created ling)
        			move			(adjust the location of the ling)
					paint( gc ) 	(gc is the html-5 canvas graphcs context)
        			set_changed()	(sets teh changed flag for the ling. if it's a group sets for all sublings)
        			set_colour(colour)		(sets the colour for the ling. if it's a group then sets for all sublings)
        			set_grabpt(x,y)	(sets the point where the mouse was when the ling was 'grabbed' for motion)
					to_str() 		(generate a string that can be read by another strator to produce the ling)
					to_ps()			(generate the postscript needed to render the object)
					update( h )		(h is a symtab hash of key/value pairs to update)


				Scribblings will be give a name as they are added to the mix.  As scribblings
				are painted, their changed property is checked and if it is true, then the 
				output from the scribbling's to_str() function will be sent to the repeater 
				using the session provided. 

	Requires	tools.js,  symtab.js

	Author:		E. Scott Daniels
	Date:		22 Nov 2012
----------------------------------------------------------------------------------------------
*/
var strator = strator || {};			/* don't depend on order that html includes us */

/* ------------------- scribbling manager --------------------------------------*/
strator.coterie = {
	mk: function( )			/* manage a clique of scribblings */
	{
		var idn;
		var no;

		no = Object.create( strator.coterie );

		no.lings = [];
		no.nameref = symtab.mk();
		idn = Math.floor( Math.random() * 10000 );		/* crude truncation */
		no.id = "s" + idn.toString( 16 );				/* all scribblings assigned here will get this id + a sequential num */
		no.ididx = 0;

		return no;
	},

	/*
		save accomplished by convencing the browser we have somehting to download and let
		it prompt and save the information. It works, but it's a sucky interface. 
	*/
	save_file: function( )
	{
		var stuff = "";
		var	i;

		for( i = 0; i < this.lings.length; i++ )		
			if( this.lings[i].type != "group" )				/* we don't save group definitions */
			 	stuff += this.lings[i].to_str() + "\n";
		tools.save2file( stuff, "/tmp/stuff" );
	},

	/*
		create a bounding box of all lings in the coterie
	*/
	get_bb: function( pad )
	{
		pad = pad | 0;

		this.bb = null;								/* I don't think we'll do this enough to warrent tracking it and only gen if changes made */
		for( i = 0; i < this.lings.length; i++ )		
		{
			if( this.lings[i].type != "group" )				/* groups don't need to be considered */
			{
				if( this.bb == null )
					this.bb = this.lings[i].get_bb().dup();			/* first is just a duplicate */
				else
					this.bb.engulf( this.lings[i].get_bb() );			/* expand our bb to include the ling's box */
			}
		}

		if( this.bb == null ) {
			this.bb = strator.bounding_box.mk( 0, 0, this.w, this.h )
		} else {
			this.bb.height += pad;
			this.bb.width += pad;
		}
		return this.bb;
	},
	
	/*
		save as a plain postscript file
	*/
	save_ps: function( invert, blackbg, scale )
	{
		var stuff;
		var	dt;

		var padding = 10;

		scale = scale || 0.5;

		this.get_bb( );
		dt = new Date();
		colour_set = colour.set.mk( invert, 255 );

		stuff = "%!PS-Adobe-2.0\n";
		stuff += "%%Title: untitled\n";
		stuff += "%%Creator: 'Strator " + strator.version + "\n";
		stuff += "%%CreationDate: " + dt.toISOString() + "\n";
		stuff += "%%BeginSetup\n";
		stuff += "mark {\n";
		stuff += "%BeginFeature: *PageRegion C\n";
		stuff += "<< /PageSize [" + ((this.bb.w+padding)*scale) + " " + ((this.bb.h+padding)*scale) + "] >> setpagedevice\n";
		stuff += "%EndFeature\n";
		stuff += "} stopped cleartomark\n";
		stuff += "%%EndSetup\n";
		if( scale != 1 )
			stuff += scale + " " + scale + " scale\n";

		if( blackbg )
			stuff += "0 0 moveto\n" + (this.bb.w +padding) + " 0 rlineto\n0 " + (this.bb.h+padding) + " rlineto\n-" + (this.bb.w + padding) + " 0 rlineto closepath fill\n"; 

		for( i = 0; i < this.lings.length; i++ )		
		{
			if( this.lings[i].type != "group" )				/* groups don't need to be considered */
				stuff += "%ling: " + i +"\n" + this.lings[i].to_ps( this.bb.ulx-(padding/2), this.bb.uly + this.bb.h + (padding/2), colour_set ) + "\n";
		}

		tools.save2file( stuff, "/tmp/stuff" );
	},

	/*
		save as encapsulated postscript
	*/
	save_eps: function( invert, blackbg, scale )
	{
		var stuff;
		var	dt;

		var padding = 10;

		scale = scale || 0.5;

		this.get_bb( );
		dt = new Date();
		colour_set = colour.set.mk( invert, 255 );

		stuff = "%!PS-Adobe-2.0 EPSF-2.0\n";
		stuff += "%%Title: untitled\n";
		stuff += "%%Creator: 'Strator " + strator.version + "\n";
		stuff += "%%CreationDate: " + dt.toISOString() + "\n";
		stuff += "%%BoundingBox: 0 0 " + ((this.bb.w + padding)*scale) + " " + ((this.bb.h + padding)*scale) + "\n";
		stuff += "%%Magnification: 1.0000\n";
		stuff += "%%EndComments\n";
		stuff += "%%BeginProlog\n";
		stuff += "%%EndProlog\n";
		if( scale != 1 )
			stuff += scale + " " + scale + " scale\n";

		if( blackbg )
			stuff += "0 0 moveto\n" + (this.bb.w +padding) + " 0 rlineto\n0 " + (this.bb.h+padding) + " rlineto\n-" + (this.bb.w + padding) + " 0 rlineto closepath fill\n"; 

		for( i = 0; i < this.lings.length; i++ )		
		{
			if( this.lings[i].type != "group" )				/* groups don't need to be considered */
				//stuff += "%ling: " + i +"\n" + this.lings[i].to_ps( this.bb.ulx-(padding/2), this.bb.uly + this.bb.h + (padding/2) ) + "\n";
				stuff += "%ling: " + i +"\n" + this.lings[i].to_ps( this.bb.ulx-(padding/2), this.bb.uly + this.bb.h + (padding/2), colour_set ) + "\n";
		}

		stuff += "%%Trailer\n%EOF\n";

		tools.save2file( stuff, "/tmp/stuff" );
	},

	/*
		invoked when one of the file 'save' buttons is clicked. 
		how is a string indicating how we should save the data: file, ps, eps
		if invert is true black/white will be exchanged.
		if blackbg is true the area within the bounding box will be fillwd with black
	*/
	save_data: function( how, invert, blackbg )
	{
		switch( how )
		{
			case "ps":
				this.save_ps( invert | false, blackbg | false );
				break;

			case "eps":
				this.save_eps( invert | false, blackbg | false );
				break;

			default:
				this.save_file( )
				break;
		}
	},

	load:  function( buffer )			/* buffer is a newline separated buffer of ling definitions (assuming from read file) */
	{
		var i;
		var h;
		var recs;
		
		recs = buffer.split( "\n" );
	
		for( i = 0; i < recs.length -1; i++ )		/* we get a 'blank' element after the terminating newline -- annoying */
		{
			h = tools.str2hash( recs[i].replace( /[ \t]+$/, "" ) );
			this.msg( h, true );				/* update the mix as though it came from the repeater */
		}
	},

	dump:  function( )		/* dump the list to the console log for debugging */
	{
		var i;

		console.log( "dump: " + this.lings.length + " objects exist in coterie" );
		for( i = 0; i < this.lings.length; i++ )		
			console.log( "dump: " + this.lings[i].to_str() );
	},

	/*
		push the current set of lings on the saved stack clearing the current stack and the slate
	*/
	push:  function( )
	{
		if( this.lstack == null )		/* ensure a ling and nameref stack to push on */
			this.lstack = [];
		if( this.nstack == null )
			this.nstack = [];
		this.lstack.push( this.lings );
		this.nstack.push( this.nameref );

		this.lings = [];
		this.nameref = symtab.mk();
	},

	/*
		pop the most reciently saved set of lings if there; no harm if not. 
	*/
	pop:  function( )
	{
		if( this.lstack == null && this.lstack.length > 0  )
			return;

		this.lings = this.lstack.pop();
		this.nameref = this.nstack.pop();
	},

	/*
		drop the most recently saved set of lings
	*/
	drop:  function()
	{
		if( this.lstack == null && this.lstack.length > 0  )
			return;
		
		this.lstack.pop();
		this.nstack.pop();
	},

	/*
		if save is false we will not save on undo list --- allows a drop all when undoing a clear
	*/
	drop_all:  function( save )
	{
		if( save == null )
			save = true;

		if( save )
		{
			this.undo_lings = this.lings;
			this.undo_nameref = this.nameref; 
		}
		else
			this.undo_lings = this.undo_nameref = null;		/* when not saving, ditch the last saved thing */

		this.lings = [];
		this.nameref = symtab.mk();
	},

	/*
		undo a clear (drop_all)
	*/
	restore_lings: function( )
	{
		if( this.undo_lings )
		{
			this.lings = this.undo_lings;
			this.nameref = this.undo_nameref
			this.undo_lings = this.undo_nameref = null;		
		}
	},

	/*
		returns true if the scribblings can be restored from undo
	*/
	can_restore: function()
	{
		return this.undo_lings != null;
	},

	/* 
			message from the farside (converted to hash for us) -- update the named object, or execute a command 
			This is also driven when we load scribblings from a file; once for each line in the file. 
			changed is set to true when we load a file to mark each element as changed so it broadcasts out.
	*/
	msg:  function( h, changed )			
	{
		var name;				/* scribblings have names NOTHING else does (this will bite me someday) */
		var mty;				/* type */
		var lty;				/* type */
		var ob;					/* generic object */
		var colour;

		changed = changed || false;

		mty = h.lookup( "mtype" );		/* message type (1st token) */

		switch( mty )
		{
			case "ling":					/* a change to an existing scribbling, or a new one to be added */
					name = h.lookup( "name" );

					if( name != null )					/* right now everything must have a name */
					{
						lty = h.lookup( "type" );		/* scribbling type */

						if( (ob = this.nameref.lookup( name )) != null )		/* already in the mix, just update it */
							ob.update( h );					
						else
						{		
							(ob = strator[lty].mk()).update( h );	/* make the generic object type, then update with hash things */
							ob.name = name;							/* must give it the remote name (update doesn't change name) */
							this.add( ob );							/* add to our drawing coterie */
						}

						ob.changed = changed;
					}
					break;

			case "request":							/* drawing action to be taken */
					switch( h.lookup( "cmd" ) )
					{
						case "clear":
							this.drop_all( false );				/* clear command does not save things */
							break;

						case "raise2top":
							this.raise_byname_totop( h.lookup( "name" ) );
							break;

						case "raise":
							this.raise_byname( h.lookup( "name" ) );
							break;

						case "lower":
							this.lower_byname( h.lookup( "name" ) );
							break;

						case "lower2bot":
							this.lower_byname_tobot( h.lookup( "name" ) );
							break;

						case "delete":			/* delete ling by name sent by another instance */
							this.delete_by_name( h.lookup( "name" ), false );		/* we don't push it since we didn't initiate the delete */
							break;
					}
					break;
	
			default:
					break;
		}
	},

	add:  function( ling )					/* add a scribbling to the mix  with an optional name */
	{
		if( ling == null )					/* prevent accidents */
			return;

		this.lings.push( ling );			/* front of canvas is the end of the array */

		if( ling.name == null )				/* assign one */
		{
			ling.name = this.id + "." + this.ididx.toString();
			this.ididx += 1;
		}

		this.nameref.save( ling.name, ling );	/*  reference by ling's name */
	},

	send_refresh:  function( session, tag )
	{
		var i;

		if( session == null )
			return;

		for( i = 0; i < this.lings.length; i++ )					/* send from the back to the front */
			if( this.lings[i].can_change )							/* only things that can change can be sent */
				session.send( tag + " " + this.lings[i].to_str() );
	},

	/*
		paint everything. sends deltes for things deleted since last paint. if a scribbling
		has changed, or the force change flag is set, then the scribbling is sent to the 
		repeater for broadcast. 
	*/
	paint:  function( gc, session, force_changed )		/* accept gc here to allow painting on any canvas (preview vs active etc.) */
	{
		var i;

		if( session != null && this.delete != null )		/* send the list of lings that were ereased since the last paint call */
		{
			for( i = 0; i < this.delete.length; i++ )		
				session.send( "request; cmd:delete; name:" + this.delete[i].name );
		}

		this.delete = null;

		if( this.lings.length <= 0 )
		{
			strator.splash.paint( );
			return;
		}

		for( i = 0; i < this.lings.length; i++ )				/* draw from the back to the front */
		{
			this.lings[i].paint( gc );				
			if( (this.lings[i].changed || force_changed) && session != null )		/* send out to repeater if it has changed */
			{
				session.send( this.lings[i].to_str() );
				this.lings[i].changed = false;
			}
		}
	},

	under_foot:  function( x, y )					/* find the uppermost object under the coordinates */
	{
		var i;

		for( i = this.lings.length - 1; i >= 0; i-- )
			if( this.lings[i].has_point( x, y ) )
				return this.lings[i];

		return null;
	},

	last_thing:  function( )							/* return the last thing added -- rubber banding mostly */
	{
		return this.lings[-1];
	},

	extract_ling:  function( i )					/* slice out the ling and return the object */
	{
		var ob;
		ob = this.lings[i];

		this.lings.splice( i, 1 );				/* removes 1 element at 1 */
		return ob;
	},

	lower_byname:  function( name )				/* find named ling and lower it one */
	{
		var i;
		var hold;

		for( i = 1; i <= this.lings.length - 1;  i++ )			/* no sense in doing something with the one at the bottom (0) */
		{
			if( this.lings[i].name == name )
			{
				hold = this.lings[i-1];
				this.lings[i-1] = this.lings[i];
				this.lings[i] = hold;
				return;										/* only delete one if overlapping */
			}
		}
	},

	lower_byname_tobot:  function( name )				/* lower named obj to the bottom of the pile */
	{
		var i;
		var hold;

		for( i = 1; i <= this.lings.length - 1;  i++ )			/* no sense in doing something with the one at the bottom (0) */
			if( this.lings[i].name == name )
			{
				hold = this.extract_ling( i );
				this.lings.unshift( hold );					/* another winning function name -- unshift? */
				return;										/* only delete one if overlapping */
			}

	},

	raise_byname_totop:  function( name )				/* bring the named ling to the top */
	{
		var i;
		var hold;

		for( i = this.lings.length - 2; i >= 0; i-- )		/* most recently (top) things are pushed, so work back */
			if( this.lings[i].name == name )
			{
				hold = this.extract_ling( i );
				this.lings.push( hold );
				return;										/* only delete one if overlapping */
			}
	},

	raise_byname:  function( name )				/* raise the named obj by one */
	{
		var i;
		var hold;

		for( i = this.lings.length - 2; i >= 0; i-- )		/* most recently (top) things are pushed, so work back */
			if( this.lings[i].name == name )
			{
				hold = this.lings[i+1];
				this.lings[i+1] = this.lings[i];
				this.lings[i] = hold;
				return;										/* only delete one if overlapping */
			}
	},

				/* the raise/lower by position functions return the ling's name so we can send a message to raise/lower by name to others */
	lower_under:  function( x, y )				/* find the topmost object under x,y and raise it */
	{
		var i;
		var hold;
		var	name;

		for( i = this.lings.length - 1; i > 0; i-- )		/* most recently (top) things are pushed, so work back */
			if( this.lings[i].has_point( x, y ) )
			{
				name = this.lings[i].name; 
				hold = this.lings[i-1];
				this.lings[i-1] = this.lings[i];
				this.lings[i] = hold;
				return name;
			}

		return null;
	},

	lower_tobot:  function( x, y )				/* find the topmost object under x,y and push it to the bottom of the pile */
	{
		var i;
		var hold;
		var	name;

		for( i = this.lings.length - 1; i > 0; i-- )		/* most recently (top) things are pushed, so work back */
			if( this.lings[i].has_point( x, y ) )
			{
				name = this.lings[i].name; 
				hold = this.extract_ling( i );
				this.lings.unshift( hold );					/* another winning function name -- unshift? */
				return name;
			}

		return null;
	},

	raise_totop:  function( x, y )				/* find the topmost object under x,y and raise it all the way to the top */
	{
		var i;
		var hold;
		var	name;

		for( i = this.lings.length - 2; i >= 0; i-- )		/* most recently (top) things are pushed, so work back */
			if( this.lings[i].has_point( x, y ) )
			{
				name = this.lings[i].name; 
				hold = this.extract_ling( i );
				this.lings.push( hold );
				return name;
			}

		return null;
	},

	raise_under:  function( x, y )				/* find the topmost object under x,y and raise it */
	{
		var i;
		var hold;
		var	name;

		for( i = this.lings.length - 2; i >= 0; i-- )		/* most recently (top) things are pushed, so work back */
			if( this.lings[i].has_point( x, y ) )
			{
				name = this.lings[i].name; 
				hold = this.lings[i+1];
				this.lings[i+1] = this.lings[i];
				this.lings[i] = hold;
				return name;
			}

		return null;
	},

	/* 
		create a list of lings which are completely contained in the bounding box passed in 
		accuracy is 0 -- capture the object if any point is inside bb, 1 capture only when 
		all points are inside (default).
	*/
	list_inside:  function( bb, accuracy )				
	{
		var i;
		var	list = [];

		accuracy = accuracy || 1;
		for( i = 0; i < this.lings.length - 1; i++ )		
			if( this.lings[i].can_change  && this.lings[i].bounded_by( bb ) == accuracy )		/* return is -1 for no points bounded, 0 some points bounded, 1 all points bounded */
				list.push( this.lings[i] );

		return list.length > 0 ? list : null;
	},

	delete_under:  function( x, y, push )			/* find the topmost object under x,y and trash it, returns true if something deleted */
	{
		var i;

		for( i = this.lings.length - 1; i >= 0; i-- )
		{
			if( this.lings[i].has_point( x, y ) )		
			{
				if( push  )									/* push on the delete stack to send to others so they delete too */
				{
					if( this.delete == null )
						this.delete = [ this.lings[i] ];
					else
						this.delete.push( this.lings[i] );
				}

				if( this.nameref.lookup( this.lings[i].name ) != null )
					this.nameref.del( this.lings[i].name );

				this.lings.splice( i, 1 );					/* remove item i from the array (splice, really?) */
				return true;								/* only delete one if overlapping */
			}
		}

		return false;
	},

	delete_by_name:  function( name, push )					/* remove the named object from the lings list */
	{
		var i; 

		this.nameref.del( name );

		for( i = this.lings.length - 1; i >= 0; i-- )		/* must search manually to cut it out */
		{
			if( this.lings[i].name != null && this.lings[i].name == name )
			{
				if( push  )
				{
					if( this.delete == null )
						this.delete = [ this.lings[i] ];
					else
						this.delete.push( this.lings[i] );
				}

				var na_head = this.lings.slice( 0, i );		/* slice out the deleted object */
				var na_tail = this.lings.slice( i+1 );
				this.lings = na_head.concat( na_tail );
				return;										/* only delete one if overlapping */
			}
		}

	},

	delete_last:  function()					/* deletes the last object added to the scribblings list */
	{
		this.lings.pop();
	}
}
