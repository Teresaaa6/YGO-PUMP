
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Player, Platform, Coin, Particle, Enemy, Laser, Candle } from '../types';
import { 
    GRAVITY, JUMP_FORCE, MOVE_SPEED, FRICTION, 
    CANVAS_WIDTH, CANVAS_HEIGHT, 
    COLOR_BRAND_ORANGE, COLOR_BG, COLOR_WHITE,
    COLOR_CHART_GREEN, COLOR_CHART_RED,
    ENEMY_SPEED, LASER_SPEED, LASER_COOLDOWN,
    LEVEL_HEIGHT, START_Y
} from '../constants';

const YomirgoGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>(GameState.MENU);
    const [score, setScore] = useState(0);
    const [currentPrice, setCurrentPrice] = useState(0.0420); // Starting price
    const requestRef = useRef<number>(0);
    
    // Game State
    const playerRef = useRef<Player>({ x: 300, y: START_Y, w: 40, h: 32, vx: 0, vy: 0, isGrounded: false, facingRight: true, invulnerable: 0 });
    const keysRef = useRef<{ [key: string]: boolean }>({});
    const cameraYRef = useRef(START_Y - CANVAS_HEIGHT + 200);
    
    const platformsRef = useRef<Platform[]>([]);
    const coinsRef = useRef<Coin[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const enemiesRef = useRef<Enemy[]>([]);
    const lasersRef = useRef<Laser[]>([]);
    const candlesRef = useRef<Candle[]>([]); // Background decorations

    // --- Level Generation ---
    const generateLevel = useCallback(() => {
        const platforms: Platform[] = [];
        const coins: Coin[] = [];
        const enemies: Enemy[] = [];
        const candles: Candle[] = [];

        // 1. Background Candles (Procedural K-Line)
        let cy = LEVEL_HEIGHT + 200;
        while (cy > -500) {
            const h = 20 + Math.random() * 80;
            const isGreen = Math.random() > 0.45; // Slightly bullish
            candles.push({
                x: Math.random() * CANVAS_WIDTH,
                y: cy,
                w: 10 + Math.random() * 20,
                h: h,
                wickH: h + 20 + Math.random() * 40,
                isGreen
            });
            cy -= (40 + Math.random() * 100);
        }
        candlesRef.current = candles;

        // 2. Starting Floor
        platforms.push({ id: 'floor', x: 0, y: START_Y + 50, w: CANVAS_WIDTH, h: 40, type: 'floor', color: COLOR_BRAND_ORANGE });

        // 3. Vertical Procedural Generation
        let currentY = START_Y - 100;
        let platformCount = 0;
        const specialText = ["AI", "MEGA", "PLANT"];
        let textIndex = 0;

        while (currentY > 0) {
            platformCount++;
            const isSpecialRow = platformCount % 8 === 0; // Every 8th row is a word
            
            if (isSpecialRow) {
                // AI MEGA PLANT Blocks
                const text = specialText[textIndex % specialText.length];
                textIndex++;
                const w = 120;
                const x = (CANVAS_WIDTH / 2) - (w/2);
                
                platforms.push({
                    id: `p-${currentY}`,
                    x, y: currentY, w, h: 30,
                    type: 'text',
                    text: text,
                    color: COLOR_WHITE
                });
                
                // Add Robot guardian
                enemies.push({
                    id: Math.random(),
                    type: 'robot',
                    x: x,
                    y: currentY - 40,
                    w: 30, h: 30,
                    vx: ENEMY_SPEED,
                    patrolStart: x,
                    patrolEnd: x + w,
                    dead: false,
                    deadTimer: 0,
                    shootTimer: Math.random() * 100
                });

            } else {
                // Random Platforms
                const gap = 100 + Math.random() * 50; // Vertical gap
                const w = 80 + Math.random() * 60;
                const x = Math.random() * (CANVAS_WIDTH - w);
                
                platforms.push({
                    id: `p-${currentY}`,
                    x, y: currentY, w, h: 20,
                    type: 'block',
                    color: Math.random() > 0.8 ? COLOR_BRAND_ORANGE : '#444'
                });

                // Chance for Coin
                if (Math.random() > 0.3) {
                    coins.push({
                        id: Math.random(),
                        x: x + w/2,
                        y: currentY - 30,
                        size: 10,
                        collected: false,
                        rotationOffset: Math.random()
                    });
                }
            }

            currentY -= (90 + Math.random() * 40); // Move up
        }

        // Final Victory Platform
        platforms.push({ 
            id: 'victory', 
            x: 100, y: -100, w: CANVAS_WIDTH - 200, h: 40, 
            type: 'text', text: 'TO THE MOON', color: COLOR_BRAND_ORANGE 
        });

        platformsRef.current = platforms;
        coinsRef.current = coins;
        enemiesRef.current = enemies;
        lasersRef.current = [];
        particlesRef.current = [];

    }, []);

    const resetGame = () => {
        playerRef.current = { x: CANVAS_WIDTH/2 - 20, y: START_Y, w: 40, h: 32, vx: 0, vy: 0, isGrounded: false, facingRight: true, invulnerable: 0 };
        cameraYRef.current = START_Y - CANVAS_HEIGHT + 200;
        keysRef.current = {};
        setScore(0);
        setCurrentPrice(0.0420);
        generateLevel();
        setGameState(GameState.PLAYING);
    };

    // --- Input ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keysRef.current[e.code] = true;
            if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight", "Space"].indexOf(e.code) > -1) {
                e.preventDefault();
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            keysRef.current[e.code] = false;
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleTouchStart = (action: string) => {
        if (action === 'JUMP') keysRef.current['Space'] = true;
        if (action === 'LEFT') keysRef.current['ArrowLeft'] = true;
        if (action === 'RIGHT') keysRef.current['ArrowRight'] = true;
    };
    const handleTouchEnd = (action: string) => {
        if (action === 'JUMP') keysRef.current['Space'] = false;
        if (action === 'LEFT') keysRef.current['ArrowLeft'] = false;
        if (action === 'RIGHT') keysRef.current['ArrowRight'] = false;
    };

    // --- Update Loop ---
    const update = () => {
        if (gameState !== GameState.PLAYING) return;

        const player = playerRef.current;
        const keys = keysRef.current;
        const enemies = enemiesRef.current;

        // 1. Player Physics
        if (keys['ArrowLeft'] || keys['KeyA']) {
            player.vx -= 1;
            player.facingRight = false;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            player.vx += 1;
            player.facingRight = true;
        }

        player.vx = Math.max(Math.min(player.vx, MOVE_SPEED), -MOVE_SPEED);

        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.isGrounded) {
            player.vy = JUMP_FORCE;
            player.isGrounded = false;
            createParticles(player.x + player.w/2, player.y + player.h, COLOR_BRAND_ORANGE, 5, 'explosion');
        }

        player.vx *= FRICTION;
        player.vy += GRAVITY;
        player.x += player.vx;
        player.y += player.vy;

        // Screen wrapping for horizontal movement
        if (player.x < -player.w) player.x = CANVAS_WIDTH;
        if (player.x > CANVAS_WIDTH) player.x = -player.w;

        // 2. Collision
        player.isGrounded = false;
        
        // Death by falling
        if (player.y > cameraYRef.current + CANVAS_HEIGHT + 100) {
            setGameState(GameState.GAME_OVER);
        }

        platformsRef.current.forEach(plat => {
            // One-way platforms mostly, but let's do solid blocks for simplicity
            if (
                player.vy > 0 && // Falling
                player.x + player.w > plat.x + 5 &&
                player.x < plat.x + plat.w - 5 &&
                player.y + player.h > plat.y &&
                player.y + player.h < plat.y + plat.h + player.vy + 2
            ) {
                player.y = plat.y - player.h;
                player.vy = 0;
                player.isGrounded = true;
            }
        });

        // 3. Camera
        const targetCamY = player.y - CANVAS_HEIGHT * 0.6;
        cameraYRef.current += (targetCamY - cameraYRef.current) * 0.1;
        
        // Limit camera bottom to start
        if (cameraYRef.current > START_Y - CANVAS_HEIGHT + 200) {
            cameraYRef.current = START_Y - CANVAS_HEIGHT + 200;
        }

        // Calculate Price based on height
        // Base is 0.0420. Each 100px is +0.0100
        const heightDiff = START_Y - player.y;
        const newPrice = 0.0420 + (Math.max(0, heightDiff) * 0.0001);
        setCurrentPrice(newPrice);

        // 4. Enemies & Lasers
        enemies.forEach(enemy => {
            if (enemy.dead) {
                enemy.deadTimer--;
                return;
            }

            // Patrol
            enemy.x += enemy.vx;
            if (enemy.x <= enemy.patrolStart || enemy.x + enemy.w >= enemy.patrolEnd) {
                enemy.vx *= -1;
            }

            // Shoot Laser
            enemy.shootTimer--;
            if (enemy.shootTimer <= 0) {
                // Shoot in facing direction
                const dir = enemy.vx > 0 ? 1 : -1;
                lasersRef.current.push({
                    id: Math.random(),
                    x: enemy.x + (dir > 0 ? enemy.w : 0),
                    y: enemy.y + enemy.h/2 - 2,
                    w: 20, h: 4,
                    vx: dir * LASER_SPEED,
                    life: 60
                });
                enemy.shootTimer = LASER_COOLDOWN;
            }

            // Player Collision (Stomp or Hurt)
            if (checkRectCollide(player, enemy)) {
                if (player.vy > 0 && player.y + player.h < enemy.y + enemy.h * 0.6) {
                    // Stomp
                    enemy.dead = true;
                    enemy.deadTimer = 20;
                    player.vy = JUMP_FORCE * 0.6;
                    setScore(s => s + 500);
                    createParticles(enemy.x, enemy.y, COLOR_WHITE, 10, 'explosion');
                } else if (player.invulnerable <= 0) {
                    setGameState(GameState.GAME_OVER);
                }
            }
        });

        // Lasers logic
        for (let i = lasersRef.current.length - 1; i >= 0; i--) {
            const l = lasersRef.current[i];
            l.x += l.vx;
            l.life--;
            if (l.life <= 0 || l.x < 0 || l.x > CANVAS_WIDTH) {
                lasersRef.current.splice(i, 1);
                continue;
            }
            // Laser Hit Player
            if (player.invulnerable <= 0 && checkRectCollide(player, l)) {
                 setGameState(GameState.GAME_OVER);
            }
        }

        // 5. Coins
        coinsRef.current.forEach(coin => {
            if (coin.collected) return;
            const dx = (player.x + player.w/2) - coin.x;
            const dy = (player.y + player.h/2) - coin.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 20) {
                coin.collected = true;
                setScore(prev => prev + 100);
                createParticles(coin.x, coin.y, COLOR_BRAND_ORANGE, 6, 'sparkle');
            }
        });

        // 6. Particles
        // Player trail
        if (Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1) {
            particlesRef.current.push({
                id: Math.random(),
                x: player.x + player.w/2,
                y: player.y + player.h/2,
                vx: 0, vy: 0,
                life: 0.5,
                color: player.vy < 0 ? COLOR_CHART_GREEN : COLOR_CHART_RED, // Green going up, red going down
                size: 2,
                type: 'trail'
            });
        }

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) particlesRef.current.splice(i, 1);
        }

        if (player.invulnerable > 0) player.invulnerable--;
    };

    const checkRectCollide = (r1: Player, r2: {x:number, y:number, w:number, h:number}) => {
        return (
            r1.x < r2.x + r2.w &&
            r1.x + r1.w > r2.x &&
            r1.y < r2.y + r2.h &&
            r1.y + r1.h > r2.y
        );
    };

    const createParticles = (x: number, y: number, color: string, count: number, type: 'sparkle'|'explosion'|'trail') => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                id: Math.random(),
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1.0,
                color,
                size: Math.random() * 4 + 2,
                type
            });
        }
    };

    const draw3DLetter = (ctx: CanvasRenderingContext2D, char: string, x: number, y: number, size: number) => {
        ctx.save();
        
        // Depth (Shadow/Side)
        ctx.fillStyle = '#A34800'; // Darker Orange
        ctx.font = `900 ${size}px monospace`;
        ctx.fillText(char, x + 2, y + 2);

        // Face
        ctx.fillStyle = COLOR_BRAND_ORANGE;
        ctx.fillText(char, x, y);

        // Highlight
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeText(char, x, y);

        ctx.restore();
    };

    // --- Drawing ---
    const draw = (ctx: CanvasRenderingContext2D) => {
        // Clear
        ctx.fillStyle = COLOR_BG;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // --- Background K-Line Chart ---
        ctx.save();
        ctx.translate(0, -cameraYRef.current * 0.2); // Parallax for chart
        candlesRef.current.forEach(c => {
            // Only draw if visible-ish
            if (c.y > cameraYRef.current - 200 && c.y < cameraYRef.current + CANVAS_HEIGHT + 500) {
                const color = c.isGreen ? COLOR_CHART_GREEN : COLOR_CHART_RED;
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.2;
                // Wick
                ctx.fillRect(c.x + c.w/2 - 1, c.y - c.wickH/2, 2, c.wickH);
                // Body
                ctx.fillRect(c.x, c.y - c.h/2, c.w, c.h);
            }
        });
        ctx.restore();

        // --- World Space ---
        ctx.save();
        ctx.translate(0, -Math.floor(cameraYRef.current));

        // Platforms
        platformsRef.current.forEach(plat => {
            ctx.fillStyle = plat.color || '#444';
            ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
            
            // Tech Borders
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);

            // Tech details
            ctx.fillStyle = '#FFFFFF22';
            ctx.fillRect(plat.x, plat.y, plat.w, 2);

            if (plat.type === 'text' && plat.text) {
                ctx.fillStyle = '#000';
                ctx.font = 'bold 16px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(plat.text, plat.x + plat.w/2, plat.y + plat.h/2);
            }
        });

        // Enemies (Robots)
        enemiesRef.current.forEach(enemy => {
            if (enemy.dead && enemy.deadTimer <= 0) return;
            
            if (!enemy.dead) {
                // Robot Body
                ctx.fillStyle = '#555';
                ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
                // Screen face
                ctx.fillStyle = '#000';
                ctx.fillRect(enemy.x + 4, enemy.y + 4, enemy.w - 8, enemy.h - 12);
                // Eye (Red laser eye)
                ctx.fillStyle = 'red';
                const eyeX = enemy.vx > 0 ? enemy.x + enemy.w - 10 : enemy.x + 6;
                ctx.fillRect(eyeX, enemy.y + 8, 4, 4);
                // Antenna
                ctx.fillStyle = '#888';
                ctx.fillRect(enemy.x + enemy.w/2 - 1, enemy.y - 6, 2, 6);
                ctx.fillStyle = enemy.shootTimer < 30 ? 'red' : 'lime'; // Blinking light
                ctx.fillRect(enemy.x + enemy.w/2 - 2, enemy.y - 8, 4, 2);
            } else {
                // Explosion effect
                ctx.fillStyle = 'orange';
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(enemy.x + enemy.w/2, enemy.y + enemy.h/2, 20, 0, Math.PI*2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });

        // Lasers
        lasersRef.current.forEach(l => {
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(l.x, l.y, l.w, l.h);
            ctx.fillStyle = '#FFFFFF'; // Core
            ctx.fillRect(l.x, l.y + 1, l.w, 2);
        });

        // Coins
        const time = Date.now();
        coinsRef.current.forEach(coin => {
            if (coin.collected) return;
            const yOffset = Math.sin(time / 200) * 3;
            ctx.fillStyle = COLOR_BRAND_ORANGE;
            // Draw a diamond shape for crypto feel
            ctx.beginPath();
            ctx.moveTo(coin.x, coin.y - coin.size + yOffset);
            ctx.lineTo(coin.x + coin.size, coin.y + yOffset);
            ctx.lineTo(coin.x, coin.y + coin.size + yOffset);
            ctx.lineTo(coin.x - coin.size, coin.y + yOffset);
            ctx.fill();
            
            ctx.fillStyle = '#FFF';
            ctx.font = '10px monospace';
            ctx.fillText('$', coin.x - 3, coin.y + 3 + yOffset);
        });

        // Player (3D YGO Characters)
        const p = playerRef.current;
        if (p.invulnerable % 4 < 2) {
            // Calculate positions for Y, G, O within player box width (40px)
            // Y: 0, G: 13, O: 26 (approx)
            const fontSize = 18;
            // Center the text group in the hitbox
            const baseX = p.x + 2; 
            const baseY = p.y + 22; // Baseline

            if (p.facingRight) {
                draw3DLetter(ctx, 'Y', baseX, baseY, fontSize);
                draw3DLetter(ctx, 'G', baseX + 12, baseY, fontSize);
                draw3DLetter(ctx, 'O', baseX + 24, baseY, fontSize);
            } else {
                // Mirror visually or just keep letters readable? 
                // Usually text stays readable.
                draw3DLetter(ctx, 'Y', baseX, baseY, fontSize);
                draw3DLetter(ctx, 'G', baseX + 12, baseY, fontSize);
                draw3DLetter(ctx, 'O', baseX + 24, baseY, fontSize);
            }
        }

        // Particles
        particlesRef.current.forEach(part => {
            ctx.fillStyle = part.color;
            ctx.globalAlpha = part.life;
            ctx.fillRect(part.x, part.y, part.size, part.size);
        });
        ctx.globalAlpha = 1.0;

        ctx.restore();
    };

    // --- Game Loop ---
    const loop = () => {
        if (gameState === GameState.PLAYING) {
            update();
        }
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) draw(ctx);
        }
        requestRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(loop);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState]);

    return (
        <div className="relative rounded-xl overflow-hidden shadow-[0_0_20px_rgba(229,125,37,0.3)] border-4 border-[#333] bg-black max-w-full">
            <canvas 
                ref={canvasRef} 
                width={CANVAS_WIDTH} 
                height={CANVAS_HEIGHT}
                className="block w-full h-auto max-h-[85vh] object-contain"
                style={{ imageRendering: 'pixelated', maxWidth: '600px' }}
            />
            
            {/* UI Overlays */}
            <div className="absolute top-4 left-4 font-mono font-bold text-white z-10">
                <div className="text-xl">PRICE: <span className="text-[#E57D25] text-2xl">${currentPrice.toFixed(4)}</span></div>
                <div className="text-sm text-gray-400">SCORE: {score}</div>
            </div>

            {gameState === GameState.MENU && (
                <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center text-white text-center p-6 z-20">
                    <h1 className="text-6xl font-black mb-2 tracking-tighter text-[#E57D25]" style={{fontFamily: 'monospace', textShadow: '4px 4px 0px #A34800'}}>YGO</h1>
                    <h2 className="text-2xl font-bold text-white mb-8 tracking-widest">MARKET CLIMBER</h2>
                    <div className="mb-8 text-sm text-gray-300 font-mono">
                        <p>RISE WITH THE MARKET</p>
                        <p>AVOID DUMP BOTS & LASERS</p>
                    </div>
                    <button 
                        onClick={resetGame}
                        className="bg-[#E57D25] hover:bg-[#d46b1a] text-black font-bold py-4 px-12 rounded-none border-2 border-white transition-all text-xl font-mono animate-pulse"
                    >
                        INITIALIZE PUMP
                    </button>
                </div>
            )}

            {gameState === GameState.GAME_OVER && (
                <div className="absolute inset-0 bg-black/90 flex flex-col justify-center items-center text-white z-20">
                    <h2 className="text-4xl font-bold mb-4 text-red-500 font-mono">MARKET CRASH!</h2>
                    <p className="text-xl mb-8 font-mono">Peak Price: <span className="text-[#E57D25]">${currentPrice.toFixed(4)}</span></p>
                    <button 
                        onClick={resetGame}
                        className="bg-white text-black hover:bg-gray-200 font-bold py-3 px-8 font-mono"
                    >
                        REBOUND
                    </button>
                </div>
            )}

            {/* Mobile Controls */}
            <div className="absolute bottom-6 left-6 flex gap-4 md:hidden z-20">
                <button 
                    className="w-16 h-16 bg-white/10 border-2 border-white/50 text-white text-2xl active:bg-white/30 rounded-full"
                    onTouchStart={(e) => { e.preventDefault(); handleTouchStart('LEFT'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('LEFT'); }}
                >←</button>
                <button 
                    className="w-16 h-16 bg-white/10 border-2 border-white/50 text-white text-2xl active:bg-white/30 rounded-full"
                    onTouchStart={(e) => { e.preventDefault(); handleTouchStart('RIGHT'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('RIGHT'); }}
                >→</button>
            </div>
            <div className="absolute bottom-6 right-6 md:hidden z-20">
                <button 
                    className="w-20 h-20 bg-[#E57D25]/80 border-2 border-white/50 text-white font-bold font-mono active:bg-[#E57D25] rounded-full flex items-center justify-center"
                    onTouchStart={(e) => { e.preventDefault(); handleTouchStart('JUMP'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('JUMP'); }}
                >UP</button>
            </div>
        </div>
    );
};

export default YomirgoGame;
