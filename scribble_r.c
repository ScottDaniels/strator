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
 ---------------------------------------------------------------------------------------------
*	Abstract: 	scribble_r
*	Mnemonic:	Scribble_r is the router which supports one or more 'scribble boards'
*				allowing a scribble board to join a group and then see all other messages
*				which are posted to the group by the other scribble boards.  Thus this is 
*				a repeater which repeats all messages received to all other sessions within
*				the same group. Initially, a new connection is added to the default group, 
*				and is switched to a different group by request.  Groups can be password
*				protected, and marked read only which allows only the creating session to write
*				to the group; all who attach will rerceive only updates and any messages received
*				will be dropped.  
*
*				Sribble_r uses the websocket or websocket_ssl interface which is built
*				upon the sdaniels/si and sdaniels/sissl libraries.  This allows HTML-5
*				based scribble boards to easily create TCP sesisons which are either 
*				encrypted, or in the clear with a scribble_r process. 
*
*				to create together. This uses the websocket callback function set and 
*				listens for sessions. All messages that are received are repeated onto 
*				all other currently connected sessions for the same group. Messages are 
*				The messages received are examined to determine if they contain a 
*				scribble_r command; if they do scribble_r porocesses the command, and if not
*				The message is forwarded. All commands begin with the token 'scribble_r'
*				after which the following are recgonised:
*
*					join <gname> <uname> -- join the group, createing the group if needed
*					glist				-- list all groups
*					ulist 				-- list all users for the group the seesion belongs to				
*					refresh				-- a refresh command is sent to one group member.
*
*
*	Author:		E. Scott Daniels
*	Date:		08 December 2012
*
 ---------------------------------------------------------------------------------------------
*/
#include <openssl/sha.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <time.h>

#include <sdaniels/socket_if.h>		// github/scottdaniels/libs
#include <sdaniels/sissl.h>
#include <sdaniels/ut.h>


#define BLEAT(v,fmt,...) if((verbose)>=(v))fprintf(stderr,"%lld " fmt, (long long) time( NULL ), ##__VA_ARGS__) 
#define MALLOC(n)	my_malloc( n )
#define REALLOC(a,n)	my_realloc(a,n)

#define GFL_OWRITE	0x01		/* only owner has write permission */

typedef struct user {
	char	*name;
	char	*from;
	int		closing;		/* set when the user's session starts to close */
} User;

typedef struct group {		/* a group of sessions we repeat to */
	struct	group *next;
	char	*name;				
	User	**slist;			/* indexed by session id -- points to user info or is null */
	int		nalloc;				/* number allocated in slist */
	int		nsess;
	int		owner;				/* fd of the group owner (session that created the group) -1 if none */
	int		flags;				/* GFL_ constants */
	char	*pwhash;		/* hash of the password */
} Group;

int	verbose = 1;
Group *glist = NULL;				/* master linked list of groups */
Group **gidx = NULL;				/* direct index from session to group */
int	ngidx_alloc = 0;

/*
gidx = [ fd0 | fd1 | fd2 | fd3 | .... ]		(sid maps to the group they belong to)
          |    |
		  |    |-> {group} <---- glist
		  |           |
		  |           V
          |------> {group}
*/

/* -------------- prototypes --------------------------------- */
static void send_glist( int sid, int toall );

/* ------------------------------------------------------------------------------------------- */

/* assuming that optiimisation will in-line these */
static void *my_realloc( void *a, int n) {
	void *p;

	if( (p = (void *) realloc( a, n )) != NULL )
		return p;

	BLEAT( 0, "[ABORT]\tunable to reallocate %d bytes of memory\n", n );
	exit( 0 );
}

static void *my_malloc( int n ) {
	void *p;

	if( (p = (void *) calloc( 1, n )) != NULL )
		return p;

	BLEAT( 0, "[ABORT]\tunable to allocate %d bytes of memory\n", n );
	exit( 0 );
}

static void drop_group( Group *gp ) {
	Group *pgp;

	if( gp->nsess > 0 || strcmp( gp->name, "default" ) == 0 )		/* cannot drop default group or one with sessions */
		return;

	BLEAT( 1, "\tgroup dropped: %s\n", gp->name );

	if( glist == gp ) {
		glist = gp->next;
	} else {
		for( pgp = glist; pgp->next != gp; pgp = pgp->next );
		pgp->next = gp->next;
	}

	free( gp->slist );
	free( gp->name );
	free( gp );

	send_glist( -1, 1 );
}

