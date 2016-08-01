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
	Mnemonic:	colour.js
	Abstract: 	colour look up table and related colour functions
	Author:		E. Scott Daniels
	Date:		13 April 2013
	Mod:		15 Jul 2014 - corrected bug that was not allowing #rrggbb to be used as 
					colour name in name2rgb. 
----------------------------------------------------------------------------------------------
*/


var colour = colour || {};		/* shouldn't be one, but use it if it's there */	

colour.set = {
	mk: function( invertbw, max )
	{
		no = Object.create( colour.set );

		if( invertbw == null )
			no.invertbw = false;
		else
			no.invertbw = invertbw;

		no.max = max | 0;
		no.invert = false;

		no.colour_space = colour;		/* allow some day for a mapping based on the same names but with different values */

		return no;
	},

	/*
		convert name to array of three integers
		if invert is true, then we'll invert the colours
		if max is given, then the values are expressed as a fraction: val/max.
	*/
	name2rgb: function( name )
	{
		var s;
		var a = [];
	
		if( colour[name] == null )
		{
			if( name.substring( 0, 1 ) == "#" )
				s = name;
			else
			{
				if( this.invertbw )
					return [ 1, 1, 1 ];
				else
					return [ 0, 0, 0 ];
			}
		}
		else	
		{
			if( this.invertbw )
			{
				if( name == "black" )
					s = this.colour_space["white"];
				else
					if( name == "white" )
						s = this.colour_space["black"]
					else
						s = this.colour_space[name];
			}
			else
				s = this.colour_space[name];
		}
	
		if( this.invert )
		{
			a[0] = 255 - parseInt( "0x" + s.substring( 1, 3 ) );	/* stop is one past the desired character */
			a[1] = 255 - parseInt( "0x" + s.substring( 3, 5 ) );
			a[2] = 255 - parseInt( "0x" + s.substring( 5 ) );
		}
		else
		{
			a[0] = parseInt( "0x" + s.substring( 1, 3 ) );
			a[1] = parseInt( "0x" + s.substring( 3, 5 ) );
			a[2] = parseInt( "0x" + s.substring( 5 ) );
		}
	
		if( this.max )
		{
			var i;
			for( i = 0; i < 3; i++ )
				a[i] /= this.max;
		}
	
		return a;
	},

	/*
		space separated string for things like postscript
	*/
	name2rgbstr: function( name )
	{
		var a;
	
		a = this.name2rgb( name );
			
		return  a[0] + " " + a[1] + " " + a[2];
	},

	name2bnw: function( name )
	{
		var a;
		var v;
		a = this.name2rgb( name );
		v = (a[0] + a[1] + a[2])/3;

		return v;
	}
}

