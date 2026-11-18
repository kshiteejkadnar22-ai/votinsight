from models import ElectionResult


def run_fptp(candidates, voters):

    tally = {
        candidate.id: 0
        for candidate in candidates
    }


    # Count first preference
    for voter in voters:

        if not voter.ranking:
            continue

        first_choice = voter.ranking[0]

        if first_choice in tally:

            tally[first_choice] += 1


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

        method="FPTP",

        winners=winners,

        tally=tally

    )