/*
	return the group, creating it if it doesn't exist.
	if created, sid is made the owner. 
	if pwhash isn't null, it is compared to the group's current pw and
	null is returned if they don't match.  If it is null, and the group 
	has a password, then null is returned. 
	When a group is created, the password string, when not null, is 
	passed in. 
*/
static Group *mk_group( char *name, int sid, char *pwhash ) {
	Group *gp;
	Group *tail = NULL;

	//BLEAT( 1, "checking for existing group %s with hash %s\n", name, pwhash );
	/* fine for small number of groups, but should convert to hash for anything largish */
	for( gp = glist; gp; gp = gp->next ) {			/* return exiting if it's there */
		if( strcmp( gp->name, name ) == 0 ) {
			//BLEAT( 1, "found group %s\n", gp->name );
			if( pwhash ) {
				BLEAT( 1, "\tmk_group: checking hash: %s %s\n", gp->pwhash, pwhash );
				if( gp->pwhash ) {
					return strcmp( gp->pwhash, pwhash ) ? NULL : gp;
				} else {
					//BLEAT( 1, "[REJECT]\tpassword given but group has none\n" );
					return NULL;			/* password given and geoup has none */
				}
			} else {
				//BLEAT( 1, "no password supplied on request...\n" );
				if( gp->pwhash ) { 			/* group has hash and none given */
					BLEAT( 1, "[REJECT]\tgroup has password, none given by user\n" );
					return NULL;
				}
				//BLEAT( 1, "allowing connection to group\n" );
			}

			return gp;
		}

		tail = gp;
	}

	gp = (Group *) MALLOC( sizeof( Group ) );
	if( tail != NULL )
		tail->next = gp;
		
	gp->next = NULL;
	gp->name = strdup( name );
	gp->nalloc = 50;
	gp->slist = (User **) MALLOC( sizeof( User *) * gp->nalloc ); 
	gp->nsess = 0;
	if( pwhash )
		gp->pwhash = strdup( pwhash );
	gp->owner = sid; 

	BLEAT( 1, "\tcreated group: %s; %s password; owner=%d\n", gp->name, pwhash ? "has" : "does not have a", sid );
	
	return gp;
}

static User *mk_user( char *name, char *from ) {
	User	*up;

	up = (User *) MALLOC( sizeof( *up ) );
	up->name = strdup( name );
	//up->from  = strdup( "??" );
	up->from  = strdup( from );
	//BLEAT( 1, "created user: %s from %s\n", up->name, up->from );

	return up;
}

/*
	send buffer to all users on the group excluding the one. If
	exclude is -1, then message is sent to everybody.
*/
static void send2all( Group *gp, char *buf, int len, int exclude_sid ) {
	int i;
	if( !gp )
		return;

	BLEAT( 2, "\tsend2all: exc=%d %d bytes: (%s)\n", exclude_sid, len, buf );
	for( i = 0; i < gp->nalloc; i++ ) {
		if(  gp->slist[i] &&  i != exclude_sid ) {
			BLEAT( 2, "\trepeat message from %d to sid %d\n", exclude_sid, i );
			/* this would be faster if ws_* supported a generate message and we could send that message over and over rather than formatting it each time */
			ws_send( i, buf, len );				/* repeat it */
		}
	}
}

/*
	send a list of all users belonging to the group.
*/
static void send_list( Group *gp, int sid, int toall ) {
	int i;
	User	*up;
	char	*mbuf = NULL;
	int		used = 0;
	int		nalloc = 0;


	nalloc = 1024;
	mbuf = (char *) MALLOC( sizeof( char ) * nalloc );
	snprintf( mbuf, nalloc, "request; cmd:update-users; value:" );

	BLEAT( 1, "\tsending list for group: %s\n", gp->name );
	for( i = 0; i < gp->nalloc; i++ ) {
		if( (up = gp->slist[i]) != NULL && !up->closing ) {				/* user on the group that isn't in closing mode */
			used += strlen( up->name ) + 2;			/* allow for trailing blank and end of string */
			if( used >= nalloc - 2 ) {				/* always ensure that we leave the loop with room for \n to be added */
				nalloc += 1024;
				mbuf = (char *) REALLOC( mbuf, sizeof( char ) * nalloc );
			}

			strcat( mbuf, up->name );
			strcat( mbuf, " "  );
		}
	}

	if( toall )
		send2all( gp, mbuf, strlen( mbuf ), -1 );				/* update to all sessions */
	else
		ws_send( sid, mbuf, strlen( mbuf ) );				/* send just to requesting session */

	BLEAT( 2, "\tsend list: (%s) %s\n", toall ? "all" : "one", mbuf );
	free( mbuf );
}

