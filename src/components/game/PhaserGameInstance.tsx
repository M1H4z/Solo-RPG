"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';

// Define constants outside useEffect so they are accessible
const TILE_SIZE_CONST = 16;
// const MAP_WIDTH_TILES_CONST = 25; // No longer primary for canvas sizing
// const MAP_HEIGHT_TILES_CONST = 18; // No longer primary for canvas sizing

// const TILE_GRASS = 0; // Obsolete
// const TILE_PATH = 1; // Obsolete
// const TILE_WALL = 2; // Obsolete
// const TILE_WATER = 3; // Obsolete

// --- TARGET FIXED CANVAS SIZE --- 
// TODO: Get these dimensions from the user / UI layout
const FIXED_CANVAS_WIDTH_PX = 640; 
const FIXED_CANVAS_HEIGHT_PX = 480;

// --- ASSET PATHS & TILED NAMES (Keep these verified) ---
const TILED_MAP_KEY = 'dungeonMap1';
const TILED_MAP_JSON_PATH = 'images/dungeons/dungeons_1/dungeon_1.json';
const TILESET_NAME_IN_TILED = 'Legend_Spider_Dungeon';
const TILESET_IMAGE_KEY = 'legendSpiderDungeonTiles';
const TILESET_IMAGE_PATH = 'images/dungeons/dungeons_1/Legend_Spider_Dungeon.png';
const PLAYER_SPRITE_KEY = 'playerSprite';
const PLAYER_SPRITE_PATH = 'assets/sprites/player_char.png'; 

// --- TILED LAYER & OBJECT NAMES (FROM YOUR SCREENSHOT & dungeon_1.json partial analysis) ---
const BACKGROUND_LAYER_NAME = 'background';
const FOREGROUND_LAYER_NAME = 'foreground';
const COLLISION_LAYER_NAME = 'collision';
const PLAYER_START_OBJECT_LAYER_NAME = 'PlayerStart';
const PLAYER_START_OBJECT_NAME = 'PlayerStart';
const ROOM_DEFINITION_OBJECT_LAYER_NAME = 'rooms';
const SHOP_ZONE_OBJECT_NAME = 'ShopZone';
const GATE_ZONE_OBJECT_NAME = 'GateZone';

// Calculate map dimensions based on dungeon_1.json (64x48 tiles, 16px tile size)
const DUNGEON1_MAP_WIDTH_PX = 64 * TILE_SIZE_CONST; // 64 * 16 = 1024
const DUNGEON1_MAP_HEIGHT_PX = 48 * TILE_SIZE_CONST; // 48 * 16 = 768

// Default canvas size if no rooms are found initially (should not happen in a well-configured map)
const DEFAULT_ROOM_WIDTH_PX = 320; // 20 tiles
const DEFAULT_ROOM_HEIGHT_PX = 240; // 15 tiles

