# lucy

1. npm install

2. rename ./config-example -> ./config & set approriate config (keys included are dev keys so yeah)

3. node lucy.js


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

	