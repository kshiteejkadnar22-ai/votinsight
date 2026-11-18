def build_preference_graph(
    candidates,
    voters
):

    candidate_ids = [
        candidate.id
        for candidate in candidates
    ]


    graph = {
        candidate_id: {}
        for candidate_id in candidate_ids
    }


    # Compare every pair of candidates
    for i in range(
        len(candidate_ids)
    ):

        for j in range(
            i + 1,
            len(candidate_ids)
        ):

            a = candidate_ids[i]

            b = candidate_ids[j]


            a_count = 0

            b_count = 0


            for voter in voters:

                ranking = voter.ranking


                if (
                    a not in ranking
                    or
                    b not in ranking
                ):

                    continue


                a_position = ranking.index(a)

                b_position = ranking.index(b)


                if a_position < b_position:

                    a_count += 1

                elif b_position < a_position:

                    b_count += 1


            # Add edge toward pairwise winner
            if a_count > b_count:

                graph[a][b] = a_count

            elif b_count > a_count:

                graph[b][a] = b_count


    return graph


def graph_to_edges(graph):

    edges = []


    for source, destinations in graph.items():

        for target, weight in destinations.items():

            edges.append({

                "from": source,

                "to": target,

                "weight": weight

            })


    return edges


def build_preference_matrix(
    candidates,
    voters
):

    candidate_ids = [
        candidate.id
        for candidate in candidates
    ]


    matrix = {

        candidate_id: {
            other_id: 0
            for other_id in candidate_ids
        }

        for candidate_id in candidate_ids

    }


    for a in candidate_ids:

        for b in candidate_ids:

            if a == b:
                continue


            for voter in voters:

                ranking = voter.ranking


                if (
                    a in ranking
                    and
                    b in ranking
                ):

                    if ranking.index(a) < ranking.index(b):

                        matrix[a][b] += 1


    return matrix