/* listed at: http://www.cryer.co.uk/resources/javascript/html2.htm */
colour.aliceblue =	 "#F0F8FF";
colour.aliceblue = 	"#F0F8FF"
colour.antiquewhite =	 "#FAEBD7";
colour.antiquewhite = 	"#FAEBD7"
colour.aqua =	 "#00FFFF";
colour.aqua = 	"#00FFFF"
colour.aquamarine =	 "#7FFFD4";
colour.aquamarine = 	"#7FFFD4"
colour.azure =	 "#F0FFFF";
colour.azure = 	"#F0FFFF"
colour.beige =	 "#F5F5DC";
colour.beige = 	"#F5F5DC"
colour.bisque =	 "#FFE4C4";
colour.bisque = 	"#FFE4C4"
colour.black =	 "#000000";
colour.black = 	"#000000"
colour.blanchedalmond =	 "#FFEBCD";
colour.blanchedalmond = 	"#FFEBCD"
colour.blue =	 "#0000FF";
colour.blue = 	"#0000FF"
colour.blueviolet =	 "#8A2BE2";
colour.blueviolet = 	"#8A2BE2"
colour.brown =	 "#A52A2A";
colour.brown = 	"#A52A2A"
colour.burlywood =	 "#DEB887";
colour.burlywood = 	"#DEB887"
colour.cadetblue =	 "#5F9EA0";
colour.cadetblue = 	"#5F9EA0"
colour.chartreuse =	 "#7FFF00";
colour.chartreuse = 	"#7FFF00"
colour.chocolate =	 "#D2691E";
colour.chocolate = 	"#D2691E"
colour.coral =	 "#FF7F50";
colour.coral = 	"#FF7F50"
colour.cornflowerblue =	 "#6495ED";
colour.cornflowerblue = 	"#6495ED"
colour.cornsilk =	 "#FFF8DC";
colour.cornsilk = 	"#FFF8DC"
colour.crimson =	 "#DC143C";
colour.crimson = 	"#DC143C"
colour.cyan =	 "#00FFFF";
colour.cyan = 	"#00FFFF"
colour.darkblue =	 "#00008B";
colour.darkblue = 	"#00008B"
colour.darkcyan =	 "#008B8B";
colour.darkcyan = 	"#008B8B"
colour.darkgoldenrod =	 "#B8860B";
colour.darkgoldenrod = 	"#B8860B"
colour.darkgray =	 "#A9A9A9";
colour.darkgray = 	"#A9A9A9"
colour.darkgreen =	 "#006400";
colour.darkgreen = 	"#006400"
colour.darkkhaki =	 "#BDB76B";
colour.darkkhaki = 	"#BDB76B"
colour.darkmagenta =	 "#8B008B";
colour.darkmagenta = 	"#8B008B"
colour.darkolivegreen =	 "#556B2F";
colour.darkolivegreen = 	"#556B2F"
colour.darkorange =	 "#FF8C00";
colour.darkorange = 	"#FF8C00"
colour.darkorchid =	 "#9932CC";
colour.darkorchid = 	"#9932CC"
colour.darkred =	 "#8B0000";
colour.darkred = 	"#8B0000"
colour.darksalmon =	 "#E9967A";
colour.darksalmon = 	"#E9967A"
colour.darkseagreen =	 "#8FBC8F";
colour.darkseagreen = 	"#8FBC8F"
colour.darkslateblue =	 "#483D8B";
colour.darkslateblue = 	"#483D8B"
colour.darkslategray =	 "#2F4F4F";
colour.darkslategray = 	"#2F4F4F"
colour.darkturquoise =	 "#00CED1";
colour.darkturquoise = 	"#00CED1"
colour.darkviolet =	 "#9400D3";
colour.darkviolet = 	"#9400D3"
colour.deeppink =	 "#FF1493";
colour.deeppink = 	"#FF1493"
colour.deepskyblue =	 "#00BFFF";
colour.deepskyblue = 	"#00BFFF"
colour.dimgray =	 "#696969";
colour.dimgray = 	"#696969"
colour.dodgerblue =	 "#1E90FF";
colour.dodgerblue = 	"#1E90FF"
colour.firebrick =	 "#B22222";
colour.firebrick = 	"#B22222"
colour.floralwhite =	 "#FFFAF0";
colour.floralwhite = 	"#FFFAF0"
colour.forestgreen =	 "#228B22";
colour.forestgreen = 	"#228B22"
colour.fuchsia =	 "#FF00FF";
colour.fuchsia = 	"#FF00FF"
colour.gainsboro =	 "#DCDCDC";
colour.gainsboro = 	"#DCDCDC"
colour.ghostwhite =	 "#F8F8FF";
colour.ghostwhite = 	"#F8F8FF"
colour.gold =	 "#FFD700";
colour.gold = 	"#FFD700"
colour.goldenrod =	 "#DAA520";
colour.goldenrod = 	"#DAA520"
colour.gray =	 "#808080";
colour.gray = 	"#808080"
colour.green =	 "#008000";
colour.green = 	"#008000"
colour.greenyellow =	 "#ADFF2F";
colour.greenyellow = 	"#ADFF2F"
colour.honeydew =	 "#F0FFF0";
colour.honeydew = 	"#F0FFF0"
colour.hotpink =	 "#FF69B4";
colour.hotpink = 	"#FF69B4"
colour.indianred =	 "#CD5C5C";
colour.indianred = 	"#CD5C5C"
colour.indigo =	 "#4B0082";
colour.indigo = 	"#4B0082"
colour.ivory =	 "#FFFFF0";
colour.ivory = 	"#FFFFF0"
colour.khaki =	 "#F0E68C";
colour.khaki = 	"#F0E68C"
colour.lavender =	 "#E6E6FA";
colour.lavender = 	"#E6E6FA"
colour.lavenderblush =	 "#FFF0F5";
colour.lavenderblush = 	"#FFF0F5"
colour.lawngreen =	 "#7CFC00";
colour.lawngreen = 	"#7CFC00"
colour.lemonchiffon =	 "#FFFACD";
colour.lemonchiffon = 	"#FFFACD"
colour.lightblue =	 "#ADD8E6";
colour.lightblue = 	"#ADD8E6"
colour.lightcoral =	 "#F08080";
colour.lightcoral = 	"#F08080"
colour.lightcyan =	 "#E0FFFF";
colour.lightcyan = 	"#E0FFFF"
colour.lightgoldenrodyellow =	 "#FAFAD2";
colour.lightgoldenrodyellow = 	"#FAFAD2"
colour.lightgreen =	 "#90EE90";
colour.lightgreen = 	"#90EE90"
colour.lightgrey =	 "#D3D3D3";
colour.lightgrey = 	"#D3D3D3"
colour.lightpink =	 "#FFB6C1";
colour.lightpink = 	"#FFB6C1"
colour.lightsalmon =	 "#FFA07A";
colour.lightsalmon = 	"#FFA07A"
colour.lightseagreen =	 "#20B2AA";
colour.lightseagreen = 	"#20B2AA"
colour.lightskyblue =	 "#87CEFA";
colour.lightskyblue = 	"#87CEFA"
colour.lightslategray =	 "#778899";
colour.lightslategray = 	"#778899"
colour.lightsteelblue =	 "#B0C4DE";
colour.lightsteelblue = 	"#B0C4DE"
colour.lightyellow =	 "#FFFFE0";
colour.lightyellow = 	"#FFFFE0"
colour.lime =	 "#00FF00";
colour.lime = 	"#00FF00"
colour.limegreen =	 "#32CD32";
colour.limegreen = 	"#32CD32"
colour.linen =	 "#FAF0E6";
colour.linen = 	"#FAF0E6"
colour.magenta =	 "#FF00FF";
colour.magenta = 	"#FF00FF"
colour.maroon =	 "#800000";
colour.maroon = 	"#800000"
colour.mediumaquamarine =	 "#66CDAA";
colour.mediumaquamarine = 	"#66CDAA"
colour.mediumblue =	 "#0000CD";
colour.mediumblue = 	"#0000CD"
colour.mediumorchid =	 "#BA55D3";
colour.mediumorchid = 	"#BA55D3"
colour.mediumpurple =	 "#9370DB";
colour.mediumpurple = 	"#9370DB"
colour.mediumseagreen =	 "#3CB371";
colour.mediumseagreen = 	"#3CB371"
colour.mediumslateblue =	 "#7B68EE";
colour.mediumslateblue = 	"#7B68EE"
colour.mediumspringgreen =	 "#00FA9A";
colour.mediumspringgreen = 	"#00FA9A"
colour.mediumturquoise =	 "#48D1CC";
colour.mediumturquoise = 	"#48D1CC"
colour.mediumvioletred =	 "#C71585";
colour.mediumvioletred = 	"#C71585"
colour.midnightblue =	 "#191970";
colour.midnightblue = 	"#191970"
colour.mintcream =	 "#F5FFFA";
colour.mintcream = 	"#F5FFFA"
colour.mistyrose =	 "#FFE4E1";
colour.mistyrose = 	"#FFE4E1"
colour.moccasin =	 "#FFE4B5";
colour.moccasin = 	"#FFE4B5"
colour.navajowhite =	 "#FFDEAD";
colour.navajowhite = 	"#FFDEAD"
colour.navy =	 "#000080";
colour.navy = 	"#000080"
colour.oldlace =	 "#FDF5E6";
colour.oldlace = 	"#FDF5E6"
colour.olive =	 "#808000";
colour.olive = 	"#808000"
colour.olivedrab =	 "#6B8E23";
colour.olivedrab = 	"#6B8E23"
colour.orange =	 "#FFA500";
colour.orange = 	"#FFA500"
colour.orangered =	 "#FF4500";
colour.orangered = 	"#FF4500"
colour.orchid =	 "#DA70D6";
colour.orchid = 	"#DA70D6"
colour.palegoldenrod =	 "#EEE8AA";
colour.palegoldenrod = 	"#EEE8AA"
colour.palegreen =	 "#98FB98";
colour.palegreen = 	"#98FB98"
colour.palevioletred =	 "#DB7093";
colour.palevioletred = 	"#DB7093"
colour.papayawhip =	 "#FFEFD5";
colour.papayawhip = 	"#FFEFD5"
colour.peachpuff =	 "#FFDAB9";
colour.peachpuff = 	"#FFDAB9"
colour.peru =	 "#CD853F";
colour.peru = 	"#CD853F"
colour.pink =	 "#FFC0CB";
colour.pink = 	"#FFC0CB"
colour.plum =	 "#DDA0DD";
colour.plum = 	"#DDA0DD"
colour.powderblue =	 "#B0E0E6";
colour.powderblue = 	"#B0E0E6"
colour.purple =	 "#800080";
colour.purple = 	"#800080"
colour.red =	 "#FF0000";
colour.red = 	"#FF0000"
colour.rosybrown =	 "#BC8F8F";
colour.rosybrown = 	"#BC8F8F"
colour.royalblue =	 "#4169E1";
colour.royalblue = 	"#4169E1"
colour.saddlebrown =	 "#8B4513";
colour.saddlebrown = 	"#8B4513"
colour.salmon =	 "#FA8072";
colour.salmon = 	"#FA8072"
colour.sandybrown =	 "#FAA460";
colour.sandybrown = 	"#FAA460"
colour.seagreen =	 "#2E8B57";
colour.seagreen = 	"#2E8B57"
colour.seashell =	 "#FFF5EE";
colour.seashell = 	"#FFF5EE"
colour.sienna =	 "#A0522D";
colour.sienna = 	"#A0522D"
colour.silver =	 "#C0C0C0";
colour.silver = 	"#C0C0C0"
colour.skyblue =	 "#87CEEB";
colour.skyblue = 	"#87CEEB"
colour.slateblue =	 "#6A5ACD";
colour.slateblue = 	"#6A5ACD"
colour.slategray =	 "#708090";
colour.slategray = 	"#708090"
colour.snow =	 "#FFFAFA";
colour.snow = 	"#FFFAFA"
colour.springgreen =	 "#00FF7F";
colour.springgreen = 	"#00FF7F"
colour.steelblue =	 "#4682B4";
colour.steelblue = 	"#4682B4"
colour.tan =	 "#D2B48C";
colour.tan = 	"#D2B48C"
colour.teal =	 "#008080";
colour.teal = 	"#008080"
colour.thistle =	 "#D8BFD8";
colour.thistle = 	"#D8BFD8"
colour.tomato =	 "#FF6347";
colour.tomato = 	"#FF6347"
colour.turquoise =	 "#40E0D0";
colour.turquoise = 	"#40E0D0"
colour.violet =	 "#EE82EE";
colour.violet = 	"#EE82EE"
colour.wheat =	 "#F5DEB3";
colour.wheat = 	"#F5DEB3"
colour.white =	 "#FFFFFF";
colour.white = 	"#FFFFFF"
colour.whitesmoke =	 "#F5F5F5";
colour.whitesmoke = 	"#F5F5F5"
colour.yellow =	 "#FFFF00";
colour.yellow = 	"#FFFF00"
colour.yellowgreen =	 "#9ACD32";
colour.yellowgreen = 	"#9ACD32"

