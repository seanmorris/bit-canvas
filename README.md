# BitCavas

https://bit-canvas.seanmorr.is/

## About

Extract & decompress pixel & text from ROM files of classic games.

* Gameboy Encodings:
	* 2bpp 8x8 tiles
	* 1bpp 8x8 tiles
	* 1bpp 2px columns
	* 4-bit RLE/Delta compressed sprites (pokemon algorithm)
	* Generation 1 Pokedex data format

* Misc:
	* 8 bit greyscale
	* 1 bit b & w

## Decoding Sprites

Right now, the only games supported are the US version of Pokemon Red & Blue. To extract the sprites from the ROM, simply drag the ROM file into the application, and double click to open it. Click the action icon and select RLE. Then input the sprite's offset, for example, Charmander's frontsprite is at 220252.

## Hotkeys

Be sure the canvas is focused first...

🠉/🠋 - Move up/down.
🠈/🠊 - Move Offset left/right.

Ctrl - Fine movement
Shift - Coarse movement


## Screenshots

![Screenshot showing pokemon red, 2bpp decoded, with a decompressed Charizard sprite](https://bit-canvas.seanmorr.is/pkmn-red-screenshot.png)

![Screenshot showing pokemon yellow, 2bpp decoded, side-by-side with byte-inverted copy of same buffer](https://bit-canvas.seanmorr.is/pkmn-yellow-screenshot.png)

