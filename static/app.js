let charts = {};


// =====================================================
// COLORS
// =====================================================

const candidateColors = [
    "#ef4444", // Candidate 1 — Red
    "#22c55e", // Candidate 2 — Green
    "#3b82f6", // Candidate 3 — Blue
    "#f59e0b"  // Candidate 4 — Orange
];


function getCandidateColor(index) {

    return candidateColors[
        index % candidateColors.length
    ];
}


// =====================================================
// DESTROY CHART
// =====================================================

function destroyChart(id) {

    if (charts[id]) {

        charts[id].destroy();

        delete charts[id];

    }
}


// =====================================================
// CANDIDATE NAME
// =====================================================

function candidateName(data, id) {

    const candidate =
        data.candidates.find(
            c =>
                Number(c.id) ===
                Number(id)
        );


    return candidate
        ? candidate.name
        : `Candidate ${id}`;
}


// =====================================================
// STATS
// =====================================================

function renderStats(data) {

    document.getElementById(
        "voterCount"
    ).textContent =
        data.voter_count;


    document.getElementById(
        "candidateCount"
    ).textContent =
        data.candidates.length;


    if (
        data.final_winner &&
        data.final_winner.winner_ids.length
    ) {

        const winner =
            data.candidates.find(
                candidate =>
                    candidate.id ===
                    data.final_winner.winner_ids[0]
            );


        if (winner) {

            document.getElementById(
                "winnerStat"
            ).textContent =
                winner.name;

        }

    }

}


// =====================================================
// FINAL WINNER
// =====================================================

function renderFinalWinner(data) {

    const container =
        document.getElementById(
            "finalWinnerCard"
        );


    if (
        !container ||
        !data.final_winner
    ) {

        return;

    }


    const winnerIds =
        data.final_winner.winner_ids;


    const methodWins =
        data.final_winner.method_wins;


    const winners =
        data.candidates.filter(
            candidate =>
                winnerIds.includes(
                    candidate.id
                )
        );


    if (!winners.length) {

        container.innerHTML =
            "<p>No final winner.</p>";

        return;

    }


    const winner = winners[0];


    container.innerHTML = `

        <div class="final-winner-content">

            <div class="trophy">
                🏆
            </div>

            <div>

                <div class="final-label">
                    FINAL WINNER
                </div>

                <div class="final-name">
                    ${winner.name}
                </div>

                <div class="final-score">

                    Won

                    <strong>
                        ${methodWins[winner.id]}
                    </strong>

                    of

                    <strong>
                        ${data.results.length}
                    </strong>

                    voting methods

                </div>

            </div>

        </div>

    `;

}


// =====================================================
// METHOD CARDS
// =====================================================

