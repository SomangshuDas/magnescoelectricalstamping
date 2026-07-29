import { CONFIG } from "./config.js";

const fetchStatusAPI = CONFIG.machineDataEndpoint;
const googleSheetsAPI = CONFIG.dashboardEndpoint;
const dashboard = document.getElementById("dashboard");

const totalMachines = 16;
let machineDivs = [];

function createMachineDivs() {
	for (let i = 1; i <= totalMachines; i++) {
		const machineDiv = document.createElement("div");
		machineDiv.className = "machine";
		machineDiv.id = `machine${i}`;
		machineDiv.innerHTML = getMachineHTML(i);
		dashboard.appendChild(machineDiv);
		machineDivs.push(machineDiv);
	}
	fetchTargetFromGoogleSheets();
}

function getMachineHTML(machineNum) {
	return `
		<div class="progress-wrapper">
			<div class="progress-bar" id="progress${machineNum}"></div>
			<div class="info">
				<strong>M${machineNum}</strong> (Updated At: <span id="lastUpdatedTime${machineNum}">-</span>)<br>
				<span id="operator${machineNum}">-</span><br>
				<span id="jobSheet${machineNum}">J/S No: -</span><br>
				<span id="target${machineNum}">Target: -</span><br>
				<span id="manufactured${machineNum}">Achieved: -</span><br>
				<span id="missed${machineNum}">Balance: -</span><br>
				<span class="pr-description">
					<span id="prDescription${machineNum}">-</span>
				</span>
			</div>
		</div>
	`;
}

async function fetchTargetFromGoogleSheets() {
	try {
		let response = await fetch(`${fetchStatusAPI}?action=fetch`);
		let text = await response.text();
		let blocks = text.trim().split(/\n(?=Machine \d+:)/);

		blocks.forEach(block => {
			let lines = block.trim().split('\n');
			let header = lines[0];
			let jsonStr = lines.slice(1).join('\n').trim();

			let match = header.match(/Machine\s*(\d+):/);
			if (!match) return;
			let machineNum = parseInt(match[1]);

			let data;
			try {
				data = JSON.parse(jsonStr);
			} catch {
				data = null;
			}

			if (!data || data.status === "Logout Detected") {
				resetMachineUI(machineNum);
				return;
			}

			if (data.status === "Login Detected") {
				document.getElementById(`operator${machineNum}`).textContent = data.operator || "-";
				document.getElementById(`target${machineNum}`).textContent = `Target: ${data.target ?? "-"}`;
				document.getElementById(`jobSheet${machineNum}`).textContent = `J/S No: ${data.job_sheet ?? "-"}`;
				const pr = document.getElementById(`prDescription${machineNum}`);

				pr.textContent = data.prDescription || "-";

				if (data.prDescription && data.prDescription !== "-") {
					pr.classList.add("scroll");
				} else {
					pr.classList.remove("scroll");
				}
			}
		});
	} catch (error) {
		console.error("Error fetching machine targets:", error);
	}
}

async function fetchAchievedFromGoogleSheets() {
	try {
		let response = await fetch(googleSheetsAPI);
		let text = await response.text();
		let blocks = text.trim().split(/\n(?=Machine \d+:)/);

		blocks.forEach(block => {
			let lines = block.trim().split('\n');
			let header = lines[0];
			let achievedLine = lines[1] || "-";
			let timeLine = lines[2] || "-";

			let match = header.match(/Machine\s*(\d+):/);
			if (!match) return;
			let machineNum = parseInt(match[1]);

			const targetText = document.getElementById(`target${machineNum}`).textContent;
			if (targetText === "Target: -") {
				document.getElementById(`manufactured${machineNum}`).textContent = "Achieved: -";
				document.getElementById(`missed${machineNum}`).textContent = "Balance: -";
				document.getElementById(`lastUpdatedTime${machineNum}`).textContent = "-";
				return;
			}

			let target = parseInt(targetText.replace("Target: ", ""), 10);
			let achieved = parseInt(achievedLine.trim(), 10);
			if (isNaN(achieved)) achieved = 0;
			let balance = target - achieved;

			document.getElementById(`manufactured${machineNum}`).textContent = `Achieved: ${achieved}`;
			document.getElementById(`missed${machineNum}`).textContent = `Balance: ${balance}`;
			document.getElementById(`lastUpdatedTime${machineNum}`).textContent = timeLine;
			updateProgress(machineNum, achieved);
		});
	} catch (error) {
		console.error("Error fetching achieved data:", error);
	}
}

function resetMachineUI(machineNum) {
	document.getElementById(`lastUpdatedTime${machineNum}`).textContent = "-";
	document.getElementById(`operator${machineNum}`).textContent = "-";
	document.getElementById(`jobSheet${machineNum}`).textContent = "J/S No: -";
	document.getElementById(`target${machineNum}`).textContent = "Target: -";
	document.getElementById(`manufactured${machineNum}`).textContent = "Achieved: -";
	document.getElementById(`missed${machineNum}`).textContent = "Balance: -";
	const pr = document.getElementById(`prDescription${machineNum}`);
	pr.textContent = "-";
	pr.classList.remove("scroll");
	updateProgress(machineNum, 0);
}

function updateProgress(machineNum, achieved) {
	const targetText = document.getElementById(`target${machineNum}`).textContent;
	let target = parseInt(targetText.replace("Target: ", ""), 10);
	if (isNaN(target) || target === 0) target = 1;
	const percent = Math.min((achieved / target) * 100, 100);
	const progressDiv = document.getElementById(`progress${machineNum}`);
	progressDiv.style.width = `${percent}%`;
}

createMachineDivs();

setInterval(() => {
	fetchTargetFromGoogleSheets();
	fetchAchievedFromGoogleSheets();
}, 5000);