static void send_glist( int sid, int toall ) {
	int i;
	Group	*gp;
	char	*mbuf = NULL;
	int		used = 0;
	int		nalloc = 0;
	char	flags[25];

	nalloc = 1024;
	mbuf = (char *) MALLOC( sizeof( char ) * nalloc );
	snprintf( mbuf, nalloc, "request; cmd:update-groups; value:" );

	for( gp = glist; gp; gp = gp->next ) {
		//BLEAT( 1, "\tgroup %s has %d sessions\n", gp->name, gp->nsess );
		used += strlen( gp->name ) + 1;					/* group + blank */
		if( gp->owner >= 0 &&  gp->slist[gp->owner] )  {
			used += strlen( gp->slist[gp->owner]->name ) + 1;		/* owner + blank */
		} else {
			used += 10;							/* len of system + blank */
		}

		if( gp->pwhash ) 
			used += 2;

		if( used >= nalloc - 2 ) {				/* always ensure that we leave the loop with room for \n to be added */
			nalloc += 1024;
			mbuf = (char *) REALLOC( mbuf, sizeof( char ) * nalloc );
		}

		strcat( mbuf, gp->name );
		strcat( mbuf, " "  );
		if( gp->owner >= 0 &&  gp->slist[gp->owner] ) {
			strcat( mbuf, gp->slist[gp->owner]->name );
			strcat( mbuf, " "  );
		} else {
			strcat( mbuf, "(system) " );
		}

		strcpy( flags, "[--]," );			/* build flags string and add to the buffer */
		if( gp->pwhash ) 
			flags[1] = 'P';
		if( gp->flags & GFL_OWRITE )
			flags[2] = 'R';
		strcat( mbuf, flags );
	}

	if( toall ) {
		//BLEAT( 1, "\tgroup response: (all) %s\n", mbuf );
		for( gp = glist; gp; gp = gp->next )
			send2all( gp, mbuf, strlen( mbuf ), -1 );				/* update to all sessions */
	} else {
		//BLEAT( 1, "\tgroup response: (one) %s\n", mbuf );
		ws_send( sid, mbuf, strlen( mbuf ) );				
	}

	free( mbuf );
}

/* 
	pick another session in the group and send a refresh command to 
*/
static void refresh( int sid ) {
	char	mbuf[1024];
	Group	*gp;
	int		i;
	
	gp = gidx[sid];
	if( gp->nsess == 1 ) {
		BLEAT( 2, "\trefresh: no other group members, nothing to refresh\n" );
		return;					/* they are the only member -- nothing to refresh */
	}

	for( i = 0;  i < gp->nalloc; i++ ) {
		if( gp->slist[i] && i != sid && !gp->slist[i]->closing ) {
			if( !(gp->flags &  GFL_OWRITE) || gp->owner == sid ) {	/* if it's a read/only group only the owner can refresh */
				snprintf( mbuf, sizeof( mbuf ), "request; cmd: refresh; tag:scribble_r direct %d", sid );
				ws_send( i, mbuf, strlen( mbuf ) );
				BLEAT( 2, "\trefresh request sent to sid=%d: %s\n", i, mbuf );
				return;
			}
		}
	}

	BLEAT( 1, "[WARN]\t could not find available sid to send refresh request to\n" );
}

static void alter_gflags( char *method, char *buf ) {
	return;
}

/*
	switch the group that the session belongs to. buf may contain name and password information. 
*/
static void join_group( int sid, char *gname, char *buf ) {
	Group	*gp;
	Group	*oldg;
	User 	*up  = NULL;
	char	*name = NULL;
	char	*pw = NULL;
	unsigned char	*pwhash = NULL;
	char	*hold;
	char	mbuf[1024];

	if( buf )
	{
		name = strtok_r( buf, " ", &hold );							/* user name */
		if( (pw = strtok_r( NULL, " ", &hold )) != NULL )
		{
			pwhash = (char *) sha256_buf( pw, (long long) strlen( pw ), NULL );
		}
	}
	
	if( (gp = mk_group( gname, sid, pwhash )) == NULL )				/* create or find group */
	{
		BLEAT( 1, "\treject user (%s) from group: %s\n", name, gname );
		snprintf( mbuf, sizeof( mbuf ), "request; cmd: reject; group: %s; msg: group authorisation failed", gidx[sid]->name );
		ws_send( sid, mbuf, strlen( mbuf ) );				/* send just to requesting session */
		return;		
	}

	if( (oldg = gidx[sid]) != NULL ) {					/* snag user block from old group and mark off of that group */
		up = oldg->slist[sid];
		oldg->slist[sid] = NULL;
		if( --oldg->nsess < 0 )			/* in case we missed a join some how */
			oldg->nsess = 0;
		
		send_list( oldg, sid, 1 ); 		/* broadcast that user has dropped (must do even if group doesn't change to allow name change */

		if( oldg->owner == sid ) {
			oldg->owner = -1;
			oldg->flags &= ~GFL_OWRITE;
		}
	}

	if( ! up ) {
		up = mk_user( name, "no-name" );
	} else {
		if( name != NULL ) {
			free( up->name );
			up->name = strdup( name );		/* allow a name change when changing group */
		}
	}

	gidx[sid] = gp;							/* direct refernce sid to the group */
	gp->slist[sid] = up;					/* add the user to the group */
	gp->nsess++;

	send_list( gp, sid, 1 );			/* send an updated member list to all */
	send_glist( sid, 1 );				/* and an updated group list  in case new group created */
	BLEAT( 1, "\t%s from %s joined group %s leaving group %s\n", name, up->from, gp->name, oldg->name );

	if( oldg->nsess <= 0 )
		drop_group( oldg );
}

