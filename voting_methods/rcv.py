from models import ElectionResult


def run_rcv(candidates, voters):

    active_candidates = {
        candidate.id
        for candidate in candidates
    }


    rounds = []


    total_voters = len(voters)


    while len(active_candidates) > 1:

        tally = {
            candidate_id: 0
            for candidate_id in active_candidates
        }


        # -----------------------------------------
        # Count highest-ranked active candidate
        # -----------------------------------------

        for voter in voters:

            for candidate_id in voter.ranking:

                if candidate_id in active_candidates:

                    tally[candidate_id] += 1

                    break


        # Save this round
        rounds.append(
            dict(tally)
        )


        # -----------------------------------------
        # Check majority
        # -----------------------------------------

        for candidate_id, votes in tally.items():

            if votes > total_voters / 2:

                return ElectionResult(

                    method="RCV",

                    winners=[
                        candidate_id
                    ],

                    tally=tally,

                    rounds=rounds

                )


        # -----------------------------------------
        # Find lowest candidate
        # -----------------------------------------

        minimum_votes = min(
            tally.values()
        )


        lowest_candidates = [

            candidate_id

            for candidate_id, votes
            in tally.items()

            if votes == minimum_votes

        ]


        # Deterministic tie-break
        eliminated = min(
            lowest_candidates
        )


        active_candidates.remove(
            eliminated
        )


    # -----------------------------------------
    # One candidate remains
    # -----------------------------------------

    winner = next(
        iter(active_candidates)
    )


    final_tally = {
        candidate_id: 0
        for candidate_id in active_candidates
    }


    for voter in voters:

        for candidate_id in voter.ranking:

            if candidate_id in active_candidates:

                final_tally[
                    candidate_id
                ] += 1

                break


    rounds.append(
        dict(final_tally)
    )


    return ElectionResult(

        method="RCV",

        winners=[winner],

        tally=final_tally,

        rounds=rounds

    )