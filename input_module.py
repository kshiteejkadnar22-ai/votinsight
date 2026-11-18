import json

from models import Candidate, Voter


def validate_election(candidates, voters):

    candidate_ids = {
        candidate.id
        for candidate in candidates
    }

    if len(candidate_ids) != len(candidates):
        raise ValueError(
            "Candidate IDs must be unique."
        )

    for voter in voters:

        # Check ranking IDs
        for candidate_id in voter.ranking:

            if candidate_id not in candidate_ids:

                raise ValueError(
                    f"Voter {voter.id} contains "
                    f"invalid candidate ID {candidate_id}."
                )

        # Check duplicate rankings
        if len(voter.ranking) != len(
            set(voter.ranking)
        ):

            raise ValueError(
                f"Voter {voter.id} has duplicate "
                "candidate IDs in ranking."
            )

        # Check approval IDs
        for candidate_id in voter.approvals:

            if candidate_id not in candidate_ids:

                raise ValueError(
                    f"Voter {voter.id} contains "
                    f"invalid approval ID {candidate_id}."
                )


def load_election_from_dict(data):

    candidates = [
        Candidate(
            id=int(candidate["id"]),
            name=candidate["name"]
        )

        for candidate in data["candidates"]
    ]


    voters = [

        Voter(
            id=int(voter["id"]),

            ranking=[
                int(x)
                for x in voter["ranking"]
            ],

            approvals={
                int(x)
                for x in voter.get(
                    "approvals",
                    []
                )
            }
        )

        for voter in data["voters"]
    ]


    validate_election(
        candidates,
        voters
    )


    return {
        "candidates": candidates,
        "voters": voters
    }


def load_election(filepath):

    with open(
        filepath,
        "r",
        encoding="utf-8"
    ) as file:

        data = json.load(file)


    return load_election_from_dict(data)