/*
	determine whether or not the buffer contains a scribble_r command. if it does, parse and
	execute it returning 1, else return 0.  Scribble commands start with scribble_r as the 
	first token. After that we recognise:
			direct <sid> <message>		-- a direct write to the indicated sid
			join <group> [<username> [<password>]]	-- create or associate with a group
			list
			glist
			gflag [un]set <flagname> [<flagname>...]	-- set group flags
			refresh						-- refresh the session from another session
*/
int parse_cmd( int sid, char *buf ) {
	char	*tokens[1024];
	int		ntokens;
	int		dsid;

	if( strncmp( buf, "scribble_r", 10 ) )
	{
		//BLEAT( 1, "not a command: (%s)", buf );
		return 0;								/* not a command -- repeat to all but sender */
	}

	/* might want to pull user here to verify authority to make requests */

	ntokens = tokenise( buf, ' ', tokens, 4 );			/* intially three tokens allowing third to be multiple words if that's what is needed */

	if( !tokens[1] ) {
		BLEAT( 1, "[WARN]\tmissing command tokens in scribble_r message\n" );
		return 1;
	}

	switch( *tokens[1] ) {		/* all recognised requests should be handled in switch and return from there (only unrecognised falls out) */
		case 'd':
			if( strcmp( tokens[1], "direct" ) == 0 ) { 				/* direct message - probalby as a result of a refresh */
				if( tokens[2] ) {
					dsid = atoi( tokens[2] );
					if( tokens[3] ) {
						BLEAT( 1, "\tdirect to %d: %s\n", dsid, tokens[3] );
						ws_send( dsid, tokens[3], strlen( tokens[3] ) );				/* send to the indicated session */
					} else {
						BLEAT( 0, "[WARN]\tmissing message in direct request to %d\n", dsid );
					}
				} else {
					BLEAT( 0, "[WARN]\tmissing sid  in direct request\n" );
				}
				return 1;
			}
			break;

		case 'j':
			if( strcmp( tokens[1], "join" ) == 0 ) {
				if( tokens[2] )
					join_group( sid, tokens[2], tokens[3] );
				else
					BLEAT( 0, "[WARN]\tmissing group name on join command from: %d\n", sid );

				return 1;
			}
			break;

		case 'l':
			if( strcmp( tokens[1], "list" ) == 0 ) {
				send_list( gidx[sid], sid, 0 );
				return 1;
			}
			break;

		case 'g':
			if( strcmp( tokens[1], "glist" ) == 0 ) {
				send_glist( sid, 0 );
				return 1;
			} else {
				if( strcmp( tokens[1], "gflags" ) == 0 )
				{
					alter_gflags(  tokens[2], tokens[3] );

				}
			}
			break;

		case 'r':
			if( strcmp( tokens[1], "refresh" ) == 0 ) {
				refresh( sid );
				return 1;
			} else {
				if( strcmp( tokens[1], "readonly" ) == 0 ) {
					Group *gp;
	
					if( (gp = gidx[sid]) != NULL  && gp->owner == sid ) {		/* only owner can make this read only */
						gp->flags ^= GFL_OWRITE;			/* toggle the flag */
						send_glist( -1, 1 );				/* should send with the new flag setting */
					}
					return 1;
				}
			}
			break;

		default:
			break;
	
	}

	BLEAT( 0, "[WARN]\tunrecognised request from sid=%d ignored: %s\n", sid, tokens[1] );

	return 1;
	
}

