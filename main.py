from flask import (
    Flask,
    render_template,
    jsonify,
    request
)

import os
import json
from datetime import datetime, timezone

from input_module import (
    load_election,
    load_election_from_dict
)

from voting_methods.fptp import run_fptp
from voting_methods.rcv import run_rcv
from voting_methods.approval import run_approval
from voting_methods.borda import run_borda

from analysis.preference_graph import (
    build_preference_graph,
    graph_to_edges,
    build_preference_matrix
)

from analysis.condorcet import (
    find_condorcet_winner
)

from analysis.cycle_detection import (
    has_cycle
)

from visualization.charts import (
    serialize_result
)


app = Flask(__name__)


# =====================================================
# PERSISTENT SIMULATOR HISTORY
# =====================================================

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
RUNS_PATH = os.path.join(DATA_DIR, "election_runs.json")

def read_saved_runs():
    """Return all saved simulator runs, or an empty list on first use."""
    if not os.path.exists(RUNS_PATH):
        return []
    try:
        with open(RUNS_PATH, "r", encoding="utf-8") as file:
            data = json.load(file)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        app.logger.exception("Could not read saved election runs")
        raise

def save_simulator_run(payload, result):
    """Append one completed simulator run without overwriting prior runs."""
    os.makedirs(DATA_DIR, exist_ok=True)
    runs = read_saved_runs()
    run_id = (runs[-1].get("run_id", 0) + 1) if runs else 1
    winner_ids = (result.get("final_winner") or {}).get("winner_ids", [])
    candidate_names = {str(c["id"]): c["name"] for c in result.get("candidates", [])}
    record = {
        "run_id": run_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "candidates": payload.get("candidates", []),
        "voters": payload.get("voters", []),
        "results": result.get("results", []),
        "final_winner": result.get("final_winner", {}),
        "winner_ids": winner_ids,
        "winners": [candidate_names.get(str(cid), f"Candidate {cid}") for cid in winner_ids],
        "condorcet": result.get("condorcet"),
        "cycle_detected": result.get("cycle_detected")
    }
    runs.append(record)
    temp_path = RUNS_PATH + ".tmp"
    with open(temp_path, "w", encoding="utf-8") as file:
        json.dump(runs, file, indent=2, ensure_ascii=False)
    os.replace(temp_path, RUNS_PATH)
    return run_id



# =====================================================
# FINAL WINNER
# =====================================================

def calculate_final_winner(
    results,
    candidates
):

    method_wins = {

        candidate.id: 0

        for candidate in candidates

    }


    for result in results:

        for winner in result["winners"]:

            if winner in method_wins:

                method_wins[winner] += 1


    maximum_wins = max(
        method_wins.values()
    )


    final_winner_ids = [

        candidate_id

        for candidate_id, wins
        in method_wins.items()

        if wins == maximum_wins

    ]


    return {

        "winner_ids":
            final_winner_ids,

        "method_wins":
            method_wins,

        "total_methods":
            len(results)

    }


# =====================================================
# RUN ELECTION
# =====================================================

def run_election(election):

    candidates = election[
        "candidates"
    ]

    voters = election[
        "voters"
    ]


    # -------------------------------------------------
    # Voting methods
    # -------------------------------------------------

    fptp_result = run_fptp(
        candidates,
        voters
    )


    rcv_result = run_rcv(
        candidates,
        voters
    )


    approval_result = run_approval(
        candidates,
        voters
    )


    borda_result = run_borda(
        candidates,
        voters
    )


    results = [

        serialize_result(
            fptp_result
        ),

        serialize_result(
            rcv_result
        ),

        serialize_result(
            approval_result
        ),

        serialize_result(
            borda_result
        )

    ]


    # -------------------------------------------------
    # Preference graph
    # -------------------------------------------------

    graph = build_preference_graph(
        candidates,
        voters
    )


    graph_edges = graph_to_edges(
        graph
    )


    graph_nodes = [

        {
            "id": candidate.id,
            "name": candidate.name
        }

        for candidate in candidates

    ]


    # -------------------------------------------------
    # Condorcet
    # -------------------------------------------------

    condorcet = find_condorcet_winner(
        candidates,
        voters
    )


    # -------------------------------------------------
    # Cycle
    # -------------------------------------------------

    cycle_detected = has_cycle(
        graph
    )


    # -------------------------------------------------
    # Matrix
    # -------------------------------------------------

    matrix = build_preference_matrix(
        candidates,
        voters
    )


    # -------------------------------------------------
    # Final winner
    # -------------------------------------------------

    final_winner = calculate_final_winner(
        results,
        candidates
    )


    # -------------------------------------------------
    # Convert voter objects to JSON
    # -------------------------------------------------

    voter_data = [

        {
            "id": voter.id,

            "ranking": voter.ranking,

            "approvals":
                sorted(
                    list(
                        voter.approvals
                    )
                )

        }

        for voter in voters

    ]


    # -------------------------------------------------
    # Return API data
    # -------------------------------------------------

    return {

        "candidates": [

            {
                "id": candidate.id,
                "name": candidate.name
            }

            for candidate in candidates

        ],

        "voters":
            voter_data,

        "voter_count":
            len(voters),

        "results":
            results,

        "final_winner":
            final_winner,

        "graph": {

            "nodes":
                graph_nodes,

            "edges":
                graph_edges

        },

        "condorcet":
            condorcet,

        "cycle_detected":
            cycle_detected,

        "matrix":
            matrix

    }


