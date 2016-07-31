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
   Mnemonic:	symtab.js
   Abstract: 	Implements a symbol table (hash). While objects themselves
  				can be treated as a hash table there are to main reasons 
  				to go to the extra effort and use an implementation like
  				this one.  First, an object inherits properties and 
  				in theory testing if hash[key] is null (undefined) could 
  				actually result in an incorrect answer  because the key 
				is part of object prototype.  This can be avoided, but 
				it is much easier to write 

  					if( (v = hash.lookup( key )) == null )
  
  				than to write
  
  					if( hash.hasOwnProperty( key ) )
  						v = hash[key];
  					else
  						v = null;
  
  				or
  					v = hash.hasOwnProperty( key ) ? hash[key] : null;
		
				as would be needed without the symtab "object."

				Create:
					hash = symtab.mk();

				save something:
					hash.save( "key", value );

				get something:
					something = hash.lookup( "key" );

				delete:
					hash.delete( "key" );
*/


symtab = {
	mk: function( )
	{
		no = Object.create( this );
		no.hash = {};
		no.length = 0;
		return no;
	},

	lookup:  function( key )
	{
		return this.hash.hasOwnProperty( key ) ? this.hash[key] : null;
	},

	save:  function( key, value )
	{
		if( ! this.hash.hasOwnProperty( key ) )		/* inc len only on first occurance of key */
			this.length++;
		this.hash[key] = value;
	},

	/* delete -- return true if it was there */
	del: 	function( key )
	{
		var rv = false;

		if( this.hash.hasOwnProperty( key ) )
		{
			this.hash[key] = null;
			rv = true;
		}

		this.length--;
		return rv;
	},

	strs2things:  function( )
	{
		var key;

		for( key in this.hash )
			if( this.hash.hasOwnProperty( key ) )
				this.hash[key] = tools.str2thing( this.hash[key] );
	},

	traverse_kv:  function( proc, data )	/* drive proc once for each key,value pair */
	{
		var key;

		for( key in this.hash )
			if( this.hash.hasOwnProperty( key ) )
				proc( key, this.hash[key], data );
	},
}