function renderWinnerCards(data) {

    const container =
        document.getElementById(
            "methodPanels"
        );


    container.innerHTML = "";


    data.results.forEach(
        result => {

            const winners =
                result.winners.map(
                    id =>
                        candidateName(
                            data,
                            id
                        )
                );


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "method-card";


            card.innerHTML = `

                <div class="method-icon">

                    ${getMethodIcon(
                        result.method
                    )}

                </div>

                <div class="method-content">

                    <div class="method-name">
                        ${result.method}
                    </div>

                    <div class="method-winner">

                        🏆
                        ${winners.join(", ")}

                    </div>

                    <div class="method-description">

                        ${getMethodDescription(
                            result.method
                        )}

                    </div>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}


function getMethodIcon(method) {

    const icons = {

        FPTP: "1️⃣",

        RCV: "🔄",

        Approval: "☑️",

        Borda: "📊"

    };


    return icons[method] || "🗳️";
}


function getMethodDescription(method) {

    const descriptions = {

        FPTP:
            "Candidate with the highest number of first-preference votes wins.",

        RCV:
            "The lowest candidate is eliminated and votes are transferred to the next preference.",

        Approval:
            "Each voter can approve multiple candidates. The candidate with the most approvals wins.",

        Borda:
            "Candidates receive points based on their ranking positions."

    };


    return descriptions[method] || "";

}


// =====================================================
// VOTE SHARE
// =====================================================

function createVoteShareChart(data) {

    const canvas =
        document.getElementById(
            "voteShareChart"
        );


    if (!canvas) return;


    destroyChart(
        "voteShareChart"
    );


    const result =
        data.results.find(
            r =>
                r.method === "FPTP"
        );


    if (!result) return;


    const labels =
        data.candidates.map(
            c => c.name
        );


    const values =
        data.candidates.map(
            c =>
                Number(
                    result.tally[c.id] || 0
                )
        );


    const colors =
        data.candidates.map(
            (_, index) =>
                getCandidateColor(index)
        );


    charts.voteShareChart =
        new Chart(
            canvas,
            {

                type: "doughnut",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            data: values,

                            backgroundColor:
                                colors,

                            borderColor:
                                "#ffffff",

                            borderWidth: 3,

                            hoverOffset: 12

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    cutout: "58%",

                    plugins: {

                        legend: {

                            position:
                                "bottom",

                            labels: {

                                usePointStyle:
                                    true,

                                padding:
                                    15

                            }

                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        context
                                    ) {

                                        const total =
                                            context.dataset.data.reduce(
                                                (
                                                    a,
                                                    b
                                                ) =>
                                                    a + b,
                                                0
                                            );


                                        const value =
                                            context.raw;


                                        const percentage =
                                            (
                                                value /
                                                total *
                                                100
                                            ).toFixed(
                                                1
                                            );


                                        return `${context.label}: ${value} votes (${percentage}%)`;

                                    }

                            }

                        }

                    }

                }

            }
        );

}


// =====================================================
// BORDA
// =====================================================

function createBordaChart(data) {

    const canvas =
        document.getElementById(
            "bordaChart"
        );


    if (!canvas) return;


    destroyChart(
        "bordaChart"
    );


    const result =
        data.results.find(
            r =>
                r.method === "Borda"
        );


    if (!result) return;


    const labels =
        data.candidates.map(
            c => c.name
        );


    const values =
        data.candidates.map(
            c =>
                Number(
                    result.tally[c.id] || 0
                )
        );


    charts.bordaChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Borda Points",

                            data: values,

                            backgroundColor:
                                data.candidates.map(
                                    (_, i) =>
                                        getCandidateColor(i)
                                ),

                            borderRadius: 8

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true

                        }

                    }

                }

            }
        );

}


// =====================================================
// APPROVAL BAR
// =====================================================

function createApprovalChart(data) {

    const canvas =
        document.getElementById(
            "approvalChart"
        );


    if (!canvas) return;


    destroyChart(
        "approvalChart"
    );


    const result =
        data.results.find(
            r =>
                r.method === "Approval"
        );


    if (!result) return;


    const labels =
        data.candidates.map(
            c => c.name
        );


    const values =
        data.candidates.map(
            c =>
                Number(
                    result.tally[c.id] || 0
                )
        );


    charts.approvalChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Approvals",

                            data: values,

                            backgroundColor:
                                data.candidates.map(
                                    (_, i) =>
                                        getCandidateColor(i)
                                ),

                            borderRadius: 8

                        }

                    ]

                },

                options: {

                    indexAxis: "y",

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        x: {

                            beginAtZero: true

                        }

                    }

                }

            }
        );

}


// =====================================================
// RCV
// =====================================================

function createRCVChart(data) {

    const canvas =
        document.getElementById(
            "rcvChart"
        );


    if (!canvas) return;


    destroyChart(
        "rcvChart"
    );


    const result =
        data.results.find(
            r =>
                r.method === "RCV"
        );


    if (
        !result ||
        !result.rounds.length
    ) {

        return;

    }


    const labels =
        result.rounds.map(
            (_, index) =>
                `Round ${index + 1}`
        );


    const datasets =
        data.candidates.map(
            (candidate, index) => ({

                label:
                    candidate.name,

                data:
                    result.rounds.map(
                        round =>
                            Number(
                                round[
                                    candidate.id
                                ] || 0
                            )
                    ),

                borderColor:
                    getCandidateColor(
                        index
                    ),

                backgroundColor:
                    getCandidateColor(
                        index
                    ),

                borderWidth: 3,

                pointRadius: 5,

                tension: 0.3,

                fill: false

            })
        );


    charts.rcvChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels: labels,

                    datasets: datasets

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        mode: "index",

                        intersect: false

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {

                                stepSize: 1

                            }

                        }

                    }

                }

            }
        );

}


// =====================================================
// METHOD COMPARISON
// =====================================================

function createMethodComparisonChart(data) {

    const canvas =
        document.getElementById(
            "methodComparisonChart"
        );


    if (!canvas) return;


    destroyChart(
        "methodComparisonChart"
    );


    const labels =
        data.candidates.map(
            c => c.name
        );


    const methods = [
        "FPTP",
        "RCV",
        "Approval",
        "Borda"
    ];


    const datasets =
        methods.map(
            (method, index) => {

                const result =
                    data.results.find(
                        r =>
                            r.method ===
                            method
                    );


                if (!result) {

                    return null;

                }


                return {

                    label: method,

                    data:
                        data.candidates.map(
                            candidate =>
                                Number(
                                    result.tally[
                                        candidate.id
                                    ] || 0
                                )
                        ),

                    backgroundColor:
                        getCandidateColor(
                            index
                        ),

                    borderRadius: 6

                };

            }
        ).filter(
            x => x !== null
        );


    charts.methodComparisonChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: datasets

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    scales: {

                        y: {

                            beginAtZero: true

                        }

                    }

                }

            }
        );

}


// =====================================================
// FIRST PREFERENCE
// =====================================================

function createRankingChart(data) {

    const canvas =
        document.getElementById(
            "rankingChart"
        );


    if (!canvas) return;


    destroyChart(
        "rankingChart"
    );


    const result =
        data.results.find(
            r =>
                r.method === "FPTP"
        );


    if (!result) return;


    const labels =
        data.candidates.map(
            c => c.name
        );


    const values =
        data.candidates.map(
            c =>
                Number(
                    result.tally[c.id] || 0
                )
        );


    charts.rankingChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "First Choice Votes",

                            data: values,

                            backgroundColor:
                                data.candidates.map(
                                    (_, i) =>
                                        getCandidateColor(i)
                                ),

                            borderRadius: 8

                        }

                    ]

                },

                options: {

                    indexAxis: "y",

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        x: {

                            beginAtZero: true,

                            ticks: {

                                stepSize: 1

                            }

                        }

                    }

                }

            }
        );

}


// =====================================================
// APPROVAL PIE
// =====================================================

function createApprovalPieChart(data) {

    const canvas =
        document.getElementById(
            "approvalPieChart"
        );


    if (!canvas) return;


    destroyChart(
        "approvalPieChart"
    );


    const result =
        data.results.find(
            r =>
                r.method === "Approval"
        );


    if (!result) return;


    charts.approvalPieChart =
        new Chart(
            canvas,
            {

                type: "pie",

                data: {

                    labels:
                        data.candidates.map(
                            c => c.name
                        ),

                    datasets: [

                        {

                            data:
                                data.candidates.map(
                                    c =>
                                        Number(
                                            result.tally[
                                                c.id
                                            ] || 0
                                        )
                                ),

                            backgroundColor:
                                data.candidates.map(
                                    (_, i) =>
                                        getCandidateColor(i)
                                ),

                            borderColor:
                                "#ffffff",

                            borderWidth: 3

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        }

                    }

                }

            }
        );

}


// =====================================================
// METHOD RESULTS
// =====================================================

function renderRCVRounds(data) {

    const container =
        document.getElementById(
            "rcvRounds"
        );


    const result =
        data.results.find(
            r =>
                r.method === "RCV"
        );


    if (
        !result ||
        !result.rounds.length
    ) {

        container.innerHTML =
            "<p>No RCV rounds.</p>";

        return;

    }


    container.innerHTML = "";


    result.rounds.forEach(
        (round, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "round-card";


            let html = `

                <div class="round-header">

                    <h3>
                        Round ${index + 1}
                    </h3>

                </div>

                <div class="round-votes">

            `;


            Object.entries(
                round
            ).forEach(
                ([id, votes]) => {

                    html += `

                        <div
                            class="round-candidate"
                        >

                            <span>
                                ${candidateName(
                                    data,
                                    id
                                )}
                            </span>

                            <strong>
                                ${votes}
                            </strong>

                        </div>

                    `;

                }
            );


            html += `
                </div>
            `;


            card.innerHTML =
                html;


            container.appendChild(
                card
            );

        }
    );

}


// =====================================================
// CONDORCET
// =====================================================

function renderCondorcet(data) {

    const container =
        document.getElementById(
            "cycleStatus"
        );


    let html = "";


    if (
        data.condorcet !== null &&
        data.condorcet !== undefined
    ) {

        html += `

            <span class="condorcet-badge">

                Condorcet Winner:
                ${candidateName(
                    data,
                    data.condorcet
                )}

            </span>

        `;

    } else {

        html += `

            <span class="warning-badge">

                No Condorcet Winner

            </span>

        `;

    }


    if (data.cycle_detected) {

        html += `

            <span class="warning-badge">

                Preference Cycle Detected

            </span>

        `;

    } else {

        html += `

            <span class="success-badge">

                No Preference Cycle

            </span>

        `;

    }


    container.innerHTML =
        html;

}


// =====================================================
// GRAPH
// =====================================================

function renderGraph(data) {

    const svg =
        document.getElementById(
            "preferenceGraph"
        );


    svg.innerHTML = "";


    const positions = {

        0: {
            x: 450,
            y: 90
        },

        1: {
            x: 700,
            y: 250
        },

        2: {
            x: 450,
            y: 410
        },

        3: {
            x: 200,
            y: 250
        }

    };


    // Arrow marker

    const defs =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "defs"
        );


    const marker =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "marker"
        );


    marker.setAttribute(
        "id",
        "arrow"
    );

    marker.setAttribute(
        "markerWidth",
        "10"
    );

    marker.setAttribute(
        "markerHeight",
        "10"
    );

    marker.setAttribute(
        "refX",
        "8"
    );

    marker.setAttribute(
        "refY",
        "3"
    );

    marker.setAttribute(
        "orient",
        "auto"
    );


    const path =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );


    path.setAttribute(
        "d",
        "M0,0 L0,6 L9,3 z"
    );


    path.setAttribute(
        "fill",
        "#6366f1"
    );


    marker.appendChild(path);

    defs.appendChild(marker);

    svg.appendChild(defs);


    // Edges

    data.graph.edges.forEach(
        edge => {

            const from =
                positions[edge.from];

            const to =
                positions[edge.to];


            if (!from || !to) return;


            const line =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "line"
                );


            line.setAttribute(
                "x1",
                from.x
            );

            line.setAttribute(
                "y1",
                from.y
            );

            line.setAttribute(
                "x2",
                to.x
            );

            line.setAttribute(
                "y2",
                to.y
            );

            line.setAttribute(
                "stroke",
                "#6366f1"
            );

            line.setAttribute(
                "stroke-width",
                "3"
            );

            line.setAttribute(
                "marker-end",
                "url(#arrow)"
            );


            svg.appendChild(
                line
            );


            const text =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "text"
                );


            text.setAttribute(
                "x",
                (from.x + to.x) / 2
            );

            text.setAttribute(
                "y",
                (from.y + to.y) / 2 - 8
            );

            text.setAttribute(
                "text-anchor",
                "middle"
            );

            text.setAttribute(
                "class",
                "graph-weight"
            );


            text.textContent =
                edge.weight;


            svg.appendChild(
                text
            );

        }
    );


    // Nodes

    data.graph.nodes.forEach(
        (node, index) => {

            const pos =
                positions[node.id];


            if (!pos) return;


            const circle =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "circle"
                );


            circle.setAttribute(
                "cx",
                pos.x
            );

            circle.setAttribute(
                "cy",
                pos.y
            );

            circle.setAttribute(
                "r",
                "48"
            );

            circle.setAttribute(
                "fill",
                getCandidateColor(index)
            );


            svg.appendChild(
                circle
            );


            const text =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "text"
                );


            text.setAttribute(
                "x",
                pos.x
            );

            text.setAttribute(
                "y",
                pos.y + 5
            );

            text.setAttribute(
                "text-anchor",
                "middle"
            );

            text.setAttribute(
                "fill",
                "white"
            );

            text.setAttribute(
                "font-weight",
                "bold"
            );


            text.textContent =
                node.name;


            svg.appendChild(
                text
            );

        }
    );

}


// =====================================================
// MATRIX
// =====================================================

function renderMatrix(data) {

    const container =
        document.getElementById(
            "matrixContainer"
        );


    let html =
        `<table class="matrix-table">`;


    html += `
        <tr>
            <th></th>
    `;


    data.candidates.forEach(
        candidate => {

            html += `
                <th>
                    ${candidate.name}
                </th>
            `;

        }
    );


    html += "</tr>";


    data.candidates.forEach(
        row => {

            html += `
                <tr>

                    <th>
                        ${row.name}
                    </th>
            `;


            data.candidates.forEach(
                column => {

                    const value =
                        data.matrix[
                            row.id
                        ][
                            column.id
                        ];


                    html += `
                        <td>
                            ${value}
                        </td>
                    `;

                }
            );


            html += "</tr>";

        }
    );


    html += "</table>";


    container.innerHTML =
        html;

}


// =====================================================
// VOTERS
// =====================================================

function renderVoters(data) {

    const container =
        document.getElementById(
            "votersContainer"
        );


    let html =
        `<div class="voter-grid">`;


    data.voters.forEach(
        voter => {

            const ranking =
                voter.ranking
                    .map(
                        id =>
                            candidateName(
                                data,
                                id
                            )
                    )
                    .join(" → ");


            const approvals =
                voter.approvals
                    .map(
                        id =>
                            candidateName(
                                data,
                                id
                            )
                    )
                    .join(", ");


            html += `

                <div class="voter-card">

                    <div class="voter-number">
                        Voter ${voter.id}
                    </div>

                    <strong>
                        Ranking
                    </strong>

                    <p>
                        ${ranking}
                    </p>

                    <strong>
                        Approvals
                    </strong>

                    <p>
                        ${approvals}
                    </p>

                </div>

            `;

        }
    );


    html += "</div>";


    container.innerHTML =
        html;

}


// =====================================================
// LOAD DATA
// =====================================================

async function loadElection() {

    try {

        const response =
            await fetch(
                "/api/election"
            );


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(
                        () => ({})
                    );


            throw new Error(
                errorData.error ||
                "Failed to load election"
            );

        }


        const data =
            await response.json();
        window.electionData = data;

        console.log(
            "Election data:",
            data
        );


        renderStats(data);

        renderFinalWinner(data);

        renderWinnerCards(data);

        renderRCVRounds(data);

        renderCondorcet(data);

        renderGraph(data);

        renderMatrix(data);

        renderVoters(data);


        createVoteShareChart(data);

        createBordaChart(data);

        createApprovalChart(data);

        createRCVChart(data);

        createMethodComparisonChart(
            data
        );

        createRankingChart(data);

        createApprovalPieChart(
            data
        );


    } catch (error) {

        console.error(
            "Election loading error:",
            error
        );


        const container =
            document.getElementById(
                "finalWinnerCard"
            );


        container.innerHTML = `

            <div class="error-message">

                <strong>
                    Failed to load election data.
                </strong>

                <br><br>

                ${error.message}

                <br><br>

                Check the Flask terminal
                for the detailed error.

            </div>

        `;

    }

}


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    loadElection
);

// =====================================================
// HISTORICAL PATTERN ANALYSIS
// =====================================================

let historicalWinChart = null;

let historicalTimelineChart = null;


// =====================================================
// LOAD HISTORY
// =====================================================

async function loadHistoricalAnalysis() {

    try {

        const response =
            await fetch(
                "/api/history"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load historical election data."
            );

        }


        const data =
            await response.json();


        renderHistoricalSummary(
            data
        );


        renderHistoricalWinChart(
            data
        );


        renderHistoricalTimeline(
            data
        );


        renderHistoricalWinCards(
            data
        );


        renderHistoricalTable(
            data
        );


        renderPatternAnalysis(
            data
        );


    } catch (error) {

        console.error(
            "Historical analysis error:",
            error
        );


        const element =
            document.getElementById(
                "patternAnalysis"
            );


        if (element) {

            element.textContent =
                "Unable to load historical data.";

        }

    }

}


// =====================================================
// HISTORICAL SUMMARY
// =====================================================

function renderHistoricalSummary(
    data
) {

    const leader =
        document.getElementById(
            "historicalLeader"
        );


    const leaderDescription =
        document.getElementById(
            "historicalLeaderDescription"
        );


    const rounds =
        document.getElementById(
            "historicalRounds"
        );


    const latest =
        document.getElementById(
            "latestWinner"
        );


    const streak =
        document.getElementById(
            "currentStreak"
        );


    if (!leader) return;


    leader.textContent =
        data.historical_leaders.join(
            ", "
        );


    const leaderWins =
        data.historical_leaders
            .map(
                name =>
                    `${name}: ${
                        data.win_counts[name]
                    } wins`
            )
            .join(" · ");


    leaderDescription.textContent =
        leaderWins;


    rounds.textContent =
        data.total_rounds;


    const latestRecord =
        data.history[
            data.history.length - 1
        ];


    latest.textContent =
        latestRecord.winner;


    streak.textContent =
        `${data.current_streak} round${
            data.current_streak === 1
                ? ""
                : "s"
        }`;

}


// =====================================================
// HISTORICAL WIN CHART
// =====================================================

function renderHistoricalWinChart(
    data
) {

    const canvas =
        document.getElementById(
            "historicalWinChart"
        );


    if (!canvas) return;


    if (historicalWinChart) {

        historicalWinChart.destroy();

    }


    const labels =
        data.candidates.map(
            candidate =>
                candidate.name
        );


    const values =
        labels.map(
            name =>
                data.win_counts[name] || 0
        );


    historicalWinChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Historical wins",

                            data: values,

                            backgroundColor: [
                                "#ef4444",
                                "#22c55e",
                                "#3b82f6",
                                "#f59e0b"
                            ],

                            borderColor: [
                                "#dc2626",
                                "#16a34a",
                                "#2563eb",
                                "#d97706"
                            ],

                            borderWidth: 1,

                            borderRadius: 7

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {

                                stepSize: 1

                            },

                            title: {

                                display: true,

                                text:
                                    "Number of wins"

                            }

                        },

                        x: {

                            title: {

                                display: true,

                                text:
                                    "Candidate"

                            }

                        }

                    }

                }

            }
        );

}


// =====================================================
// 15-ROUND TIMELINE
// =====================================================

function renderHistoricalTimeline(
    data
) {

    const canvas =
        document.getElementById(
            "historicalTimelineChart"
        );


    if (!canvas) return;


    if (historicalTimelineChart) {

        historicalTimelineChart.destroy();

    }


    const candidateIds =
        data.candidates.map(
            candidate =>
                candidate.id
        );


    const candidateNames =
        data.candidates.map(
            candidate =>
                candidate.name
        );


    const colors = [

        "#ef4444",
        "#22c55e",
        "#3b82f6",
        "#f59e0b"

    ];


    const datasets =
        data.candidates.map(
            (
                candidate,
                index
            ) => {

                return {

                    label:
                        candidate.name,

                    data:
                        data.history.map(
                            record => {

                                return (
                                    record.winner_id ===
                                    candidate.id
                                )
                                    ? 1
                                    : 0;

                            }
                        ),

                    borderColor:
                        colors[index],

                    backgroundColor:
                        colors[index],

                    pointBackgroundColor:
                        colors[index],

                    pointBorderColor:
                        colors[index],

                    pointRadius: 6,

                    pointHoverRadius: 8,

                    tension: 0.2

                };

            }
        );


    historicalTimelineChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels:
                        data.history.map(
                            record =>
                                record.year
                        ),

                    datasets:
                        datasets

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        mode: "index",

                        intersect: false

                    },

                    plugins: {

                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        context
                                    ) {

                                        if (
                                            context.raw ===
                                            1
                                        ) {

                                            return (
                                                context.dataset
                                                    .label +
                                                " — Winner"
                                            );

                                        }


                                        return null;

                                    }

                            }

                        }

                    },

                    scales: {

                        y: {

                            min: 0,

                            max: 1,

                            ticks: {

                                stepSize: 1,

                                callback:
                                    function(
                                        value
                                    ) {

                                        return value ===
                                            1
                                            ? "Winner"
                                            : "";

                                    }

                            }

                        },

                        x: {

                            title: {

                                display: true,

                                text:
                                    "Year"

                            }

                        }

                    }

                }

            }
        );

}


// =====================================================
// WIN COUNT CARDS
// =====================================================

function renderHistoricalWinCards(
    data
) {

    const container =
        document.getElementById(
            "historicalWinCards"
        );


    if (!container) return;


    const colors = [

        "#ef4444",
        "#22c55e",
        "#3b82f6",
        "#f59e0b"

    ];


    container.innerHTML = "";


    data.candidates.forEach(
        (
            candidate,
            index
        ) => {

            const name =
                candidate.name;


            const wins =
                data.win_counts[name] ||
                0;


            const percentage =
                data.win_percentages[name] ||
                0;


            const recentWins =
                data.recent_win_counts[name] ||
                0;


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "historical-win-card";


            card.innerHTML = `

                <div
                    class="historical-color"
                    style="
                        background:
                        ${colors[index]};
                    "
                ></div>


                <div>

                    <span>
                        ${name}
                    </span>

                    <strong>
                        ${wins}
                    </strong>

                    <small>
                        ${percentage}%
                        of historical wins
                    </small>

                    <small>
                        ${recentWins}
                        wins in last 5 rounds
                    </small>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}


// =====================================================
// HISTORY TABLE
// =====================================================

function renderHistoricalTable(
    data
) {

    const body =
        document.getElementById(
            "historicalTableBody"
        );


    if (!body) return;


    body.innerHTML = "";


    data.history.forEach(
        record => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${record.year}
                </td>

                <td>
                    <strong>
                        ${record.winner}
                    </strong>
                </td>

                <td>
                    <span class="history-method">
                        ${record.method}
                    </span>
                </td>

            `;


            body.appendChild(
                row
            );

        }
    );

}


// =====================================================
// PATTERN ANALYSIS
// =====================================================

function renderPatternAnalysis(
    data
) {

    const container =
        document.getElementById(
            "patternAnalysis"
        );


    if (!container) return;


    const sortedCandidates =
        data.candidates
            .map(
                candidate => {

                    const name =
                        candidate.name;


                    return {

                        name: name,

                        wins:
                            data.win_counts[
                                name
                            ] || 0,

                        recent:
                            data.recent_win_counts[
                                name
                            ] || 0

                    };

                }
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.wins -
                    a.wins
            );


    const leader =
        sortedCandidates[0];


    const second =
        sortedCandidates[1];


    const difference =
        leader.wins -
        second.wins;


    container.innerHTML = `

        <div class="pattern-item">

            <strong>
                01
            </strong>

            <div>

                <h4>
                    Most frequent historical winner
                </h4>

                <p>
                    ${leader.name} has won
                    ${leader.wins}
                    of the
                    ${data.total_rounds}
                    recorded rounds.
                </p>

            </div>

        </div>


        <div class="pattern-item">

            <strong>
                02
            </strong>

            <div>

                <h4>
                    Historical win share
                </h4>

                <p>
                    ${leader.name}
                    accounts for
                    ${data.win_percentages[
                        leader.name
                    ]}%
                    of all recorded wins.
                </p>

            </div>

        </div>


        <div class="pattern-item">

            <strong>
                03
            </strong>

            <div>

                <h4>
                    Recent performance
                </h4>

                <p>
                    ${leader.name}
                    has won
                    ${leader.recent}
                    of the last 5 rounds.
                </p>

            </div>

        </div>


        <div class="pattern-item">

            <strong>
                04
            </strong>

            <div>

                <h4>
                    Difference from second place
                </h4>

                <p>
                    The historical leader is ahead
                    of ${second.name}
                    by
                    ${difference}
                    win(s).
                </p>

            </div>

        </div>


        <div class="pattern-item">

            <strong>
                05
            </strong>

            <div>

                <h4>
                    Current winning streak
                </h4>

                <p>
                    ${data.current_streak_candidate}
                    has won the last
                    ${data.current_streak}
                    consecutive round(s).
                </p>

            </div>

        </div>


        <div class="pattern-item">

            <strong>
                06
            </strong>

            <div>

                <h4>
                    Interpretation
                </h4>

                <p>
                    The dataset shows recurring historical
                    patterns in candidate victories.
                    These observations describe the past
                    data only and are not treated as a
                    prediction of an actual upcoming election.
                </p>

            </div>

        </div>

    `;

}


// =====================================================
// START HISTORICAL ANALYSIS
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadHistoricalAnalysis();

    }
);



/* =====================================================
   INTERACTIVE ELECTION SIMULATOR
   Added separately — existing code remains unchanged
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
    const countInput = document.getElementById("simVoterCount");
    const generateBtn = document.getElementById("generateVotersBtn");
    const sampleBtn = document.getElementById("sampleVotersBtn");
    const runBtn = document.getElementById("runSimulatorBtn");
    const votersContainer = document.getElementById("simulatorVoters");
    const status = document.getElementById("simulatorStatus");

    // The simulator HTML must exist on the page.
    if (!countInput || !generateBtn || !sampleBtn ||
        !runBtn || !votersContainer || !status) {
        return;
    }

    function setStatus(message, isError = false) {
        status.textContent = message;
        status.style.color = isError ? "#dc2626" : "#15803d";
    }

    function getCandidates() {
        if (!window.electionData ||
            !Array.isArray(window.electionData.candidates)) {
            throw new Error("Election data has not loaded yet. Refresh the page.");
        }

        return window.electionData.candidates;
    }

    function generateVoterForms(useSample = false) {
        let candidates;

        try {
            candidates = getCandidates();
        } catch (error) {
            setStatus(error.message, true);
            return;
        }

        const count = Number(countInput.value);

        if (!Number.isInteger(count) || count < 1 || count > 100) {
            setStatus("Enter a voter count between 1 and 100.", true);
            return;
        }

        if (candidates.length < 2) {
            setStatus("At least two candidates are required.", true);
            return;
        }

        votersContainer.innerHTML = "";

        for (let voterIndex = 0; voterIndex < count; voterIndex++) {
            const card = document.createElement("div");
            card.className = "sim-voter-card";

            const heading = document.createElement("h3");
            heading.textContent = `Voter ${voterIndex + 1}`;
            card.appendChild(heading);

            const rankingHeading = document.createElement("p");
            rankingHeading.textContent =
                "Rank every candidate (1 = highest preference):";
            card.appendChild(rankingHeading);

            const rankingContainer = document.createElement("div");
            rankingContainer.className = "sim-ranking-options";

            let rankingOrder = candidates.map(candidate => candidate.id);

            if (useSample) {
                rankingOrder.sort(() => Math.random() - 0.5);
            }

            candidates.forEach(candidate => {
                const row = document.createElement("label");
                row.className = "sim-ranking-row";

                const name = document.createElement("span");
                name.textContent = candidate.name;

                const select = document.createElement("select");
                select.className = "sim-ranking-select";
                select.dataset.candidateId = candidate.id;
                select.setAttribute(
                    "aria-label",
                    `Rank for ${candidate.name}, voter ${voterIndex + 1}`
                );

                for (let rank = 1; rank <= candidates.length; rank++) {
                    const option = document.createElement("option");
                    option.value = rank;
                    option.textContent = `Rank ${rank}`;
                    select.appendChild(option);
                }

                const candidatePosition = rankingOrder.indexOf(candidate.id);
                select.value = candidatePosition + 1;

                row.appendChild(name);
                row.appendChild(select);
                rankingContainer.appendChild(row);
            });

            card.appendChild(rankingContainer);

            const approvalHeading = document.createElement("p");
            approvalHeading.textContent = "Approve any candidates:";
            card.appendChild(approvalHeading);

            const approvalContainer = document.createElement("div");
            approvalContainer.className = "sim-approvals";

            candidates.forEach((candidate, candidateIndex) => {
                const label = document.createElement("label");
                label.className = "sim-approval-option";

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.className = "sim-approval-checkbox";
                checkbox.dataset.candidateId = candidate.id;

                if (useSample) {
                    checkbox.checked = Math.random() < 0.5;
                } else {
                    checkbox.checked = candidateIndex === 0;
                }

                const name = document.createElement("span");
                name.textContent = candidate.name;

                label.appendChild(checkbox);
                label.appendChild(name);
                approvalContainer.appendChild(label);
            });

            card.appendChild(approvalContainer);
            votersContainer.appendChild(card);
        }

        setStatus(`${count} voter ballot(s) generated. Edit preferences below.`);
    }

    // Keep rank dropdowns unique within each voter's ballot.
    votersContainer.addEventListener("change", function (event) {
        if (!event.target.matches(".sim-ranking-select")) {
            return;
        }

        const card = event.target.closest(".sim-voter-card");
        const selects = [...card.querySelectorAll(".sim-ranking-select")];
        const selectedRanks = selects.map(select => select.value);

        if (new Set(selectedRanks).size !== selectedRanks.length) {
            setStatus(
                "Each candidate must have a different rank on every ballot.",
                true
            );
        } else {
            setStatus("Preferences updated.");
        }
    });

    generateBtn.addEventListener("click", function () {
        generateVoterForms(false);
    });

    sampleBtn.addEventListener("click", function () {
        generateVoterForms(true);
    });

    runBtn.addEventListener("click", async function () {
        let candidates;

        try {
            candidates = getCandidates();
        } catch (error) {
            setStatus(error.message, true);
            return;
        }

        const cards = [...votersContainer.querySelectorAll(".sim-voter-card")];

        if (cards.length === 0) {
            setStatus("Generate voter forms before running the election.", true);
            return;
        }

        const voters = [];

        for (let index = 0; index < cards.length; index++) {
            const card = cards[index];
            const selects = [...card.querySelectorAll(".sim-ranking-select")];
            const ranks = selects.map(select => Number(select.value));

            if (new Set(ranks).size !== candidates.length) {
                setStatus(
                    `Voter ${index + 1}: assign a unique rank to every candidate.`,
                    true
                );
                return;
            }

            const rankedCandidates = selects
                .map(select => ({
                    id: Number(select.dataset.candidateId),
                    rank: Number(select.value)
                }))
                .sort((a, b) => a.rank - b.rank)
                .map(item => item.id);

            const approvals = [
                ...card.querySelectorAll(".sim-approval-checkbox:checked")
            ].map(checkbox => Number(checkbox.dataset.candidateId));

            voters.push({
                id: index + 1,
                ranking: rankedCandidates,
                approvals: approvals
            });
        }

        const payload = {
            candidates: candidates.map(candidate => ({
                id: candidate.id,
                name: candidate.name
            })),
            voters: voters
        };

        runBtn.disabled = true;
        setStatus("Calculating election results...");

        try {
            const response = await fetch("/api/election", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "The election could not be calculated.");
            }

            // Update the data used by the existing dashboard.
            window.electionData = data;

            renderStats(data);
            renderFinalWinner(data);
            renderWinnerCards(data);
            renderRCVRounds(data);
            renderCondorcet(data);
            renderGraph(data);
            renderMatrix(data);
            renderVoters(data);

            createVoteShareChart(data);
            createBordaChart(data);
            createApprovalChart(data);
            createRCVChart(data);
            createMethodComparisonChart(data);
            createRankingChart(data);
            createApprovalPieChart(data);

            setStatus("Election calculated successfully. Results and charts updated.");

// Refresh historical analysis using the newly saved election run.
await loadHistoricalAnalysis();

        } catch (error) {
            console.error("Simulator error:", error);
            setStatus(error.message, true);
        } finally {
            runBtn.disabled = false;
        }
    });

    // Create the default five editable ballots once election data is ready.
    if (window.electionData) {
        generateVoterForms(false);
    } else {
        window.addEventListener("load", function () {
            if (window.electionData) {
                generateVoterForms(false);
            } else {
                setStatus("Election data is unavailable. Refresh the page.", true);
            }
        }, { once: true });
    }
});
