from models import ElectionResult


def run_approval(candidates, voters):

    tally = {
        candidate.id: 0
        for candidate in candidates
    }


    # Count approvals
    for voter in voters:

        for candidate_id in voter.approvals:

            if candidate_id in tally:

                tally[candidate_id] += 1


    highest_votes = max(
        tally.values()
    )


    winners = [

        candidate_id

        for candidate_id, votes
        in tally.items()

        if votes == highest_votes

    ]


    return ElectionResult(

        method="Approval",

        winners=winners,

        tally=tally

    )
