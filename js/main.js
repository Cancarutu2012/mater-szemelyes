// System Clock
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    document.getElementById('sys-time').textContent = timeStr;
}
setInterval(updateClock, 1000);
updateClock();

// Navigation Tabs
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.terminal-content section');

function switchTab(targetId) {
    // Remove active class from all
    navBtns.forEach(b => b.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active-section'));

    // Set active nav btn
    const targetBtn = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
    if(targetBtn) targetBtn.classList.add('active');
    
    // Set active section
    document.getElementById(targetId).classList.add('active-section');

    // If weather section is opened and not loaded, load it
    if (targetId === 'weather' && !weatherLoaded) {
        initWeather();
    }
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.getAttribute('data-target'));
    });
});

// Inline Quick Links
document.querySelectorAll('.nav-link-inline').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(link.getAttribute('data-target'));
    });
});

// Weather Dashboard Logic
let weatherLoaded = false;
let weatherChart = null;

const WEATHER_URL = "https://api.ecowitt.net/api/v3/device/real_time"
 + "?application_key=D55FDBC9235F9886E2D7715A7B0E8149"
 + "&api_key=5f4fee86-c4b9-476b-8612-1746a5000029"
 + "&mac=FC:F5:C4:BA:FE:CB"
 + "&call_back=all"
 + "&temp_unitid=1"
 + "&wind_speed_unitid=7"
 + "&pressure_unitid=3"
 + "&rainfall_unitid=12";

function createWeatherCard(label, value, unit) {
    return `
        <div class="weather-card">
            <div class="w-label">${label}</div>
            <div class="w-value">${value} <span class="w-unit">${unit}</span></div>
        </div>
    `;
}

function initWeather() {
    weatherLoaded = true;
    fetchWeatherData();
    setInterval(fetchWeatherData, 30000); // refresh every 30s
}

async function fetchWeatherData() {
    try {
        const response = await fetch(WEATHER_URL);
        const data = await response.json();
        
        if (data.code === 0) {
            const d = data.data;
            const metricsDiv = document.getElementById('weather-metrics');
            
            let html = "";
            html += createWeatherCard("Temperature", d.outdoor.temperature.value, "°C");
            html += createWeatherCard("Humidity", d.outdoor.humidity.value, "%");
            html += createWeatherCard("Wind Speed", d.wind.wind_speed.value, "km/h");
            html += createWeatherCard("Pressure", d.pressure.relative.value, "hPa");
            html += createWeatherCard("Rainfall", d.rainfall.daily.value, "mm");
            html += createWeatherCard("UV Index", d.solar_and_uvi.uvi.value, "");
            
            metricsDiv.innerHTML = html;
            
            // Hide loader, show dashboard
            document.getElementById('weather-loader').style.display = 'none';
            document.getElementById('weather-dashboard').style.display = 'block';

            // Update Chart
            const currentTemp = parseFloat(d.outdoor.temperature.value);
            updateChart(currentTemp);
        } else {
            document.getElementById('weather-loader').textContent = "ERROR: Failed to parse sensor data.";
            document.getElementById('weather-loader').style.color = "red";
            document.getElementById('weather-loader').classList.remove('blinking');
        }
    } catch (error) {
        document.getElementById('weather-loader').textContent = "ERROR: Connection to sensor array failed.";
        document.getElementById('weather-loader').style.color = "red";
        document.getElementById('weather-loader').classList.remove('blinking');
    }
}

// Data Visualization (Chart.js)
// We'll generate some realistic historical data and append the live data
const ctx = document.getElementById('weatherChart').getContext('2d');
const simulatedLabels = [];
const simulatedData = [];

// Generate last 10 hours of simulated data
const now = new Date();
for(let i = 10; i > 0; i--) {
    let t = new Date(now.getTime() - i * 60 * 60 * 1000);
    simulatedLabels.push(t.getHours() + ":00");
    // Simulate temp around 15-25 C
    let simTemp = 20 + Math.sin(i) * 5 + (Math.random() * 2 - 1);
    simulatedData.push(simTemp.toFixed(1));
}

