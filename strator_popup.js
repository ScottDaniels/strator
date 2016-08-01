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
	Mnemonic:	strator_popup.js
	Abstract: 	Defines the object associated with each popup type. These are based on the 
				base popup object in tools and extended as is needed. 

	Requires	tools.js,  symtab.js

	Author:		E. Scott Daniels
	Date:		05 January 2013
----------------------------------------------------------------------------------------------
*/
var strator = strator || {};			/* don't depend on order that html includes us */

strator.conf_popup = {
	mk: function( divname, target )
	{
		var no;

		no = new tools.basic_popup( divname, target );

		no.setup = this.setup;					/* setup executed just before division is shown -- fills in current values */
		no.accept = this.accept;

		doctools.set_onclick( strator.DOC_UPDATE_CONN,  function( e ) { no.target.send( "scribble_r list" ); no.target.send( "scribble_r glist" ); } );		/* update lists */
		doctools.set_onclick( strator.DOC_APPLY_CONN,  function( e ) { no.accept( false ); } );							/* apply changes made in text entry */
		doctools.set_onclick( strator.DOC_DISCONN_CONN,  function( e ) { no.target.disc( ); } );						/* disconnect the existing session */
		doctools.set_onclick( strator.DOC_RECONN_CONN,  function( e ) { no.accept( true ); } );							/* appy any changes and then reconnect */
		doctools.set_onclick( strator.DOC_RWRO_CONN,  function( e ) { no.target.send( "scribble_r readonly" ); } );

		doctools.set_onclick( strator.DOC_CANCEL_CONN,  function( e ) { no.hide( ); } );

		doctools.set_input( strator.DOC_HOST,  function( e ) { no.capture_change( "host", this.value, null, false ); } );
		doctools.set_input( strator.DOC_USER,  function( e ) { no.capture_change( "user", this.value, null, false ); } );
		doctools.set_input( strator.DOC_UGROUP,  function( e ) { no.capture_change( "group", this.value, null, false ); } );
		doctools.set_input( strator.DOC_PASSWD,  function( e ) { no.capture_change( "passwd", this.value, null, false ); } );

		/* slider and rescale buttons must be set in the driver even though they appear in the conf popup */
		return no;
	},

	setup:  function( )		/* just before show, fill in current info */
	{
		//if( (ta = document.getElementById( strator.DOC_CANVSIZE_CONN)) != null )	/* do NOT set slider value as we don't have access to the current scale */
			//ta.value = (this.scale_y * 100).toFixed(0);

		doctools.set_value( strator.DOC_UGROUP, this.target.group );
		doctools.set_value( strator.DOC_USER, this.target.user );
		doctools.set_value( strator.DOC_HOST, this.target.farside );
		doctools.set_value( strator.DOC_PASSWD, "" );

		return document.getElementById( strator.DOC_HOST );		/* return focus object */
	},

	accept: function( reconn )			/* accept changes forcing a reconnection if reconn is set -- we never hide on accept for this popup */
	{
		var changes = this.changes;
		var did_reconn = false;

		doctools.set_value( strator.DOC_PASSWD, "" );		/* reset this field immediately */
		this.changes = null;

		if( this.target )
		{
			did_reconn = this.target.update( changes );
			if( reconn && ! did_reconn )			/* must reconnect, and didn't change the connection during update... */
				this.target.conn(  );
		}
	}	
}

strator.colour_popup = {
	mk: function( divname, target )
	{
		var no;
		var colournames;
		var i;

		//no = tools.basic_popup.mk( divname, target );
		no = new tools.basic_popup( divname, target );

		/* colour x boxes in popup */
		colournames = [ "cyan", "blue", "green", "bluegreen", "red", "orange", "pink", "purple", "yellow", "gray", "white", "black" ];
		for( i = 0; i < colournames.length; i++ )
		{
			doctools.set_onclick( "outline-sel-" + colournames[i], function( e ) { target.olcolour = this.value; target.show_state( ); } );
			doctools.set_onclick( "fill-sel-" + colournames[i],  function( e ) { target.colour = this.value; target.show_state( ); } );
		}

		doctools.set_onclick( strator.DOC_FILL,    function( e ) { target.fill_things = true;  target.outline_things = false } );
		doctools.set_onclick( strator.DOC_OUTLINE, function( e ) { target.fill_things = false; target.outline_things = true; } );
		doctools.set_onclick( strator.DOC_FILLOUT, function( e ) { target.fill_things = target.outline_things = true; } );
		
		return no;
	}
}

