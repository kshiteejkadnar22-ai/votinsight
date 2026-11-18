from models import ElectionResult


def run_borda(candidates, voters):

    candidate_count = len(candidates)


    tally = {
        candidate.id: 0
        for candidate in candidates
    }


    # C candidates:
    #
    # 1st = C - 1
    # 2nd = C - 2
    # 3rd = C - 3
    # Last = 0

    for voter in voters:

        for position, candidate_id in enumerate(
            voter.ranking
        ):

            points = (
                candidate_count
                - position
                - 1
            )


            if candidate_id in tally:

                tally[candidate_id] += points


    highest_score = max(
        tally.values()
    )


    winners = [

        candidate_id

        for candidate_id, score
        in tally.items()

        if score == highest_score

    ]


    return ElectionResult(

        method="Borda",

        winners=winners,

        tally=tally

    )