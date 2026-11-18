def serialize_result(result):

    return {

        "method": result.method,

        "winners": result.winners,

        "tally": result.tally,

        "rounds":
            result.rounds
            if result.rounds
            else []

    }