strator.ctl_popup = {
	mk: function( divname, target )
	{
		var no;
		var action_types;
		var	i;
		var name;

		//no = tools.basic_popup.mk( divname, target );
		no = new tools.basic_popup( divname, target );

		action_types = [ "group-radio", "erase-radio", "move-radio", "copy-radio", "recolour-radio", "edit-radio", "raise-radio", "lower-radio", "rotate-radio", "ling-sel-box",  "ling-sel-circle",  "ling-sel-line",  "ling-sel-text",  "ling-sel-oval",  "ling-sel-scribble" ];
		for( i = 0; i < action_types.length; i++ )
		{
			doctools.set_onclick( action_types[i] + "-l", function( e ) { target.dmodel = parseInt( this.value ); } );
			doctools.set_onclick( action_types[i] + "-r",  function( e ) { target.dmoder = parseInt( this.value ); } );
		}

		// action_types = [ "smsize-radio", "mdsize-radio", "lgsize-radio" ];
		//for( i = 0; i < action_types.length; i++ )
			//doctools.set_onclick( action_types[i], function( e ) { target.txtsize = parseInt( this.value ); } );

		return no;
	}
}

strator.sedit_popup = {					/* text edit popup, takedown is a teardown function to drive (probably to repaint)  */
	mk: function( divname, takedown )
	{
		var no;
		var action_types;
		var	i;
		var name;

		no = new tools.basic_popup( divname, null );
		no.setup = this.setup;

		/* paintstyle and opacity */
		doctools.set_onclick( strator.DOC_SEDIT_ACCEPT,  function( e ) { no.accept( true ); } );
		doctools.set_onclick( strator.DOC_SEDIT_CANCEL,  function( e ) { no.hide( false ); } );
		doctools.set_input( strator.DOC_SEDIT_OPAC, function( e ) { no.capture_change( "opacity", this.value, strator.DOC_SEDIT_OPACVAL, false ); }, false );

		doctools.set_input( strator.DOC_SEDIT_ROT, function( e ) { no.capture_change( "rot", this.value, null, false ); } );		/* rotation */
		doctools.set_input( strator.DOC_SEDIT_STARTD, function( e ) { no.capture_change( "startr", this.value, null, false ); } );	/* circle things */
		doctools.set_input( strator.DOC_SEDIT_ENDD, function( e ) { no.capture_change( "endr", this.value, null, false ); } );

		/* fill/outline radio buttons */
		doctools.set_onclick( strator.DOC_SEDIT_FILL, function( e ) { no.capture_change( "fill", true, null, false ); no.capture_change( "outline", false, null, false ); } );
		doctools.set_onclick( strator.DOC_SEDIT_OUTLINE, function( e ) { no.capture_change( "fill", false, null, false ); no.capture_change( "outline", true, null, false ); } );
		doctools.set_onclick( strator.DOC_SEDIT_FILLOUT, function( e ) { no.capture_change( "fill", true, null, false ); no.capture_change( "outline", true, null, false ); } );

		no.takedown = takedown;

		return no;
	},

	setup: function( target )			/* target is the scribbling being edited */
	{
		var ta;
		var ota;
		var fta;	
		var bta;

		this.target = target;

		ota = document.getElementById( strator.DOC_SEDIT_OUTLINE );
		fta = document.getElementById( strator.DOC_SEDIT_FILL );
		bta = document.getElementById( strator.DOC_SEDIT_FILLOUT );

		ota.checked = false;
		fta.checked = false;
		bta.checked = false;

		if( target.fill && target.outline )
			bta.checked = "true";
		else
			if( target.fill )
				fta. checked = "true";
			else
				ota.checked = "true";

		if( (ta = document.getElementById( strator.DOC_SEDIT_OPAC )) != null )		
			ta.value = target.opacity * 100;
		if( (ta = document.getElementById( strator.DOC_SEDIT_OPACVAL )) != null )
			ta.innerHTML = target.opacity * 100;

		switch( target.type )
		{
			case "circle":			/* turn off rotation and turn on start/end radian prompts */
				if( (ta = document.getElementById( strator.DOC_SEDIT_ROTDIV )) != null )
					ta.style.display = "none";
				if( (ta = document.getElementById( strator.DOC_SEDIT_CIRCDIV )) != null )
					ta.style.display = "block";
				if( (ta = document.getElementById( strator.DOC_SEDIT_PAINTDIV )) != null )
					ta.style.display = "block";

				if( (ta = document.getElementById( strator.DOC_SEDIT_ENDD )) != null )
					ta.value = target.endr * tools.RAD2DEG;

				if( (ta = document.getElementById( strator.DOC_SEDIT_STARTD )) != null )
					ta.value = target.startr * tools.RAD2DEG;
				break;

			case "line":			/* turn off both paint style and start/end radian prompts */
				if( (ta = document.getElementById( strator.DOC_SEDIT_ROTDIV )) != null )
					ta.style.display = "none";
				if( (ta = document.getElementById( strator.DOC_SEDIT_CIRCDIV )) != null )
					ta.style.display = "none";
				if( (ta = document.getElementById( strator.DOC_SEDIT_PAINTDIV )) != null )
					ta.style.display = "none";

				if( (ta = document.getElementById( strator.DOC_SEDIT_ROT )) != null )		
					ta.value = target.rot;
				break;

			default:				/* turn off start/end radin prompt */
				if( (ta = document.getElementById( strator.DOC_SEDIT_ROTDIV )) != null )
					ta.style.display = "block";
				if( (ta = document.getElementById( strator.DOC_SEDIT_CIRCDIV )) != null )
					ta.style.display = "none";
				if( (ta = document.getElementById( strator.DOC_SEDIT_PAINTDIV )) != null )
					ta.style.display = "block";

				if( (ta = document.getElementById( strator.DOC_SEDIT_ROT )) != null )		/* last assigned to ta gets focus */
					ta.value = target.rot;
				break;
		}

		return ta;
	}
}

