from dataclasses import dataclass
from typing import List, Dict, Set, Optional


@dataclass
class Candidate:
    id: int
    name: str


@dataclass
class Voter:
    id: int
    ranking: List[int]
    approvals: Set[int]


@dataclass
class ElectionResult:
    method: str
    winners: List[int]
    tally: Dict[int, int]
    rounds: Optional[List[Dict[int, int]]] = None