const PhaserGameInstance = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  // Container size is now fixed, so useState for it is removed for this approach.

  useEffect(() => {
    if (gameInstanceRef.current || !gameContainerRef.current) {
      return;
    }

    const container = gameContainerRef.current; // Keep ref for parent

    class TownScene extends Phaser.Scene {
      player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
      cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
      shopBuildingZone: Phaser.GameObjects.Zone | null = null;
      gateBuildingZone: Phaser.GameObjects.Zone | null = null;
      backgroundLayer: Phaser.Tilemaps.TilemapLayer | null = null;
      foregroundLayer: Phaser.Tilemaps.TilemapLayer | null = null;
      collisionLayer: Phaser.Tilemaps.TilemapLayer | null = null;
      tileSize: number;
      roomRects: Phaser.Geom.Rectangle[] = [];
      currentRoomCameraBounds: Phaser.Geom.Rectangle | null = null;
      mapTotalWidth: number = 0;
      mapTotalHeight: number = 0;
      
      constructor() {
        super({ key: 'TownScene' });
        this.tileSize = TILE_SIZE_CONST; // Default, will be updated from map
      }

      preload() {
        this.load.tilemapTiledJSON(TILED_MAP_KEY, TILED_MAP_JSON_PATH);
        this.load.image(TILESET_IMAGE_KEY, TILESET_IMAGE_PATH);
        if (!this.textures.exists(PLAYER_SPRITE_KEY)) {
            const playerGraphics = this.make.graphics({ x:0, y:0 }, false);
            playerGraphics.fillStyle(0xEE6352, 1);
            const playerWidth = this.tileSize * 0.8; // Placeholder size
            const playerHeight = this.tileSize * 1.2;
            playerGraphics.fillRect(0, 0, playerWidth, playerHeight);
            playerGraphics.generateTexture(PLAYER_SPRITE_KEY, playerWidth, playerHeight);
            playerGraphics.destroy();
        }
      }

      create() {
        const map = this.make.tilemap({ key: TILED_MAP_KEY });
        if (!map) return;

        this.mapTotalWidth = map.widthInPixels;
        this.mapTotalHeight = map.heightInPixels;
        this.tileSize = map.tileWidth; // Use actual tile width from map

        const tileset = map.addTilesetImage(TILESET_NAME_IN_TILED, TILESET_IMAGE_KEY);
        if (!tileset) {
            console.error("Tileset not loaded!"); return;
        }

        this.backgroundLayer = map.createLayer(BACKGROUND_LAYER_NAME, tileset, 0, 0);
        if (!this.backgroundLayer) {
            console.warn(`Background layer "${BACKGROUND_LAYER_NAME}" not found or failed to create.`);
        }

        this.collisionLayer = map.createLayer(COLLISION_LAYER_NAME, tileset, 0, 0);
        if (!this.collisionLayer) {
            console.error(`Collision layer "${COLLISION_LAYER_NAME}" not found or failed to create. Player collision will not work.`);
        } else {
            this.collisionLayer.setCollisionByExclusion([-1, 0]);
            this.collisionLayer.setVisible(false);
        }
        
        let playerStartX = this.tileSize * 2;
        let playerStartY = this.tileSize * 5;

        const playerStartLayer = map.getObjectLayer(PLAYER_START_OBJECT_LAYER_NAME);
        if (playerStartLayer) {
            console.log(`[DEBUG] Object layer for PlayerStart "${PLAYER_START_OBJECT_LAYER_NAME}" found.`);
            if (playerStartLayer.objects && playerStartLayer.objects.length > 0) {
                console.log(`[DEBUG] Objects found in layer '${PLAYER_START_OBJECT_LAYER_NAME}':`, JSON.stringify(playerStartLayer.objects.map(obj => ({ name: obj.name, type: obj.type, x: obj.x, y: obj.y, width: obj.width, height: obj.height }))));
            } else {
                console.log(`[DEBUG] No objects found in layer '${PLAYER_START_OBJECT_LAYER_NAME}'.`);
            }
            const playerStartObj = playerStartLayer.objects.find(obj => obj.name === PLAYER_START_OBJECT_NAME || obj.type === PLAYER_START_OBJECT_NAME);
            console.log(`[DEBUG] PlayerStart object '${PLAYER_START_OBJECT_NAME}' found in layer '${PLAYER_START_OBJECT_LAYER_NAME}':`, !!playerStartObj);
            if (playerStartObj && playerStartObj.x != null && playerStartObj.y != null) {
                playerStartX = playerStartObj.x + (playerStartObj.width || 0) / 2;
                playerStartY = playerStartObj.y + (playerStartObj.height || 0) / 2;
                console.log(`[DEBUG] Using player start coordinates from object: X=${playerStartX}, Y=${playerStartY}`);
            } else {
                console.warn(`[DEBUG] PlayerStart object "${PLAYER_START_OBJECT_NAME}" not found in "${PLAYER_START_OBJECT_LAYER_NAME}". Using default coordinates: X=${playerStartX}, Y=${playerStartY}`);
            }
        } else {
            console.warn(`[DEBUG] Object layer for PlayerStart "${PLAYER_START_OBJECT_LAYER_NAME}" not found. Using default coordinates: X=${playerStartX}, Y=${playerStartY}`);
        }

        // --- Load Room Definitions ---
        const roomBoundsLayer = map.getObjectLayer(ROOM_DEFINITION_OBJECT_LAYER_NAME);
        if (roomBoundsLayer) {
            console.log(`[DEBUG] Room definition object layer "${ROOM_DEFINITION_OBJECT_LAYER_NAME}" found.`);
            roomBoundsLayer.objects.forEach(obj => {
                if (obj.type === 'room' && obj.x != null && obj.y != null && obj.width != null && obj.height != null) {
                    this.roomRects.push(new Phaser.Geom.Rectangle(obj.x, obj.y, obj.width, obj.height));
                }
            });
            console.log(`[DEBUG] Loaded ${this.roomRects.length} room definitions.`);
        } else {
            console.warn(`[DEBUG] Room definition object layer "${ROOM_DEFINITION_OBJECT_LAYER_NAME}" not found. Camera will not be bound to rooms.`);
        }

        this.player = this.physics.add.sprite(playerStartX, playerStartY, PLAYER_SPRITE_KEY);
        if (this.collisionLayer) {
            this.physics.add.collider(this.player, this.collisionLayer);
        } else {
            console.warn("No collision layer for player collision.");
        }

        this.foregroundLayer = map.createLayer(FOREGROUND_LAYER_NAME, tileset, 0, 0);
        if (!this.foregroundLayer) {
            console.warn(`Foreground layer "${FOREGROUND_LAYER_NAME}" not found or failed to create.`);
        }

        if (playerStartLayer) {
            const shopObj = playerStartLayer.objects.find(obj => obj.name === SHOP_ZONE_OBJECT_NAME || obj.type === SHOP_ZONE_OBJECT_NAME);
            if (shopObj && shopObj.x != null && shopObj.y != null && shopObj.width && shopObj.height) {
                this.shopBuildingZone = this.add.zone(shopObj.x, shopObj.y, shopObj.width, shopObj.height).setOrigin(0,0);
                this.physics.world.enable(this.shopBuildingZone);
                (this.shopBuildingZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
                (this.shopBuildingZone.body as Phaser.Physics.Arcade.Body).moves = false;
                 if (this.player) this.physics.add.overlap(this.player, this.shopBuildingZone, this.handleEnterShop, undefined, this);
            } else {
                console.warn(`Shop zone object "${SHOP_ZONE_OBJECT_NAME}" not found in "${PLAYER_START_OBJECT_LAYER_NAME}".`);
            }

            const gateObj = playerStartLayer.objects.find(obj => obj.name === GATE_ZONE_OBJECT_NAME || obj.type === GATE_ZONE_OBJECT_NAME);
            if (gateObj && gateObj.x != null && gateObj.y != null && gateObj.width && gateObj.height) {
                this.gateBuildingZone = this.add.zone(gateObj.x, gateObj.y, gateObj.width, gateObj.height).setOrigin(0,0);
                this.physics.world.enable(this.gateBuildingZone);
                (this.gateBuildingZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
                (this.gateBuildingZone.body as Phaser.Physics.Arcade.Body).moves = false;
                if (this.player) this.physics.add.overlap(this.player, this.gateBuildingZone, this.handleEnterGate, undefined, this);
            } else {
                 console.warn(`Gate zone object "${GATE_ZONE_OBJECT_NAME}" not found in "${PLAYER_START_OBJECT_LAYER_NAME}".`);
            }
        }

        this.cursors = this.input.keyboard?.createCursorKeys();

        // Camera initially looks at the whole map, but will be adjusted by setCameraToPlayerRoom
        this.cameras.main.setBounds(0, 0, this.mapTotalWidth, this.mapTotalHeight);
        
        if (this.player) {
            // Set initial room bounds AND camera zoom first
            this.setCameraToPlayerRoom(true); 
            // Then start following. Explicitly set no deadzone.
            this.cameras.main.startFollow(this.player, true, 0.08, 0.08, 0, 0);
            console.log("[DEBUG] Camera set to follow player with no deadzone.");
        } else {
            // Fallback if player isn't created - unlikely if PlayerStart is defined
            this.cameras.main.setZoom(1); // Default zoom
        }

        this.add.text(10, 10, 'Fixed Size Canvas - Zoomed Room Camera', { fontSize: '16px', color: '#FFFFFF', backgroundColor: '#000000', padding: { x:5, y:5} }).setScrollFactor(0);
      }

      setCameraToPlayerRoom(isInitialSetup = false) {
        if (!this.player) return;

        const targetCanvasWidth = Number(this.sys.game.config.width);
        const targetCanvasHeight = Number(this.sys.game.config.height);

        if (this.roomRects.length === 0) {
            if (isInitialSetup) {
                 console.warn("[DEBUG] No room definitions. Camera uses map bounds. Zoom set to 1.");
                 this.cameras.main.setBounds(0, 0, this.mapTotalWidth, this.mapTotalHeight);
                 this.cameras.main.setZoom(1); // Default zoom if no rooms
            }
            return;
        }

        const playerCenterX = this.player.x;
        const playerCenterY = this.player.y;
        let foundRoomThisFrame = false;

        for (const roomRect of this.roomRects) {
            if (Phaser.Geom.Rectangle.Contains(roomRect, playerCenterX, playerCenterY)) {
                if (this.currentRoomCameraBounds !== roomRect || isInitialSetup) {
                    this.currentRoomCameraBounds = roomRect;
                    // Temporarily comment out setBounds to see if it conflicts with follow at high zoom
                    // this.cameras.main.setBounds(roomRect.x, roomRect.y, roomRect.width, roomRect.height);
                    // console.log(`[DEBUG] Camera bounds would have been set to: X:${roomRect.x}, Y:${roomRect.y}, W:${roomRect.width}, H:${roomRect.height}`);

                    const zoomX = targetCanvasWidth / roomRect.width;
                    const zoomY = targetCanvasHeight / roomRect.height;
                    const newZoom = Math.min(zoomX, zoomY); // Fit entire room, maintain aspect ratio
                    
                    this.cameras.main.setZoom(newZoom);
                    console.log(`[DEBUG] Player in room. Bounds: ${JSON.stringify(roomRect)}. Zoom: ${newZoom.toFixed(2)}`);
                }
                foundRoomThisFrame = true;
                break;
            }
        }

        if (!foundRoomThisFrame && isInitialSetup && this.roomRects.length > 0) {
            // Player didn't start in any defined room. Use first room.
            const firstRoom = this.roomRects[0];
            console.warn("[DEBUG] Player not in defined room initially. Using first room for bounds & zoom.");
            this.currentRoomCameraBounds = firstRoom;
            // Temporarily comment out setBounds for initial room as well
            // this.cameras.main.setBounds(firstRoom.x, firstRoom.y, firstRoom.width, firstRoom.height);
            // console.log(`[DEBUG] Initial camera bounds would have been set to: X:${firstRoom.x}, Y:${firstRoom.y}, W:${firstRoom.width}, H:${firstRoom.height}`);

            const zoomX = targetCanvasWidth / firstRoom.width;
            const zoomY = targetCanvasHeight / firstRoom.height;
            const newZoom = Math.min(zoomX, zoomY);
            this.cameras.main.setZoom(newZoom);
        } else if (!foundRoomThisFrame && !isInitialSetup) {
            // Player moved out of all known rooms - camera does not change bounds or zoom
            // This maintains the view of the last known room. Alternative: reset to map view or a default.
             console.warn("[DEBUG] Player is not currently inside any defined room rectangle!");
        }
      }

      handleEnterShop() {
        console.log('Player is at the SHOP zone!');
        const feedbackText = this.add.text(this.player!.x, this.player!.y - this.tileSize, 'Near Shop!', { fontSize: '14px', color: '#FFD700', backgroundColor: 'rgba(0,0,0,0.7)'}).setOrigin(0.5);
        this.time.delayedCall(1500, () => feedbackText.destroy());
        
        if (this.shopBuildingZone && this.player) {
            (this.shopBuildingZone.body as Phaser.Physics.Arcade.Body).enable = false;
            this.time.delayedCall(2000, () => {
                if (this.shopBuildingZone) (this.shopBuildingZone.body as Phaser.Physics.Arcade.Body).enable = true;
            });
        }
      }

      handleEnterGate() {
        console.log('Player is at the GATE zone!');
        const feedbackText = this.add.text(this.player!.x, this.player!.y - this.tileSize, 'Near Gate!', { fontSize: '14px', color: '#FFD700', backgroundColor: 'rgba(0,0,0,0.7)'}).setOrigin(0.5);
        this.time.delayedCall(1500, () => feedbackText.destroy());

        if (this.gateBuildingZone && this.player) {
            (this.gateBuildingZone.body as Phaser.Physics.Arcade.Body).enable = false;
            this.time.delayedCall(2000, () => {
                 if (this.gateBuildingZone) (this.gateBuildingZone.body as Phaser.Physics.Arcade.Body).enable = true;
            });
        }
      }

      update() {
        if (!this.player || !this.cursors) return;
        const speed = 160;
        this.player.setVelocity(0);
        if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
        else if (this.cursors.right.isDown) this.player.setVelocityX(speed);
        if (this.cursors.up.isDown) this.player.setVelocityY(-speed);
        else if (this.cursors.down.isDown) this.player.setVelocityY(speed);
        
        // Debugging logs for player and camera positions
        console.log(`Player X: ${this.player.x.toFixed(2)}, Y: ${this.player.y.toFixed(2)} | CamScroll X: ${this.cameras.main.scrollX.toFixed(2)}, Y: ${this.cameras.main.scrollY.toFixed(2)} | CamZoom: ${this.cameras.main.zoom.toFixed(2)}`);

        this.setCameraToPlayerRoom(); 
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: container,
      width: FIXED_CANVAS_WIDTH_PX, 
      height: FIXED_CANVAS_HEIGHT_PX,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
        }
      },
      scene: [TownScene] // Scene is now directly an array
    };

    gameInstanceRef.current = new Phaser.Game(config);

    return () => {
      gameInstanceRef.current?.destroy(true);
      gameInstanceRef.current = null;
    };
  }, []);

  return (
    <div 
      ref={gameContainerRef} 
      id="phaser-town-container" 
      className="mx-auto border-4 border-yellow-400 rounded overflow-hidden"
      style={{ width: FIXED_CANVAS_WIDTH_PX, height: FIXED_CANVAS_HEIGHT_PX }}
    />
  );
};

export default PhaserGameInstance; 