# =====================================================
# HOME PAGE
# =====================================================

@app.route("/")
def index():

    return render_template(
        "index.html"
    )


# =====================================================
# GET ELECTION
# =====================================================

@app.route(
    "/api/election",
    methods=["GET"]
)
def get_election():

    try:

        election = load_election(
            "data/election.json"
        )


        result = run_election(
            election
        )


        return jsonify(
            result
        )


    except Exception as error:

        import traceback

        print(
            "\n========== ERROR =========="
        )

        traceback.print_exc()

        print(
            "===========================\n"
        )


        return jsonify({

            "error":
                str(error)

        }), 500


# =====================================================
# POST CUSTOM ELECTION
# =====================================================

@app.route(
    "/api/election",
    methods=["POST"]
)
def custom_election():

    try:

        data = request.get_json()


        election = (
            load_election_from_dict(
                data
            )
        )


        result = run_election(
            election
        )

        run_id = save_simulator_run(data, result)
        result["saved_run_id"] = run_id
        result["saved_at"] = datetime.now(timezone.utc).isoformat()

        return jsonify(
            result
        )


    except Exception as error:

        import traceback

        traceback.print_exc()


        return jsonify({

            "error":
                str(error)

        }), 400


# =====================================================
# HISTORICAL ANALYSIS FROM ACTUAL SIMULATOR RUNS
# =====================================================

@app.route("/api/history", methods=["GET"])
def election_history():
    try:
        runs = read_saved_runs()

        # Candidate names/IDs from the latest saved run. If no simulator
        # election has been run yet, use the default election only for labels.
        if runs:
            candidates = runs[-1].get("candidates", [])
        else:
            try:
                default_election = load_election(os.path.join(DATA_DIR, "election.json"))
                candidates = [
                    {"id": c.id, "name": c.name}
                    for c in default_election["candidates"]
                ]
            except Exception:
                candidates = []

        candidate_names = {str(c["id"]): c["name"] for c in candidates}
        win_counts = {c["name"]: 0 for c in candidates}
        formatted_history = []

        for record in runs:
            # Use the winner IDs stored with the actual calculated result.
            winner_ids = record.get("winner_ids") or (record.get("final_winner") or {}).get("winner_ids", [])
            names_by_id = {str(c["id"]): c["name"] for c in record.get("candidates", [])}
            winners = [names_by_id.get(str(cid), candidate_names.get(str(cid), f"Candidate {cid}")) for cid in winner_ids]
            for winner in winners:
                win_counts.setdefault(winner, 0)
                win_counts[winner] += 1
            timestamp = record.get("timestamp", "")
            formatted_history.append({
                "year": f"Run #{record.get('run_id', len(formatted_history) + 1)}",
                "timestamp": timestamp,
                "winner_id": winner_ids[0] if len(winner_ids) == 1 else None,
                "winner_ids": winner_ids,
                "winner": ", ".join(winners) if winners else "No winner",
                "method": "Final winner (4-method comparison)",
                "run_id": record.get("run_id"),
                "voter_count": len(record.get("voters", [])),
                "results": record.get("results", [])
            })

        total_rounds = len(formatted_history)
        recent_history = formatted_history[-5:]
        recent_win_counts = {name: 0 for name in win_counts}
        for record in recent_history:
            for winner in record["winner"].split(", ") if record["winner"] != "No winner" else []:
                recent_win_counts[winner] = recent_win_counts.get(winner, 0) + 1

        max_wins = max(win_counts.values(), default=0)
        historical_leaders = [name for name, wins in win_counts.items() if max_wins > 0 and wins == max_wins]
        win_percentages = {
            name: round((wins / total_rounds) * 100, 2) if total_rounds else 0
            for name, wins in win_counts.items()
        }

        current_streak_candidate = None
        current_streak = 0
        for record in reversed(formatted_history):
            winners = record["winner"].split(", ") if record["winner"] != "No winner" else []
            if len(winners) != 1:
                break
            if current_streak_candidate is None:
                current_streak_candidate = winners[0]
                current_streak = 1
            elif winners[0] == current_streak_candidate:
                current_streak += 1
            else:
                break

        return jsonify({
            "candidates": candidates,
            "history": formatted_history,
            "total_rounds": total_rounds,
            "win_counts": win_counts,
            "win_percentages": win_percentages,
            "recent_win_counts": recent_win_counts,
            "historical_leaders": historical_leaders,
            "current_streak_candidate": current_streak_candidate or "—",
            "current_streak": current_streak,
            "analysis_type": "Analysis of saved simulator elections",
            "note": "Every record comes from an election actually run in the simulator. Historical patterns are descriptive, not a guaranteed prediction."
        })
    except Exception as error:
        app.logger.exception("Historical analysis error")
        return jsonify({"error": str(error)}), 500

# =====================================================
# START FLASK
# =====================================================

if __name__ == "__main__":

    app.run(

        host="127.0.0.1",

        port=5004,

        debug=True

    )