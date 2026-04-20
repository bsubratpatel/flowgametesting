const puppeteer = require('puppeteer');

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        :root {
            --bg: hsl(0 0% 6%);
            --fg: hsl(0 0% 98%);
            --board: hsl(0 0% 9%);
            --cell: hsl(0 0% 12%);
            --dot-1: hsl(350 90% 62%);
            --dot-2: hsl(200 95% 60%);
            --dot-3: hsl(145 65% 55%);
            --dot-4: hsl(45 95% 60%);
        }

        body {
            margin: 0;
            padding: 0;
            background: #222;
        }

        .slide {
            width: 1080px;
            height: 1080px;
            background: var(--bg);
            color: var(--fg);
            font-family: 'Inter', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            box-sizing: border-box;
            padding: 80px;
        }

        .headline {
            font-size: 52px;
            font-weight: 600;
            text-align: center;
            letter-spacing: -1px;
            margin-bottom: 80px;
            line-height: 1.2;
            opacity: 0.95;
            max-width: 80%;
        }

        .cta {
            font-size: 46px;
            font-weight: 400;
            text-align: center;
            margin-top: 40px;
            color: hsl(0 0% 70%);
            line-height: 1.4;
        }

        .board {
            width: 600px;
            height: 600px;
            background: var(--board);
            border-radius: 32px;
            padding: 16px;
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            grid-template-rows: repeat(5, 1fr);
            gap: 8px;
            position: relative;
        }

        .cell {
            background: var(--cell);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .dot {
            width: 62%;
            height: 62%;
            border-radius: 50%;
        }

        .path-line {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none;
        }

        .hud {
            width: 600px;
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: hsl(0 0% 50%);
            margin-bottom: 24px;
        }

        /* Slide specific */
        .dot.c1 { background: var(--dot-1); box-shadow: 0 0 0 4px hsla(350, 90%, 62%, 0.18), 0 10px 24px -6px hsla(350, 90%, 62%, 0.55); }
        .dot.c2 { background: var(--dot-2); box-shadow: 0 0 0 4px hsla(200, 95%, 60%, 0.18), 0 10px 24px -6px hsla(200, 95%, 60%, 0.55); }
        .dot.c3 { background: var(--dot-3); box-shadow: 0 0 0 4px hsla(145, 65%, 55%, 0.18), 0 10px 24px -6px hsla(145, 65%, 55%, 0.55); }
        .dot.c4 { background: var(--dot-4); box-shadow: 0 0 0 4px hsla(45, 95%, 60%, 0.18), 0 10px 24px -6px hsla(45, 95%, 60%, 0.55); }

        .dot-glow {
            box-shadow: 0 0 0 6px hsla(145, 65%, 55%, 0.35), 0 12px 30px -4px hsla(145, 65%, 55%, 0.7);
            transform: scale(1.18);
        }

        .dot-glow-c2 {
            box-shadow: 0 0 0 6px hsla(200, 95%, 60%, 0.35), 0 12px 30px -4px hsla(200, 95%, 60%, 0.7);
            transform: scale(1.18);
        }

        .dot-burst {
            transform: scale(1.55);
            filter: brightness(2.2) drop-shadow(0 0 12px var(--dot-3));
        }

        .level-text {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: var(--fg);
            text-shadow: 0 0 30px hsla(0, 0%, 98%, 0.6);
            white-space: nowrap;
        }
    </style>
</head>
<body>

    <!-- Slide 1 -->
    <div class="slide" id="slide-1">
        <div class="headline">Got bored. Started writing logic for a game.</div>
        <div class="board">
            ${Array.from({length: 25}).map(() => '<div class="cell"></div>').join('')}
        </div>
    </div>

    <!-- Slide 2 -->
    <div class="slide" id="slide-2">
        <div class="headline">Just trying to make it work.</div>
        <div class="board" style="box-shadow: none; background: #111;">
            ${[0,0,1,0,3, 0,2,1,0,0, 0,2,0,4,0, 0,0,4,0,0, 1,0,0,0,2].map(d => `<div class="cell" style="background:#1a1a1a;">${d ? '<div class="dot" style="background:var(--dot-'+d+'); box-shadow:none;"></div>' : ''}</div>`).join('')}
        </div>
    </div>

    <!-- Slide 3 -->
    <div class="slide" id="slide-3">
        <div class="headline">It started to feel like a game.</div>
        <div class="board">
            ${[0,0,1,0,3, 0,2,1,0,0, 0,2,0,4,0, 0,0,4,0,0, 1,0,0,0,2].map((d, i) => `<div class="cell">${d ? `<div class="dot c${d}" ${i===11 || i===6 || i===1 ? 'style="transform:scale(1.18)"' : ''}></div>` : ''}</div>`).join('')}
            <svg class="path-line"><path d="M ${16+60} ${16+60*3} L ${16+60} ${16+60} L ${16+60*3} ${16+60}" stroke="hsla(200, 95%, 60%, 1)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.6"/></svg>
        </div>
    </div>

    <!-- Slide 4 -->
    <div class="slide" id="slide-4">
        <div class="headline">Then I realized... it's all about flow.</div>
        <div class="board">
            ${[0,3,0,0,4, 0,3,1,0,0, 0,3,3,3,0, 0,0,4,0,0, 1,0,0,0,2].map((d, i) => `<div class="cell">${d ? `<div class="dot c${d} ${d===3 ? (i===1 ? '' : 'dot-glow') : ''}"></div>` : ''}</div>`).join('')}
            <svg class="path-line"><path d="M ${16+60} ${16+60*3} L ${16+60} ${16+60*5} L ${16+60*3} ${16+60*5} L ${16+60*5} ${16+60*5} L ${16+60*5} ${16+60*7}" stroke="hsla(145, 65%, 55%, 1)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.6"/></svg>
        </div>
    </div>

    <!-- Slide 5 -->
    <div class="slide" id="slide-5">
        <div class="headline">Removed everything that slows it down.</div>
        <div class="hud">
            <span>LV 12</span>
            <span>MOVES 21</span>
        </div>
        <div class="board">
            ${[0,0,0,1,2, 0,0,0,0,0, 2,0,0,0,4, 0,4,0,3,0, 1,0,0,0,3].map((d, i) => `<div class="cell">${d ? `<div class="dot c${d}"></div>` : ''}</div>`).join('')}
        </div>
        <svg style="margin-top: 16px; width: 600px; height: 3px;" viewBox="0 0 100 1" preserveAspectRatio="none"><rect width="100" height="1" fill="#333"/><rect width="85" height="1" fill="white"/></svg>
    </div>

    <!-- Slide 6 -->
    <div class="slide" id="slide-6">
        <div class="headline">Built something simple.</div>
        <div class="board">
            ${Array.from({length: 25}).map(() => '<div class="cell"></div>').join('')}
            <div class="level-text">LEVEL COMPLETE</div>
        </div>
        <div class="cta">Try it and tell me what you think.</div>
    </div>

</body>
</html>
`;

(async () => {
    try {
        console.log("Launching puppeteer...");
        const browser = await puppeteer.launch({ 
            headless: 'new',
            executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
        
        console.log("Setting HTML content...");
        await page.setContent(htmlContent);
        await page.evaluate(() => document.fonts.ready);
        await new Promise(r => setTimeout(r, 500)); // allow paints

        console.log("Capturing slides...");
        for (let i = 1; i <= 6; i++) {
            const el = await page.$('#slide-' + i);
            if(el) {
                await el.screenshot({ path: `slide-${i}.png` });
                console.log(`Saved slide-${i}.png`);
            }
        }
        await browser.close();
        console.log("Done!");
    } catch(err) {
        console.error(err);
    }
})();