function updateChart(liveTemp) {
    const t = new Date();
    const timeLabel = t.getHours() + ":" + String(t.getMinutes()).padStart(2, '0');
    
    // Add live data point
    if (simulatedLabels.length > 10 && simulatedLabels[simulatedLabels.length-1] !== timeLabel) {
       // Keep array size reasonable
       if (simulatedLabels.length > 15) {
           simulatedLabels.shift();
           simulatedData.shift();
       }
       simulatedLabels.push(timeLabel);
       simulatedData.push(liveTemp);
    } else {
       // Just update the latest if we are calling multiple times in the same minute
       simulatedLabels[simulatedLabels.length - 1] = timeLabel;
       simulatedData[simulatedData.length - 1] = liveTemp;
    }

    if (!weatherChart) {
        Chart.defaults.color = '#888';
        Chart.defaults.font.family = "'JetBrains Mono', monospace";
        
        weatherChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: simulatedLabels,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: simulatedData,
                    borderColor: '#00ff41',
                    backgroundColor: 'rgba(0, 255, 65, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#000',
                    pointBorderColor: '#00ff41',
                    pointHoverBackgroundColor: '#00ff41',
                    pointHoverBorderColor: '#fff',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: '#333'
                        }
                    },
                    x: {
                        grid: {
                            color: '#333'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } else {
        weatherChart.update();
    }
}


// Boot Sequence
const bootScreen = document.getElementById('boot-screen');
const bootText = document.getElementById('boot-text');

const bootSequence = [
    "Welcome to <span class='cyan'>Radetzky OS</span> 26.10 LTS (GNU/Linux 6.8.0-generic x86_64)",
    "",
    "[ <span class='neon-green'> OK </span> ] Reached target Local File Systems.",
    "[ <span class='neon-green'> OK </span> ] Started Tell Plymouth To Write Out Runtime Data.",
    "[ <span class='neon-green'> OK </span> ] Started Flush Journal to Persistent Storage.",
    "[ <span class='neon-green'> OK </span> ] Started Create Volatile Files and Directories.",
    "[ <span class='neon-green'> OK </span> ] Started Network Time Synchronization.",
    "[ <span class='neon-green'> OK </span> ] Reached target System Time Synchronized.",
    "[ <span class='neon-green'> OK </span> ] Started Update UTMP about System Boot/Shutdown.",
    "[ <span class='neon-green'> OK </span> ] Started D-Bus System Message Bus.",
    "[ <span class='cyan'>INFO</span> ] Starting Network Manager...",
    "[ <span class='neon-green'> OK </span> ] Started Network Manager.",
    "[ <span class='neon-green'> OK </span> ] Reached target Network.",
    "[ <span class='neon-green'> OK </span> ] Started Login Service.",
    "[ <span class='cyan'>PROCESS</span>] Connecting to Ecowitt Weather Array...",
    "[ <span class='neon-green'>SUCCESS</span>] Connection established.",
    "[ <span class='neon-green'> OK </span> ] Started Master Control Dashboard.",
    "[ <span class='neon-green'> OK </span> ] Reached target Graphical Interface.",
    "",
    "  _____           _      _       _          ",
    " |  __ \\         | |    | |     | |         ",
    " | |__) |__ _  __| | ___| |_ ___| | ___   _ ",
    " |  _  // _` |/ _` |/ _ \\ __|_  / |/ / | | |",
    " | | \\ \\ (_| | (_| |  __/ |_ / /|   <| |_| |",
    " |_|  \\_\\__,_|\\__,_|\\___|\\__/___|_|\\_\\\\__, |",
    "                                       __/ |",
    "                                      |___/ ",
    "",
    "radetzky login: _"
];

let bootIndex = 0;

function runBootSequence() {
    if (bootIndex < bootSequence.length) {
        let p = document.createElement('div');
        p.innerHTML = bootSequence[bootIndex];
        bootText.appendChild(p);
        
        bootIndex++;
        
        // Fast random delay for systemd style (10ms to 40ms)
        let delay = Math.random() * 30 + 10;
        
        // Pause slightly longer at network or process
        if (bootSequence[bootIndex-1].includes("INFO") || bootSequence[bootIndex-1].includes("PROCESS")) {
            delay = 200;
        } else if (bootSequence[bootIndex-1].includes("radetzky login:")) {
            delay = 500;
        }

        setTimeout(runBootSequence, delay);
    } else {
        setTimeout(() => {
            bootScreen.style.opacity = '0';
            bootScreen.style.transition = 'opacity 0.4s ease-out';
            setTimeout(() => {
                bootScreen.style.display = 'none';
            }, 400);
        }, 300);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(runBootSequence, 200);
});
