"use client";

import React, { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';

// Define constants outside useEffect so they are accessible
const TILE_SIZE_CONST = 32;
const MAP_WIDTH_TILES_CONST = 25;
const MAP_HEIGHT_TILES_CONST = 18;

const TILE_GRASS = 0;
const TILE_PATH = 1;
const TILE_WALL = 2;
const TILE_WATER = 3;

const PhaserGameInstance = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameInstanceRef.current || !gameContainerRef.current) {
      return; 
    }

    class TownScene extends Phaser.Scene {
      player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
      cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
      shopBuildingZone: Phaser.GameObjects.Zone | null = null;
      gateBuildingZone: Phaser.GameObjects.Zone | null = null;
      worldLayer: Phaser.Tilemaps.TilemapLayer | null = null;
      tileSize: number;

      constructor() {
        super({ key: 'TownScene' });
        this.tileSize = TILE_SIZE_CONST;
      }

      preload() {
        if (!this.textures.exists('town_tileset')) {
            const graphicsOptions: Phaser.Types.GameObjects.Graphics.Options = { x: 0, y: 0 }; 
            const tilesetGraphics = this.make.graphics(graphicsOptions, false);
            
            tilesetGraphics.fillStyle(0x90BE6D, 1); 
            tilesetGraphics.fillRect(0, 0, this.tileSize, this.tileSize);
            tilesetGraphics.fillStyle(0xD2B48C, 1); 
            tilesetGraphics.fillRect(this.tileSize, 0, this.tileSize, this.tileSize);
            tilesetGraphics.fillStyle(0x808080, 1); 
            tilesetGraphics.fillRect(this.tileSize * 2, 0, this.tileSize, this.tileSize);
            tilesetGraphics.fillStyle(0x4682B4, 1); 
            tilesetGraphics.fillRect(this.tileSize*3, 0, this.tileSize, this.tileSize);

            tilesetGraphics.generateTexture('town_tileset', this.tileSize * 4, this.tileSize);
            tilesetGraphics.destroy();
        }

        if (!this.textures.exists('player_sprite')) {
            const graphicsOptions: Phaser.Types.GameObjects.Graphics.Options = {x:0, y:0};
            const playerGraphics = this.make.graphics(graphicsOptions, false);
            playerGraphics.fillStyle(0xEE6352, 1);
            playerGraphics.fillRect(0, 0, this.tileSize * 0.8, this.tileSize * 1.2);
            playerGraphics.generateTexture('player_sprite', this.tileSize * 0.8, this.tileSize * 1.2);
            playerGraphics.destroy();
        }
      }

      create() {
        const mapData: number[][] = [];
        for (let y = 0; y < MAP_HEIGHT_TILES_CONST; y++) {
            mapData[y] = [];
            for (let x = 0; x < MAP_WIDTH_TILES_CONST; x++) {
                if (y === 0 || y === MAP_HEIGHT_TILES_CONST - 1 || x === 0 || x === MAP_WIDTH_TILES_CONST - 1) {
                    mapData[y][x] = TILE_WALL;
                } else if (x > 5 && x < 10 && y > 5 && y < 10) {
                    mapData[y][x] = TILE_WATER;
                } else if (y === Math.floor(MAP_HEIGHT_TILES_CONST / 2) && x > 2 && x < MAP_WIDTH_TILES_CONST -3) {
                    mapData[y][x] = TILE_PATH;
                } else if (x === Math.floor(MAP_WIDTH_TILES_CONST / 2) && y > 2 && y < MAP_HEIGHT_TILES_CONST -3) {
                    mapData[y][x] = TILE_PATH;
                } else {
                    mapData[y][x] = TILE_GRASS;
                }
            }
        }
        mapData[8][4] = TILE_WALL;
        mapData[8][5] = TILE_WALL;
        mapData[8][6] = TILE_WALL;
        mapData[7][6] = TILE_WALL;
        mapData[6][6] = TILE_WALL;
        mapData[8][18] = TILE_WALL;
        mapData[8][19] = TILE_WALL;
        mapData[8][20] = TILE_WALL;
        mapData[7][18] = TILE_WALL;
        mapData[6][18] = TILE_WALL;

        const map = this.make.tilemap({ data: mapData, tileWidth: this.tileSize, tileHeight: this.tileSize });
        const tiles = map.addTilesetImage('town_tileset', undefined, this.tileSize, this.tileSize, 0, 0);
        
        this.worldLayer = map.createLayer(0, tiles || 'town_tileset', 0, 0);
        if (!this.worldLayer) {
            console.error("World layer could not be created!");
            return;
        }
        this.worldLayer.setCollision(TILE_WALL);
        this.worldLayer.setCollision(TILE_WATER);

        this.player = this.physics.add.sprite(this.tileSize * 2, this.tileSize * Math.floor(MAP_HEIGHT_TILES_CONST/2) , 'player_sprite');
        this.player.setCollideWorldBounds(false); // We'll use map bounds for collision
        this.physics.add.collider(this.player, this.worldLayer);

        const shopTileX = 5;
        const shopTileY = 7;
        const shopVisual = this.add.rectangle(shopTileX * this.tileSize + this.tileSize / 2, shopTileY * this.tileSize - this.tileSize, this.tileSize * 2, this.tileSize * 1.5, 0xA0522D).setAlpha(0.7);
        this.add.text(shopVisual.x, shopVisual.y - this.tileSize, "SHOP", { color: '#FFFFFF', fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);
        this.shopBuildingZone = this.add.zone(shopVisual.x, shopVisual.y, shopVisual.width, shopVisual.height).setOrigin(0.5);
        this.physics.world.enable(this.shopBuildingZone);
        (this.shopBuildingZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        (this.shopBuildingZone.body as Phaser.Physics.Arcade.Body).moves = false;

        const gateTileX = 19;
        const gateTileY = 7;
        const gateVisual = this.add.rectangle(gateTileX * this.tileSize + this.tileSize / 2, gateTileY * this.tileSize - this.tileSize, this.tileSize * 2, this.tileSize * 1.5, 0x808080).setAlpha(0.7);
        this.add.text(gateVisual.x, gateVisual.y - this.tileSize, "GATE", { color: '#FFFFFF', fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);
        this.gateBuildingZone = this.add.zone(gateVisual.x, gateVisual.y, gateVisual.width, gateVisual.height).setOrigin(0.5);
        this.physics.world.enable(this.gateBuildingZone);
        (this.gateBuildingZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        (this.gateBuildingZone.body as Phaser.Physics.Arcade.Body).moves = false;
        
        this.cursors = this.input.keyboard?.createCursorKeys();

        if (this.player && this.shopBuildingZone) {
            this.physics.add.overlap(this.player, this.shopBuildingZone, this.handleEnterShop, undefined, this);
        }
        if (this.player && this.gateBuildingZone) {
            this.physics.add.overlap(this.player, this.gateBuildingZone, this.handleEnterGate, undefined, this);
        }

        this.cameras.main.setBounds(0, 0, MAP_WIDTH_TILES_CONST * this.tileSize, MAP_HEIGHT_TILES_CONST * this.tileSize);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.add.text(10, 10, 'Move with Arrow Keys.', { fontSize: '16px', color: '#000000', backgroundColor: '#FFFFFF', padding: { x:5, y:5} }).setScrollFactor(0);
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
        if (!this.player || !this.cursors) {
          return;
        }
        const speed = 160;
        this.player.setVelocity(0);

        if (this.cursors.left.isDown) {
          this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
          this.player.setVelocityX(speed);
        }

        if (this.cursors.up.isDown) {
          this.player.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
          this.player.setVelocityY(speed);
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current as HTMLElement,
      width: MAP_WIDTH_TILES_CONST * TILE_SIZE_CONST,
      height: MAP_HEIGHT_TILES_CONST * TILE_SIZE_CONST,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
        }
      },
      scene: [TownScene]
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
      style={{ width: MAP_WIDTH_TILES_CONST * TILE_SIZE_CONST, height: MAP_HEIGHT_TILES_CONST * TILE_SIZE_CONST }} 
    />
  );
};

export default PhaserGameInstance; 