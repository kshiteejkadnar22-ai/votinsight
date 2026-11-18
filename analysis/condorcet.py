def find_condorcet_winner(
    candidates,
    voters
):

    candidate_ids = [
        candidate.id
        for candidate in candidates
    ]


    for candidate_id in candidate_ids:

        is_condorcet = True


        for opponent_id in candidate_ids:

            if candidate_id == opponent_id:
                continue


            candidate_votes = 0

            opponent_votes = 0


            for voter in voters:

                ranking = voter.ranking


                if (
                    candidate_id not in ranking
                    or
                    opponent_id not in ranking
                ):

                    continue


                candidate_position = (
                    ranking.index(candidate_id)
                )

                opponent_position = (
                    ranking.index(opponent_id)
                )


                if candidate_position < opponent_position:

                    candidate_votes += 1

                else:

                    opponent_votes += 1


            # Must beat every opponent
            if candidate_votes <= opponent_votes:

                is_condorcet = False

                break


        if is_condorcet:

            return candidate_id


    return None