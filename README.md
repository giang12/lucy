# lucy 

[https://www.youtube.com/watch?v=iGmMrCsGoeo](https://www.youtube.com/watch?v=iGmMrCsGoeo)

1. npm install

2. download approriate ffmpeg binary fo yo system @ [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
		
		"The ffmpeg binary included for SNOW LEOPARD ABOVE AND/OR INTEL ONLY 64-BIT"

3. rename ./config-example -> ./config & set approriate config (keys included are dev keys so yeah)

4. node lucy.js

		Or to keep it running forever:[https://www.npmjs.com/package/forever](https://www.npmjs.com/package/forever)
		
		[sudo] npm install -g forever
		
		forever start lucy.js


#folders:

./vault/track_info/  store trackinfo

./vault/track_audio/ store mp3 files

./vault/track_Video/ store mp4 files //disabled

#TODO:
-Sync PLaylists

	Work On Ethel:

	+Retrieve access token thru webapi. √ done

	+Get All PLaylists. √ done 

	-Self-refresh access token

	-Get All Songs From Playlists. (almost done, rate limit)

	-need to add rate limiting work around(multiple keys swap, delay schedule...etc)

	Work on Lucy:

	-Save playlists in vault

	-Sync With Ethel thru socket to update web interface

-Cache queries

	-Cache success queries(by time 12h, self-destruct cache folder)
	
-Be cool to search soundclound, torrents

	
