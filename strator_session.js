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
	Mnemonic:	strator_session.js
	Abstract: 	Manages a session with the repeater using websockets

	Requires	tools.js

	Author:		E. Scott Daniels
	Date:		22 Nov 2012
----------------------------------------------------------------------------------------------
*/
var strator = strator || {};			/* don't depend on order that html includes us */

/*
	manage a session with the repeater.
*/
strator.session = {
	mk: function( farside, user, listener )				/* farside is host:port string -- listener implements the pre/post and msg_cb interface */
	{
		var no = Object.create( strator.session );
		no.isconn = false;

		no.user = user || tools.get_biscuit( "strator_user" );
		if( no.user == null )
			no.user = "stranger." + (Math.floor( Math.random() * 10000 )).toString( 16 );		/* random identifier to create annon user id used if no user name avail */

		if( (no.group = tools.get_biscuit( "strator_group" )) == null )
			no.group = "default";							/* server initally associates with the default group */

		if( (no.farside = tools.get_biscuit( "strator_farside" )) == null )			/* default to cookie so we'll go back to same repeater if page is reloaded */
			no.farside = farside;

		no.isestablished = false;
		no.members = "undetermined"
		no.listener = listener;						/* object with a cb_msg function to call when data received */

		return no;
	},

	conn: function( farside )			
	{
		if( this.isconn )				/* pending, prevent another */
			return;

		var ss = this;					/* keep this in scope for callback closures */

		doctools.obj_text( strator.DOC_CONN_STATE, "Attempting Conn", "#00c0c0" );
		var fs = farside || this.farside;

		this.isconn = true;								/* connection pending to prevent multiple attempts before we get a good session or failure */
		this.link = new WebSocket(  fs );

		/* callbacks associated with the session */
		this.link.onopen = function( e ) 
		{
			ss.isestablished = true;
			ss.send( "scribble_r join " + ss.group + " " + ss.user );		/* always rejoin to set our current info and select group, but ensure update has run first */
	
			ss.send( "scribble_r refresh" );		/* ask for current drawing elements */
			ss.send( "scribble_r list" );			/* get an updated list assuming that it will be here before user opens the conn window for the first time */
			ss.send( "scribble_r glist" );
			//doctools.obj_text( strator.DOC_CONN_STATE, "Connected:" + ss.group, "#00f000" );
			doctools.obj_text( strator.DOC_CONN_STATE, ss.group, "#00f000" );
		}; 

		this.link.onerror  = function( )
		{
			ss.isconn = false;
			ss.isestablished = false;
			doctools.obj_text( strator.DOC_CONN_STATE, "DISCONNECTED-Err", "#ff00f0" );
		};

		this.link.onmessage = function( e ) 
		{ 
			ss.listener.cb_msg( e.data );				/* drive listener interface */
		};		

		this.link.onclose = function( )
		{
			ss.isconn = false;
			ss.isestablished = false;
			doctools.obj_text( strator.DOC_CONN_STATE, "DISCONNECTED", "#ff0000" );
		};
	},

	disc: function( )		/* terminate the session and clean things up */
	{
		this.isestablished = false;
		this.isconn = false;
		doctools.obj_text( strator.DOC_CONN_STATE, "DISCONNECTED", "#a000c0" );

		if( this.link == null )			/* session already closed -- cleanup below impossible */
			return;

		this.link.close( );
		this.link.onclose = null;				/* we know it's down, no need for a callback at this point */
		this.link.onerror = null;				
		this.link = null;
	},

	send: function( msg )				/* obvious -- send the message to the repeater */
	{
		if( this.link == null )
			return;

		if( this.link.readyState > 0 )
			this.link.send( msg );
		else
			console.log( "not sent: " + msg );
	},

	/* 	given a hash of changes, update things which might force a new connection. If the host
		changes, then we drive disc() and conn() to switch and the connection/handshake process
		will take care of sending new user/group info. If we don't change hosts, we send new
		user/group info to the repeater if there was a change.  
	*/
	update: function( h )
	{
		var host;
		var	rejoin = false;
		var refresh = false;
		var key;

		if( h == null )
			return false;				/* nothing to update */

 		host = h.lookup( "host" );

		for( key in h.hash )										/* run the keys and update what was changed */
		{
			if( key != "host"  &&  h.hash.hasOwnProperty( key ) )	/* could use traverse, but this is easier */
			{
				if( key == "group" )								/* if group changes, we should request a refresh */
					refresh = true;									/* if user (or something else in future) changes, no refresh is needed as lings are the same */

				this[key] = h.hash[key];  
				rejoin = true;										/* must rejoin here if we don't change the host connection */
			}
		}

		if( this.listener )				/* allow listener to save things */
			this.listener.pre_update( );

		if( rejoin )		/* save data in cookies */
		{
			tools.set_biscuit( "strator_group", this.group, 0 );		/* group and farside are tab cookies which expire with session; user expires in a year */
			tools.set_biscuit( "strator_user", this.user, 365 );
			tools.set_biscuit( "strator_farside", host ? host : this.farside, 0 );
		}

		if( host != null &&  host != this.farside )					/* need to make a new connection */
		{	
			this.farside = host;
			this.disc();
			if( this.listener )
				this.listener.post_update( true );				/* always clear and refresh -- BEFORE the connection */
			this.conn( this.farside );			/* connect to new repeater, and send user/group info after handshake */

			return true;
		}
		else								
		{
			if( rejoin )
			{
				//this.send( "scribble_r join " + ss.group + " " + ss.user );		/* if user or group info changed, and we stayed on the same repeater, we must rejoin to send new info */
				this.send( "scribble_r join " + this.group + " " + this.user );		/* if user or group info changed, and we stayed on the same repeater, we must rejoin to send new info */
				if( this.isestablished )
					doctools.obj_text( strator.DOC_CONN_STATE, this.group, "#00f000" );
					//doctools.obj_text( strator.DOC_CONN_STATE, "Connected:" + this.group, "#00f000" );
			}
		}

		/* call refresh notification function to let creator know a refresh is needed */
		if( this.listener )			/* why this woule be null doesn't make sense.... */
			this.listener.post_update( refresh );
		return refresh;			/* let caller know that we need a refresh of drawing for the new group -- they probalby want to clear slate first, so we DONT make request here */
	},

	refresh: function( )
	{
		this.send( "scribble_r refresh" );		/* get a refresh of scribblings from another active group member */
	}
};
