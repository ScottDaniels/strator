#
# vim: set noet ts=4 sw=4 background=dark nocindent fileformats=unix :
#
# ================================================================================================
# (c) Copyright 2012-2016 By E. Scott Daniels. All rights reserved.
#
# Redistribution and use in source and binary forms, with or without modification, are
# permitted provided that the following conditions are met:
#
# 1. Redistributions of source code must retain the above copyright notice, this list of
# conditions and the following disclaimer.
#
# 2. Redistributions in binary form must reproduce the above copyright notice, this list
# of conditions and the following disclaimer in the documentation and/or other materials
# provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY E. Scott Daniels AS IS'' AND ANY EXPRESS OR IMPLIED
# WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
# FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL E. Scott Daniels OR
# CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
# CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
# ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
# NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
# ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#
# The views and conclusions contained in the software and documentation are those of the
# authors and should not be interpreted as representing official policies, either expressed
# or implied, of E. Scott Daniels.
# ================================================================================================
#

MKSHELL = ksh

< master.mk

LD_LIBRARY_PATH = `echo /usr/local/lib/sdaniels:$LD_LIBRARY_PATH`
binaries = scribble_r scribble_r_ssl

CFLAGS = -g -I ../include -I ../lib -I /usr/local/include -I /usr/X11R6/include 

# echo is needed as mk bug does not preserve space if $gflag is nil
libs = `echo -L../xi -lxi -L../lib  -lutimage${gflag} -lut${gflag}`

all:V: $binaries

nuke::
	rm -f *.o *.a $binaries

scribble_r_ssl:: scribble_r.c
	$CC $CFLAGS -DUSE_SSL=1 -I /usr/local/lib scribble_r.c -o $target -L /usr/local/lib/sdaniels  -lut -lsissl -lsi  -lssl -lcrypto

scribble_r:: scribble_r.c
	$CC $CFLAGS -DUSE_SSL=0 -I /usr/local/lib scribble_r.c -o $target -L /usr/local/lib/sdaniels  -lut  -lsi  -lssl -lcrypto