/* --------------- callbacks -------------------------------------------------------------- */
int msg_cb( int sid, unsigned char *buf, int len, void *data ) {
	Group 	*gp;
	int		i;

	BLEAT( 2, "\t>>> msg_cb: got: %d bytes (%s)\n", len, buf );

	if( parse_cmd( sid, buf ) )
		return 0;

	if( (gp = gidx[sid]) == NULL ) {
		BLEAT( 1, "[WARN]\tgroup not mapped for sid %d\n", sid );
		return 0;
	}

	//BLEAT( 1, "\tsending to all in group: %s\n", gp->name );
	if( !(gp->flags & GFL_OWRITE)  || gp->owner == sid )		/* writeonly is off, or this is from the onwer */
		send2all( gp, buf, len, sid );							/* to all except the sid that sent it in */

	return 0;
}

/*
	called when the farside has sent a close message, but the session is still 
	up. We expect a disc soonish, but we should mark the session as closed so 
	we don't send refresh requests etc. to it.
*/
int cb_closing( int sid ) {
	if( sid > ngidx_alloc )			/* this _shouldn't_ happend, but parinoia never hurts */
		return 0;

	if( gidx[sid] == NULL )
		return 0;

	gidx[sid]->nsess--;		
	gidx[sid]->slist[sid]->closing = 1;

	return 0;
}

int cb_disconnected( int sid ) {
	if( sid > ngidx_alloc )			/* this _shouldn't_ happend, but parinoia never hurts */
	{
		ngidx_alloc += 100; 
		gidx = (Group **) REALLOC( gidx, sizeof( int *) * ngidx_alloc ); 
	}

	if( gidx[sid] == NULL )
		return 0;

	gidx[sid]->nsess--;		
	BLEAT( 1, "\tsession %d removed from group %s: group now has %d\n", sid, gidx[sid]->name, gidx[sid]->nsess );
	gidx[sid]->slist[sid] = 0;		/* deactivate session in the group */

	if( gidx[sid]->nsess <= 0 )
		drop_group( gidx[sid] );

	gidx[sid] = NULL;
	return 0;
}

int cb_connected( int sid, char *buf ) {
	if( sid > ngidx_alloc ) {
		ngidx_alloc += 100; 
		gidx = (Group **) REALLOC( gidx, sizeof( int *) * ngidx_alloc ); 
	}

	gidx[sid] = glist;				/* direct ref sid to group; default group initially */

	if( sid >= glist->nalloc ) {
		int i;

		glist->nalloc += 50;
		glist->slist = (User **) REALLOC( glist->slist, sizeof( User *) * glist->nalloc );

		for( i = sid; i < glist->nalloc; i++ )
			glist->slist[i] = NULL;
	}

	if( gidx[sid]->slist[sid] ) {
		free( gidx[sid]->slist[sid]->name );
		free( gidx[sid]->slist[sid] );
	}

	gidx[sid]->slist[sid] = mk_user( "unknown", buf );		/* activate session in the group */
	//BLEAT( 1, "up= sid=%d \n", sid );
	gidx[sid]->nsess++;		
	BLEAT( 1, "\tnew session (%d) from %s added to group %s: group now has %d\n", sid, buf, gidx[sid]->name, gidx[sid]->nsess );
	
	return 0;
}


/* ----------------------------------------------------------------------------------- */

int main( int argc, char **argv ) {
	char	*out;
	char	port[1024];
	char	*version = "v1.1/12103";

	glist = mk_group( "default", -1, NULL  );

	// TODO:  add options processing to allow verbose level, and help

	if( USE_SSL ) {			/* defined on gcc command line; compiler should do the right thing without messy ifdefs */
		if( argc < 3 ) {
			BLEAT( 1, "[ERROR]\tmust enter listen port cert-file\n" );
			exit( 1 );
		}
		ws_ssl_initialise( argv[2], argv[2], NULL, NULL );
		//BLEAT( 1, "ssl initalised with websocket interface\n" );
		BLEAT( 1, "\tscribble_r_ssl %s\n", version );
		BLEAT( 1, "\tpid=%d starting listener on port %s\n", getpid(), argv[1] );
	} else {
		if( argc < 2 ) {
			BLEAT( 1, "[ERROR]\tmust enter listen port\n" );
			exit( 1 ); 
		}
		BLEAT( 1, "\tscribble_r %s\n", version );
		BLEAT( 1, "\tpid=%d starting listener on port %s\n", getpid(), argv[1] );
	}

	snprintf( port, sizeof( port ), "0.0.0.0;%s", argv[1] );

	ws_add_cb( WSTY_CONN, cb_connected );
	ws_add_cb( WSTY_DISC, cb_disconnected );
	ws_add_cb( WSTY_CLOSING, cb_closing );
	ws_listener( port, msg_cb, NULL );

	BLEAT( 1, "\tfinished listener....\n" );

	return 0;
}
