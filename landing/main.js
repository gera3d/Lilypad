/* Countdown to a fixed UTC date */
const end = new Date(Date.UTC(2025, 5, 1, 12, 0, 0)); // 1 Jun 2025 12:00 UTC
const countdownEl = document.getElementById('countdown');
const progressEl  = document.getElementById('progressBar');
const progressTxt = document.getElementById('progressText');

function pad(n){ return n.toString().padStart(2,'0'); }

function tick(){
	const now   = new Date();
	const diff  = Math.max(0, end - now);
	const sec   = Math.floor(diff / 1000);
	const d     = Math.floor(sec / 86400);
	const h     = Math.floor((sec % 86400) / 3600);
	const m     = Math.floor((sec % 3600) / 60);
	const s     = sec % 60;
	countdownEl.textContent = `${pad(d)}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
	if(diff===0) clearInterval(timer);
}

/* Example progress animation toward 60 % */
let current = 35;
function updateProgress(){
	if(current>=60) return;
	current += 0.1;
	progressEl.style.width = `${current}%`;
	progressTxt.textContent = `${current.toFixed(1)} % sold`;
}

const timer = setInterval(tick,1000);
setInterval(updateProgress,5000);
tick();
