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
#  Master file included by all mkfiles 

SRC_DIR = `echo ${SRC_ROOT:-..}`
MKSHELL = /bin/ksh
CC = gcc
IFLAGS = -I. -I$SRC_DIR/include
CFLAGS = -g
LFLAGS = 
TARGET_BIN=`echo ${TARGET_BIN:-$HOME/bin}`

NUKE = *.o *.a  *.eps *.png

backup_dir = $HOME/backup

# ===========================================================================

# the & meta character does not match / and this IS important!
&:      &.o
	$CC $IFLAGS $CFLAGS -o $target $prereq $LFLAGS

&.o:    &.c
	$CC $IFLAGS $CFLAGS -c $stem.c

#&.html: &.xfm
#	XFM_IMBED=$HOME/lib hfm ${prereq%% *} $target

&:	&.go
	echo "use go build, not mk, to build go source"

%.eps: %.fig
	fig2dev -L eps ${prereq} ${target}

%.png: %.fig
	fig2dev -L png ${prereq} ${target}

%_slides :  %_slides.xfm
	pfm -g 8ix11i ${prereq%% *} $target.ps

%.ps :  %.xfm
	pfm ${prereq%% *} $target

%.html :  %.xfm
	hfm ${prereq%% *} $target

%.pdf : %.ps
	gs -I/usr/local/share/ghostscript/fonts -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -sOutputFile=$target ${prereq% *}

%.txt : %.xfm
	tfm ${prereq%% *} $target


# ===========================================================================

all:V:	$ALL

nuke:
	rm -f $NUKE


# anything on the install list, of the form [path/]source[:[path/]target]
install:QV:
	for x in $INSTALL
	do
		source=${x%%:*}
		if [[ $x == *:* ]]
		then
			target=${x##*:}
		else
			target=$TARGET_BIN/${source##*/}
		fi
	
		if [[ -d $target ]]
		then
			target=${target:-$TARGET_BIN}/${source##*/}
		fi
	
		if [[ -f $target ]]
		then
			mv -f  $target $target-
			rm -f  $target-
		fi
	
		cp $source $target
		chmod 775 $target
		ls -al $target
	done

# ---------------- making of backup stuff ------------------------
tar_contents=`ls *.c *.h *.ksh *.java mkfile $ADD2BACKUP 2>/dev/null`
tarf=`echo ${PWD##*/}.tgz`
$tarf::	$tar_contents
	tar -cf - ${tar_contents:-foo} | gzip -c >$tarf

tar:V:	$tarf
backup:QV:	$tarf
	ls -al $tarf
	mv $tarf $backup_dir