strator.tedit_popup = {					/* text edit popup */
	mk: function( divname, takedown )
	{
		var no;
		var action_types;
		var	i;
		var name;

		no = new tools.basic_popup( divname, null );
		no.setup = this.setup;

		doctools.set_input( strator.DOC_EDIT_TXTROT, function( e ) { no.capture_change( "rot", this.value, null, false ); } );	/* when invoked, this is the text entry object */
		//doctools.set_input( strator.DOC_EDIT_TXTSIZE, function( e ) { no.capture_change( "size", this.value, null, false ); } );
		doctools.set_input( strator.DOC_EDIT_TXTSIZE, function( e ) { no.capture_change( "size", this.value, strator.DOC_EDIT_TXTSIZVAL, false ); } );
		doctools.set_input( strator.DOC_EDIT_TEXT, function( e ) { no.capture_change( "text", this.value, null, false ); } );
		doctools.set_keypress( strator.DOC_EDIT_TEXT, function( e ) { if( e.which == 0x0d ) no.accept( true ); } );				/* allow an enter in the text box to apply changes */ 

		doctools.set_onclick( strator.DOC_EDIT_ACCEPT,  function( e ) { no.accept( true ); } );
		doctools.set_onclick( strator.DOC_EDIT_CANCEL,  function( e ) { no.hide( false ); } );

		no.takedown = takedown;
		return no;
	},

	setup: function( target )			/* target is the scribbling being edited */
	{
		var ta;

		this.target = target;

		if( (ta = document.getElementById( strator.DOC_EDIT_TXTROT )) != null )		
			ta.value = target.rot;

		if( (ta = document.getElementById( strator.DOC_EDIT_TXTSIZE )) != null )		
			ta.value = target.size;

		if( (ta = document.getElementById( strator.DOC_EDIT_TEXT )) != null )		/* this is last so it receives focus */
			ta.value = target.text;


		return ta;
	}
}

strator.file_popup = {					/* load/save and other things */
	mk: function( divname, loaded, save_data )
	{
		var no;
		var action_types;
		var	i;
		var name;

		no = new tools.basic_popup( divname, null );		/* kept in scope for functions passed to onclick */

		doctools.set_onclick( strator.DOC_CANCEL_FILE, function( e ) { no.hide( false ); } );					/* hide w/o applying any pending changes */
		doctools.set_onclick( strator.DOC_LOAD_FILE, function( e ) { no.apply_load(); no.hide( false ); } );	/* since we invoke the specialised apply function, pass false to hide here too */
		doctools.set_change( strator.DOC_SEL_FILE, function( e ) { no.capture_change( "filename", this.files[0], null, false ); } ); /* file from selection menu */

		no.save_data = save_data;			/* external function to do the save */
		doctools.set_onclick( strator.DOC_SAVE_FILE, 	 function( e ) { no.save_data( "file" ); no.hide( false ); } );
		doctools.set_onclick( strator.DOC_SAVE_PS, function( e ) {  no.save_data( "ps" ); no.hide( false ); } );
		doctools.set_onclick( strator.DOC_SAVE_EPS, function( e ) { no.save_data( "eps" ); no.hide( false ); } );

		doctools.set_onclick( strator.DOC_SAVE_INVERT,    function( e ) { no.invert = !no.invert; } );
		doctools.set_onclick( strator.DOC_SAVE_BLACKBG,    function( e ) { no.blackbg = !no.blackbg; } );

		no.apply_load = this.load;
		no.load_complete = this.loadc;

		no.load_async = loaded;				/* because we have to drive this asynch, it must be in a different spot */
		return no;
	},

	/* load is async -- we drive the user callback with the loaded data when notified that load has finished */
	loadc: function( ethis )
	{
		if( this.load_async )							/* user callback for the resultes is there (cannot imagine why it wouldn't be */
			this.load_async( ethis.result );				/* call to process the loaded data */
	},

	load:  function(  )						/* actually apply the load when the user has pressed the accept button */
	{
		var rdr;
		var pu;

		pu = this;						/* keep in scope for load-complete callback */

		if (window.File && window.FileReader && window.FileList && window.Blob) 
		{
			rdr = new FileReader( );
			rdr.onload = function( e ) { pu.load_complete( this ); };		/* this will be the event object */
			rdr.readAsText( this.changes.lookup( "filename" ) );
		}
		else
			alert( "file cannot be loaded: your browser doesn't support FileReader. Get Chrome or Opera" );
	}	
}
